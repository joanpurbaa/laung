import { z } from "zod";

export const FISH_TYPES = ["Tongkol", "Tuna", "Kembung", "Tenggiri"] as const;
export const LOCATIONS = [
  "Spot A (Karangampel)",
  "Spot B (Utara Indramayu)",
  "Spot C (Zona Luar)",
] as const;

export const catchLogSchema = z.object({
  fishType: z.enum(FISH_TYPES, { message: "Jenis ikan tidak valid" }),
  weight: z.coerce
    .number({ message: "Berat harus berupa angka" })
    .positive({ message: "Berat harus lebih dari 0" }),
  location: z.enum(LOCATIONS, { message: "Lokasi tidak valid" }),
});

export type CatchLogInput = z.infer<typeof catchLogSchema>;
