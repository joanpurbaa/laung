import { useEffect, useMemo, useState } from "react";
import type { GeoSpot } from "~/types/map";
import type { TidePoint } from "~/types/tide";
import type { FishType } from "~/types/type";

export function useZppiData(fishType: FishType) {
  const [, setTideData] = useState<TidePoint[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<GeoSpot | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/tides")
      .then((r) => r.json())
      .then((tides) => {
        if (Array.isArray(tides)) setTideData(tides);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setSheetExpanded(false);

    fetch(`/api/zppi?fish=${fishType}`)
      .then((r) => r.json())
      .then((zppi) => {
        if (Array.isArray(zppi)) {
          setZppiSpots(zppi);
          const sorted = [...zppi].sort((a, b) => b.value - a.value);
          if (sorted.length > 0) setSelectedSpot(sorted[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
  };
}
