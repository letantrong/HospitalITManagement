import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Helper kiểm tra quyền Admin
const assertAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Yêu cầu xác thực tài khoản.');
  }
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();
  if (!callerData || callerData.role !== 'Admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này.'
    );
  }
  return { callerUid, callerData };
};

/**
 * 1. Cloud Function: Thiết lập Vai trò và Phân quyền Phòng ban (Custom Claims)
 */
export const setUserClaims = functions.https.onCall(async (data, context) => {
  const { callerUid, callerData } = await assertAdmin(context);
  const { targetUserId, role, departmentIds } = data;

  if (!targetUserId || !role || !['Admin', 'EquipmentManager'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Thông tin vai trò không hợp lệ.');
  }

  await admin.auth().setCustomUserClaims(targetUserId, {
    role,
    departmentIds: role === 'EquipmentManager' ? (departmentIds || []) : [],
  });

  await db.collection('users').doc(targetUserId).update({
    role,
    departmentIds: role === 'EquipmentManager' ? (departmentIds || []) : [],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('activityLogs').add({
    userId: callerUid,
    userEmail: callerData.email || '',
    userName: callerData.displayName || 'Admin',
    userRole: 'Admin',
    action: 'UPDATE_DEVICE',
    module: 'USER',
    targetId: targetUserId,
    description: `Cập nhật vai trò người dùng thành ${role}`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Phân quyền người dùng thành công.' };
});

/**
 * 2. Cloud Function: Khởi tạo Snapshot Đợt Kiểm kê
 */
export const createInventorySnapshot = functions.firestore
  .document('inventorySessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const sessionData = snap.data();
    const sessionId = context.params.sessionId;
    if (!sessionData) return;

    try {
      let devicesQuery: admin.firestore.Query = db.collection('devices');
      if (
        sessionData.scope === 'DepartmentSpecific' &&
        Array.isArray(sessionData.targetDepartmentIds) &&
        sessionData.targetDepartmentIds.length > 0
      ) {
        devicesQuery = devicesQuery.where(
          'departmentId',
          'in',
          sessionData.targetDepartmentIds.slice(0, 10)
        );
      }

      const devicesSnapshot = await devicesQuery.get();
      const batchSize = 400;
      let batch = db.batch();
      let count = 0;

      for (const deviceDoc of devicesSnapshot.docs) {
        const device = deviceDoc.data();
        const itemRef = db.collection('inventoryItems').doc();

        batch.set(itemRef, {
          id: itemRef.id,
          sessionId,
          deviceId: deviceDoc.id,
          deviceCode: device.deviceCode,
          deviceName: device.name,
          expectedDepartmentId: device.departmentId,
          expectedDepartmentName: device.departmentName || '',
          expectedLocationId: device.locationId || '',
          expectedLocationName: device.locationName || '',
          expectedStatus: device.status || 'InUse',
          isScanned: false,
          resultStatus: 'Pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        count++;
        if (count % batchSize === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }

      if (count % batchSize !== 0) {
        await batch.commit();
      }

      await snap.ref.update({
        'summary.totalExpected': count,
        'summary.totalMissing': count,
      });
    } catch (error) {
      console.error('Lỗi khi tạo inventory snapshot:', error);
    }
  });

/**
 * 3. Cloud Function: Phê duyệt Điều chuyển Thiết bị (Atomic Transaction)
 */
export const approveDeviceTransfer = functions.https.onCall(async (data, context) => {
  const { callerUid, callerData } = await assertAdmin(context);
  const { transferId, action } = data; // action: 'APPROVED' | 'REJECTED'

  const transferRef = db.collection('transferRecords').doc(transferId);

  return db.runTransaction(async (transaction) => {
    const transferDoc = await transaction.get(transferRef);
    if (!transferDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Không tìm thấy phiếu điều chuyển.');
    }

    const transfer = transferDoc.data()!;
    if (transfer.status !== 'PendingApproval') {
      throw new functions.https.HttpsError('failed-precondition', 'Phiếu điều chuyển đã được xử lý.');
    }

    if (action === 'REJECTED') {
      transaction.update(transferRef, {
        status: 'Rejected',
        approvedBy: callerUid,
        approvedByName: callerData.displayName || 'Admin',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, message: 'Đã từ chối phiếu điều chuyển.' };
    }

    const deviceRef = db.collection('devices').doc(transfer.deviceId);
    transaction.update(deviceRef, {
      departmentId: transfer.toDepartmentId,
      departmentName: transfer.toDepartmentName,
      locationId: transfer.toLocationId,
      locationName: transfer.toLocationName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(transferRef, {
      status: 'Completed',
      approvedBy: callerUid,
      approvedByName: callerData.displayName || 'Admin',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      transferDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Đã hoàn tất điều chuyển thiết bị.' };
  });
});

// ============================================================================
// CÁC CLOUD FUNCTIONS DÀNH CHO MODULE IP ADDRESS MANAGEMENT (IPAM)
// ============================================================================

/**
 * 4. Cloud Function: Cấp phát IP Tĩnh cho Thiết bị (assignStaticIp)
 * Thực hiện Firestore Atomic Transaction đảm bảo tính nhất quán tuyệt đối.
 */
export const assignStaticIp = functions.https.onCall(async (data, context) => {
  const { callerUid, callerData } = await assertAdmin(context);
  const { deviceId, ipAddressId, networkId, note } = data;

  if (!deviceId || !ipAddressId || !networkId) {
    throw new functions.https.HttpsError('invalid-argument', 'Dữ liệu cấp phát không đầy đủ.');
  }

  const deviceRef = db.collection('devices').doc(deviceId);
  const ipRef = db.collection('ipAddresses').doc(ipAddressId);
  const networkRef = db.collection('ipNetworks').doc(networkId);
  const historyRef = db.collection('ipAssignmentHistory').doc();
  const logRef = db.collection('activityLogs').doc();

  return db.runTransaction(async (transaction) => {
    const [deviceDoc, ipDoc, networkDoc] = await Promise.all([
      transaction.get(deviceRef),
      transaction.get(ipRef),
      transaction.get(networkRef),
    ]);

    if (!deviceDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy thiết bị.');
    if (!ipDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy địa chỉ IP.');
    if (!networkDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy dải mạng.');

    const device = deviceDoc.data()!;
    const ip = ipDoc.data()!;
    const network = networkDoc.data()!;

    // Kiểm tra thiết bị chưa có IP
    if (device.assignedIpAddress) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Thiết bị ${device.deviceCode} đã được gán IP ${device.assignedIpAddress}. Hãy thu hồi trước.`
      );
    }

    // Kiểm tra IP còn Available
    if (ip.status !== 'Available') {
      throw new functions.https.HttpsError(
        'already-exists',
        `Địa chỉ IP ${ip.ipAddress} hiện không còn trống (Trạng thái: ${ip.status}).`
      );
    }

    // 1. Cập nhật IP
    transaction.update(ipRef, {
      status: 'Assigned',
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      departmentName: device.departmentName || '',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: callerUid,
      assignedByName: callerData.displayName || 'Admin',
      note: note || 'Cấp phát tĩnh đưa vào vận hành',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Cập nhật Device
    transaction.update(deviceRef, {
      assignedIpId: ip.id,
      assignedIpAddress: ip.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      subnetMask: network.subnetMask,
      gateway: network.gateway,
      dnsPrimary: network.dnsPrimary,
      dnsSecondary: network.dnsSecondary || null,
      vlanId: network.vlanId || null,
      ipAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAssignedBy: callerData.displayName || 'Admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Tạo History Record
    transaction.set(historyRef, {
      id: historyRef.id,
      ipAddressId: ip.id,
      ipAddress: ip.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      vlanId: network.vlanId || null,
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      departmentId: device.departmentId,
      departmentName: device.departmentName,
      action: 'ASSIGN',
      assignedBy: callerUid,
      assignedByName: callerData.displayName || 'Admin',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: note || 'Cấp phát ban đầu đưa vào vận hành',
      status: 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Ghi Audit Log
    transaction.set(logRef, {
      id: logRef.id,
      userId: callerUid,
      userEmail: callerData.email || '',
      userName: callerData.displayName || 'Admin',
      userRole: 'Admin',
      action: 'ASSIGN_IP',
      module: 'IPAM',
      targetId: device.id,
      targetCode: ip.ipAddress,
      description: `Cấp phát IP tĩnh ${ip.ipAddress} cho thiết bị ${device.deviceCode} (${device.name})`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Cập nhật số đếm dải mạng
    transaction.update(networkRef, {
      assignedCount: admin.firestore.FieldValue.increment(1),
      availableCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Cấp phát thành công IP tĩnh ${ip.ipAddress} cho thiết bị ${device.deviceCode}.`,
    };
  });
});

/**
 * 5. Cloud Function: Thu hồi IP Tĩnh khỏi Thiết bị (releaseStaticIp)
 */
export const releaseStaticIp = functions.https.onCall(async (data, context) => {
  const { callerUid, callerData } = await assertAdmin(context);
  const { deviceId, reason } = data;

  if (!deviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu mã thiết bị.');
  }

  const deviceRef = db.collection('devices').doc(deviceId);
  const logRef = db.collection('activityLogs').doc();

  return db.runTransaction(async (transaction) => {
    const deviceDoc = await transaction.get(deviceRef);
    if (!deviceDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy thiết bị.');

    const device = deviceDoc.data()!;
    if (!device.assignedIpAddress) {
      throw new functions.https.HttpsError('failed-precondition', 'Thiết bị này không có IP đang cấp phát.');
    }

    const releasedIp = device.assignedIpAddress;
    const releasedIpId = device.assignedIpId;
    const networkId = device.networkId;

    if (releasedIpId) {
      const ipRef = db.collection('ipAddresses').doc(releasedIpId);
      transaction.update(ipRef, {
        status: 'Available',
        deviceId: admin.firestore.FieldValue.delete(),
        deviceCode: admin.firestore.FieldValue.delete(),
        deviceName: admin.firestore.FieldValue.delete(),
        departmentName: admin.firestore.FieldValue.delete(),
        assignedAt: admin.firestore.FieldValue.delete(),
        assignedBy: admin.firestore.FieldValue.delete(),
        assignedByName: admin.firestore.FieldValue.delete(),
        note: `Thu hồi từ ${device.deviceCode}: ${reason || 'Không có lý do'}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Gỡ IP khỏi Device
    transaction.update(deviceRef, {
      assignedIpId: admin.firestore.FieldValue.delete(),
      assignedIpAddress: admin.firestore.FieldValue.delete(),
      networkId: admin.firestore.FieldValue.delete(),
      networkName: admin.firestore.FieldValue.delete(),
      subnetMask: admin.firestore.FieldValue.delete(),
      gateway: admin.firestore.FieldValue.delete(),
      dnsPrimary: admin.firestore.FieldValue.delete(),
      dnsSecondary: admin.firestore.FieldValue.delete(),
      vlanId: admin.firestore.FieldValue.delete(),
      ipAssignedAt: admin.firestore.FieldValue.delete(),
      ipAssignedBy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Cập nhật số đếm dải mạng
    if (networkId) {
      const networkRef = db.collection('ipNetworks').doc(networkId);
      transaction.update(networkRef, {
        assignedCount: admin.firestore.FieldValue.increment(-1),
        availableCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Ghi Audit Log
    transaction.set(logRef, {
      id: logRef.id,
      userId: callerUid,
      userEmail: callerData.email || '',
      userName: callerData.displayName || 'Admin',
      userRole: 'Admin',
      action: 'RELEASE_IP',
      module: 'IPAM',
      targetId: device.id,
      targetCode: releasedIp,
      description: `Thu hồi IP tĩnh ${releasedIp} từ thiết bị ${device.deviceCode}. Lý do: ${reason}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Đã thu hồi thành công IP ${releasedIp} từ thiết bị ${device.deviceCode}.`,
    };
  });
});

/**
 * 6. Cloud Function: Giữ chỗ Địa chỉ IP (reserveIpAddress)
 */
export const reserveIpAddress = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { ipAddressId, reason } = data;

  const ipRef = db.collection('ipAddresses').doc(ipAddressId);
  const ipDoc = await ipRef.get();
  if (!ipDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy IP.');

  const ipData = ipDoc.data()!;
  if (ipData.status !== 'Available') {
    throw new functions.https.HttpsError('failed-precondition', `IP đang ở trạng thái: ${ipData.status}`);
  }

  await ipRef.update({
    status: 'Reserved',
    reservedReason: reason || 'Giữ chỗ',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Đã giữ chỗ IP ${ipData.ipAddress}.` };
});

/**
 * 7. Cloud Function: Khóa Địa chỉ IP (blockIpAddress)
 */
export const blockIpAddress = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { ipAddressId, note } = data;

  const ipRef = db.collection('ipAddresses').doc(ipAddressId);
  const ipDoc = await ipRef.get();
  if (!ipDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy IP.');

  const ipData = ipDoc.data()!;
  if (ipData.status === 'Assigned') {
    throw new functions.https.HttpsError('failed-precondition', 'Không thể khóa IP đang được thiết bị sử dụng.');
  }

  await ipRef.update({
    status: 'Blocked',
    note: note || 'Đã khóa an toàn',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Đã khóa IP ${ipData.ipAddress}.` };
});

/**
 * 8. Cloud Function: Mở khóa / Hủy giữ chỗ IP (unblockIpAddress)
 */
export const unblockIpAddress = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { ipAddressId } = data;

  const ipRef = db.collection('ipAddresses').doc(ipAddressId);
  await ipRef.update({
    status: 'Available',
    reservedReason: admin.firestore.FieldValue.delete(),
    note: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Đã giải phóng IP về Available.' };
});

/**
 * 9. Cloud Function: Thay đổi IP tĩnh của Thiết bị (changeStaticIp)
 */
export const changeStaticIp = functions.https.onCall(async (data, context) => {
  const { callerUid, callerData } = await assertAdmin(context);
  const { deviceId, newIpAddressId, newNetworkId, reason } = data;

  return db.runTransaction(async (transaction) => {
    const devRef = db.collection('devices').doc(deviceId);
    const devDoc = await transaction.get(devRef);
    if (!devDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy thiết bị.');

    const device = devDoc.data()!;
    const oldIp = device.assignedIpAddress;
    const oldIpId = device.assignedIpId;

    // 1. Kiểm tra IP mới còn Available
    const newIpRef = db.collection('ipAddresses').doc(newIpAddressId);
    const newIpDoc = await transaction.get(newIpRef);
    if (!newIpDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy IP mới.');

    const newIpData = newIpDoc.data()!;
    if (newIpData.status !== 'Available') {
      throw new functions.https.HttpsError('failed-precondition', `IP mới ${newIpData.ipAddress} không còn trống.`);
    }

    const netRef = db.collection('ipNetworks').doc(newNetworkId);
    const netDoc = await transaction.get(netRef);
    if (!netDoc.exists) throw new functions.https.HttpsError('not-found', 'Không tìm thấy dải mạng mới.');
    const network = netDoc.data()!;

    // 2. Chuyển IP cũ về Available
    if (oldIpId) {
      const oldIpRef = db.collection('ipAddresses').doc(oldIpId);
      transaction.update(oldIpRef, {
        status: 'Available',
        deviceId: admin.firestore.FieldValue.delete(),
        deviceCode: admin.firestore.FieldValue.delete(),
        assignedAt: admin.firestore.FieldValue.delete(),
        assignedBy: admin.firestore.FieldValue.delete(),
        note: `Thu hồi để đổi sang IP mới: ${reason || ''}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Gán IP mới
    transaction.update(newIpRef, {
      status: 'Assigned',
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      departmentName: device.departmentName,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: callerUid,
      assignedByName: callerData.displayName || 'Admin',
      note: `Đổi IP: ${reason || ''}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Cập nhật thiết bị
    transaction.update(devRef, {
      assignedIpId: newIpData.id,
      assignedIpAddress: newIpData.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      subnetMask: network.subnetMask,
      gateway: network.gateway,
      dnsPrimary: network.dnsPrimary,
      dnsSecondary: network.dnsSecondary || '8.8.4.4',
      vlanId: network.vlanId || null,
      ipAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAssignedBy: callerData.displayName || 'Admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Ghi lịch sử cấp phát
    const histRef = db.collection('ipAssignmentHistory').doc();
    transaction.set(histRef, {
      ipAddressId: newIpData.id,
      ipAddress: newIpData.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      action: 'CHANGE',
      assignedBy: callerUid,
      assignedByName: callerData.displayName || 'Admin',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: `Đổi từ ${oldIp || 'N/A'} sang ${newIpData.ipAddress}: ${reason || ''}`,
      status: 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Đã đổi thành công sang IP ${newIpData.ipAddress}.` };
  });
});

/**
 * 10. Cloud Function: Thống kê số liệu IPAM (getIpStatistics)
 */
export const getIpStatistics = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Yêu cầu đăng nhập.');

  const [networksSnap, ipsSnap] = await Promise.all([
    db.collection('ipNetworks').get(),
    db.collection('ipAddresses').get(),
  ]);

  const totalIps = ipsSnap.size;
  let availableCount = 0;
  let assignedCount = 0;
  let reservedCount = 0;
  let blockedCount = 0;

  ipsSnap.docs.forEach((doc) => {
    const status = doc.data().status;
    if (status === 'Available') availableCount++;
    else if (status === 'Assigned') assignedCount++;
    else if (status === 'Reserved') reservedCount++;
    else if (status === 'Blocked') blockedCount++;
  });

  return {
    totalNetworks: networksSnap.size,
    totalIps,
    availableCount,
    assignedCount,
    reservedCount,
    blockedCount,
    utilizationRate: totalIps > 0 ? Math.round((assignedCount / totalIps) * 100) : 0,
  };
});
