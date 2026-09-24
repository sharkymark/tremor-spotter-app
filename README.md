# Quakewatch

A live earthquake tracker. See recent earthquakes worldwide on a full-screen map, filtered by magnitude and time period.

## Features

- Filters: minimum magnitude (All, 5.0+, 6.0+, 7.0+) and time period (past 24 hours, 48 hours, 7 days). Defaults: 5.0+ and past 24 hours.
- Map: circles sized by magnitude and colored by age (red = past hour, orange = past 24 hours, yellow = older). Click a circle for details plus Google Maps and USGS links.
- Side panel: total count, strongest quake, and a full list. Click a row to fly the map to that quake. On mobile the panel becomes a bottom sheet.
- Manual refresh: data loads only when you press Refresh. A "last updated" time is shown.
- Results are capped at 2,000, with a notice when the cap is hit.
- All times use your local time zone.

## Built with

- **Framework**: TanStack Start (v1), a full-stack React 19 framework with server-side logic and client hydration.
- **Frontend UI**: React 19 and TypeScript, styled with Tailwind CSS v4 and shadcn/ui (Radix UI primitives, Lucide icons).
- **Routing and state**: TanStack Router (type-safe, URL-synced filters) and TanStack Query (client-side caching).
- **Map**: Leaflet with free OpenStreetMap tiles. No API key needed.
- **Backend and data**: TanStack Start server functions query the USGS Earthquake Hazards Program API (`earthquake.usgs.gov`). Responses are cached for 60 seconds. The browser never calls USGS directly.
- **Build system**: Vite, with Nitro for server bundling.

## Development

You need Node.js and npm (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
