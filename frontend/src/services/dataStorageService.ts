import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_DEVICES,
  INITIAL_USERS,
  INITIAL_INVENTORY_SESSIONS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_TRANSFER_RECORDS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_IP_NETWORKS,
  INITIAL_IP_ADDRESSES,
  INITIAL_IP_ASSIGNMENT_HISTORIES,
} from './mockHospitalData';
import {
  generateUsableIps,
  isNetworkOverlapping,
  calculateSubnetDetails,
  ipToNumber,
} from '../utils/ipamUtils';
import type {
  Department,
  DeviceCategory,
  Location,
  Device,
  UserProfile,
  InventorySession,
  InventoryItem,
  MaintenanceRecord,
  TransferRecord,
  SystemSettings,
  ActivityLog,
  IpNetwork,
  IpAddress,
  IpAssignmentHistory,
  IpExclusion,
  IpAuditLog,
} from '../types';

/**
 * LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU HYBRID (FIRESTORE + LOCAL CACHE)
 * Đảm bảo hệ thống hoạt động 100% tin cậy, không phụ thuộc tuyệt đối vào mạng
 */

const STORAGE_KEYS = {
  DEPARTMENTS: 'hosp_departments_v1',
  CATEGORIES: 'hosp_categories_v1',
  LOCATIONS: 'hosp_locations_v1',
  DEVICES: 'hosp_devices_v1',
  USERS: 'hosp_users_v1',
  INVENTORY_SESSIONS: 'hosp_inv_sessions_v1',
  INVENTORY_ITEMS: 'hosp_inv_items_v1',
  MAINTENANCE: 'hosp_maintenance_v1',
  TRANSFERS: 'hosp_transfers_v1',
  SETTINGS: 'hosp_settings_v1',
  LOGS: 'hosp_logs_v1',
  IP_NETWORKS: 'hosp_ip_networks_v1',
  IP_ADDRESSES: 'hosp_ip_addresses_v1',
  IP_HISTORY: 'hosp_ip_history_v1',
  IP_EXCLUSIONS: 'hosp_ip_exclusions_v1',
  IP_AUDIT_LOGS: 'hosp_ip_audit_logs_v1',
};

// Khởi tạo dữ liệu mẫu nếu cache trống
const getFromLocal = <T>(key: string, initialData: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return initialData;
  }
};

const saveToLocal = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// 1. DEPARTMENTS
// ==========================================
export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Department));
        saveToLocal(STORAGE_KEYS.DEPARTMENTS, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore offline, dùng local data', e);
    }
    return getFromLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  create: async (dept: Omit<Department, 'id'>): Promise<Department> => {
    const id = `DEP-${dept.code.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newDept: Department = { ...dept, id, createdAt: new Date().toISOString() };
    
    const list = getFromLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    list.push(newDept);
    saveToLocal(STORAGE_KEYS.DEPARTMENTS, list);

    try {
      await setDoc(doc(db, 'departments', id), { ...newDept, createdAt: serverTimestamp() });
    } catch (e) {
      console.warn('Lỗi lưu Firestore departments', e);
    }
    return newDept;
  },

  update: async (id: string, updates: Partial<Department>): Promise<void> => {
    const list = getFromLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const idx = list.findIndex((d) => d.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      saveToLocal(STORAGE_KEYS.DEPARTMENTS, list);
    }
    try {
      await updateDoc(doc(db, 'departments', id), { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      console.warn('Lỗi update Firestore departments', e);
    }
  },

  delete: async (id: string): Promise<void> => {
    const list = getFromLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS).filter((d) => d.id !== id);
    saveToLocal(STORAGE_KEYS.DEPARTMENTS, list);
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (e) {
      console.warn('Lỗi delete Firestore departments', e);
    }
  },
};

// ==========================================
// 2. CATEGORIES
// ==========================================
export const categoryService = {
  getAll: async (): Promise<DeviceCategory[]> => {
    try {
      const snap = await getDocs(collection(db, 'deviceCategories'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeviceCategory));
        saveToLocal(STORAGE_KEYS.CATEGORIES, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore offline, dùng local categories', e);
    }
    return getFromLocal<DeviceCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  create: async (cat: Omit<DeviceCategory, 'id'>): Promise<DeviceCategory> => {
    const id = `CAT-${cat.code.toUpperCase()}`;
    const newCat: DeviceCategory = { ...cat, id, createdAt: new Date().toISOString() };
    const list = getFromLocal<DeviceCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    list.push(newCat);
    saveToLocal(STORAGE_KEYS.CATEGORIES, list);
    try {
      await setDoc(doc(db, 'deviceCategories', id), { ...newCat, createdAt: serverTimestamp() });
    } catch (e) {
      console.warn(e);
    }
    return newCat;
  },
};

// ==========================================
// 3. LOCATIONS
// ==========================================
export const locationService = {
  getAll: async (departmentId?: string): Promise<Location[]> => {
    let list = getFromLocal<Location[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    try {
      const snap = await getDocs(collection(db, 'locations'));
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Location));
        saveToLocal(STORAGE_KEYS.LOCATIONS, list);
      }
    } catch (e) {
      console.warn('Firestore offline, dùng local locations', e);
    }

    if (departmentId) {
      return list.filter((l) => l.departmentId === departmentId);
    }
    return list;
  },

  create: async (loc: Omit<Location, 'id'>): Promise<Location> => {
    const id = `LOC-${loc.code.toUpperCase()}`;
    const newLoc: Location = { ...loc, id, createdAt: new Date().toISOString() };
    const list = getFromLocal<Location[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    list.push(newLoc);
    saveToLocal(STORAGE_KEYS.LOCATIONS, list);
    try {
      await setDoc(doc(db, 'locations', id), { ...newLoc, createdAt: serverTimestamp() });
    } catch (e) {
      console.warn(e);
    }
    return newLoc;
  },
};

// ==========================================
// 4. DEVICES
// ==========================================
export const deviceService = {
  getAll: async (user?: UserProfile | null): Promise<Device[]> => {
    let list = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    try {
      const snap = await getDocs(collection(db, 'devices'));
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Device));
        saveToLocal(STORAGE_KEYS.DEVICES, list);
      }
    } catch (e) {
      console.warn('Firestore offline, dùng local devices', e);
    }

    // Cả Admin và Người Quản lý Thiết bị CNTT Bệnh viện đều quản lý thiết bị toàn viện
    return list;
  },

  getById: async (id: string): Promise<Device | undefined> => {
    const list = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    const found = list.find((d) => d.id === id || d.deviceCode === id || d.qrCodeToken === id);
    if (found) return found;

    try {
      const snap = await getDoc(doc(db, 'devices', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Device;
      }
    } catch (e) {
      console.warn('Lỗi getById device', e);
    }
    return undefined;
  },

  create: async (device: Omit<Device, 'id'>): Promise<Device> => {
    const id = `DEV-${Date.now().toString().slice(-6)}`;
    const qrCodeToken = `tok_${device.deviceCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    
    const newDevice: Device = {
      ...device,
      id,
      qrCodeToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    list.unshift(newDevice);
    saveToLocal(STORAGE_KEYS.DEVICES, list);

    try {
      await setDoc(doc(db, 'devices', id), {
        ...newDevice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Tạo bản ghi QR code đồng bộ
      await setDoc(doc(db, 'qrCodes', qrCodeToken), {
        id: qrCodeToken,
        deviceId: id,
        deviceCode: newDevice.deviceCode,
        token: qrCodeToken,
        qrDataString: `BVPHCNDT://DEV/${qrCodeToken}`,
        printCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Lỗi lưu device Firestore', e);
    }

    return newDevice;
  },

  update: async (id: string, updates: Partial<Device>): Promise<void> => {
    const list = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    const idx = list.findIndex((d) => d.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      saveToLocal(STORAGE_KEYS.DEVICES, list);
    }
    try {
      await updateDoc(doc(db, 'devices', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Lỗi update device Firestore', e);
    }
  },

  delete: async (id: string): Promise<void> => {
    const list = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES).filter((d) => d.id !== id);
    saveToLocal(STORAGE_KEYS.DEVICES, list);
    try {
      await deleteDoc(doc(db, 'devices', id));
    } catch (e) {
      console.warn('Lỗi delete device Firestore', e);
    }
  },
};

// ==========================================
// 5. INVENTORY SESSIONS & ITEMS
// ==========================================
export const inventoryService = {
  getSessions: async (): Promise<InventorySession[]> => {
    return getFromLocal<InventorySession[]>(STORAGE_KEYS.INVENTORY_SESSIONS, INITIAL_INVENTORY_SESSIONS);
  },

  createSession: async (session: Omit<InventorySession, 'id' | 'summary'>): Promise<InventorySession> => {
    const id = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    
    // Tạo snapshot từ danh sách thiết bị hiện tại
    const allDevices = await deviceService.getAll(null);
    const targetDevices = session.scope === 'HospitalWide'
      ? allDevices
      : allDevices.filter((d) => session.targetDepartmentIds.includes(d.departmentId));

    const newSession: InventorySession = {
      ...session,
      id,
      summary: {
        totalExpected: targetDevices.length,
        totalScanned: 0,
        totalMatched: 0,
        totalMisplaced: 0,
        totalMissing: targetDevices.length,
        totalDamaged: 0,
        totalSurplus: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const sessions = getFromLocal<InventorySession[]>(STORAGE_KEYS.INVENTORY_SESSIONS, INITIAL_INVENTORY_SESSIONS);
    sessions.unshift(newSession);
    saveToLocal(STORAGE_KEYS.INVENTORY_SESSIONS, sessions);

    // Tạo các snapshot items
    const snapshotItems: InventoryItem[] = targetDevices.map((d) => ({
      id: `ITEM-${id}-${d.id}`,
      sessionId: id,
      deviceId: d.id,
      deviceCode: d.deviceCode,
      deviceName: d.name,
      expectedDepartmentId: d.departmentId,
      expectedDepartmentName: d.departmentName,
      expectedLocationId: d.locationId,
      expectedLocationName: d.locationName,
      expectedStatus: d.status,
      isScanned: false,
      resultStatus: 'Pending',
    }));

    const existingItems = getFromLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY_ITEMS, []);
    saveToLocal(STORAGE_KEYS.INVENTORY_ITEMS, [...snapshotItems, ...existingItems]);

    return newSession;
  },

  getItemsBySession: async (sessionId: string): Promise<InventoryItem[]> => {
    const items = getFromLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY_ITEMS, []);
    return items.filter((i) => i.sessionId === sessionId);
  },

  recordScan: async (
    sessionId: string,
    scannedTokenOrCode: string,
    scannerUser: UserProfile,
    actualDeptId: string,
    actualDeptName: string,
    actualLocId: string,
    actualLocName: string,
    actualCondition: any
  ): Promise<{ success: boolean; item?: InventoryItem; message: string }> => {
    const items = getFromLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY_ITEMS, []);
    const sessions = getFromLocal<InventorySession[]>(STORAGE_KEYS.INVENTORY_SESSIONS, INITIAL_INVENTORY_SESSIONS);
    
    // Tìm thiết bị
    const allDevices = await deviceService.getAll(null);
    const device = allDevices.find(
      (d) => d.qrCodeToken === scannedTokenOrCode || d.deviceCode.toLowerCase() === scannedTokenOrCode.toLowerCase()
    );

    if (!device) {
      return { success: false, message: 'Không tìm thấy thiết bị nào tương ứng với mã QR này trong hệ thống.' };
    }

    const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
    const itemIdx = items.findIndex((i) => i.sessionId === sessionId && i.deviceId === device.id);

    let resultStatus: any = 'Matched';
    if (device.departmentId !== actualDeptId || device.locationId !== actualLocId) {
      resultStatus = 'Misplaced';
    }
    if (actualCondition === 'Poor' || actualCondition === 'Unusable') {
      resultStatus = 'Damaged';
    }

    if (itemIdx !== -1) {
      items[itemIdx] = {
        ...items[itemIdx],
        isScanned: true,
        scannedAt: new Date().toISOString(),
        scannedBy: scannerUser.id,
        scannedByName: scannerUser.displayName,
        actualDepartmentId: actualDeptId,
        actualDepartmentName: actualDeptName,
        actualLocationId: actualLocId,
        actualLocationName: actualLocName,
        actualCondition,
        resultStatus,
      };
    } else {
      // Trường hợp Surplus (Thiết bị thừa, không có trong snapshot ban đầu)
      const newItem: InventoryItem = {
        id: `SURPLUS-${Date.now()}`,
        sessionId,
        deviceId: device.id,
        deviceCode: device.deviceCode,
        deviceName: device.name,
        expectedDepartmentId: device.departmentId,
        expectedDepartmentName: device.departmentName,
        expectedLocationId: device.locationId,
        expectedLocationName: device.locationName,
        expectedStatus: device.status,
        isScanned: true,
        scannedAt: new Date().toISOString(),
        scannedBy: scannerUser.id,
        scannedByName: scannerUser.displayName,
        actualDepartmentId: actualDeptId,
        actualDepartmentName: actualDeptName,
        actualLocationId: actualLocId,
        actualLocationName: actualLocName,
        actualCondition,
        resultStatus: 'Surplus',
      };
      items.push(newItem);
    }

    saveToLocal(STORAGE_KEYS.INVENTORY_ITEMS, items);

    // Cập nhật lại summary của session
    if (sessionIdx !== -1) {
      const sessionItems = items.filter((i) => i.sessionId === sessionId);
      const scanned = sessionItems.filter((i) => i.isScanned);
      sessions[sessionIdx].summary = {
        totalExpected: sessionItems.length,
        totalScanned: scanned.length,
        totalMatched: scanned.filter((i) => i.resultStatus === 'Matched').length,
        totalMisplaced: scanned.filter((i) => i.resultStatus === 'Misplaced').length,
        totalDamaged: scanned.filter((i) => i.resultStatus === 'Damaged').length,
        totalSurplus: scanned.filter((i) => i.resultStatus === 'Surplus').length,
        totalMissing: sessionItems.filter((i) => !i.isScanned).length,
      };
      saveToLocal(STORAGE_KEYS.INVENTORY_SESSIONS, sessions);
    }

    return { success: true, message: `Quét thành công thiết bị: ${device.deviceCode} (${device.name})` };
  },
};

// ==========================================
// 6. MAINTENANCE
// ==========================================
export const maintenanceService = {
  getAll: async (user?: UserProfile | null): Promise<MaintenanceRecord[]> => {
    let list = getFromLocal<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_RECORDS);
    if (user && user.role === 'EquipmentManager' && user.departmentIds?.length > 0) {
      list = list.filter((m) => user.departmentIds.includes(m.departmentId));
    }
    return list;
  },

  create: async (record: Omit<MaintenanceRecord, 'id' | 'reportedAt'>): Promise<MaintenanceRecord> => {
    const id = `MAINT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id,
      reportedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const list = getFromLocal<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_RECORDS);
    list.unshift(newRecord);
    saveToLocal(STORAGE_KEYS.MAINTENANCE, list);

    // Tự động chuyển trạng thái thiết bị sang UnderMaintenance
    await deviceService.update(record.deviceId, { status: 'UnderMaintenance' });

    return newRecord;
  },

  update: async (id: string, updates: Partial<MaintenanceRecord>): Promise<void> => {
    const list = getFromLocal<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_RECORDS);
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      saveToLocal(STORAGE_KEYS.MAINTENANCE, list);

      // Nếu phiếu bảo trì hoàn thành, trả trạng thái thiết bị về InUse
      if (updates.status === 'Completed') {
        await deviceService.update(list[idx].deviceId, { status: 'InUse', condition: 'Good' });
      }
    }
  },
};

// ==========================================
// 7. TRANSFERS
// ==========================================
export const transferService = {
  getAll: async (user?: UserProfile | null): Promise<TransferRecord[]> => {
    let list = getFromLocal<TransferRecord[]>(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFER_RECORDS);
    if (user && user.role === 'EquipmentManager' && user.departmentIds?.length > 0) {
      list = list.filter(
        (t) => user.departmentIds.includes(t.fromDepartmentId) || user.departmentIds.includes(t.toDepartmentId)
      );
    }
    return list;
  },

  create: async (record: Omit<TransferRecord, 'id' | 'requestedAt' | 'status'>): Promise<TransferRecord> => {
    const id = `TRANS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newRecord: TransferRecord = {
      ...record,
      id,
      status: 'PendingApproval',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const list = getFromLocal<TransferRecord[]>(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFER_RECORDS);
    list.unshift(newRecord);
    saveToLocal(STORAGE_KEYS.TRANSFERS, list);
    return newRecord;
  },

  approve: async (id: string, adminUser: UserProfile): Promise<void> => {
    const list = getFromLocal<TransferRecord[]>(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFER_RECORDS);
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const transfer = list[idx];
      transfer.status = 'Completed';
      transfer.approvedBy = adminUser.id;
      transfer.approvedByName = adminUser.displayName;
      transfer.approvedAt = new Date().toISOString();
      transfer.transferDate = new Date().toISOString();
      saveToLocal(STORAGE_KEYS.TRANSFERS, list);

      // Chuyển quyền quản lý thiết bị sang khoa mới
      await deviceService.update(transfer.deviceId, {
        departmentId: transfer.toDepartmentId,
        departmentName: transfer.toDepartmentName,
        locationId: transfer.toLocationId,
        locationName: transfer.toLocationName,
      });
    }
  },

  reject: async (id: string, adminUser: UserProfile): Promise<void> => {
    const list = getFromLocal<TransferRecord[]>(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFER_RECORDS);
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list[idx].status = 'Rejected';
      list[idx].approvedBy = adminUser.id;
      list[idx].approvedByName = adminUser.displayName;
      list[idx].approvedAt = new Date().toISOString();
      saveToLocal(STORAGE_KEYS.TRANSFERS, list);
    }
  },
};

// ==========================================
// 8. USERS MANAGEMENT
// ==========================================
export const userService = {
  getAll: async (): Promise<UserProfile[]> => {
    return getFromLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  updateRoleAndDepartments: async (
    targetUserId: string,
    role: 'Admin' | 'EquipmentManager',
    departmentIds: string[]
  ): Promise<void> => {
    const users = getFromLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === targetUserId);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        role,
        departmentIds: role === 'Admin' ? [] : departmentIds,
        updatedAt: new Date().toISOString(),
      };
      saveToLocal(STORAGE_KEYS.USERS, users);
    }
  },
};

// ==========================================
// 9. SYSTEM SETTINGS
// ==========================================
export const settingsService = {
  get: async (): Promise<SystemSettings> => {
    return getFromLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
  },

  update: async (updates: Partial<SystemSettings>): Promise<void> => {
    const current = getFromLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    saveToLocal(STORAGE_KEYS.SETTINGS, updated);
  },
};

// ==========================================
// 10. IPAM - QUẢN LÝ DẢI MẠNG (IP NETWORKS)
// ==========================================
export const ipNetworkService = {
  getAll: async (user?: UserProfile | null): Promise<IpNetwork[]> => {
    let list = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);

    try {
      const snap = await getDocs(collection(db, 'ipNetworks'));
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IpNetwork));
        saveToLocal(STORAGE_KEYS.IP_NETWORKS, list);
      }
    } catch (e) {
      console.warn('Firestore offline, dùng local ipNetworks', e);
    }

    // Phân quyền: EquipmentManager chỉ xem dải mạng liên kết với phòng ban của mình
    if (user && user.role === 'EquipmentManager' && user.departmentIds?.length > 0) {
      return list.filter((net) =>
        net.departmentIds.some((deptId) => user.departmentIds.includes(deptId))
      );
    }
    return list;
  },

  getById: async (id: string): Promise<IpNetwork | undefined> => {
    const list = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);
    return list.find((n) => n.id === id);
  },

  create: async (
    network: Omit<IpNetwork, 'id' | 'totalIps' | 'availableCount' | 'assignedCount' | 'reservedCount' | 'blockedCount'>,
    user: UserProfile
  ): Promise<IpNetwork> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Quản trị viên (Admin) mới có quyền tạo dải mạng mới.');
    }

    const currentNetworks = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);

    // 1. Kiểm tra tính hợp lệ của Subnet
    const subnetDetails = calculateSubnetDetails(network.networkAddress, network.cidr);
    if (!subnetDetails) {
      throw new Error('Địa chỉ mạng hoặc CIDR không hợp lệ.');
    }

    // 2. Kiểm tra xung đột chồng lấn (Overlap check)
    const activeNetworks = currentNetworks.filter((n) => n.status === 'Active');
    for (const existing of activeNetworks) {
      // Nếu cùng VLAN hoặc không phân định VLAN độc lập
      const sameVlan = network.vlanId && existing.vlanId ? network.vlanId === existing.vlanId : true;
      if (sameVlan && isNetworkOverlapping(existing, network)) {
        throw new Error(
          `Dải mạng ${network.networkAddress}/${network.cidr} bị trùng lặp hoặc chồng lấn không gian địa chỉ với dải mạng hiện hữu: ${existing.networkName} (${existing.networkAddress}/${existing.cidr}).`
        );
      }
    }

    const id = `NET-${network.networkName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Date.now().toString().slice(-4)}`;
    
    // 3. Sinh danh sách IP khả dụng ban đầu theo lô an toàn (loại trừ Gateway, Network, Broadcast)
    const usableIps = generateUsableIps(network.networkAddress, network.cidr, network.gateway);
    const totalCount = usableIps.length;

    const newNetwork: IpNetwork = {
      ...network,
      id,
      totalIps: totalCount,
      availableCount: totalCount,
      assignedCount: 0,
      reservedCount: 0,
      blockedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
    };

    currentNetworks.push(newNetwork);
    saveToLocal(STORAGE_KEYS.IP_NETWORKS, currentNetworks);

    // Lưu các IP của dải mạng này vào danh sách IP
    const allIps = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const newIpEntities: IpAddress[] = usableIps.map((item) => ({
      id: `${id}_${item.ip.replace(/\./g, '-')}`,
      ipAddress: item.ip,
      ipNumber: item.ipNumber,
      networkId: id,
      networkName: network.networkName,
      vlanId: network.vlanId,
      departmentIds: network.departmentIds,
      status: 'Available',
      createdAt: new Date().toISOString(),
    }));

    saveToLocal(STORAGE_KEYS.IP_ADDRESSES, [...allIps, ...newIpEntities]);

    try {
      await setDoc(doc(db, 'ipNetworks', id), {
        ...newNetwork,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Lỗi lưu Firestore ipNetworks', e);
    }

    return newNetwork;
  },

  update: async (id: string, updates: Partial<IpNetwork>, user: UserProfile): Promise<void> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền cập nhật dải mạng.');
    }

    const currentNetworks = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);
    const idx = currentNetworks.findIndex((n) => n.id === id);
    if (idx !== -1) {
      currentNetworks[idx] = {
        ...currentNetworks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToLocal(STORAGE_KEYS.IP_NETWORKS, currentNetworks);
    }

    try {
      await updateDoc(doc(db, 'ipNetworks', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Lỗi update Firestore ipNetworks', e);
    }
  },

  toggleStatus: async (id: string, newStatus: 'Active' | 'Inactive', user: UserProfile): Promise<void> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền thay đổi trạng thái dải mạng.');
    }
    await ipNetworkService.update(id, { status: newStatus }, user);
  },
};

// ==========================================
// 11. IPAM - QUẢN LÝ ĐỊA CHỈ IP (IP ADDRESSES)
// ==========================================
export const ipAddressService = {
  getAll: async (
    filters?: {
      networkId?: string;
      status?: string;
      departmentId?: string;
      vlanId?: number;
      searchTerm?: string;
    },
    user?: UserProfile | null
  ): Promise<IpAddress[]> => {
    let list = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);

    // Phân quyền: EquipmentManager chỉ thấy IP của thiết bị thuộc khoa mình quản lý
    if (user && user.role === 'EquipmentManager' && user.departmentIds?.length > 0) {
      list = list.filter(
        (ip) =>
          ip.status === 'Assigned' &&
          ip.departmentIds?.some((deptId) => user.departmentIds.includes(deptId))
      );
    }

    if (filters?.networkId && filters.networkId !== 'ALL') {
      list = list.filter((ip) => ip.networkId === filters.networkId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((ip) => ip.status === filters.status);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter((ip) => ip.departmentIds?.includes(filters.departmentId!));
    }
    if (filters?.vlanId) {
      list = list.filter((ip) => ip.vlanId === filters.vlanId);
    }
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      list = list.filter(
        (ip) =>
          ip.ipAddress.includes(term) ||
          ip.deviceCode?.toLowerCase().includes(term) ||
          ip.deviceName?.toLowerCase().includes(term) ||
          ip.note?.toLowerCase().includes(term)
      );
    }

    return list.sort((a, b) => (a.ipNumber || 0) - (b.ipNumber || 0));
  },

  getAvailableByNetwork: async (networkId: string): Promise<IpAddress[]> => {
    const list = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    return list
      .filter((ip) => ip.networkId === networkId && ip.status === 'Available')
      .sort((a, b) => (a.ipNumber || 0) - (b.ipNumber || 0));
  },

  reserve: async (ipAddressId: string, reason: string, user: UserProfile): Promise<void> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền giữ chỗ IP.');
    }
    const list = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const idx = list.findIndex((ip) => ip.id === ipAddressId);
    if (idx === -1) throw new Error('Không tìm thấy địa chỉ IP.');
    if (list[idx].status !== 'Available') {
      throw new Error(`Không thể giữ chỗ IP đang ở trạng thái: ${list[idx].status}`);
    }

    list[idx] = {
      ...list[idx],
      status: 'Reserved',
      reservedReason: reason,
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.IP_ADDRESSES, list);
    recalculateNetworkCounts(list[idx].networkId);
  },

  block: async (ipAddressId: string, note: string, user: UserProfile): Promise<void> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền khóa IP.');
    }
    const list = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const idx = list.findIndex((ip) => ip.id === ipAddressId);
    if (idx === -1) throw new Error('Không tìm thấy địa chỉ IP.');
    if (list[idx].status === 'Assigned') {
      throw new Error('Không thể khóa IP đang được thiết bị sử dụng. Hãy thu hồi IP trước.');
    }

    list[idx] = {
      ...list[idx],
      status: 'Blocked',
      note: note || 'Đã khóa bởi Admin',
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.IP_ADDRESSES, list);
    recalculateNetworkCounts(list[idx].networkId);
  },

  unblockOrUnreserve: async (ipAddressId: string, user: UserProfile): Promise<void> => {
    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền mở khóa hoặc hủy giữ chỗ IP.');
    }
    const list = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const idx = list.findIndex((ip) => ip.id === ipAddressId);
    if (idx === -1) throw new Error('Không tìm thấy địa chỉ IP.');

    list[idx] = {
      ...list[idx],
      status: 'Available',
      reservedReason: undefined,
      note: undefined,
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.IP_ADDRESSES, list);
    recalculateNetworkCounts(list[idx].networkId);
  },
};

// ==========================================
// 12. IPAM - CẤP PHÁT, THU HỒI, THAY ĐỔI IP (ATOMIC TRANSACTIONS)
// ==========================================
export const ipAssignmentService = {
  // Cấp phát IP tĩnh cho thiết bị
  assignStaticIp: async (params: {
    deviceId: string;
    ipAddressId: string;
    networkId: string;
    note?: string;
    user: UserProfile;
  }): Promise<{ success: boolean; message: string }> => {
    const { deviceId, ipAddressId, networkId, note, user } = params;

    if (user.role !== 'Admin') {
      throw new Error('Chỉ Quản trị viên (Admin) mới có quyền cấp phát địa chỉ IP tĩnh.');
    }

    const devices = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    const ips = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const networks = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);
    const histories = getFromLocal<IpAssignmentHistory[]>(STORAGE_KEYS.IP_HISTORY, INITIAL_IP_ASSIGNMENT_HISTORIES);

    const devIdx = devices.findIndex((d) => d.id === deviceId);
    if (devIdx === -1) throw new Error('Không tìm thấy thiết bị cần cấp phát IP.');
    const device = devices[devIdx];

    // Điều kiện: Thiết bị chưa có IP đang được cấp phát
    if (device.assignedIpAddress) {
      throw new Error(
        `Thiết bị ${device.deviceCode} hiện đã có IP ${device.assignedIpAddress}. Hãy dùng chức năng Thay đổi IP hoặc Thu hồi trước.`
      );
    }

    // Điều kiện: Kiểm tra IP mục tiêu còn Available
    const ipIdx = ips.findIndex((ip) => ip.id === ipAddressId);
    if (ipIdx === -1) throw new Error('Không tìm thấy địa chỉ IP được chọn.');
    const targetIp = ips[ipIdx];

    if (targetIp.status !== 'Available') {
      throw new Error(
        `Địa chỉ IP ${targetIp.ipAddress} không còn trống (Trạng thái hiện tại: ${targetIp.status}). Hai người không thể cấp cùng một IP.`
      );
    }

    const network = networks.find((n) => n.id === networkId);
    if (!network) throw new Error('Không tìm thấy dải mạng tương ứng.');

    // GIAO DỊCH ATOMIC
    // 1. Cập nhật IP sang Assigned
    ips[ipIdx] = {
      ...targetIp,
      status: 'Assigned',
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      departmentName: device.departmentName,
      assignedAt: new Date().toISOString(),
      assignedBy: user.id,
      assignedByName: user.displayName,
      note: note || 'Cấp phát tĩnh đưa vào vận hành',
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.IP_ADDRESSES, ips);

    // 2. Cập nhật thiết bị liên kết với IP
    devices[devIdx] = {
      ...device,
      assignedIpId: targetIp.id,
      assignedIpAddress: targetIp.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      subnetMask: network.subnetMask,
      gateway: network.gateway,
      dnsPrimary: network.dnsPrimary,
      dnsSecondary: network.dnsSecondary,
      vlanId: network.vlanId,
      ipAssignedAt: new Date().toISOString(),
      ipAssignedBy: user.displayName,
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.DEVICES, devices);

    // 3. Tạo bản ghi lịch sử cấp phát bất biến (ipAssignmentHistory)
    const historyId = `HIST-${Date.now().toString().slice(-6)}`;
    const newHistory: IpAssignmentHistory = {
      id: historyId,
      ipAddressId: targetIp.id,
      ipAddress: targetIp.ipAddress,
      networkId: network.id,
      networkName: network.networkName,
      vlanId: network.vlanId,
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.name,
      departmentId: device.departmentId,
      departmentName: device.departmentName,
      action: 'ASSIGN',
      assignedBy: user.id,
      assignedByName: user.displayName,
      assignedAt: new Date().toISOString(),
      reason: note || 'Cấp phát ban đầu đưa vào vận hành',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    histories.unshift(newHistory);
    saveToLocal(STORAGE_KEYS.IP_HISTORY, histories);

    // 4. Cập nhật lại số đếm dải mạng
    recalculateNetworkCounts(network.id);

    return {
      success: true,
      message: `Cấp phát thành công IP tĩnh ${targetIp.ipAddress} cho thiết bị ${device.deviceCode} (${device.name}).`,
    };
  },

  // Thu hồi địa chỉ IP khỏi thiết bị
  releaseStaticIp: async (params: {
    deviceId: string;
    reason: string;
    user: UserProfile;
  }): Promise<{ success: boolean; message: string }> => {
    const { deviceId, reason, user } = params;

    if (user.role !== 'Admin') {
      throw new Error('Chỉ Admin mới có quyền thu hồi địa chỉ IP.');
    }

    const devices = getFromLocal<Device[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    const ips = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);
    const histories = getFromLocal<IpAssignmentHistory[]>(STORAGE_KEYS.IP_HISTORY, INITIAL_IP_ASSIGNMENT_HISTORIES);

    const devIdx = devices.findIndex((d) => d.id === deviceId);
    if (devIdx === -1) throw new Error('Không tìm thấy thiết bị.');
    const device = devices[devIdx];

    if (!device.assignedIpAddress) {
      throw new Error('Thiết bị này hiện chưa có IP tĩnh để thu hồi.');
    }

    const releasedIp = device.assignedIpAddress;
    const releasedIpId = device.assignedIpId;
    const networkId = device.networkId;

    // GIAO DỊCH ATOMIC THU HỒI
    // 1. Chuyển IP về Available
    const ipIdx = ips.findIndex((ip) => ip.id === releasedIpId || ip.ipAddress === releasedIp);
    if (ipIdx !== -1) {
      ips[ipIdx] = {
        ...ips[ipIdx],
        status: 'Available',
        deviceId: undefined,
        deviceCode: undefined,
        deviceName: undefined,
        departmentName: undefined,
        assignedAt: undefined,
        assignedBy: undefined,
        assignedByName: undefined,
        note: `Thu hồi từ thiết bị ${device.deviceCode}: ${reason}`,
        updatedAt: new Date().toISOString(),
      };
      saveToLocal(STORAGE_KEYS.IP_ADDRESSES, ips);
    }

    // 2. Gỡ bỏ IP khỏi thiết bị
    devices[devIdx] = {
      ...device,
      assignedIpId: undefined,
      assignedIpAddress: undefined,
      networkId: undefined,
      networkName: undefined,
      subnetMask: undefined,
      gateway: undefined,
      dnsPrimary: undefined,
      dnsSecondary: undefined,
      vlanId: undefined,
      ipAssignedAt: undefined,
      ipAssignedBy: undefined,
      updatedAt: new Date().toISOString(),
    };
    saveToLocal(STORAGE_KEYS.DEVICES, devices);

    // 3. Cập nhật lịch sử cấp phát
    const activeHistory = histories.find(
      (h) => h.deviceId === device.id && h.ipAddress === releasedIp && h.status === 'Active'
    );
    if (activeHistory) {
      activeHistory.status = 'Released';
      activeHistory.releasedAt = new Date().toISOString();
      activeHistory.releasedBy = user.id;
      activeHistory.releasedByName = user.displayName;
      activeHistory.reason = reason;
    } else {
      histories.unshift({
        id: `HIST-REL-${Date.now().toString().slice(-6)}`,
        ipAddressId: releasedIpId || '',
        ipAddress: releasedIp,
        networkId: networkId || '',
        deviceId: device.id,
        deviceCode: device.deviceCode,
        deviceName: device.name,
        action: 'RELEASE',
        assignedBy: device.ipAssignedBy || 'Admin',
        assignedAt: device.ipAssignedAt || new Date().toISOString(),
        releasedBy: user.id,
        releasedByName: user.displayName,
        releasedAt: new Date().toISOString(),
        reason,
        status: 'Released',
        createdAt: new Date().toISOString(),
      });
    }
    saveToLocal(STORAGE_KEYS.IP_HISTORY, histories);

    if (networkId) recalculateNetworkCounts(networkId);

    return {
      success: true,
      message: `Đã thu hồi thành công IP ${releasedIp} từ thiết bị ${device.deviceCode}. IP hiện đã chuyển về Available.`,
    };
  },

  // Thay đổi IP tĩnh của thiết bị
  changeStaticIp: async (params: {
    deviceId: string;
    newIpAddressId: string;
    newNetworkId: string;
    reason: string;
    user: UserProfile;
  }): Promise<{ success: boolean; message: string }> => {
    const { deviceId, newIpAddressId, newNetworkId, reason, user } = params;

    // 1. Thu hồi IP cũ
    await ipAssignmentService.releaseStaticIp({
      deviceId,
      reason: `Thay đổi sang IP mới: ${reason}`,
      user,
    });

    // 2. Cấp phát IP mới
    return ipAssignmentService.assignStaticIp({
      deviceId,
      ipAddressId: newIpAddressId,
      networkId: newNetworkId,
      note: `Thay đổi IP mới: ${reason}`,
      user,
    });
  },

  // Lấy lịch sử theo thiết bị
  getHistoryByDevice: async (deviceId: string): Promise<IpAssignmentHistory[]> => {
    const list = getFromLocal<IpAssignmentHistory[]>(STORAGE_KEYS.IP_HISTORY, INITIAL_IP_ASSIGNMENT_HISTORIES);
    return list.filter((h) => h.deviceId === deviceId);
  },

  // Lấy toàn bộ lịch sử có phân quyền
  getAllHistory: async (user?: UserProfile | null): Promise<IpAssignmentHistory[]> => {
    let list = getFromLocal<IpAssignmentHistory[]>(STORAGE_KEYS.IP_HISTORY, INITIAL_IP_ASSIGNMENT_HISTORIES);
    if (user && user.role === 'EquipmentManager' && user.departmentIds?.length > 0) {
      list = list.filter((h) => h.departmentId && user.departmentIds.includes(h.departmentId));
    }
    return list;
  },
};

// ==========================================
// 13. IPAM - DASHBOARD VÀ THỐNG KÊ (STATISTICS)
// ==========================================
export const ipamDashboardService = {
  getStatistics: async (user?: UserProfile | null) => {
    const networks = await ipNetworkService.getAll(user);
    const ips = await ipAddressService.getAll(undefined, user);

    const totalIps = ips.length;
    const availableCount = ips.filter((ip) => ip.status === 'Available').length;
    const assignedCount = ips.filter((ip) => ip.status === 'Assigned').length;
    const reservedCount = ips.filter((ip) => ip.status === 'Reserved').length;
    const blockedCount = ips.filter((ip) => ip.status === 'Blocked').length;
    const utilizationRate = totalIps > 0 ? Math.round((assignedCount / totalIps) * 100) : 0;

    // Thống kê theo Dải mạng
    const networkStats = networks.map((net) => {
      const netIps = ips.filter((ip) => ip.networkId === net.id);
      const netAssigned = netIps.filter((ip) => ip.status === 'Assigned').length;
      const netAvailable = netIps.filter((ip) => ip.status === 'Available').length;
      const netTotal = netIps.length;
      return {
        id: net.id,
        name: net.networkName,
        networkAddress: `${net.networkAddress}/${net.cidr}`,
        vlanId: net.vlanId || 0,
        total: netTotal,
        assigned: netAssigned,
        available: netAvailable,
        percent: netTotal > 0 ? Math.round((netAssigned / netTotal) * 100) : 0,
      };
    });

    // Thống kê theo VLAN
    const vlanMap = new Map<number, { vlanId: number; total: number; assigned: number }>();
    ips.forEach((ip) => {
      const vlan = ip.vlanId || 1;
      if (!vlanMap.has(vlan)) {
        vlanMap.set(vlan, { vlanId: vlan, total: 0, assigned: 0 });
      }
      const item = vlanMap.get(vlan)!;
      item.total += 1;
      if (ip.status === 'Assigned') item.assigned += 1;
    });
    const vlanStats = Array.from(vlanMap.values()).sort((a, b) => a.vlanId - b.vlanId);

    return {
      totalIps,
      availableCount,
      assignedCount,
      reservedCount,
      blockedCount,
      utilizationRate,
      networkStats,
      vlanStats,
    };
  },
};

// Hàm trợ giúp tính lại số đếm thống kê cho 1 dải mạng
const recalculateNetworkCounts = (networkId: string): void => {
  const networks = getFromLocal<IpNetwork[]>(STORAGE_KEYS.IP_NETWORKS, INITIAL_IP_NETWORKS);
  const ips = getFromLocal<IpAddress[]>(STORAGE_KEYS.IP_ADDRESSES, INITIAL_IP_ADDRESSES);

  const idx = networks.findIndex((n) => n.id === networkId);
  if (idx !== -1) {
    const netIps = ips.filter((ip) => ip.networkId === networkId);
    networks[idx].totalIps = netIps.length;
    networks[idx].availableCount = netIps.filter((ip) => ip.status === 'Available').length;
    networks[idx].assignedCount = netIps.filter((ip) => ip.status === 'Assigned').length;
    networks[idx].reservedCount = netIps.filter((ip) => ip.status === 'Reserved').length;
    networks[idx].blockedCount = netIps.filter((ip) => ip.status === 'Blocked').length;
    saveToLocal(STORAGE_KEYS.IP_NETWORKS, networks);
  }
};

