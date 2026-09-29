const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware } = require('../middleware/auth');

// POST batch synchronize offline events from client IndexedDB
router.post('/events', verifyTokenMiddleware, async (req, res) => {
  const { events } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ status: 'error', message: 'Payload must contain an "events" array' });
  }

  let syncedCount = 0;
  for (const ev of events) {
    await db.insert('sync_audit_log', {
      ...ev,
      reconciledAt: new Date().toISOString(),
      clientDeviceId: ev.device || 'POLAR-NODE-01',
      serverSyncStatus: 'COMMITTED'
    });

    // If it's a cargo update or new container, apply to cargo collection
    if ((ev.eventType === 'CREATE_CARGO' || ev.type === 'cargo_update' || ev.type === 'CREATE_CARGO') && ev.payload) {
      await db.insert('cargo', {
        id: ev.payload.containerId || ev.payload.id || ('NCPOR-C' + Date.now()),
        ...ev.payload,
        syncedFromOfflineQueue: true,
        reconciledAt: new Date().toISOString()
      });
      await db.insert('cargo_events', {
        id: 'SYNC-' + (ev.id || Date.now()),
        message: ev.payload.title || 'Synchronized cargo record from offline queue',
        timestamp: ev.timestamp || new Date().toISOString(),
        syncedFromOfflineQueue: true
      });
    }

    // If it's a stock update, apply to inventory collection
    if ((ev.eventType === 'UPDATE_STOCK' || ev.type === 'UPDATE_STOCK') && ev.payload) {
      const item = await db.findOne('inventory', { id: ev.payload.id });
      if (item) {
        const change = Number(ev.payload.change || 0);
        const newStock = Math.max(0, (item.currentStock || item.stock || 0) + change);
        await db.update('inventory', { id: ev.payload.id }, { currentStock: newStock, stock: newStock });
      }
    }

    // If it's an incident, also write to incidents ledger
    if ((ev.eventType === 'REPORT_INCIDENT' || ev.type === 'incident' || ev.type === 'REPORT_INCIDENT') && ev.payload) {
      await db.insert('incidents', {
        id: ev.payload.id || ('SYNC-INC-' + Date.now()),
        title: ev.payload.title || ev.payload.type || 'Field Incident',
        details: ev.payload.description || ev.payload.details || 'Synchronized incident record',
        severity: ev.payload.severity || 'Elevated',
        location: ev.payload.location || 'Antarctic Field',
        timestamp: ev.payload.timestamp || new Date().toISOString(),
        reportedBy: ev.payload.reportedBy || 'Offline Operator',
        syncedFromOfflineQueue: true
      });
    }

    syncedCount++;
  }

  res.json({
    status: 'success',
    appliedCount: syncedCount,
    reconciledCount: syncedCount,
    message: `Successfully synchronized ${syncedCount} offline events into NCPOR central database.`,
    serverTime: new Date().toISOString()
  });
});

module.exports = router;
