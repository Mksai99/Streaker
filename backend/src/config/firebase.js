import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { supabaseDb, supabaseClient } from './supabase.js';

let db;
let auth;

// ── Firebase Admin Init (for Google Auth verification) ──
let firebaseAdminReady = false;
try {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  auth = admin.auth();
  firebaseAdminReady = true;
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error.message);
  
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL ERROR: Firebase Admin failed to initialize in production. Terminating process.');
    process.exit(1);
  }

  // Mock Auth fallback for local development ONLY
  console.warn('⚠️ Using insecure mock Auth fallback for development.');
  auth = {
    createUser: async (data) => ({ uid: `mock_${Date.now()}`, ...data }),
    getUser: async (uid) => ({ uid, email: 'mock@test.com', displayName: 'Mock User' }),
    getUserByEmail: async (email) => ({ uid: `mock_${Date.now()}`, email }),
    updateUser: async (uid, data) => ({ uid, ...data }),
    deleteUser: async (uid) => ({}),
    verifyIdToken: async (token) => ({ uid: `mock_${Date.now()}`, email: 'mock@test.com' }),
    generatePasswordResetLink: async (email) => 'https://mock-reset-link.com',
    setCustomUserClaims: async (uid, claims) => ({})
  };
}

// ── Local JSON Database (always used — no Firestore dependency) ──
const dbPath = path.resolve(process.cwd(), 'mockDb.json');

let mockStore = {};
if (fs.existsSync(dbPath)) {
  try { mockStore = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) { mockStore = {}; }
}

const saveStore = () => {
  fs.writeFileSync(dbPath, JSON.stringify(mockStore, null, 2));
};

const createMockCollection = (name) => {
  if (!mockStore[name]) mockStore[name] = {};
  
  return {
    doc: (id) => ({
      get: async () => ({
        exists: !!mockStore[name]?.[id],
        id,
        data: () => mockStore[name]?.[id] || null,
        ref: { id }
      }),
      set: async (data, options) => {
        if (options?.merge) {
          mockStore[name][id] = { ...mockStore[name][id], ...data };
        } else {
          mockStore[name][id] = { ...data };
        }
        saveStore();
        return { id };
      },
      update: async (data) => {
        mockStore[name][id] = { ...mockStore[name][id], ...data };
        saveStore();
        return { id };
      },
      delete: async () => {
        delete mockStore[name][id];
        saveStore();
        return { id };
      },
      collection: (subName) => createMockCollection(`${name}/${id}/${subName}`)
    }),
    add: async (data) => {
      const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      mockStore[name][id] = { ...data };
      saveStore();
      return { id, path: `${name}/${id}` };
    },
    where: (...args) => createMockQuery(name, [args]),
    orderBy: (...args) => createMockQuery(name, [], [args]),
    limit: (n) => createMockQuery(name, [], [], n),
    get: async () => {
      const docs = Object.entries(mockStore[name] || {}).map(([id, data]) => ({
        id,
        exists: true,
        data: () => data,
        ref: { id }
      }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    }
  };
};

const createMockQuery = (name, whereArgs = [], orderArgs = [], limitNum = 100) => {
  return {
    where: (...args) => createMockQuery(name, [...whereArgs, args], orderArgs, limitNum),
    orderBy: (...args) => createMockQuery(name, whereArgs, [...orderArgs, args], limitNum),
    limit: (n) => createMockQuery(name, whereArgs, orderArgs, n),
    startAfter: () => createMockQuery(name, whereArgs, orderArgs, limitNum),
    get: async () => {
      let entries = Object.entries(mockStore[name] || {});
      
      // Apply where filters
      for (let i = 0; i < whereArgs.length; i++) {
        const [field, op, value] = whereArgs[i] || [];
        if (field && op && value !== undefined) {
          entries = entries.filter(([, data]) => {
            const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], data);
            switch (op) {
              case '==': return fieldValue === value;
              case '!=': return fieldValue !== value;
              case '>': return fieldValue > value;
              case '>=': return fieldValue >= value;
              case '<': return fieldValue < value;
              case '<=': return fieldValue <= value;
              case 'in': return Array.isArray(value) && value.includes(fieldValue);
              case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(value);
              default: return true;
            }
          });
        }
      }

      const docs = entries.slice(0, limitNum).map(([id, data]) => ({
        id,
        exists: true,
        data: () => data,
        ref: { id }
      }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    }
  };
};

if (process.env.SUPABASE_URL) {
  db = supabaseDb;
  console.log('✅ Supabase initialized successfully (using Supabase adapter)');
} else {
  db = {
    collection: createMockCollection,
    batch: () => ({
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {}
    }),
    runTransaction: async (fn) => {
      const transaction = {
        get: async (ref) => ({ exists: false, data: () => null }),
        set: () => {},
        update: () => {},
        delete: () => {}
      };
      return fn(transaction);
    }
  };
  console.log('✅ Firebase Admin initialized successfully (with local DB)');
}

// Firestore field value helpers
const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (n) => n,
  arrayUnion: (...elements) => elements,
  arrayRemove: (...elements) => elements,
  delete: () => null
};

const Timestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }),
  fromDate: (date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) })
};

export { db, auth, admin, FieldValue, Timestamp, supabaseClient };
