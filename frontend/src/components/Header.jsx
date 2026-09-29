import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ShieldCheck, 
  MapPin, 
  UserCheck, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  LogOut 
} from 'lucide-react';

export function Header({ activeStation, setActiveStation, onOpenSecurityModal, onOpenProfileModal }) {
  const { user, tokenClaims, logout } = useAuth();
  const { isOnline, isSimulatedOffline, pendingEvents, syncing, triggerSync, toggleSimulatedOffline } = useOffline();

  return (
    <header>
      {/* Official Government of India Tricolor Ribbon */}
      <div className="gov-tricolor-strip">
        <div className="gov-strip-saffron"></div>
        <div className="gov-strip-white"></div>
        <div className="gov-strip-green"></div>
      </div>

      <div className="gov-top-bar">
        {/* Left: Institutional Identity */}
        <div className="gov-branding-box">
          <div className="gov-emblem">
            <span>IN</span>
          </div>
          <div className="gov-title-stack">
            <span className="gov-meta-sub">
              भारत सरकार | Govt. of India • Ministry of Earth Sciences (MoES)
            </span>
            <span className="gov-title-main">
              National Centre for Polar and Ocean Research (NCPOR) — POLAR-SYNC
            </span>
          </div>
          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
            44-ISEA (2026–27)
          </span>
        </div>

        {/* Right: Operational Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Station Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#1e293b', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #334155' }}>
            <MapPin size={14} color="#38bdf8" />
            <select
              value={activeStation}
              onChange={(e) => setActiveStation(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Maitri" style={{ background: '#1e293b' }}>Maitri Station Hub (-70.76°S, 11.73°E)</option>
              <option value="Bharati" style={{ background: '#1e293b' }}>Bharati Station Hub (-69.41°S, 76.19°E)</option>
              <option value="Dakshin Gangotri" style={{ background: '#1e293b' }}>Dakshin Gangotri Supply Depot</option>
            </select>
          </div>

          {/* Satellite Telemetry Indicator */}
          <div 
            title="Iridium Certus 700 Polar Satcom Uplink"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem', 
              padding: '0.3rem 0.6rem', 
              borderRadius: '4px',
              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: isOnline ? '#34d399' : '#f87171'
            }}
          >
            <Radio size={14} />
            <span>SATCOM: {isOnline ? 'IRIDIUM 700 ACTIVE' : 'CARRIER LOST'}</span>
          </div>

          {/* IndexedDB Offline Toggle & Auto-Sync Engine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={toggleSimulatedOffline}
              className={`btn btn-sm ${isSimulatedOffline ? 'btn-danger' : 'btn-secondary'}`}
              title="Click to simulate polar blizzard RF blackout (tests IndexedDB offline queueing)"
              style={{ fontSize: '0.75rem' }}
            >
              {isSimulatedOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
              <span>{isSimulatedOffline ? 'Offline Mode (Blizzard Outage)' : 'Network Live'}</span>
            </button>

            {pendingEvents.length > 0 && (
              <button
                onClick={triggerSync}
                disabled={syncing || isSimulatedOffline}
                className="btn btn-sm btn-warning"
                title="Click to sync pending IndexedDB mutations to backend"
                style={{ fontSize: '0.75rem' }}
              >
                <RefreshCw size={13} className={syncing ? 'spin' : ''} />
                <span>IndexedDB: {pendingEvents.length} Pending</span>
              </button>
            )}
          </div>

          {/* JWT Security Inspector Modal Button */}
          <button
            onClick={onOpenSecurityModal}
            className="btn btn-sm btn-secondary"
            title="Inspect HMAC-SHA256 JWT Claims and RBAC Matrix"
            style={{ fontSize: '0.75rem' }}
          >
            <Key size={13} color="#f59e0b" />
            <span>JWT & RBAC</span>
          </button>

          {/* Current Operator Profile Button */}
          <button
            onClick={onOpenProfileModal}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.75rem', borderColor: '#0284c7' }}
          >
            <ShieldCheck size={13} color="#38bdf8" />
            <span>{user ? user.name : 'Officer'} ({user ? user.role : 'Guest'})</span>
          </button>

          {/* Sign Out / Lock Button */}
          <button
            onClick={logout}
            className="btn btn-sm btn-secondary"
            title="Lock terminal and return to Login / Registration portal"
            style={{ fontSize: '0.75rem', color: '#f87171' }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
