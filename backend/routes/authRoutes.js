const express = require('express');
const router = express.Router();
const { generateToken, verifyTokenMiddleware, RBAC_ROLES } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username = 'Ashish Saini', role = 'Expedition Officer', station = 'Maitri Base (70°46′S, 11°44′E)' } = req.body;
  const user = { username, role, station };
  const { token, payload } = generateToken(user);

  res.json({
    status: 'success',
    message: `Authenticated as ${role} (${username})`,
    token,
    user: payload,
    rolesConfig: RBAC_ROLES
  });
});

router.post('/register', async (req, res) => {
  const { username, name, role = 'Expedition Officer', station = 'Maitri Base', serviceId, bloodGroup } = req.body;
  const db = require('../config/db');
  
  const newUser = {
    id: 'POLAR-' + Date.now().toString().slice(-4),
    username: username || name || 'New Officer',
    name: name || username || 'Expedition Officer',
    role,
    station,
    serviceId: serviceId || ('MoES-44ISEA-' + Math.floor(1000 + Math.random() * 9000)),
    bloodGroup: bloodGroup || 'O+',
    status: 'present',
    registeredAt: new Date().toISOString()
  };

  // Register into station personnel roster
  await db.insert('personnel', {
    id: newUser.id,
    name: newUser.name,
    role: newUser.role,
    designation: newUser.role,
    station: (newUser.station || '').includes('Bharati') ? 'Bharati' : 'Maitri',
    bloodGroup: newUser.bloodGroup,
    hypothermiaRisk: 'Nominal',
    status: 'present',
    lastCheckin: 'Just Registered'
  });

  const { token, payload } = generateToken(newUser);

  res.json({
    status: 'success',
    message: `Expedition credentials registered for ${newUser.name}`,
    token,
    user: payload
  });
});

router.get('/verify', verifyTokenMiddleware, (req, res) => {
  res.json({
    status: 'success',
    valid: true,
    user: req.user
  });
});

router.get('/roles', (req, res) => {
  res.json({
    status: 'success',
    roles: RBAC_ROLES
  });
});

module.exports = router;
