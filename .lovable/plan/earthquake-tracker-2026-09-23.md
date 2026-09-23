# Earthquake Tracker

A full-screen dark map of recent earthquakes worldwide, with filters, a details panel, and manual refresh.

## What you'll get

**Header**
- App title, current filter summary, "last updated" time in your local time zone
- Refresh button that spins while loading and re-fetches the current filters
- No auto-refresh

**Filters**
- Minimum magnitude: All, 5.0+, 6.0+, 7.0+ (default 5.0+)
- Time period: Past 24 hours, Past 48 hours, Past 7 days (default 24 hours)
- Choosing "All" with 7 days caps the list at 2,000 quakes and shows a notice explaining the cap

**Map**
- Full-screen Leaflet map, light-on-dark CARTO Positron tiles, no API key needed
- One circle per quake: size grows with magnitude, color shows age — red (past hour), orange (past 24 hours), yellow (older)
- Click a circle for a popup with magnitude, place, local time, coordinates, depth, a Google Maps link, and the USGS event page link

**Side panel**
- Collapsible list; full place names, never truncated
- Colored magnitude badge, relative time ("12 min ago"), depth
- Total count and the strongest quake pinned at the top
- Clicking a row flies the map to that quake
- Becomes a swipe-up bottom sheet on phones

**Data**
- All quake data comes from our own backend endpoint; the browser never calls USGS directly
- Responses cached for 60 seconds so repeated refreshes stay fast

## Technical notes

- Server function `getEarthquakes` (TanStack Start, `src/lib/earthquakes.functions.ts`) with a Zod-validated input of `{ minMagnitude: 'all' | '5' | '6' | '7', period: '24h' | '48h' | '7d' }`. It builds a USGS FDSN query with `format=geojson`, `starttime` (ISO, now minus period), `minmagnitude` when not "all", `orderby=time`, and `limit=2000`; returns a trimmed DTO array plus `capped`, `total`, and `fetchedAt`.
- In-module `Map` cache keyed by the filter pair with a 60s TTL, holding the trimmed result.
- Frontend uses TanStack Query (`staleTime` 60s, no refetch interval); the refresh button invalidates the query.
- Leaflet loaded browser-only: map component behind `React.lazy` + `<ClientOnly>`; shared quake types live in a separate browser-safe module so SSR never pulls in Leaflet.
- Dark design tokens defined in `src/styles.css` (oklch) — no hardcoded color utilities. Circles use `L.circleMarker` with radius derived from magnitude.
- `src/routes/index.tsx` becomes the app, with its own `head()` metadata.
