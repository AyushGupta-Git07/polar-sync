const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware } = require('../middleware/auth');

// GET all expedition personnel roster
router.get('/', verifyTokenMiddleware, async (req, res) => {
  const members = await db.find('personnel');
  res.json({ status: 'success', count: members.length, data: members });
});

// GET station muster summary
router.get('/muster', verifyTokenMiddleware, async (req, res) => {
  const members = await db.find('personnel');
  const baseCount = members.filter(m => m.status.includes('Station') || m.status.includes('Duty')).length;
  const fieldCount = members.filter(m => m.status.includes('Field')).length;

  res.json({
    status: 'success',
    totalMustered: members.length,
    baseDeployment: baseCount,
    fieldSortieDeployment: fieldCount,
    stationReadyPct: 100,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
