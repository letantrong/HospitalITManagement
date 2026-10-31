import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { userProfile, role } = useAuth();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            maxWidth: 500,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'error.light',
              color: 'error.dark',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
            Không có quyền truy cập
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Chức năng này chỉ dành cho tài khoản có vai trò <strong>{allowedRoles.join(' hoặc ')}</strong>.
            Tài khoản hiện tại của bạn là <strong>{role}</strong>.
          </Typography>
          <Button variant="contained" href="/" sx={{ borderRadius: 2 }}>
            Quay lại Bảng điều khiển
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};
