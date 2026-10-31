import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
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
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 270;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, isAdmin, userProfile } = useAuth();

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
      
      {/* Box hiển thị phạm vi quản lý của Manager */}
      {!isAdmin && userProfile?.departmentIds && (
        <Box sx={{ m: 2, p: 1.5, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #a7f3d0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', display: 'block' }}>
            PHẠM VI QUẢN LÝ ĐƯỢC GIAO:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {userProfile.departmentIds.map((deptId) => (
              <Chip key={deptId} label={deptId} size="small" color="secondary" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        {navItems.map((group, gIdx) => (
          <Box key={gIdx} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 0.5,
                display: 'block',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: 0.8,
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
                        py: 1,
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
                          minWidth: 38,
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
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 600 : 500,
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {gIdx < navItems.length - 1 && <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />}
          </Box>
        ))}
      </Box>

      {/* Footer bản quyền bệnh viện */}
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
          BV Phục hồi chức năng Đồng Tháp
        </Typography>
        <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.65rem' }}>
          Phiên bản 2.0 - Firebase Edition
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          },
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </Box>
  );
};
