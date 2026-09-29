// Vercel Serverless Function Adapter for NCPOR POLAR-SYNC Express Backend
const express = require('express');
const cors = require('cors');

const db = require('../backend/config/db');
const { seedDatabase } = require('../backend/services/seedData');

// Route Handlers
const authRoutes = require('../backend/routes/authRoutes');
const cargoRoutes = require('../backend/routes/cargoRoutes');
const inventoryRoutes = require('../backend/routes/inventoryRoutes');
const assetRoutes = require('../backend/routes/assetRoutes');
const personnelRoutes = require('../backend/routes/personnelRoutes');
const incidentRoutes = require('../backend/routes/incidentRoutes');
const gisRoutes = require('../backend/routes/gisRoutes');
const syncRoutes = require('../backend/routes/syncRoutes');
const aiRoutes = require('../backend/routes/aiRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize in-memory / tmp collections for Vercel
let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await db.connect();
    seedDatabase(db);
    initialized = true;
  }
}

app.use(async (req, res, next) => {
  await ensureDb();
  next();
});

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
    system: 'NCPOR POLAR-SYNC Antarctic Logistics API (Vercel Serverless Edition)',
    expedition: '44th Indian Scientific Expedition to Antarctica (44-ISEA)',
    databaseMode: db.getMode(),
    security: 'HMAC-SHA256 JWT + Role-Based Access Control (RBAC)',
    aiEngine: 'Python Scikit-Learn Heuristic Engine (Zero-Delay Active)',
    serverTime: new Date().toISOString()
  });
});

module.exports = app;
