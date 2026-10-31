import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { userService } from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import type { UserProfile } from '../../types';

export const UserManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Phân quyền
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'Admin' | 'EquipmentManager'>('EquipmentManager');

  const loadData = async () => {
    setLoading(true);
    try {
      const uList = await userService.getAll();
      setUsers(uList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssign = (user: UserProfile) => {
    setSelectedUser(user);
    setRole(user.role);
  };

  const handleSaveAssignment = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateRoleAndDepartments(selectedUser.id, role, []);
      await logActivity(
        userProfile,
        'UPDATE_DEVICE',
        'USER',
        `Admin đã cập nhật vai trò ${role} cho ${selectedUser.displayName}`,
        selectedUser.id
      );

      showSuccess(`Đã phân quyền thành công cho cán bộ: ${selectedUser.displayName}`);
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi cập nhật phân quyền.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN PHÒNG BAN
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Phân định ranh giới quản lý giữa Quản trị viên (Admin) và Cán bộ Quản lý Thiết bị (EquipmentManager)
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Họ và tên Cán bộ</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email đăng nhập</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vai trò (Role)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Phòng ban được giao quản lý</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const isUserAdmin = u.role === 'Admin';
              return (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phoneNumber || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={isUserAdmin ? <AdminPanelSettingsIcon /> : <ManageAccountsIcon />}
                      label={isUserAdmin ? 'Admin (Toàn viện)' : 'Quản lý Thiết bị CNTT'}
                      color={isUserAdmin ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    {isUserAdmin ? (
                      <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                        Toàn bộ các Khoa / Phòng ban trong bệnh viện (Toàn quyền)
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        Quản lý toàn bộ thiết bị CNTT tại các Khoa / Phòng ban trong bệnh viện
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ManageAccountsIcon />}
                      onClick={() => handleOpenAssign(u)}
                    >
                      Phân quyền
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Phân Quyền */}
      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>
          PHÂN QUYỀN VAI TRÒ & PHÒNG BAN: {selectedUser?.displayName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Email tài khoản: <strong>{selectedUser?.email}</strong>
          </Typography>

          <TextField
            select
            label="Chọn Vai trò (2 vai trò hệ thống) *"
            size="small"
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="Admin">Quản trị viên Hệ thống (Admin - Toàn quyền)</MenuItem>
            <MenuItem value="EquipmentManager">Người Quản lý Thiết bị CNTT Bệnh viện</MenuItem>
          </TextField>

          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: role === 'Admin' ? '#0284c7' : '#059669', mb: 0.5 }}>
              {role === 'Admin' ? 'Quyền hạn Quản trị viên (Admin):' : 'Quyền hạn Người Quản lý Thiết bị CNTT:'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              {role === 'Admin'
                ? 'Toàn quyền cấu hình dải mạng IPAM, quản lý danh mục khoa phòng, phê duyệt điều chuyển tài sản, tạo đợt kiểm kê và quản trị tài khoản người dùng.'
                : 'Quản lý hồ sơ thiết bị CNTT toàn viện, thực hiện cấp phát IP tĩnh, lập phiếu sự cố & bảo trì, quét mã QR kiểm kê tại các khoa phòng và đề xuất điều chuyển thiết bị.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedUser(null)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSaveAssignment} sx={{ fontWeight: 700 }}>
            LƯU PHÂN QUYỀN
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
