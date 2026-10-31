import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Container } from '@mui/material';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

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
          width: { md: `calc(100% - 270px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ flexGrow: 1, px: { xs: 0, sm: 1 }, mt: 2 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
