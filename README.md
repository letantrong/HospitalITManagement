# HospitalITManagement - Bệnh viện Phục hồi chức năng

Hệ thống quản lý trang thiết bị Công nghệ thông tin chuyên nghiệp, hiện đại xây dựng trên nền tảng **ReactJS + TypeScript + Vite + Material UI (MUI)** và **Google Firebase (Authentication, Cloud Firestore, Storage, Cloud Functions, Security Rules)**.

---

## I. Tính năng Hệ thống
1. **Đăng nhập & Đăng xuất**: Xác thực an toàn với Firebase Auth, hỗ trợ phân quyền vai trò (Role-Based Access Control).
2. **Phân quyền 2 vai trò chuẩn y tế**:
   - `Admin`: Toàn quyền quản trị hệ thống, tài khoản, phòng ban, toàn bộ thiết bị bệnh viện, phê duyệt điều chuyển, chốt kiểm kê, cấu hình.
   - `EquipmentManager`: Quản lý các phòng ban được giao nhiệm vụ; cập nhật thông tin thiết bị, quét QR kiểm kê, báo hỏng sửa chữa, lập đề xuất điều chuyển.
3. **Quản lý Danh mục & Đơn vị**:
   - Khoa / Phòng ban chức năng.
   - Vị trí vật lý (Tòa nhà, Tầng, Phòng).
   - Danh mục thiết bị (Máy tính, Máy in, Switch, Máy chủ, Máy quét,...).
4. **Quản lý Thiết bị CNTT**:
   - Hồ sơ chi tiết: Cấu hình kỹ thuật (CPU, RAM, Ổ cứng, IP, MAC...), nguyên giá, khấu hao, người sử dụng, ảnh chụp, tài liệu kèm theo.
   - Vòng đời: Đang sử dụng (`InUse`), Trong kho (`Storage`), Đang bảo trì (`UnderMaintenance`), Hỏng (`Broken`), Thanh lý (`Disposed`).
5. **Mã QR Code & In tem**:
   - Tự động sinh mã định danh QR chuẩn vector có kèm token bảo mật.
   - Chức năng in tem nhãn chuẩn bệnh viện (A4 hoặc tem nhãn dán thiết bị 50x30mm).
6. **Kiểm kê Thiết bị bằng QR**:
   - Admin tạo phiên kiểm kê với cơ chế Snapshot tự động lưu trạng thái sổ sách.
   - Manager quét mã QR tại hiện trường qua camera.
   - Tự động đối soát: Khớp vị trí (`Matched`), Sai vị trí (`Misplaced`), Hỏng (`Damaged`), Thất thoát (`Missing`), Thừa (`Surplus`).
7. **Bảo trì & Sửa chữa**:
   - Quét mã QR báo hỏng tức thì.
   - Theo dõi tiến độ sửa chữa, thay thế linh kiện, chi phí và nghiệm thu.
8. **Điều chuyển Khoa/Phòng**:
   - Lập phiếu điều chuyển từ Khoa A sang Khoa B.
   - Admin phê duyệt -> Tự động chuyển giao quyền quản lý và cập nhật lịch sử.
9. **Nhật ký Hoạt động (Audit Trail)**:
   - Ghi nhận mọi thao tác nhạy cảm, ngăn chặn chỉnh sửa hoặc xóa trái phép.
10. **Báo cáo & Xuất Excel**:
    - Dashboard trực quan với Recharts.
    - Xuất file Excel chuẩn báo cáo y tế (danh sách thiết bị, kiểm kê, bảo trì).

---

## II. Hướng dẫn Cài đặt & Chạy Thử Nghiệm

### 1. Chuẩn bị môi trường
- Đã cài đặt Node.js (khuyến nghị >= 18.x, 20.x, 22.x).
- Cấu hình Firebase: Sao chép `.env.example` thành `.env` trong thư mục `frontend/` và điền cấu hình Firebase project.

### 2. Cài đặt và chạy Frontend
```bash
cd frontend
npm.cmd install
npm.cmd run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173`.

---

## III. Tài liệu Kỹ thuật
- [Kiến trúc Hệ thống (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Đặc tả 12 Firestore Collections (docs/FIRESTORE_SCHEMA.md)](docs/FIRESTORE_SCHEMA.md)
- [Ma trận Phân quyền & Security Rules (docs/SECURITY_MATRIX.md)](docs/SECURITY_MATRIX.md)
