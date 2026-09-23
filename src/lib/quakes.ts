export type MinMag = "all" | "5" | "6" | "7";
export type Period = "24h" | "48h" | "7d";

export interface Quake {
  id: string;
  mag: number | null;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth: number;
  url: string;
}

export interface QuakeResult {
  quakes: Quake[];
  capped: boolean;
  fetchedAt: number;
}

export const MAG_OPTIONS: { value: MinMag; label: string }[] = [
  { value: "all", label: "All" },
  { value: "5", label: "5.0+" },
  { value: "6", label: "6.0+" },
  { value: "7", label: "7.0+" },
];

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "24h", label: "Past 24 hours" },
  { value: "48h", label: "Past 48 hours" },
  { value: "7d", label: "Past 7 days" },
];

export type AgeBucket = "hour" | "day" | "old";

export function ageBucket(time: number, now = Date.now()): AgeBucket {
  const diff = now - time;
  if (diff < 3600_000) return "hour";
  if (diff < 86400_000) return "day";
  return "old";
}

export function magTier(mag: number | null): "low" | "mid" | "high" | "severe" {
  const m = mag ?? 0;
  if (m >= 7) return "severe";
  if (m >= 6) return "high";
  if (m >= 5) return "mid";
  return "low";
}

export function radiusFor(mag: number | null) {
  const m = Math.max(mag ?? 0, 0);
  return Math.max(3, m * m * 0.6);
}

export function relativeTime(time: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - time) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export function fmtMag(mag: number | null) {
  return mag == null ? "–" : mag.toFixed(1);
}

export function localTime(time: number) {
  return new Date(time).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
