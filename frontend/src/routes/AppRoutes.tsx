import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { RoleGuard } from '../components/common/RoleGuard';
import { AuthGuard } from '../components/common/AuthGuard';
import { useAuth } from '../contexts/AuthContext';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { DeviceListPage } from '../pages/devices/DeviceListPage';
import { DeviceDetailPage } from '../pages/devices/DeviceDetailPage';
import { QRGeneratorPage } from '../pages/qrcode/QRGeneratorPage';
import { QRScannerPage } from '../pages/qrcode/QRScannerPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { MaintenancePage } from '../pages/maintenance/MaintenancePage';
import { TransferPage } from '../pages/transfers/TransferPage';
import { DepartmentPage } from '../pages/departments/DepartmentPage';
import { LocationPage } from '../pages/locations/LocationPage';
import { CategoryPage } from '../pages/categories/CategoryPage';
import { UserManagementPage } from '../pages/users/UserManagementPage';
import { ActivityLogsPage } from '../pages/logs/ActivityLogsPage';
import { ReportsPage } from '../pages/reports/ReportsPage';

// Module IPAM
import { IpDashboardPage } from '../pages/ipam/IpDashboardPage';
import { IpNetworkListPage } from '../pages/ipam/IpNetworkListPage';
import { IpAddressListPage } from '../pages/ipam/IpAddressListPage';
import { IpAssignmentPage } from '../pages/ipam/IpAssignmentPage';
import { IpHistoryPage } from '../pages/ipam/IpHistoryPage';

export const AppRoutes: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <Routes>
      {/* Route Đăng nhập (Nếu đã login thì điều hướng về Dashboard) */}
      <Route
        path="/login"
        element={userProfile ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Main App Layout (Được bảo vệ bởi AuthGuard - chưa đăng nhập bắt buộc vào /login) */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        {/* Dashboard chung (tự động phân quyền hiển thị theo role) */}
        <Route index element={<DashboardPage />} />

        {/* Quản lý thiết bị CNTT */}
        <Route path="devices" element={<DeviceListPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />

        {/* Mã QR & Scanner */}
        <Route path="qr-generator" element={<QRGeneratorPage />} />
        <Route path="qr-scanner" element={<QRScannerPage />} />

        {/* Đợt kiểm kê & đối soát */}
        <Route path="inventory" element={<InventoryPage />} />

        {/* Bảo trì & Sự cố */}
        <Route path="maintenance" element={<MaintenancePage />} />

        {/* Điều chuyển khoa phòng */}
        <Route path="transfers" element={<TransferPage />} />

        {/* Module Quản lý Địa chỉ IP Tĩnh (IPAM) */}
        <Route path="ipam" element={<IpDashboardPage />} />
        <Route
          path="ipam/networks"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <IpNetworkListPage />
            </RoleGuard>
          }
        />
        <Route path="ipam/addresses" element={<IpAddressListPage />} />
        <Route
          path="ipam/assignment"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <IpAssignmentPage />
            </RoleGuard>
          }
        />
        <Route path="ipam/history" element={<IpHistoryPage />} />

        {/* Báo cáo & Thống kê & Logs */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="logs" element={<ActivityLogsPage />} />

        {/* Các trang quản trị hệ thống chỉ dành cho Admin */}
        <Route
          path="departments"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <DepartmentPage />
            </RoleGuard>
          }
        />
        <Route
          path="locations"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <LocationPage />
            </RoleGuard>
          }
        />
        <Route
          path="categories"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <CategoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="users"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <UserManagementPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
