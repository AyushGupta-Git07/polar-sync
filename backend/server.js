require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./config/db');
const { seedDatabase } = require('./services/seedData');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const assetRoutes = require('./routes/assetRoutes');
const personnelRoutes = require('./routes/personnelRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const gisRoutes = require('./routes/gisRoutes');
const syncRoutes = require('./routes/syncRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'NCPOR POLAR-SYNC Antarctic Logistics API',
    expedition: '44th Indian Scientific Expedition to Antarctica (44-ISEA)',
    databaseMode: db.getMode(),
    security: 'HMAC-SHA256 JWT + Role-Based Access Control (RBAC)',
    aiEngine: 'Python Scikit-Learn RandomForest + Ridge Regressors',
    serverTime: new Date().toISOString()
  });
});

// Serve compiled React SPA frontend
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Fallback to static prototype
  app.use(express.static(path.join(__dirname, '..')));
}

// Initialize database and start HTTP server
async function startServer() {
  await db.connect();
  seedDatabase(db);

  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  NCPOR POLAR-SYNC EXPEDITION LOGISTICS & ASSET API`);
    console.log(`  Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'production'}`);
    console.log(`  Database: ${db.getMode()}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`================================================================`);
  });
}

startServer().catch((err) => {
  console.error('[!] Failed to start POLAR-SYNC server:', err);
});
