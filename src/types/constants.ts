import { MessageCircle, Rocket, Leaf, Thermometer } from "lucide-react";

export const LAYER_OPTIONS = [
  { value: "pesan", icon: MessageCircle, label: "Pesan" },
  { value: "zppi", icon: Rocket, label: "ZPPI" },
  { value: "chlorophyll", icon: Leaf, label: "Klorofil" },
  { value: "sst", icon: Thermometer, label: "Suhu" },
] as const;

export const FISH_OPTIONS = [
  { value: "umum", emoji: "🎣", label: "Semua Jenis" },
  { value: "tongkol", emoji: "🐟", label: "Tongkol" },
  { value: "tuna", emoji: "🐠", label: "Tuna" },
  { value: "kembung", emoji: "🐡", label: "Kembung" },
] as const;

export const baseOrigin = { lat: -6.48, lng: 108.6 };
