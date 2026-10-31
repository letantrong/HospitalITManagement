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
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginAsDemo } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      showSuccess('Đăng nhập thành công vào Hệ thống HospitalITManagement!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Email hoặc mật khẩu không chính xác. Bạn có thể sử dụng các nút Đăng nhập nhanh bên dưới.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Mật khẩu không chính xác.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau vài phút.';
      }
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'Admin' | 'EquipmentManager', deptId?: string) => {
    setLoading(true);
    try {
      await loginAsDemo(role, deptId);
      const title =
        role === 'Admin'
          ? 'Quản trị viên Bệnh viện (Admin)'
          : deptId === 'DEP-KCB'
          ? 'Quản lý Khoa Khám Bệnh & Dược'
          : 'Quản lý Khoa Phục hồi chức năng';
      showSuccess(`Đã đăng nhập thành công với vai trò: ${title}`);
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Banner đầu trang */}
        <Box
          sx={{
            p: 3.5,
            textAlign: 'center',
            background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderBottom: '1px solid #bae6fd',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)',
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: '#0369a1',
              letterSpacing: -0.5,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            BỆNH VIỆN PHỤC HỒI CHỨC NĂNG
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontWeight: 600 }}>
            Hệ thống Quản lý Thiết bị CNTT & Cấp phát IP Tĩnh (IPAM)
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Chip label="Phiên bản 2.0" size="small" sx={{ bgcolor: '#0284c7', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }} />
            <Chip label="Firebase Cloud Sync" size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }} />
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>
              EMAIL CÁN BỘ BỆNH VIỆN
            </Typography>
            <TextField
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ví dụ: admin@bvphcndt.vn"
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>
              MẬT KHẨU
            </Typography>
            <TextField
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                py: 1.3,
                fontWeight: 800,
                fontSize: '0.95rem',
                borderRadius: 2,
                bgcolor: '#0284c7',
                '&:hover': { bgcolor: '#0369a1' },
              }}
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>
              HOẶC ĐĂNG NHẬP NHANH MỘT CHẠM (1-CLICK)
            </Typography>
          </Divider>

          <Stack spacing={1.5}>
            {/* Nút 1: Admin Toàn Viện */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                cursor: 'pointer',
                borderColor: '#bae6fd',
                bgcolor: '#f0f9ff',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0284c7', transform: 'translateY(-1px)' },
              }}
              onClick={() => handleQuickDemo('Admin')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdminPanelSettingsIcon sx={{ color: '#0284c7', fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369a1' }}>
                    Quản trị viên Hệ thống (Admin)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Toàn quyền: Quản trị mạng IPAM, phê duyệt điều chuyển, phân quyền
                  </Typography>
                </Box>
              </Box>
              <Button size="small" variant="contained" color="primary" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                Đăng nhập
              </Button>
            </Paper>

            {/* Nút 2: Người Quản lý Thiết bị CNTT Bệnh viện */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                cursor: 'pointer',
                borderColor: '#a7f3d0',
                bgcolor: '#ecfdf5',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#d1fae5', borderColor: '#059669', transform: 'translateY(-1px)' },
              }}
              onClick={() => handleQuickDemo('EquipmentManager')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ManageAccountsIcon sx={{ color: '#059669', fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#047857' }}>
                    Người Quản lý Thiết bị CNTT Bệnh viện
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Quản lý thiết bị toàn viện, quét mã QR, sự cố bảo trì, cấp phát IP tĩnh
                  </Typography>
                </Box>
              </Box>
              <Button size="small" variant="contained" color="success" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                Đăng nhập
              </Button>
            </Paper>
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <SecurityIcon sx={{ fontSize: 14 }} /> Hệ thống bảo mật tiêu chuẩn Bệnh viện & Y tế số
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
