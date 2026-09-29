import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../services/exportCsv';
import { 
  Package, 
  Download, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  ShieldAlert, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export function CargoView() {
  const [cargo, setCargo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState(null);

  const { isOnline, queueEvent } = useOffline();
  const { hasPermission } = useAuth();

  // Form State for new container
  const [formData, setFormData] = useState({
    containerId: `NCPOR-44ISEA-C${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    category: 'Fuel',
    imdgClass: 'Class 3 (Flammable Liquid)',
    weightKg: 4500,
    destination: 'Maitri',
    tempRequirement: 'Ambient (-20°C)',
    rfidTag: `EPC-E280-1160-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const loadCargo = async () => {
    try {
      setLoading(true);
      const res = await api.getCargo();
      if (res && res.data) {
        setCargo(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch live cargo, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCargo();
  }, []);

  const handleCreateContainer = async (e) => {
    e.preventDefault();
    const newRecord = {
      ...formData,
      status: 'staged',
      location: 'Dakshin Gangotri Staging Depot',
      createdAt: new Date().toISOString()
    };

    if (!isOnline) {
      // Offline mode: queue in IndexedDB
      await queueEvent('CREATE_CARGO', newRecord);
      setCargo((prev) => [newRecord, ...prev]);
      alert('[IndexedDB Local Capture] Container saved offline! Will auto-sync when connection is restored.');
    } else {
      try {
        await api.addCargo(newRecord);
        loadCargo();
      } catch (err) {
        // Fallback to IndexedDB queue on failure
        await queueEvent('CREATE_CARGO', newRecord);
        setCargo((prev) => [newRecord, ...prev]);
        alert('[Saved to IndexedDB Queue] Backend unavailable. Recorded locally for auto-sync.');
      }
    }

    setShowAddModal(false);
  };

  const filteredCargo = cargo.filter((c) => {
    const matchesSearch =
      c.containerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.imdgClass?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="#38bdf8" />
              Expedition Cargo & Consignment Manifest
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Official 44-ISEA Containerized Cargo Registry — IMDG Classified & Cold-Chain Monitored
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => exportToCsv('44_ISEA_Cargo_Manifest', filteredCargo)}
              className="btn btn-secondary btn-sm"
              title="Download official manifest CSV for DG Shipping / MoES"
            >
              <Download size={14} /> Export CSV
            </button>

            {hasPermission('cargo:write') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Add Consignment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Container ID, Description, or IMDG Class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2rem', height: '38px', fontSize: '0.825rem' }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-select"
          style={{ width: '180px', height: '38px', fontSize: '0.825rem' }}
        >
          <option value="ALL">All Categories</option>
          <option value="Fuel">Fuel & Propellants</option>
          <option value="Scientific">Scientific Core Samples</option>
          <option value="Provisions">Rations & Medical</option>
          <option value="Heavy Machinery">Heavy Machinery Spares</option>
        </select>
      </div>

      {/* Manifest Table */}
      <div className="gov-card">
        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Container ID</th>
                <th>Consignment Description</th>
                <th>Category</th>
                <th>IMDG / Hazmat Class</th>
                <th>Cold-Chain Temp</th>
                <th>Gross Weight</th>
                <th>Destination</th>
                <th>Transit Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCargo.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {loading ? 'Accessing encrypted container manifest...' : 'No cargo matching search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCargo.map((item) => (
                  <tr key={item.containerId || item.id}>
                    <td className="mono" style={{ fontWeight: 600, color: '#38bdf8' }}>
                      {item.containerId}
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.title}</td>
                    <td>
                      <span className="badge badge-neutral">{item.category}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.775rem', color: item.imdgClass?.includes('Class') ? '#f87171' : '#94a3b8' }}>
                        {item.imdgClass || 'Non-Hazardous'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>
                      {item.tempRequirement || '-20°C Ambient'}
                    </td>
                    <td className="mono">{item.weightKg ? `${item.weightKg} kg` : '3,800 kg'}</td>
                    <td>{item.destination || 'Maitri Base'}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'in_transit'
                            ? 'badge-warning'
                            : item.status === 'secured' || item.status === 'delivered'
                            ? 'badge-success'
                            : 'badge-info'
                        }`}
                      >
                        {item.status || 'staged'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedManifest(item)}
                        className="btn btn-sm btn-secondary"
                        title="View printable GS1-128 Polar Manifest Sheet"
                      >
                        <Printer size={13} /> Label
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Container Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Register New Polar Consignment
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreateContainer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Container ID (GS1 Format)</label>
                  <input
                    type="text"
                    required
                    value={formData.containerId}
                    onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consignment Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arctic ATF-50 Fuel Drums (200L x 12)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="form-select"
                    >
                      <option value="Fuel">Fuel & Propellants</option>
                      <option value="Scientific">Scientific Core Samples</option>
                      <option value="Provisions">Provisions & Medical</option>
                      <option value="Heavy Machinery">Heavy Machinery Spares</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Station</label>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="form-select"
                    >
                      <option value="Maitri">Maitri Station Hub</option>
                      <option value="Bharati">Bharati Station Hub</option>
                      <option value="Dakshin Gangotri">Dakshin Gangotri Depot</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">IMDG Hazard Classification</label>
                    <input
                      type="text"
                      value={formData.imdgClass}
                      onChange={(e) => setFormData({ ...formData, imdgClass: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gross Tare Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable GS1-128 Polar Manifest Modal */}
      {selectedManifest && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                Polar Shipping Label & Manifest Sheet
              </h3>
              <button onClick={() => setSelectedManifest(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <div className="modal-body">
              <div className="manifest-print-sheet">
                <div style={{ borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    GOVT OF INDIA • MINISTRY OF EARTH SCIENCES • NCPOR GOA
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>
                    44-ISEA POLAR CONSIGNMENT MANIFEST
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '11px', marginBottom: '0.75rem' }}>
                  <div>
                    <div><strong>CONTAINER ID:</strong> {selectedManifest.containerId}</div>
                    <div><strong>ITEM:</strong> {selectedManifest.title}</div>
                    <div><strong>CATEGORY:</strong> {selectedManifest.category}</div>
                    <div><strong>GROSS WEIGHT:</strong> {selectedManifest.weightKg || 4200} KG</div>
                  </div>
                  <div>
                    <div><strong>DESTINATION:</strong> {selectedManifest.destination} BASE</div>
                    <div><strong>IMDG HAZMAT:</strong> {selectedManifest.imdgClass}</div>
                    <div><strong>TEMP LIMIT:</strong> {selectedManifest.tempRequirement || '-20°C'}</div>
                    <div><strong>RFID EPC:</strong> {selectedManifest.rfidTag || 'EPC-9942-01'}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #444', paddingTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '4px', fontSize: '14px', margin: '4px 0' }}>
                    ||| ||||||| ||| ||||| |||||||| ||| |||||||
                  </div>
                  <div style={{ fontSize: '9px', color: '#555' }}>
                    (01) 08901234567890 (10) {selectedManifest.containerId} (21) {selectedManifest.rfidTag || 'EPC-ANTARCTIC-44'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => window.print()} className="btn btn-primary">
                <Printer size={14} /> Print Official Label
              </button>
              <button onClick={() => setSelectedManifest(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
