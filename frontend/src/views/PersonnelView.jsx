import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { exportToCsv } from '../services/exportCsv';
import { Users, Download, Search, HeartPulse, UserCheck, MapPin } from 'lucide-react';

export function PersonnelView() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');

  const loadPersonnel = async () => {
    try {
      setLoading(true);
      const res = await api.getPersonnel();
      if (res && res.data) {
        setPersonnel(res.data);
      }
    } catch (err) {
      console.warn('Failed to load personnel roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const filtered = personnel.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStation = stationFilter === 'ALL' || p.station === stationFilter;
    return matchesSearch && matchesStation;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#38bdf8" />
              44-ISEA Expedition Muster Roster & Personnel Vitals
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Official Station Roll Call, Field Sortie Muster, and Medical Hypothermia Triage
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-success">
              Muster: {personnel.length} / {personnel.length} Accounted For
            </span>
            <button
              onClick={() => exportToCsv('44_ISEA_Muster_Roster', filtered)}
              className="btn btn-secondary btn-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Member Name, Specialization, or Role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2rem', height: '38px', fontSize: '0.825rem' }}
          />
        </div>

        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="form-select"
          style={{ width: '180px', height: '38px', fontSize: '0.825rem' }}
        >
          <option value="ALL">All Stations</option>
          <option value="Maitri">Maitri Base (24)</option>
          <option value="Bharati">Bharati Base (22)</option>
        </select>
      </div>

      {/* Roster Table */}
      <div className="gov-card">
        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Officer / Scientist</th>
                <th>Designation / Specialization</th>
                <th>Assigned Station</th>
                <th>Blood Group</th>
                <th>Hypothermia Risk</th>
                <th>Last Satcom Check-in</th>
                <th>Muster Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {loading ? 'Accessing station personnel ledger...' : 'No personnel records matched.'}
                  </td>
                </tr>
              ) : (
                filtered.map((person) => (
                  <tr key={person.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                          {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{person.name}</span>
                      </div>
                    </td>
                    <td>{person.role || person.designation}</td>
                    <td>
                      <span className="badge badge-neutral">
                        <MapPin size={11} /> {person.station} Base
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: '#f87171' }}>
                      {person.bloodGroup || 'O+'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          person.hypothermiaRisk === 'High'
                            ? 'badge-danger'
                            : person.hypothermiaRisk === 'Monitored'
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        <HeartPulse size={11} /> {person.hypothermiaRisk || 'Nominal'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                      {person.lastCheckin || 'Today, 08:30 UTC'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          person.status === 'present'
                            ? 'badge-success'
                            : person.status === 'field_sortie'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        <UserCheck size={11} /> {person.status || 'present'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
