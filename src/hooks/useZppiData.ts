import { useEffect, useMemo, useState } from "react";
import type { GeoSpot } from "~/types/map";
import type { TidePoint } from "~/types/tide";
import type { FishType } from "~/types/type";
import {
  getZppiSpotsOffline,
  saveZppiSpotsOffline,
  getLayerOffline,
  saveLayerOffline,
} from "~/lib/offline-storage";

export function useZppiData(fishType: FishType) {
  const [, setTideData] = useState<TidePoint[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<GeoSpot | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Load pasang surut (tides) dengan fallback IndexedDB
  useEffect(() => {
    let isCancelled = false;

    void getLayerOffline<TidePoint[]>("tides").then((cached) => {
      if (!isCancelled && cached && Array.isArray(cached) && cached.length > 0) {
        setTideData(cached);
      }
    });

    fetch("/api/tides")
      .then((r) => r.json())
      .then((tides) => {
        if (!isCancelled && Array.isArray(tides)) {
          setTideData(tides);
          void saveLayerOffline("tides", tides);
        }
      })
      .catch((err) => {
        console.warn("Gagal fetch tides online, menggunakan memori lokal:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Load data ZPPI dengan strategi offline-first (muat cepat dari IndexedDB, sync background)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setSheetExpanded(false);

    // 1. Coba muat seketika dari memori perangkat (IndexedDB)
    void getZppiSpotsOffline(fishType).then((cached) => {
      if (!isCancelled && cached && cached.length > 0) {
        setZppiSpots(cached);
        const sorted = [...cached].sort((a, b) => b.value - a.value);
        if (sorted.length > 0) setSelectedSpot(sorted[0] ?? null);
        setLoading(false);
        setIsOfflineData(true);
      }
    });

    // 2. Coba fetch pembaruan jaringan
    fetch(`/api/zppi?fish=${fishType}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((zppi) => {
        if (!isCancelled && Array.isArray(zppi)) {
          setZppiSpots(zppi);
          setIsOfflineData(false);
          const sorted = [...zppi].sort((a, b) => b.value - a.value);
          if (sorted.length > 0) setSelectedSpot(sorted[0] ?? null);
          void saveZppiSpotsOffline(fishType, zppi);
        }
        if (!isCancelled) setLoading(false);
      })
      .catch((err) => {
        console.warn("Fetch ZPPI online gagal, mengandalkan memori offline:", err);
        if (!isCancelled) {
          setIsOfflineData(true);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fishType]);

  const sortedSpots = useMemo(() => {
    if (zppiSpots.length === 0) return [];
    return [...zppiSpots].sort((a, b) => b.value - a.value);
  }, [zppiSpots]);

  const topSpot = sortedSpots[0] ?? null;
  const topSpots = useMemo(() => sortedSpots.slice(0, 3), [sortedSpots]);

  return {
    zppiSpots,
    loading,
    selectedSpot,
    setSelectedSpot,
    sheetExpanded,
    setSheetExpanded,
    sortedSpots,
    topSpot,
    topSpots,
    isOfflineData,
  };
}
