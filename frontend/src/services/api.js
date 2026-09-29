// API Client for NCPOR POLAR-SYNC Backend

const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('polar_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  verifyAuth: () => apiRequest('/auth/verify'),
  getRoles: () => apiRequest('/auth/roles'),

  // Cargo
  getCargo: () => apiRequest('/cargo'),
  addCargo: (data) => apiRequest('/cargo', { method: 'POST', body: JSON.stringify(data) }),
  scanCargo: (scanData) => apiRequest('/cargo/scan', { method: 'POST', body: JSON.stringify(scanData) }),

  // Inventory
  getInventory: () => apiRequest('/inventory'),
  updateStock: (id, change) => apiRequest(`/inventory/${id}/stock`, { method: 'PUT', body: JSON.stringify({ change }) }),

  // Assets / Fleet
  getAssets: () => apiRequest('/assets'),
  updateAssetStatus: (id, status, notes) => apiRequest(`/assets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),

  // Personnel
  getPersonnel: () => apiRequest('/personnel'),
  getMusterSummary: () => apiRequest('/personnel/muster-summary'),

  // Incidents
  getIncidents: () => apiRequest('/incidents'),
  reportIncident: (incident) => apiRequest('/incidents', { method: 'POST', body: JSON.stringify(incident) }),

  // GIS Telemetry
  getGisData: () => apiRequest('/gis/all'),

  // Offline Sync
  syncEvents: (events) => apiRequest('/sync/events', { method: 'POST', body: JSON.stringify({ events }) }),
  getSyncAudit: () => apiRequest('/sync/audit'),

  // AI & ML (Python Scikit-Learn Engine)
  predictRisk: (params) => apiRequest('/ai/predict-risk', { method: 'POST', body: JSON.stringify(params) }),
  forecastResources: (params) => apiRequest('/ai/forecast-resources', { method: 'POST', body: JSON.stringify(params) }),
  getAiScenarios: () => apiRequest('/ai/scenarios'),
  getAiHealth: () => apiRequest('/ai/health'),
};
