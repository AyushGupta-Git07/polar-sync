import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, Plus, ShieldAlert, CheckCircle2, BellRing, Clock } from 'lucide-react';

export function IncidentView() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [drillActive, setDrillActive] = useState(false);

  const { isOnline, queueEvent } = useOffline();
  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    severity: 'warning',
    location: 'Maitri Base Perimeter',
    description: ''
  });

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents();
      if (res && res.data) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.warn('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    const newInc = {
      ...formData,
      id: `INC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    if (!isOnline) {
      await queueEvent('REPORT_INCIDENT', newInc);
      setIncidents((prev) => [newInc, ...prev]);
      alert('[IndexedDB Local Capture] Incident recorded offline. Will sync upon connection recovery.');
    } else {
      try {
        await api.reportIncident(newInc);
        loadIncidents();
      } catch (err) {
        await queueEvent('REPORT_INCIDENT', newInc);
        setIncidents((prev) => [newInc, ...prev]);
        alert('[Saved to IndexedDB Queue] Server unreachable. Queued locally for auto-sync.');
      }
    }

    setShowModal(false);
    setFormData({ title: '', severity: 'warning', location: 'Maitri Base Perimeter', description: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Emergency Drill Banner */}
      {drillActive && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '2px solid #ef4444', borderRadius: '6px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BellRing size={24} color="#f87171" className="spin" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171' }}>
                POLAR EMERGENCY READINESS DRILL ACTIVE — ALL STATIONS ACKNOWLEDGE
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                Simulating Katabatic Blizzard Category 3 with Power Line Breaker Trip. Muster check in progress.
              </div>
            </div>
          </div>
          <button onClick={() => setDrillActive(false)} className="btn btn-sm btn-secondary">
            Stand Down Drill
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={18} color="#ef4444" />
              Emergency & Incident SITREP Ledger
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Standard Polar Hazard Reporting: Crevasse Breaches, Severe Blizzards, Generator Trips, and Evacuations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setDrillActive(!drillActive)}
              className="btn btn-sm btn-danger"
            >
              <BellRing size={14} /> {drillActive ? 'Stop Alarm Drill' : 'Trigger Drill'}
            </button>
            {hasPermission('incidents:write') && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-sm btn-primary"
              >
                <Plus size={14} /> Log New SITREP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="gov-card">
        <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              {loading ? 'Retrieving safety logs...' : 'No open incidents. All stations reporting green.'}
            </div>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={`badge ${
                        inc.severity === 'critical'
                          ? 'badge-danger'
                          : inc.severity === 'warning'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{inc.title}</h3>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} /> {new Date(inc.timestamp || Date.now()).toLocaleString()}
                  </div>
                </div>

                <p style={{ fontSize: '0.825rem', color: '#d1d5db' }}>{inc.description}</p>

                <div style={{ fontSize: '0.75rem', color: '#9ca3af', borderTop: '1px solid #374151', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Location: <strong style={{ color: '#f8fafc' }}>{inc.location}</strong></span>
                  <span style={{ color: inc.status === 'resolved' ? '#34d399' : '#fbbf24' }}>
                    Status: {inc.status?.toUpperCase() || 'INVESTIGATING'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Incident Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Log Polar Field Incident / SITREP
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreateIncident}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crevasse Bridge Subsidence on Traverse Mile 42"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="form-select"
                    >
                      <option value="info">Informational / Advisory</option>
                      <option value="warning">Warning / Operational Alert</option>
                      <option value="critical">Critical / Life-Safety Immediate</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maitri Station North Approach"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed SITREP Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide exact coordinates, personnel involved, immediate mitigation actions taken, and equipment status..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Submit SITREP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
