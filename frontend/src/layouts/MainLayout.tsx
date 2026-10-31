import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Container, Alert, Button, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Đã xảy ra lỗi khi hiển thị trang này
            </Typography>
            <Typography variant="body2" sx={{ my: 1, fontFamily: 'monospace' }}>
              {this.state.error?.message || 'Lỗi không xác định'}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar onToggleSidebar={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, width: '100%', mt: 1 }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};
