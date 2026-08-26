import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Typography, IconButton, AppBar, Toolbar, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Warning as WarningIcon,
  Report as ReportIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Risk Map', path: '/map', icon: <MapIcon /> },
  { label: 'Alerts', path: '/alerts', icon: <WarningIcon /> },
  { label: 'Field Reports', path: '/reports', icon: <ReportIcon /> },
];

const SIDEBAR_WIDTH = 220;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('lrn_token');
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#ff6f00' }}>🏔️ LRM</Typography>
        <Typography variant="caption" color="text.secondary">Landslide Risk Monitor</Typography>
      </Box>
      <Divider sx={{ borderColor: '#1f2937' }} />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} onClick={() => handleNavClick(item.path)} sx={{
            cursor: 'pointer', borderRadius: 1, mx: 1, mb: 0.5,
            bgcolor: location.pathname === item.path ? '#1f2937' : 'transparent',
            '&:hover': { bgcolor: '#1f2937' },
          }}>
            <ListItemIcon sx={{ color: '#9ca3af', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, color: '#d1d5db' }} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List>
        <ListItem onClick={handleLogout} sx={{ cursor: 'pointer', borderRadius: 1, mx: 1, mb: 1, '&:hover': { bgcolor: '#1f2937' } }}>
          <ListItemIcon sx={{ color: '#9ca3af', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, color: '#d1d5db' }} />
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ bgcolor: '#111827', borderBottom: '1px solid #1f2937' }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: '#d1d5db' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#ff6f00', ml: 1 }}>🏔️ LRM</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: '#111827', borderRight: '1px solid #1f2937' },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{
          width: SIDEBAR_WIDTH, flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: '#111827', borderRight: '1px solid #1f2937' },
        }}>
          {sidebarContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{
        flexGrow: 1,
        pt: isMobile ? 8 : 0,
        minHeight: '100vh',
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
