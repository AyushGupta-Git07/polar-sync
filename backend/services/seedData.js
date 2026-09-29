const seedCargo = [
  {
    id: "C-102",
    nomenclature: "Caterpillar Generator Overhaul Spares & Lubricants",
    weightMt: 14.2,
    route: "Cape Town Port → Maitri Fast-Ice Staging",
    status: "Delayed (Fast-Ice Ridge)",
    statusCode: "delayed",
    eta: "+10 Days Delay",
    coldChain: "Ambient Ruggedized (-30°C)",
    imdgClass: "Class 9 Miscellaneous Dangerous Goods",
    rfidTag: "NCPOR-RFID-C102-9901",
    qrCode: "NCPOR-44ISEA-CRG-C102",
    dependency: "Station Primary Heating & Science Dome Microgrid",
    priority: "CRITICAL"
  },
  {
    id: "C-103",
    nomenclature: "Medical Trauma Cryo-Supplies & Whole Blood Plasma",
    weightMt: 6.8,
    route: "Cape Town Port → Maitri Base Medical Bay",
    status: "On Schedule (Cold Chain Verified)",
    statusCode: "nominal",
    eta: "02 Jan 2027",
    coldChain: "Strict Cryo Cold-Chain (-20°C Monitored)",
    imdgClass: "Biological Category B (UN 3373)",
    rfidTag: "NCPOR-RFID-C103-8821",
    qrCode: "NCPOR-44ISEA-CRG-C103",
    dependency: "Trauma Bay & Expedition Field Sorties",
    priority: "HIGH"
  },
  {
    id: "C-105",
    nomenclature: "Deep Ice-Core GPR Radar Sensors & Lithium Solar Packs",
    weightMt: 9.4,
    route: "Novo Air Terminal → Maitri Base",
    status: "In Transit (En-Route)",
    statusCode: "transit",
    eta: "05 Jan 2027",
    coldChain: "Insulated Dry Goods",
    imdgClass: "Lithium Ion Batteries (UN 3480 Class 9)",
    rfidTag: "NCPOR-RFID-C105-7734",
    qrCode: "NCPOR-44ISEA-CRG-C105",
    dependency: "Borehole Glaciology Field Survey",
    priority: "MEDIUM"
  },
  {
    id: "C-101",
    nomenclature: "Arctic Diesel ATF-50 Sub-Zero Winterized Fuel",
    weightMt: 12.0,
    route: "Dakshin Gangotri Shelf Staging → Maitri Tank Farm",
    status: "Arrived Shelf Staging (Staged)",
    statusCode: "staged",
    eta: "At Coastal Staging",
    coldChain: "Bulk Liquid (-50°C Antifreeze Additive)",
    imdgClass: "Flammable Liquid Class 3 (UN 1202)",
    rfidTag: "NCPOR-RFID-C101-1102",
    qrCode: "NCPOR-44ISEA-CRG-C101",
    dependency: "Station Primary Heating & Fleet Fueling",
    priority: "HIGH"
  },
  {
    id: "C-104",
    nomenclature: "Emergency High-Calorie Subsistence Freeze-Dried Rations",
    weightMt: 6.1,
    route: "Novo Air Runway → Maitri Main Food Store",
    status: "In Transit (En-Route)",
    statusCode: "transit",
    eta: "04 Jan 2027",
    coldChain: "Hermetically Sealed Moisture Barrier",
    imdgClass: "Non-Hazardous Provisions",
    rfidTag: "NCPOR-RFID-C104-4421",
    qrCode: "NCPOR-44ISEA-CRG-C104",
    dependency: "Station Nutrition & Field Emergency Caches",
    priority: "NOMINAL"
  }
];

const seedInventory = [
  {
    id: "INV-FUEL-01",
    nomenclature: "Arctic Diesel ATF-50 (Winterized -50°C)",
    depot: "Maitri Main Tank Farm 01",
    stock: 28500,
    unit: "Liters",
    dailyBurnRate: 540,
    daysLeft: 52.7,
    reorderThreshold: 10000,
    status: "Normal",
    statusCode: "good"
  },
  {
    id: "INV-RATION-01",
    nomenclature: "Emergency Freeze-Dried Nutrition Rations",
    depot: "Sub-Zero Provisions Vault Alpha",
    stock: 4200,
    unit: "kg",
    dailyBurnRate: 110,
    daysLeft: 38.1,
    reorderThreshold: 1200,
    status: "Normal",
    statusCode: "good"
  },
  {
    id: "INV-SPARE-01",
    nomenclature: "Cummins 250kVA Generator Oil & Air Filter Kits",
    depot: "Power Vault Spares Bay",
    stock: 4,
    unit: "Kits",
    dailyBurnRate: 1,
    daysLeft: 4.0,
    reorderThreshold: 8,
    status: "CRITICAL BUFFER (Gated by C-102)",
    statusCode: "critical"
  },
  {
    id: "INV-MED-01",
    nomenclature: "Trauma Cold-Chain Blood Plasma & Hypothermia Packs",
    depot: "Medical Clinic Cryo-Store",
    stock: 12,
    unit: "Cryo Packs",
    dailyBurnRate: 1,
    daysLeft: 12.0,
    reorderThreshold: 10,
    status: "Watch Status",
    statusCode: "warn"
  },
  {
    id: "INV-HYD-01",
    nomenclature: "PistenBully Arctic Viscosity Hydraulic Fluid (-55°C)",
    depot: "Hangar Bay 01 Lube Rack",
    stock: 850,
    unit: "Liters",
    dailyBurnRate: 18,
    daysLeft: 47.2,
    reorderThreshold: 300,
    status: "Normal",
    statusCode: "good"
  }
];

const seedAssets = [
  {
    id: "PB-04",
    name: "PistenBully 300 Polar Snowcat",
    type: "Heavy Terrain Prime Mover",
    location: "Waypoint 4 (Schirmacher Margin)",
    conditionPct: 42,
    hoursRun: 4120,
    serviceDueHours: 4000,
    status: "Overhaul Overdue / Valve Seizure Watch",
    statusCode: "critical",
    rfidTag: "NCPOR-RFID-PB04-890",
    qrCode: "NCPOR-44ISEA-AST-PB04"
  },
  {
    id: "PB-07",
    name: "PistenBully 300 Polar Snowcat (Standby)",
    type: "Heavy Terrain Escort & Rescue",
    location: "Maitri Station Hangar Bay-01",
    conditionPct: 92,
    hoursRun: 1840,
    serviceDueHours: 2500,
    status: "Operational / Standby Relief Ready",
    statusCode: "good",
    rfidTag: "NCPOR-RFID-PB07-310",
    qrCode: "NCPOR-44ISEA-AST-PB07"
  },
  {
    id: "PB-02",
    name: "Kässbohrer Heavy Freight Sledge Tractor",
    type: "Ice Shelf Logistics Sledge",
    location: "Dakshin Gangotri Shelf Staging",
    conditionPct: 84,
    hoursRun: 2950,
    serviceDueHours: 3500,
    status: "Operational Staged",
    statusCode: "good",
    rfidTag: "NCPOR-RFID-PB02-120",
    qrCode: "NCPOR-44ISEA-AST-PB02"
  },
  {
    id: "GEN-01",
    name: "Cummins 250kVA Polar Generator Unit 01",
    type: "Primary Power Microgrid",
    location: "Station Power Vault Bus A",
    conditionPct: 96,
    hoursRun: 8120,
    serviceDueHours: 9000,
    status: "Online Nominal Load (118 kW)",
    statusCode: "good",
    rfidTag: "NCPOR-RFID-GEN01-550",
    qrCode: "NCPOR-44ISEA-AST-GEN01"
  },
  {
    id: "GEN-02",
    name: "Cummins 250kVA Polar Generator Unit 02",
    type: "Secondary Power Microgrid",
    location: "Station Power Vault Bus B",
    conditionPct: 68,
    hoursRun: 8450,
    serviceDueHours: 8500,
    status: "Overhaul Gated (Awaiting C-102 Filters)",
    statusCode: "warn",
    rfidTag: "NCPOR-RFID-GEN02-551",
    qrCode: "NCPOR-44ISEA-AST-GEN02"
  },
  {
    id: "H-01",
    name: "Kamov Ka-32 Polar Heavy Helicopter (VT-NCP)",
    type: "Aviation Air Support",
    location: "Maitri Helipad Apron",
    conditionPct: 94,
    hoursRun: 940,
    serviceDueHours: 1200,
    status: "Flight Ready (Weather Window Dependent)",
    statusCode: "good",
    rfidTag: "NCPOR-RFID-H01-998",
    qrCode: "NCPOR-44ISEA-AST-H01"
  }
];

const seedPersonnel = [
  {
    id: "NCPOR-44-01",
    name: "Dr. Arvind Shrivastava",
    role: "Expedition Leader (Chief Scientist)",
    department: "Executive & Science Direction",
    station: "Maitri Base",
    location: "Main Hab Alpha",
    vitals: { tempC: 36.8, heartRate: 72, spo2: 98 },
    bloodGroup: "O+",
    status: "Active on Station"
  },
  {
    id: "NCPOR-44-02",
    name: "Ashish Saini",
    role: "Operations & Logistics Officer",
    department: "Logistics & Supply Chain",
    station: "Maitri Base",
    location: "Logistics Terminal",
    vitals: { tempC: 36.7, heartRate: 74, spo2: 98 },
    bloodGroup: "B+",
    status: "Active on Station"
  },
  {
    id: "NCPOR-44-03",
    name: "Col. Rajesh Verma",
    role: "Station Commander & Safety Officer",
    department: "Station Administration",
    station: "Maitri Base",
    location: "Operations Bridge",
    vitals: { tempC: 36.6, heartRate: 68, spo2: 97 },
    bloodGroup: "A+",
    status: "Active on Station"
  },
  {
    id: "NCPOR-44-04",
    name: "Dr. Priya Deshmukh",
    role: "Chief Medical Officer",
    department: "Medical & Life Safety",
    station: "Maitri Base",
    location: "Trauma Bay Clinic",
    vitals: { tempC: 36.9, heartRate: 76, spo2: 99 },
    bloodGroup: "AB+",
    status: "Active on Duty"
  },
  {
    id: "NCPOR-44-05",
    name: "Suresh Nair",
    role: "Chief Mechanical Engineer",
    department: "Fleet & Microgrid Maintenance",
    station: "Maitri Base",
    location: "Hangar Bay 01",
    vitals: { tempC: 36.7, heartRate: 80, spo2: 98 },
    bloodGroup: "O+",
    status: "Active on Duty"
  },
  {
    id: "NCPOR-44-06",
    name: "Dr. Sandeep Kulkarni",
    role: "Lead Glaciologist (Field Alpha Lead)",
    department: "Glaciology & Ice Core Survey",
    station: "Maitri Base",
    location: "Field Team Alpha (Waypoint 4)",
    vitals: { tempC: 36.5, heartRate: 82, spo2: 96 },
    bloodGroup: "B+",
    status: "Field Sortie Active"
  }
];

const seedIncidents = [
  {
    id: "INC-2026-081",
    type: "Equipment Mechanical Seizure",
    severity: "Elevated",
    timestamp: new Date(Date.now() - 3600 * 2000).toISOString(),
    details: "PB-04 hydraulic valve freeze warning triggered at Waypoint 4 during ice-shelf transect.",
    status: "Under Monitoring",
    reportedBy: "Suresh Nair"
  },
  {
    id: "INC-2026-079",
    type: "Maritime Fast-Ice Ingress",
    severity: "High",
    timestamp: new Date(Date.now() - 3600 * 14000).toISOString(),
    details: "Vessel C-102 locked in heavy fast-ice at 68°S. Generator spare parts delivery delayed +10 to +14 days.",
    status: "Contingency Active",
    reportedBy: "Ashish Saini"
  }
];

const seedGis = {
  stations: [
    {
      id: "maitri",
      name: "Maitri Base (India)",
      sector: "Queen Maud Land (Schirmacher Oasis)",
      coords: [-70.7663, 11.7333],
      elevationM: 117,
      status: "Operational Primary Hub",
      personnel: 38
    },
    {
      id: "bharati",
      name: "Bharati Base (India)",
      sector: "Larsemann Hills, East Antarctica",
      coords: [-69.4075, 76.1872],
      elevationM: 35,
      status: "Operational Coastal Hub",
      personnel: 24
    },
    {
      id: "dakshin",
      name: "Dakshin Gangotri Staging Hut",
      sector: "Ice Shelf Coastal Edge",
      coords: [-70.0833, 12.0000],
      elevationM: 45,
      status: "Fuel Staging & Sledge Depot",
      personnel: 0
    }
  ],
  sorties: [
    {
      id: "alpha",
      name: "Field Team Alpha (Glaciology)",
      coords: [-70.7200, 11.9500],
      vehicle: "PB-04 Snowcat",
      leader: "Dr. Sandeep Kulkarni",
      personnelCount: 5,
      status: "Sortie Active (WP-4)"
    },
    {
      id: "bravo",
      name: "Field Team Bravo (Seismic & Core)",
      coords: [-70.7950, 11.5500],
      vehicle: "PB-07 Snowcat",
      leader: "Dr. Priya Nair",
      personnelCount: 4,
      status: "Sortie Active (Wohlthat Margin)"
    }
  ],
  crevasseHazards: [
    {
      name: "Schirmacher Shelf Crevasse Shear Zone Alpha",
      polygon: [
        [-70.650, 11.800],
        [-70.680, 12.100],
        [-70.710, 12.050],
        [-70.670, 11.750]
      ],
      severity: "CRITICAL HAZARD - GPR REQUIRED"
    }
  ]
};

function seedDatabase(db) {
  db.initCollection('cargo', seedCargo);
  db.initCollection('inventory', seedInventory);
  db.initCollection('assets', seedAssets);
  db.initCollection('personnel', seedPersonnel);
  db.initCollection('incidents', seedIncidents);
  db.initCollection('gis_stations', seedGis.stations);
  db.initCollection('gis_sorties', seedGis.sorties);
  db.initCollection('gis_hazards', seedGis.crevasseHazards);
  console.log('[*] Polar logistics collections initialized with official 44-ISEA operational data.');
}

module.exports = {
  seedDatabase,
  seedCargo,
  seedInventory,
  seedAssets,
  seedPersonnel,
  seedIncidents,
  seedGis
};
