import type { GeoSpot } from "~/types/map";
import type { FishType } from "~/types/type";

const DB_NAME = "laung_marine_offline_db";
const DB_VERSION = 1;

export interface LocalWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  notes?: string;
  createdAt: number;
}

export interface OfflineEmergencyItem {
  id: string;
  payload: {
    category: string;
    categoryLabel: string;
    latitude: number;
    longitude: number;
    crewCount: number;
    message?: string;
    timestamp: string;
  };
  queuedAt: number;
  status: "PENDING" | "SYNCED";
}

export interface StorageMetrics {
  tileCount: number;
  tileSizeBytes: number;
  zppiCount: number;
  waypointCount: number;
  outboxCount: number;
  lastUpdated: number | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("zppi_spots")) {
        db.createObjectStore("zppi_spots", { keyPath: "fishType" });
      }
      if (!db.objectStoreNames.contains("map_layers")) {
        db.createObjectStore("map_layers", { keyPath: "layerName" });
      }
      if (!db.objectStoreNames.contains("local_waypoints")) {
        db.createObjectStore("local_waypoints", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("emergency_outbox")) {
        db.createObjectStore("emergency_outbox", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cache_meta")) {
        db.createObjectStore("cache_meta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── ZPPI SPOTS STORAGE ─────────────────────────────────────────

export async function saveZppiSpotsOffline(
  fishType: FishType | string,
  spots: GeoSpot[],
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["zppi_spots", "cache_meta"], "readwrite");
      const store = tx.objectStore("zppi_spots");
      store.put({
        fishType,
        spots,
        savedAt: Date.now(),
      });

      const metaStore = tx.objectStore("cache_meta");
      metaStore.put({ key: "last_zppi_sync", value: Date.now() });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Gagal menyimpan ZPPI ke IndexedDB:", err);
  }
}

export async function getZppiSpotsOffline(
  fishType: FishType | string,
): Promise<GeoSpot[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("zppi_spots", "readonly");
      const store = tx.objectStore("zppi_spots");
      const req = store.get(fishType);

      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.spots)) {
          resolve(req.result.spots as GeoSpot[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ── MAP LAYERS (CHLOROPHYLL & SST) STORAGE ─────────────────────

export async function saveLayerOffline(
  layerName: "chlorophyll" | "sst" | "tides",
  data: unknown,
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("map_layers", "readwrite");
      const store = tx.objectStore("map_layers");
      store.put({
        layerName,
        data,
        savedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Gagal menyimpan layer ${layerName} offline:`, err);
  }
}

export async function getLayerOffline<T = unknown>(
  layerName: "chlorophyll" | "sst" | "tides",
): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("map_layers", "readonly");
      const store = tx.objectStore("map_layers");
      const req = store.get(layerName);

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ── WAYPOINT LOKAL (TITIK TANGKAPAN RAHASIA NELAYAN) ───────────

export async function saveCustomWaypoint(
  waypoint: Omit<LocalWaypoint, "id" | "createdAt"> & { id?: string },
): Promise<LocalWaypoint> {
  const item: LocalWaypoint = {
    id: waypoint.id ?? `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: waypoint.name.trim() || "Titik Tangkap Saya",
    lat: waypoint.lat,
    lng: waypoint.lng,
    notes: waypoint.notes,
    createdAt: Date.now(),
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("local_waypoints", "readwrite");
    const store = tx.objectStore("local_waypoints");
    store.put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCustomWaypoints(): Promise<LocalWaypoint[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("local_waypoints", "readonly");
      const store = tx.objectStore("local_waypoints");
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as LocalWaypoint[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteCustomWaypoint(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("local_waypoints", "readwrite");
      const store = tx.objectStore("local_waypoints");
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Gagal menghapus waypoint:", err);
  }
}

// ── OUTBOX DARURAT OFFLINE ─────────────────────────────────────

export async function queueEmergencyOffline(payload: {
  category: string;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  crewCount: number;
  message?: string;
}): Promise<OfflineEmergencyItem> {
  const item: OfflineEmergencyItem = {
    id: `emg_offline_${Date.now()}`,
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
    },
    queuedAt: Date.now(),
    status: "PENDING",
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("emergency_outbox", "readwrite");
    const store = tx.objectStore("emergency_outbox");
    store.put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedEmergencies(): Promise<OfflineEmergencyItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("emergency_outbox", "readonly");
      const store = tx.objectStore("emergency_outbox");
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as OfflineEmergencyItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedEmergency(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("emergency_outbox", "readwrite");
      const store = tx.objectStore("emergency_outbox");
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Gagal menghapus outbox darurat:", err);
  }
}

// ── METRIK STATISTIK MEMORI PERANGKAT ──────────────────────────

export async function getOfflineStorageMetrics(): Promise<StorageMetrics> {
  let tileCount = 0;
  let tileSizeBytes = 0;

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open("laung-map-tiles-v1");
      const keys = await cache.keys();
      tileCount = keys.length;
      // Estimasi rata-rata per tile OSM PNG ~18 KB
      tileSizeBytes = tileCount * 18 * 1024;
    } catch {
      // Abaikan jika Cache API tidak dapat diakses
    }
  }

  let zppiCount = 0;
  let waypointCount = 0;
  let outboxCount = 0;
  let lastUpdated: number | null = null;

  try {
    const db = await openDB();
    const tx = db.transaction(
      ["zppi_spots", "local_waypoints", "emergency_outbox", "cache_meta"],
      "readonly",
    );

    const zppiStore = tx.objectStore("zppi_spots");
    const wpStore = tx.objectStore("local_waypoints");
    const emgStore = tx.objectStore("emergency_outbox");
    const metaStore = tx.objectStore("cache_meta");

    const zppiItems = await new Promise<any[]>((res) => {
      const r = zppiStore.getAll();
      r.onsuccess = () => res(r.result || []);
    });
    zppiItems.forEach((item) => {
      if (item.spots && Array.isArray(item.spots)) {
        zppiCount += item.spots.length;
      }
    });

    const wpItems = await new Promise<any[]>((res) => {
      const r = wpStore.getAll();
      r.onsuccess = () => res(r.result || []);
    });
    waypointCount = wpItems.length;

    const emgItems = await new Promise<any[]>((res) => {
      const r = emgStore.getAll();
      r.onsuccess = () => res(r.result || []);
    });
    outboxCount = emgItems.length;

    const meta = await new Promise<any>((res) => {
      const r = metaStore.get("last_offline_pack_download");
      r.onsuccess = () => res(r.result);
    });
    if (meta && meta.value) lastUpdated = meta.value;
  } catch {
    // Abaikan jika IndexedDB gagal
  }

  return {
    tileCount,
    tileSizeBytes,
    zppiCount,
    waypointCount,
    outboxCount,
    lastUpdated,
  };
}

// ── SISTEM PRE-CACHE PETA & KOORDINAT AREA MELAUT ──────────────

function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

/**
 * Mengunduh paket peta offline dan seluruh titik koordinat satelit ke memori perangkat
 * Bounding box perairan Karangampel, Cirebon, Indramayu (Laut Jawa):
 * Lat: -6.0 s/d -6.7, Lng: 108.0 s/d 109.1
 */
export async function downloadOfflineFishingArea(
  onProgress?: (progress: {
    percentage: number;
    step: string;
    completed: number;
    total: number;
  }) => void,
): Promise<{ success: boolean; tilesDownloaded: number; error?: string }> {
  try {
    if (typeof window === "undefined" || !("caches" in window)) {
      throw new Error("Penyimpanan cache browser tidak didukung.");
    }

    const tileCache = await window.caches.open("laung-map-tiles-v1");

    // Definisikan batas wilayah operasional nelayan
    const minLat = -6.75;
    const maxLat = -6.1;
    const minLng = 108.2;
    const maxLng = 109.1;

    // Zoom level 8 hingga 11 memberikan detail navigasi laut yang sangat tajam tanpa membebani memori
    const zoomLevels = [8, 9, 10, 11];
    const tileUrls: string[] = [];

    const subdomains = ["a", "b", "c"];

    for (const z of zoomLevels) {
      const minX = lon2tile(minLng, z);
      const maxX = lon2tile(maxLng, z);
      const minY = lat2tile(maxLat, z);
      const maxY = lat2tile(minLat, z);

      for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
        for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
          const sub = subdomains[(x + y) % subdomains.length] ?? "a";
          tileUrls.push(`https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
        }
      }
    }

    // Unduh semua data koordinat satelit ZPPI untuk semua jenis ikan
    const fishTypes: FishType[] = ["umum", "tongkol", "tuna", "kembung"];
    const totalSteps = tileUrls.length + fishTypes.length + 2; // + chlor & sst
    let completedSteps = 0;

    const report = (step: string) => {
      completedSteps++;
      const percentage = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
      onProgress?.({
        percentage,
        step,
        completed: completedSteps,
        total: totalSteps,
      });
    };

    // 1. Unduh dan simpan data Satelit ZPPI
    for (const fish of fishTypes) {
      try {
        const res = await fetch(`/api/zppi?fish=${fish}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            await saveZppiSpotsOffline(fish, data);
          }
        }
      } catch (err) {
        console.warn(`Gagal pre-cache ZPPI ${fish}:`, err);
      }
      report(`Sinkronisasi Titik Ikan ${fish.toUpperCase()}`);
    }

    // 2. Unduh Klorofil & SST
    try {
      const [chlorRes, sstRes] = await Promise.all([
        fetch("/api/chlorophyll"),
        fetch("/api/sst"),
      ]);
      if (chlorRes.ok) {
        const chlorData = await chlorRes.json();
        await saveLayerOffline("chlorophyll", chlorData);
      }
      report("Sinkronisasi Peta Klorofil Laut");

      if (sstRes.ok) {
        const sstData = await sstRes.json();
        await saveLayerOffline("sst", sstData);
      }
      report("Sinkronisasi Suhu Permukaan Laut (SST)");
    } catch (err) {
      console.warn("Gagal pre-cache layer klorofil/sst:", err);
      report("Melanjutkan unduhan peta...");
    }

    // 3. Unduh Tile Peta secara paralel dalam batch 6 request bersamaan
    const batchSize = 6;
    for (let i = 0; i < tileUrls.length; i += batchSize) {
      const batch = tileUrls.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (url) => {
          try {
            // Periksa apakah sudah ada di cache
            const match = await tileCache.match(url);
            if (!match) {
              const res = await fetch(url, { mode: "cors" });
              if (res.ok) {
                await tileCache.put(url, res);
              }
            }
          } catch {
            // Abaikan kegagalan tile individual
          } finally {
            report(`Menyimpan Tile Peta (${completedSteps}/${totalSteps})`);
          }
        }),
      );
    }

    // Simpan metadata waktu unduh
    try {
      const db = await openDB();
      const tx = db.transaction("cache_meta", "readwrite");
      const store = tx.objectStore("cache_meta");
      store.put({ key: "last_offline_pack_download", value: Date.now() });
    } catch {
      // Abaikan jika metadata gagal disimpan
    }

    return { success: true, tilesDownloaded: tileUrls.length };
  } catch (error: any) {
    return {
      success: false,
      tilesDownloaded: 0,
      error: error?.message || "Gagal mengunduh peta offline",
    };
  }
}

/**
 * Hapus cache peta untuk membersihkan memori jika diperlukan
 */
export async function clearOfflineMapTiles(): Promise<void> {
  if (typeof window !== "undefined" && "caches" in window) {
    await window.caches.delete("laung-map-tiles-v1");
  }
}
