import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DevicesIcon from '@mui/icons-material/Devices';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DnsIcon from '@mui/icons-material/Dns';
import LanIcon from '@mui/icons-material/Lan';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useAuth } from '../contexts/AuthContext';

export const DRAWER_WIDTH = 280;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const navItems = [
    {
      group: 'QUẢN LÝ TÁC NGHIỆP',
      items: [
        { label: 'Tổng quan (Dashboard)', path: '/', icon: <DashboardIcon /> },
        { label: 'Thiết bị CNTT', path: '/devices', icon: <DevicesIcon /> },
        { label: 'Quét QR kiểm tra', path: '/qr-scanner', icon: <QrCodeScannerIcon /> },
        { label: 'Tạo & In tem QR', path: '/qr-generator', icon: <QrCode2Icon /> },
        { label: 'Đợt Kiểm kê', path: '/inventory', icon: <InventoryIcon /> },
        { label: 'Bảo trì & Sửa chữa', path: '/maintenance', icon: <BuildIcon /> },
        { label: 'Điều chuyển Khoa/Phòng', path: '/transfers', icon: <MoveUpIcon /> },
      ],
    },
    {
      group: 'QUẢN LÝ MẠNG VÀ IP (IPAM)',
      items: isAdmin
        ? [
            { label: 'Tổng quan IP', path: '/ipam', icon: <DnsIcon /> },
            { label: 'Quản lý dải mạng', path: '/ipam/networks', icon: <LanIcon /> },
            { label: 'Danh sách địa chỉ IP', path: '/ipam/addresses', icon: <FormatListNumberedIcon /> },
            { label: 'Cấp phát IP tĩnh', path: '/ipam/assignment', icon: <SettingsEthernetIcon /> },
            { label: 'Lịch sử cấp phát', path: '/ipam/history', icon: <TimelineIcon /> },
          ]
        : [
            { label: 'Tổng quan IP', path: '/ipam', icon: <DnsIcon /> },
            { label: 'Danh sách địa chỉ IP', path: '/ipam/addresses', icon: <FormatListNumberedIcon /> },
            { label: 'Lịch sử cấp phát', path: '/ipam/history', icon: <TimelineIcon /> },
          ],
    },
    {
      group: 'BÁO CÁO & THỐNG KÊ',
      items: [
        { label: 'Báo cáo & Xuất Excel', path: '/reports', icon: <AssessmentIcon /> },
        { label: 'Nhật ký hoạt động', path: '/logs', icon: <HistoryIcon /> },
      ],
    },
  ];

  // Chỉ Admin mới thấy nhóm danh mục quản trị hệ thống
  if (isAdmin) {
    navItems.push({
      group: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        { label: 'Khoa / Phòng ban', path: '/departments', icon: <BusinessIcon /> },
        { label: 'Vị trí & Kho', path: '/locations', icon: <PlaceIcon /> },
        { label: 'Danh mục thiết bị', path: '/categories', icon: <CategoryIcon /> },
        { label: 'Quản lý Tài khoản & Phân quyền', path: '/users', icon: <PeopleIcon /> },
      ],
    });
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      {/* Brand Logo & Tên Bệnh viện trên đầu Sidebar */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <LocalHospitalIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: '#0284c7', lineHeight: 1.2, whiteSpace: 'nowrap' }}
          >
            BV PHỤC HỒI CHỨC NĂNG
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block', whiteSpace: 'nowrap', fontWeight: 500 }}
          >
            Quản lý Thiết bị CNTT & IPAM
          </Typography>
        </Box>
      </Box>

      {/* Box hiển thị vai trò tài khoản chuẩn */}
      <Box sx={{ m: 1.5, p: 1.5, bgcolor: isAdmin ? '#f0f9ff' : '#ecfdf5', borderRadius: 2, border: `1px solid ${isAdmin ? '#bae6fd' : '#a7f3d0'}`, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: isAdmin ? '#0284c7' : '#047857', display: 'block', letterSpacing: 0.5 }}>
          {isAdmin ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'QUẢN LÝ THIẾT BỊ CNTT'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
          {isAdmin ? 'Toàn quyền quản trị & Mạng IPAM' : 'Quản lý thiết bị CNTT Bệnh viện'}
        </Typography>
      </Box>

      {/* Danh sách Menu Items có scrollbar thanh mảnh */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 1,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
          },
        }}
      >
        {navItems.map((group, gIdx) => (
          <Box key={gIdx} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                display: 'block',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: 0.8,
                fontSize: '0.7rem',
              }}
            >
              {group.group}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleNavigate(item.path)}
                      selected={isActive}
                      sx={{
                        borderRadius: 2,
                        py: 0.9,
                        px: 1.5,
                        color: isActive ? '#0284c7' : '#475569',
                        bgcolor: isActive ? '#f0f9ff' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? '#e0f2fe' : '#f8fafc',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive ? '#0284c7' : '#64748b',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              fontSize: '0.85rem',
                              fontWeight: isActive ? 700 : 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {gIdx < navItems.length - 1 && <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />}
          </Box>
        ))}
      </Box>

      {/* Footer bản quyền bệnh viện */}
      <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
          BV Phục hồi chức năng
        </Typography>
        <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.65rem' }}>
          Hệ thống Quản lý Thiết bị CNTT & IPAM
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer (Trượt ra khi bấm MenuIcon) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer (Cố định toàn chiều cao màn hình) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            height: '100vh',
            top: 0,
            left: 0,
            overflow: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
