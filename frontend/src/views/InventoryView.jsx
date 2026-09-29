import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../services/exportCsv';
import { Fuel, Download, Edit3, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';

export function InventoryView() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockDelta, setStockDelta] = useState(0);

  const { isOnline, queueEvent } = useOffline();
  const { hasPermission } = useAuth();

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      if (res && res.data) {
        setInventory(res.data);
      }
    } catch (err) {
      console.warn('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const changeAmount = Number(stockDelta);

    if (!isOnline) {
      // Offline: record to IndexedDB
      await queueEvent('UPDATE_STOCK', {
        id: selectedItem.id,
        name: selectedItem.name,
        change: changeAmount
      });
      // Optimistic update
      setInventory((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, currentStock: Math.max(0, item.currentStock + changeAmount) }
            : item
        )
      );
      alert('[IndexedDB Local Queue] Stock change recorded offline. Will sync automatically upon satcom reconnect.');
    } else {
      try {
        await api.updateStock(selectedItem.id, changeAmount);
        loadInventory();
      } catch (err) {
        // Fallback to offline queue
        await queueEvent('UPDATE_STOCK', {
          id: selectedItem.id,
          name: selectedItem.name,
          change: changeAmount
        });
        alert('[Saved to IndexedDB Queue] Backend unavailable. Recorded locally for auto-sync.');
      }
    }

    setSelectedItem(null);
    setStockDelta(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Fuel size={18} color="#38bdf8" />
              Sub-Zero Fuel & Critical Life-Support Stores
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-Time Polar Fuel Depletion, Daily Burn Rates, and Winter-Over Autonomy Projections
            </p>
          </div>

          <button
            onClick={() => exportToCsv('44_ISEA_Inventory_Audit', inventory)}
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="gov-card">
        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Resource / Store Item</th>
                <th>Category</th>
                <th>Station Depot</th>
                <th>Available Reserves</th>
                <th>Daily Burn Rate</th>
                <th>Autonomy Projection</th>
                <th>Buffer Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {loading ? 'Querying station fuel telemeters...' : 'No inventory records found.'}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const daysLeft = item.burnRate > 0 ? Math.floor(item.currentStock / item.burnRate) : 999;
                  const isLow = daysLeft < 45;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{item.name}</td>
                      <td>
                        <span className="badge badge-neutral">{item.category}</span>
                      </td>
                      <td>{item.station}</td>
                      <td className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {item.currentStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="mono" style={{ color: '#fbbf24' }}>
                        {item.burnRate} {item.unit}/day
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {daysLeft > 365 ? '> 1 Year' : `${daysLeft} Days`}
                      </td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                          {isLow ? 'CRITICAL BUFFER' : 'STABLE AUTONOMY'}
                        </span>
                      </td>
                      <td>
                        {hasPermission('inventory:write') && (
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setStockDelta(0);
                            }}
                            className="btn btn-sm btn-secondary"
                            title="Adjust inventory level or log fuel burn"
                          >
                            <Edit3 size={13} /> Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Adjust Reserves: {selectedItem.name}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleUpdateStock}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#1f2937', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Baseline:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                    {selectedItem.currentStock.toLocaleString()} {selectedItem.unit}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Station: {selectedItem.station} | Burn Rate: {selectedItem.burnRate} {selectedItem.unit}/day
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Stock Adjustment (+ for replenishment, - for consumption)
                  </label>
                  <input
                    type="number"
                    required
                    value={stockDelta}
                    onChange={(e) => setStockDelta(e.target.value)}
                    className="form-input"
                    placeholder="e.g. -500 or +2000"
                  />
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  New Projected Total:{' '}
                  <strong style={{ color: '#f8fafc' }}>
                    {Math.max(0, selectedItem.currentStock + Number(stockDelta)).toLocaleString()}{' '}
                    {selectedItem.unit}
                  </strong>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
