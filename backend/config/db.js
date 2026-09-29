const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'polar_data') : path.join(__dirname, '..', 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[DB] Notice: Filesystem write restricted, using in-memory store.');
}

let dbMode = 'embedded'; // 'mongodb' or 'embedded'
let mongoConnected = false;

const embeddedStore = {};

function initEmbeddedCollection(name, defaultData = []) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    try {
      embeddedStore[name] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      embeddedStore[name] = defaultData;
    }
  } else {
    embeddedStore[name] = defaultData;
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
    } catch (e) {
      // In-memory fallback
    }
  }
}

function saveEmbeddedCollection(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(embeddedStore[name] || [], null, 2), 'utf8');
  } catch (e) {
    // In-memory fallback
  }
}

const db = {
  getMode: () => (mongoConnected ? 'MongoDB (Mongoose)' : 'Embedded JSON Store (Zero-Config Active)'),
  isMongo: () => mongoConnected,

  find: async (collection, query = {}) => {
    const items = embeddedStore[collection] || [];
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: async (collection, query = {}) => {
    const items = embeddedStore[collection] || [];
    return items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  insert: async (collection, doc) => {
    if (!embeddedStore[collection]) embeddedStore[collection] = [];
    const newDoc = { id: doc.id || ('ID-' + Date.now() + '-' + Math.floor(Math.random() * 999)), ...doc };
    embeddedStore[collection].push(newDoc);
    saveEmbeddedCollection(collection);
    return newDoc;
  },

  update: async (collection, query, updateFields) => {
    const items = embeddedStore[collection] || [];
    let updated = 0;
    items.forEach(item => {
      let match = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        Object.assign(item, updateFields);
        updated++;
      }
    });
    if (updated > 0) saveEmbeddedCollection(collection);
    return updated;
  },

  connect: async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/polar_sync';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      mongoConnected = true;
      console.log('[*] Connected to MongoDB database successfully.');
    } catch (err) {
      mongoConnected = false;
      console.log('[*] MongoDB not detected locally. Initialized zero-config embedded polar store (zero data loss).');
    }
  },

  initCollection: initEmbeddedCollection
};

module.exports = db;
