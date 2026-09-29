import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Views
import { DashboardView } from './views/DashboardView';
import { GISMapView } from './views/GISMapView';
import { CargoView } from './views/CargoView';
import { InventoryView } from './views/InventoryView';
import { AssetsView } from './views/AssetsView';
import { PersonnelView } from './views/PersonnelView';
import { IncidentView } from './views/IncidentView';
import { AiDecisionView } from './views/AiDecisionView';
import { AssetScannerView } from './views/AssetScannerView';
import { SecurityView } from './views/SecurityView';
import { AuthPortalView } from './views/AuthPortalView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeStation, setActiveStation] = useState('Maitri');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { user, loading, loginAsDemo, demoProfiles } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>NCPOR POLAR-SYNC</div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Initializing encrypted session vault...</div>
        </div>
      </div>
    );
  }

  // If no officer authenticated, present official Login / Registration Portal
  if (!user) {
    return <AuthPortalView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView activeStation={activeStation} onNavigate={setCurrentTab} />;
      case 'gis':
        return <GISMapView activeStation={activeStation} />;
      case 'cargo':
        return <CargoView />;
      case 'inventory':
        return <InventoryView />;
      case 'assets':
        return <AssetsView />;
      case 'personnel':
        return <PersonnelView />;
      case 'incidents':
        return <IncidentView />;
      case 'ai':
        return <AiDecisionView />;
      case 'scanner':
        return <AssetScannerView />;
      case 'security':
        return <SecurityView />;
      default:
        return <DashboardView activeStation={activeStation} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <Header
        activeStation={activeStation}
        setActiveStation={setActiveStation}
        onOpenSecurityModal={() => setCurrentTab('security')}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      <div className="app-body">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="main-viewport">
          {renderActiveView()}
        </main>
      </div>

      {/* Quick Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Select Active Polar Officer Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Select an authentic 44-ISEA operational persona to test role-based access control (RBAC):
              </p>
              {demoProfiles.map((p) => (
                <div
                  key={p.role}
                  onClick={() => {
                    loginAsDemo(p.role);
                    setShowProfileModal(false);
                  }}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: user?.role === p.role ? 'rgba(2, 132, 199, 0.2)' : '#1f2937',
                    border: `1px solid ${user?.role === p.role ? '#0284c7' : '#374151'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.title} • {p.station} Base</div>
                  </div>
                  <span className="badge badge-info">{p.role.toUpperCase()}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowProfileModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <AppContent />
      </OfflineProvider>
    </AuthProvider>
  );
}
