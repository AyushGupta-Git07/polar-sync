import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  UserCheck, 
  Check, 
  X, 
  Copy, 
  CheckCircle2,
  RefreshCw 
} from 'lucide-react';

export function SecurityView() {
  const { user, token, tokenClaims, loginAsDemo, demoProfiles } = useAuth();
  const [copied, setCopied] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchRole = async (roleName) => {
    setSwitchingRole(true);
    await loginAsDemo(roleName);
    setSwitchingRole(false);
  };

  const RBAC_MATRIX = [
    { permission: 'View Dashboard & GIS Telemetry', key: 'telemetry:read', admin: true, logistics: true, expedition: true, maintenance: true, emergency: true },
    { permission: 'Create & Modify Cargo Manifests', key: 'cargo:write', admin: true, logistics: true, expedition: false, maintenance: false, emergency: false },
    { permission: 'Adjust Fuel & Inventory Reserves', key: 'inventory:write', admin: true, logistics: true, expedition: false, maintenance: true, emergency: false },
    { permission: 'Update Fleet & Heavy Asset Logs', key: 'assets:write', admin: true, logistics: false, expedition: false, maintenance: true, emergency: false },
    { permission: 'Broadcast Emergency SITREPs & Alarms', key: 'incidents:write', admin: true, logistics: false, expedition: true, maintenance: false, emergency: true },
    { permission: 'Execute Scikit-Learn Predictive Inference', key: 'ai:predict', admin: true, logistics: true, expedition: true, maintenance: true, emergency: true },
    { permission: 'Master Station Administration', key: '*', admin: true, logistics: false, expedition: false, maintenance: false, emergency: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#10b981" />
              Cryptographic Security: HMAC-SHA256 JWT & Role-Based Access Control (RBAC)
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Military & Institutional Multi-Tenant Identity Verification: Granular Action Grants & Signed Claims
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-success">
              Algorithm: HMAC-SHA256 (HS256)
            </span>
          </div>
        </div>
      </div>

      {/* Role Switcher Toolbar */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <UserCheck size={16} color="#38bdf8" />
            Switch Active Officer Role (Demonstrates Live RBAC Token Regeneration)
          </span>
        </div>
        <div className="gov-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {demoProfiles.map((p) => {
              const isCurrent = user?.role === p.role;
              return (
                <button
                  key={p.role}
                  disabled={switchingRole || isCurrent}
                  onClick={() => handleSwitchRole(p.role)}
                  className={`btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.65rem 0.85rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{p.title}</div>
                  <span
                    className="badge"
                    style={{
                      marginTop: '0.35rem',
                      fontSize: '0.65rem',
                      backgroundColor: isCurrent ? 'rgba(255,255,255,0.2)' : 'rgba(56, 189, 248, 0.1)',
                      color: isCurrent ? '#fff' : '#38bdf8'
                    }}
                  >
                    {p.role.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column: Live Token Inspector & Claims Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Token String & Header */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Key size={16} color="#fbbf24" />
              Raw Bearer Token & JOSE Header
            </span>
            <button onClick={copyToken} className="btn btn-sm btn-secondary">
              {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Token'}
            </button>
          </div>
          <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>
                Signed JWT String:
              </div>
              <div
                className="mono"
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  wordBreak: 'break-all',
                  color: '#38bdf8',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {token || 'No active JWT'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>
                JOSE Header (Algorithm & Typ):
              </div>
              <pre
                className="mono"
                style={{
                  padding: '0.65rem',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#f8fafc'
                }}
              >
{JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Decoded Claims Payload */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Lock size={16} color="#38bdf8" />
              Decoded Claims & Permission Grants
            </span>
          </div>
          <div className="gov-card-body">
            {tokenClaims ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Subject ID (sub):</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{tokenClaims.sub}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Designated Role:</span>
                  <span className="badge badge-info">{tokenClaims.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Officer Name:</span>
                  <span style={{ fontWeight: 600 }}>{tokenClaims.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Station Hub:</span>
                  <span>{tokenClaims.station} Base</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #374151', paddingBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Token Expiration (exp):</span>
                  <span className="mono" style={{ color: '#34d399' }}>
                    {tokenClaims.exp ? new Date(tokenClaims.exp * 1000).toLocaleTimeString() : '24h Standard'}
                  </span>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '0.35rem' }}>Active RBAC Grants:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(tokenClaims.permissions || []).map((perm) => (
                      <span key={perm} className="badge badge-success mono" style={{ fontSize: '0.7rem' }}>
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No token claims loaded.</div>
            )}
          </div>
        </div>
      </div>

      {/* RBAC Authorization Matrix Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            Institutional Role-Based Access Control (RBAC) Permission Matrix
          </span>
        </div>
        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Operational Action / Privilege</th>
                <th>Permission Key</th>
                <th>Station Admin</th>
                <th>Logistics Officer</th>
                <th>Expedition Officer</th>
                <th>Maintenance Engineer</th>
                <th>Emergency Coordinator</th>
              </tr>
            </thead>
            <tbody>
              {RBAC_MATRIX.map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.permission}</td>
                  <td className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{row.key}</td>
                  <td>{row.admin ? <Check size={16} color="#34d399" /> : <X size={16} color="#ef4444" />}</td>
                  <td>{row.logistics ? <Check size={16} color="#34d399" /> : <X size={16} color="#ef4444" />}</td>
                  <td>{row.expedition ? <Check size={16} color="#34d399" /> : <X size={16} color="#ef4444" />}</td>
                  <td>{row.maintenance ? <Check size={16} color="#34d399" /> : <X size={16} color="#ef4444" />}</td>
                  <td>{row.emergency ? <Check size={16} color="#34d399" /> : <X size={16} color="#ef4444" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
