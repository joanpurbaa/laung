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

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS tidak didukung browser ini");
      return;
    }

    // Watch position untuk update myLocation di peta
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation(pos.coords);
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );

    // Kirim ke server setiap 30 detik (hemat baterai vs setiap perubahan)
    if (isSharing) {
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
    if (!isSharing) return;

    const channel = supabase
      .channel("fleet-tracking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: "is_sharing=eq.true",
        },
        (payload) => {
          const record = payload.new as {
            user_id: string;
            latitude: number;
            longitude: number;
            is_sos: boolean;
            last_seen: string;
          };

          setFleetMembers((prev) => {
            const exists = prev.findIndex((m) => m.userId === record.user_id);
            const updated: FleetMember = {
              userId: record.user_id,
              userName: null,
              latitude: record.latitude,
              longitude: record.longitude,
              isSOS: record.is_sos,
              lastSeen: record.last_seen,
            };

            // Trigger SOS callback
            if (record.is_sos && onSOSReceived) {
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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isSharing, onSOSReceived]);

  const toggleSharing = useCallback(async (value: boolean) => {
    await toggleShareLocationAction(value);
    if (!value) setFleetMembers([]);
  }, []);

  return { fleetMembers, myLocation, error, toggleSharing };
}
