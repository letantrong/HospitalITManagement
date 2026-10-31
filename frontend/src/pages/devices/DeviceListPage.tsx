import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import BuildIcon from '@mui/icons-material/Build';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  deviceService,
  departmentService,
  categoryService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import {
  formatCurrency,
  formatDate,
  getDeviceStatusMeta,
  getDeviceConditionMeta,
} from '../../utils/formatters';
import { DeviceFormDialog } from './DeviceFormDialog';
import type { Device, Department, DeviceCategory } from '../../types';

export const DeviceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devList, deptList, catList] = await Promise.all([
        deviceService.getAll(userProfile),
        departmentService.getAll(),
        categoryService.getAll(),
      ]);
      setDevices(devList);
      setDepartments(deptList);
      setCategories(catList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  // Lọc danh sách thiết bị
  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      !searchTerm ||
      d.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = selectedDept === 'ALL' || d.departmentId === selectedDept;
    const matchCat = selectedCat === 'ALL' || d.categoryId === selectedCat;
    const matchStatus = selectedStatus === 'ALL' || d.status === selectedStatus;

    return matchSearch && matchDept && matchCat && matchStatus;
  });

  const handleOpenAdd = () => {
    setSelectedDevice(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (dev: Device) => {
    setSelectedDevice(dev);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const target = devices.find((d) => d.id === deleteId);
      await deviceService.delete(deleteId);
      await logActivity(
        userProfile,
        'DELETE_DEVICE',
        'DEVICE',
        `Xóa thiết bị CNTT: ${target?.deviceCode || deleteId}`,
        deleteId,
        target?.deviceCode
      );
      showSuccess('Đã xóa thiết bị thành công!');
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi xóa thiết bị.');
    }
  };

  // Xuất Excel nhanh danh sách thiết bị
  const handleExportExcel = () => {
    const dataRows = filteredDevices.map((d, index) => ({
      STT: index + 1,
      'Mã thiết bị': d.deviceCode,
      'Tên thiết bị': d.name,
      'Danh mục': d.categoryName,
      'Khoa / Phòng': d.departmentName,
      'Vị trí': d.locationName,
      'Hãng SX': d.manufacturer,
      Model: d.model,
      'Số Serial': d.serialNumber,
      'Cấu hình chi tiết': `CPU: ${d.specifications?.cpu || ''}, RAM: ${d.specifications?.ram || ''}, SSD: ${d.specifications?.storage || ''}`,
      'Trạng thái': getDeviceStatusMeta(d.status).label,
      'Tình trạng': getDeviceConditionMeta(d.condition).label,
      'Nguyên giá (VNĐ)': d.originalCost,
      'Cán bộ phụ trách': d.assignedUser?.name || '',
      'Ngày sử dụng': formatDate(d.purchaseDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachThietBi');
    XLSX.writeFile(workbook, `ThietBi_BVPHCN_DongThap_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Đã xuất file Excel danh sách thiết bị thành công!');
  };

  return (
    <Box>
      {/* Tiêu đề & Nút tác vụ */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            DANH SÁCH THIẾT BỊ CÔNG NGHỆ THÔNG TIN
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Quản lý toàn diện hồ sơ lý lịch, cấu hình kỹ thuật và vòng đời thiết bị
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={{ fontWeight: 600 }}
          >
            Xuất Excel
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 700 }}
          >
            THÊM THIẾT BỊ MỚI
          </Button>
        </Box>
      </Box>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                placeholder="Tìm mã thiết bị, tên, số serial, hãng sản xuất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Khoa / Phòng ban"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <MenuItem value="ALL">-- Tất cả khoa phòng --</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <TextField
                select
                size="small"
                fullWidth
                label="Loại thiết bị"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                <MenuItem value="ALL">-- Tất cả loại --</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <TextField
                select
                size="small"
                fullWidth
                label="Trạng thái"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="ALL">-- Tất cả trạng thái --</MenuItem>
                <MenuItem value="InUse">Đang sử dụng</MenuItem>
                <MenuItem value="Storage">Trong kho</MenuItem>
                <MenuItem value="UnderMaintenance">Đang bảo trì</MenuItem>
                <MenuItem value="Broken">Bị hỏng</MenuItem>
                <MenuItem value="Disposed">Đã thanh lý</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bảng Danh sách Thiết bị */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 60 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã thiết bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên & Hãng SX</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Vị trí</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cán bộ phụ trách</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nguyên giá</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center', width: 140 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Không tìm thấy thiết bị nào phù hợp với điều kiện lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((dev, idx) => {
                const statusMeta = getDeviceStatusMeta(dev.status);
                return (
                  <TableRow key={dev.id} hover>
                    <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: '#0284c7', cursor: 'pointer' }}
                        onClick={() => navigate(`/devices/${dev.id}`)}
                      >
                        {dev.deviceCode}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        SN: {dev.serialNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {dev.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {dev.manufacturer} {dev.model ? `- ${dev.model}` : ''} ({dev.categoryName})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{dev.departmentName}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {dev.locationName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dev.assignedUser?.name || <span style={{ color: '#94a3b8' }}>Chưa bàn giao</span>}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(dev.originalCost)}
                    </TableCell>
                    <TableCell>
                      <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Xem chi tiết & QR">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/devices/${dev.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Chỉnh sửa thông tin">
                          <IconButton size="small" color="info" onClick={() => handleOpenEdit(dev)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {isAdmin && (
                          <Tooltip title="Xóa thiết bị (Admin)">
                            <IconButton size="small" color="error" onClick={() => setDeleteId(dev.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog Thêm / Sửa */}
      <DeviceFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadData}
        initialDevice={selectedDevice}
      />

      {/* Dialog Xác nhận Xóa */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>XÁC NHẬN XÓA THIẾT BỊ</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xóa hồ sơ thiết bị này khỏi cơ sở dữ liệu bệnh viện? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            ĐỒNG Ý XÓA
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
