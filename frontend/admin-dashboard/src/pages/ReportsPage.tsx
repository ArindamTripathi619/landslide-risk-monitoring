import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Card, CardContent, Chip, Button, Grid, TextField, MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Map as MapIcon, Warning as WarningIcon,
  Report as ReportIcon, Logout as LogoutIcon,
} from '@mui/icons-material';
import { getFieldReports } from '../services/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Risk Map', path: '/map', icon: <MapIcon /> },
  { label: 'Alerts', path: '/alerts', icon: <WarningIcon /> },
  { label: 'Field Reports', path: '/reports', icon: <ReportIcon /> },
];

const URGENCY_COLORS: Record<string, string> = {
  low: '#4caf50', medium: '#ff9800', high: '#f44336', critical: '#9c27b0',
};

const CATEGORY_LABELS: Record<string, string> = {
  crack: '🔴 Crack Detected',
  slope_movement: '⛰️ Slope Movement',
  road_block: '🚧 Road Blocked',
  water_seepage: '💧 Water Seepage',
  subsidence: '⬇️ Ground Subsidence',
  debris_flow: '🪨 Debris Flow',
  other: '⚠️ Other',
};

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState({ status: '', urgency: '' });

  useEffect(() => { loadReports(); }, [filter]);

  const loadReports = async () => {
    try {
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.urgency) params.urgency = filter.urgency;
      const data = await getFieldReports(params);
      setReports(data.reports || []);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { localStorage.removeItem('lrn_token'); navigate('/login'); };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Field Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Geo-tagged reports from citizens and field officers
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField select size="small" label="Status" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['pending', 'acknowledged', 'investigating', 'resolved', 'dismissed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Urgency" value={filter.urgency} onChange={e => setFilter(f => ({ ...f, urgency: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['low', 'medium', 'high', 'critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <Grid container spacing={2}>
          {reports.map(report => (
            <Grid item xs={12} md={6} key={report._id}>
              <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{CATEGORY_LABELS[report.category] || report.category}</Typography>
                    <Chip label={report.status} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>{report.title}</Typography>
                  {report.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{report.description}</Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={report.urgency} size="small" sx={{ bgcolor: URGENCY_COLORS[report.urgency], color: 'white', textTransform: 'capitalize' }} />
                    <Chip label={report.district} size="small" variant="outlined" />
                    {report.photos?.length > 0 && (
                      <Chip label={`${report.photos.length} photos`} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      📍 {report.location?.coordinates?.[1]?.toFixed(4)}, {report.location?.coordinates?.[0]?.toFixed(4)} • {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {report.reporter?.name || 'Unknown'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {reports.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
            <ReportIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">No field reports found</Typography>
            <Typography variant="body2">Reports from citizens and field officers will appear here.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ReportsPage;
