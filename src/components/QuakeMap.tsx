import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ageBucket, fmtMag, localTime, radiusFor, type Quake } from "@/lib/quakes";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function QuakeMap({
  quakes,
  focus,
}: {
  quakes: Quake[];
  focus: { id: string; n: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<string, L.CircleMarker>());

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, worldCopyJump: true }).setView([20, 0], 2);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.current.clear();
    const colors = {
      hour: cssVar("--quake-hour"),
      day: cssVar("--quake-day"),
      old: cssVar("--quake-old"),
    };
    const now = Date.now();
    [...quakes].reverse().forEach((q) => {
      const c = colors[ageBucket(q.time, now)];
      const mk = L.circleMarker([q.lat, q.lng], {
        radius: radiusFor(q.mag),
        color: c,
        weight: 1.5,
        fillColor: c,
        fillOpacity: 0.55,
      });
      mk.bindPopup(
        `<div class="quake-popup">
          <div class="qp-mag">M ${fmtMag(q.mag)}</div>
          <div class="qp-place">${esc(q.place)}</div>
          <dl>
            <dt>Time</dt><dd>${esc(localTime(q.time))}</dd>
            <dt>Coords</dt><dd>${q.lat.toFixed(3)}, ${q.lng.toFixed(3)}</dd>
            <dt>Depth</dt><dd>${q.depth.toFixed(1)} km</dd>
          </dl>
          <div class="qp-links">
            <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${q.lat},${q.lng}">Google Maps ↗</a>
            <a target="_blank" rel="noopener" href="${esc(q.url)}">USGS event ↗</a>
          </div>
        </div>`,
      );
      mk.addTo(g);
      markers.current.set(q.id, mk);
    });
  }, [quakes]);

  useEffect(() => {
    if (!focus || !map.current) return;
    const mk = markers.current.get(focus.id);
    if (!mk) return;
    map.current.flyTo(mk.getLatLng(), Math.max(map.current.getZoom(), 6), { duration: 1.2 });
    map.current.once("moveend", () => mk.openPopup());
  }, [focus]);

  return <div ref={el} className="absolute inset-0 z-0" />;
}
