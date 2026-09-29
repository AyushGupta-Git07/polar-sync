import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { 
  QrCode, 
  Radio, 
  Scan, 
  Search, 
  CheckCircle, 
  Package, 
  Rss, 
  RefreshCw,
  Zap
} from 'lucide-react';

export function AssetScannerView() {
  const [selectedTag, setSelectedTag] = useState('NCPOR-44ISEA-C102');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanningRfid, setScanningRfid] = useState(false);
  const [rfidHits, setRfidHits] = useState([
    { epc: 'EPC-E280-1160-2026-C101', asset: 'NCPOR-44ISEA-C101 (Winter Rations)', rssi: -52, distance: '3.2m', station: 'Maitri Depot' },
    { epc: 'EPC-E280-1160-2026-C102', asset: 'NCPOR-44ISEA-C102 (Arctic ATF-50)', rssi: -68, distance: '7.8m', station: 'En Route Convoy' },
    { epc: 'EPC-E280-1160-2026-C104', asset: 'NCPOR-44ISEA-C104 (Bio Core Samples)', rssi: -45, distance: '1.8m', station: 'Maitri Cold Bay' },
    { epc: 'EPC-E280-1160-2026-PB04', asset: 'PistenBully 300 PB-04 Polar Snowcat', rssi: -61, distance: '5.4m', station: 'Maitri Hangar' }
  ]);

  // Generate QR Code when selectedTag changes
  useEffect(() => {
    async function generateCode() {
      try {
        const payload = JSON.stringify({
          org: 'NCPOR-MoES-India',
          expedition: '44-ISEA',
          id: selectedTag,
          timestamp: new Date().toISOString()
        });
        const url = await QRCode.toDataURL(payload, {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR:', err);
      }
    }
    generateCode();
  }, [selectedTag]);

  const handleSimulateScan = async (tag) => {
    try {
      const res = await api.scanCargo({ code: tag });
      setScannedResult(res.data || {
        containerId: tag,
        title: 'Arctic ATF-50 Aviation & Snowcat Fuel',
        category: 'Fuel',
        status: 'in_transit',
        location: 'Traverse Mile 34, Schirmacher Oasis Corridor',
        imdgClass: 'Class 3 (Flammable Liquid)',
        rfidTag: 'EPC-E280-1160-2026-C102',
        tempRequirement: 'Sub-Zero Inhibited (-20°C)',
        lastScanned: new Date().toLocaleTimeString()
      });
    } catch {
      // Local demo fallback
      setScannedResult({
        containerId: tag,
        title: 'High-Purity Arctic Diesel / ATF-50 Fuel Drums',
        category: 'Fuel',
        status: 'in_transit',
        location: 'Traverse Mile 34, Schirmacher Oasis Corridor',
        imdgClass: 'Class 3 (Flammable Liquid)',
        rfidTag: 'EPC-E280-1160-2026-C102',
        tempRequirement: 'Sub-Zero Inhibited (-20°C)',
        lastScanned: new Date().toLocaleTimeString()
      });
    }
  };

  const handleSweepRfid = () => {
    setScanningRfid(true);
    setTimeout(() => {
      setScanningRfid(false);
      // Update RSSI randomly to simulate real sensor movement
      setRfidHits((prev) =>
        prev.map((item) => ({
          ...item,
          rssi: -40 - Math.floor(Math.random() * 45),
          distance: `${(1 + Math.random() * 8).toFixed(1)}m`
        }))
      );
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="#38bdf8" />
              Integrated Asset Identification: GS1 QR Code & UHF RFID Telemetry
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Dual Optical & RF Tracking Standards: ISO/IEC 18000-6C EPC Gen 2 Reader + GS1-128 2D Matrix Generator
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-info">
              RFID Frequency: 865.7 MHz (India Polar Allocation)
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Left: GS1 QR Generator & Scanner Simulator */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Scan size={16} color="#38bdf8" />
              GS1 Polar Container QR Generator & Optical Reader
            </span>
          </div>
          <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Polar Asset or Container:</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="form-select"
              >
                <option value="NCPOR-44ISEA-C101">NCPOR-44ISEA-C101 (Winter Rations)</option>
                <option value="NCPOR-44ISEA-C102">NCPOR-44ISEA-C102 (Arctic ATF-50 Fuel)</option>
                <option value="NCPOR-44ISEA-C104">NCPOR-44ISEA-C104 (Deep Bio Core Samples)</option>
                <option value="PB-04">PistenBully 300 PB-04 (Lead Convoy Snowcat)</option>
                <option value="CUMMINS-250">Cummins 250kVA Polar Genset DG-01</option>
              </select>
            </div>

            {/* QR Render Preview */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #374151', alignSelf: 'center' }}>
              {qrDataUrl && <img src={qrDataUrl} alt="GS1 Polar QR Code" style={{ display: 'block', maxWidth: '180px' }} />}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              ENCODED: GS1-128 (01) 08901234567890 (10) {selectedTag}
            </div>

            <button
              onClick={() => handleSimulateScan(selectedTag)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Scan size={15} /> Simulate Optical Barcode Scanner Read
            </button>

            {/* Scanned Tag Result Card */}
            {scannedResult && (
              <div style={{ padding: '0.85rem', backgroundColor: '#1f2937', borderRadius: '6px', border: '1px solid #374151', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    {scannedResult.containerId}
                  </div>
                  <span className="badge badge-success">VALIDATED</span>
                </div>
                <div style={{ fontSize: '0.775rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#d1d5db' }}>
                  <div><strong>Description:</strong> {scannedResult.title}</div>
                  <div><strong>Location:</strong> {scannedResult.location}</div>
                  <div><strong>Status:</strong> {scannedResult.status}</div>
                  <div><strong>IMDG Class:</strong> {scannedResult.imdgClass}</div>
                  <div><strong>RFID EPC:</strong> <span className="mono">{scannedResult.rfidTag}</span></div>
                  <div><strong>Scan Time:</strong> {scannedResult.lastScanned}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: UHF EPC Gen2 RFID Transponder Scanner */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Radio size={16} color="#fbbf24" />
              Long-Range UHF EPC Gen2 RFID Reader (Fixed Gate / Rover)
            </span>
            <button
              onClick={handleSweepRfid}
              disabled={scanningRfid}
              className="btn btn-sm btn-secondary"
            >
              <RefreshCw size={13} className={scanningRfid ? 'spin' : ''} />
              {scanningRfid ? 'Sweeping RF Field...' : 'Sweep RFID Field'}
            </button>
          </div>
          <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              Transponders actively responding in reader radiation pattern (865 MHz EPC Class 1 Gen 2):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {rfidHits.map((tag) => (
                <div
                  key={tag.epc}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#1f2937',
                    borderRadius: '4px',
                    border: '1px solid #374151',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                      {tag.epc}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: tag.rssi > -60 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: tag.rssi > -60 ? '#34d399' : '#fbbf24'
                      }}
                    >
                      <Rss size={11} /> {tag.rssi} dBm
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Asset: <strong style={{ color: '#d1d5db' }}>{tag.asset}</strong></span>
                    <span>Proximity: <strong>{tag.distance}</strong></span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    Station Portal: {tag.station} | Protocol: ISO 18000-6C
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.5rem', padding: '0.65rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '4px', fontSize: '0.75rem', color: '#fde68a' }}>
              <strong>Zero-Touch Asset Accountability:</strong> UHF tags are read simultaneously at 200 tags/sec through blizzard whiteout and ISO container walls without line-of-sight.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
