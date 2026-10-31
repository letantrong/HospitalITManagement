import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import DevicesIcon from '@mui/icons-material/Devices';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BuildIcon from '@mui/icons-material/Build';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  deviceService,
  departmentService,
  inventoryService,
  maintenanceService,
} from '../../services/dataStorageService';
import { formatCurrency, formatDate, getDeviceStatusMeta } from '../../utils/formatters';
import type { Device, Department, InventorySession, MaintenanceRecord } from '../../types';

const PIE_COLORS = ['#059669', '#0284c7', '#f59e0b', '#ef4444', '#94a3b8'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin, role } = useAuth();

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [pendingMaintenances, setPendingMaintenances] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [devList, deptList, sessions, maintList] = await Promise.all([
          deviceService.getAll(userProfile),
          departmentService.getAll(),
          inventoryService.getSessions(),
          maintenanceService.getAll(userProfile),
        ]);

        setDevices(devList);
        setDepartments(deptList);
        setActiveSession(sessions.find((s) => s.status === 'Active') || null);
        setPendingMaintenances(maintList.filter((m) => m.status === 'Pending' || m.status === 'InProgress'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

  // Số liệu tổng hợp
  const totalOriginalCost = devices.reduce((sum, d) => sum + (d.originalCost || 0), 0);
  const inUseCount = devices.filter((d) => d.status === 'InUse').length;
  const underMaintenanceCount = devices.filter((d) => d.status === 'UnderMaintenance' || d.status === 'Broken').length;

  // Dữ liệu biểu đồ phân bổ theo khoa
  const deptChartData = departments
    .map((dept) => {
      const count = devices.filter((d) => d.departmentId === dept.id).length;
      return {
        name: dept.code,
        fullName: dept.name,
        devices: count,
      };
    })
    .filter((item) => (isAdmin ? true : item.devices > 0));

  // Dữ liệu biểu đồ tình trạng
  const conditionData = [
    { name: 'Tốt (100%)', value: devices.filter((d) => d.condition === 'Good').length },
    { name: 'Bình thường', value: devices.filter((d) => d.condition === 'Fair').length },
    { name: 'Cần bảo dưỡng', value: devices.filter((d) => d.condition === 'Poor').length },
    { name: 'Hỏng hóc', value: devices.filter((d) => d.condition === 'Unusable').length },
  ].filter((item) => item.value > 0);

  if (loading) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  return (
    <Box>
      {/* Header Banner - Bố cục cân đối chuyên nghiệp */}
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
            {isAdmin ? 'BẢNG ĐIỀU KHIỂN QUẢN TRỊ BỆNH VIỆN' : 'BẢNG ĐIỀU KHIỂN QUẢN LÝ THIẾT BỊ KHOA PHÒNG'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, textAlign: 'left' }}>
            {isAdmin
              ? 'Giám sát toàn diện hạ tầng công nghệ thông tin tại Bệnh viện Phục hồi chức năng'
              : `Phạm vi giám sát: ${userProfile?.departmentIds?.join(', ') || 'Khoa được phân công'}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => navigate('/qr-scanner')}
            sx={{ fontWeight: 600, px: 2.5, py: 1 }}
          >
            Quét mã QR kiểm tra
          </Button>
          {isAdmin && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/devices')}
              sx={{ fontWeight: 600, px: 2.5, py: 1 }}
            >
              Quản lý thiết bị
            </Button>
          )}
        </Box>
      </Paper>

      {/* 4 Thẻ KPI chính */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #0284c7' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  {isAdmin ? 'TỔNG THIẾT BỊ TOÀN VIỆN' : 'THIẾT BỊ PHỤ TRÁCH'}
                </Typography>
                <DevicesIcon sx={{ color: '#0284c7' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7' }}>
                {devices.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                Đang hoạt động: {inUseCount} thiết bị
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #059669' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  TỔNG NGUYÊN GIÁ TÀI SẢN
                </Typography>
                <AttachMoneyIcon sx={{ color: '#059669' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                {formatCurrency(totalOriginalCost)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Nguyên giá ban đầu trên sổ kế toán
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #f59e0b' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  BẢO TRÌ & SỬA CHỮA
                </Typography>
                <BuildIcon sx={{ color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                {underMaintenanceCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
                {pendingMaintenances.length} phiếu đang xử lý kỹ thuật
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #10b981' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  TIẾN ĐỘ KIỂM KÊ
                </Typography>
                <CheckCircleIcon sx={{ color: '#10b981' }} />
              </Box>
              {activeSession ? (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                    {activeSession.summary.totalScanned} / {activeSession.summary.totalExpected}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(activeSession.summary.totalScanned / (activeSession.summary.totalExpected || 1)) * 100}
                    sx={{ my: 1, borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {activeSession.title}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ color: '#94a3b8' }}>
                    Chưa có đợt
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Không có đợt kiểm kê nào đang mở
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biểu đồ Phân tích */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                Phân bố Thiết bị theo Khoa / Phòng ban
              </Typography>
              <Box sx={{ height: 280, width: '100%' }}>
                {deptChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <ChartTooltip
                        formatter={(val: any, _: any, item: any) => [`${val} thiết bị`, item?.payload?.fullName || '']}
                      />
                      <Bar dataKey="devices" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Chưa có thiết bị phân bố tại khoa phòng này
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                Tình trạng Vận hành Thiết bị
              </Typography>
              <Box sx={{ height: 280, width: '100%' }}>
                {conditionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conditionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {conditionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value: any, name: any) => [`${value} thiết bị`, name]} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Chưa có dữ liệu tình trạng thiết bị
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Danh sách thiết bị và Phiếu bảo trì gần đây */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Thiết bị CNTT Gần đây
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/devices')}
                >
                  Xem tất cả
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Mã thiết bị</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên thiết bị</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Khoa / Vị trí</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.slice(0, 5).map((device) => {
                      const meta = getDeviceStatusMeta(device.status);
                      return (
                        <TableRow key={device.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/devices/${device.id}`)}>
                          <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{device.deviceCode}</TableCell>
                          <TableCell>{device.name}</TableCell>
                          <TableCell>{device.departmentName}</TableCell>
                          <TableCell>
                            <Chip label={meta.label} color={meta.color} size="small" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Phiếu Sự cố & Bảo trì
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/maintenance')}
                >
                  Xử lý
                </Button>
              </Box>

              {pendingMaintenances.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="body2">Tất cả thiết bị đều đang hoạt động tốt!</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pendingMaintenances.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                          {item.deviceCode}
                        </Typography>
                        <Chip
                          label={item.status === 'Pending' ? 'Chờ tiếp nhận' : 'Đang sửa chữa'}
                          color={item.status === 'Pending' ? 'warning' : 'info'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>
                        {item.deviceName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Lỗi: {item.issueDescription}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
