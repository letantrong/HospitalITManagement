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
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import LanIcon from '@mui/icons-material/Lan';
import DevicesIcon from '@mui/icons-material/Devices';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  ipAddressService,
  ipNetworkService,
  departmentService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import { getIpStatusMeta } from '../../utils/ipamUtils';
import { formatDate } from '../../utils/formatters';
import type { IpAddress, IpNetwork, Department } from '../../types';

export const IpAddressListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const queryParams = new URLSearchParams(location.search);
  const initialNetworkId = queryParams.get('networkId') || 'ALL';

  const [ips, setIps] = useState<IpAddress[]>([]);
  const [networks, setNetworks] = useState<IpNetwork[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState(initialNetworkId);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modal Reserve / Block
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'RESERVE' | 'BLOCK'>('RESERVE');
  const [selectedIp, setSelectedIp] = useState<IpAddress | null>(null);
  const [actionReason, setActionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ipList, netList, deptList] = await Promise.all([
        ipAddressService.getAll(
          {
            networkId: selectedNetwork,
            status: selectedStatus,
            departmentId: selectedDept,
            searchTerm,
          },
          userProfile
        ),
        ipNetworkService.getAll(userProfile),
        departmentService.getAll(),
      ]);
      setIps(ipList);
      setNetworks(netList);
      setDepartments(deptList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile, selectedNetwork, selectedStatus, selectedDept]);

  const handleOpenAction = (ip: IpAddress, type: 'RESERVE' | 'BLOCK') => {
    setSelectedIp(ip);
    setActionType(type);
    setActionReason(type === 'RESERVE' ? 'Giữ chỗ cho thiết bị y tế chuyên dụng' : 'Khóa bảo vệ an ninh mạng');
    setActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedIp) return;
    try {
      if (actionType === 'RESERVE') {
        await ipAddressService.reserve(selectedIp.id, actionReason, userProfile!);
        await logActivity(
          userProfile,
          'RESERVE_IP',
          'IPAM',
          `Giữ chỗ IP ${selectedIp.ipAddress}. Lý do: ${actionReason}`,
          selectedIp.id,
          selectedIp.ipAddress
        );
        showSuccess(`Đã giữ chỗ địa chỉ IP: ${selectedIp.ipAddress}`);
      } else {
        await ipAddressService.block(selectedIp.id, actionReason, userProfile!);
        await logActivity(
          userProfile,
          'BLOCK_IP',
          'IPAM',
          `Khóa địa chỉ IP ${selectedIp.ipAddress}. Lý do: ${actionReason}`,
          selectedIp.id,
          selectedIp.ipAddress
        );
        showSuccess(`Đã khóa địa chỉ IP: ${selectedIp.ipAddress}`);
      }
      setActionModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi thao tác IP.');
    }
  };

  const handleUnblockOrUnreserve = async (ip: IpAddress) => {
    if (!isAdmin) return;
    try {
      await ipAddressService.unblockOrUnreserve(ip.id, userProfile!);
      await logActivity(
        userProfile,
        'UNBLOCK_IP',
        'IPAM',
        `Giải phóng địa chỉ IP ${ip.ipAddress} về Available`,
        ip.id,
        ip.ipAddress
      );
      showSuccess(`Đã giải phóng IP ${ip.ipAddress} về trạng thái Available.`);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi giải phóng IP.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            DANH SÁCH ĐỊA CHỈ IP TOÀN VIỆN (IP REGISTRY)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Theo dõi trạng thái từng địa chỉ IP: Còn trống, Giữ chỗ, Đã cấp phát cho thiết bị, Khóa an toàn
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LanIcon />}
            onClick={() => navigate('/ipam/assignment')}
            sx={{ fontWeight: 700 }}
          >
            CẤP PHÁT IP CHO THIẾT BỊ
          </Button>
        )}
      </Box>

      {/* Thanh Tìm kiếm & Lọc Đa Chiều */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm kiếm IP (vd: 192.168.10.45), mã thiết bị, tên máy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
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

            <TextField
              select
              size="small"
              fullWidth
              label="Dải mạng"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <MenuItem value="ALL">-- Tất cả dải mạng --</MenuItem>
              {networks.map((net) => (
                <MenuItem key={net.id} value={net.id}>
                  {net.networkName} ({net.networkAddress}/{net.cidr})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              fullWidth
              label="Trạng thái IP"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="ALL">-- Tất cả trạng thái --</MenuItem>
              <MenuItem value="Available">Còn trống (Available)</MenuItem>
              <MenuItem value="Assigned">Đã cấp phát (Assigned)</MenuItem>
              <MenuItem value="Reserved">Giữ chỗ (Reserved)</MenuItem>
              <MenuItem value="Blocked">Đã khóa (Blocked)</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              fullWidth
              label="Khoa / Phòng ban"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <MenuItem value="ALL">-- Tất cả khoa phòng --</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Bảng Danh sách IP */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IPv4</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thuộc Dải Mạng</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>VLAN</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thiết bị đang sử dụng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ghi chú / Lý do</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ngày cấp / Cán bộ</TableCell>
              {isAdmin && <TableCell sx={{ fontWeight: 700, textAlign: 'center', width: 140 }}>Thao tác</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {ips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Không tìm thấy địa chỉ IP nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              ips
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((ip) => {
                  const meta = getIpStatusMeta(ip.status);
                  return (
                    <TableRow key={ip.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: meta.hex, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {ip.ipAddress}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ip.networkName || ip.networkId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip label={`VLAN ${ip.vlanId || 1}`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={meta.label.split(' ')[0]}
                          color={meta.color}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        {ip.deviceId ? (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: '#0284c7',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                              onClick={() => navigate(`/devices/${ip.deviceId}`)}
                            >
                              {ip.deviceCode}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                              {ip.deviceName} ({ip.departmentName})
                            </Typography>
                          </Box>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                          {ip.reservedReason || ip.note || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {ip.assignedAt ? (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 600, display: 'block' }}>
                              {formatDate(ip.assignedAt)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {ip.assignedByName || 'Admin'}
                            </Typography>
                          </Box>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            {ip.status === 'Available' && (
                              <>
                                <Tooltip title="Giữ chỗ IP (Reserved)">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleOpenAction(ip, 'RESERVE')}
                                  >
                                    <BookmarkIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Khóa IP (Blocked)">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenAction(ip, 'BLOCK')}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                            {(ip.status === 'Reserved' || ip.status === 'Blocked') && (
                              <Tooltip title="Giải phóng về Còn trống (Available)">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUnblockOrUnreserve(ip)}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {ip.status === 'Assigned' && (
                              <Tooltip title="Xem chi tiết thiết bị">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/devices/${ip.deviceId}`)}
                                >
                                  <DevicesIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={ips.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
        />
      </TableContainer>

      {/* Modal Giữ Chỗ / Khóa IP */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: actionType === 'RESERVE' ? '#f59e0b' : '#ef4444' }}>
          {actionType === 'RESERVE' ? 'GIỮ CHỖ ĐỊA CHỈ IP' : 'KHÓA ĐỊA CHỈ IP'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#0f172a' }}>
            Địa chỉ IP: <strong>{selectedIp?.ipAddress}</strong> ({selectedIp?.networkName})
          </Typography>

          <TextField
            label={actionType === 'RESERVE' ? 'Lý do giữ chỗ *' : 'Lý do khóa IP *'}
            multiline
            rows={3}
            fullWidth
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder={
              actionType === 'RESERVE'
                ? 'Ví dụ: Đặt trước cho Máy đo điện cơ Khoa PHCN quý 4/2026'
                : 'Ví dụ: Khóa ngăn chặn xung đột IP cổng quang'
            }
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionModalOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            color={actionType === 'RESERVE' ? 'warning' : 'error'}
            onClick={handleConfirmAction}
            sx={{ fontWeight: 700 }}
          >
            XÁC NHẬN {actionType === 'RESERVE' ? 'GIỮ CHỖ' : 'KHÓA IP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
