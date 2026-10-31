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
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LanIcon from '@mui/icons-material/Lan';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ipNetworkService, departmentService } from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import {
  cidrToSubnetMask,
  isValidIpv4,
  calculateSubnetDetails,
  isIpInSubnet,
} from '../../utils/ipamUtils';
import type { IpNetwork, Department } from '../../types';

export const IpNetworkListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [networks, setNetworks] = useState<IpNetwork[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVlan, setSelectedVlan] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Dialog Thêm / Sửa dải mạng
  const [formOpen, setFormOpen] = useState(false);
  const [editingNet, setEditingNet] = useState<IpNetwork | null>(null);

  const [networkName, setNetworkName] = useState('');
  const [networkAddress, setNetworkAddress] = useState('192.168.40.0');
  const [cidr, setCidr] = useState<number>(24);
  const [gateway, setGateway] = useState('192.168.40.1');
  const [dnsPrimary, setDnsPrimary] = useState('192.168.1.10');
  const [dnsSecondary, setDnsSecondary] = useState('8.8.8.8');
  const [vlanId, setVlanId] = useState<number>(40);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [netList, deptList] = await Promise.all([
        ipNetworkService.getAll(userProfile),
        departmentService.getAll(),
      ]);
      setNetworks(netList);
      setDepartments(deptList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  // Tự động tính toán Gateway gợi ý khi thay đổi Network Address
  const handleNetworkAddressChange = (val: string) => {
    setNetworkAddress(val);
    const parts = val.trim().split('.');
    if (parts.length === 4 && parts[3] === '0') {
      setGateway(`${parts[0]}.${parts[1]}.${parts[2]}.1`);
    }
  };

  const handleOpenAdd = () => {
    setEditingNet(null);
    setNetworkName('');
    setNetworkAddress('192.168.40.0');
    setCidr(24);
    setGateway('192.168.40.1');
    setDnsPrimary('192.168.1.10');
    setDnsSecondary('8.8.8.8');
    setVlanId(40);
    setSelectedDeptIds([]);
    setDescription('');
    setFormError('');
    setFormOpen(true);
  };

  const handleOpenEdit = (net: IpNetwork) => {
    setEditingNet(net);
    setNetworkName(net.networkName);
    setNetworkAddress(net.networkAddress);
    setCidr(net.cidr);
    setGateway(net.gateway);
    setDnsPrimary(net.dnsPrimary);
    setDnsSecondary(net.dnsSecondary || '');
    setVlanId(net.vlanId || 1);
    setSelectedDeptIds(net.departmentIds || []);
    setDescription(net.description || '');
    setFormError('');
    setFormOpen(true);
  };

  const handleDeptSelect = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedDeptIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!networkName || !networkAddress || !cidr || !gateway) {
      setFormError('Vui lòng điền các trường bắt buộc (Tên dải mạng, Địa chỉ mạng, CIDR, Gateway).');
      return;
    }

    if (!isValidIpv4(networkAddress) || !isValidIpv4(gateway)) {
      setFormError('Địa chỉ mạng hoặc Gateway không đúng định dạng IPv4 (vd: 192.168.10.0).');
      return;
    }

    if (!isIpInSubnet(gateway, networkAddress, cidr)) {
      setFormError(`Địa chỉ Gateway (${gateway}) không nằm trong dải mạng ${networkAddress}/${cidr}.`);
      return;
    }

    if (gateway === networkAddress) {
      setFormError('Địa chỉ Gateway không được trùng với Network Address.');
      return;
    }

    const subnetMask = cidrToSubnetMask(cidr);

    try {
      if (editingNet) {
        await ipNetworkService.update(
          editingNet.id,
          {
            networkName,
            dnsPrimary,
            dnsSecondary,
            vlanId: Number(vlanId),
            departmentIds: selectedDeptIds,
            description,
          },
          userProfile!
        );
        showSuccess('Cập nhật thông tin dải mạng thành công!');
      } else {
        await ipNetworkService.create(
          {
            networkName,
            networkAddress,
            cidr: Number(cidr),
            subnetMask,
            gateway,
            dnsPrimary,
            dnsSecondary,
            vlanId: Number(vlanId),
            departmentIds: selectedDeptIds,
            description,
            status: 'Active',
          },
          userProfile!
        );

        await logActivity(
          userProfile,
          'CREATE_NETWORK',
          'IPAM',
          `Tạo mới dải mạng IPAM: ${networkName} (${networkAddress}/${cidr})`
        );
        showSuccess(`Tạo thành công dải mạng ${networkName} và khởi tạo tự động danh sách địa chỉ IP!`);
      }

      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi lưu dải mạng.');
      showError(err.message || 'Lỗi khi lưu.');
    }
  };

  const handleToggleStatus = async (net: IpNetwork) => {
    if (!isAdmin) return;
    const nextStatus = net.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await ipNetworkService.toggleStatus(net.id, nextStatus, userProfile!);
      showSuccess(`Đã chuyển dải mạng ${net.networkName} sang ${nextStatus === 'Active' ? 'Hoạt động' : 'Ngừng sử dụng'}.`);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi đổi trạng thái.');
    }
  };

  const filteredNetworks = networks.filter((n) => {
    const matchSearch =
      !searchTerm ||
      n.networkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.networkAddress.includes(searchTerm) ||
      n.gateway.includes(searchTerm);

    const matchVlan = selectedVlan === 'ALL' || n.vlanId?.toString() === selectedVlan;
    const matchDept = selectedDept === 'ALL' || n.departmentIds.includes(selectedDept);

    return matchSearch && matchVlan && matchDept;
  });

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            QUẢN LÝ DẢI MẠNG NỘI BỘ (IP SUBNETS)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Khai báo phân chia không gian mạng theo VLAN, khu vực và các phòng ban liên kết
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
            THÊM DẢI MẠNG MỚI
          </Button>
        )}
      </Box>

      {/* Bộ lọc Dải mạng */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm kiếm tên dải mạng, IP mạng, gateway..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <TextField
              select
              size="small"
              fullWidth
              label="Lọc theo VLAN"
              value={selectedVlan}
              onChange={(e) => setSelectedVlan(e.target.value)}
            >
              <MenuItem value="ALL">-- Tất cả VLAN --</MenuItem>
              <MenuItem value="1">VLAN 1 (Hạ tầng / Core)</MenuItem>
              <MenuItem value="10">VLAN 10 (Khám bệnh)</MenuItem>
              <MenuItem value="20">VLAN 20 (Phục hồi chức năng)</MenuItem>
              <MenuItem value="30">VLAN 30 (Kế hoạch tổng hợp)</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              fullWidth
              label="Khoa / Phòng liên kết"
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

      {/* Bảng Danh sách Dải mạng */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Tên Dải Mạng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Địa chỉ & Mask</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Gateway & DNS</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>VLAN</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Phòng Liên kết</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Số IP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center', width: 140 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNetworks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Không tìm thấy dải mạng nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredNetworks.map((net) => (
                <TableRow key={net.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                      {net.networkName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {net.description || 'Mạng nội bộ bệnh viện'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {net.networkAddress}/{net.cidr}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Mask: {net.subnetMask}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      GW: {net.gateway}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      DNS: {net.dnsPrimary}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip label={`VLAN ${net.vlanId || 1}`} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {net.departmentIds.map((deptId) => {
                        const d = departments.find((item) => item.id === deptId);
                        return (
                          <Chip
                            key={deptId}
                            label={d?.code || deptId}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {net.totalIps}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                      Trống: {net.availableCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={net.status === 'Active' ? 'Hoạt động' : 'Ngừng'}
                      color={net.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Xem toàn bộ danh sách IP">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/ipam/addresses?networkId=${net.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {isAdmin && (
                        <>
                          <Tooltip title="Chỉnh sửa dải mạng">
                            <IconButton size="small" color="info" onClick={() => handleOpenEdit(net)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={net.status === 'Active' ? 'Ngừng sử dụng dải mạng' : 'Kích hoạt lại'}>
                            <IconButton
                              size="small"
                              color={net.status === 'Active' ? 'warning' : 'success'}
                              onClick={() => handleToggleStatus(net)}
                            >
                              <PowerSettingsNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Thêm / Sửa Dải Mạng */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>
            {editingNet ? `CHỈNH SỬA DẢI MẠNG: ${editingNet.networkName}` : 'KHAI BÁO DẢI MẠNG MỚI (SUBNET)'}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                {formError}
              </Alert>
            )}

            <TextField
              label="Tên định danh dải mạng *"
              size="small"
              fullWidth
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              placeholder="VD: Dải mạng Khoa Khám bệnh & Tiếp nhận BHYT"
              sx={{ mb: 2, mt: 1 }}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Địa chỉ mạng (Network Address) *"
                size="small"
                fullWidth
                disabled={Boolean(editingNet)}
                value={networkAddress}
                onChange={(e) => handleNetworkAddressChange(e.target.value)}
                placeholder="VD: 192.168.10.0"
                required
              />

              <TextField
                select
                label="CIDR (Prefix) *"
                size="small"
                fullWidth
                disabled={Boolean(editingNet)}
                value={cidr}
                onChange={(e) => setCidr(Number(e.target.value))}
                required
              >
                <MenuItem value={24}>/24 (254 host - 255.255.255.0)</MenuItem>
                <MenuItem value={25}>/25 (126 host - 255.255.255.128)</MenuItem>
                <MenuItem value={26}>/26 (62 host - 255.255.255.192)</MenuItem>
                <MenuItem value={27}>/27 (30 host - 255.255.255.224)</MenuItem>
                <MenuItem value={28}>/28 (14 host - 255.255.255.240)</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Gateway mặc định *"
                size="small"
                fullWidth
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                placeholder="VD: 192.168.10.1"
                required
              />

              <TextField
                label="VLAN ID"
                type="number"
                size="small"
                fullWidth
                value={vlanId}
                onChange={(e) => setVlanId(Number(e.target.value))}
                placeholder="VD: 10, 20, 30"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="DNS Chính (Primary) *"
                size="small"
                fullWidth
                value={dnsPrimary}
                onChange={(e) => setDnsPrimary(e.target.value)}
                placeholder="VD: 192.168.1.10"
                required
              />

              <TextField
                label="DNS Phụ (Secondary)"
                size="small"
                fullWidth
                value={dnsSecondary}
                onChange={(e) => setDnsSecondary(e.target.value)}
                placeholder="VD: 8.8.8.8"
              />
            </Box>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Khoa / Phòng ban được phép sử dụng *</InputLabel>
              <Select
                multiple
                value={selectedDeptIds}
                onChange={handleDeptSelect}
                input={<OutlinedInput label="Khoa / Phòng ban được phép sử dụng *" />}
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

            <TextField
              label="Mô tả mục đích sử dụng dải mạng"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              {editingNet ? 'LƯU CẬP NHẬT' : 'KHAI BÁO & SINH IP'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
