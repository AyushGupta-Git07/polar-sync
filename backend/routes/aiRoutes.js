const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { verifyTokenMiddleware } = require('../middleware/auth');

// POST predict traverse mission risk via Scikit-Learn RandomForest
router.post('/predict-risk', verifyTokenMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await aiService.predictRisk(payload);
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST forecast fuel burn and days of autonomy via Scikit-Learn Ridge Regressor
router.post('/forecast-resources', verifyTokenMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await aiService.forecastResources(payload);
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET predefined polar mission scenarios for live simulation
router.get('/scenarios', verifyTokenMiddleware, (req, res) => {
  res.json({
    status: 'success',
    scenarios: {
      pb04: {
        id: 'pb04',
        title: 'PB-04 Snowcat Seizure & Hydraulic Freeze',
        desc: 'PB-04 hydraulic fluid viscosity degradation under -35°C stress causes valve freeze at Waypoint 4.',
        people: 12,
        readinessBefore: '79%',
        readinessAfter: '86%',
        mitigation: 'Reassign standby snow vehicle PB-07 from Station Hangar to escort Field Team Alpha.',
        actionLabel: 'Authorize PB-07 Reassignment'
      },
      c102: {
        id: 'c102',
        title: 'C-102 Maritime Ice-Lock (+14 Day Delay)',
        desc: 'Supply vessel C-102 locked in heavy fast-ice at 68°S. Generator spare parts delayed past 4-day buffer.',
        people: 46,
        readinessBefore: '74%',
        readinessAfter: '84%',
        mitigation: 'Divert critical spare seal kit via Basler BT-67 air-bridge from coastal shelf strip.',
        actionLabel: 'Dispatch BT-67 Air Bridge Divert'
      },
      storm: {
        id: 'storm',
        title: 'Category 5 Katabatic Gale Outbreak (95 km/h)',
        desc: 'Barometric gradient induces 95 km/h katabatic winds with zero visibility (<50m). Surface traverse hazard critical.',
        people: 18,
        readinessBefore: '71%',
        readinessAfter: '89%',
        mitigation: 'Enforce Station Phase 3 Curfew. Recall field assets within 5km and secure shelter blast hatches.',
        actionLabel: 'Enforce Phase 3 Curfew Lockdown'
      }
    }
  });
});

module.exports = router;
