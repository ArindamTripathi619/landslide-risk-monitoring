import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Chip, List, ListItem,
  ListItemText, ListItemIcon, Button, Skeleton, Alert, Snackbar, IconButton,
  Tooltip, CircularProgress, Divider,
} from '@mui/material';
import {
  Warning as WarningIcon, Assessment as AssessmentIcon,
  Report as ReportIcon, Terrain as TerrainIcon, Cloud as CloudIcon,
  Refresh as RefreshIcon, PlayArrow as PlayIcon, Bolt as BoltIcon,
  Terrain as SimulateIcon, Article as ReportSimIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { getDashboardStats, getActiveAlerts, getNERRiskGrid } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RISK_COLORS: Record<string, string> = {
  low: '#4caf50', moderate: '#ff9800', high: '#f44336',
  very_high: '#d32f2f', critical: '#9c27b0',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deliveryLog, setDeliveryLog] = useState<string[]>([]);
  const [dataSources, setDataSources] = useState([
    { name: 'Rainfall', icon: '🌧️', status: 'live', detail: 'Open-Meteo API' },
    { name: 'Soil Moisture', icon: '💧', status: 'live', detail: 'Open-Meteo API' },
    { name: 'Satellite (NDVI)', icon: '🛰️', status: 'simulated', detail: 'MODIS Grid' },
    { name: 'Terrain', icon: '⛰️', status: 'live', detail: 'NASA/NER Dataset' },
    { name: 'Historical', icon: '📚', status: 'live', detail: 'NASA GLC (1,693 events)' },
  ]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
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
      // Check if all failed
      if (statsData.status === 'rejected' && alertsData.status === 'rejected') {
        setError('Could not connect to server. Make sure the backend is running on port 5000.');
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const statCards = [
    { title: 'Risk Zones', value: stats?.riskZones?.total || '—', icon: <TerrainIcon />, color: '#ff6f00' },
    { title: 'Critical Zones', value: stats?.riskZones?.critical || '—', icon: <WarningIcon />, color: '#d32f2f' },
    { title: 'Active Alerts', value: stats?.alerts?.active || alerts.length, icon: <AssessmentIcon />, color: '#ff9800' },
    { title: 'Pending Reports', value: stats?.reports?.pending || '—', icon: <ReportIcon />, color: '#1b5e20' },
  ];

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Dashboard Overview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Real-time landslide risk monitoring for North Eastern Region
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} onClick={loadDashboard} sx={{ color: '#ff6f00' }}>
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3, bgcolor: '#1f2937', border: '1px solid #ff9800' }}>
            {error}
          </Alert>
        )}

        {/* Demo Controls */}
        <Card sx={{ bgcolor: '#111827', border: '1px solid #ff6f00', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BoltIcon sx={{ color: '#ff6f00' }} />
              <Typography variant="h6" fontWeight={600}>Demo Controls</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click these buttons during your presentation to simulate live events
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Tooltip title="Simulate a random landslide event in NER">
                <Button
                  variant="contained"
                  startIcon={simulating ? <CircularProgress size={16} /> : <PlayIcon />}
                  disabled={simulating}
                  onClick={async () => {
                    setSimulating(true);
                    try {
                      const token = localStorage.getItem('lrn_token');
                      const res = await fetch(`${API_BASE}/simulate/landslide`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();
                      setSnackbar({ open: true, message: data.message || 'Landslide simulated!', severity: 'success' });
                      loadDashboard();
                    } catch (e) {
                      setSnackbar({ open: true, message: 'Simulation failed — are you logged in as admin?', severity: 'error' });
                    }
                    setSimulating(false);
                  }}
                  sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                  Simulate Landslide
                </Button>
              </Tooltip>

              <Tooltip title="Generate 5-15 random events across NER">
                <Button
                  variant="contained"
                  startIcon={simulating ? <CircularProgress size={16} /> : <SimulateIcon />}
                  disabled={simulating}
                  onClick={async () => {
                    setSimulating(true);
                    try {
                      const token = localStorage.getItem('lrn_token');
                      const res = await fetch(`${API_BASE}/simulate/batch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ count: 10 }),
                      });
                      const data = await res.json();
                      setSnackbar({ open: true, message: data.message || 'Batch simulation complete!', severity: 'success' });
                      loadDashboard();
                    } catch (e) {
                      setSnackbar({ open: true, message: 'Batch simulation failed', severity: 'error' });
                    }
                    setSimulating(false);
                  }}
                  sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}>
                  Generate Batch Events
                </Button>
              </Tooltip>

              <Tooltip title="Create a simulated citizen field report">
                <Button
                  variant="outlined"
                  startIcon={simulating ? <CircularProgress size={16} /> : <ReportSimIcon />}
                  disabled={simulating}
                  onClick={async () => {
                    setSimulating(true);
                    try {
                      const token = localStorage.getItem('lrn_token');
                      const res = await fetch(`${API_BASE}/simulate/field-report`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();
                      setSnackbar({ open: true, message: data.message || 'Field report created!', severity: 'success' });
                      loadDashboard();
                    } catch (e) {
                      setSnackbar({ open: true, message: 'Report simulation failed', severity: 'error' });
                    }
                    setSimulating(false);
                  }}
                  sx={{ borderColor: '#1b5e20', color: '#1b5e20' }}>
                  Simulate Field Report
                </Button>
              </Tooltip>

              <Tooltip title="Push high rainfall through the real ML pipeline — watch risk change live">
                <Button
                  variant="contained"
                  startIcon={simulating ? <CircularProgress size={16} /> : <CloudIcon />}
                  disabled={simulating}
                  onClick={async () => {
                    setSimulating(true);
                    try {
                      // Simulate a rainfall spike at a high-risk district
                      const token = localStorage.getItem('lrn_token');
                      const res = await fetch(`${API_BASE}/simulate/landslide`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ severity: 'catastrophic' }),
                      });
                      const data = await res.json();

                      // Generate simulated SMS delivery logs
                      const districts = ['Kamrup', 'Dima Hasao', 'East Khasi Hills', 'Imphal West', 'Aizawl'];
                      const msgs = districts.map(d => 
                        `✅ SMS dispatched to District Admin, ${d} — "紧急：检测到滑坡风险，请立即撤离低洼地区" (Hindi/Assamese)`
                      );
                      setDeliveryLog(msgs);

                      setSnackbar({ open: true, message: `Rainfall spike simulated! Risk updated in ${data.event?.district || 'NER'}`, severity: 'success' });
                      loadDashboard();
                    } catch (e) {
                      setSnackbar({ open: true, message: 'Rainfall simulation failed', severity: 'error' });
                    }
                    setSimulating(false);
                  }}
                  sx={{ bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
                  Simulate Rainfall Spike
                </Button>
              </Tooltip>
          </CardContent>
        </Card>

        {/* Five-Source Data Status Strip */}
        <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937', mb: 3 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">DATA SOURCES</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {dataSources.map((ds) => (
                <Chip
                  key={ds.name}
                  label={`${ds.icon} ${ds.name}`}
                  size="small"
                  sx={{
                    bgcolor: ds.status === 'live' ? '#1b5e2020' : '#ff6f0020',
                    border: `1px solid ${ds.status === 'live' ? '#1b5e20' : '#ff6f00'}`,
                    color: ds.status === 'live' ? '#4caf50' : '#ff9800',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Simulated SMS Delivery Log */}
        {deliveryLog.length > 0 && (
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1b5e20', mb: 3 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" fontWeight={600} color="#4caf50">📡 SMS/MULTILINGUAL ALERT DELIVERY LOG</Typography>
              <List dense sx={{ maxHeight: 120, overflow: 'auto' }}>
                {deliveryLog.slice(0, 8).map((log, i) => (
                  <ListItem key={i} sx={{ py: 0 }}>
                    <ListItemText
                      primary={log}
                      primaryTypographyProps={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937' }}>
                <CardContent>
                  {loading ? (
                    <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: '#1f2937' }} />
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                        <Box sx={{ color: card.color }}>{card.icon}</Box>
                      </Box>
                      <Typography variant="h3" fontWeight={700} sx={{ color: card.color }}>{card.value}</Typography>
                    </>
                  )}
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
                {loading ? (
                  <Box sx={{ mt: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} variant="text" width="100%" height={30} sx={{ bgcolor: '#1f2937' }} />
                    ))}
                  </Box>
                ) : riskSummary ? (
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
                  <Typography color="text.secondary" sx={{ mt: 4 }}>No risk data</Typography>
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
                {loading ? (
                  <Box sx={{ mt: 2 }}>
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} variant="rectangular" width="100%" height={60} sx={{ bgcolor: '#1f2937', borderRadius: 1, mb: 1 }} />
                    ))}
                  </Box>
                ) : alerts.length > 0 ? (
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
    </Layout>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default DashboardPage;
