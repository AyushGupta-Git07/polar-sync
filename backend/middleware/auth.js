const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'polar-sync-ncpor-2026-auth';

const RBAC_ROLES = {
  'Station Admin': {
    name: 'Station Admin',
    description: 'Full Station Authority & System Override',
    permissions: ['*'],
    badgeColor: '#ef4444'
  },
  'Emergency Coordinator': {
    name: 'Emergency Coordinator',
    description: 'Crisis Intervention, Life Safety & Curfew Override',
    permissions: ['read:all', 'trigger:alarm', 'override:curfew', 'manage:emergency', 'triage:medical', 'report:incident', 'incidents:write', 'ai:predict'],
    badgeColor: '#f97316'
  },
  'Expedition Officer': {
    name: 'Expedition Officer',
    description: 'Sortie Planning, Field Traverse & Mission Command',
    permissions: ['read:all', 'manage:planning', 'authorize:sortie', 'report:incident', 'view:telemetry', 'incidents:write', 'ai:predict'],
    badgeColor: '#38bdf8'
  },
  'Logistics Officer': {
    name: 'Logistics Officer',
    description: 'Supply Chain, QR Asset Tagging & Cargo Manifest',
    permissions: ['read:all', 'manage:cargo', 'cargo:write', 'manage:inventory', 'inventory:write', 'scan:qr', 'create:cargo_event', 'ai:predict'],
    badgeColor: '#10b981'
  },
  'Maintenance Officer': {
    name: 'Maintenance Officer',
    description: 'Fleet Health, Machinery Overhaul & Mitigation Authorization',
    permissions: ['read:all', 'manage:assets', 'assets:write', 'manage:inventory', 'inventory:write', 'authorize:mitigation', 'scan:qr', 'service:snowcat', 'ai:predict'],
    badgeColor: '#eab308'
  }
};

const ROLE_ALIASES = {
  'station_admin': 'Station Admin',
  'admin': 'Station Admin',
  'emergency_coordinator': 'Emergency Coordinator',
  'emergency': 'Emergency Coordinator',
  'expedition_officer': 'Expedition Officer',
  'expedition': 'Expedition Officer',
  'logistics_officer': 'Logistics Officer',
  'logistics': 'Logistics Officer',
  'maintenance_officer': 'Maintenance Officer',
  'maintenance': 'Maintenance Officer'
};

function generateToken(user) {
  const rawRole = user.role || 'Expedition Officer';
  const roleName = ROLE_ALIASES[rawRole.toLowerCase()] || rawRole;
  const roleConfig = RBAC_ROLES[roleName] || RBAC_ROLES['Expedition Officer'];

  const payload = {
    iss: 'ncpor.gov.in/polar-sync',
    sub: user.id || 'POLAR-OP-9042',
    username: user.username || 'Ashish Saini',
    name: user.name || user.username || 'Ashish Saini',
    role: roleName,
    station: user.station || 'Maitri Base (70°46′S, 11°44′E)',
    permissions: roleConfig.permissions,
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' });
  return { token, payload };
}

function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // If no token is provided, allow public read or anonymous fallback
    req.user = { role: 'Guest', permissions: ['read:all'] };
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired JWT token', error: err.message });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Missing credentials' });
    }
    const perms = req.user.permissions;
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }
    return res.status(403).json({
      status: 'error',
      message: `RBAC Access Denied: Action requires "${permission}" permission.`,
      userRole: req.user.role
    });
  };
}

module.exports = {
  JWT_SECRET,
  RBAC_ROLES,
  generateToken,
  verifyTokenMiddleware,
  requirePermission
};
