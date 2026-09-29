const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyTokenMiddleware } = require('../middleware/auth');

// GET all geospatial telemetry: stations, sorties, hazard zones
router.get('/all', verifyTokenMiddleware, async (req, res) => {
  const stations = await db.find('gis_stations');
  const sorties = await db.find('gis_sorties');
  const hazards = await db.find('gis_hazards');

  res.json({
    status: 'success',
    data: {
      stations,
      sorties,
      crevasseHazards: hazards,
      projection: 'EPSG:3031 WGS-84 Antarctic Polar Stereographic'
    }
  });
});

module.exports = router;
