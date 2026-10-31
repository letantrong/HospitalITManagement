import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TableHead,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import QRCode from 'qrcode';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import BuildIcon from '@mui/icons-material/Build';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import HistoryIcon from '@mui/icons-material/History';
import LanIcon from '@mui/icons-material/Lan';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  deviceService,
  maintenanceService,
  transferService,
  departmentService,
  ipAssignmentService,
  ipAddressService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import {
  formatCurrency,
  formatDate,
  calculateRemainingValue,
  getDeviceStatusMeta,
  getDeviceConditionMeta,
} from '../../utils/formatters';
import type { Device, Department, IpAssignmentHistory, IpAddress } from '../../types';

export const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [device, setDevice] = useState<Device | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Dialog Báo hỏng
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<any>('Medium');

  // Dialog Điều chuyển
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // IPAM Dialogs & State
  const [releaseIpOpen, setReleaseIpOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [ipSubmitting, setIpSubmitting] = useState(false);

  const [changeIpOpen, setChangeIpOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [availableIpsForChange, setAvailableIpsForChange] = useState<IpAddress[]>([]);
  const [newIpAddressId, setNewIpAddressId] = useState('');

  const [ipHistoryOpen, setIpHistoryOpen] = useState(false);
  const [deviceIpHistories, setDeviceIpHistories] = useState<IpAssignmentHistory[]>([]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      const [dev, deptList] = await Promise.all([
        deviceService.getById(id),
        departmentService.getAll(),
      ]);

      if (dev) {
        setDevice(dev);
        // Tạo QR Code dạng DataURL
        const qrPayload = JSON.stringify({
          hospital: 'BVPHCN_DongThap',
          deviceCode: dev.deviceCode,
          token: dev.qrCodeToken,
          id: dev.id,
        });
        const url = await QRCode.toDataURL(qrPayload, {
          width: 200,
          margin: 1,
          color: { dark: '#0284c7', light: '#ffffff' },
        });
        setQrDataUrl(url);
      }
      setDepartments(deptList);
    };

    loadDetail();
  }, [id]);

  if (!device) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải thông tin thiết bị hoặc thiết bị không tồn tại...
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/devices')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const statusMeta = getDeviceStatusMeta(device.status);
  const conditionMeta = getDeviceConditionMeta(device.condition);
  const depreciationInfo = calculateRemainingValue(
    device.originalCost,
    device.purchaseDate,
    device.depreciationRate
  );

  // Xử lý gửi báo hỏng
  const handleSubmitIssue = async () => {
    if (!issueDescription) {
      showError('Vui lòng mô tả sự cố gặp phải.');
      return;
    }
    try {
      await maintenanceService.create({
        deviceId: device.id,
        deviceCode: device.deviceCode,
        deviceName: device.name,
        departmentId: device.departmentId,
        departmentName: device.departmentName,
        ticketType: 'IssueReport',
        priority: ticketPriority,
        status: 'Pending',
        reportedBy: userProfile?.id || 'anonymous',
        reportedByName: userProfile?.displayName || 'Cán bộ khoa',
        issueDescription,
        cost: 0,
      });

      await logActivity(
        userProfile,
        'CREATE_MAINTENANCE',
        'MAINTENANCE',
        `Gửi báo hỏng cho thiết bị: ${device.deviceCode} (${device.name})`,
        device.id,
        device.deviceCode
      );

      showSuccess('Đã gửi phiếu báo hỏng thành công!');
      setReportIssueOpen(false);
      setIssueDescription('');
      // Cập nhật lại trạng thái thiết bị
      const updated = await deviceService.getById(device.id);
      if (updated) setDevice(updated);
    } catch (err: any) {
      showError(err.message || 'Lỗi gửi yêu cầu bảo trì.');
    }
  };

  // Xử lý đề xuất điều chuyển
  const handleSubmitTransfer = async () => {
    if (!targetDeptId || !transferReason) {
      showError('Vui lòng chọn khoa tiếp nhận và ghi rõ lý do.');
      return;
    }
    const toDept = departments.find((d) => d.id === targetDeptId);
    try {
      await transferService.create({
        deviceId: device.id,
        deviceCode: device.deviceCode,
        deviceName: device.name,
        fromDepartmentId: device.departmentId,
        fromDepartmentName: device.departmentName,
        fromLocationId: device.locationId,
        fromLocationName: device.locationName,
        toDepartmentId: targetDeptId,
        toDepartmentName: toDept?.name || 'Khoa mới',
        toLocationId: '',
        toLocationName: 'Chưa sắp xếp phòng',
        reason: transferReason,
        requestedBy: userProfile?.id || 'anonymous',
        requestedByName: userProfile?.displayName || 'Cán bộ phụ trách',
      });

      await logActivity(
        userProfile,
        'CREATE_TRANSFER',
        'TRANSFER',
        `Đề xuất điều chuyển thiết bị ${device.deviceCode} sang ${toDept?.name}`,
        device.id,
        device.deviceCode
      );

      showSuccess('Đã gửi đề xuất điều chuyển tới Quản trị viên Bệnh viện!');
      setTransferOpen(false);
      setTransferReason('');
    } catch (err: any) {
      showError(err.message || 'Lỗi gửi đề xuất điều chuyển.');
    }
  };

  // Xử lý mở dialog đổi IP
  const handleOpenChangeIp = async () => {
    if (!device?.networkId) {
      navigate(`/ipam/assignment?deviceId=${device?.id}`);
      return;
    }
    try {
      const ips = await ipAddressService.getAvailableByNetwork(device.networkId);
      setAvailableIpsForChange(ips);
      if (ips.length > 0) setNewIpAddressId(ips[0].id);
      setChangeReason('');
      setChangeIpOpen(true);
    } catch (err: any) {
      showError(err.message || 'Không thể tải danh sách IP trống.');
    }
  };

  // Xác nhận đổi IP
  const handleConfirmChangeIp = async () => {
    if (!device || !newIpAddressId || !changeReason.trim()) {
      showError('Vui lòng chọn IP mới và nhập lý do thay đổi.');
      return;
    }
    try {
      setIpSubmitting(true);
      await ipAssignmentService.changeStaticIp({
        deviceId: device.id,
        newIpAddressId,
        newNetworkId: device.networkId || '',
        reason: changeReason,
        user: userProfile!,
      });
      showSuccess('Thay đổi địa chỉ IP tĩnh thành công!');
      setChangeIpOpen(false);
      const updated = await deviceService.getById(device.id);
      if (updated) setDevice(updated);
    } catch (err: any) {
      showError(err.message || 'Lỗi thay đổi IP.');
    } finally {
      setIpSubmitting(false);
    }
  };

  // Xác nhận thu hồi IP
  const handleConfirmReleaseIp = async () => {
    if (!device || !releaseReason.trim()) {
      showError('Vui lòng nhập lý do thu hồi IP.');
      return;
    }
    try {
      setIpSubmitting(true);
      await ipAssignmentService.releaseStaticIp({
        deviceId: device.id,
        reason: releaseReason,
        user: userProfile!,
      });
      showSuccess(`Đã thu hồi IP tĩnh ${device.assignedIpAddress} thành công.`);
      setReleaseIpOpen(false);
      setReleaseReason('');
      const updated = await deviceService.getById(device.id);
      if (updated) setDevice(updated);
    } catch (err: any) {
      showError(err.message || 'Lỗi thu hồi IP.');
    } finally {
      setIpSubmitting(false);
    }
  };

  // Xem lịch sử IP của thiết bị
  const handleOpenIpHistory = async () => {
    if (!device) return;
    try {
      const histories = await ipAssignmentService.getHistoryByDevice(device.id);
      setDeviceIpHistories(histories);
      setIpHistoryOpen(true);
    } catch (err: any) {
      showError(err.message || 'Lỗi tải lịch sử IP.');
    }
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Tem Nhãn Thiết Bị - ${device.deviceCode}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; display: flex; justify-content: center; }
            .label-card {
              width: 320px;
              border: 2px solid #0284c7;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 10px;
            }
            .qr-box img { width: 100px; height: 100px; }
            .info-box { flex: 1; font-size: 11px; }
            .hospital-title { font-size: 10px; font-weight: bold; color: #0284c7; margin-bottom: 4px; text-transform: uppercase; }
            .device-code { font-size: 13px; font-weight: bold; color: #000; margin-bottom: 4px; }
            .device-name { font-weight: bold; color: #333; margin-bottom: 2px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <div class="qr-box">
              <img src="${qrDataUrl}" />
            </div>
            <div class="info-box">
              <div class="hospital-title">BV PHỤC HỒI CHỨC NĂNG</div>
              <div class="device-code">${device.deviceCode}</div>
              <div class="device-name">${device.name}</div>
              <div>Khoa: ${device.departmentName}</div>
              <div>Vị trí: ${device.locationName || 'N/A'}</div>
              <div>SN: ${device.serialNumber || 'N/A'}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box>
      {/* Nút quay lại & Thao tác */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/devices')} sx={{ fontWeight: 600 }}>
          Quay lại danh sách
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintLabel}
            sx={{ fontWeight: 600 }}
          >
            In Tem QR Nhãn
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<BuildIcon />}
            onClick={() => setReportIssueOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            Báo hỏng / Sự cố
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<MoveUpIcon />}
            onClick={() => setTransferOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Đề xuất Điều chuyển
          </Button>
        </Box>
      </Box>

      {/* Thông tin chính */}
      <Grid container spacing={3}>
        {/* Cột trái: Chi tiết cấu hình & Thông tin chung */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284c7' }}>
                    {device.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 600, mt: 0.5 }}>
                    Mã thiết bị: <strong>{device.deviceCode}</strong>
                  </Typography>
                </Box>
                <Chip label={statusMeta.label} color={statusMeta.color} sx={{ fontWeight: 700 }} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                HỒ SƠ ĐỊNH DANH & PHÂN CÔNG
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Khoa / Phòng quản lý</TableCell>
                      <TableCell>{device.departmentName}</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Vị trí lắp đặt</TableCell>
                      <TableCell>{device.locationName || 'Chưa định vị'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Danh mục loại thiết bị</TableCell>
                      <TableCell>{device.categoryName}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Tình trạng kỹ thuật</TableCell>
                      <TableCell>
                        <Chip label={conditionMeta.label} color={conditionMeta.color} size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Hãng sản xuất</TableCell>
                      <TableCell>{device.manufacturer || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Model máy</TableCell>
                      <TableCell>{device.model || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Số Serial</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{device.serialNumber || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Cán bộ phụ trách</TableCell>
                      <TableCell>
                        {device.assignedUser?.name ? (
                          <>
                            <strong>{device.assignedUser.name}</strong> - {device.assignedUser.position} ({device.assignedUser.phone || 'Không có SĐT'})
                          </>
                        ) : (
                          'Chưa bàn giao cụ thể'
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                THÔNG SỐ KỸ THUẬT CHI TIẾT
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Bộ vi xử lý (CPU)</TableCell>
                      <TableCell>{device.specifications?.cpu || 'Không áp dụng'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Bộ nhớ RAM</TableCell>
                      <TableCell>{device.specifications?.ram || 'Không áp dụng'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Ổ đĩa lưu trữ</TableCell>
                      <TableCell>{device.specifications?.storage || 'Không áp dụng'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Hệ điều hành</TableCell>
                      <TableCell>{device.specifications?.os || 'Không áp dụng'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Địa chỉ MAC</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{device.macAddress || device.specifications?.macAddress || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Ghi chú kỹ thuật khác</TableCell>
                      <TableCell>{device.specifications?.others || 'Không có'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* KHU VỰC QUẢN LÝ ĐỊA CHỈ IP TĨNH (IPAM) */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanIcon fontSize="small" /> THÔNG TIN ĐỊA CHỈ IP TĨNH (IPAM)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={handleOpenIpHistory}
                    sx={{ textTransform: 'none' }}
                  >
                    Lịch sử IP
                  </Button>
                  {isAdmin && (
                    <>
                      {device.assignedIpAddress ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SwapHorizIcon />}
                            onClick={handleOpenChangeIp}
                            sx={{ textTransform: 'none' }}
                          >
                            Đổi IP
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<RemoveCircleIcon />}
                            onClick={() => {
                              setReleaseReason('');
                              setReleaseIpOpen(true);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Thu hồi IP
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<SettingsEthernetIcon />}
                          onClick={() => navigate(`/ipam/assignment?deviceId=${device.id}`)}
                          sx={{ textTransform: 'none' }}
                        >
                          Cấp phát IP tĩnh
                        </Button>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #bae6fd', bgcolor: device.assignedIpAddress ? '#f0f9ff' : '#f8fafc', mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#e0f2fe' }}>Địa chỉ IP tĩnh</TableCell>
                      <TableCell>
                        {device.assignedIpAddress ? (
                          <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#0369a1', fontSize: '1rem' }}>
                            {device.assignedIpAddress}
                          </Typography>
                        ) : (
                          <Chip label="Chưa cấp phát IP tĩnh" size="small" sx={{ bgcolor: '#e2e8f0', color: '#64748b' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#e0f2fe' }}>Dải mạng & VLAN</TableCell>
                      <TableCell>
                        {device.networkName ? (
                          <>
                            <b>{device.networkName}</b>
                            {device.vlanId && <span style={{ color: '#0284c7' }}> (VLAN {device.vlanId})</span>}
                          </>
                        ) : (
                          'Chưa liên kết'
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e0f2fe' }}>Subnet Mask</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{device.subnetMask || '---'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e0f2fe' }}>Default Gateway</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{device.gateway || '---'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e0f2fe' }}>Hệ thống DNS</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        Chính: {device.dnsPrimary || '---'} | Phụ: {device.dnsSecondary || '---'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#e0f2fe' }}>Thông tin cấp phát</TableCell>
                      <TableCell>
                        {device.assignedIpAddress ? (
                          <Typography variant="caption" sx={{ display: 'block', color: '#334155' }}>
                            Cấp ngày: {device.ipAssignedAt ? formatDate(device.ipAssignedAt) : 'N/A'}<br />
                            Người cấp: <b>{device.ipAssignedBy || 'Quản trị viên'}</b>
                          </Typography>
                        ) : (
                          'Chưa có dữ liệu'
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                TÀI CHÍNH & KHẤU HAO
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Nguyên giá ban đầu</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(device.originalCost)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%', bgcolor: '#f8fafc' }}>Tỷ lệ khấu hao</TableCell>
                      <TableCell>{device.depreciationRate || 20}% / năm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Ngày đưa vào sử dụng</TableCell>
                      <TableCell>{formatDate(device.purchaseDate)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Thời gian đã sử dụng</TableCell>
                      <TableCell>{depreciationInfo.usedYears} năm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Hạn bảo hành</TableCell>
                      <TableCell>{formatDate(device.warrantyExpiryDate)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Giá trị còn lại dự tính</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: depreciationInfo.isFullyDepreciated ? '#ef4444' : '#0284c7' }}>
                        {formatCurrency(depreciationInfo.remainingValue)}
                        {depreciationInfo.isFullyDepreciated && ' (Đã khấu hao hết)'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cột phải: Tem Mã QR Code */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0284c7', mb: 1 }}>
                TEM MÃ QR BỆNH VIỆN
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Dùng camera quét tem để truy xuất thông tin hoặc kiểm kê
              </Typography>

              {qrDataUrl && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    display: 'inline-block',
                    border: '1px solid #e2e8f0',
                    mb: 2,
                  }}
                >
                  <img src={qrDataUrl} alt="QR Code" style={{ display: 'block', maxWidth: 180 }} />
                </Box>
              )}

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {device.deviceCode}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', display: 'block', fontWeight: 600, mt: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Mã QR Token Hợp lệ
              </Typography>

              <Button
                variant="contained"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={handlePrintLabel}
                sx={{ mt: 2.5, fontWeight: 700 }}
              >
                IN TEM NHÃN (50x30mm)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Báo hỏng */}
      <Dialog open={reportIssueOpen} onClose={() => setReportIssueOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#f59e0b' }}>BÁO CÁO SỰ CỐ / HỎNG HÓC THIẾT BỊ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Thiết bị: <strong>{device.deviceCode}</strong> - {device.name} ({device.departmentName})
          </Typography>

          <TextField
            select
            label="Mức độ khẩn cấp"
            size="small"
            fullWidth
            value={ticketPriority}
            onChange={(e) => setTicketPriority(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Low">Thấp - Không ảnh hưởng ngay</MenuItem>
            <MenuItem value="Medium">Trung bình - Cần sửa trong ngày</MenuItem>
            <MenuItem value="High">Cao - Ảnh hưởng tiếp nhận bệnh nhân</MenuItem>
            <MenuItem value="Emergency">Khẩn cấp - Ngưng trệ phòng khám</MenuItem>
          </TextField>

          <TextField
            label="Mô tả hiện tượng sự cố *"
            multiline
            rows={3}
            fullWidth
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Ví dụ: Bật máy không lên nguồn, màn hình xuất hiện sọc xanh, máy in kẹt giấy..."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReportIssueOpen(false)}>Hủy</Button>
          <Button variant="contained" color="warning" onClick={handleSubmitIssue} sx={{ fontWeight: 700 }}>
            GỬI BÁO HỎNG
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Điều chuyển */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#059669' }}>LẬP PHIẾU ĐỀ XUẤT ĐIỀU CHUYỂN KHOA PHÒNG</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Điều chuyển thiết bị <strong>{device.deviceCode}</strong> từ <strong>{device.departmentName}</strong> sang khoa phòng khác.
          </Typography>

          <TextField
            select
            label="Khoa / Phòng ban tiếp nhận *"
            size="small"
            fullWidth
            value={targetDeptId}
            onChange={(e) => setTargetDeptId(e.target.value)}
            sx={{ mb: 2 }}
          >
            {departments
              .filter((d) => d.id !== device.departmentId)
              .map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
          </TextField>

          <TextField
            label="Lý do điều chuyển *"
            multiline
            rows={3}
            fullWidth
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="Ví dụ: Tăng cường máy in cho quầy BHYT đợt cao điểm..."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Hủy</Button>
          <Button variant="contained" color="secondary" onClick={handleSubmitTransfer} sx={{ fontWeight: 700 }}>
            GỬI PHÊ DUYỆT (ADMIN)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thu hồi IP Tĩnh */}
      <Dialog open={releaseIpOpen} onClose={() => setReleaseIpOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626' }}>THU HỒI ĐỊA CHỈ IP TĨNH</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
            Bạn đang yêu cầu thu hồi IP <b>{device.assignedIpAddress}</b> khỏi thiết bị <b>{device.deviceCode}</b>. Địa chỉ IP sẽ chuyển về trạng thái Available để cấp phát cho thiết bị khác.
          </Typography>
          <TextField
            label="Lý do thu hồi IP *"
            multiline
            rows={3}
            fullWidth
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
            placeholder="Ví dụ: Thiết bị ngừng vận hành, thay đổi hạ tầng mạng, bàn giao lại..."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReleaseIpOpen(false)} disabled={ipSubmitting}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReleaseIp}
            disabled={ipSubmitting || !releaseReason.trim()}
          >
            {ipSubmitting ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Đổi IP Tĩnh */}
      <Dialog open={changeIpOpen} onClose={() => setChangeIpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>THAY ĐỔI ĐỊA CHỈ IP TĨNH</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
            Thiết bị: <b>{device.deviceCode}</b> - IP hiện tại: <b style={{ color: '#0369a1' }}>{device.assignedIpAddress}</b> (Dải mạng: {device.networkName})
          </Typography>

          <TextField
            select
            label="Chọn địa chỉ IP mới (Available) *"
            size="small"
            fullWidth
            value={newIpAddressId}
            onChange={(e) => setNewIpAddressId(e.target.value)}
            sx={{ mb: 2 }}
          >
            {availableIpsForChange.length === 0 ? (
              <MenuItem disabled value="">
                Dải mạng hiện tại không còn IP Available. Vui lòng mở trang Cấp phát IP để chọn dải mạng khác.
              </MenuItem>
            ) : (
              availableIpsForChange.map((ip) => (
                <MenuItem key={ip.id} value={ip.id}>
                  {ip.ipAddress} (Khả dụng)
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            label="Lý do thay đổi IP *"
            multiline
            rows={2}
            fullWidth
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Ví dụ: Cấu hình lại subnet khoa Dược, nâng cấp máy chủ..."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setChangeIpOpen(false)} disabled={ipSubmitting}>Hủy</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmChangeIp}
            disabled={ipSubmitting || !newIpAddressId || !changeReason.trim()}
          >
            {ipSubmitting ? 'Đang đổi IP...' : 'Xác nhận đổi IP'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xem Lịch Sử IP của thiết bị */}
      <Dialog open={ipHistoryOpen} onClose={() => setIpHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          LỊCH SỬ CẤP PHÁT & THU HỒI IP - THIẾT BỊ {device.deviceCode}
        </DialogTitle>
        <DialogContent>
          {deviceIpHistories.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Chưa có bản ghi lịch sử IP nào cho thiết bị này.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Hành động</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IP</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Người thực hiện</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lý do</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceIpHistories.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        {h.action === 'ASSIGN' && <Chip label="Cấp phát" size="small" color="primary" />}
                        {h.action === 'RELEASE' && <Chip label="Thu hồi" size="small" color="warning" />}
                        {h.action === 'CHANGE' && <Chip label="Đổi IP" size="small" color="secondary" />}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{h.ipAddress}</TableCell>
                      <TableCell>
                        {h.assignedAt ? new Date(h.assignedAt).toLocaleString('vi-VN') : '---'}
                      </TableCell>
                      <TableCell>{h.assignedByName || h.releasedByName || 'Admin'}</TableCell>
                      <TableCell>{h.reason || '---'}</TableCell>
                      <TableCell>
                        <Chip
                          label={h.status === 'Active' ? 'Đang hoạt động' : 'Đã thu hồi'}
                          size="small"
                          sx={{
                            bgcolor: h.status === 'Active' ? '#e0f2fe' : '#f1f5f9',
                            color: h.status === 'Active' ? '#0369a1' : '#64748b',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIpHistoryOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
