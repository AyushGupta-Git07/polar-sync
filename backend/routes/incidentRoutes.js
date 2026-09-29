const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware, requirePermission } = require('../middleware/auth');

// GET all reported emergency incidents
router.get('/', verifyTokenMiddleware, async (req, res) => {
  const incidents = await db.find('incidents');
  res.json({ status: 'success', count: incidents.length, data: incidents });
});

// POST report new incident
router.post('/', verifyTokenMiddleware, async (req, res) => {
  const { title, type, details, description, severity = 'warning', location = 'Maitri Sector' } = req.body;
  const incident = {
    id: req.body.id || ('INC-' + Date.now()),
    title: title || type || 'Polar Field Incident',
    type: type || title || 'Polar Field Incident',
    details: details || description || 'Field incident logged',
    description: description || details || 'Field incident logged',
    severity,
    location,
    timestamp: req.body.timestamp || new Date().toISOString(),
    status: req.body.status || 'Active / Queued',
    reportedBy: req.user ? (req.user.name || req.user.username) : 'Duty Officer',
    role: req.user ? req.user.role : 'Officer'
  };

  await db.insert('incidents', incident);
  res.json({ status: 'success', message: 'Incident recorded in station vault', data: incident });
});

// POST trigger emergency alarm drill (requires 'trigger:alarm')
router.post('/alarm', verifyTokenMiddleware, requirePermission('trigger:alarm'), (req, res) => {
  res.json({
    status: 'success',
    alarmTriggered: true,
    message: 'EMERGENCY KLAXON DRILL SIGNALED ACROSS ALL 4 SECTORS. ALL HANDS MUSTER PROTOCOL ACTIVE.',
    timestamp: new Date().toISOString(),
    authorizedBy: req.user.username
  });
});

module.exports = router;
