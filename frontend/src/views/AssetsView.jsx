import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../services/exportCsv';
import { Truck, Download, Wrench, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

export function AssetsView() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newStatus, setNewStatus] = useState('operational');
  const [statusNotes, setStatusNotes] = useState('');

  const { hasPermission } = useAuth();

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets();
      if (res && res.data) {
        setAssets(res.data);
      }
    } catch (err) {
      console.warn('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await api.updateAssetStatus(selectedAsset.id, newStatus, statusNotes);
      loadAssets();
      setSelectedAsset(null);
      setStatusNotes('');
    } catch (err) {
      alert(`Error updating asset status: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} color="#38bdf8" />
              Polar Vehicle & Heavy Infrastructure Fleet
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              PistenBully Snowcats, Cummins Arctic Diesel Gensets, and Autonomous GPR Crevasse Rovers
            </p>
          </div>

          <button
            onClick={() => exportToCsv('44_ISEA_Fleet_Assets', assets)}
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="gov-card">
        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Equipment Name</th>
                <th>Type / Model</th>
                <th>Operating Hours</th>
                <th>Next Maintenance Due</th>
                <th>Station Base</th>
                <th>Operational Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {loading ? 'Polling fleet maintenance registers...' : 'No fleet assets found.'}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="mono" style={{ fontWeight: 600, color: '#38bdf8' }}>
                      {asset.id}
                    </td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{asset.name}</td>
                    <td>
                      <span className="badge badge-neutral">{asset.type}</span>
                    </td>
                    <td className="mono">{asset.operatingHours || 1240} hrs</td>
                    <td className="mono" style={{ color: asset.hoursUntilService < 50 ? '#f87171' : '#94a3b8' }}>
                      {asset.nextServiceDue || '250 hrs (Synthetic Oil & Track Pad)'}
                    </td>
                    <td>{asset.station || 'Maitri Base'}</td>
                    <td>
                      <span
                        className={`badge ${
                          asset.status === 'operational'
                            ? 'badge-success'
                            : asset.status === 'field_deployed'
                            ? 'badge-info'
                            : asset.status === 'maintenance'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      {hasPermission('assets:write') && (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setNewStatus(asset.status);
                          }}
                          className="btn btn-sm btn-secondary"
                        >
                          <Wrench size={13} /> Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Status Modal */}
      {selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Service Log: {selectedAsset.name} ({selectedAsset.id})
              </h3>
              <button onClick={() => setSelectedAsset(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Operational Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="operational">Operational (Mission Ready)</option>
                    <option value="field_deployed">Field Deployed (On Convoy Traverse)</option>
                    <option value="maintenance">Under Maintenance / Workshop Service</option>
                    <option value="critical_standby">Critical Standby (Cold Bay)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Engineer Maintenance Notes</label>
                  <textarea
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="form-textarea"
                    placeholder="e.g. Completed 250hr hydraulic oil filter replacement; glow plug heating circuit verified."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedAsset(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
