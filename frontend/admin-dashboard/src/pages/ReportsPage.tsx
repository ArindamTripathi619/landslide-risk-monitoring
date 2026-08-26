import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Grid, TextField, MenuItem, Skeleton,
} from '@mui/material';
import { Report as ReportIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import { getFieldReports } from '../services/api';

const URGENCY_COLORS: Record<string, string> = {
  low: '#4caf50', medium: '#ff9800', high: '#f44336', critical: '#9c27b0',
};

const CATEGORY_LABELS: Record<string, string> = {
  crack: '🔴 Crack Detected', slope_movement: '⛰️ Slope Movement', road_block: '🚧 Road Blocked',
  water_seepage: '💧 Water Seepage', subsidence: '⬇️ Ground Subsidence',
  debris_flow: '🪨 Debris Flow', other: '⚠️ Other',
};

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Field Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Geo-tagged reports from citizens and field officers
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField select size="small" label="Status" value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['pending', 'acknowledged', 'investigating', 'resolved', 'dismissed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Urgency" value={filter.urgency}
            onChange={e => setFilter(f => ({ ...f, urgency: e.target.value }))} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {['low', 'medium', 'high', 'critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <Grid container spacing={2}>
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <Grid item xs={12} md={6} key={i}>
                <Card sx={{ bgcolor: '#111827', border: '1px solid #1f2937' }}>
                  <CardContent>
                    <Skeleton variant="text" width="50%" height={24} sx={{ bgcolor: '#1f2937' }} />
                    <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: '#1f2937' }} />
                    <Skeleton variant="rectangular" width="100%" height={30} sx={{ bgcolor: '#1f2937', borderRadius: 1, mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : reports.map(report => (
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

        {!loading && reports.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
            <ReportIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">No field reports found</Typography>
            <Typography variant="body2">Reports from citizens and field officers will appear here.</Typography>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default ReportsPage;
