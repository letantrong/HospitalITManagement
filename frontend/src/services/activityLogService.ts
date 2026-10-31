import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { ActivityLog, ActivityAction, ActivityModule, UserProfile } from '../types';

/**
 * Ghi Activity Log vào Firestore
 * Đảm bảo Audit Log bất biến: Chỉ ghi mới, không có hàm update hoặc delete.
 */
export const logActivity = async (
  currentUser: UserProfile | null,
  action: ActivityAction,
  module: ActivityModule,
  description: string,
  targetId?: string,
  targetCode?: string
): Promise<void> => {
  try {
    const logData = {
      userId: currentUser?.id || 'anonymous',
      userEmail: currentUser?.email || 'unauthenticated',
      userName: currentUser?.displayName || 'Khách vãng lai',
      userRole: currentUser?.role || 'EquipmentManager',
      action,
      module,
      targetId: targetId || null,
      targetCode: targetCode || null,
      description,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: serverTimestamp(),
    };

    // Ghi vào Firestore collection activityLogs
    await addDoc(collection(db, 'activityLogs'), logData);
  } catch (error) {
    console.warn('Không thể ghi Activity Log vào Firestore (có thể đang ở chế độ offline/local):', error);
  }
};

/**
 * Lấy danh sách lịch sử hoạt động gần nhất
 */
export const fetchRecentActivityLogs = async (maxCount = 50): Promise<ActivityLog[]> => {
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  } catch (error) {
    console.warn('Không thể tải activity logs từ Firestore, trả về danh sách rỗng:', error);
    return [];
  }
};
