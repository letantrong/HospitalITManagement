# Kiến trúc Hệ thống HospitalITManagement
**Bệnh viện Phục hồi chức năng Đồng Tháp**

---

## 1. Tổng quan Dự án
Hệ thống **HospitalITManagement** là giải pháp quản lý toàn diện vòng đời trang thiết bị CNTT (máy tính, máy in, máy chủ, thiết bị mạng, thiết bị ngoại vi y tế...) tại Bệnh viện Phục hồi chức năng Đồng Tháp, được xây dựng trên nền tảng Serverless của Google Firebase và Frontend ReactJS Single-Page Application (SPA) với giao diện Material UI hiện đại, chuẩn bệnh viện.

---

## 2. Công nghệ Sử dụng (Tech Stack)

### Frontend
- **Framework & Build tool**: React 18 / 19 + TypeScript + Vite.
- **UI Library & Design System**: Material UI (MUI v5/v6) tuân thủ bảng màu y tế chuyên nghiệp (Medical Blue `#0284c7`, Emerald Green `#059669`, Hospital Slate `#0f172a`), Dark/Light mode hỗ trợ đầy đủ.
- **Routing**: React Router DOM (v6/v7) với kiến trúc Nested Routes, Protected Routes bảo vệ theo Custom Claims / Role.
- **Form & Validation**: React Hook Form + Zod Schema Validation đảm bảo mọi input đều được kiểm tra chặt chẽ từ client.
- **Biểu đồ & Trực quan hóa**: Recharts hỗ trợ biểu đồ phân bố thiết bị, tình trạng khấu hao, tỉ lệ sự cố, thống kê kiểm kê.
- **Xử lý QR Code**: 
  - Tạo mã QR: `qrcode` / `qrcode.react` (chuẩn vector SVG và high-res Canvas, hỗ trợ in tem nhãn bệnh viện khổ 50x30mm, A4).
  - Quét mã QR: `html5-qrcode` tương thích tốt với webcam laptop và camera điện thoại/tablet của kỹ thuật viên.
- **Kết xuất Dữ liệu**: `xlsx` (SheetJS) để xuất biên bản kiểm kê, danh mục thiết bị, lịch sử bảo trì đạt chuẩn báo cáo y tế.

### Backend & Cloud Services (Google Firebase)
- **Firebase Authentication**: Quản lý định danh người dùng, quản lý Token và tích hợp Custom User Claims (`admin: true` hoặc `role: 'EquipmentManager', departmentIds: ['dep1', 'dep2']`).
- **Cloud Firestore**: CSDL NoSQL linh hoạt với khả năng Real-time listener, snapshot queries, transactions và batch writes.
- **Firebase Storage**: Lưu trữ an toàn hình ảnh thiết bị, hóa đơn chứng từ, ảnh hiện trường sự cố, biên bản bàn giao điều chuyển đã ký.
- **Cloud Functions for Firebase (Node.js/TypeScript)**:
  - Admin custom claims provisioning (`setCustomUserClaims`).
  - Tự động tạo log hoạt động bất biến (`activityLogs`).
  - Tạo phiên kiểm kê và snapshot toàn bộ trạng thái thiết bị.
  - Xử lý điều chuyển thiết bị đảm bảo tính toàn vẹn (Atomic Transaction).
- **Firebase Security Rules**:
  - `firestore.rules`: Kiểm soát quyền đọc/ghi ở mức từng collection và document dựa trên `request.auth.token.role` và `request.auth.token.departmentIds`.
  - `storage.rules`: Kiểm soát file upload theo định dạng (ảnh, pdf), dung lượng tối đa và phạm vi tài khoản.

---

## 3. Cấu trúc Thư mục Dự án (Folder Structure)

```
HospitalITManagement/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Logo bệnh viện, icons, minh họa
│   │   ├── components/          # Reusable UI (QR Scanner, Modal, DataGrid, StatusChip, PrintLabel...)
│   │   │   ├── common/
│   │   │   ├── qr/
│   │   │   └── reports/
│   │   ├── layouts/             # MainLayout, AuthLayout, Sidebar, Navbar, Footer
│   │   ├── pages/               # Các trang chức năng
│   │   │   ├── auth/            # Login, ForgotPassword
│   │   │   ├── dashboard/       # Admin Dashboard, EquipmentManager Dashboard
│   │   │   ├── users/           # Danh sách user, phân quyền phòng ban
│   │   │   ├── departments/     # Quản lý khoa / phòng ban
│   │   │   ├── categories/      # Danh mục loại thiết bị
│   │   │   ├── locations/       # Vị trí / phòng bệnh / kho
│   │   │   ├── devices/         # Danh sách, thêm, sửa, chi tiết thiết bị
│   │   │   ├── qrcode/          # Tạo tem QR hàng loạt, in tem
│   │   │   ├── inventory/       # Phiên kiểm kê, quét kiểm kê, đối soát
│   │   │   ├── maintenance/     # Báo hỏng, bảo trì, lịch bảo dưỡng
│   │   │   ├── transfers/       # Phiếu điều chuyển khoa phòng, phê duyệt
│   │   │   ├── logs/            # Nhật ký hoạt động hệ thống
│   │   │   └── reports/         # Thống kê, xuất Excel
│   │   ├── routes/              # Cấu hình React Router với RoleGuard
│   │   ├── services/            # Firebase SDK client wrappers (authService, deviceService,...)
│   │   ├── hooks/               # Custom hooks (useAuth, useDevices, useQRScanner,...)
│   │   ├── contexts/            # AuthContext, NotificationContext, ThemeContext
│   │   ├── types/               # TypeScript interfaces cho 12 collections & entities
│   │   ├── utils/               # Format tiền tệ, ngày tháng, xuất Excel, tính khấu hao
│   │   ├── theme/               # MUI Theme configuration (colors, typography, shadows)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── functions/
│   ├── src/
│   │   ├── auth/                # Trigger khi tạo user, set role claims
│   │   ├── inventory/           # Tạo snapshot kiểm kê
│   │   ├── transfers/           # Transaction điều chuyển
│   │   ├── logs/                # Ghi activity log
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── docs/
│   ├── ARCHITECTURE.md          # Tài liệu kiến trúc chi tiết này
│   ├── FIRESTORE_SCHEMA.md      # Đặc tả Schema 12 collections
│   └── SECURITY_MATRIX.md       # Ma trận phân quyền chi tiết
├── .env.example
├── .gitignore
├── firebase.json
└── README.md
```

---

## 4. Ma trận Phân quyền (Authorization Matrix)

Hệ thống tuân thủ nghiêm ngặt chỉ có **2 vai trò (Role)**:

| Module / Chức năng | Admin | EquipmentManager |
|---|:---:|:---:|
| **Đăng nhập / Đăng xuất** | Có quyền | Có quyền |
| **Quản lý Tài khoản người dùng** | Toàn quyền (CRUD, phân quyền) | Không có quyền |
| **Phân công Phòng ban cho Manager** | Toàn quyền | Không có quyền |
| **Quản lý Khoa / Phòng ban** | Toàn quyền | Chỉ xem |
| **Quản lý Vị trí / Kho / Phòng làm việc** | Toàn quyền | Xem các vị trí thuộc khoa quản lý |
| **Quản lý Danh mục thiết bị** | Toàn quyền | Chỉ xem danh mục chung |
| **Quản lý Thiết bị CNTT** | Toàn quyền (toan bệnh viện) | Chỉ xem & cập nhật thiết bị thuộc khoa quản lý |
| **Tạo & In Mã QR Code** | Toàn quyền mọi thiết bị | Chỉ tạo/in cho thiết bị thuộc khoa quản lý |
| **Quét QR xem thông tin nhanh** | Có quyền | Có quyền (ràng buộc khoa khi thực hiện thao tác) |
| **Tạo Phiên kiểm kê (Inventory Session)**| Toàn quyền (phạm vi toàn viện hoặc từng khoa)| Không thể tạo mới phiên viện; chỉ tham gia quét |
| **Thực hiện Quét kiểm kê** | Quét mọi khoa | Chỉ quét thiết bị thuộc khoa được phân công |
| **Đối soát & Đóng đợt kiểm kê** | Toàn quyền chốt số liệu | Xem kết quả đối soát khoa mình |
| **Báo cáo sự cố / Hỏng hóc** | Có quyền | Có quyền cho thiết bị thuộc khoa quản lý |
| **Xử lý Bảo trì / Sửa chữa** | Toàn quyền quản lý, nghiệm thu, chi phí | Gửi phiếu yêu cầu, theo dõi tiến độ |
| **Lập phiếu Điều chuyển thiết bị** | Duyệt & thực hiện điều chuyển | Đề xuất điều chuyển (từ khoa mình quản lý) |
| **Xem Nhật ký hoạt động (Activity Log)** | Toàn viện | Chỉ xem nhật ký liên quan tới thiết bị khoa mình |
| **Thống kê & Báo cáo / Xuất Excel** | Toàn viện | Giới hạn trong phạm vi khoa được giao |

---

## 5. Quy trình Nghiệp vụ Cốt lõi

### 5.1. Vòng đời Thiết bị (Device Lifecycle)
1. **Tiếp nhận & Nhập kho**: Admin/Manager tạo mới thiết bị, sinh mã tự động theo chuẩn (Ví dụ: `BVPHCN-MT-2026-001`), gán Phòng ban, Vị trí, Thông số kỹ thuật.
2. **Định danh QR**: Hệ thống tạo mã QR chứa ID bảo mật + Device Code, in tem dán trực tiếp lên thân vỏ thiết bị.
3. **Vận hành & Sử dụng**: Ghi nhận người đang sử dụng, trạng thái hoạt động (`InUse`, `Storage`, `UnderMaintenance`, `Broken`, `Disposed`).
4. **Bảo dưỡng & Sửa chữa**: Khi có sự cố, quét QR để mở nhanh phiếu bảo trì; lưu lại linh kiện thay thế, chi phí và kết quả nghiệm thu.
5. **Điều chuyển Khoa/Phòng**: Lập phiếu điều chuyển từ Khoa A sang Khoa B; cập nhật tự động lịch sử vị trí và phòng ban quản lý.
6. **Thanh lý / Hết hạn**: Ghi nhận nguyên nhân, biên bản thanh lý, cập nhật trạng thái `Disposed`.

### 5.2. Kiểm kê Bằng QR với Cơ chế Snapshot
1. Admin tạo **Đợt kiểm kê** (Ví dụ: "Kiểm kê Tài sản CNTT Quý 1/2026").
2. Hệ thống tạo **Snapshot** tại thời điểm đó: Lưu danh sách toàn bộ thiết bị và trạng thái dự kiến của từng khoa.
3. Các cán bộ EquipmentManager sử dụng điện thoại/tablet quét mã QR trên từng thiết bị tại hiện trường.
4. Kết quả quét đồng bộ tức thì lên Cloud Firestore:
   - **Đúng vị trí & Hoạt động tốt** (Matched)
   - **Sai vị trí so với hồ sơ** (Misplaced - ghi nhận vị trí thực tế)
   - **Hỏng hóc / Chưa ghi nhận** (Damaged)
   - **Thừa thiết bị so với sổ sách** (Surplus)
   - **Chưa quét / Có thể thất thoát** (Missing)
5. Kết thúc đợt, Admin xem bảng đối soát tự động và xuất Biên bản kiểm kê Excel phục vụ Ban Giám đốc Bệnh viện.

---

## 6. Lộ trình Triển khai 12 Giai đoạn

- **Giai đoạn 1**: Phân tích và thiết kế kiến trúc (Đặc tả Schema 12 collections, Security Matrix).
- **Giai đoạn 2**: Khởi tạo Frontend React (Vite + TS + MUI) và Cấu hình Dự án Firebase.
- **Giai đoạn 3**: Đặc tả Firestore Types, Rules và Utilities chuẩn hóa.
- **Giai đoạn 4**: Xây dựng Authentication, RBAC Guard, AuthContext.
- **Giai đoạn 5**: Module Quản lý Người dùng & Phân quyền Phòng ban.
- **Giai đoạn 6**: Module Danh mục, Phòng ban, Vị trí & Quản lý Thiết bị CNTT hoàn chỉnh.
- **Giai đoạn 7**: Module Tạo mã QR, In tem nhãn bệnh viện & Quét QR qua Camera.
- **Giai đoạn 8**: Module Kiểm kê Thiết bị (Snapshot, Quét hiện trường, Đối soát).
- **Giai đoạn 9**: Module Bảo trì Sửa chữa & Điều chuyển Khoa phòng.
- **Giai đoạn 10**: Module Dashboard trực quan (Recharts) & Xuất Báo cáo Excel.
- **Giai đoạn 11**: Kiểm tra Bảo mật (Firestore Rules, Storage Rules, Cloud Functions, Rate Limiting).
- **Giai đoạn 12**: Kiểm thử toàn diện, Tối ưu hóa và Bàn giao tài liệu Hướng dẫn Vận hành.
