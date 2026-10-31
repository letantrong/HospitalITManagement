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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  transferService,
  deviceService,
  departmentService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import { formatDate } from '../../utils/formatters';
import type { TransferRecord, Device, Department } from '../../types';

export const TransferPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Tạo Phiếu
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [toDeptId, setToDeptId] = useState('');
  const [toLocName, setToLocName] = useState('');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [transList, devList, deptList] = await Promise.all([
        transferService.getAll(userProfile),
        deviceService.getAll(userProfile),
        departmentService.getAll(),
      ]);
      setTransfers(transList);
      setDevices(devList);
      setDepartments(deptList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId || !toDeptId || !reason) {
      showError('Vui lòng chọn thiết bị, khoa tiếp nhận và ghi rõ lý do.');
      return;
    }

    const dev = devices.find((d) => d.id === selectedDeviceId);
    const toDept = departments.find((d) => d.id === toDeptId);

    if (!dev || !toDept) return;

    if (dev.departmentId === toDeptId) {
      showWarning('Khoa tiếp nhận phải khác với khoa hiện tại của thiết bị!');
      return;
    }

    try {
      const created = await transferService.create({
        deviceId: dev.id,
        deviceCode: dev.deviceCode,
        deviceName: dev.name,
        fromDepartmentId: dev.departmentId,
        fromDepartmentName: dev.departmentName,
        fromLocationId: dev.locationId,
        fromLocationName: dev.locationName,
        toDepartmentId: toDept.id,
        toDepartmentName: toDept.name,
        toLocationId: '',
        toLocationName: toLocName || 'Chưa định vị',
        reason,
        requestedBy: userProfile?.id || 'anonymous',
        requestedByName: userProfile?.displayName || 'Cán bộ đề xuất',
      });

      await logActivity(
        userProfile,
        'CREATE_TRANSFER',
        'TRANSFER',
        `Tạo phiếu đề xuất điều chuyển ${dev.deviceCode} từ ${dev.departmentName} sang ${toDept.name}`,
        created.id,
        dev.deviceCode
      );

      showSuccess('Đã gửi đề xuất điều chuyển thành công!');
      setCreateOpen(false);
      setSelectedDeviceId('');
      setToDeptId('');
      setToLocName('');
      setReason('');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi tạo đề xuất điều chuyển.');
    }
  };

  // Admin Phê duyệt
  const handleApprove = async (transferId: string) => {
    if (!isAdmin) {
      showError('Chỉ Quản trị viên (Admin) mới có thẩm quyền phê duyệt điều chuyển tài sản.');
      return;
    }

    try {
      await transferService.approve(transferId, userProfile!);
      const target = transfers.find((t) => t.id === transferId);

      await logActivity(
        userProfile,
        'APPROVE_TRANSFER',
        'TRANSFER',
        `Admin đã phê duyệt điều chuyển thiết bị ${target?.deviceCode} sang ${target?.toDepartmentName}`,
        target?.deviceId,
        target?.deviceCode
      );

      showSuccess('Đã phê duyệt điều chuyển thiết bị thành công! Hồ sơ thiết bị đã tự động cập nhật sang khoa mới.');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi phê duyệt điều chuyển.');
    }
  };

  // Admin Từ chối
  const handleReject = async (transferId: string) => {
    if (!isAdmin) return;
    try {
      await transferService.reject(transferId, userProfile!);
      showSuccess('Đã từ chối phiếu điều chuyển.');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi từ chối.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            ĐIỀU CHUYỂN THIẾT BỊ GIỮA CÁC KHOA / PHÒNG
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Quy trình luân chuyển tài sản minh bạch, có phê duyệt của Admin và lưu vết lịch sử vị trí
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          LẬP PHIẾU ĐIỀU CHUYỂN
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã phiếu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thiết bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Từ Đơn vị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Đến Đơn vị tiếp nhận</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Lý do điều chuyển</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Người đề xuất</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Thẩm định (Admin)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Chưa có phiếu điều chuyển nào được lập.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((trans) => {
                let statusLabel = 'Chờ duyệt';
                let statusColor: any = 'warning';

                if (trans.status === 'Completed') {
                  statusLabel = 'Đã hoàn tất';
                  statusColor = 'success';
                } else if (trans.status === 'Rejected') {
                  statusLabel = 'Bị từ chối';
                  statusColor = 'error';
                }

                return (
                  <TableRow key={trans.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{trans.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {trans.deviceCode}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {trans.deviceName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {trans.fromDepartmentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {trans.fromLocationName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                        {trans.toDepartmentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {trans.toLocationName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {trans.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{trans.requestedByName}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {formatDate(trans.requestedAt, true)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={statusLabel} color={statusColor} size="small" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {trans.status === 'PendingApproval' ? (
                        isAdmin ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleApprove(trans.id)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CloseIcon />}
                              onClick={() => handleReject(trans.id)}
                            >
                              Từ chối
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                            Chờ Admin xét duyệt
                          </Typography>
                        )
                      ) : (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Duyệt bởi: {trans.approvedByName || 'Admin'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Lập Phiếu Điều Chuyển */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateTransfer}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>
            LẬP PHIẾU ĐỀ XUẤT ĐIỀU CHUYỂN THIẾT BỊ
          </DialogTitle>
          <DialogContent>
            <TextField
              select
              label="Chọn thiết bị cần điều chuyển *"
              size="small"
              fullWidth
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              required
            >
              {devices.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.deviceCode} - {d.name} (Đang ở: {d.departmentName})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Khoa / Phòng ban tiếp nhận *"
              size="small"
              fullWidth
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Dự kiến phòng / vị trí tiếp nhận"
              size="small"
              fullWidth
              value={toLocName}
              onChange={(e) => setToLocName(e.target.value)}
              placeholder="Ví dụ: Phòng Khám 102 - Tầng 1 Khu A"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Lý do điều chuyển *"
              multiline
              rows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Căn cứ nhu cầu khám chữa bệnh, chỉ đạo ban giám đốc..."
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              GỬI PHIẾU ĐỀ XUẤT
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
