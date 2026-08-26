import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import { getAlerts, resolveAlert, issueAlert } from '../services/api';

const RISK_COLORS: Record<string, string> = {
  low: '#4caf50', moderate: '#ff9800', high: '#f44336', very_high: '#d32f2f', critical: '#9c27b0',
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '' });
  const [showNew, setShowNew] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'landslide_warning', severity: 'high', title: '', message: '', district: '',
  });

  useEffect(() => { loadAlerts(); }, [filter]);

  const loadAlerts = async () => {
    try {
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.severity) params.severity = filter.severity;
      const data = await getAlerts(params);
      setAlerts(data.alerts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    await resolveAlert(id);
    loadAlerts();
  };

  const handleIssue = async () => {
    await issueAlert(newAlert);
    setShowNew(false);
    loadAlerts();
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>Early Warning Alerts</Typography>
          <Button variant="contained" sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }} onClick={() => setShowNew(true)}>
            + Issue Alert
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField select size="small" label="Status" value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['active', 'acknowledged', 'resolved', 'expired'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Severity" value={filter.severity}
            onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['low', 'moderate', 'high', 'critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <Grid container spacing={2}>
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <Grid item xs={12} md={6} key={i}>
                <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937' }}>
                  <CardContent>
                    <Skeleton variant="text" width="70%" height={28} sx={{ bgcolor: '#1f2937' }} />
                    <Skeleton variant="text" width="100%" height={16} sx={{ bgcolor: '#1f2937' }} />
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ bgcolor: '#1f2937', borderRadius: 1, mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : alerts.map(alert => (
            <Grid item xs={12} md={6} key={alert._id}>
              <Card sx={{ bgcolor: '#111827', border: `1px solid ${RISK_COLORS[alert.severity] || '#1f2937'}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{alert.title}</Typography>
                    <Chip label={alert.status} size="small" sx={{ textTransform: 'capitalize' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{alert.message}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={alert.severity} size="small" sx={{ bgcolor: RISK_COLORS[alert.severity], color: 'white', textTransform: 'capitalize' }} />
                    <Chip label={alert.type?.replace('_', ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    <Chip label={alert.district} size="small" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Issued: {new Date(alert.issuedAt).toLocaleString()}
                    </Typography>
                    {alert.status === 'active' && (
                      <Button size="small" color="success" onClick={() => handleResolve(alert._id)}>Resolve</Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!loading && alerts.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
            <WarningIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">No alerts found</Typography>
            <Typography variant="body2">Alerts will appear here when issued by the system or field officers.</Typography>
          </Box>
        )}
      </Box>

      {/* New Alert Dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue New Alert</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="Type" value={newAlert.type} onChange={e => setNewAlert(a => ({ ...a, type: e.target.value }))} sx={{ mb: 2, mt: 1 }}>
            {['landslide_warning', 'rainfall_warning', 'road_blockage', 'evacuation'].map(t => (
              <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth select label="Severity" value={newAlert.severity} onChange={e => setNewAlert(a => ({ ...a, severity: e.target.value }))} sx={{ mb: 2 }}>
            {['low', 'moderate', 'high', 'critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Title" value={newAlert.title} onChange={e => setNewAlert(a => ({ ...a, title: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Message" multiline rows={3} value={newAlert.message} onChange={e => setNewAlert(a => ({ ...a, message: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="District" value={newAlert.district} onChange={e => setNewAlert(a => ({ ...a, district: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNew(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#ff6f00' }} onClick={handleIssue}>Issue Alert</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AlertsPage;
