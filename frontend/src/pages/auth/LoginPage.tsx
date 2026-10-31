import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Paper,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginAsDemo } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithEmail(email, password);
      showSuccess('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
      showError('Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'Admin' | 'EquipmentManager', deptId?: string) => {
    setLoading(true);
    try {
      await loginAsDemo(role, deptId);
      showSuccess(`Đã đăng nhập với tư cách: ${role === 'Admin' ? 'Quản trị viên (Admin)' : 'Quản lý thiết bị Khoa Khám Bệnh'}`);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        p: 2,
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284c7', letterSpacing: -0.5 }}>
            BỆNH VIỆN PHỤC HỒI CHỨC NĂNG ĐỒNG THÁP
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
            Hệ thống Quản lý Thiết bị CNTT & Kiểm kê QR
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              label="Email Cán bộ Bệnh viện"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ví dụ: admin@bvphcndt.vn"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Mật khẩu"
              type="password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP VỚI FIREBASE AUTH'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              HOẶC KIỂM THỬ NHANH VAI TRÒ
            </Typography>
          </Divider>

          <Stack spacing={1.5}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f0f9ff', borderColor: '#38bdf8' },
              }}
              onClick={() => handleQuickDemo('Admin')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdminPanelSettingsIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Tài khoản Quản trị viên (Admin)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Quyền tối cao toàn bệnh viện
                  </Typography>
                </Box>
              </Box>
              <Button size="small" variant="text" color="primary">
                Chọn
              </Button>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#ecfdf5', borderColor: '#34d399' },
              }}
              onClick={() => handleQuickDemo('EquipmentManager', 'DEP-KCB')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ManageAccountsIcon color="secondary" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Quản lý Thiết bị (EquipmentManager)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Phụ trách Khoa Khám Bệnh & Dược
                  </Typography>
                </Box>
              </Box>
              <Button size="small" variant="text" color="secondary">
                Chọn
              </Button>
            </Paper>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
