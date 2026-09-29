// Integration test for POLAR-SYNC Full Stack
const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING POLAR-SYNC FULL-STACK INTEGRATION TEST ---');

  // 1. Health check
  const health = await get('http://127.0.0.1:5000/api/health');
  console.log('[1] Health Status:', health.status, health.data.system, health.data.databaseMode);

  // 2. Auth Login (JWT Issuance)
  const loginRes = await post('http://127.0.0.1:5000/api/auth/login', {
    username: 'admin',
    password: 'polar2026'
  });
  console.log('[2] Login Status:', loginRes.status, 'User:', loginRes.data.user.name, 'Role:', loginRes.data.user.role);
  const token = loginRes.data.token;
  console.log('[2.1] JWT Token issued (length):', token.length);

  // 3. Verify Token
  const verifyRes = await get('http://127.0.0.1:5000/api/auth/verify', token);
  console.log('[3] Token Verification:', verifyRes.status, verifyRes.data.status, 'Valid sub:', verifyRes.data.user.id);

  // 4. Cargo Manifest
  const cargoRes = await get('http://127.0.0.1:5000/api/cargo', token);
  console.log('[4] Cargo Manifest Status:', cargoRes.status, 'Total Containers:', cargoRes.data.data.length);

  // 5. Inventory Reserves
  const invRes = await get('http://127.0.0.1:5000/api/inventory', token);
  console.log('[5] Inventory Stores Status:', invRes.status, 'Store Items:', invRes.data.data.length);

  // 6. Personnel Muster
  const persRes = await get('http://127.0.0.1:5000/api/personnel', token);
  console.log('[6] Personnel Muster Status:', persRes.status, 'Expedition Crew:', persRes.data.data.length);

  // 7. GIS Telemetry
  const gisRes = await get('http://127.0.0.1:5000/api/gis/all', token);
  console.log('[7] GIS Telemetry Status:', gisRes.status, 'Stations:', gisRes.data.data.stations.length, 'Projection:', gisRes.data.data.projection);

  // 8. AI Scikit-Learn Risk Prediction
  const aiRiskRes = await post('http://127.0.0.1:5000/api/ai/predict-risk', {
    distance_km: 120,
    cargo_weight_kg: 8500,
    ambient_temp_c: -22,
    wind_speed_kmh: 45,
    crevasse_density: 0.35,
    vehicle_count: 2
  }, token);
  const riskData = aiRiskRes.data.data;
  console.log('[8] AI Risk Engine:', aiRiskRes.status, 'Class:', riskData.predicted_class || riskData.riskClass, 'Confidence:', riskData.confidence_percentage || riskData.confidence);

  // 9. AI Resource Forecasting
  const aiForecastRes = await post('http://127.0.0.1:5000/api/ai/forecast-resources', {
    ambient_temp_c: -22,
    active_crew_count: 46,
    active_snowcats: 2,
    current_diesel_reserve_liters: 32000
  }, token);
  const forecastData = aiForecastRes.data.data;
  console.log('[9] AI Resource Forecaster:', aiForecastRes.status, 'Daily Fuel Burn:', forecastData.predicted_daily_diesel_liters, 'Days Autonomy:', forecastData.days_fuel_autonomy);

  // 10. IndexedDB Sync Reconciler
  const syncRes = await post('http://127.0.0.1:5000/api/sync/events', {
    events: [
      {
        eventId: 'EVT-TEST-001',
        eventType: 'UPDATE_STOCK',
        payload: { id: 'INV-001', name: 'Polar Diesel ATF-50', change: -120 },
        timestamp: new Date().toISOString()
      }
    ]
  }, token);
  console.log('[10] Client Sync Engine Status:', syncRes.status, 'Applied Count:', syncRes.data.appliedCount);

  console.log('--- ALL POLAR-SYNC 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('[!] Test execution failed:', err);
  process.exit(1);
});
