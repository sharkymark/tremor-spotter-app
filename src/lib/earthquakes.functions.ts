import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Quake, QuakeResult } from "./quakes";

const LIMIT = 2000;
const TTL = 60_000;
const PERIOD_MS = { "24h": 86400_000, "48h": 172800_000, "7d": 604800_000 } as const;
const cache = new Map<string, { at: number; value: QuakeResult }>();

export const getEarthquakes = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        minMag: z.enum(["all", "5", "6", "7"]),
        period: z.enum(["24h", "48h", "7d"]),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<QuakeResult> => {
    const key = `${data.minMag}|${data.period}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.value;

    const params = new URLSearchParams({
      format: "geojson",
      orderby: "time",
      limit: String(LIMIT),
      starttime: new Date(Date.now() - PERIOD_MS[data.period]).toISOString(),
    });
    if (data.minMag !== "all") params.set("minmagnitude", data.minMag);

    const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`);
    if (!res.ok) {
      const body = await res.text();
      console.error(`USGS failed [${res.status}]: ${body}`);
      throw new Error(`Earthquake service unavailable (${res.status})`);
    }
    const json = (await res.json()) as {
      features: {
        id: string;
        properties: { mag: number | null; place: string | null; time: number; url: string };
        geometry: { coordinates: [number, number, number] };
      }[];
    };
    const quakes: Quake[] = json.features.map((f) => ({
      id: f.id,
      mag: f.properties.mag,
      place: f.properties.place ?? "Unknown location",
      time: f.properties.time,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      depth: f.geometry.coordinates[2],
      url: f.properties.url,
    }));
    const value: QuakeResult = {
      quakes,
      capped: quakes.length >= LIMIT,
      fetchedAt: Date.now(),
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  });
