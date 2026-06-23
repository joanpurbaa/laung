"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "~/lib/supabase";
import {
  updateLocationAction,
  toggleShareLocationAction,
  addSharelockRelationAction,
  removeSharelockRelationAction,
  getIncomingSharelockSendersAction,
  getOutgoingSharelockTargetsAction,
} from "~/lib/actions/location";

export interface FleetMember {
  userId: string;
  userName: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number;
  isSOS: boolean;
  lastSeen: string;
  isIncomingSharelock?: boolean;
}

interface UseFleetTrackingOptions {
  isSharing: boolean;
  myUserId: string | null | undefined;
  onSOSReceived?: (member: FleetMember) => void;
}

interface CustomWindow extends Window {
  onReceiveShareLock?: (record: Record<string, unknown>) => void;
}

export function useFleetTracking({
  isSharing,
  myUserId,
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

  const [incomingSenders, setIncomingSenders] = useState<Set<string>>(
    new Set(),
  );
  const [outgoingTargets, setOutgoingTargets] = useState<Set<string>>(
    new Set(),
  );
  const incomingSendersRef = useRef<Set<string>>(new Set());

  const refreshRelations = useCallback(async () => {
    if (!myUserId) return;
    try {
      const [inRes, outRes] = await Promise.all([
        getIncomingSharelockSendersAction(),
        getOutgoingSharelockTargetsAction(),
      ]);

      if (inRes.success) {
        const newSet = new Set(inRes.data);
        setIncomingSenders(newSet);
        incomingSendersRef.current = newSet;
      }
      if (outRes.success) {
        setOutgoingTargets(new Set(outRes.data));
      }
    } catch (err) {
      console.error("Gagal refresh relasi sharelock", err);
    }
  }, [myUserId]);

  useEffect(() => {
    void refreshRelations();
  }, [refreshRelations]);

  useEffect(() => {
    if (!myUserId) return;
    const id = setInterval(() => {
      void refreshRelations();
    }, 10_000);
    return () => clearInterval(id);
  }, [myUserId, refreshRelations]);

  useEffect(() => {
    if (!isSharing || incomingSenders.size === 0) return;

    const fetchInitialLocations = async () => {
      const { data, error } = await supabase
        .from("live_locations")
        .select("*")
        .in("userId", Array.from(incomingSenders));

      if (!error && data) {
        setFleetMembers((prev) => {
          const next = [...prev];
          data.forEach((record: any) => {
            const userId = record.userId || record.user_id;
            const idx = next.findIndex((m) => m.userId === userId);

            const memberData: FleetMember = {
              userId,
              userName: userMapRef.current.get(userId) ?? null,
              latitude: record.latitude,
              longitude: record.longitude,
              accuracy: record.accuracy,
              isSOS: record.isSOS === true,
              lastSeen: record.lastSeen || new Date().toISOString(),
              isIncomingSharelock: true,
            };

            if (idx >= 0) next[idx] = memberData;
            else next.push(memberData);
          });
          return next;
        });
      }
    };

    void fetchInitialLocations();
  }, [incomingSenders, isSharing]);

  const sendLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (lastSentRef.current) {
      const dist =
        Math.sqrt(
          (coords.latitude - lastSentRef.current.lat) ** 2 +
            (coords.longitude - lastSentRef.current.lng) ** 2,
        ) * 111000;
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
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation(pos.coords);
        if (!lastSentRef.current && isSharing) void sendLocation(pos.coords);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );

    if (isSharing && myLocation) {
      intervalRef.current = setInterval(() => {
        if (myLocation) void sendLocation(myLocation);
      }, 30000);
    }

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
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

    const channel = supabase
      .channel("fleet-tracking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: "isSharing=eq.true",
        },
        (payload) => {
          if (!payload.new) return;
          const record = payload.new as any;
          const userId = record.userId || record.user_id;

          if (record.isSharing === false) {
            setFleetMembers((prev) => prev.filter((m) => m.userId !== userId));
            return;
          }

          if (!record.isSOS && !incomingSendersRef.current.has(userId)) return;

          const updated: FleetMember = {
            userId,
            userName: userMapRef.current.get(userId) ?? null,
            latitude: record.latitude,
            longitude: record.longitude,
            accuracy: record.accuracy,
            isSOS: record.isSOS === true,
            lastSeen: record.lastSeen ?? new Date().toISOString(),
            isIncomingSharelock: incomingSendersRef.current.has(userId),
          };

          setFleetMembers((prev) => {
            const exists = prev.findIndex((m) => m.userId === userId);
            if (record.isSOS && onSOSReceived) onSOSReceived(updated);
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
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
    };
  }, [isSharing, myUserId, onSOSReceived]);

  const toggleSharing = useCallback(async (value: boolean) => {
    await toggleShareLocationAction(value);
    if (!value) setFleetMembers([]);
  }, []);

  const sharelockToUser = useCallback(async (targetUserId: string) => {
    await addSharelockRelationAction(targetUserId);
    setOutgoingTargets((prev) => new Set(prev).add(targetUserId));
  }, []);

  const unsharelockFromUser = useCallback(async (targetUserId: string) => {
    await removeSharelockRelationAction(targetUserId);
    setOutgoingTargets((prev) => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });
  }, []);

  return {
    fleetMembers,
    myLocation,
    error,
    toggleSharing,
    incomingSenders,
    outgoingTargets,
    sharelockToUser,
    unsharelockFromUser,
    refreshRelations,
  };
}
