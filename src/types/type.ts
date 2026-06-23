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

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: "info" | "danger" | "success";
  action: () => void | Promise<void>;
}

export type ViewMode = "zppi" | "chlorophyll" | "sst" | "tides";
export type FishType = "umum" | "tongkol" | "tuna" | "kembung";
export type SheetTab = "rute" | "analisis" | "top_spot";
