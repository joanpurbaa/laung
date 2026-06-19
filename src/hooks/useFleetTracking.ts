"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "~/lib/supabase";
import {
  updateLocationAction,
  toggleShareLocationAction,
} from "~/lib/actions/location";

export interface FleetMember {
  userId: string;
  userName: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number;
  isSOS: boolean;
  lastSeen: string;
}

interface UseFleetTrackingOptions {
  isSharing: boolean;
  onSOSReceived?: (member: FleetMember) => void;
}

export function useFleetTracking({
  isSharing,
  onSOSReceived,
}: UseFleetTrackingOptions) {
  const [fleetMembers, setFleetMembers] = useState<FleetMember[]>([]);
  const [myLocation, setMyLocation] = useState<GeolocationCoordinates | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userMapRef = useRef<Map<string, string>>(new Map());

  const sendLocation = useCallback(async (coords: GeolocationCoordinates) => {
    // Hanya kirim kalau bergerak >10 meter (hemat baterai)
    if (lastSentRef.current) {
      const dist =
        Math.sqrt(
          (coords.latitude - lastSentRef.current.lat) ** 2 +
            (coords.longitude - lastSentRef.current.lng) ** 2,
        ) * 111000; // rough meter conversion
      if (dist < 10) return;
    }

    await updateLocationAction({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    });

    lastSentRef.current = { lat: coords.latitude, lng: coords.longitude };
  }, []);

  const fetchInitialFleetMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/fleet/members");
      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await response.json();
        const members = data as FleetMember[];
        setFleetMembers(members);

        members.forEach((m) => {
          userMapRef.current.set(m.userId, m.userName ?? "Nelayan");
        });
      } else {
        console.error("Failed to fetch fleet members:", response.statusText);
      }
    } catch (err) {
      console.error("Error fetching fleet members:", err);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS tidak didukung browser ini");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation(pos.coords);
        if (!lastSentRef.current && isSharing) {
          void sendLocation(pos.coords);
        }
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );

    if (isSharing && myLocation) {
      intervalRef.current = setInterval(() => {
        if (myLocation) void sendLocation(myLocation);
      }, 30000);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSharing, myLocation, sendLocation]);

  useEffect(() => {
    if (!isSharing) {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setFleetMembers([]);
      return;
    }

    void fetchInitialFleetMembers();

    const channel = supabase
      .channel("fleet-tracking", {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "live_locations",
    filter: "isSharing=eq.true",
  },
  (payload) => {
    // Kebal Crash: Jaga-jaga kalau payload.new kosong (misal pas event DELETE)
    if (!payload.new) return;

    const record = payload.new as Record<string, unknown>;
    const isShareActive = record.isSharing === true;
    const userId = record.userId as string;

    // Kalau status sharing-nya mati, langsung tendang dari map
    if (!isShareActive) {
      setFleetMembers((prev) => prev.filter((m) => m.userId !== userId));
      return;
    }

    const updated: FleetMember = {
      userId,
      userName: userMapRef.current.get(userId) ?? null,
      latitude: record.latitude as number,
      longitude: record.longitude as number,
      accuracy: record.accuracy as number | undefined,
      isSOS: record.isSOS === true,
      lastSeen: (record.lastSeen as string) ?? new Date().toISOString(),
    };

    setFleetMembers((prev) => {
      const exists = prev.findIndex((m) => m.userId === userId);
      if (updated.isSOS && onSOSReceived) {
        onSOSReceived(updated);
      }
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = updated;
        return next;
      }
      return [...prev, updated];
    });
  },
)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isSharing, onSOSReceived, fetchInitialFleetMembers]);

  const toggleSharing = useCallback(async (value: boolean) => {
    if (value) {
      lastSentRef.current = null;
    }

    await toggleShareLocationAction(value);
    if (!value) setFleetMembers([]);
  }, []);

  return { fleetMembers, myLocation, error, toggleSharing };
}
