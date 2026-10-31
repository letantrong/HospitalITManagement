import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
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
import LanIcon from '@mui/icons-material/Lan';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BlockIcon from '@mui/icons-material/Block';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ipamDashboardService } from '../../services/dataStorageService';
import type { UserProfile } from '../../types';

const PIE_STATUS_COLORS: Record<string, string> = {
  'Còn trống (Available)': '#10b981',
  'Đã cấp phát (Assigned)': '#0284c7',
  'Giữ chỗ (Reserved)': '#f59e0b',
  'Đã khóa (Blocked)': '#ef4444',
};

export const IpDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await ipamDashboardService.getStatistics(userProfile);
        setStats(data);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userProfile]);

  if (loading || !stats) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  const pieData = [
    { name: 'Còn trống (Available)', value: stats.availableCount },
    { name: 'Đã cấp phát (Assigned)', value: stats.assignedCount },
    { name: 'Giữ chỗ (Reserved)', value: stats.reservedCount },
    { name: 'Đã khóa (Blocked)', value: stats.blockedCount },
  ].filter((item) => item.value > 0);

  return (
    <Box>
      {/* Tiêu đề & Tác vụ nhanh - Bố cục cân đối */}
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
            TỔNG QUAN QUẢN TRỊ ĐỊA CHỈ IP (IPAM DASHBOARD)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, textAlign: 'left' }}>
            Quản lý tập trung các dải mạng nội bộ, theo dõi dung lượng và cấp phát IP tĩnh tại Bệnh viện Phục hồi chức năng
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate('/ipam/networks')}
                sx={{ fontWeight: 600, px: 2.5, py: 1 }}
              >
                Khai báo Dải mạng
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<LanIcon />}
                onClick={() => navigate('/ipam/assignment')}
                sx={{ fontWeight: 700, px: 2.5, py: 1 }}
              >
                CẤP PHÁT IP TĨNH
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* 5 Thẻ Thống kê Trạng thái IP (KPI Cards) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ borderLeft: '4px solid #64748b' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                TỔNG ĐỊA CHỈ IP
              </Typography>
              <DnsIcon sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
              {stats.totalIps}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Tỷ lệ dùng: <strong>{stats.utilizationRate}%</strong>
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderLeft: '4px solid #10b981' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857' }}>
                CÒN TRỐNG (AVAILABLE)
              </Typography>
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', my: 0.5 }}>
              {stats.availableCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
              Sẵn sàng cấp phát
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderLeft: '4px solid #0284c7' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
                ĐÃ CẤP PHÁT (ASSIGNED)
              </Typography>
              <LanIcon sx={{ color: '#0284c7', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7', my: 0.5 }}>
              {stats.assignedCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
              Thiết bị đang vận hành
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309' }}>
                GIỮ CHỖ (RESERVED)
              </Typography>
              <BookmarkIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b', my: 0.5 }}>
              {stats.reservedCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#d97706' }}>
              Dành cho dự án / máy y tế
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderLeft: '4px solid #ef4444' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c' }}>
                ĐÃ KHÓA (BLOCKED)
              </Typography>
              <BlockIcon sx={{ color: '#ef4444', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444', my: 0.5 }}>
              {stats.blockedCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ef4444' }}>
              Bảo vệ an toàn mạng
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Biểu đồ Trực quan hóa */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 2.5, mb: 3 }}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Tình trạng Sử dụng theo Dải mạng (Subnets)
            </Typography>
            <Box sx={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.networkStats} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <XAxis dataKey="networkAddress" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <ChartTooltip
                    formatter={(val: any, name: any) => [
                      `${val} IP`,
                      name === 'assigned' ? 'Đã cấp phát' : 'Còn trống',
                    ]}
                  />
                  <Bar dataKey="assigned" name="assigned" fill="#0284c7" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" name="available" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Cơ cấu Trạng thái Địa chỉ IP
            </Typography>
            <Box sx={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(val: any, name: any) => [`${val} IP`, name]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Bảng Chi tiết Thống kê theo Dải mạng & VLAN */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0284c7' }}>
              DANH SÁCH DẢI MẠNG & TỶ LỆ CẤP PHÁT
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/ipam/networks')}
            >
              Quản lý chi tiết
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tên dải mạng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Không gian IP (CIDR)</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>VLAN</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Tổng IP</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Đã cấp</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Còn trống</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>Tỷ lệ sử dụng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.networkStats.map((item: any) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/ipam/addresses')}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{item.networkAddress}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip label={`VLAN ${item.vlanId}`} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>{item.total}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                      {item.assigned}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#10b981' }}>
                      {item.available}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={item.percent}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35 }}>
                          {item.percent}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
