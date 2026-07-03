export interface WeatherData {
  windSpeed: number;
  windDir: string;
  waveHeight: number;
  visibility: number;
  condition: string;
  conditionIcon: string;
  tempAir: number;
  humidity: number;
  safeToSail: boolean;
  stale?: boolean;
}