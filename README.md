<div align="center">

# ❄️ NCPOR POLAR-SYNC
### National Antarctic Expedition Logistics, Asset & Personnel Management System
**44th Indian Scientific Expedition to Antarctica (44-ISEA)**  
*National Centre for Polar and Ocean Research (NCPOR) • Ministry of Earth Sciences (MoES), Government of India*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20(Vite)-61dafb.svg)](frontend/)
[![Backend: Node.js Express](https://img.shields.io/badge/Backend-Node.js%20Express-68a063.svg)](backend/)
[![AI Engine: Scikit--Learn](https://img.shields.io/badge/AI%2FML-Scikit--Learn%20Python%203.12-f7931e.svg)](ai_engine/)
[![GIS: Leaflet Satellite](https://img.shields.io/badge/GIS-Leaflet%20Polar%20Satellite-199900.svg)](frontend/src/views/GISMapView.jsx)
[![Security: JWT + RBAC](https://img.shields.io/badge/Security-HMAC--SHA256%20JWT%20%2B%20RBAC-red.svg)](backend/middleware/auth.js)
[![Vercel: Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-black.svg)](vercel.json)

---

</div>

## 📌 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Mandated Tech Stack](#-mandated-tech-stack)
3. [Key Operational Capabilities](#-key-operational-capabilities)
4. [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
5. [Quickstart & Local Installation](#-quickstart--local-installation)
6. [Automated Verification & Test Suite](#-automated-verification--test-suite)
7. [Vercel Deployment Guide](#-vercel-deployment-guide)
8. [Author & License](#-author--license)

---

## 🏛️ Overview & Problem Statement

Operating permanent research stations across the harsh Antarctic interior (**Maitri Station Hub** at `70°46′S, 11°44′E` and **Bharati Station Hub** at `69°24′S, 76°11′E`) requires continuous operational coordination over sub-zero katabatic blizzards (-40°C), active crevasse fields, and extended satellite communications blackouts.

**POLAR-SYNC** is an enterprise-grade Antarctic logistics platform built for the **44th Indian Scientific Expedition to Antarctica (44-ISEA)**. It replaces fragile manual spreadsheets and sci-fi mockups with an **authentic, authoritative government logistics portal** featuring automated offline synchronization, Scikit-learn predictive modeling, and cryptographic role-based access control.

---

## 🛠️ Mandated Tech Stack

| Layer | Technology | Operational Implementation |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite SPA)** | High-density dashboard with official Government of India header ribbon, live tabular search, CSV data export, and printable GS1 shipping manifests. |
| **Backend** | **Node.js + Express.js** | REST API on port `5000` with modular routing, body validation, serverless Vercel adapter, and Python subprocess execution. |
| **Database** | **MongoDB / Dual-Adapter** | Dual-mode database supporting native MongoDB connection strings with an automatic zero-config persistent JSON store fallback (`backend/data/`). |
| **AI / ML** | **Python + Scikit-Learn** | `RandomForestClassifier` (`risk_classifier.pkl`) for mission risk triage + `Ridge` Regression (`fuel_forecaster.pkl`) for sub-zero fuel burn rate and winter-over autonomy. |
| **GIS** | **GPS + Leaflet** | High-resolution **Esri Polar World Satellite imagery** (**zero API key required**), CartoDB Tactical Dark, OSM, convoy GPS tracks, and crevasse hazard warning polygons. |
| **Offline Support** | **IndexedDB** | Native browser `PolarSyncOfflineDB` capturing cargo additions, stock adjustments, and incident reports during blizzard blackouts; auto-sync reconciler with `/api/sync/events`. |
| **Security** | **JWT + RBAC** | Cryptographic HS256 tokens with role-based permissions matrix for 5 expedition roles: Station Admin, Logistics Officer, Expedition Officer, Maintenance Engineer, Emergency Coordinator. |
| **Asset Tracking** | **QR / RFID** | GS1-128 2D barcode generator/scanner + Long-range UHF EPC Class 1 Gen 2 (865.7 MHz) RFID reader simulator with live RSSI dBm signal metering. |

---

## 🚀 Key Operational Capabilities

### 1. Official Institutional Identity & Portal Authentication
- Official Government of India & Ministry of Earth Sciences (MoES) tricolor identity.
- Dual-mode authentication:
  - **Officer Sign In**: Secure credentials login with assigned station theater selector.
  - **★ Instant Evaluator Passes**: One-click demo roles for judges (*Commander, Logistics Lead, Science Officer, Chief Engineer, Medical Head*).
  - **Expedition Personnel Registration (Sign Up)**: Register new officers with Service ID, Blood Group, and Station assignment, automatically enrolling them into the personnel roster and issuing signed JWTs.
  - **Session Sign Out**: Instant terminal lock button in the header.

### 2. Machine Learning Operations (Python + Scikit-Learn)
- **Random Forest Risk Classifier**: Analyzes katabatic wind speed, sub-zero ambient temp, visibility, crevasse hazard density, and payload weight to predict mission risk class with calibrated confidence (0–100%) and actionable directives.
- **Ridge Regressor Resource Forecaster**: Predicts daily Arctic ATF-50 diesel consumption and rations burn rate with calculated days of autonomy.

### 3. Tactical Polar GIS Map (Zero API Key Obstacles)
- Real-time map rendering Indian research stations (*Maitri Base*, *Bharati Base*, *Dakshin Gangotri Depot*).
- Defaults to free, orthorectified **Esri Polar World Satellite imagery** with no rate limits or API key requirements.
- Toggle between Satellite, CartoDB Tactical Dark, and OpenStreetMap.
- Real-time coordinate crosshairs and crevasse hazard zone overlays.

### 4. Zero-Data-Loss Offline Synchronization (IndexedDB)
- Toggle between **Network Live (Iridium 700)** and **Offline Mode (Blizzard Outage)**.
- Mutations (cargo registration, stock changes, incident logs) are saved locally in the browser's IndexedDB.
- When satcom reconnects, the system automatically pushes queued transactions to `/api/sync/events` and reconciles the server database.

### 5. Enterprise Data Export & Reporting
- One-click **"Export CSV"** buttons on all operational tables (*Cargo Manifest, Fuel Inventory, Fleet Assets, Personnel Muster*).
- Printable **GS1-128 Polar Consignment Shipping Manifest** labels formatted with official barcodes and IMDG hazard ratings.

---

## 📁 Project Architecture & Directory Structure

```
polar-sync/
├── .gitignore                     # Git ignore rules (Node, Vite, Python, Vercel)
├── LICENSE.md                     # MIT Open Source License
├── README.md                      # Comprehensive project documentation
├── package.json                   # Root orchestrator & Vercel deployment scripts
├── vercel.json                    # Vercel serverless function & SPA routing configuration
│
├── api/                           # Vercel Serverless Function Directory
│   └── index.js                   # Express serverless API adapter for Vercel
│
├── ai_engine/                     # Python 3.12 + Scikit-Learn AI Engine
│   ├── polar_ai.py                # Command-line inference script
│   ├── train_models.py            # Training pipeline for RandomForest & Ridge models
│   └── models/
│       ├── risk_classifier.pkl    # Serialized RandomForestClassifier
│       └── fuel_forecaster.pkl    # Serialized Ridge Regressor
│
├── backend/                       # Node.js + Express REST API
│   ├── server.js                  # Express HTTP server & static SPA host (Port 5000)
│   ├── test_all_features.js       # 29-point automated verification suite
│   ├── config/
│   │   └── db.js                  # Dual-adapter database (MongoDB + Embedded JSON Store)
│   ├── middleware/
│   │   └── auth.js                # HMAC-SHA256 JWT & RBAC permission middleware
│   ├── routes/                    # Modular API route handlers
│   │   ├── authRoutes.js          # Authentication, register, verify, and roles
│   │   ├── cargoRoutes.js         # Container manifest, creation, and QR/RFID scan
│   │   ├── inventoryRoutes.js     # Fuel/rations stock levels and adjustment
│   │   ├── assetRoutes.js         # Polar vehicle fleet and maintenance logs
│   │   ├── personnelRoutes.js     # 46-member expedition muster roster
│   │   ├── incidentRoutes.js      # SITREP emergency logging & alarm drills
│   │   ├── gisRoutes.js           # Station telemetry & crevasse hazard coordinates
│   │   ├── syncRoutes.js          # IndexedDB batch reconciliation engine
│   │   └── aiRoutes.js            # Python Scikit-Learn subprocess bridge
│   └── services/
│       ├── aiService.js           # Node-to-Python execution bridge with local fallback
│       └── seedData.js            # Official 44-ISEA Antarctic seed dataset
│
└── frontend/                      # React 18 + Vite SPA
    ├── index.html                 # Single page application entrypoint
    ├── vite.config.js             # Vite development server & backend proxy
    └── src/
        ├── App.jsx                # Root application layout & route switcher
        ├── index.css              # Official MoES enterprise government styling
        ├── context/
        │   ├── AuthContext.jsx    # JWT session state, demo logins, and RBAC helper
        │   └── OfflineContext.jsx # IndexedDB storage & automatic sync engine
        ├── services/
        │   ├── api.js             # Client API service with JWT authorization header
        │   └── exportCsv.js       # Microsoft Excel compatible CSV exporter
        ├── components/
        │   ├── Header.jsx         # Govt. of India ribbon, station switcher, sign out
        │   └── Sidebar.jsx        # Utilitarian enterprise navigation sidebar
        └── views/
            ├── AuthPortalView.jsx # Dedicated Officer Sign In & Registration Portal
            ├── DashboardView.jsx  # Operational HUD & readiness telemetry
            ├── GISMapView.jsx     # Leaflet Polar satellite tactical map
            ├── CargoView.jsx      # IMDG manifest, add consignment, GS1 printable label
            ├── InventoryView.jsx  # Sub-zero diesel reserves & burn rates
            ├── AssetsView.jsx     # PistenBully snowcats & Cummins gensets
            ├── PersonnelView.jsx  # 44-ISEA muster roll & medical triage
            ├── IncidentView.jsx   # Emergency SITREP logger & klaxon drill
            ├── AiDecisionView.jsx # Interactive Scikit-Learn ML simulator
            ├── AssetScannerView.jsx # GS1 QR code generator & UHF RFID reader
            └── SecurityView.jsx   # Live JWT token claims & RBAC matrix audit
```

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) 3.10+ *(Optional for training new models; pre-trained `.pkl` models and fallback bridges are bundled)*

### 1. Clone the Repository
```bash
git clone https://github.com/AyushGupta-Git07/polar-sync.git
cd polar-sync
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 3. Run the Unified Application
```bash
npm start
```
* **Frontend Application**: [http://localhost:5000](http://localhost:5000)
* **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(Optional) Run the Vite Hot-Reloading Development Server:*
```bash
npm run start:frontend
```
* **Vite Dev Server**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Automated Verification & Test Suite

The project includes an exhaustive 29-point automated integration test suite that tests every layer of the application:
```bash
npm test
```

### Test Suite Output (100% Green):
```
================================================================
  POLAR-SYNC EXHAUSTIVE FUNCTIONALITY AUDIT & VERIFICATION
================================================================
  [PASS 1/1] Health Check: 200 OK 
  [PASS 2/2] Database Mode: Dual Persistent Active 
  [PASS 3/3] AI Engine Specification: Scikit-Learn RandomForest + Ridge
  [PASS 4/4] Login Admin: 200 OK 
  [PASS 5/5] JWT Issued for Station Admin 
  [PASS 6/6] Admin Permission contains wildcard (*) 
  [PASS 7/7] Login Logistics (with role alias normalization) 
  [PASS 8/8] Logistics RBAC contains cargo:write 
  [PASS 9/9] Cargo Manifest Listing: 200 OK 
  [PASS 10/10] Cargo Creation (Add Consignment): 200 OK 
  [PASS 11/11] Optical QR Scanner: Identified C-101 
  [PASS 12/12] UHF RFID Tag Reader: Identified PB-04 Polar Snowcat 
  [PASS 13/13] Inventory Stores Listing: 200 OK 
  [PASS 14/14] Inventory Stock Adjustment (PUT /stock): 200 OK 
  [PASS 15/15] Fleet Assets Listing: 200 OK 
  [PASS 16/16] Asset Fleet Status & Service Log (PUT /status): 200 OK 
  [PASS 17/17] Expedition Personnel Roster: 200 OK 
  [PASS 18/18] Incidents SITREP Ledger Listing: 200 OK 
  [PASS 19/19] Report Incident (POST /incidents): 200 OK 
  [PASS 20/20] AI Engine: RandomForest Inference Executed 
  [PASS 21/21] AI Risk Engine classified environmental risk 
  [PASS 22/22] AI Risk Engine generated safety directives 
  [PASS 23/23] AI Engine: Ridge Regressor Resource Forecast Executed 
  [PASS 24/24] AI Fuel Forecast: Calculated Daily Burn & Days Autonomy 
  [PASS 25/25] GIS Polar Telemetry: 200 OK 
  [PASS 26/26] GIS Crevasse Hazards Polygons Present 
  [PASS 27/27] IndexedDB Auto-Sync Reconciler: 200 OK 
  [PASS 28/28] IndexedDB Sync reconciled all batch items 
  [PASS 29/29] React SPA Root Entry (index.html): 200 OK 
================================================================
  AUDIT COMPLETE: 29 OF 29 TESTS PASSED (100% GREEN)
================================================================
```

---

## 🌐 Vercel Deployment Guide

The repository includes `vercel.json` and `api/index.js` configured for single-command or continuous deployment:

### Option A: Deploy via GitHub (Recommended)
1. Push this repository to [GitHub](https://github.com/AyushGupta-Git07/polar-sync).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import `polar-sync`.
4. Vercel automatically detects `vercel.json` and the build commands. Click **"Deploy"**.

### Option B: Deploy via Vercel CLI
```bash
npx vercel
npx vercel --prod
```

---

## 👤 Author & License

* **Lead Architect & Developer**: **Ayush Gupta** ([@AyushGupta-Git07](https://github.com/AyushGupta-Git07))
* **Organization**: *National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Govt. of India*
* **License**: Released under the **[MIT License](LICENSE.md)**.
