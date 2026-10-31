import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { useNotification } from '../../contexts/NotificationContext';
import { deviceService } from '../../services/dataStorageService';
import { getDeviceStatusMeta, getDeviceConditionMeta } from '../../utils/formatters';
import type { Device } from '../../types';

export const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showWarning } = useNotification();

  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedDevice, setScannedDevice] = useState<Device | null>(null);
  const [scanError, setScanError] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const handleScanSuccess = async (decodedText: string) => {
    let searchKey = decodedText;
    try {
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        const parsed = JSON.parse(decodedText);
        searchKey = parsed.deviceCode || parsed.token || parsed.id;
      }
    } catch {
      // Chuỗi bình thường
    }

    const device = await deviceService.getById(searchKey);
    if (device) {
      setScannedDevice(device);
      showSuccess(`Đã nhận diện thiết bị: ${device.deviceCode} (${device.name})`);
      setScanError('');
      stopScanner();
    } else {
      setScanError(`Không tìm thấy thiết bị nào với mã: ${searchKey}`);
      showWarning('Mã QR không khớp với thiết bị nào trong hồ sơ.');
    }
  };

  const startScanner = async () => {
    try {
      setScanError('');
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) return;

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scanner ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error(err);
      setScanError('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera hoặc sử dụng chức năng nhập mã thủ công.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Lỗi khi dừng scanner:', e);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const device = await deviceService.getById(manualCode.trim());
    if (device) {
      setScannedDevice(device);
      showSuccess(`Đã tìm thấy thiết bị: ${device.deviceCode}`);
      setScanError('');
    } else {
      setScanError(`Không tìm thấy thiết bị với mã: ${manualCode}`);
      showWarning('Không tìm thấy thiết bị.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          QUÉT MÃ QR THIẾT BỊ CNTT BỆNH VIỆN
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Tra cứu nhanh lý lịch, thông số, trạng thái và vị trí vật lý của thiết bị tại hiện trường
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Khung Camera Quét QR & Nhập tay */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0284c7' }}>
                Camera Quét Mã QR
              </Typography>
              {isScanning ? (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<StopCircleIcon />}
                  onClick={stopScanner}
                >
                  Dừng Camera
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<PlayCircleIcon />}
                  onClick={startScanner}
                >
                  Bật Camera Quét
                </Button>
              )}
            </Box>

            {/* Vùng Camera Render */}
            <Box
              id="qr-reader"
              sx={{
                width: '100%',
                minHeight: 280,
                bgcolor: '#0f172a',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
              }}
            >
              {!isScanning && (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <QrCodeScannerIcon sx={{ fontSize: 64, color: '#475569', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Nhấn "Bật Camera Quét" để kích hoạt camera điện thoại hoặc webcam máy tính
                  </Typography>
                </Box>
              )}
            </Box>

            {scanError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {scanError}
              </Alert>
            )}

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                HOẶC NHẬP MÃ THỦ CÔNG
              </Typography>
            </Divider>

            <form onSubmit={handleManualSearch}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Nhập mã thiết bị (ví dụ: BVPHCN-MT-2024-001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <Button type="submit" variant="contained" color="primary" startIcon={<SearchIcon />}>
                  Tìm
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Kết quả nhận diện thiết bị */}
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Kết quả Nhận diện Thiết bị
            </Typography>

            {scannedDevice ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  borderColor: '#38bdf8',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284c7' }}>
                      {scannedDevice.deviceCode}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {scannedDevice.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={getDeviceStatusMeta(scannedDevice.status).label}
                    color={getDeviceStatusMeta(scannedDevice.status).color}
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.875rem' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Khoa / Phòng ban:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {scannedDevice.departmentName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Vị trí lắp đặt:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {scannedDevice.locationName || 'Chưa định vị'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Hãng SX / Model:
                    </Typography>
                    <Typography variant="body2">
                      {scannedDevice.manufacturer} {scannedDevice.model}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Số Serial:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {scannedDevice.serialNumber || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Cán bộ phụ trách:
                    </Typography>
                    <Typography variant="body2">
                      {scannedDevice.assignedUser?.name || 'Chưa bàn giao'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Tình trạng hoạt động:
                    </Typography>
                    <Chip
                      label={getDeviceConditionMeta(scannedDevice.condition).label}
                      color={getDeviceConditionMeta(scannedDevice.condition).color}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(`/devices/${scannedDevice.id}`)}
                  sx={{ mt: 3, fontWeight: 700 }}
                >
                  XEM HỒ SƠ CHI TIẾT & BÁO SỰ CỐ
                </Button>
              </Paper>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center', color: '#94a3b8' }}>
                <QrCodeScannerIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  Chưa quét thiết bị nào. Hãy hướng camera vào tem QR trên thiết bị.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
