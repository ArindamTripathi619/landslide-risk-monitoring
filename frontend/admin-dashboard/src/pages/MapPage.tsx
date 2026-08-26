import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, Card, CardContent, Button, TextField, MenuItem, Collapse,
} from '@mui/material';
import {
  Map as MapIcon, Warning as WarningIcon, Dashboard as DashboardIcon,
  Report as ReportIcon, Logout as LogoutIcon, ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon, MyLocation as LocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import { getRiskZones, getNERRiskGrid, getMLPrediction, getActiveAlerts } from '../services/api';
import 'leaflet/dist/leaflet.css';

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

const NER_CENTER: [number, number] = [25.5, 93.0];
const NER_ZOOM = 7;

// Map click handler for point prediction
const MapClickHandler: React.FC<{ onPredict: (lat: number, lng: number) => void }> = ({ onPredict }) => {
  useMapEvents({ click: (e) => { onPredict(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [riskGrid, setRiskGrid] = useState<any[]>([]);
  const [riskZones, setRiskZones] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gridData, zonesData] = await Promise.allSettled([
        getNERRiskGrid(),
        getRiskZones(),
      ]);
      if (gridData.status === 'fulfilled') setRiskGrid(gridData.value.grid || []);
      if (zonesData.status === 'fulfilled') setRiskZones(zonesData.value);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPredicting(true);
    try {
      const prediction = await getMLPrediction(lat, lng, {
        slope: 25,
        rainfall_24hr: 30,
        ndvi: 0.5,
      });
      setSelectedPoint({
        lat, lng,
        ...prediction,
      });
    } catch (e) {
      setSelectedPoint({
        lat, lng,
        risk_score: 50,
        risk_level: 'moderate',
        confidence: 0.5,
        source: 'offline',
      });
    }
    setPredicting(false);
  }, []);

  const filteredGrid = filterLevel === 'all'
    ? riskGrid
    : riskGrid.filter(p => p.risk_level === filterLevel);

  const getMarkerRadius = (level: string) => {
    const sizes: Record<string, number> = { low: 6, moderate: 8, high: 10, very_high: 12, critical: 15 };
    return sizes[level] || 8;
  };

  const handleLogout = () => {
    localStorage.removeItem('lrn_token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
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
        <Divider sx={{ borderColor: '#1f2937', my: 1 }} />

        {/* Map Controls */}
        <Box sx={{ px: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>LAYERS</Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              size="small" fullWidth
              variant={showGrid ? 'contained' : 'outlined'}
              onClick={() => setShowGrid(!showGrid)}
              sx={{ mb: 1, fontSize: 12, bgcolor: showGrid ? '#ff6f00' : 'transparent', borderColor: '#ff6f00', color: showGrid ? 'white' : '#ff6f00' }}
            >
              Risk Grid
            </Button>
            <Button
              size="small" fullWidth
              variant={showZones ? 'contained' : 'outlined'}
              onClick={() => setShowZones(!showZones)}
              sx={{ mb: 1, fontSize: 12, bgcolor: showZones ? '#1b5e20' : 'transparent', borderColor: '#1b5e20', color: showZones ? 'white' : '#1b5e20' }}
            >
              Risk Zones
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 2, display: 'block' }}>FILTER</Typography>
          <TextField
            select fullWidth size="small" value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            sx={{ mt: 1, '& .MuiInputBase-root': { fontSize: 12 } }}
          >
            <MenuItem value="all">All Levels</MenuItem>
            {Object.keys(RISK_COLORS).map(level => (
              <MenuItem key={level} value={level} sx={{ textTransform: 'capitalize' }}>{level.replace('_', ' ')}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <List>
          <ListItem onClick={handleLogout} sx={{ cursor: 'pointer', borderRadius: 1, mx: 1, mb: 1, '&:hover': { bgcolor: '#1f2937' } }}>
            <ListItemIcon sx={{ color: '#9ca3af', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, color: '#d1d5db' }} />
          </ListItem>
        </List>
      </Drawer>

      {/* Map */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={NER_CENTER} zoom={NER_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onPredict={handleMapClick} />

          {/* Risk Grid Heatmap Points */}
          {showGrid && filteredGrid.map((point, i) => (
            <CircleMarker
              key={`grid-${i}`}
              center={[point.lat, point.lng]}
              radius={getMarkerRadius(point.risk_level)}
              fillColor={RISK_COLORS[point.risk_level] || '#666'}
              fillOpacity={0.7}
              color={RISK_COLORS[point.risk_level] || '#666'}
              weight={1}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 150 }}>
                  <strong>{point.district || 'Location'}</strong><br />
                  <span style={{ color: RISK_COLORS[point.risk_level] }}>●</span>{' '}
                  <span style={{ textTransform: 'capitalize' }}>{point.risk_level?.replace('_', ' ')}</span><br />
                  <strong>Risk Score:</strong> {point.risk_score?.toFixed(1)}<br />
                  <strong>Lat:</strong> {point.lat} <strong>Lng:</strong> {point.lng}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Risk Zones GeoJSON */}
          {showZones && riskZones?.geojson && (
            <GeoJSON
              data={riskZones.geojson}
              style={(feature) => ({
                fillColor: RISK_COLORS[feature?.properties?.riskLevel] || '#666',
                weight: 2,
                opacity: 1,
                color: RISK_COLORS[feature?.properties?.riskLevel] || '#666',
                fillOpacity: 0.4,
              })}
            />
          )}
        </MapContainer>

        {/* Legend */}
        <Card sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, bgcolor: '#111827', border: '1px solid #1f2937' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>Risk Level</Typography>
            {Object.entries(RISK_COLORS).map(([level, color]) => (
              <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                <Typography variant="caption" sx={{ textTransform: 'capitalize', fontSize: 10 }}>{level.replace('_', ' ')}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Point Prediction Card */}
        {selectedPoint && (
          <Card sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, bgcolor: '#111827', border: '1px solid #1f2937', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>Point Prediction</Typography>
                <Button size="small" onClick={() => setSelectedPoint(null)}>×</Button>
              </Box>
              {predicting ? (
                <Typography color="text.secondary">Analyzing location...</Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: RISK_COLORS[selectedPoint.risk_level] }} />
                    <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                      {selectedPoint.risk_level?.replace('_', ' ')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">Risk Score: {selectedPoint.risk_score?.toFixed(1)}/100</Typography>
                  <Typography variant="body2" color="text.secondary">Confidence: {((selectedPoint.confidence || 0) * 100).toFixed(0)}%</Typography>
                  <Typography variant="body2" color="text.secondary">Source: {selectedPoint.source}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    📍 {selectedPoint.lat?.toFixed(4)}, {selectedPoint.lng?.toFixed(4)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats bar */}
        <Card sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, bgcolor: '#111827', border: '1px solid #1f2937' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" fontWeight={600}>NER Risk Grid</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {filteredGrid.length} points • Click map to predict
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MapPage;
