import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import ComputerIcon from '@mui/icons-material/Computer';
import LanIcon from '@mui/icons-material/Lan';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppGrid from '../../components/common/AppGrid';
import { useAuth } from '../../contexts/AuthContext';
import {
  deviceService,
  ipNetworkService,
  ipAddressService,
  ipAssignmentService,
} from '../../services/dataStorageService';
import { Device, IpNetwork, IpAddress } from '../../types';

export const IpAssignmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Danh sách dữ liệu
  const [devices, setDevices] = useState<Device[]>([]);
  const [networks, setNetworks] = useState<IpNetwork[]>([]);
  const [availableIps, setAvailableIps] = useState<IpAddress[]>([]);

  // Lựa chọn hiện tại
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    searchParams.get('deviceId') || ''
  );
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [selectedIpId, setSelectedIpId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState<string>('Cấp phát IP tĩnh đưa thiết bị vào vận hành mạng bệnh viện');

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);
  const selectedIp = availableIps.find((ip) => ip.id === selectedIpId);

  const steps = [
    'Chọn thiết bị cần cấp IP',
    'Chọn dải mạng (Subnet / VLAN)',
    'Chọn địa chỉ IP & Xác nhận',
  ];

  useEffect(() => {
    loadInitialData();
  }, [userProfile]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [allDevs, allNets] = await Promise.all([
        deviceService.getAll(userProfile),
        ipNetworkService.getAll(userProfile),
      ]);

      // Chỉ lấy thiết bị chưa có IP và đang ở trạng thái vận hành hoặc sẵn sàng trong kho
      const eligibleDevs = allDevs.filter(
        (d) => !d.assignedIpAddress && (d.status === 'InUse' || d.status === 'Storage')
      );
      setDevices(eligibleDevs);

      // Chỉ lấy các dải mạng Active
      const activeNets = allNets.filter((n) => n.status === 'Active');
      setNetworks(activeNets);

      // Nếu có deviceId từ URL query param, tự động chọn
      const preDeviceId = searchParams.get('deviceId');
      if (preDeviceId) {
        const found = allDevs.find((d) => d.id === preDeviceId);
        if (found) {
          if (found.assignedIpAddress) {
            setErrorMsg(`Thiết bị ${found.deviceCode} đã được gán IP tĩnh (${found.assignedIpAddress}). Vui lòng thu hồi hoặc đổi IP.`);
          } else {
            setSelectedDeviceId(found.id);
            // Gợi ý dải mạng nếu trùng phòng ban
            const matchedNet = activeNets.find((net) =>
              net.departmentIds.includes(found.departmentId)
            );
            if (matchedNet) {
              setSelectedNetworkId(matchedNet.id);
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu cấp phát IP.');
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn hoặc đổi dải mạng, tải các IP Available trong dải mạng đó
  useEffect(() => {
    if (selectedNetworkId) {
      loadAvailableIps(selectedNetworkId);
    } else {
      setAvailableIps([]);
      setSelectedIpId('');
    }
  }, [selectedNetworkId]);

  const loadAvailableIps = async (networkId: string) => {
    try {
      const ips = await ipAddressService.getAvailableByNetwork(networkId);
      setAvailableIps(ips);
      if (ips.length > 0) {
        // Tự động gợi ý IP Available đầu tiên
        setSelectedIpId(ips[0].id);
      } else {
        setSelectedIpId('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải danh sách IP trống.');
    }
  };

  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    const dev = devices.find((d) => d.id === devId);
    if (dev) {
      // Gợi ý dải mạng phù hợp theo phòng ban
      const matched = networks.find((net) => net.departmentIds.includes(dev.departmentId));
      if (matched) {
        setSelectedNetworkId(matched.id);
      }
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedDeviceId) {
        setErrorMsg('Vui lòng chọn một thiết bị hợp lệ.');
        return;
      }
      setErrorMsg(null);
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!selectedNetworkId) {
        setErrorMsg('Vui lòng chọn dải mạng nội bộ.');
        return;
      }
      if (availableIps.length === 0) {
        setErrorMsg('Dải mạng này hiện đã hết địa chỉ IP Available.');
        return;
      }
      setErrorMsg(null);
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleConfirmAssignment = async () => {
    if (!isAdmin) {
      setErrorMsg('Chỉ Quản trị viên (Admin) mới có quyền thực hiện cấp phát IP tĩnh.');
      return;
    }
    if (!selectedDeviceId || !selectedIpId || !selectedNetworkId) {
      setErrorMsg('Vui lòng hoàn thành đủ các bước lựa chọn cấu hình.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await ipAssignmentService.assignStaticIp({
        deviceId: selectedDeviceId,
        ipAddressId: selectedIpId,
        networkId: selectedNetworkId,
        note: assignmentNote,
        user: userProfile!,
      });

      setSuccessMsg(res.message);
      // Chuyển bước hoàn tất
      setActiveStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi trong quá trình cấp phát IP.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Bạn không có quyền truy cập trang này. Chức năng Cấp phát IP tĩnh chỉ dành cho Quản trị viên (Admin).
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Tiêu đề & Nút quay lại */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ipam/addresses')}
          sx={{ mr: 2, textTransform: 'none' }}
        >
          Danh sách IP
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Cấp Phát Địa Chỉ IP Tĩnh Cho Thiết Bị
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gán IP cố định, cấu hình Gateway/DNS và kiểm tra chống xung đột mạng bệnh viện
          </Typography>
        </Box>
      </Box>

      {/* Stepper Wizard */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeStep === 3 ? (
        // Màn hình thành công
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: '#f0fdf4' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#16a34a', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#15803d', mb: 1 }}>
            Cấp Phát IP Tĩnh Thành Công!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {successMsg}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setActiveStep(0);
                setSelectedDeviceId('');
                setSelectedNetworkId('');
                setSelectedIpId('');
                setSuccessMsg(null);
                loadInitialData();
              }}
            >
              Cấp phát cho thiết bị khác
            </Button>
            {selectedDevice && (
              <Button
                variant="contained"
                onClick={() => navigate(`/devices/${selectedDevice.id}`)}
              >
                Xem chi tiết thiết bị ({selectedDevice.deviceCode})
              </Button>
            )}
            <Button
              variant="text"
              onClick={() => navigate('/ipam/addresses')}
            >
              Xem danh sách IPAM
            </Button>
          </Box>
        </Paper>
      ) : (
        <AppGrid container spacing={3}>
          {/* Cột trái: Form theo bước */}
          <AppGrid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon color="primary" /> Bước 1: Chọn thiết bị CNTT cần cấp IP
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chỉ những thiết bị đang ở trạng thái vận hành hoặc sẵn sàng và <b>chưa được gán IP tĩnh</b> mới hiển thị trong danh sách.
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="select-device-label">Chọn thiết bị</InputLabel>
                    <Select
                      labelId="select-device-label"
                      value={selectedDeviceId}
                      label="Chọn thiết bị"
                      onChange={(e) => handleDeviceChange(e.target.value)}
                    >
                      {devices.length === 0 ? (
                        <MenuItem disabled value="">
                          Không có thiết bị nào cần cấp IP (Tất cả đã có IP hoặc không đủ điều kiện)
                        </MenuItem>
                      ) : (
                        devices.map((dev) => (
                          <MenuItem key={dev.id} value={dev.id}>
                            <b>{dev.deviceCode}</b> - {dev.name} ({dev.departmentName})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  {selectedDevice && (
                    <Card variant="outlined" sx={{ bgcolor: '#f8fafc', mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                          Thông tin thiết bị đã chọn:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.875rem' }}>
                          <div><b>Mã thiết bị:</b> {selectedDevice.deviceCode}</div>
                          <div><b>Tên máy:</b> {selectedDevice.name}</div>
                          <div><b>Khoa / Phòng ban:</b> {selectedDevice.departmentName}</div>
                          <div><b>Loại thiết bị:</b> {selectedDevice.categoryName}</div>
                          <div><b>Địa chỉ MAC:</b> {selectedDevice.macAddress || selectedDevice.specifications?.macAddress || 'Chưa khai báo'}</div>
                          <div>
                            <b>Trạng thái vận hành:</b>{' '}
                            <Chip size="small" label={selectedDevice.status} color="success" />
                          </div>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!selectedDeviceId}
                    >
                      Tiếp tục: Chọn Dải Mạng &rarr;
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanIcon color="primary" /> Bước 2: Chọn dải mạng (Subnet / VLAN)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chọn dải mạng phụ trách phòng ban của thiết bị. Hệ thống sẽ tự động đối chiếu các IP trống khả dụng.
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="select-net-label">Chọn dải mạng</InputLabel>
                    <Select
                      labelId="select-net-label"
                      value={selectedNetworkId}
                      label="Chọn dải mạng"
                      onChange={(e) => setSelectedNetworkId(e.target.value)}
                    >
                      {networks.map((net) => (
                        <MenuItem key={net.id} value={net.id}>
                          {net.networkName} ({net.networkAddress}/{net.cidr}) - VLAN: {net.vlanId || 'Default'} [Trống: {net.availableCount} IP]
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedNetwork && (
                    <Card variant="outlined" sx={{ bgcolor: '#f0f9ff', borderColor: '#bae6fd', mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369a1', mb: 1 }}>
                          Thông số dải mạng đã chọn:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.875rem' }}>
                          <div><b>Dải mạng:</b> {selectedNetwork.networkAddress}/{selectedNetwork.cidr}</div>
                          <div><b>Subnet Mask:</b> {selectedNetwork.subnetMask}</div>
                          <div><b>Default Gateway:</b> {selectedNetwork.gateway}</div>
                          <div><b>DNS Primary / Secondary:</b> {selectedNetwork.dnsPrimary} / {selectedNetwork.dnsSecondary || '8.8.4.4'}</div>
                          <div><b>VLAN ID:</b> {selectedNetwork.vlanId || 'None'}</div>
                          <div><b>Số IP còn trống:</b> <span style={{ color: '#16a34a', fontWeight: 700 }}>{availableIps.length} IP</span></div>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" onClick={handleBack}>
                      &larr; Quay lại
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!selectedNetworkId || availableIps.length === 0}
                    >
                      Tiếp tục: Chọn Địa chỉ IP &rarr;
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsEthernetIcon color="primary" /> Bước 3: Chọn địa chỉ IP & Xác nhận cấp phát
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="select-ip-label">Địa chỉ IP Available</InputLabel>
                    <Select
                      labelId="select-ip-label"
                      value={selectedIpId}
                      label="Địa chỉ IP Available"
                      onChange={(e) => setSelectedIpId(e.target.value)}
                    >
                      {availableIps.map((ip) => (
                        <MenuItem key={ip.id} value={ip.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span><b>{ip.ipAddress}</b></span>
                            <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Khả dụng (Available)</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Lý do / Ghi chú cấp phát"
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 3 }}
                  />

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Hành động này sẽ thực hiện <b>Giao dịch nguyên tử (Atomic Transaction)</b>: chuyển trạng thái IP sang <b>Assigned</b>, cập nhật vào hồ sơ thiết bị và ghi nhận lịch sử bất biến.
                  </Alert>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" onClick={handleBack} disabled={submitting}>
                      &larr; Quay lại
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleConfirmAssignment}
                      disabled={!selectedIpId || submitting}
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                    >
                      {submitting ? 'Đang thực hiện giao dịch...' : 'Xác nhận Cấp phát IP'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </AppGrid>

          {/* Cột phải: Xem trước cấu hình mạng thiết bị */}
          <AppGrid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
                Bản Cấu Hình Mạng Dự Kiến (Network Config)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">THIẾT BỊ ĐƯỢC CẤP:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedDevice ? `${selectedDevice.deviceCode} - ${selectedDevice.name}` : '(Chưa chọn)'}
                  </Typography>
                  {selectedDevice && (
                    <Typography variant="caption" sx={{ color: '#0284c7' }}>
                      Phòng ban: {selectedDevice.departmentName}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">ĐỊA CHỈ IP TĨNH (STATIC IP):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: selectedIp ? '#0284c7' : '#94a3b8' }}>
                    {selectedIp ? selectedIp.ipAddress : '(Chưa chọn IP)'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">SUBNET MASK:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedNetwork?.subnetMask || '---.---.---.---'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">DEFAULT GATEWAY:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedNetwork?.gateway || '---.---.---.---'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">DNS SERVERS:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    Chính: {selectedNetwork?.dnsPrimary || '---'} | Phụ: {selectedNetwork?.dnsSecondary || '---'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">VLAN ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedNetwork?.vlanId ? `VLAN ${selectedNetwork.vlanId}` : 'None'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                * Sau khi cấp phát thành công, kỹ thuật viên có thể in cấu hình hoặc dán nhãn IP tĩnh lên thiết bị để bàn giao cho khoa phòng.
              </Typography>
            </Paper>
          </AppGrid>
        </AppGrid>
      )}
    </Box>
  );
};
