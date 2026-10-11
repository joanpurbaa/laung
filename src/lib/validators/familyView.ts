import { z } from "zod";

export const startFamilyViewSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .max(20, "Nomor WhatsApp terlalu panjang"),
  message: z
    .string()
    .max(1500, "Pesan maksimal 1500 karakter")
    .optional()
    .default(""),
  frequencyPerHour: z
    .number()
    .int()
    .min(1, "Frekuensi minimal 1x per jam")
    .max(4, "Frekuensi maksimal 4x per jam")
    .optional()
    .default(1),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional()
    .default(null),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional()
    .default(null),
});

export type StartFamilyViewInput = z.infer<typeof startFamilyViewSchema>;

export const laporHilangSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi")
    .max(50, "Username terlalu panjang"),
  code: z
    .string()
    .trim()
    .min(1, "Kode laporan wajib diisi")
    .max(20, "Kode laporan tidak valid"),
  reporterName: z
    .string()
    .trim()
    .min(2, "Nama pelapor minimal 2 karakter")
    .max(120, "Nama pelapor terlalu panjang"),
  reporterPhone: z
    .string()
    .trim()
    .min(1, "Nomor telepon pelapor wajib diisi")
    .max(20, "Nomor telepon pelapor tidak valid")
    .refine(
      (value) => {
        const digits = value.replace(/[^0-9]/g, "");
        return digits.length >= 9 && digits.length <= 15;
      },
      { message: "Nomor telepon pelapor tidak valid" },
    ),
  keterangan: z
    .string()
    .max(1500, "Keterangan maksimal 1500 karakter")
    .optional()
    .default(""),
});

export type LaporHilangInput = z.infer<typeof laporHilangSchema>;