import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const OfflineContext = createContext(null);

const DB_NAME = 'PolarSyncOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_events';

// Initialize native IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load pending events from IndexedDB
  const refreshPendingEvents = async () => {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        setPendingEvents(req.result || []);
      };
    } catch (err) {
      console.warn('[IndexedDB] Error fetching queue:', err);
    }
  };

  useEffect(() => {
    refreshPendingEvents();

    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setIsOnline(true);
        triggerSync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Queue event into IndexedDB
  const queueEvent = async (eventType, payload) => {
    const eventItem = {
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      payload,
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(eventItem);
      tx.oncomplete = () => {
        refreshPendingEvents();
        // If online and not simulated offline, try immediate flush
        if (isOnline && !isSimulatedOffline) {
          triggerSync();
        }
      };
    } catch (err) {
      console.error('[IndexedDB] Failed to save event:', err);
    }
  };

  // Sync queued IndexedDB events with backend
  const triggerSync = async () => {
    if (syncing || isSimulatedOffline) return;

    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        const events = req.result || [];
        if (events.length === 0) return;

        setSyncing(true);
        try {
          const res = await api.syncEvents(events);
          if (res.status === 'success' || res.appliedCount > 0) {
            // Clear synced records
            const clearTx = db.transaction(STORE_NAME, 'readwrite');
            clearTx.objectStore(STORE_NAME).clear();
            clearTx.oncomplete = () => {
              setLastSyncTime(new Date().toLocaleTimeString());
              refreshPendingEvents();
            };
          }
        } catch (err) {
          console.warn('[Sync Engine] Server unreachable or sync failed:', err);
        } finally {
          setSyncing(false);
        }
      };
    } catch (err) {
      console.error('[Sync Engine] Error during sync run:', err);
      setSyncing(false);
    }
  };

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      setIsOnline(!next);
      if (!next) {
        setTimeout(triggerSync, 500);
      }
      return next;
    });
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline: isOnline && !isSimulatedOffline,
        isSimulatedOffline,
        pendingEvents,
        syncing,
        lastSyncTime,
        queueEvent,
        triggerSync,
        toggleSimulatedOffline,
        refreshPendingEvents
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
