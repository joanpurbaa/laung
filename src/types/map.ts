import type { ComponentProps } from "react";
import { type FleetMember } from "~/hooks/useFleetTracking";
import type { LocalWaypoint } from "~/lib/offline-storage";

export interface GeoSpot {
  lat: number;
  lng: number;
  value: number;
  breakdown?: {
    chlorValue: number;
    sstValue: number;
    chlorCont: number;
    sstCont: number;
    tideCont: number;
  };
}

export interface RescueTarget {
  lat: number;
  lng: number;
  title: string;
  categoryLabel?: string;
}

export interface MapProps {
  viewMode: "zppi" | "chlorophyll" | "sst" | "tides";
  selectedSpot: GeoSpot | null;
  onSpotSelect: (spot: GeoSpot) => void;
  fishType: string;
  baseOrigin: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  recenterTrigger: number;
  fleetMembers?: FleetMember[];
  myLocation?: GeolocationCoordinates | null;
  customWaypoints?: LocalWaypoint[];
  rescueTarget?: RescueTarget | null;
  onClearRescueRoute?: () => void;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type ActualMapProps = ComponentProps<typeof import("~/app/_components/Map").default>;

export interface MapClientProps extends ActualMapProps {
  fleetMembers?: FleetMember[];
  myLocation?: GeolocationCoordinates | null;
}
