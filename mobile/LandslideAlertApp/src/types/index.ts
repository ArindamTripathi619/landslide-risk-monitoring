export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Report: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'district_admin' | 'field_officer' | 'villager';
  district?: string;
  state?: string;
  language: string;
}

export interface Alert {
  _id: string;
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  message: string;
  district: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  issuedAt: string;
}

export interface FieldReport {
  _id: string;
  category: 'crack' | 'slope_movement' | 'road_block' | 'water_seepage' | 'subsidence' | 'debris_flow' | 'other';
  title: string;
  description?: string;
  location: { type: 'Point'; coordinates: [number, number] };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  photos: string[];
  createdAt: string;
}

export interface RiskPrediction {
  risk_score: number;
  risk_level: string;
  confidence: number;
  source: string;
}
