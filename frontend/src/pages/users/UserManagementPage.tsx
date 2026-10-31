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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { userService, departmentService } from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import type { UserProfile, Department } from '../../types';

export const UserManagementPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Phân quyền
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'Admin' | 'EquipmentManager'>('EquipmentManager');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
      ]);
      setUsers(uList);
      setDepartments(dList);
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
    setSelectedDeptIds(user.departmentIds || []);
  };

  const handleDeptChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedDeptIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSaveAssignment = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateRoleAndDepartments(selectedUser.id, role, selectedDeptIds);
      await logActivity(
        userProfile,
        'UPDATE_DEVICE',
        'USER',
        `Admin đã cập nhật vai trò ${role} cho ${selectedUser.displayName} với ${selectedDeptIds.length} khoa phòng`,
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
                      label={isUserAdmin ? 'Admin (Toàn viện)' : 'EquipmentManager'}
                      color={isUserAdmin ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    {isUserAdmin ? (
                      <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                        Toàn bộ các Khoa / Phòng ban trong bệnh viện
                      </Typography>
                    ) : u.departmentIds?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {u.departmentIds.map((deptId) => {
                          const dept = departments.find((d) => d.id === deptId);
                          return (
                            <Chip
                              key={deptId}
                              label={dept ? `${dept.name} (${dept.code})` : deptId}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          );
                        })}
                      </Box>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Chưa được phân công khoa nào</span>
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
            label="Chọn Vai trò (Chỉ 2 vai trò chuẩn) *"
            size="small"
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="Admin">Admin (Quản trị viên toàn hệ thống & Toàn bệnh viện)</MenuItem>
            <MenuItem value="EquipmentManager">EquipmentManager (Quản lý thiết bị khoa được chỉ định)</MenuItem>
          </TextField>

          {role === 'EquipmentManager' && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Khoa / Phòng ban được phân công phụ trách *</InputLabel>
              <Select
                multiple
                value={selectedDeptIds}
                onChange={handleDeptChange}
                input={<OutlinedInput label="Khoa / Phòng ban được phân công phụ trách *" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((val) => {
                      const d = departments.find((item) => item.id === val);
                      return <Chip key={val} label={d?.code || val} size="small" />;
                    })}
                  </Box>
                )}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {role === 'EquipmentManager' && (
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              * Lưu ý bảo mật: Cán bộ chỉ được phép xem, cập nhật thiết bị, kiểm kê và báo hỏng trong phạm vi các phòng ban đã được tick chọn ở trên.
            </Typography>
          )}
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
