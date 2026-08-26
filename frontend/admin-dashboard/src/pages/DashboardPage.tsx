import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Grid, Card, CardContent,
  Chip, List, ListItem, ListItemText, ListItemIcon, Button, Drawer, Divider,
} from '@mui/material';
import {
  Map as MapIcon, Warning as WarningIcon, Assessment as AssessmentIcon,
  Report as ReportIcon, Logout as LogoutIcon, Dashboard as DashboardIcon,
  Terrain as TerrainIcon, Cloud as CloudIcon,
} from '@mui/icons-material';
import { getDashboardStats, getActiveAlerts, getNERRiskGrid } from '../services/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Risk Map', path: '/map', icon: <MapIcon /> },
  { label: 'Alerts', path: '/alerts', icon: <WarningIcon /> },
  { label: 'Field Reports', path: '/reports', icon: <ReportIcon /> },
];

const RISK_COLORS: Record<string, string> = {
  low: '#4caf50',
  moderate: '#ff9800',
  high: '#f44336',
  very_high: '#d32f2f',
  critical: '#9c27b0',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [riskSummary, setRiskSummary] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, alertsData, riskData] = await Promise.allSettled([
        getDashboardStats(),
        getActiveAlerts(),
        getNERRiskGrid(),
      ]);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value.alerts || []);
      if (riskData.status === 'fulfilled') {
        const grid = riskData.value.grid || [];
        const summary: Record<string, number> = {};
        grid.forEach((p: any) => { summary[p.risk_level] = (summary[p.risk_level] || 0) + 1; });
        setRiskSummary(summary);
      }
    } catch (e) { console.error('Dashboard load error:', e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('lrn_token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: 220, flexShrink: 0,
        '& .MuiDrawer-paper': { width: 220, bgcolor: '#111827', borderRight: '1px solid #1f2937' },
      }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#ff6f00' }}>🏔️ LRM</Typography>
          <Typography variant="caption" color="text.secondary">Landslide Risk Monitor</Typography>
        </Box>
        <Divider sx={{ borderColor: '#1f2937' }} />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItem key={item.path} onClick={() => navigate(item.path)} sx={{
              cursor: 'pointer', borderRadius: 1, mx: 1, mb: 0.5,
              bgcolor: window.location.pathname === item.path ? '#1f2937' : 'transparent',
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
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Real-time landslide risk monitoring for North Eastern Region
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Risk Zones', value: stats?.riskZones?.total || '—', icon: <TerrainIcon />, color: '#ff6f00' },
            { title: 'Critical Zones', value: stats?.riskZones?.critical || '—', icon: <WarningIcon />, color: '#d32f2f' },
            { title: 'Active Alerts', value: stats?.alerts?.active || alerts.length, icon: <AssessmentIcon />, color: '#ff9800' },
            { title: 'Pending Reports', value: stats?.reports?.pending || '—', icon: <ReportIcon />, color: '#1b5e20' },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                    <Box sx={{ color: card.color }}>{card.icon}</Box>
                  </Box>
                  <Typography variant="h3" fontWeight={700} sx={{ color: card.color }}>{card.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Risk Distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937', height: 300 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Risk Distribution</Typography>
                {riskSummary ? (
                  <Box sx={{ mt: 2 }}>
                    {Object.entries(riskSummary).map(([level, count]) => (
                      <Box key={level} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: RISK_COLORS[level] || '#666' }} />
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{level.replace('_', ' ')}</Typography>
                        </Box>
                        <Chip label={String(count)} size="small" sx={{ bgcolor: '#1f2937' }} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 4 }}>Loading risk data...</Typography>
                )}
                <Button variant="outlined" fullWidth sx={{ mt: 2, borderColor: '#ff6f00', color: '#ff6f00' }} onClick={() => navigate('/map')}>
                  View Full Map
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Alerts */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937', height: 300 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>Active Alerts</Typography>
                  <Button size="small" sx={{ color: '#ff6f00' }} onClick={() => navigate('/alerts')}>View All</Button>
                </Box>
                {alerts.length > 0 ? (
                  <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
                    {alerts.slice(0, 5).map((alert: any) => (
                      <ListItem key={alert._id} sx={{ bgcolor: '#1f2937', borderRadius: 1, mb: 0.5 }}>
                        <ListItemIcon>
                          <WarningIcon sx={{ color: RISK_COLORS[alert.severity] || '#ff9800' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={`${alert.district} • ${new Date(alert.issuedAt).toLocaleDateString()}`}
                          primaryTypographyProps={{ fontSize: 14 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                        <Chip
                          label={alert.severity}
                          size="small"
                          sx={{ bgcolor: RISK_COLORS[alert.severity] || '#666', color: 'white', textTransform: 'capitalize' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    <CloudIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography>No active alerts</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
