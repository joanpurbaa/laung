export type SOSState = "idle" | "confirm" | "sending" | "active" | "resolving";

export type EmergencyCategory =
  | "ENGINE_FAILURE"
  | "SINKING_LEAK"
  | "MEDICAL_MAN_OVERBOARD"
  | "FUEL_OUT"
  | "WEATHER_CRITICAL"
  | "GENERAL_SOS";

export interface EmergencyCategoryOption {
  id: EmergencyCategory;
  label: string;
  sublabel: string;
  icon: string;
  severity: "high" | "critical";
  color: string;
}

export interface DetailedEmergencyReport {
  id: string;
  userId: string;
  userName: string;
  category: EmergencyCategory;
  categoryLabel: string;
  message?: string;
  crewCount: number;
  contactPhone?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  targetPoskoName?: string;
  distanceKm?: number;
  distanceNm?: number;
}

export interface MaritimePosko {
  id: string;
  name: string;
  fullName: string;
  type: "BASARNAS" | "POLAIRUD" | "TPI_PPI" | "KSOP";
  phone: string;
  whatsapp: string;
  radioChannel: string;
  latitude: number;
  longitude: number;
  locationName: string;
  description: string;
}
