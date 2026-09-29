const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware, requirePermission } = require('../middleware/auth');

// GET all fleet and equipment assets
router.get('/', verifyTokenMiddleware, async (req, res) => {
  const assets = await db.find('assets');
  res.json({ status: 'success', count: assets.length, data: assets });
});

// PUT update asset status & maintenance logs
router.put('/:id/status', verifyTokenMiddleware, async (req, res) => {
  const { status, notes } = req.body;
  const asset = await db.findOne('assets', { id: req.params.id });
  if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });

  await db.update('assets', { id: req.params.id }, { status });
  if (notes) {
    await db.insert('maintenance_logs', {
      id: 'LOG-' + Date.now(),
      assetId: req.params.id,
      notes,
      status,
      timestamp: new Date().toISOString()
    });
  }

  const fresh = await db.findOne('assets', { id: req.params.id });
  res.json({ status: 'success', message: 'Asset status updated', data: fresh });
});

// POST authorize overhaul or contingency action (requires 'authorize:mitigation' or 'service:snowcat')
router.post('/:id/mitigate', verifyTokenMiddleware, requirePermission('authorize:mitigation'), async (req, res) => {
  const { action, note } = req.body;
  const asset = await db.findOne('assets', { id: req.params.id });
  if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });

  await db.update('assets', { id: req.params.id }, {
    status: `Mitigation Active: ${action || 'Backup Relief Dispatched'}`,
    conditionPct: 86
  });

  const log = {
    id: 'MIT-' + Date.now(),
    assetId: req.params.id,
    action: action || 'Contingency Reassignment',
    authorizedBy: req.user ? req.user.username : 'Command',
    note: note || 'Field recovery protocol active',
    timestamp: new Date().toISOString()
  };
  await db.insert('maintenance_logs', log);

  res.json({
    status: 'success',
    message: `Mitigation authorized for ${asset.name}. Mission readiness restored to 86%.`,
    log
  });
});

module.exports = router;
