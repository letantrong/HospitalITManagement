import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Paper,
  Checkbox,
  Divider,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import QRCode from 'qrcode';
import PrintIcon from '@mui/icons-material/Print';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { deviceService, departmentService } from '../../services/dataStorageService';
import type { Device, Department } from '../../types';

interface QRDeviceItem extends Device {
  qrDataUrl?: string;
  selected?: boolean;
}

export const QRGeneratorPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showSuccess, showWarning } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [devices, setDevices] = useState<QRDeviceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [devList, deptList] = await Promise.all([
          deviceService.getAll(userProfile),
          departmentService.getAll(),
        ]);
        setDepartments(deptList);

        // Sinh QR Data URL cho toàn bộ thiết bị
        const enhancedList: QRDeviceItem[] = await Promise.all(
          devList.map(async (d) => {
            const qrPayload = JSON.stringify({
              hospital: 'BVPHCN',
              deviceCode: d.deviceCode,
              token: d.qrCodeToken,
              id: d.id,
            });
            const url = await QRCode.toDataURL(qrPayload, {
              width: 140,
              margin: 1,
              color: { dark: '#0284c7', light: '#ffffff' },
            });
            return { ...d, qrDataUrl: url, selected: true };
          })
        );
        setDevices(enhancedList);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userProfile]);

  const filteredDevices = devices.filter(
    (d) => selectedDept === 'ALL' || d.departmentId === selectedDept
  );

  const handleToggleSelectAll = (checked: boolean) => {
    setDevices((prev) => prev.map((d) => ({ ...d, selected: checked })));
  };

  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const handlePrintBatch = () => {
    const toPrint = filteredDevices.filter((d) => d.selected);
    if (toPrint.length === 0) {
      showWarning('Vui lòng chọn ít nhất 1 thiết bị để in tem!');
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const labelHtml = toPrint
      .map(
        (dev) => `
        <div class="label-card">
          <div class="qr-box">
            <img src="${dev.qrDataUrl}" />
          </div>
          <div class="info-box">
            <div class="hosp-name">BV PHỤC HỒI CHỨC NĂNG</div>
            <div class="dev-code">${dev.deviceCode}</div>
            <div class="dev-name">${dev.name}</div>
            <div>Khoa: ${dev.departmentName}</div>
            <div>VT: ${dev.locationName || 'N/A'}</div>
            <div>SN: ${dev.serialNumber || 'N/A'}</div>
          </div>
        </div>
      `
      )
      .join('');

    printWin.document.write(`
      <html>
        <head>
          <title>In Tem Nhãn QR Hàng Loạt - BV Phục hồi chức năng</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .label-card {
              border: 1.5px solid #0284c7;
              border-radius: 6px;
              padding: 8px;
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 8px;
              page-break-inside: avoid;
              box-sizing: border-box;
              height: 120px;
            }
            .qr-box img { width: 95px; height: 95px; }
            .info-box { flex: 1; font-size: 11px; line-height: 1.3; overflow: hidden; }
            .hosp-name { font-size: 10px; font-weight: bold; color: #0284c7; margin-bottom: 2px; }
            .dev-code { font-size: 13px; font-weight: bold; color: #000; margin-bottom: 2px; }
            .dev-name { font-weight: bold; color: #1e293b; margin-bottom: 2px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="grid-container">
            ${labelHtml}
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    showSuccess(`Đã mở giao diện in cho ${toPrint.length} tem nhãn.`);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'left', lineHeight: 1.2 }}>
            TẠO & IN TEM MÃ QR HÀNG LOẠT
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, textAlign: 'left' }}>
            Chuẩn tem nhãn dán thiết bị y tế tại Bệnh viện Phục hồi chức năng
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrintBatch}
          sx={{ fontWeight: 700, px: 2.5, py: 1 }}
        >
          IN TEM ĐÃ CHỌN (TRANG IN A4)
        </Button>
      </Paper>

      {/* Bộ lọc khoa phòng & Chọn tất cả */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Lọc theo Khoa / Phòng ban"
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
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SelectAllIcon />}
                onClick={() => handleToggleSelectAll(true)}
              >
                Chọn tất cả
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={() => handleToggleSelectAll(false)}
              >
                Bỏ chọn
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lưới xem trước Tem Nhãn */}
      <Grid container spacing={2}>
        {filteredDevices.map((dev) => (
          <Grid item xs={12} sm={6} md={4} key={dev.id}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: dev.selected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                bgcolor: dev.selected ? '#f0f9ff' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                position: 'relative',
              }}
            >
              <Checkbox
                checked={Boolean(dev.selected)}
                onChange={() => handleToggleDevice(dev.id)}
                color="primary"
                sx={{ p: 0.5 }}
              />

              {dev.qrDataUrl && (
                <Box sx={{ width: 85, height: 85, flexShrink: 0, bgcolor: '#ffffff', p: 0.5, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                  <img src={dev.qrDataUrl} alt="QR" style={{ width: '100%', height: '100%' }} />
                </Box>
              )}

              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, display: 'block' }}>
                  BV PHỤC HỒI CHỨC NĂNG
                </Typography>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {dev.deviceCode}
                </Typography>
                <Typography variant="caption" noWrap sx={{ fontWeight: 600, color: '#334155', display: 'block' }}>
                  {dev.name}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', display: 'block' }}>
                  Khoa: {dev.departmentName}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
