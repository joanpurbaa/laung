import "server-only";

const USER_AGENT = "ZPPI-Fisherman-App-Laung";
const REQUEST_GAP_MS = 1000;

let requestQueue: Promise<unknown> = Promise.resolve();

async function runSerialized<T>(task: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(task);
  requestQueue = result.catch(() => null).then(waitForGap);
  return result;
}

function waitForGap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS));
}

export interface ReverseGeocodeResult {
  rawAddress: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  return runSerialized(async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=10`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as {
        address?: Record<string, string>;
      };
      const address = json.address ?? {};
      const raw =
        address.city ??
        address.regency ??
        address.county ??
        address.municipality ??
        address.state ??
        "Lokasi GPS";
      if (raw === "Lokasi GPS") return null;
      return raw.replace(/(Kabupaten|Kota|Regency)\s+/gi, "").trim();
    } catch {
      return null;
    }
  });
}