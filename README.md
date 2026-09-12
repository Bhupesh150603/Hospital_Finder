# 🏥 Emergency Hospital Finder

> Find nearby hospitals with the right specialty and available capacity during emergencies.

A hackathon MVP built with **Next.js 14**, **Leaflet/OpenStreetMap**, and a JSON file data store. No API keys, no auth, no external services — just a fast, working demo.

---

## Features

- **🔍 Smart Search** — Enter/detect your location, pick a specialty (Trauma, Cardiac, Pediatric, ICU, Burns, Maternity, Dialysis), and find matching hospitals instantly.
- **📊 Distance Ranking** — Hospitals sorted by Haversine distance from your location.
- **🏷️ Availability Status** — Color-coded badges (🟢 Available / 🟡 Limited / 🔴 Full) on every hospital.
- **📞 Quick Actions** — One-tap Call (`tel:` link) and Directions (Google Maps) buttons.
- **🗺️ Map View** — Interactive Leaflet map with color-coded pins, popups, and a legend.
- **⚙️ Admin Panel** — Toggle any hospital's availability status at `/admin` — changes reflect immediately in search results.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, Vanilla CSS |
| Map | Leaflet + react-leaflet + OpenStreetMap |
| Data | JSON file (`data/hospitals.json`) |
| Distance | Haversine formula (pure JS) |
| Geolocation | Browser `navigator.geolocation` API |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Pages

| Route | Description |
|-------|------------|
| `/` | Search page — enter location & specialty |
| `/results?lat=...&lng=...&specialty=...` | Results with list & map views |
| `/admin` | Admin panel — toggle hospital availability |

### Demo Shortcut

Click **"📌 Use Demo Location (Delhi)"** on the search page to pre-fill coordinates for the Delhi NCR region where all 18 seed hospitals are located.

## Seed Data

18 hospitals in the Delhi NCR region with realistic names, coordinates, phone numbers, and specialties. Edit `data/hospitals.json` to add/modify hospitals.

## API Routes

```
GET  /api/hospitals?lat=28.61&lng=77.20&specialty=Trauma
GET  /api/admin
PATCH /api/admin  { "id": "h1", "availability": "Full" }
```

## Deployment Note

The admin panel writes to `data/hospitals.json` via `fs.writeFile`. This works on **localhost** but NOT on Vercel (read-only filesystem). For a production deployment, swap the JSON file for Vercel KV or a database.

## License

MIT — built for a hackathon demo.
