# Đặc tả Cơ sở Dữ liệu Cloud Firestore
**Hệ thống Quản lý Thiết bị CNTT - Bệnh viện Phục hồi chức năng Đồng Tháp**

---

## Danh sách 17 Collections Chính (Bao gồm Module IPAM)

### 1. `users`
Lưu thông tin hồ sơ người dùng đồng bộ từ Firebase Authentication UID.
```typescript
interface UserDocument {
  id: string;                    // Firebase Auth UID (Document ID = Auth UID)
  email: string;                 // Email đăng nhập (ví dụ: "nguyenvanan@bvphcndt.vn")
  displayName: string;           // Họ và tên cán bộ (ví dụ: "Nguyễn Văn An")
  phoneNumber?: string;          // Số điện thoại liên hệ
  role: 'Admin' | 'EquipmentManager'; // Vai trò bắt buộc (chỉ 2 vai trò)
  departmentIds: string[];       // Danh sách ID phòng ban mà Manager được phân công quản lý (với Admin để rỗng hoặc mang nghĩa toàn viện)
  isActive: boolean;             // Trạng thái kích hoạt tài khoản
  avatarUrl?: string;            // Ảnh đại diện trên Firebase Storage
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastLoginAt?: FirebaseFirestore.Timestamp;
}
```

### 2. `departments`
Danh sách các Khoa, Phòng ban chức năng trong Bệnh viện Phục hồi chức năng Đồng Tháp.
```typescript
interface DepartmentDocument {
  id: string;                    // Document ID (ví dụ: "K-KCB", "P-CNTT", "K-PHCN")
  code: string;                  // Mã viết tắt (ví dụ: "KCB", "CNTT", "K-VLTL")
  name: string;                  // Tên khoa phòng (ví dụ: "Khoa Khám bệnh", "Phòng Kế hoạch Tổng hợp")
  description?: string;          // Mô tả chức năng
  headOfDepartment?: string;     // Tên trưởng khoa / phụ trách
  phoneContact?: string;         // Số điện thoại nội bộ
  isActive: boolean;             // Còn hoạt động hay không
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3. `deviceCategories`
Phân loại chuẩn các trang thiết bị CNTT trong bệnh viện.
```typescript
interface DeviceCategoryDocument {
  id: string;                    // Document ID (ví dụ: "CAT-PC", "CAT-PRINTER", "CAT-SERVER")
  code: string;                  // Mã phân loại (ví dụ: "PC", "PRINTER", "SWITCH", "SCANNER")
  name: string;                  // Tên danh mục (ví dụ: "Máy vi tính để bàn", "Máy in laser", "Thiết bị Mạng")
  defaultDepreciationYears: number; // Thời hạn khấu hao tiêu chuẩn (năm)
  description?: string;
  iconName?: string;             // Tên icon MUI minh họa
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 4. `locations`
Vị trí vật lý cụ thể đặt thiết bị (Tòa nhà, Tầng, Phòng bệnh, Phòng làm việc, Kho lưu trữ).
```typescript
interface LocationDocument {
  id: string;                    // Document ID (ví dụ: "LOC-A101", "LOC-KHO-CNTT")
  code: string;                  // Mã vị trí
  name: string;                  // Tên phòng/vị trí (ví dụ: "Phòng Xử lý dữ liệu HIS Tầng 2 - Nhà A")
  building: string;              // Tòa nhà (Khu A, Khu B, Khu Hành chính)
  floor: string;                 // Tầng (Tầng 1, Tầng 2, Tầng trệt)
  departmentId: string;          // Thuộc quyền quản lý của Phòng ban nào (Foreign Key -> departments.id)
  departmentName?: string;       // Snapshot tên phòng ban để tiết kiệm query
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 5. `devices`
Cơ sở dữ liệu chi tiết từng tài sản thiết bị CNTT.
```typescript
interface DeviceDocument {
  id: string;                    // Document ID (tự động sinh hoặc theo Device Code)
  deviceCode: string;            // Mã thiết bị duy nhất bệnh viện (ví dụ: "BVPHCN-MT-2026-0042")
  name: string;                  // Tên thiết bị (ví dụ: "Máy tính để bàn HP ProDesk 400 G7")
  categoryId: string;            // Thuộc danh mục nào (FK -> deviceCategories.id)
  categoryName: string;          // Snapshot tên danh mục
  departmentId: string;          // Đang thuộc khoa/phòng nào (FK -> departments.id)
  departmentName: string;        // Snapshot tên khoa/phòng
  locationId: string;            // Vị trí lắp đặt cụ thể (FK -> locations.id)
  locationName: string;          // Snapshot tên vị trí
  
  serialNumber: string;          // Số Serial nhà sản xuất
  model: string;                 // Model sản phẩm
  manufacturer: string;          // Hãng sản xuất (Dell, HP, Canon, Cisco...)
  specifications: {              // Cấu hình chi tiết
    cpu?: string;                // Ví dụ: "Intel Core i5-11400"
    ram?: string;                // Ví dụ: "16GB DDR4"
    storage?: string;            // Ví dụ: "SSD 512GB NVMe"
    os?: string;                 // Ví dụ: "Windows 11 Pro"
    ipAddress?: string;          // Ví dụ: "192.168.1.150"
    macAddress?: string;         // Ví dụ: "AA:BB:CC:DD:EE:FF"
    others?: string;
  };

  status: 'InUse' | 'Storage' | 'UnderMaintenance' | 'Broken' | 'Disposed';
  condition: 'Good' | 'Fair' | 'Poor' | 'Unusable'; // Tình trạng hoạt động hiện tại
  
  assignedUser?: {               // Cán bộ bệnh viện trực tiếp sử dụng
    name: string;
    phone?: string;
    position?: string;
  };

  purchaseDate: FirebaseFirestore.Timestamp; // Ngày đưa vào sử dụng
  warrantyExpiryDate?: FirebaseFirestore.Timestamp; // Ngày hết hạn bảo hành
  originalCost: number;          // Nguyên giá ban đầu (VNĐ)
  depreciationRate: number;      // Tỷ lệ khấu hao mỗi năm (%)
  
  qrCodeId: string;              // Mã liên kết tới collection qrCodes
  qrCodeToken: string;           // Token bảo mật ngẫu nhiên chống giả mạo
  
  imageUrls: string[];           // Danh sách ảnh chụp thiết bị trên Firebase Storage
  documents: {                   // Tài liệu đi kèm (hướng dẫn, hóa đơn...)
    title: string;
    fileUrl: string;
  }[];

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;             // UID người tạo
}
```

### 6. `qrCodes`
Bảng quản lý mã QR bệnh viện, hỗ trợ xác thực token an toàn, chống quét mò document ID.
```typescript
interface QRCodeDocument {
  id: string;                    // QR Code ID
  deviceId: string;              // FK -> devices.id
  deviceCode: string;            // Mã thiết bị in trên tem
  token: string;                 // Chuỗi Hash bảo mật duy nhất (UUID/SHA256)
  qrDataString: string;          // Dữ liệu mã hóa chứa trong mã QR (ví dụ: "BVPHCNDT://DEV/token")
  printCount: number;            // Số lần đã in tem
  lastPrintedAt?: FirebaseFirestore.Timestamp;
  isActive: boolean;             // Khi thiết bị hủy hoặc đổi tem thì vô hiệu hóa
  createdAt: FirebaseFirestore.Timestamp;
  createdBy: string;
}
```

### 7. `inventorySessions`
Đợt kiểm kê tài sản do Admin khởi tạo.
```typescript
interface InventorySessionDocument {
  id: string;                    // Document ID (ví dụ: "INV-2026-Q1")
  title: string;                 // Tiêu đề (ví dụ: "Kiểm kê Định kỳ Tài sản CNTT Quý 1/2026")
  scope: 'HospitalWide' | 'DepartmentSpecific'; // Phạm vi kiểm kê
  targetDepartmentIds: string[]; // Các khoa phòng nằm trong đợt kiểm kê
  startDate: FirebaseFirestore.Timestamp;
  endDate: FirebaseFirestore.Timestamp;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  
  // Số liệu tổng hợp thống kê thời gian thực
  summary: {
    totalExpected: number;       // Tổng thiết bị trên sổ sách tại thời điểm snapshot
    totalScanned: number;        // Tổng thiết bị đã quét
    totalMatched: number;        // Đúng khoa & vị trí
    totalMisplaced: number;      // Tìm thấy nhưng sai vị trí/khoa
    totalMissing: number;        // Chưa tìm thấy / thất thoát
    totalDamaged: number;        // Hỏng hóc phát hiện khi kiểm kê
    totalSurplus: number;        // Thiết bị thừa / không có trong sổ ban đầu
  };
  
  notes?: string;
  createdBy: string;             // UID Admin tạo đợt
  createdAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
}
```

### 8. `inventoryItems`
Chi tiết từng mục kiểm kê trong phiên, lưu trữ **Snapshot tại thời điểm bắt đầu**.
```typescript
interface InventoryItemDocument {
  id: string;                    // Document ID
  sessionId: string;             // FK -> inventorySessions.id
  deviceId: string;              // FK -> devices.id
  deviceCode: string;
  deviceName: string;
  
  // Dữ liệu kỳ vọng lúc bắt đầu kiểm kê (Snapshot)
  expectedDepartmentId: string;
  expectedDepartmentName: string;
  expectedLocationId: string;
  expectedLocationName: string;
  expectedStatus: string;
  
  // Kết quả thực tế sau khi quét QR
  isScanned: boolean;
  scannedAt?: FirebaseFirestore.Timestamp;
  scannedBy?: string;            // UID người quét
  scannedByName?: string;
  
  actualDepartmentId?: string;
  actualDepartmentName?: string;
  actualLocationId?: string;
  actualLocationName?: string;
  actualCondition?: 'Good' | 'Fair' | 'Poor' | 'Unusable';
  
  resultStatus: 'Pending' | 'Matched' | 'Misplaced' | 'Damaged' | 'Surplus' | 'Missing';
  notes?: string;
  imageProofUrls?: string[];     // Ảnh chụp hiện trường nếu phát hiện sai hoặc hỏng
}
```

### 9. `maintenanceRecords`
Hồ sơ theo dõi bảo dưỡng, báo hỏng và sửa chữa thiết bị.
```typescript
interface MaintenanceRecordDocument {
  id: string;                    // Document ID (ví dụ: "MAINT-2026-0012")
  deviceId: string;              // FK -> devices.id
  deviceCode: string;
  deviceName: string;
  departmentId: string;          // Khoa sở hữu thiết bị
  departmentName: string;
  
  ticketType: 'IssueReport' | 'RoutineMaintenance' | 'WarrantyRepair';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency'; // Mức độ ưu tiên
  
  reportedBy: string;            // UID người gửi yêu cầu
  reportedByName: string;
  reportedAt: FirebaseFirestore.Timestamp;
  issueDescription: string;      // Mô tả lỗi / triệu chứng sự cố
  issueImageUrls?: string[];     // Ảnh chụp màn hình lỗi hoặc thân máy
  
  status: 'Pending' | 'InProgress' | 'Completed' | 'Rejected' | 'TransferredToVendor';
  assignedTechnician?: {
    name: string;
    phone?: string;
    unit: 'InternalIT' | 'ExternalVendor';
  };
  
  resolutionDetails?: string;    // Biện pháp xử lý / sửa chữa
  replacementParts?: {           // Linh kiện thay thế
    partName: string;
    quantity: number;
    unitPrice: number;
    warrantyMonths: number;
  }[];
  cost: number;                  // Chi phí sửa chữa (VNĐ)
  
  startedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  acceptedBy?: string;           // Cán bộ khoa phòng nghiệm thu
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 10. `transferRecords`
Hồ sơ điều chuyển tài sản giữa các Khoa / Phòng ban trong bệnh viện.
```typescript
interface TransferRecordDocument {
  id: string;                    // Document ID (ví dụ: "TRANS-2026-0005")
  deviceId: string;              // FK -> devices.id
  deviceCode: string;
  deviceName: string;
  
  fromDepartmentId: string;      // Khoa chuyển đi
  fromDepartmentName: string;
  fromLocationId: string;
  fromLocationName: string;
  
  toDepartmentId: string;        // Khoa tiếp nhận
  toDepartmentName: string;
  toLocationId: string;
  toLocationName: string;
  
  reason: string;                // Lý do điều chuyển (ví dụ: "Bổ sung máy tra cứu cho Khoa Khám bệnh")
  status: 'PendingApproval' | 'Approved' | 'Completed' | 'Rejected';
  
  requestedBy: string;           // UID người đề xuất
  requestedByName: string;
  requestedAt: FirebaseFirestore.Timestamp;
  
  approvedBy?: string;           // UID Admin phê duyệt
  approvedByName?: string;
  approvedAt?: FirebaseFirestore.Timestamp;
  
  transferDate?: FirebaseFirestore.Timestamp;
  handoverAttachmentUrl?: string;// Scan biên bản bàn giao có chữ ký 2 bên
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 11. `activityLogs`
Nhật ký hoạt động bất biến (Audit Log) - Chỉ cho phép tạo (Create), tuyệt đối không thể Update hoặc Delete.
```typescript
interface ActivityLogDocument {
  id: string;                    // Document ID
  userId: string;                // UID người thực hiện
  userEmail: string;
  userName: string;
  userRole: 'Admin' | 'EquipmentManager';
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_DEVICE' | 'UPDATE_DEVICE' | 'DELETE_DEVICE' |
          'SCAN_QR' | 'START_INVENTORY' | 'SCAN_INVENTORY' | 'FINISH_INVENTORY' |
          'CREATE_MAINTENANCE' | 'UPDATE_MAINTENANCE' | 'CREATE_TRANSFER' | 'APPROVE_TRANSFER';
  module: 'AUTH' | 'DEVICE' | 'QR' | 'INVENTORY' | 'MAINTENANCE' | 'TRANSFER' | 'USER' | 'SETTINGS';
  targetId?: string;             // ID của đối tượng chịu tác động
  targetCode?: string;           // Mã thiết bị / mã đợt
  description: string;           // Mô tả chi tiết hành động
  ipAddress?: string;
  userAgent?: string;
  timestamp: FirebaseFirestore.Timestamp;
}
```

### 12. `systemSettings`
Cấu hình tham số hệ thống dùng chung cho bệnh viện.
```typescript
interface SystemSettingDocument {
  id: 'general' | 'notification' | 'qrTemplate';
  hospitalName: string;          // "Bệnh viện Phục hồi chức năng Đồng Tháp"
  address: string;               // "Số 01, Đường Lê Duẩn, TP. Cao Lãnh, Đồng Tháp"
  contactPhone: string;
  itHotline: string;             // Số hotline đội CNTT
  defaultCurrency: string;       // "VND"
  qrPrefix: string;              // "BVPHCN"
  autoDepreciationCalculation: boolean;
  maintenanceAlertDaysBefore: number; // Cảnh báo trước hạn bảo dưỡng (ngày)
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy: string;
}
```

---

## CÁC COLLECTIONS QUẢN LÝ ĐỊA CHỈ IP TĨNH (IPAM)

### 13. `ipNetworks`
Lưu trữ thông tin các dải mạng nội bộ (Subnets / VLANs) của Bệnh viện Phục hồi chức năng Đồng Tháp.
```typescript
interface IpNetworkDocument {
  id: string;                    // Document ID (ví dụ: "NET-LAN-KCB-001")
  networkName: string;           // Tên gợi nhớ (ví dụ: "Mạng Khoa Khám bệnh - Tầng 1")
  networkAddress: string;        // Địa chỉ mạng IPv4 (ví dụ: "192.168.10.0")
  cidr: number;                  // Tiền tố mạng (ví dụ: 24)
  subnetMask: string;            // Mặt nạ mạng (ví dụ: "255.255.255.0")
  gateway: string;               // Cổng mặc định Default Gateway (ví dụ: "192.168.10.1")
  dnsPrimary: string;            // DNS chính (ví dụ: "192.168.1.1" hoặc "8.8.8.8")
  dnsSecondary?: string;         // DNS dự phòng (ví dụ: "8.8.4.4")
  vlanId?: number;               // Phân vùng mạng ảo (ví dụ: 10, 20, 30)
  departmentIds: string[];       // Danh sách ID khoa phòng liên kết sử dụng dải mạng này
  locationIds?: string[];        // Vị trí địa lý lắp đặt tủ Switch/Router
  description?: string;          // Ghi chú mục đích sử dụng
  status: 'Active' | 'Inactive'; // Hoạt động hoặc ngừng sử dụng
  totalIps: number;              // Tổng số IP khả dụng trong dải mạng
  availableCount: number;        // Số IP còn trống
  assignedCount: number;         // Số IP đã cấp phát cho thiết bị
  reservedCount: number;         // Số IP đang giữ chỗ
  blockedCount: number;          // Số IP bị khóa bảo mật
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;             // UID Admin tạo dải mạng
}
```

### 14. `ipAddresses`
Lưu trữ từng địa chỉ IP cụ thể thuộc các dải mạng, trạng thái cấp phát và liên kết thiết bị.
```typescript
interface IpAddressDocument {
  id: string;                    // Document ID (ví dụ: "NET-LAN-KCB-001_192-168-10-15")
  ipAddress: string;             // Địa chỉ IPv4 (ví dụ: "192.168.10.15")
  ipNumber: number;              // Biểu diễn số nguyên 32-bit (hỗ trợ sắp xếp và đối soát nhanh)
  networkId: string;             // FK -> ipNetworks.id
  networkName: string;           // Tên dải mạng
  vlanId?: number;               // VLAN tương ứng
  departmentIds: string[];       // Kế thừa từ dải mạng
  status: 'Available' | 'Reserved' | 'Assigned' | 'Blocked';
  
  // Thông tin liên kết khi được cấp phát cho thiết bị
  deviceId?: string;             // FK -> devices.id
  deviceCode?: string;           // Mã thiết bị (ví dụ: "BVPHCN-MT-2026-0001")
  deviceName?: string;           // Tên thiết bị
  departmentName?: string;       // Khoa phòng đang đặt máy
  assignedAt?: FirebaseFirestore.Timestamp;
  assignedBy?: string;           // UID Admin cấp phát
  assignedByName?: string;
  
  reservedReason?: string;       // Lý do giữ chỗ (nếu status = 'Reserved')
  note?: string;                 // Ghi chú bảo mật / cấu hình
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}
```

### 15. `ipAssignmentHistory`
Lưu trữ lịch sử cấp phát, thu hồi và chuyển đổi địa chỉ IP bất biến (Immutable Audit Trail). Không cho phép sửa hay xóa.
```typescript
interface IpAssignmentHistoryDocument {
  id: string;                    // Document ID (ví dụ: "HIST-202610-001")
  ipAddressId: string;           // ID bản ghi IP
  ipAddress: string;             // Địa chỉ IPv4
  networkId: string;
  networkName: string;
  vlanId?: number;
  
  deviceId: string;              // FK -> devices.id
  deviceCode: string;            // Giữ nguyên thông tin ngay cả khi máy bị đổi tên
  deviceName: string;
  departmentId?: string;
  departmentName?: string;
  
  action: 'ASSIGN' | 'RELEASE' | 'CHANGE';
  assignedBy?: string;           // UID người thực hiện cấp phát
  assignedByName?: string;
  assignedAt?: FirebaseFirestore.Timestamp;
  
  releasedBy?: string;           // UID người thực hiện thu hồi
  releasedByName?: string;
  releasedAt?: FirebaseFirestore.Timestamp;
  
  reason: string;                // Lý do cấp phát hoặc thu hồi
  status: 'Active' | 'Released'; // Trạng thái của phiên gán IP này
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 16. `ipExclusions`
Danh sách các địa chỉ IP hoặc dải IP loại trừ không được đưa vào danh sách cấp phát tự động (IP tĩnh máy chủ Core, Firewall, thiết bị y tế chuyên dụng).
```typescript
interface IpExclusionDocument {
  id: string;
  networkId: string;
  startIp: string;
  endIp: string;
  reason: string;                // Ví dụ: "Dành riêng cho Firewall FortiGate và Core Switch"
  createdAt: FirebaseFirestore.Timestamp;
  createdBy: string;
}
```

### 17. `ipAuditLogs`
Nhật ký kiểm toán an ninh mạng riêng cho module IPAM (chống tấn công thay đổi cấu hình trái phép).
```typescript
interface IpAuditLogDocument {
  id: string;
  action: 'CREATE_NETWORK' | 'UPDATE_NETWORK' | 'ASSIGN_IP' | 'RELEASE_IP' | 'CHANGE_IP' | 'RESERVE_IP' | 'BLOCK_IP' | 'UNBLOCK_IP';
  performedBy: string;           // UID
  performedByName: string;
  role: 'Admin';
  details: string;
  timestamp: FirebaseFirestore.Timestamp;
}
```
