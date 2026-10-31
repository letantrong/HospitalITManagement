import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { departmentService } from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import type { Department } from '../../types';

export const DepartmentPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [phoneContact, setPhoneContact] = useState('');

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const list = await departmentService.getAll();
      setDepartments(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setDescription('');
    setHeadOfDepartment('');
    setPhoneContact('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setDescription(dept.description || '');
    setHeadOfDepartment(dept.headOfDepartment || '');
    setPhoneContact(dept.phoneContact || '');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      showError('Vui lòng nhập Mã và Tên khoa phòng.');
      return;
    }

    try {
      if (editingDept) {
        await departmentService.update(editingDept.id, {
          code,
          name,
          description,
          headOfDepartment,
          phoneContact,
        });
        showSuccess('Cập nhật khoa phòng thành công!');
      } else {
        await departmentService.create({
          code,
          name,
          description,
          headOfDepartment,
          phoneContact,
          isActive: true,
        });
        await logActivity(
          userProfile,
          'CREATE_DEVICE',
          'SETTINGS',
          `Tạo mới khoa phòng: ${name} (${code})`
        );
        showSuccess('Thêm khoa phòng mới thành công!');
      }
      setDialogOpen(false);
      loadDepartments();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi lưu.');
    }
  };

  const handleDelete = async (id: string, deptName: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa khoa phòng: ${deptName}?`)) {
      await departmentService.delete(id);
      showSuccess('Đã xóa khoa phòng.');
      loadDepartments();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            QUẢN LÝ KHOA / PHÒNG BAN CHỨC NĂNG
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Thiết lập danh mục cơ cấu tổ chức tại Bệnh viện Phục hồi chức năng Đồng Tháp
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 700 }}
          >
            THÊM KHOA / PHÒNG MỚI
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80 }}>Mã</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên Khoa / Phòng ban</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trưởng khoa / Phụ trách</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Số ĐT nội bộ</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mô tả chức năng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              {isAdmin && <TableCell sx={{ fontWeight: 700, textAlign: 'center', width: 120 }}>Thao tác</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id} hover>
                <TableCell sx={{ fontWeight: 800, color: '#0284c7' }}>{dept.code}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                <TableCell>{dept.headOfDepartment || '-'}</TableCell>
                <TableCell>{dept.phoneContact || '-'}</TableCell>
                <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{dept.description || '-'}</TableCell>
                <TableCell>
                  <Chip label="Đang hoạt động" color="success" size="small" />
                </TableCell>
                {isAdmin && (
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton size="small" color="info" onClick={() => handleOpenEdit(dept)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => handleDelete(dept.id, dept.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Thêm / Sửa */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>
            {editingDept ? 'CHỈNH SỬA KHOA / PHÒNG' : 'THÊM KHOA / PHÒNG BAN MỚI'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Mã viết tắt *"
              size="small"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: KCB, CNTT, PHCN..."
              sx={{ mb: 2, mt: 1 }}
              required
            />
            <TextField
              label="Tên đầy đủ Khoa / Phòng ban *"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khoa Khám bệnh"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              label="Trưởng khoa / Phụ trách"
              size="small"
              fullWidth
              value={headOfDepartment}
              onChange={(e) => setHeadOfDepartment(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Điện thoại liên hệ"
              size="small"
              fullWidth
              value={phoneContact}
              onChange={(e) => setPhoneContact(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Mô tả nhiệm vụ"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              LƯU THÔNG TIN
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
