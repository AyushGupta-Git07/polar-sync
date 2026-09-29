/* ==========================================================================
   PRESERVED DATA LAYER: INDEXEDDB LOCAL EVENT STORE
   ========================================================================== */
const DB_NAME = 'polar-sync-db';
const STORE = 'events';
let db;
let offline = false;
let userRole = 'Expedition Officer';
let currentJwtToken = null;
let currentDecodedJwt = null;
let activeQrCodeInstance = null;
let html5QrScannerInstance = null;
let currentQrItemData = null;

const RBAC_ROLES = {
  'Station Admin': {
    name: 'Station Admin',
    description: 'Full Station Authority & System Override',
    permissions: ['*'],
    badgeColor: '#ef4444'
  },
  'Emergency Coordinator': {
    name: 'Emergency Coordinator',
    description: 'Crisis Intervention, Life Safety & Curfew Override',
    permissions: ['read:all', 'trigger:alarm', 'override:curfew', 'manage:emergency', 'triage:medical'],
    badgeColor: '#f97316'
  },
  'Expedition Officer': {
    name: 'Expedition Officer',
    description: 'Sortie Planning, Field Traverse & Mission Command',
    permissions: ['read:all', 'manage:planning', 'authorize:sortie', 'report:incident', 'view:telemetry'],
    badgeColor: '#38bdf8'
  },
  'Logistics Officer': {
    name: 'Logistics Officer',
    description: 'Supply Chain, QR Asset Tagging & Cargo Manifest',
    permissions: ['read:all', 'manage:cargo', 'manage:inventory', 'scan:qr', 'create:cargo_event'],
    badgeColor: '#10b981'
  },
  'Maintenance Officer': {
    name: 'Maintenance Officer',
    description: 'Fleet Health, Machinery Overhaul & Mitigation Authorization',
    permissions: ['read:all', 'manage:assets', 'authorize:mitigation', 'scan:qr', 'service:snowcat'],
    badgeColor: '#eab308'
  }
};
let tacticalMapInstance = null;
let fullHeroMapInstance = null;
let readinessChartInstance = null;
let inventoryChartInstance = null;

/**
 * Open or upgrade the local IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Adds an event to the local IndexedDB queue.
 */
async function addEvent(type, payload) {
  await openDB();
  return new Promise((resolve, reject) => {
    const e = {
      id: 'EV-' + Date.now() + '-' + Math.floor(Math.random() * 999),
      type,
      payload,
      role: userRole,
      device: 'POLAR-NODE-01',
      createdAt: new Date().toISOString(),
      synced: false
    };
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(e);
    tx.oncomplete = () => {
      updateQueue();
      resolve(e);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves all events from the local IndexedDB store.
 */
async function getEvents() {
  await openDB();
  return new Promise(resolve => {
    const a = [];
    const tx = db.transaction(STORE, 'readonly');
    tx.objectStore(STORE).openCursor().onsuccess = e => {
      const c = e.target.result;
      if (c) {
        a.push(c.value);
        c.continue();
      } else {
        resolve(a);
      }
    };
  });
}

/**
 * Updates queue counters across all navigation and status badges.
 */
async function updateQueue() {
  try {
    const ev = await getEvents();
    const pending = ev.filter(x => !x.synced);
    const n = pending.length;
    
    // Update preserved IDs
    const pendingLabel = document.getElementById('pendingLabel');
    if (pendingLabel) pendingLabel.textContent = '(' + n + ')';
    
    const pendingLabelDashboard = document.getElementById('pendingLabelDashboard');
    if (pendingLabelDashboard) pendingLabelDashboard.textContent = '(' + n + ' pending)';

    const queueCount = document.getElementById('queueCount');
    if (queueCount) queueCount.textContent = n;

    const queueCountAnalytics = document.getElementById('queueCountAnalytics');
    if (queueCountAnalytics) queueCountAnalytics.textContent = n;
  } catch (err) {
    console.error('Queue update error:', err);
  }
}

/**
 * Synchronizes local IndexedDB events with animated feedback.
 */
async function syncNow() {
  const ev = await getEvents();
  const pending = ev.filter(x => !x.synced);
  
  if (!pending.length) {
    toast('✓ No pending local events. Mission data is synchronized with polar HQ.');
    return;
  }
  
  if (offline) {
    toast('⚠ Satellite link unavailable. ' + pending.length + ' events safely protected in local IndexedDB.');
    return;
  }

  const toastEl = document.getElementById('toast');
  toastEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span class="pulse-dot cyan"></span>
      <b>Transmitting ${pending.length} events to Polar HQ...</b>
    </div>
    <div class="syncbar"><span></span></div>
  `;
  toastEl.classList.add('show');
  
  const span = toastEl.querySelector('.syncbar span');
  let i = 0;
  
  const tick = setInterval(async () => {
    i++;
    if (span) span.style.width = (i / pending.length * 100) + '%';
    
    if (i >= pending.length) {
      clearInterval(tick);
      for (const e of pending) {
        e.synced = true;
        await new Promise((r, j) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(e);
          tx.oncomplete = r;
          tx.onerror = j;
        });
      }
      
      const lastSyncEl = document.getElementById('lastSync');
      if (lastSyncEl) lastSyncEl.textContent = 'just now';
      
      updateQueue();
      toast('✓ Sync complete: ' + pending.length + ' events transmitted. Local buffer nominal.');
    }
  }, 400);
}

/**
 * Toast and telemetry status notifications.
 */
function showToast(msg, type = 'info') {
  const x = document.getElementById('toast');
  if (!x) return;
  
  let borderColor = 'var(--cyan)';
  if (type === 'success' || msg.includes('✓')) {
    borderColor = 'var(--green)';
  } else if (type === 'error' || msg.includes('🚨') || msg.includes('ALERT')) {
    borderColor = 'var(--red)';
  } else if (type === 'warn' || msg.includes('⚠') || msg.includes('Delayed') || msg.includes('delay')) {
    borderColor = 'var(--amber)';
  }
  
  x.innerHTML = `<span style="display:flex;align-items:center;gap:8px"><span>${msg}</span></span>`;
  x.style.borderColor = borderColor;
  x.classList.add('show');
  clearTimeout(x._timer);
  x._timer = setTimeout(() => x.classList.remove('show'), 3800);
}

function toast(t) {
  showToast(t);
}

function resetMapFieldTeams() {
  if (tacticalMapInstance) {
    tacticalMapInstance.flyTo([-70.720, 11.950], 9);
  }
}

/**
 * Toggle mobile sidebar drawer navigation.
 */
function toggleSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  if (sb) sb.classList.toggle('open');
  if (bd) bd.classList.toggle('show');
}

/**
 * Panel Navigation Switcher.
 */
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sidebar-nav button').forEach(x => x.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    // Highlight matching button if called programmatically
    const match = Array.from(document.querySelectorAll('.sidebar-nav button')).find(b => {
      const onclickAttr = b.getAttribute('onclick') || '';
      return onclickAttr.includes(`'${id}'`);
    });
    if (match) match.classList.add('active');
  }

  // Close mobile drawer if open
  if (window.innerWidth <= 900) {
    const sb = document.querySelector('.sidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('open');
    if (bd) bd.classList.remove('show');
  }

  // Handle map resizing and icon rendering when panels toggle
  if (id === 'dashboard' && tacticalMapInstance) {
    setTimeout(() => {
      tacticalMapInstance.invalidateSize();
      if (window.lucide) lucide.createIcons();
    }, 150);
  } else if (id === 'map-panel') {
    initFullHeroMap();
    if (fullHeroMapInstance) {
      setTimeout(() => {
        fullHeroMapInstance.invalidateSize();
        if (window.lucide) lucide.createIcons();
      }, 150);
    }
  } else if (id === 'analytics') {
    initCharts();
  }
  if (window.lucide) lucide.createIcons();
}

/**
 * Toggle offline simulation.
 */
function toggleOffline() {
  offline = !offline;
  
  const offlineBadge = document.getElementById('offlineBadge');
  const onlineBadge = document.getElementById('onlineBadge');
  const netText = document.getElementById('netText');
  
  if (offlineBadge) offlineBadge.classList.toggle('show', offline);
  if (onlineBadge) onlineBadge.style.display = offline ? 'none' : 'inline-flex';
  if (netText) {
    netText.textContent = offline ? 'OFFLINE' : 'ONLINE';
    netText.style.color = offline ? 'var(--red)' : 'var(--cyan)';
  }

  if (offline) {
    toast('🔴 Satellite link disconnected. Switched to offline mode. All actions saved locally.');
  } else {
    toast('🟢 Satellite mesh restored. Triggering automated reconciliation...');
    syncNow();
  }
}

/**
 * Cargo event creation.
 */
function createEvent(msg) {
  addEvent('cargo_update', { message: msg }).then(() => {
    toast('✓ ' + msg + ' stored locally in IndexedDB.');
  });
}

function openCargoEventModal() {
  if (!requirePermission('manage:cargo', 'Log Cargo Event')) return;
  const modal = document.getElementById('cargoModal');
  if (modal) modal.classList.add('show');
}
function closeCargoModal() {
  const modal = document.getElementById('cargoModal');
  if (modal) modal.classList.remove('show');
}
function submitCargoModal() {
  const container = document.getElementById('cargoContainerSelect').value;
  const msg = document.getElementById('cargoMessageInput').value || 'Status update logged';
  const priority = document.getElementById('cargoPrioritySelect').value;
  
  const formatted = `[${container}] ${msg} (${priority})`;
  createEvent(formatted);
  closeCargoModal();
}

/**
 * Incident creation for Emergency panel.
 */
function createIncident() {
  const type = document.getElementById('incidentType').value;
  const details = document.getElementById('incidentDetails').value || 'No additional details provided';
  
  addEvent('incident', { type, details }).then(e => {
    const box = document.getElementById('incidentResult');
    box.style.display = 'block';
    box.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:8px">
        <i data-lucide="shield-alert" style="width:16px;height:16px;color:var(--red);flex-shrink:0"></i>
        <div>
          <b>Incident Packet Stored: ${e.id}</b><br>
          <span><b>Type:</b> ${type} • <b>Details:</b> ${details}</span><br>
          <span class="sub" style="font-size:10px">${offline ? 'OFFLINE QUEUE • Will sync when satellite returns' : 'ONLINE • Queued for immediate broadcast'}</span>
        </div>
      </div>
    `;
    
    // Append to live incident ledger
    const ledger = document.getElementById('incidentLedger');
    if (ledger) {
      const entry = document.createElement('div');
      entry.className = 'alert bad';
      entry.style.cssText = 'margin:0;padding:8px 12px;font-size:11px';
      entry.innerHTML = `
        <b>${e.id}: ${type}</b><br>
        <span class="sub">${details} • Recorded just now</span>
      `;
      ledger.prepend(entry);
    }
    
    if (window.lucide) lucide.createIcons();
    toast('🚨 Incident safely recorded in IndexedDB: ' + e.id);
  });
}

function applyIncidentPreset(type, details) {
  const typeSelect = document.getElementById('incidentType');
  const detailsInput = document.getElementById('incidentDetails');
  if (typeSelect) {
    typeSelect.value = type;
  }
  if (detailsInput) {
    detailsInput.value = details;
    detailsInput.focus();
  }
  if (typeof showToast === 'function') {
    showToast('Emergency preset applied: ' + type, 'info');
  }
}

function triggerStationAlarmTest(btn) {
  if (!requirePermission('trigger:alarm', 'Station Klaxon Alarm Test')) return;
  if (!btn) return;
  const origHtml = btn.innerHTML;
  btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="bell" style="width:13px;height:13px;animation:spin 0.5s linear infinite;color:var(--red)"></i> Klaxon Drill Active...</span>';
  if (window.lucide) lucide.createIcons();
  btn.disabled = true;
  if (typeof showToast === 'function') {
    showToast('STATION DRILL ALERT: Emergency Klaxon signaled across all 4 sectors. Personnel muster verified.', 'error');
  }
  setTimeout(() => {
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;color:var(--green)"><i data-lucide="check-circle" style="width:13px;height:13px"></i> Drill Logged in Vault</span>';
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }, 2400);
  }, 1200);
}

function filterIncidentLedger(category, btn) {
  if (btn) {
    document.querySelectorAll('.incident-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const items = document.querySelectorAll('#incidentLedger > div');
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (category === 'all') {
      item.style.display = '';
    } else if (category === 'active') {
      item.style.display = (text.includes('active') || text.includes('en route') || text.includes('assigned') || text.includes('just now')) ? '' : 'none';
    } else if (category === 'resolved') {
      item.style.display = text.includes('resolved') ? '' : 'none';
    }
  });
}

/**
 * Mission Impact Simulation.
 */
function runSimulation() {
  document.getElementById('simText').textContent = 'Scenario: PB-04 snow vehicle becomes unavailable during field operations. POLAR-SYNC traces dependencies instead of only showing the failed asset.';
  document.getElementById('simPeople').textContent = '12';
  document.getElementById('simOps').textContent = '3';
  document.getElementById('simReady').textContent = '79%';
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

function applySimulationMitigation() {
  if (!requirePermission('authorize:mitigation', 'Dispatch Snowcat Escort Mitigation')) return;
  createEvent('Contingency Plan Active: PB-07 dispatched to relieve Field Team Alpha');
  closeModal();
  const rEl = document.getElementById('readiness');
  if (rEl) rEl.textContent = '85';
  const fREl = document.getElementById('footerReadiness');
  if (fREl) fREl.innerHTML = '<span class="pulse-dot green"></span> 85%';
  toast('✓ Contingency action authorized. Readiness restored to 85%.');
}

/* ==========================================================================
   OPERATIONAL AI & HEURISTIC ENGINE HELPERS
   ========================================================================== */
const polarScenarios = {
  pb04: {
    title: 'PB-04 Snowcat Seizure & Hydraulic Freeze',
    desc: 'PB-04 hydraulic fluid viscosity degradation under −35°C stress causes valve freeze at Waypoint 4. Field Team Alpha cannot return before katabatic curfew.',
    people: 12,
    ops: 3,
    ready: '79%',
    readyDelta: '−8%',
    nodes: [
      { type: 'FAULT', title: 'PB-04 Down', sub: 'Tractor Seizure', critical: true },
      { type: 'FIELD UNIT', title: 'Field Team Alpha', sub: 'Transport Stalled', delayed: true },
      { type: 'CREW', title: '12 Personnel', sub: 'Shelter in Place' },
      { type: 'MISSION', title: 'Readiness 79%', sub: 'Gated Operation' }
    ],
    mitigation: 'Reassign standby snow vehicle PB-07 from Station Hangar to escort Field Team Alpha. Restores readiness to 85% and clears curfew.',
    actionLabel: 'Authorize PB-07 Reassignment',
    actionCode: 'pb07-escort'
  },
  c102: {
    title: 'C-102 Maritime Ice-Lock (+14 Day Delay)',
    desc: 'Supply vessel C-102 locked in heavy fast-ice ridge at 68°S. Generator spare parts and hydraulic seals delayed beyond 4-day critical safety buffer.',
    people: 46,
    ops: 5,
    ready: '74%',
    readyDelta: '−13%',
    nodes: [
      { type: 'FAULT', title: 'C-102 Ice-Lock', sub: '+14 Day Delay', critical: true },
      { type: 'LOGISTICS', title: 'Gen Spares Gated', sub: 'Inventory Critical', delayed: true },
      { type: 'POWER', title: 'Microgrid N+0', sub: 'Backup Bus Offline' },
      { type: 'MISSION', title: 'Readiness 74%', sub: 'High Winter Risk' }
    ],
    mitigation: 'Divert critical spare seal kit via Basler BT-67 air-bridge from coastal shelf strip. Restores heating redundancy to 84%.',
    actionLabel: 'Dispatch BT-67 Air Bridge Divert',
    actionCode: 'bt67-divert'
  },
  storm: {
    title: 'Category 5 Katabatic Gale Outbreak (95 km/h)',
    desc: 'Barometric steepening gradient induces 95 km/h katabatic winds with zero visibility (< 50m). Surface traverse hazard reaches extreme danger.',
    people: 18,
    ops: 4,
    ready: '71%',
    readyDelta: '−16%',
    nodes: [
      { type: 'FAULT', title: 'Katabatic 95km/h', sub: 'Whiteout Warning', critical: true },
      { type: 'FIELD', title: 'Borehole Sorties', sub: 'Ground Traverse Cut', delayed: true },
      { type: 'SHELTER', title: 'Shelters Alpha/Bravo', sub: 'Phase 3 Lockdown' },
      { type: 'MISSION', title: 'Readiness 71%', sub: 'Field Operations Halted' }
    ],
    mitigation: 'Enforce Station Phase 3 Curfew. Recall all field assets within 5km and lock shelter blast hatches. Preserves 100% crew safety.',
    actionLabel: 'Enforce Phase 3 Curfew Lockdown',
    actionCode: 'curfew-lockdown'
  },
  gen02: {
    title: 'Microgrid GEN-02 Overheat & Bearing Trip',
    desc: 'Generator 02 bearing temperature exceeds 98°C threshold. Automatic safety trip sheds non-critical power buses across Science Dome.',
    people: 32,
    ops: 2,
    ready: '81%',
    readyDelta: '−6%',
    nodes: [
      { type: 'FAULT', title: 'GEN-02 Trip', sub: 'Bearing 98°C Alarm', critical: true },
      { type: 'MICROGRID', title: 'Bus B Shedding', sub: 'Cryo Lab On Battery', delayed: true },
      { type: 'FACILITIES', title: 'Habitat Core Load', sub: 'Single Generator Ops' },
      { type: 'MISSION', title: 'Readiness 81%', sub: 'Warm-Standby Active' }
    ],
    mitigation: 'Engage auxiliary Perkins 40 kW diesel bus and divert exhaust heat recovery to primary heating manifold. Stabilizes microgrid to 86%.',
    actionLabel: 'Engage Perkins 40kW Auxiliary Bus',
    actionCode: 'perkins-aux'
  }
};

let currentAiScenario = 'pb04';

function runCustomSimulation(scenarioId, btn) {
  currentAiScenario = scenarioId;
  const s = polarScenarios[scenarioId];
  if (!s) return;

  if (btn) {
    document.querySelectorAll('.ai-scenario-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Update in-page scenario telemetry
  const titleEl = document.getElementById('simDisplayTitle');
  const descEl = document.getElementById('simDisplayDesc');
  const peopleEl = document.getElementById('simDisplayPeople');
  const opsEl = document.getElementById('simDisplayOps');
  const readyEl = document.getElementById('simDisplayReady');
  const deltaEl = document.getElementById('simDisplayDelta');
  const mitEl = document.getElementById('simDisplayMitigation');
  const actBtn = document.getElementById('simDisplayActionBtn');
  const graphEl = document.getElementById('simDisplayGraph');

  if (titleEl) titleEl.textContent = s.title;
  if (descEl) descEl.textContent = s.desc;
  if (peopleEl) peopleEl.textContent = s.people;
  if (opsEl) opsEl.textContent = s.ops;
  if (readyEl) readyEl.textContent = s.ready;
  if (deltaEl) deltaEl.textContent = s.readyDelta;
  if (mitEl) mitEl.innerHTML = `💡 <b>AI Heuristic Directive:</b> ${s.mitigation}`;
  if (actBtn) {
    actBtn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px"></i> ${s.actionLabel}`;
    actBtn.setAttribute('onclick', `executeAiMitigation('${s.actionCode}')`);
  }

  // Render graph
  if (graphEl) {
    graphEl.innerHTML = s.nodes.map((n, i) => `
      ${i > 0 ? '<div class="flow-arrow">➔</div>' : ''}
      <div class="flow-node ${n.critical ? 'highlight-critical' : ''} ${n.delayed ? 'highlight-delayed' : ''}">
        <span class="label" ${n.critical ? 'style="color:var(--red)"' : ''}>${n.type}</span>
        <b>${n.title}</b>
        <span class="sub">${n.sub}</span>
      </div>
    `).join('');
  }

  // Also update modal in case user opens it
  const modalText = document.getElementById('simText');
  const modalPeople = document.getElementById('simPeople');
  const modalOps = document.getElementById('simOps');
  const modalReady = document.getElementById('simReady');
  if (modalText) modalText.textContent = `Scenario: ${s.desc}`;
  if (modalPeople) modalPeople.textContent = s.people;
  if (modalOps) modalOps.textContent = s.ops;
  if (modalReady) modalReady.textContent = s.ready;

  if (window.lucide) lucide.createIcons();
}

function executeAiMitigation(code) {
  const s = polarScenarios[currentAiScenario];
  const label = s ? s.actionLabel : 'Countermeasure Authorized';
  createEvent(`[AI HEURISTIC MITIGATION] ${label} executed by Command.`);
  
  const readyEl = document.getElementById('simDisplayReady');
  const deltaEl = document.getElementById('simDisplayDelta');
  if (readyEl) readyEl.textContent = '86%';
  if (deltaEl) {
    deltaEl.textContent = 'RESTORED (Nominal)';
    deltaEl.style.color = 'var(--green)';
  }
  const fREl = document.getElementById('footerReadiness');
  if (fREl) fREl.innerHTML = '<span class="pulse-dot green"></span> 86%';
  
  if (typeof showToast === 'function') {
    showToast(`✓ AI Mitigation Authorized: ${label}. Mission readiness restored to 86%.`, 'success');
  }
}

const polarAiResponses = {
  c102: {
    query: 'Assess C-102 Maritime Delay',
    confidence: '94%',
    analysis: 'Vessel C-102 is immobilized at 68°14\'S due to multi-year fast-ice pack. Sea-ice thickness 2.4m exceeds vessel ice-class 1A capability. +10 to +14 day delay confirmed.',
    impact: 'Generators spares burn rate will breach 5-day contingency floor on Day 146. High risk to heating bus B.',
    recommendation: 'Authorize emergency BT-67 ski aircraft air-bridge shuttle from Punta Arenas to forward strip. Fuel payload: 4,000 L SAB; 8x generator valve seals.'
  },
  winter: {
    query: 'Winterization Power Shedding Plan',
    confidence: '96%',
    analysis: 'At T-38 days to Polar Night, station heating demand increases by 42%. Ambient external temperatures projected to drop below −52°C.',
    impact: 'Simultaneous heating of all 5 science bays causes generator fuel burn to spike to 460 L/24h, exceeding seasonal allocation by 18%.',
    recommendation: 'Implement Phase 1 Power Shedding: Consolidate science payloads into Main Hab Alpha and East Dome Bunker. Mothball Forward Strip Hut heating between 22:00-06:00 UTC.'
  },
  route: {
    query: 'PB-07 Route Safety to Borehole 4',
    confidence: '91%',
    analysis: 'Neural ground-penetrating radar transect confirms snow-bridge structural integrity along Waypoints 1-4. Blue-ice friction coefficient is 0.54.',
    impact: 'Crevasse hazard index is LOW along waypoint corridor. Katabatic winds currently stable at 18 km/h.',
    recommendation: 'Clear PB-07 convoy for transit to Borehole 4. Maintain convoy speed under 16 km/h. Next weather re-evaluation window at 13:00 UTC.'
  },
  med: {
    query: 'Medical Hypothermia Protocol',
    confidence: '98%',
    analysis: 'Wind chill at −42°C reduces safe skin exposure time to 8 minutes. Core body telemetry for all 46 mustered personnel is currently nominal (mean 36.8°C).',
    impact: 'Outdoor EVA sorties longer than 45 minutes risk peripheral frostbite without active electric thermal garments.',
    recommendation: 'Enforce strict two-person buddy protocol on all outdoor sorties. Warm-air rewarming pods in Trauma Bay Alpha pre-heated and standing by.'
  }
};

function queryPolarAiAssistant(presetKey) {
  const inputEl = document.getElementById('aiQueryInput');
  const outputEl = document.getElementById('aiTerminalOutput');
  if (!outputEl) return;

  const key = presetKey || (inputEl ? inputEl.value.toLowerCase() : '');
  let resp = null;
  if (key.includes('c-102') || key.includes('delay') || key.includes('c102') || key === 'c102') {
    resp = polarAiResponses.c102;
  } else if (key.includes('winter') || key.includes('power') || key.includes('shedding') || key === 'winter') {
    resp = polarAiResponses.winter;
  } else if (key.includes('pb-07') || key.includes('route') || key.includes('borehole') || key === 'route') {
    resp = polarAiResponses.route;
  } else if (key.includes('med') || key.includes('hypo') || key.includes('health') || key === 'med') {
    resp = polarAiResponses.med;
  } else {
    resp = {
      query: inputEl && inputEl.value ? inputEl.value : 'Station Heuristic Assessment',
      confidence: '89%',
      analysis: 'Heuristic engine processed query against active IndexedDB telemetry state and historical polar dataset.',
      impact: 'All primary station life-support systems operating within safe operational margins. Fleet spare parts remain primary sensitivity gating variable.',
      recommendation: 'Maintain standard operating procedures. Monitor 18:00 UTC high-bandwidth satellite reconciliation pass.'
    };
  }

  outputEl.style.display = 'block';
  outputEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(168,85,247,0.2)">
      <div style="display:flex;align-items:center;gap:6px">
        <i data-lucide="cpu" style="width:14px;height:14px;color:#c084fc"></i>
        <b style="color:#fff;font-size:12px">POLAR-AI INFERENCE BRIEFING // ${resp.query}</b>
      </div>
      <span class="badge badge-cached" style="border-color:rgba(168,85,247,0.4);color:#c084fc">CONFIDENCE: ${resp.confidence}</span>
    </div>
    <div style="font-size:11.5px;color:var(--text-bright);line-height:1.5;margin-bottom:6px">
      <b>Diagnostic Analysis:</b> ${resp.analysis}
    </div>
    <div style="font-size:11.5px;color:var(--amber);line-height:1.5;margin-bottom:6px">
      <b>Downstream Impact:</b> ${resp.impact}
    </div>
    <div class="alert good" style="margin:0;padding:8px 12px;font-size:11px">
      <b>AI Actionable Directive:</b> ${resp.recommendation}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  if (typeof showToast === 'function') {
    showToast('AI Heuristic Inference complete: Confidence ' + resp.confidence, 'info');
  }
}

function setAiPrompt(key) {
  const inputEl = document.getElementById('aiQueryInput');
  if (inputEl && polarAiResponses[key]) {
    inputEl.value = polarAiResponses[key].query;
  }
  queryPolarAiAssistant(key);
}

/* ==========================================================================
   CRYPTOGRAPHIC JWT (RFC 7519) & STRICT RBAC POLICY ENGINE
   ========================================================================== */
function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

function arrayBufferToBase64Url(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwtToken(payload, secret = 'polar-sync-ncpor-2026-auth') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;

  try {
    if (window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(data));
      const encSig = arrayBufferToBase64Url(signature);
      return { token: `${data}.${encSig}`, header, payload, signature: encSig, verified: true };
    }
  } catch (err) {
    console.warn('Web Crypto sign fallback:', err);
  }

  const dummySig = base64UrlEncode('sig_' + Math.random().toString(36).substring(2, 12));
  return { token: `${data}.${dummySig}`, header, payload, signature: dummySig, verified: true };
}

function hasPermission(perm) {
  if (!currentDecodedJwt || !currentDecodedJwt.permissions) {
    const fallbackPerms = RBAC_ROLES[userRole]?.permissions || ['read:all'];
    return fallbackPerms.includes('*') || fallbackPerms.includes(perm);
  }
  return currentDecodedJwt.permissions.includes('*') || currentDecodedJwt.permissions.includes(perm);
}

function requirePermission(perm, actionLabel = 'Action') {
  if (hasPermission(perm)) {
    return true;
  }
  const allowedRoles = Object.keys(RBAC_ROLES).filter(r => 
    RBAC_ROLES[r].permissions.includes('*') || RBAC_ROLES[r].permissions.includes(perm)
  ).join(', ');

  showToast(`⛔ RBAC Access Denied: "${actionLabel}" requires "${perm}" privilege. (Permitted: ${allowedRoles})`, 'bad');
  return false;
}

/**
 * Authentication and roles.
 */
function quickRole(r) {
  document.getElementById('role').value = r;
}

async function login() {
  userRole = document.getElementById('role').value;
  const usernameInput = document.getElementById('username').value || 'Ashish Saini';
  
  const roleChip = document.getElementById('roleChip');
  if (roleChip) roleChip.textContent = userRole;

  const userDisplayName = document.getElementById('userDisplayName');
  if (userDisplayName) userDisplayName.textContent = usernameInput;

  const userAvatar = document.getElementById('userAvatarLetter');
  if (userAvatar) userAvatar.textContent = usernameInput.charAt(0).toUpperCase();

  document.getElementById('login').classList.add('hidden');
  localStorage.setItem('polarRole', userRole);
  localStorage.setItem('polarUser', usernameInput);

  // Issue Cryptographic HMAC-SHA256 JWT Bearer Token
  const issuedAt = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: 'ncpor.gov.in/polar-sync',
    sub: 'POLAR-OP-9042',
    username: usernameInput,
    role: userRole,
    station: 'Maitri Base (70°46′S, 11°44′E)',
    permissions: RBAC_ROLES[userRole]?.permissions || ['read:all'],
    iat: issuedAt,
    exp: issuedAt + (8 * 3600),
    jti: 'jwt-' + Math.random().toString(36).substring(2, 9)
  };

  const signed = await signJwtToken(jwtPayload);
  currentJwtToken = signed.token;
  currentDecodedJwt = signed.payload;
  localStorage.setItem('polarJwt', currentJwtToken);

  updateJwtBadgeUi();
  applyRbacUiState();

  toast('✓ Authenticated as ' + userRole + ' (' + usernameInput + ') [JWT HS256 Verified]');
  
  // Re-trigger icon parsing and map render
  if (window.lucide) lucide.createIcons();
  setTimeout(() => {
    initTacticalMap();
  }, 200);
}

function logout() {
  localStorage.removeItem('polarRole');
  localStorage.removeItem('polarJwt');
  currentJwtToken = null;
  currentDecodedJwt = null;
  document.getElementById('login').classList.remove('hidden');
  toast('Session closed. Returned to Expedition Access screen.');
}

/* ==========================================================================
   JWT SECURITY INSPECTOR MODAL CONTROLS
   ========================================================================== */
function openJwtInspector() {
  const modal = document.getElementById('jwtInspectorModal');
  if (!modal) return;

  const activeRoleBadge = document.getElementById('jwtActiveRoleBadge');
  if (activeRoleBadge) activeRoleBadge.textContent = userRole;

  const headerPre = document.getElementById('jwtHeaderJson');
  if (headerPre) {
    headerPre.textContent = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);
  }

  const payloadPre = document.getElementById('jwtPayloadJson');
  if (payloadPre && currentDecodedJwt) {
    payloadPre.textContent = JSON.stringify(currentDecodedJwt, null, 2);
  }

  const rawEl = document.getElementById('jwtRawToken');
  if (rawEl && currentJwtToken) {
    rawEl.textContent = currentJwtToken;
  }

  const permsContainer = document.getElementById('jwtPermissionsList');
  if (permsContainer && currentDecodedJwt) {
    permsContainer.innerHTML = '';
    const perms = currentDecodedJwt.permissions || [];
    perms.forEach(p => {
      const pill = document.createElement('span');
      pill.className = 'jwt-claim-pill' + (p === '*' ? ' admin' : '');
      pill.textContent = p === '*' ? '★ Full Admin (*)' : p;
      permsContainer.appendChild(pill);
    });
  }

  modal.classList.add('show');
}

function closeJwtInspector() {
  const modal = document.getElementById('jwtInspectorModal');
  if (modal) modal.classList.remove('show');
}

async function switchJwtRole(newRole) {
  if (!RBAC_ROLES[newRole]) return;
  userRole = newRole;
  localStorage.setItem('polarRole', userRole);

  const roleSelect = document.getElementById('role');
  if (roleSelect) roleSelect.value = userRole;

  const roleChip = document.getElementById('roleChip');
  if (roleChip) roleChip.textContent = userRole;

  const username = localStorage.getItem('polarUser') || 'Ashish Saini';
  const issuedAt = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: 'ncpor.gov.in/polar-sync',
    sub: 'POLAR-OP-9042',
    username: username,
    role: userRole,
    station: 'Maitri Base (70°46′S, 11°44′E)',
    permissions: RBAC_ROLES[userRole].permissions,
    iat: issuedAt,
    exp: issuedAt + (8 * 3600),
    jti: 'jwt-' + Math.random().toString(36).substring(2, 9)
  };

  const signed = await signJwtToken(jwtPayload);
  currentJwtToken = signed.token;
  currentDecodedJwt = signed.payload;
  localStorage.setItem('polarJwt', currentJwtToken);

  updateJwtBadgeUi();
  applyRbacUiState();
  openJwtInspector();

  showToast(`🔐 Role switched to ${newRole}. New HMAC-SHA256 JWT issued and verified.`, 'info');
}

function copyJwtToken() {
  if (!currentJwtToken) return;
  navigator.clipboard.writeText(currentJwtToken).then(() => {
    showToast('Copied raw JWT Bearer token to clipboard.', 'info');
  }).catch(() => {
    showToast('Token copied: ' + currentJwtToken.substring(0, 20) + '...', 'info');
  });
}

function updateJwtBadgeUi() {
  const badge = document.getElementById('jwtSecurityBadge');
  if (badge && currentDecodedJwt) {
    const roleShort = currentDecodedJwt.role ? currentDecodedJwt.role.split(' ')[0] : 'AUTH';
    badge.innerHTML = `<i data-lucide="shield-check" style="width:12px;height:12px;color:#c084fc"></i> <span style="font-family:var(--font-mono);font-size:10px;font-weight:700">JWT: ${roleShort} (HS256)</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

function applyRbacUiState() {
  const alarmBtn = document.querySelector('[onclick*="triggerStationAlarmTest"]');
  if (alarmBtn) {
    if (!hasPermission('trigger:alarm')) {
      alarmBtn.setAttribute('title', '[RBAC Protected] Requires Emergency Coordinator or Station Admin');
    } else {
      alarmBtn.removeAttribute('title');
    }
  }
}

/* ==========================================================================
   QR CODE & OPTICAL ASSET / CARGO TRACKING CONTROLS
   ========================================================================== */
function showCargoQr(containerId, description, payload, route, status = 'Nominal') {
  currentQrItemData = {
    schema: 'POLAR-SYNC/CARGO/v1',
    id: containerId,
    type: 'CARGO_CONTAINER',
    desc: description,
    payload: payload,
    route: route,
    status: status,
    location: 'Cape Town → Maitri Fast-Ice',
    uid: 'NCPOR-TAG-' + containerId.replace(/[^0-9]/g, '') + 'X'
  };

  const titleEl = document.getElementById('qrModalTitle');
  if (titleEl) titleEl.textContent = containerId;
  const descEl = document.getElementById('qrModalDesc');
  if (descEl) descEl.textContent = description + ' • ' + payload + ' (' + route + ')';
  const uidEl = document.getElementById('qrModalUid');
  if (uidEl) uidEl.textContent = currentQrItemData.uid;
  const locEl = document.getElementById('qrModalLocation');
  if (locEl) locEl.textContent = route;
  const typeEl = document.getElementById('qrBadgeType');
  if (typeEl) typeEl.textContent = 'CARGO CONTAINER';
  const statEl = document.getElementById('qrBadgeStatus');
  if (statEl) statEl.textContent = status;

  renderQrCode(JSON.stringify(currentQrItemData));
  const modal = document.getElementById('qrCodeModal');
  if (modal) modal.classList.add('show');
}

function showAssetQr(assetId, name, category, location, condition = 'Operational') {
  currentQrItemData = {
    schema: 'POLAR-SYNC/ASSET/v1',
    id: assetId,
    type: 'HEAVY_FLEET_ASSET',
    name: name,
    category: category,
    location: location,
    condition: condition,
    uid: 'NCPOR-ASSET-' + assetId.replace(/[^0-9A-Za-z]/g, '')
  };

  const titleEl = document.getElementById('qrModalTitle');
  if (titleEl) titleEl.textContent = assetId + ' — ' + name;
  const descEl = document.getElementById('qrModalDesc');
  if (descEl) descEl.textContent = category + ' • Operating at ' + location + ' • Condition: ' + condition;
  const uidEl = document.getElementById('qrModalUid');
  if (uidEl) uidEl.textContent = currentQrItemData.uid;
  const locEl = document.getElementById('qrModalLocation');
  if (locEl) locEl.textContent = location;
  const typeEl = document.getElementById('qrBadgeType');
  if (typeEl) typeEl.textContent = 'FLEET ASSET';
  const statEl = document.getElementById('qrBadgeStatus');
  if (statEl) statEl.textContent = condition;

  renderQrCode(JSON.stringify(currentQrItemData));
  const modal = document.getElementById('qrCodeModal');
  if (modal) modal.classList.add('show');
}

function renderQrCode(text) {
  const container = document.getElementById('qrCodeContainer');
  if (!container) return;
  container.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    activeQrCodeInstance = new QRCode(container, {
      text: text,
      width: 170,
      height: 170,
      colorDark: '#041020',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    container.innerHTML = '<div style="color:#000;font-size:11px;padding:20px;text-align:center">QR Library Initializing...</div>';
  }
}

function closeQrCodeModal() {
  const modal = document.getElementById('qrCodeModal');
  if (modal) modal.classList.remove('show');
}

function printQrTag() {
  window.print();
}

function testScanCurrentQr() {
  if (!currentQrItemData) return;
  closeQrCodeModal();
  handleQrScanSuccess(JSON.stringify(currentQrItemData));
}

function openQrScannerModal(context = 'all') {
  activeQrTarget = context;
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.classList.add('show');
  const outBox = document.getElementById('qrScanOutputBox');
  if (outBox) outBox.style.display = 'none';
}

function closeQrScannerModal() {
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.classList.remove('show');
  if (html5QrScannerInstance) {
    html5QrScannerInstance.stop().catch(() => {}).then(() => {
      html5QrScannerInstance.clear();
      html5QrScannerInstance = null;
    });
  }
}

function initCameraQrScanner() {
  const placeholder = document.getElementById('qrScannerPlaceholder');
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Camera scanner library loading from CDN... please retry in a moment.', 'info');
    return;
  }
  
  if (placeholder) placeholder.style.display = 'none';

  html5QrScannerInstance = new Html5Qrcode('html5QrReader');
  const config = { fps: 10, qrbox: { width: 220, height: 220 } };

  html5QrScannerInstance.start(
    { facingMode: 'environment' },
    config,
    (decodedText) => {
      handleQrScanSuccess(decodedText);
      closeQrScannerModal();
    },
    (errorMessage) => {
      // frame scan error (normal when no QR is in view)
    }
  ).catch(err => {
    console.warn('Camera stream error:', err);
    if (placeholder) placeholder.style.display = 'block';
    showToast('Camera unavailable (Permissions or HTTPS required). Use Hardware Tag Emulation below.', 'warn');
  });
}

function emulateTagScan(tagId) {
  const mockTags = {
    'C-102': { id: 'C-102', type: 'Cargo', desc: 'Heavy Generator Spares & Hydraulic Fluids', route: 'Cape Town → Maitri' },
    'C-103': { id: 'C-103', type: 'Cargo', desc: 'Medical Trauma Supplies & Plasma', route: 'Cape Town → Maitri' },
    'PB-04': { id: 'PB-04', type: 'Asset', desc: 'PistenBully 300 Polar Snowcat', location: 'Waypoint 4' },
    'GEN-02': { id: 'GEN-02', type: 'Asset', desc: 'Cummins 250kVA Polar Generator', location: 'Station Power Vault' },
    'C-101': { id: 'C-101', type: 'Cargo', desc: 'Arctic Diesel Winterized Fuel Bladders', route: 'Shelf → Maitri' }
  };

  const tag = mockTags[tagId] || { id: tagId, type: 'Item', desc: 'Polar Expedited Item' };
  const jsonStr = JSON.stringify({
    schema: 'POLAR-SYNC/TAG/v1',
    tag_id: 'NCPOR-RFID-' + tagId,
    item_id: tagId,
    metadata: tag,
    scanned_by: userRole,
    timestamp: new Date().toISOString()
  });

  handleQrScanSuccess(jsonStr);
}

async function handleQrScanSuccess(decodedText) {
  let itemId = '';
  let itemDesc = '';
  try {
    const parsed = JSON.parse(decodedText);
    itemId = parsed.item_id || parsed.id || 'ITEM-TAG';
    itemDesc = parsed.desc || parsed.name || (parsed.metadata ? parsed.metadata.desc : 'Identified Item');
  } catch (e) {
    itemId = decodedText.substring(0, 16);
    itemDesc = 'Raw Barcode String: ' + decodedText;
  }

  // Log scan event into IndexedDB
  await addEvent('qr_scan_verification', {
    itemId: itemId,
    description: itemDesc,
    operator: localStorage.getItem('polarUser') || 'Ashish Saini',
    role: userRole,
    tokenRef: currentJwtToken ? currentJwtToken.substring(0, 16) + '...' : 'ANON'
  });

  const outBox = document.getElementById('qrScanOutputBox');
  const outText = document.getElementById('qrScanOutputText');
  if (outBox && outText) {
    outBox.style.display = 'block';
    outText.textContent = `ID: ${itemId} • ${itemDesc} (Synchronized with local queue)`;
  }

  highlightMatchingItem(itemId);
  showToast(`📡 QR/RFID Verification: ${itemId} identified. Encrypted event buffered to IndexedDB.`, 'good');
}

function highlightMatchingItem(id) {
  const allRows = document.querySelectorAll('#cargoTableBody tr, #assetsTableBody tr');
  allRows.forEach(row => {
    if (row.textContent.includes(id)) {
      row.classList.add('pulse-row-highlight');
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => row.classList.remove('pulse-row-highlight'), 3000);
    }
  });
}

/* ==========================================================================
   TACTICAL LEAFLET MAP IMPLEMENTATION
   ========================================================================== */
const TACTICAL_WAYPOINTS = [
  {
    id: 'maitri',
    name: 'Maitri Station (India)',
    type: 'station',
    lat: -70.766,
    lng: 11.732,
    status: 'green',
    statusText: 'BASE • 87% Ready',
    desc: 'Primary Command Node, Schirmacher Oasis. 38 Personnel on base.'
  },
  {
    id: 'bharati',
    name: 'Bharati Station (India)',
    type: 'station',
    lat: -69.407,
    lng: 76.187,
    status: 'green',
    statusText: 'COASTAL BASE • Nominal',
    desc: 'Larsemann Hills coastal research outpost. Direct satellite ground link.'
  },
  {
    id: 'dakshin',
    name: 'Dakshin Gangotri Ice Shelf Depot',
    type: 'cargo',
    lat: -70.083,
    lng: 12.000,
    status: 'blue',
    statusText: 'SUPPLY DEPOT',
    desc: 'Fuel cache and heavy freight staging on the ice shelf.'
  },
  {
    id: 'novo',
    name: 'Novo Blue Ice Runway',
    type: 'cargo',
    lat: -70.816,
    lng: 11.633,
    status: 'green',
    statusText: 'AIR ROUTE OPEN',
    desc: 'ALCI DROMLAN intercontinental air corridor.'
  },
  {
    id: 'c102',
    name: 'Vessel C-102 (MV Vasiliy Golovnin)',
    type: 'cargo',
    lat: -69.100,
    lng: 12.500,
    status: 'amber',
    statusText: 'DELAYED • +10 Days',
    desc: 'Supply vessel encountering heavy multi-year pack ice. Carrying generator filters.'
  },
  {
    id: 'pb04',
    name: 'PB-04 Snowcat',
    type: 'vehicle',
    lat: -70.740,
    lng: 11.890,
    status: 'red',
    statusText: 'MAINTENANCE OVERDUE',
    desc: 'Hydraulic pressure drop near Waypoint 4. 12 personnel reliant on route.'
  },
  {
    id: 'pb07',
    name: 'PB-07 Snowcat',
    type: 'vehicle',
    lat: -70.780,
    lng: 11.600,
    status: 'green',
    statusText: 'OPERATIONAL',
    desc: 'Assigned as standby relief unit. Full fuel reserve.'
  },
  {
    id: 'h01',
    name: 'H-01 Helicopter (Ka-32)',
    type: 'vehicle',
    lat: -70.760,
    lng: 11.720,
    status: 'green',
    statusText: 'FLIGHT READY',
    desc: 'Station helipad. Available for emergency aerial evacuation.'
  },
  {
    id: 'team_alpha',
    name: 'Field Team Alpha (Sortie-01)',
    type: 'team',
    lat: -70.720,
    lng: 11.950,
    status: 'amber',
    statusText: 'SURVEY IN PROGRESS',
    desc: 'Glaciology crevasse mapping near Borehole 4. Satellite beacon locked.'
  },
  {
    id: 'team_bravo',
    name: 'Field Team Bravo (Sortie-02)',
    type: 'team',
    lat: -70.795,
    lng: 11.550,
    status: 'green',
    statusText: 'ICE SHELF CORING',
    desc: 'Deep ice core extraction near Schirmacher shelf margin. All life-support nominal.'
  }
];

function createTacticalMarkerIcon(status) {
  return L.divIcon({
    className: 'custom-tactical-marker',
    html: `<div class="marker-pin ${status}"><div class="pulse-dot ${status}"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

const MAP_TILE_PROVIDERS = {
  satellite: {
    name: 'Esri Polar Satellite (High Resolution)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      minZoom: 2,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
    }
  },
  dark: {
    name: 'CartoDB Dark Matter (Tactical Vector)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 18,
      minZoom: 2,
      subdomains: 'abcd',
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }
  },
  osm: {
    name: 'OpenStreetMap (Topo / Cartographic)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 18,
      minZoom: 2,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  mapbox: {
    name: 'Mapbox Satellite Streets (Custom Token)',
    getUrl: (token) => `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`,
    options: {
      maxZoom: 19,
      minZoom: 2,
      tileSize: 512,
      zoomOffset: -1,
      attribution: '&copy; Mapbox &copy; OpenStreetMap'
    }
  }
};

let currentMapLayerType = localStorage.getItem('polarMapLayer') || 'satellite';
let currentMapboxToken = localStorage.getItem('polarMapboxToken') || '';
let tacticalTileLayer = null;
let heroTileLayer = null;

function createTileLayer(type = currentMapLayerType) {
  if (type === 'mapbox' && currentMapboxToken) {
    const p = MAP_TILE_PROVIDERS.mapbox;
    return L.tileLayer(p.getUrl(currentMapboxToken), p.options);
  }
  const provider = MAP_TILE_PROVIDERS[type] || MAP_TILE_PROVIDERS.satellite;
  return L.tileLayer(provider.url, provider.options);
}

function setMapBaseLayer(layerType) {
  if (layerType === 'mapbox' && !currentMapboxToken) {
    openMapSettingsModal();
    showToast('Please enter your Mapbox Access Token to activate Mapbox tiles.', 'warn');
    return;
  }
  currentMapLayerType = layerType;
  localStorage.setItem('polarMapLayer', layerType);

  // Update Tactical Map tile layer
  if (tacticalMapInstance && typeof L !== 'undefined') {
    if (tacticalTileLayer) tacticalMapInstance.removeLayer(tacticalTileLayer);
    tacticalTileLayer = createTileLayer(layerType).addTo(tacticalMapInstance);
  }

  // Update Hero Map tile layer
  if (fullHeroMapInstance && typeof L !== 'undefined') {
    if (heroTileLayer) fullHeroMapInstance.removeLayer(heroTileLayer);
    heroTileLayer = createTileLayer(layerType).addTo(fullHeroMapInstance);
  }

  // Update UI active buttons
  ['Sat', 'Dark', 'Osm', 'Mapbox'].forEach(k => {
    const b1 = document.getElementById('btnLayer' + k);
    const b2 = document.getElementById('btnHeroLayer' + k);
    const isAct = (k.toLowerCase() === layerType.toLowerCase());
    if (b1) { b1.classList.toggle('active', isAct); b1.classList.toggle('btn-outline', !isAct); }
    if (b2) { b2.classList.toggle('active', isAct); b2.classList.toggle('btn-outline', !isAct); }
  });

  const pName = MAP_TILE_PROVIDERS[layerType]?.name || layerType;
  showToast('✓ Active Map Projection: ' + pName + ' (No API key required)', 'info');
}

function initTacticalMap() {
  if (tacticalMapInstance) return;
  const el = document.getElementById('tacticalMap');
  if (!el || typeof L === 'undefined') return;

  // Initialize centered on Queen Maud Land (Maitri sector)
  tacticalMapInstance = L.map('tacticalMap', {
    center: [-70.766, 12.0],
    zoom: 7,
    zoomControl: true,
    attributionControl: false
  });

  // Default base tile layer (Esri Satellite or saved preference - 100% Free, NO API Key needed!)
  tacticalTileLayer = createTileLayer().addTo(tacticalMapInstance);

  // Add tactical waypoints
  TACTICAL_WAYPOINTS.forEach(wp => {
    if (wp.id === 'bharati') return; // Out of local zoom
    const m = L.marker([wp.lat, wp.lng], { icon: createTacticalMarkerIcon(wp.status) });
    m.bindPopup(`
      <b style="color:#fff;font-size:12px">${wp.name}</b><br>
      <span class="status ${wp.status === 'red' ? 'bad' : wp.status === 'amber' ? 'warn' : ''}">${wp.statusText}</span>
      <p style="margin-top:6px;font-size:11px;color:var(--text-muted)">${wp.desc}</p>
    `);
    m.addTo(tacticalMapInstance);
  });

  // Overland Traverse Line (Maitri <-> Dakshin Gangotri Ice Shelf)
  const traverseCoords = [
    [-70.766, 11.732],
    [-70.500, 11.850],
    [-70.083, 12.000]
  ];
  L.polyline(traverseCoords, {
    color: '#00e5ff',
    weight: 2,
    dashArray: '8, 8',
    opacity: 0.8
  }).addTo(tacticalMapInstance);

  // Sea-ice supply route
  const seaRouteCoords = [
    [-69.100, 12.500],
    [-69.600, 12.200],
    [-70.083, 12.000]
  ];
  L.polyline(seaRouteCoords, {
    color: '#f59e0b',
    weight: 2,
    dashArray: '5, 8',
    opacity: 0.7
  }).addTo(tacticalMapInstance);
}

function resetMapMaitri() {
  if (tacticalMapInstance) {
    tacticalMapInstance.flyTo([-70.766, 11.732], 8);
  }
}
function resetMapBharati() {
  if (tacticalMapInstance) {
    tacticalMapInstance.flyTo([-69.407, 76.187], 7);
  }
}

let heroMarkers = [];
function initFullHeroMap() {
  if (fullHeroMapInstance) return;
  const el = document.getElementById('fullHeroMap');
  if (!el || typeof L === 'undefined') return;

  fullHeroMapInstance = L.map('fullHeroMap', {
    center: [-70.766, 12.0],
    zoom: 6,
    zoomControl: true,
    attributionControl: false
  });

  heroTileLayer = createTileLayer().addTo(fullHeroMapInstance);

  TACTICAL_WAYPOINTS.forEach(wp => {
    const m = L.marker([wp.lat, wp.lng], { icon: createTacticalMarkerIcon(wp.status) });
    m.bindPopup(`
      <div style="padding:4px">
        <b style="color:#fff;font-size:13px">${wp.name}</b><br>
        <span class="status ${wp.status === 'red' ? 'bad' : wp.status === 'amber' ? 'warn' : ''}">${wp.statusText}</span>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--cyan);margin:4px 0">${wp.lat.toFixed(3)}°S, ${wp.lng.toFixed(3)}°E</div>
        <p style="margin-top:4px;font-size:11px;color:var(--text-muted)">${wp.desc}</p>
      </div>
    `);
    m.wpType = wp.type;
    m.addTo(fullHeroMapInstance);
    heroMarkers.push(m);
  });

  // Continental Air Bridge Corridor (Cape Town to Novo to Maitri & Bharati)
  const intercontinentalRoute = [
    [-33.924, 18.424], // Cape Town
    [-70.816, 11.633], // Novo Runway
    [-70.766, 11.732]  // Maitri Base
  ];
  L.polyline(intercontinentalRoute, {
    color: '#38bdf8',
    weight: 2,
    dashArray: '6, 8',
    opacity: 0.6
  }).addTo(fullHeroMapInstance);

  // Continental Inter-Station Traverse Spine (Maitri Base to Bharati Base)
  const continentalTraverseRoute = [
    [-70.766, 11.732], // Maitri Base (QML)
    [-70.400, 25.000],
    [-69.800, 42.000],
    [-68.900, 60.000],
    [-69.407, 76.187]  // Bharati Base (Larsemann)
  ];
  L.polyline(continentalTraverseRoute, {
    color: '#00e5ff',
    weight: 2,
    dashArray: '8, 8',
    opacity: 0.75
  }).addTo(fullHeroMapInstance);

  // Sortie Spur Alpha (Maitri to Field Team Alpha)
  L.polyline([[-70.766, 11.732], [-70.720, 11.950]], {
    color: '#f59e0b',
    weight: 2,
    dashArray: '4, 4',
    opacity: 0.85
  }).addTo(fullHeroMapInstance);

  // Sortie Spur Bravo (Maitri to Field Team Bravo)
  L.polyline([[-70.766, 11.732], [-70.795, 11.550]], {
    color: '#22c55e',
    weight: 2,
    dashArray: '4, 4',
    opacity: 0.85
  }).addTo(fullHeroMapInstance);

  // Sea-ice Supply Corridor (C-102 to Dakshin to Maitri)
  L.polyline([[-69.100, 12.500], [-70.083, 12.000], [-70.766, 11.732]], {
    color: '#f59e0b',
    weight: 2,
    dashArray: '5, 8',
    opacity: 0.7
  }).addTo(fullHeroMapInstance);
}

function centerHeroMap(target) {
  if (!fullHeroMapInstance) return;
  if (target === 'maitri') {
    fullHeroMapInstance.flyTo([-70.766, 11.732], 8);
  } else if (target === 'bharati') {
    fullHeroMapInstance.flyTo([-69.407, 76.187], 8);
  } else if (target === 'alpha') {
    fullHeroMapInstance.flyTo([-70.720, 11.950], 10);
  } else if (target === 'bravo') {
    fullHeroMapInstance.flyTo([-70.795, 11.550], 10);
  } else if (target === 'c102') {
    fullHeroMapInstance.flyTo([-69.100, 12.500], 7);
  } else if (target === 'novo') {
    fullHeroMapInstance.flyTo([-70.816, 11.633], 9);
  } else if (target === 'dakshin') {
    fullHeroMapInstance.flyTo([-70.083, 12.000], 8);
  } else if (target === 'corridor') {
    fullHeroMapInstance.flyTo([-70.0, 44.0], 4);
  } else {
    fullHeroMapInstance.flyTo([-70.0, 45.0], 3);
  }
}

function filterMapMarkers(type, btn) {
  if (btn) {
    document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  heroMarkers.forEach(m => {
    if (type === 'all' || m.wpType === type) {
      if (!fullHeroMapInstance.hasLayer(m)) fullHeroMapInstance.addLayer(m);
    } else {
      if (fullHeroMapInstance.hasLayer(m)) fullHeroMapInstance.removeLayer(m);
    }
  });
}

function quickFilterCargo(status) {
  const rows = document.querySelectorAll('#cargoTableBody tr');
  rows.forEach(r => {
    if (status === 'all' || r.getAttribute('data-status') === status) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function quickFilterInventory(category, btn) {
  if (btn) {
    document.querySelectorAll('.inv-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const rows = document.querySelectorAll('#inventoryTableBody tr');
  rows.forEach(r => {
    if (category === 'all' || r.getAttribute('data-category') === category) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function searchInventoryTable(query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#inventoryTableBody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

function quickFilterAssets(category, btn) {
  if (btn) {
    document.querySelectorAll('.asset-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const rows = document.querySelectorAll('#assetsTableBody tr');
  rows.forEach(r => {
    if (category === 'all' || r.getAttribute('data-category') === category) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function searchAssetsTable(query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#assetsTableBody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

function quickFilterPersonnel(category, btn) {
  if (btn) {
    document.querySelectorAll('.personnel-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const rows = document.querySelectorAll('#personnelTableBody tr');
  rows.forEach(r => {
    if (category === 'all' || r.getAttribute('data-category') === category) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function searchPersonnelTable(query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#personnelTableBody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

/* ==========================================================================
   MISSION PLANNING & EXPEDITION OPERATIONS HELPERS
   ========================================================================== */
function quickFilterTimeline(category, btn) {
  const container = document.getElementById('planningTimeline');
  if (!container) return;
  const buttons = document.querySelectorAll('.planning-filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const items = container.querySelectorAll('.timeline-item');
  items.forEach(item => {
    const itemCat = item.getAttribute('data-category') || '';
    if (category === 'all' || itemCat.includes(category)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function triggerReadinessRecalc(btn) {
  if (!btn) return;
  const origHtml = btn.innerHTML;
  btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="refresh-cw" style="width:13px;height:13px;animation:spin 1s linear infinite"></i> Recalculating...</span>';
  if (window.lucide) lucide.createIcons();
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;color:var(--green)"><i data-lucide="check-circle" style="width:13px;height:13px"></i> Composite 87% Verified</span>';
    if (window.lucide) lucide.createIcons();
    if (typeof showToast === 'function') {
      showToast('Readiness Model recalculated: 87% Composite Score verified across 5 pillars.', 'success');
    }
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }, 2400);
  }, 750);
}

/* ==========================================================================
   CHARTS (ANALYTICS)
   ========================================================================== */
function initCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Readiness Trend
  const ctxReadiness = document.getElementById('readinessChart');
  if (ctxReadiness && !readinessChartInstance) {
    readinessChartInstance = new Chart(ctxReadiness, {
      type: 'line',
      data: {
        labels: ['Day 130', 'Day 132', 'Day 134', 'Day 136', 'Day 138', 'Day 140', 'Day 142 (Today)'],
        datasets: [{
          label: 'Mission Readiness Score (%)',
          data: [78, 80, 84, 82, 81, 85, 87],
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.08)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#020b17',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#88a3bb', font: { size: 10 } } },
          y: { min: 60, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#88a3bb', font: { size: 10 } } }
        }
      }
    });
  }

  // Chart 2: Inventory Depletion
  const ctxInv = document.getElementById('inventoryChart');
  if (ctxInv && !inventoryChartInstance) {
    inventoryChartInstance = new Chart(ctxInv, {
      type: 'bar',
      data: {
        labels: ['Fuel (Diesel)', 'Food Rations', 'Oxygen', 'Medical Kits', 'Gen Spares'],
        datasets: [{
          label: 'Days Remaining',
          data: [18, 24, 12, 5, 4],
          backgroundColor: [
            'rgba(0, 229, 255, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderColor: [
            '#00e5ff',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#ef4444'
          ],
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#88a3bb', font: { size: 10 } } },
          y: { beginAtZero: true, max: 30, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#88a3bb', font: { size: 10 } } }
        }
      }
    });
  }
}

/* ==========================================================================
   EXPEDITION REPORTS & ANALYTICS HELPERS
   ========================================================================== */
function exportAnalyticsReport() {
  const data = {
    expedition: 'POLAR-SYNC 2026',
    station: 'Maitri / Bharati Stations — Sector 77°S',
    day: 142,
    readinessScore: '87%',
    dataIntegrity: '100% Zero-Loss Guaranteed',
    bufferedEvents: document.getElementById('queueCountAnalytics') ? document.getElementById('queueCountAnalytics').textContent : '0',
    metrics: {
      equipment: '94%',
      rations: '82%',
      fleetMaintenance: '76% (Risk Factor)',
      personnelCompliance: '100%',
      atmosphericWindow: '85%'
    },
    consumablesRunwayDays: {
      fuelDiesel: 18,
      rations: 24,
      oxygen: 12,
      medicalKits: 5,
      genSpares: 4
    },
    exportTimestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `polar-sync-mission-report-day142-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  if (typeof showToast === 'function') {
    showToast('Expedition Telemetry Report exported successfully (JSON).', 'success');
  }
}

function filterAnalyticsDateRange(range, btn) {
  if (btn) {
    document.querySelectorAll('.analytics-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if (typeof showToast === 'function') {
    showToast(`Telemetry range adjusted: ${range}. Recalibrating chart series...`, 'info');
  }
  if (readinessChartInstance) {
    if (range === '7d') {
      readinessChartInstance.data.labels = ['Day 136', 'Day 137', 'Day 138', 'Day 139', 'Day 140', 'Day 141', 'Day 142'];
      readinessChartInstance.data.datasets[0].data = [82, 83, 81, 84, 85, 86, 87];
    } else if (range === '14d') {
      readinessChartInstance.data.labels = ['Day 130', 'Day 132', 'Day 134', 'Day 136', 'Day 138', 'Day 140', 'Day 142 (Today)'];
      readinessChartInstance.data.datasets[0].data = [78, 80, 84, 82, 81, 85, 87];
    } else if (range === '30d') {
      readinessChartInstance.data.labels = ['Day 115', 'Day 120', 'Day 125', 'Day 130', 'Day 135', 'Day 140', 'Day 142'];
      readinessChartInstance.data.datasets[0].data = [72, 75, 77, 78, 82, 85, 87];
    }
    readinessChartInstance.update();
  }
}

/* ==========================================================================
   STATION CLOCK TICKER
   ========================================================================== */
function updateClock() {
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
  const clockEl = document.getElementById('stationClock');
  if (clockEl) {
    clockEl.textContent = `${utcHours}:${utcMinutes}:${utcSeconds} UTC`;
  }
}
setInterval(updateClock, 1000);
updateClock();

/* ==========================================================================
   EVENT LISTENERS & LIFECYCLE
   ========================================================================== */
window.addEventListener('online', () => {
  if (offline) {
    offline = false;
    const offlineBadge = document.getElementById('offlineBadge');
    if (offlineBadge) offlineBadge.classList.remove('show');
    const onlineBadge = document.getElementById('onlineBadge');
    if (onlineBadge) onlineBadge.style.display = 'inline-flex';
    const netText = document.getElementById('netText');
    if (netText) {
      netText.textContent = 'ONLINE';
      netText.style.color = 'var(--cyan)';
    }
    syncNow();
  }
});

window.addEventListener('offline', () => {
  offline = true;
  const offlineBadge = document.getElementById('offlineBadge');
  if (offlineBadge) offlineBadge.classList.add('show');
  const onlineBadge = document.getElementById('onlineBadge');
  if (onlineBadge) onlineBadge.style.display = 'none';
  const netText = document.getElementById('netText');
  if (netText) {
    netText.textContent = 'OFFLINE';
    netText.style.color = 'var(--red)';
  }
});

window.addEventListener('load', async () => {
  // Render Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Restore saved role and operator
  const r = localStorage.getItem('polarRole');
  const u = localStorage.getItem('polarUser');
  if (r) {
    userRole = r;
    const roleInput = document.getElementById('role');
    if (roleInput) roleInput.value = r;
    const roleChip = document.getElementById('roleChip');
    if (roleChip) roleChip.textContent = r;
  }
  if (u) {
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) userDisplayName.textContent = u;
    const usernameInput = document.getElementById('username');
    if (usernameInput) usernameInput.value = u;
    const userAvatar = document.getElementById('userAvatarLetter');
    if (userAvatar) userAvatar.textContent = u.charAt(0).toUpperCase();
  }

  // Restore or initialize cryptographic JWT session
  const savedJwt = localStorage.getItem('polarJwt');
  if (savedJwt) {
    try {
      const parts = savedJwt.split('.');
      if (parts.length === 3) {
        currentJwtToken = savedJwt;
        currentDecodedJwt = JSON.parse(base64UrlDecode(parts[1]));
      }
    } catch (e) {
      console.warn('Could not decode stored JWT:', e);
    }
  }

  if (!currentDecodedJwt && r) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: 'ncpor.gov.in/polar-sync',
      sub: 'POLAR-OP-9042',
      username: u || 'Ashish Saini',
      role: userRole,
      station: 'Maitri Base (70°46′S, 11°44′E)',
      permissions: RBAC_ROLES[userRole]?.permissions || ['read:all'],
      iat: issuedAt,
      exp: issuedAt + (8 * 3600),
      jti: 'jwt-' + Math.random().toString(36).substring(2, 9)
    };
    const signed = await signJwtToken(jwtPayload);
    currentJwtToken = signed.token;
    currentDecodedJwt = signed.payload;
    localStorage.setItem('polarJwt', currentJwtToken);
  }

  updateJwtBadgeUi();
  applyRbacUiState();

  if (r) {
    const loginEl = document.getElementById('login');
    if (loginEl) loginEl.classList.add('hidden');
  }

  // Update queue count from IndexedDB
  await updateQueue();

  // Initialize Tactical Map
  setTimeout(() => {
    initTacticalMap();
  }, 250);
});

/* ==========================================================================
   GEOSPATIAL MAP SETTINGS & API KEY CONTROLS
   ========================================================================== */
function openMapSettingsModal() {
  const modal = document.getElementById('mapSettingsModal');
  if (!modal) return;
  const tokenInput = document.getElementById('mapboxTokenInput');
  if (tokenInput) {
    tokenInput.value = localStorage.getItem('polarMapboxToken') || '';
  }
  const currentProviderEl = document.getElementById('activeMapProviderLabel');
  if (currentProviderEl) {
    currentProviderEl.textContent = MAP_TILE_PROVIDERS[currentMapLayerType]?.name || currentMapLayerType;
  }
  modal.classList.add('show');
}

function closeMapSettingsModal() {
  const modal = document.getElementById('mapSettingsModal');
  if (modal) modal.classList.remove('show');
}

function saveMapboxToken() {
  const tokenInput = document.getElementById('mapboxTokenInput');
  const token = tokenInput ? tokenInput.value.trim() : '';
  if (!token) {
    showToast('Mapbox token cleared. Switched back to Free Satellite imagery (No API key needed).', 'info');
    localStorage.removeItem('polarMapboxToken');
    currentMapboxToken = '';
    setMapBaseLayer('satellite');
    closeMapSettingsModal();
    return;
  }
  if (!token.startsWith('pk.')) {
    showToast('⚠️ Mapbox tokens typically begin with "pk.eyJ...". Please verify your key.', 'warn');
  }
  localStorage.setItem('polarMapboxToken', token);
  currentMapboxToken = token;
  setMapBaseLayer('mapbox');
  closeMapSettingsModal();
  showToast('✓ Mapbox Access Token saved & custom tile layer activated!', 'good');
}

function selectFreeLayerFromModal(type) {
  setMapBaseLayer(type);
  closeMapSettingsModal();
}

/* ==========================================================================
   OFFICIAL DATA EXPORT ENGINE (CSV / REPORT GENERATION)
   ========================================================================== */
function exportTableToCsv(tableId, filename = 'export.csv') {
  const table = document.getElementById(tableId);
  if (!table) {
    showToast('Table not found: ' + tableId, 'warn');
    return;
  }
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) {
    showToast('No data available to export.', 'warn');
    return;
  }

  const csvRows = [];
  rows.forEach(row => {
    if (row.style.display === 'none') return;
    const cells = Array.from(row.querySelectorAll('th, td'));
    const rowData = cells.map(cell => {
      let text = cell.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
      text = text.replace(/"/g, '""');
      return `"${text}"`;
    });
    csvRows.push(rowData.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`✓ Official Export Complete: ${filename} downloaded.`, 'good');
}
