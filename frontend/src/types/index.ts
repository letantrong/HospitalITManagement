/**
 * ĐỊNH NGHĨA TYPESCRIPT CHO TOÀN BỘ HỆ THỐNG QUẢN LÝ THIẾT BỊ CNTT
 * Bệnh viện Phục hồi chức năng Đồng Tháp
 */

// 1. Phân quyền người dùng (chỉ 2 vai trò)
export type UserRole = 'Admin' | 'EquipmentManager';

export interface UserProfile {
  id: string; // Auth UID
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  departmentIds: string[]; // Các khoa/phòng mà Manager phụ trách
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

// 2. Khoa / Phòng ban
export interface Department {
  id: string;
  code: string; // VD: KCB, CNTT, VLTL
  name: string;
  description?: string;
  headOfDepartment?: string;
  phoneContact?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// 3. Danh mục thiết bị
export interface DeviceCategory {
  id: string;
  code: string; // PC, PRINTER, SWITCH, SCANNER, UPS...
  name: string;
  defaultDepreciationYears: number; // Số năm khấu hao
  description?: string;
  iconName?: string;
  createdAt?: any;
  updatedAt?: any;
}

// 4. Vị trí vật lý
export interface Location {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  departmentId: string;
  departmentName?: string;
  createdAt?: any;
  updatedAt?: any;
}

// 5. Trạng thái và Tình trạng thiết bị
export type DeviceStatus = 'InUse' | 'Storage' | 'UnderMaintenance' | 'Broken' | 'Disposed';
export type DeviceCondition = 'Good' | 'Fair' | 'Poor' | 'Unusable';

export interface DeviceSpecifications {
  cpu?: string;
  ram?: string;
  storage?: string;
  os?: string;
  ipAddress?: string;
  macAddress?: string;
  others?: string;
}

export interface DeviceAttachment {
  title: string;
  fileUrl: string;
}

export interface Device {
  id: string;
  deviceCode: string; // Mã quản lý: BVPHCN-MT-2026-0001
  name: string;
  categoryId: string;
  categoryName: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  
  serialNumber: string;
  model: string;
  manufacturer: string;
  specifications: DeviceSpecifications;
  
  status: DeviceStatus;
  condition: DeviceCondition;
  
  assignedUser?: {
    name: string;
    phone?: string;
    position?: string;
  };
  
  purchaseDate: string | any;
  warrantyExpiryDate?: string | any;
  originalCost: number; // Nguyên giá VNĐ
  depreciationRate: number; // % / năm
  
  qrCodeId?: string;
  qrCodeToken?: string;
  
  imageUrls: string[];
  documents: DeviceAttachment[];
  macAddress?: string;
  
  // Thông tin IP tĩnh (IPAM)
  assignedIpId?: string;
  assignedIpAddress?: string;
  networkId?: string;
  networkName?: string;
  subnetMask?: string;
  gateway?: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
  vlanId?: number;
  ipAssignedAt?: any;
  ipAssignedBy?: string;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

// 6. Mã QR
export interface QRCodeItem {
  id: string;
  deviceId: string;
  deviceCode: string;
  token: string;
  qrDataString: string;
  printCount: number;
  lastPrintedAt?: any;
  isActive: boolean;
  createdAt?: any;
  createdBy?: string;
}

// 7. Phiên kiểm kê (Inventory Session)
export type InventorySessionScope = 'HospitalWide' | 'DepartmentSpecific';
export type InventorySessionStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface InventorySession {
  id: string;
  title: string;
  scope: InventorySessionScope;
  targetDepartmentIds: string[];
  startDate: string | any;
  endDate: string | any;
  status: InventorySessionStatus;
  
  summary: {
    totalExpected: number;
    totalScanned: number;
    totalMatched: number;
    totalMisplaced: number;
    totalMissing: number;
    totalDamaged: number;
    totalSurplus: number;
  };
  
  notes?: string;
  createdBy: string;
  createdAt?: any;
  completedAt?: any;
}

// 8. Chi tiết kiểm kê từng thiết bị (Inventory Item)
export type InventoryResultStatus = 'Pending' | 'Matched' | 'Misplaced' | 'Damaged' | 'Surplus' | 'Missing';

export interface InventoryItem {
  id: string;
  sessionId: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  
  // Dữ liệu Snapshot sổ sách ban đầu
  expectedDepartmentId: string;
  expectedDepartmentName: string;
  expectedLocationId: string;
  expectedLocationName: string;
  expectedStatus: string;
  
  // Quét thực tế
  isScanned: boolean;
  scannedAt?: any;
  scannedBy?: string;
  scannedByName?: string;
  
  actualDepartmentId?: string;
  actualDepartmentName?: string;
  actualLocationId?: string;
  actualLocationName?: string;
  actualCondition?: DeviceCondition;
  
  resultStatus: InventoryResultStatus;
  notes?: string;
  imageProofUrls?: string[];
}

// 9. Hồ sơ bảo trì & sửa chữa (Maintenance Record)
export type TicketType = 'IssueReport' | 'RoutineMaintenance' | 'WarrantyRepair';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type TicketStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected' | 'TransferredToVendor';

export interface ReplacementPart {
  partName: string;
  quantity: number;
  unitPrice: number;
  warrantyMonths: number;
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  departmentId: string;
  departmentName: string;
  
  ticketType: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  
  reportedBy: string;
  reportedByName: string;
  reportedAt: any;
  issueDescription: string;
  issueImageUrls?: string[];
  
  assignedTechnician?: {
    name: string;
    phone?: string;
    unit: 'InternalIT' | 'ExternalVendor';
  };
  
  resolutionDetails?: string;
  replacementParts?: ReplacementPart[];
  cost: number;
  
  startedAt?: any;
  completedAt?: any;
  acceptedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

// 10. Hồ sơ điều chuyển (Transfer Record)
export type TransferStatus = 'PendingApproval' | 'Approved' | 'Completed' | 'Rejected';

export interface TransferRecord {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  
  fromDepartmentId: string;
  fromDepartmentName: string;
  fromLocationId: string;
  fromLocationName: string;
  
  toDepartmentId: string;
  toDepartmentName: string;
  toLocationId: string;
  toLocationName: string;
  
  reason: string;
  status: TransferStatus;
  
  requestedBy: string;
  requestedByName: string;
  requestedAt: any;
  
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: any;
  
  transferDate?: any;
  handoverAttachmentUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

// 11. Nhật ký hoạt động bất biến (Activity Log)
export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_DEVICE'
  | 'UPDATE_DEVICE'
  | 'DELETE_DEVICE'
  | 'SCAN_QR'
  | 'START_INVENTORY'
  | 'SCAN_INVENTORY'
  | 'FINISH_INVENTORY'
  | 'CREATE_MAINTENANCE'
  | 'UPDATE_MAINTENANCE'
  | 'CREATE_TRANSFER'
  | 'APPROVE_TRANSFER'
  | 'CREATE_NETWORK'
  | 'UPDATE_NETWORK'
  | 'RESERVE_IP'
  | 'BLOCK_IP'
  | 'UNBLOCK_IP'
  | 'ASSIGN_IP'
  | 'RELEASE_IP'
  | 'CHANGE_IP';

export type ActivityModule =
  | 'AUTH'
  | 'DEVICE'
  | 'QR'
  | 'INVENTORY'
  | 'MAINTENANCE'
  | 'TRANSFER'
  | 'USER'
  | 'SETTINGS'
  | 'IPAM';

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: ActivityAction;
  module: ActivityModule;
  targetId?: string;
  targetCode?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
}

// 12. Cấu hình hệ thống (System Settings)
export interface SystemSettings {
  id: string;
  hospitalName: string;
  address: string;
  contactPhone: string;
  itHotline: string;
  defaultCurrency: string;
  qrPrefix: string;
  autoDepreciationCalculation: boolean;
  maintenanceAlertDaysBefore: number;
  updatedAt?: any;
  updatedBy?: string;
}

// ============================================================================
// 13. MODULE QUẢN LÝ ĐỊA CHỈ IP TĨNH (IP ADDRESS MANAGEMENT - IPAM)
// ============================================================================

export type IpNetworkStatus = 'Active' | 'Inactive';
export type IpAddressStatus = 'Available' | 'Reserved' | 'Assigned' | 'Blocked';

export interface IpNetwork {
  id: string; // networkId
  networkName: string;
  networkAddress: string; // ví dụ: "192.168.10.0"
  cidr: number; // ví dụ: 24, 25, 26
  subnetMask: string; // ví dụ: "255.255.255.0"
  gateway: string; // ví dụ: "192.168.10.1"
  dnsPrimary: string; // ví dụ: "192.168.1.10"
  dnsSecondary?: string; // ví dụ: "8.8.8.8"
  vlanId?: number; // ví dụ: 10, 20
  departmentIds: string[]; // Một dải mạng liên kết với một hoặc nhiều phòng ban
  locationIds?: string[];
  description?: string;
  status: IpNetworkStatus;
  
  // Số liệu thống kê bộ đếm IP
  totalIps: number;
  availableCount: number;
  assignedCount: number;
  reservedCount: number;
  blockedCount: number;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface IpAddress {
  id: string; // ipAddressId (thường dùng định dạng: `${networkId}_${ip.replace(/\./g, '-')}`)
  ipAddress: string; // ví dụ: "192.168.10.45"
  ipNumber: number; // Số nguyên 32-bit chuyển đổi từ IPv4 phục vụ so sánh và sắp xếp
  networkId: string;
  networkName?: string;
  vlanId?: number;
  departmentIds?: string[];
  status: IpAddressStatus;
  
  // Thông tin thiết bị được gán
  deviceId?: string;
  deviceCode?: string;
  deviceName?: string;
  departmentName?: string;
  assignedAt?: any;
  assignedBy?: string;
  assignedByName?: string;
  
  reservedReason?: string;
  note?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface IpAssignmentHistory {
  id: string;
  ipAddressId: string;
  ipAddress: string;
  networkId: string;
  networkName?: string;
  vlanId?: number;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  departmentId?: string;
  departmentName?: string;
  action: 'ASSIGN' | 'RELEASE' | 'CHANGE';
  assignedBy: string;
  assignedByName?: string;
  assignedAt: any;
  releasedBy?: string;
  releasedByName?: string;
  releasedAt?: any;
  reason?: string;
  status: 'Active' | 'Released';
  createdAt?: any;
}

export interface IpExclusion {
  id: string;
  networkId: string;
  ipAddressOrRange: string;
  reason: string;
  createdAt?: any;
  createdBy?: string;
}

export interface IpAuditLog {
  id: string;
  action:
    | 'CREATE_NETWORK'
    | 'UPDATE_NETWORK'
    | 'GENERATE_IPS'
    | 'RESERVE_IP'
    | 'BLOCK_IP'
    | 'UNBLOCK_IP'
    | 'ASSIGN_IP'
    | 'RELEASE_IP'
    | 'CHANGE_IP';
  networkId?: string;
  ipAddress?: string;
  deviceId?: string;
  userId: string;
  userEmail?: string;
  userName: string;
  userRole: UserRole;
  details: string;
  timestamp: any;
}
