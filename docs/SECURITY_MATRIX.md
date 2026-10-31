# Ma trận Bảo mật & Điều kiện Firestore Security Rules
**HospitalITManagement – Bệnh viện Phục hồi chức năng Đồng Tháp**

---

## 1. Nguyên tắc Căn bản (Security Principles)

1. **Least Privilege (Đặc quyền tối thiểu)**: Mọi request đều bị từ chối mặc định (`allow read, write: if false;`). Chỉ mở quyền khi thỏa mãn điều kiện xác thực.
2. **Không tin tưởng dữ liệu Client**:
   - `role` phải được kiểm tra từ `request.auth.token.role` (Custom Claims) hoặc qua hàm tra cứu bảo mật `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role`.
   - `departmentIds` của EquipmentManager phải được xác thực đối với `resource.data.departmentId`.
3. **Audit Log bất biến (Append-only)**:
   - Cho phép `create` nếu đã đăng nhập.
   - Cấm hoàn toàn `update` và `delete`.
4. **Ngăn chặn giả mạo Token QR Code**:
   - Truy vấn qua collection `qrCodes` bằng cả `deviceId` và `token`.
   - Người lạ (unauthenticated) không thể đọc danh sách thiết bị.

---

## 2. Chi tiết Quyền truy cập theo Collection

| Collection | Unauthenticated | EquipmentManager | Admin | Ghi chú điều kiện |
|---|:---:|:---:|:---:|---|
| **users** | Deny | Đọc profile chính mình | Toàn quyền CRUD | Manager không thể sửa `role` hoặc `departmentIds` |
| **departments** | Deny | Read Only | Toàn quyền CRUD | Manager chỉ đọc danh sách để hiển thị tên khoa |
| **deviceCategories** | Deny | Read Only | Toàn quyền CRUD | Danh mục dùng chung toàn viện |
| **locations** | Deny | Read (khoa mình) | Toàn quyền CRUD | Manager chỉ đọc vị trí thuộc khoa mình |
| **devices** | Deny | Read/Update (khoa mình) | Toàn quyền CRUD | Manager không thể tự ý xóa thiết bị hoặc đổi sang khoa khác |
| **qrCodes** | Deny | Read/Create (khoa mình) | Toàn quyền CRUD | Chỉ cho phép đọc/tạo tem của thiết bị khoa mình |
| **inventorySessions** | Deny | Read Only (đang Active) | Toàn quyền CRUD | Chỉ Admin mới có quyền tạo hoặc chốt phiên |
| **inventoryItems** | Deny | Read/Update (khoa mình) | Toàn quyền CRUD | Manager quét cập nhật kết quả thực tế cho khoa mình |
| **maintenanceRecords**| Deny | Create/Read/Update (khoa mình) | Toàn quyền CRUD | Manager gửi báo hỏng; Admin duyệt chi phí, nghiệm thu |
| **transferRecords** | Deny | Create/Read (khoa mình) | Toàn quyền Duyệt/Update | Chỉ Admin mới có quyền duyệt phiếu điều chuyển |
| **activityLogs** | Deny | Create, Read (khoa mình) | Read All, Create | Cấm Update và Delete toàn bộ |
| **systemSettings** | Deny | Read Only | Toàn quyền CRUD | Manager chỉ đọc thông tin đơn vị để in tem/báo cáo |

---

## 3. Storage Security Rules
- `/devices/{deviceId}/**`: Cho phép Admin upload mọi thiết bị; EquipmentManager chỉ upload ảnh thiết bị thuộc khoa quản lý. File type: `image/*`, kích thước tối đa: 5MB.
- `/maintenance/{recordId}/**`: Ảnh sự cố máy hỏng hoặc biên bản ký nghiệm thu. File type: `image/*`, `application/pdf`, tối đa 10MB.
- `/transfers/{recordId}/**`: Scan biên bản bàn giao. File type: `image/*`, `application/pdf`, tối đa 10MB.
- `/avatars/{userId}/**`: Chỉ chủ tài khoản hoặc Admin mới được upload avatar của người dùng đó.
