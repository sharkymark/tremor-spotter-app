# Earthquake Watcher

Build an earthquake tracker web app with a backend.

Backend: Create a backend function that queries the USGS FDSN Event API (https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson) using starttime and minmagnitude parameters, ordered by time, newest first. Cache each response for 60 seconds. The frontend should only call this backend, never USGS directly.

Filters: Minimum magnitude: All, 5.0+, 6.0+, 7.0+. Time period: Past 24 hours, Past 48 hours, Past 7 days. Default to 5.0+ and Past 24 hours. When 'All' is selected with 7 days, cap results at 2,000 and show a notice.

Map: Full-screen Leaflet map with CARTO Positron tiles (no API key). Plot each quake as a circle sized by magnitude and colored by age (red = past hour, orange = past 24 hours, yellow = older). Clicking a circle shows a popup with magnitude, place, local time, coordinates, depth, a Google Maps link, and a USGS event page link.

Side panel: A collapsible list showing the full place name without truncation, magnitude as a colored badge, relative time ('12 min ago'), and depth. Clicking a row flies the map to that quake. Show a total count and the strongest quake at the top.

Other: No auto-refresh. Add a refresh button in the header that re-fetches the current filters, spins while loading, and shows a 'last updated' timestamp. Display times in the viewer's local time zone. Clean, modern, dark-mode design; the panel becomes a bottom sheet on mobile.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tremor-spotter-app.markm-aws-2026-09-23-1.sandbox-mm.nuon.co

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/18e1be1a-9be5-449c-87d6-692937a05537).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
