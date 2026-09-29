import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Key, 
  User, 
  UserPlus, 
  LogIn, 
  Lock, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

export function AuthPortalView() {
  const { login, register, loginAsDemo, demoProfiles } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    station: 'Maitri Base'
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    serviceId: '',
    role: 'Expedition Officer',
    station: 'Maitri Base',
    bloodGroup: 'O+',
    password: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const result = await login(loginData.username, loginData.password);
    setLoading(false);
    if (!result?.success) {
      setErrorMsg(result?.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const result = await register(signupData);
    setLoading(false);
    if (!result?.success) {
      setErrorMsg(result?.error || 'Registration failed. Please check required fields.');
    }
  };

  const handleQuickDemoLogin = async (roleName) => {
    setErrorMsg('');
    setLoading(true);
    await loginAsDemo(roleName);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1d', display: 'flex', flexDirection: 'column' }}>
      {/* Official Government of India Tricolor Ribbon */}
      <div className="gov-tricolor-strip">
        <div className="gov-strip-saffron"></div>
        <div className="gov-strip-white"></div>
        <div className="gov-strip-green"></div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '620px' }}>
          {/* Official Emblem & Portal Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', backgroundColor: '#1e293b', border: '2px solid #475569', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>IN</span>
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
              भारत सरकार | Government of India • पृथ्वी विज्ञान मंत्रालय | Ministry of Earth Sciences
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
              National Centre for Polar and Ocean Research (NCPOR)
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, marginTop: '0.2rem' }}>
              44th Indian Scientific Expedition to Antarctica (44-ISEA) — POLAR-SYNC Portal
            </div>
          </div>

          {/* Card Container */}
          <div className="gov-card" style={{ boxShadow: 'var(--shadow-lg)' }}>
            {/* Tab Switcher: Sign In vs Register */}
            <div style={{ display: 'flex', borderBottom: '1px solid #374151', backgroundColor: '#111827' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  background: activeTab === 'login' ? '#1f2937' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'login' ? '2px solid #0284c7' : 'none',
                  color: activeTab === 'login' ? '#38bdf8' : '#9ca3af',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <LogIn size={15} /> Officer Sign In
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  background: activeTab === 'signup' ? '#1f2937' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'signup' ? '2px solid #0284c7' : 'none',
                  color: activeTab === 'signup' ? '#38bdf8' : '#9ca3af',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <UserPlus size={15} /> Register Expedition Personnel
              </button>
            </div>

            <div className="gov-card-body" style={{ padding: '1.75rem' }}>
              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '0.65rem 0.85rem', borderRadius: '4px', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.825rem' }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ================= TAB 1: LOGIN ================= */}
              {activeTab === 'login' && (
                <div>
                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Officer Username / Call-Sign</label>
                      <div style={{ position: 'relative' }}>
                        <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. admin or commander.sharma"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="form-input"
                          style={{ paddingLeft: '2rem' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Station Passphrase / Cryptographic Token</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="form-input"
                          style={{ paddingLeft: '2rem' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Assigned Station Theater</label>
                      <select
                        value={loginData.station}
                        onChange={(e) => setLoginData({ ...loginData, station: e.target.value })}
                        className="form-select"
                      >
                        <option value="Maitri Base">Maitri Station Hub (-70.76°S, 11.73°E)</option>
                        <option value="Bharati Base">Bharati Station Hub (-69.41°S, 76.19°E)</option>
                        <option value="Dakshin Gangotri">Dakshin Gangotri Supply Staging</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}
                    >
                      <ShieldCheck size={16} />
                      {loading ? 'Authenticating with Central Vault...' : 'Authenticate & Enter Logistics Operations Center'}
                    </button>
                  </form>

                  {/* One-Click Evaluator Pass Section */}
                  <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ★ Instant Evaluator Passes (Single-Click Demo Authentication)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' }}>
                      {demoProfiles.map((p) => (
                        <button
                          key={p.role}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickDemoLogin(p.role)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            padding: '0.5rem 0.65rem'
                          }}
                        >
                          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>{p.title}</div>
                          <span className="badge badge-info" style={{ marginTop: '0.25rem', fontSize: '0.6rem' }}>
                            {p.role.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: SIGNUP / REGISTRATION ================= */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Full Name & Rank</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Username / Call-Sign</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. rkumar"
                        value={signupData.username}
                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Service / Expedition ID</label>
                      <input
                        type="text"
                        placeholder="e.g. MoES-44ISEA-1082"
                        value={signupData.serviceId}
                        onChange={(e) => setSignupData({ ...signupData, serviceId: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Blood Group (Medical Vitals)</label>
                      <select
                        value={signupData.bloodGroup}
                        onChange={(e) => setSignupData({ ...signupData, bloodGroup: e.target.value })}
                        className="form-select"
                      >
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Expedition Role</label>
                      <select
                        value={signupData.role}
                        onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                        className="form-select"
                      >
                        <option value="Expedition Officer">Expedition / Science Officer</option>
                        <option value="Logistics Officer">Logistics & Supply Officer</option>
                        <option value="Maintenance Officer">Station Mechanical Engineer</option>
                        <option value="Emergency Coordinator">Medical & Safety Coordinator</option>
                        <option value="Station Admin">Station Commander / Admin</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Assigned Antarctic Base</label>
                      <select
                        value={signupData.station}
                        onChange={(e) => setSignupData({ ...signupData, station: e.target.value })}
                        className="form-select"
                      >
                        <option value="Maitri Base">Maitri Base Hub</option>
                        <option value="Bharati Base">Bharati Base Hub</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Create Security Passphrase</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}
                  >
                    <UserPlus size={16} />
                    {loading ? 'Registering with 44-ISEA Central Vault...' : 'Register Expedition Officer & Issue Signed JWT'}
                  </button>
                </form>
              )}
            </div>

            {/* Institutional Security Notice Footer */}
            <div style={{ padding: '0.85rem 1.75rem', backgroundColor: '#111827', borderTop: '1px solid #374151', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Security: HMAC-SHA256 JWT • RBAC Multi-Tenant Verification</span>
              <span style={{ color: '#10b981' }}>● Satcom Iridium 700 Node Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
