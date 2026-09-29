const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware, requirePermission } = require('../middleware/auth');

// GET all cargo consignments
router.get('/', verifyTokenMiddleware, async (req, res) => {
  const items = await db.find('cargo');
  res.json({ status: 'success', count: items.length, data: items });
});

// GET single container by ID
router.get('/:id', verifyTokenMiddleware, async (req, res) => {
  const item = await db.findOne('cargo', { id: req.params.id });
  if (!item) return res.status(404).json({ status: 'error', message: 'Container not found' });
  res.json({ status: 'success', data: item });
});

// POST create new cargo container
router.post('/', verifyTokenMiddleware, async (req, res) => {
  const { containerId, title, category, imdgClass, weightKg, destination, tempRequirement, rfidTag, status, location } = req.body;
  const newContainer = {
    id: containerId || ('NCPOR-44ISEA-C' + Math.floor(100 + Math.random() * 900)),
    containerId: containerId || ('NCPOR-44ISEA-C' + Math.floor(100 + Math.random() * 900)),
    title: title || 'Polar Stores Consignment',
    category: category || 'General',
    imdgClass: imdgClass || 'Non-Hazardous',
    weightKg: Number(weightKg) || 3500,
    destination: destination || 'Maitri',
    tempRequirement: tempRequirement || 'Ambient (-20°C)',
    rfidTag: rfidTag || ('EPC-' + Date.now()),
    status: status || 'staged',
    location: location || 'Dakshin Gangotri Staging Depot',
    createdAt: new Date().toISOString()
  };

  await db.insert('cargo', newContainer);
  res.json({ status: 'success', message: 'Container registered successfully', data: newContainer });
});

// POST add cargo event (requires 'manage:cargo' or 'create:cargo_event')
router.post('/events', verifyTokenMiddleware, requirePermission('create:cargo_event'), async (req, res) => {
  const { containerId, eventType, message, location } = req.body;
  const event = {
    id: 'EV-CRG-' + Date.now(),
    containerId,
    eventType: eventType || 'STATUS_UPDATE',
    message: message || 'Cargo status updated',
    location: location || 'Maitri Staging',
    recordedBy: req.user ? req.user.username : 'Unknown Officer',
    role: req.user ? req.user.role : 'Officer',
    timestamp: new Date().toISOString()
  };

  await db.insert('cargo_events', event);
  res.json({ status: 'success', message: 'Cargo event recorded in station ledger', data: event });
});

// POST scan optical QR or RFID tag
router.post('/scan', verifyTokenMiddleware, async (req, res) => {
  const { code, scanType = 'QR' } = req.body;
  if (!code) return res.status(400).json({ status: 'error', message: 'Missing barcode or RFID code' });

  // Match against cargo, assets, or personnel
  const cargoList = await db.find('cargo');
  const matchedCargo = cargoList.find(c => c.id === code || c.qrCode === code || c.rfidTag === code);

  if (matchedCargo) {
    return res.json({
      status: 'success',
      matchType: 'CARGO_CONTAINER',
      item: matchedCargo,
      scanMetadata: {
        timestamp: new Date().toISOString(),
        scanType,
        verified: true,
        protocol: scanType === 'RFID' ? 'EPC Gen2 UHF (865-868 MHz)' : 'GS1-128 Optical QR'
      }
    });
  }

  const assetList = await db.find('assets');
  const matchedAsset = assetList.find(a => a.id === code || a.qrCode === code || a.rfidTag === code);
  if (matchedAsset) {
    return res.json({
      status: 'success',
      matchType: 'FLEET_MACHINERY',
      item: matchedAsset,
      scanMetadata: {
        timestamp: new Date().toISOString(),
        scanType,
        verified: true,
        protocol: scanType === 'RFID' ? 'EPC Gen2 UHF (865-868 MHz)' : 'GS1-128 Optical QR'
      }
    });
  }

  res.json({
    status: 'unrecognized',
    message: `Scanned code ${code} not matched to active 44-ISEA database record.`,
    code
  });
});

module.exports = router;
