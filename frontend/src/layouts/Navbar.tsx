import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Chip,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { userProfile, role, isAdmin, loginAsDemo, logout } = useAuth();
  const { showSuccess } = useNotification();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenSwitchRole = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSwitchRole = () => {
    setAnchorEl(null);
  };

  const handleSwitchTo = async (newRole: 'Admin' | 'EquipmentManager', deptId?: string) => {
    handleCloseSwitchRole();
    await loginAsDemo(newRole, deptId);
    showSuccess(`Đã chuyển sang vai trò: ${newRole === 'Admin' ? 'Quản trị viên (Admin)' : 'Quản lý thiết bị (EquipmentManager)'}`);
  };

  const handleLogout = async () => {
    await logout();
    showSuccess('Đã đăng xuất khỏi hệ thống!');
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', md: 'calc(100% - 280px)' },
        left: { xs: 0, md: '280px' },
        right: 0,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Nút Hamburger menu mở Sidebar trên Mobile/Tablet */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onToggleSidebar}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo và Tiêu đề trên Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <LocalHospitalIcon sx={{ color: '#0284c7', fontSize: 28 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284c7', lineHeight: 1.2 }}>
              BV PHỤC HỒI CHỨC NĂNG
            </Typography>
          </Box>

          {/* Tiêu đề thanh điều hướng trên Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
              HỆ THỐNG QUẢN LÝ THIẾT BỊ CNTT & ĐỊA CHỈ IP (IPAM)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Nút Đổi Vai Trò Test Nhanh */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            onClick={handleOpenSwitchRole}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              borderColor: '#cbd5e1',
              color: '#334155',
              fontSize: '0.8rem',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Đổi vai trò test
          </Button>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseSwitchRole}>
            <MenuItem onClick={() => handleSwitchTo('Admin')}>
              <AdminPanelSettingsIcon sx={{ mr: 1.5, color: '#0284c7' }} />
              Quản trị viên (Admin - Toàn viện)
            </MenuItem>
            <MenuItem onClick={() => handleSwitchTo('EquipmentManager', 'DEP-KCB')}>
              <ManageAccountsIcon sx={{ mr: 1.5, color: '#059669' }} />
              Quản lý Khoa Khám Bệnh & Dược
            </MenuItem>
            <MenuItem onClick={() => handleSwitchTo('EquipmentManager', 'DEP-PHCN')}>
              <ManageAccountsIcon sx={{ mr: 1.5, color: '#059669' }} />
              Quản lý Khoa Phục hồi chức năng
            </MenuItem>
          </Menu>

          {/* Role Badge */}
          <Chip
            icon={isAdmin ? <AdminPanelSettingsIcon /> : <ManageAccountsIcon />}
            label={isAdmin ? 'ADMIN' : 'EQUIPMENT MANAGER'}
            color={isAdmin ? 'primary' : 'secondary'}
            size="small"
            sx={{ fontWeight: 800, letterSpacing: 0.5 }}
          />

          {/* User Info & Avatar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: isAdmin ? '#0284c7' : '#059669', fontSize: 14, fontWeight: 700 }}>
              {userProfile?.displayName?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {userProfile?.displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {userProfile?.email}
              </Typography>
            </Box>
          </Box>

          {/* Nút Đăng xuất nổi bật */}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              ml: 0.5,
              borderColor: '#fca5a5',
              bgcolor: '#fef2f2',
              '&:hover': {
                bgcolor: '#fee2e2',
                borderColor: '#ef4444',
              },
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
