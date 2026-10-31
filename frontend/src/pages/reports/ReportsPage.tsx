import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  deviceService,
  departmentService,
  maintenanceService,
} from '../../services/dataStorageService';
import {
  formatCurrency,
  formatDate,
  calculateRemainingValue,
  getDeviceStatusMeta,
} from '../../utils/formatters';
import type { Device, Department, MaintenanceRecord } from '../../types';

export const ReportsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showSuccess } = useNotification();

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const [devList, deptList, maintList] = await Promise.all([
        deviceService.getAll(userProfile),
        departmentService.getAll(),
        maintenanceService.getAll(userProfile),
      ]);
      setDevices(devList);
      setDepartments(deptList);
      setMaintenances(maintList);
    };

    load();
  }, [userProfile]);

  // Thống kê theo Khoa
  const departmentStats = departments.map((dept) => {
    const deptDevs = devices.filter((d) => d.departmentId === dept.id);
    const totalCost = deptDevs.reduce((sum, d) => sum + (d.originalCost || 0), 0);
    const inUse = deptDevs.filter((d) => d.status === 'InUse').length;
    const broken = deptDevs.filter((d) => d.status === 'Broken' || d.status === 'UnderMaintenance').length;

    return {
      dept,
      count: deptDevs.length,
      totalCost,
      inUse,
      broken,
    };
  });

  // 1. Xuất Sổ Theo Dõi Thiết Bị CNTT
  const exportDeviceRegistry = () => {
    const data = devices.map((d, index) => {
      const depInfo = calculateRemainingValue(d.originalCost, d.purchaseDate, d.depreciationRate);
      return {
        STT: index + 1,
        'Mã Quản Lý': d.deviceCode,
        'Tên Thiết Bị': d.name,
        'Chủng Loại': d.categoryName,
        'Khoa / Phòng Ban': d.departmentName,
        'Vị Trí Lắp Đặt': d.locationName,
        'Hãng Sản Xuất': d.manufacturer,
        'Số Serial': d.serialNumber,
        'Ngày Đưa Vào Dùng': formatDate(d.purchaseDate),
        'Nguyên Giá (VNĐ)': d.originalCost,
        'Giá Trị Còn Lại (VNĐ)': depInfo.remainingValue,
        'Trạng Thái': getDeviceStatusMeta(d.status).label,
        'Cán Bộ Sử Dụng': d.assignedUser?.name || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SoTheoDoiThietBi');
    XLSX.writeFile(wb, `SoTheoDoi_ThietBi_BVPHCN_DongThap_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Đã xuất Sổ theo dõi thiết bị CNTT thành công!');
  };

  // 2. Xuất Báo Cáo Khấu Hao
  const exportDepreciationReport = () => {
    const data = devices.map((d, index) => {
      const depInfo = calculateRemainingValue(d.originalCost, d.purchaseDate, d.depreciationRate);
      return {
        STT: index + 1,
        'Mã Thiết Bị': d.deviceCode,
        'Tên Thiết Bị': d.name,
        'Khoa Sử Dụng': d.departmentName,
        'Năm Bắt Đầu': formatDate(d.purchaseDate),
        'Số Năm Đã Dùng': depInfo.usedYears,
        'Tỷ Lệ Khấu Hao (%/Năm)': `${d.depreciationRate || 20}%`,
        'Nguyên Giá (VNĐ)': d.originalCost,
        'Giá Trị Đã Khấu Hao (VNĐ)': d.originalCost - depInfo.remainingValue,
        'Giá Trị Còn Lại (VNĐ)': depInfo.remainingValue,
        'Tình Trạng': depInfo.isFullyDepreciated ? 'Hết khấu hao' : 'Còn khấu hao',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoKhauHao');
    XLSX.writeFile(wb, `BaoCao_KhauHao_TaiSan_CNTT_BVPHCN_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Đã xuất Báo cáo Khấu hao tài sản thành công!');
  };

  // 3. Xuất Báo Cáo Bảo Trì
  const exportMaintenanceReport = () => {
    const data = maintenances.map((m, index) => ({
      STT: index + 1,
      'Mã Phiếu': m.id,
      'Mã Thiết Bị': m.deviceCode,
      'Tên Thiết Bị': m.deviceName,
      'Khoa Phòng': m.departmentName,
      'Mô Tả Sự Cố': m.issueDescription,
      'Kỹ Thuật Viên': m.assignedTechnician?.name || 'N/A',
      'Biện Pháp Xử Lý': m.resolutionDetails || 'Đang khắc phục',
      'Chi Phí Sửa Chữa (VNĐ)': m.cost || 0,
      'Trạng Thái': m.status,
      'Ngày Tiếp Nhận': formatDate(m.reportedAt, true),
      'Ngày Hoàn Tất': formatDate(m.completedAt, true),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NhatKyBaoTri');
    XLSX.writeFile(wb, `NhatKy_BaoTri_ThietBi_BVPHCN_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Đã xuất Nhật ký bảo trì thiết bị thành công!');
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            BÁO CÁO THỐNG KÊ & KẾT XUẤT EXCEL
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Tổng hợp số liệu quản lý tài sản, giá trị khấu hao và bảo trì phục vụ Ban Giám Đốc Bệnh viện
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={exportDeviceRegistry}
            sx={{ fontWeight: 700 }}
          >
            Sổ Theo Dõi Thiết Bị (Excel)
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={exportDepreciationReport}
            sx={{ fontWeight: 600 }}
          >
            Báo Cáo Khấu Hao (Excel)
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={exportMaintenanceReport}
            sx={{ fontWeight: 600 }}
          >
            Nhật Ký Bảo Trì (Excel)
          </Button>
        </Box>
      </Box>

      {/* Bảng Tổng hợp theo Khoa / Phòng */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0284c7', mb: 2 }}>
            BẢNG TỔNG HỢP TRANG THIẾT BỊ THEO KHOA / PHÒNG BAN
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khoa / Phòng ban</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trưởng khoa</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Tổng thiết bị</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Đang hoạt động</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Sự cố / Bảo trì</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Tổng nguyên giá tài sản</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentStats.map((item, idx) => (
                  <TableRow key={item.dept.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.dept.name} ({item.dept.code})</TableCell>
                    <TableCell>{item.dept.headOfDepartment || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                      {item.count}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#059669' }}>
                      {item.inUse}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: item.broken > 0 ? '#ef4444' : '#64748b' }}>
                      {item.broken}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
