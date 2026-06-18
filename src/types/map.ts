import type { ComponentProps } from "react";
import { type FleetMember } from "~/hooks/useFleetTracking";

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
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type ActualMapProps = ComponentProps<typeof import("./Map").default>;

export interface MapClientProps extends ActualMapProps {
  fleetMembers?: FleetMember[];
  myLocation?: GeolocationCoordinates | null;
}