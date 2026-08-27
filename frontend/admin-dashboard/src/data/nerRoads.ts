/**
 * Key National Highways in North Eastern Region
 * Hand-placed polylines along major corridors with status indicators.
 *
 * Status: 'open' | 'at_risk' | 'blocked'
 * These can be toggled during demo to show road impact scenarios.
 */

export interface RoadSegment {
  name: string;
  highway: string;
  status: 'open' | 'at_risk' | 'blocked';
  coordinates: [number, number][];  // [lng, lat] pairs
  states: string[];
  notes?: string;
}

export const NER_ROADS: RoadSegment[] = [
  // NH 37 (formerly NH 37) — Assam's lifeline, runs through Brahmaputra valley
  {
    name: 'NH 37 — Guwahati to Tinsukia',
    highway: 'NH-37',
    status: 'open',
    states: ['Assam'],
    coordinates: [
      [91.74, 26.14],   // Guwahati
      [91.88, 26.33],   // Nagaon area
      [92.08, 26.45],   // Jorabat
      [92.30, 26.55],   // Nagaon
      [92.60, 26.62],   // Tezpur corridor
      [92.80, 26.65],   // Tezpur
      [93.20, 26.80],   // North Lakhimpur
      [93.60, 27.00],   // Dhemaji
      [94.00, 27.20],   // Jonai
      [94.50, 27.35],   // Dibrugarh approach
      [94.91, 27.47],   // Dibrugarh
      [95.36, 27.50],   // Tinsukia
    ],
  },
  // NH 2 — Assam to Arunachal Pradesh (Tenga/Tawang corridor)
  {
    name: 'NH 2 — Guwahati to Itanagar',
    highway: 'NH-2',
    status: 'at_risk',
    states: ['Assam', 'Arunachal Pradesh'],
    coordinates: [
      [91.74, 26.14],   // Guwahati
      [92.00, 26.30],   // Mangaldoi
      [92.40, 26.60],   // Tezpur
      [92.80, 26.80],   // North Bank
      [93.20, 27.00],   // Banderdewa approach
      [93.62, 27.10],   // Itanagar
    ],
  },
  // NH 6 (old numbering) — Shillong corridor from Guwahati
  {
    name: 'NH 6 — Guwahati to Shillong',
    highway: 'NH-6',
    status: 'open',
    states: ['Assam', 'Meghalaya'],
    coordinates: [
      [91.74, 26.14],   // Guwahati
      [91.78, 26.00],   // Jorabat
      [91.82, 25.85],   // Byrnihat
      [91.85, 25.72],   // Nongpoh
      [91.88, 25.62],   // Mawryngkneng
      [91.89, 25.58],   // Shillong
    ],
  },
  // NH 102 — Imphal to Moreh (India-Myanmar border)
  {
    name: 'NH 102 — Imphal to Moreh',
    highway: 'NH-102',
    status: 'at_risk',
    states: ['Manipur'],
    coordinates: [
      [93.94, 24.81],   // Imphal
      [93.98, 24.65],   // Thoubal
      [94.02, 24.50],   // Kakching
      [94.08, 24.38],   // Moreh approach
      [94.10, 24.30],   // Moreh (Myanmar border)
    ],
  },
  // NH 29 — Assam to Nagaland (Dimapur-Kohima corridor)
  {
    name: 'NH 29 — Dimapur to Kohima',
    highway: 'NH-29',
    status: 'blocked',
    states: ['Assam', 'Nagaland'],
    coordinates: [
      [93.75, 25.90],   // Dimapur
      [93.85, 25.80],   // Chumoukedima
      [93.95, 25.72],   // Viswema
      [94.05, 25.68],   // Jakhama
      [94.11, 25.66],   // Kohima
    ],
  },
  // NH 54 — Aizawl corridor (Lengpui to Aizawl)
  {
    name: 'NH 54 — Aizawl Highway',
    highway: 'NH-54',
    status: 'open',
    states: ['Mizoram'],
    coordinates: [
      [92.58, 23.85],   // Lengpui Airport
      [92.62, 23.80],   // Aizawl approach
      [92.68, 23.76],   // Dawrkawn
      [92.72, 23.73],   // Aizawl
    ],
  },
  // NH 208 — Tripura corridor (Agartala to Udaipur)
  {
    name: 'NH 208 — Agartala to Tripura South',
    highway: 'NH-208',
    status: 'open',
    states: ['Tripura'],
    coordinates: [
      [91.28, 23.83],   // Agartala
      [91.30, 23.70],   // Bishalgarh
      [91.35, 23.55],   // Melaghar
      [91.40, 23.40],   // Udaipur
    ],
  },
  // NH 10 — Sikkim corridor (Siliguri to Gangtok)
  {
    name: 'NH 10 — Siliguri to Gangtok',
    highway: 'NH-10',
    status: 'at_risk',
    states: ['West Bengal', 'Sikkim'],
    coordinates: [
      [88.43, 26.72],   // Siliguri
      [88.40, 26.60],   // Sevoke
      [88.42, 26.45],   // Melli
      [88.45, 26.30],   // Rangpo
      [88.50, 27.20],   // Rangpo
      [88.55, 27.28],   // Singtam
      [88.61, 27.33],   // Gangtok
    ],
  },
];

// Status colors for road segments
export const ROAD_STATUS_COLORS: Record<string, { color: string; weight: number; dashArray?: string }> = {
  open:    { color: '#4caf50', weight: 3 },
  at_risk: { color: '#ff9800', weight: 3, dashArray: '10, 5' },
  blocked: { color: '#f44336', weight: 4, dashArray: '5, 5' },
};

export const ROAD_STATUS_LABELS: Record<string, string> = {
  open: '🟢 Open',
  at_risk: '🟡 At Risk',
  blocked: '🔴 Blocked',
};
