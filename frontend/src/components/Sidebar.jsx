import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Package, 
  Fuel, 
  Truck, 
  Users, 
  AlertOctagon, 
  BrainCircuit, 
  QrCode, 
  ShieldCheck 
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Operational Overview', icon: LayoutDashboard },
    { id: 'gis', label: 'Geospatial Operations', icon: Map },
    { id: 'cargo', label: 'Cargo & Consignments', icon: Package },
    { id: 'inventory', label: 'Resource & Fuel Reserves', icon: Fuel },
    { id: 'assets', label: 'Vehicle & Asset Fleet', icon: Truck },
    { id: 'personnel', label: 'Personnel & Muster Roster', icon: Users },
    { id: 'incidents', label: 'Emergency & Incident SITREP', icon: AlertOctagon },
    { id: 'ai', label: 'AI Risk & Resource Engine', icon: BrainCircuit },
    { id: 'scanner', label: 'Asset Tracking (QR / RFID)', icon: QrCode },
    { id: 'security', label: 'JWT Security & RBAC Audit', icon: ShieldCheck }
  ];

  return (
    <aside className="app-sidebar">
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #1f2937' }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Navigation Portal
        </div>
        <div style={{ fontSize: '0.825rem', color: '#f8fafc', fontWeight: 600 }}>
          Antarctic Operations Desk
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* System Footer info */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1f2937', fontSize: '0.7rem', color: '#6b7280' }}>
        <div>System: POLAR-SYNC v2.4-PROD</div>
        <div>NCPOR / MoES, Govt. of India</div>
        <div style={{ color: '#10b981', marginTop: '0.2rem' }}>● Dual DB + Python ML Ready</div>
      </div>
    </aside>
  );
}
