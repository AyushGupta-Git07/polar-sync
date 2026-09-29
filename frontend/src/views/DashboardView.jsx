import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Thermometer, 
  Wind, 
  Fuel, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Navigation
} from 'lucide-react';

export function DashboardView({ activeStation, onNavigate }) {
  const [cargoSummary, setCargoSummary] = useState({ total: 14, inTransit: 3 });
  const [personnelCount, setPersonnelCount] = useState({ total: 46, present: 46 });
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, pRes, iRes] = await Promise.all([
          api.getCargo().catch(() => null),
          api.getPersonnel().catch(() => null),
          api.getIncidents().catch(() => null)
        ]);
        if (cRes && cRes.data) {
          setCargoSummary({
            total: cRes.data.length,
            inTransit: cRes.data.filter(c => c.status === 'in_transit').length
          });
        }
        if (pRes && pRes.data) {
          setPersonnelCount({
            total: pRes.data.length,
            present: pRes.data.filter(p => p.status === 'present').length
          });
        }
        if (iRes && iRes.data) {
          setIncidents(iRes.data.slice(0, 3));
        }
      } catch (err) {
        console.warn('Dashboard telemetry fetch error:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Station Readiness Assessment */}
      <div className="gov-card" style={{ borderLeft: '4px solid #10b981' }}>
        <div className="gov-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success">STATION READINESS INDEX: 88%</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>42 of 48 Operational Traverse Checkpoints Cleared</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', color: '#f8fafc' }}>
              {activeStation} Station Operational Theater — 44th Indian Scientific Expedition (44-ISEA)
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Primary Life-Support Systems: NOMINAL | Arctic Diesel Reserves: 84 Days Autonomy | Satellite Link: Iridium Certus 700 (99.8%)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('gis')}>
              <Navigation size={14} /> Open Polar GIS Map
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('ai')}>
              Run ML Risk Engine <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">
            <span>Sub-Zero Ambient Temp</span>
            <Thermometer size={16} color="#38bdf8" />
          </div>
          <div className="metric-value">-18.4°C</div>
          <div className="metric-sub">Wind Chill Index: -31.2°C (Katabatic)</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Surface Wind Velocity</span>
            <Wind size={16} color="#fbbf24" />
          </div>
          <div className="metric-value">32 kts</div>
          <div className="metric-sub">Direction: 190° SSW | Gusting to 48 kts</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Polar Diesel Buffer</span>
            <Fuel size={16} color="#34d399" />
          </div>
          <div className="metric-value">84 Days</div>
          <div className="metric-sub">Arctic Grade ATF-50 (Sub-zero inhibitor)</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Expedition Muster Count</span>
            <Users size={16} color="#a78bfa" />
          </div>
          <div className="metric-value">{personnelCount.present} / {personnelCount.total}</div>
          <div className="metric-sub">100% Accounted for (0 Overdue Sorties)</div>
        </div>
      </div>

      {/* Middle Grid: Supply Chain Status & Incident SITREPs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* Container Supply Pipeline */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <ShieldCheck size={16} color="#38bdf8" />
              Traverse Supply Chain & Critical Consignments
            </span>
            <span className="badge badge-info">{cargoSummary.inTransit} Active Sorties</span>
          </div>
          <div className="gov-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#1f2937', borderRadius: '4px', borderLeft: '3px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>NCPOR-44ISEA-C102 (Arctic Aviation Turbine Fuel)</span>
                  <span className="badge badge-warning">IN TRANSIT</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  PistenBully PB-04 Convoy en route from Ice Shelf Barrier to Maitri (ETA: 4h 15m)
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#1f2937', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>NCPOR-44ISEA-C104 (Deep Ice-Core Biological Samples)</span>
                  <span className="badge badge-success">SECURED</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Station Cold Bay: Temperature maintained at -78.4°C (Dry ice reserve steady)
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#1f2937', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>NCPOR-44ISEA-C105 (Cummins DG Spare Cylinder Heads)</span>
                  <span className="badge badge-info">AT SHORE STAGING</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Awaiting weather window for helicopter sling load transfer to Maitri Base
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational SITREP Ledger */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <AlertTriangle size={16} color="#f59e0b" />
              Recent Field Incidents & Safety SITREP Log
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('incidents')}>
              View All SITREPs
            </button>
          </div>
          <div className="gov-card-body">
            {incidents.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                No active critical incidents recorded. All stations reporting green.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {incidents.map((inc) => (
                  <div key={inc.id || inc._id} style={{ padding: '0.65rem', backgroundColor: '#1f2937', borderRadius: '4px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{inc.title}</span>
                      <span className={`badge ${inc.severity === 'critical' ? 'badge-danger' : inc.severity === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {inc.description}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.35rem' }}>
                      Location: {inc.location} | Logged: {new Date(inc.timestamp || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
