import dayjs from 'dayjs';
import type { DeviceStatus, DeviceCondition, TicketStatus, TicketPriority } from '../types';

/**
 * Định dạng tiền tệ Việt Nam Đồng (VNĐ)
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Định dạng ngày tháng hiển thị chuẩn Việt Nam
 */
export const formatDate = (date: any, includeTime = false): string => {
  if (!date) return '-';
  
  // Xử lý Firebase Timestamp
  let d: dayjs.Dayjs;
  if (date?.toDate && typeof date.toDate === 'function') {
    d = dayjs(date.toDate());
  } else if (date?.seconds) {
    d = dayjs(date.seconds * 1000);
  } else {
    d = dayjs(date);
  }

  if (!d.isValid()) return '-';
  return d.format(includeTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
};

/**
 * Tính giá trị còn lại sau khấu hao của thiết bị
 */
export const calculateRemainingValue = (
  originalCost: number,
  purchaseDate: any,
  depreciationRate: number // % / năm
): { remainingValue: number; usedYears: number; isFullyDepreciated: boolean } => {
  if (!originalCost || !purchaseDate) {
    return { remainingValue: originalCost || 0, usedYears: 0, isFullyDepreciated: false };
  }

  let pDate: dayjs.Dayjs;
  if (purchaseDate?.toDate) {
    pDate = dayjs(purchaseDate.toDate());
  } else if (purchaseDate?.seconds) {
    pDate = dayjs(purchaseDate.seconds * 1000);
  } else {
    pDate = dayjs(purchaseDate);
  }

  const now = dayjs();
  const monthsDiff = now.diff(pDate, 'month');
  const usedYears = Math.max(0, monthsDiff / 12);

  const annualDepreciation = (originalCost * (depreciationRate || 10)) / 100;
  const totalDepreciation = annualDepreciation * usedYears;
  const remainingValue = Math.max(0, originalCost - totalDepreciation);

  return {
    remainingValue: Math.round(remainingValue),
    usedYears: Number(usedYears.toFixed(1)),
    isFullyDepreciated: remainingValue <= 0,
  };
};

/**
 * Nhãn và màu sắc cho Trạng thái thiết bị
 */
export const getDeviceStatusMeta = (status: DeviceStatus): { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' } => {
  switch (status) {
    case 'InUse':
      return { label: 'Đang sử dụng', color: 'success' };
    case 'Storage':
      return { label: 'Trong kho', color: 'info' };
    case 'UnderMaintenance':
      return { label: 'Đang bảo trì', color: 'warning' };
    case 'Broken':
      return { label: 'Bị hỏng', color: 'error' };
    case 'Disposed':
      return { label: 'Đã thanh lý', color: 'default' };
    default:
      return { label: status, color: 'default' };
  }
};

/**
 * Nhãn và màu sắc cho Tình trạng thiết bị
 */
export const getDeviceConditionMeta = (condition: DeviceCondition): { label: string; color: 'success' | 'info' | 'warning' | 'error' } => {
  switch (condition) {
    case 'Good':
      return { label: 'Tốt (100%)', color: 'success' };
    case 'Fair':
      return { label: 'Bình thường', color: 'info' };
    case 'Poor':
      return { label: 'Kém / Cần bảo dưỡng', color: 'warning' };
    case 'Unusable':
      return { label: 'Không sử dụng được', color: 'error' };
    default:
      return { label: condition, color: 'info' };
  }
};

/**
 * Nhãn trạng thái phiếu bảo trì
 */
export const getTicketStatusMeta = (status: TicketStatus): { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' } => {
  switch (status) {
    case 'Pending':
      return { label: 'Chờ tiếp nhận', color: 'warning' };
    case 'InProgress':
      return { label: 'Đang sửa chữa', color: 'info' };
    case 'Completed':
      return { label: 'Hoàn thành', color: 'success' };
    case 'Rejected':
      return { label: 'Từ chối', color: 'error' };
    case 'TransferredToVendor':
      return { label: 'Gửi hãng bảo hành', color: 'default' };
    default:
      return { label: status, color: 'default' };
  }
};

/**
 * Mức độ ưu tiên sự cố
 */
export const getPriorityMeta = (priority: TicketPriority): { label: string; color: 'default' | 'info' | 'warning' | 'error' } => {
  switch (priority) {
    case 'Low':
      return { label: 'Thấp', color: 'default' };
    case 'Medium':
      return { label: 'Trung bình', color: 'info' };
    case 'High':
      return { label: 'Cao', color: 'warning' };
    case 'Emergency':
      return { label: 'Khẩn cấp (Y tế)', color: 'error' };
    default:
      return { label: priority, color: 'default' };
  }
};
