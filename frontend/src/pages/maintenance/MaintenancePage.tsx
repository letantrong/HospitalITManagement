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
  Grid,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { maintenanceService } from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import {
  formatCurrency,
  formatDate,
  getTicketStatusMeta,
  getPriorityMeta,
} from '../../utils/formatters';
import type { MaintenanceRecord } from '../../types';

export const MaintenancePage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Xử lý kỹ thuật & Nghiệm thu
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [techName, setTechName] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<any>('InProgress');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await maintenanceService.getAll(userProfile);
      setRecords(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleOpenProcess = (rec: MaintenanceRecord) => {
    setSelectedRecord(rec);
    setTechName(rec.assignedTechnician?.name || 'KS. Nguyễn Văn Hùng (CNTT)');
    setResolutionDetails(rec.resolutionDetails || '');
    setCost(rec.cost || 0);
    setNewStatus(rec.status);
  };

  const handleSaveProcess = async () => {
    if (!selectedRecord) return;
    try {
      await maintenanceService.update(selectedRecord.id, {
        status: newStatus,
        assignedTechnician: {
          name: techName,
          unit: 'InternalIT',
        },
        resolutionDetails,
        cost: Number(cost),
        completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
      });

      await logActivity(
        userProfile,
        'UPDATE_MAINTENANCE',
        'MAINTENANCE',
        `Cập nhật phiếu bảo trì ${selectedRecord.id}: Trạng thái ${newStatus}, Chi phí: ${cost} đ`,
        selectedRecord.deviceId,
        selectedRecord.deviceCode
      );

      showSuccess('Cập nhật tiến độ bảo trì thành công!');
      setSelectedRecord(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi cập nhật phiếu bảo trì.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          QUẢN LÝ BẢO TRÌ & SỬA CHỮA THIẾT BỊ CNTT
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Theo dõi vòng đời khắc phục sự cố, thay thế linh kiện và chi phí sửa chữa toàn bệnh viện
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã phiếu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thiết bị & Khoa phòng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Hiện tượng sự cố</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mức ưu tiên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Kỹ thuật viên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chi phí (VNĐ)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Không có phiếu sự cố hoặc bảo trì nào đang ghi nhận.
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => {
                const statusMeta = getTicketStatusMeta(rec.status);
                const priorityMeta = getPriorityMeta(rec.priority);

                return (
                  <TableRow key={rec.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{rec.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {rec.deviceCode}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        {rec.deviceName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284c7' }}>
                        Khoa: {rec.departmentName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {rec.issueDescription}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Gửi lúc: {formatDate(rec.reportedAt, true)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={priorityMeta.label} color={priorityMeta.color} size="small" />
                    </TableCell>
                    <TableCell>
                      {rec.assignedTechnician?.name || <span style={{ color: '#94a3b8' }}>Chưa phân công</span>}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(rec.cost)}</TableCell>
                    <TableCell>
                      <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<BuildIcon />}
                        onClick={() => handleOpenProcess(rec)}
                      >
                        Xử lý
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Xử lý kỹ thuật */}
      <Dialog open={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>
          CẬP NHẬT TIẾN ĐỘ BẢO TRÌ: {selectedRecord?.deviceCode}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Lỗi mô tả: <em>"{selectedRecord?.issueDescription}"</em>
          </Typography>

          <TextField
            select
            label="Trạng thái xử lý *"
            size="small"
            fullWidth
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Pending">Chờ tiếp nhận</MenuItem>
            <MenuItem value="InProgress">Đang tiến hành sửa chữa</MenuItem>
            <MenuItem value="Completed">Đã sửa xong & Nghiệm thu hoạt động tốt</MenuItem>
            <MenuItem value="TransferredToVendor">Chuyển hãng bảo hành chính thức</MenuItem>
            <MenuItem value="Rejected">Từ chối (Không phải sự cố kỹ thuật)</MenuItem>
          </TextField>

          <TextField
            label="Kỹ thuật viên phụ trách"
            size="small"
            fullWidth
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Biện pháp xử lý / Linh kiện thay thế"
            multiline
            rows={3}
            fullWidth
            value={resolutionDetails}
            onChange={(e) => setResolutionDetails(e.target.value)}
            placeholder="Ví dụ: Vệ sinh nguồn, bôi keo tản nhiệt, thay thế ổ SSD Kingston 256GB mới..."
            sx={{ mb: 2 }}
          />

          <TextField
            label="Tổng chi phí phát sinh (VNĐ)"
            type="number"
            size="small"
            fullWidth
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedRecord(null)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSaveProcess} sx={{ fontWeight: 700 }}>
            LƯU KẾT QUẢ XỬ LÝ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
