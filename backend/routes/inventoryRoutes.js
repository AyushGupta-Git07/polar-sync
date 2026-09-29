const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware, requirePermission } = require('../middleware/auth');

// GET all inventory stores
router.get('/', verifyTokenMiddleware, async (req, res) => {
  const items = await db.find('inventory');
  res.json({ status: 'success', count: items.length, data: items });
});

// PUT update inventory stock level
router.put('/:id/stock', verifyTokenMiddleware, async (req, res) => {
  const { change, stock } = req.body;
  const item = await db.findOne('inventory', { id: req.params.id });
  if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });

  let newStock;
  if (stock !== undefined) {
    newStock = Math.max(0, Number(stock));
  } else if (change !== undefined) {
    newStock = Math.max(0, (item.currentStock || item.stock || 0) + Number(change));
  } else {
    newStock = item.currentStock || item.stock || 0;
  }

  await db.update('inventory', { id: req.params.id }, { currentStock: newStock, stock: newStock });
  const fresh = await db.findOne('inventory', { id: req.params.id });
  res.json({ status: 'success', message: 'Inventory adjusted', data: fresh });
});

// POST update inventory stock (legacy / alternative endpoint)
router.post('/:id/update', verifyTokenMiddleware, async (req, res) => {
  const { stock, dailyBurnRate, change } = req.body;
  const item = await db.findOne('inventory', { id: req.params.id });
  if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });

  const updateData = {};
  if (stock !== undefined) {
    updateData.stock = Number(stock);
    updateData.currentStock = Number(stock);
  } else if (change !== undefined) {
    const s = Math.max(0, (item.currentStock || item.stock || 0) + Number(change));
    updateData.stock = s;
    updateData.currentStock = s;
  }
  if (dailyBurnRate !== undefined) updateData.dailyBurnRate = Number(dailyBurnRate);

  await db.update('inventory', { id: req.params.id }, updateData);
  const fresh = await db.findOne('inventory', { id: req.params.id });
  res.json({ status: 'success', message: 'Inventory stock level adjusted', data: fresh });
});

module.exports = router;
