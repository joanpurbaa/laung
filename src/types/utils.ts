export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getScoreLabel(score: number) {
  if (score >= 85) return { label: "Sangat Potensial", color: "#059669" };
  if (score >= 70) return { label: "Potensial", color: "#10b981" };
  if (score >= 55) return { label: "Sedang", color: "#f59e0b" };
  return { label: "Rendah", color: "#ef4444" };
}
