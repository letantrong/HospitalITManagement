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

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onToggleSidebar}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <LocalHospitalIcon sx={{ color: '#0284c7', fontSize: 32 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0284c7' }}>
              BỆNH VIỆN PHỤC HỒI CHỨC NĂNG ĐỒNG THÁP
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              Hệ thống Quản lý Trang Thiết bị Công nghệ Thông tin
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Nút Demo Chuyển Vai Trò Nhanh */}
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<SwapHorizIcon />}
            onClick={handleOpenSwitchRole}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderColor: '#cbd5e1',
              color: '#334155',
              fontSize: '0.8rem',
              borderRadius: 2,
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
              Quản lý Thiết bị (Khoa Khám Bệnh & Dược)
            </MenuItem>
            <MenuItem onClick={() => handleSwitchTo('EquipmentManager', 'DEP-PHCN')}>
              <ManageAccountsIcon sx={{ mr: 1.5, color: '#059669' }} />
              Quản lý Thiết bị (Khoa Phục hồi chức năng)
            </MenuItem>
          </Menu>

          {/* Role Badge */}
          <Chip
            icon={isAdmin ? <AdminPanelSettingsIcon /> : <ManageAccountsIcon />}
            label={isAdmin ? 'ADMIN' : 'EQUIPMENT MANAGER'}
            color={isAdmin ? 'primary' : 'secondary'}
            size="small"
            sx={{ fontWeight: 700, letterSpacing: 0.5 }}
          />

          {/* User Info & Avatar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: isAdmin ? '#0284c7' : '#059669', fontSize: 14 }}>
              {userProfile?.displayName?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {userProfile?.displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {userProfile?.email}
              </Typography>
            </Box>
          </Box>

          {/* Logout Button */}
          <Tooltip title="Đăng xuất">
            <IconButton onClick={logout} color="default" sx={{ ml: 0.5 }}>
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
