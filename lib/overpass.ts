import type { HospitalLike } from './haversine';

/**
 * Overpass API client — fetches real hospitals from OpenStreetMap.
 * Used to supplement the curated hospitals.json with live OSM data
 * so the app works ANYWHERE, not just near the 101 curated hospitals.
 */

export interface OSMHospital extends HospitalLike {
  id: string;
  name: string;
  phone: string | null;
  specialties: string[];
  availability: 'Unknown';
  source: 'osm';
}

interface OverpassTags {
  name?: string;
  phone?: string;
  'contact:phone'?: string;
  [key: string]: string | undefined;
}

interface OverpassElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface CacheEntry {
  timestamp: number;
  data: OSMHospital[];
}

// In-memory cache for OSM results (key: `lat,lng,radius`, TTL: 5 minutes)
const osmCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * Fetch hospitals from the Overpass API within a given radius using POST.
 * Tries the primary endpoint with an 8-second AbortController timeout, and
 * gracefully falls back to a public mirror if unreachable.
 */
export async function fetchOSMHospitals(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<OSMHospital[]> {
  // Check in-memory cache first
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
  const cached = osmCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const query = `[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
);
out center tags;`;

  for (const endpoint of ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'EmergencyHospitalFinder/1.0',
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Overpass endpoint ${endpoint} returned ${res.status}`);
        continue; // try next endpoint
      }

      const json = (await res.json()) as OverpassResponse;

      if (!json || !Array.isArray(json.elements)) {
        continue;
      }

      const hospitals: OSMHospital[] = json.elements
        .map((element): OSMHospital | null => {
          const tags = element.tags || {};
          if (!tags.name) return null; // Skip elements with no name tag

          // Use element.lat/lon for nodes, element.center.lat/lon for ways
          const itemLat = element.type === 'node' ? element.lat : element.center?.lat;
          const itemLng = element.type === 'node' ? element.lon : element.center?.lon;

          if (itemLat == null || itemLng == null) return null;

          return {
            id: `osm-${element.type}-${element.id}`,
            name: tags.name,
            lat: itemLat,
            lng: itemLng,
            phone: tags.phone || tags['contact:phone'] || null,
            specialties: ['General'],
            availability: 'Unknown',
            source: 'osm',
          };
        })
        .filter((h): h is OSMHospital => h !== null);

      // Cache successful response
      osmCache.set(cacheKey, { timestamp: Date.now(), data: hospitals });
      return hospitals;
    } catch (err) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Overpass fetch from ${endpoint} failed:`, message);
      // continue to next endpoint if primary failed
    }
  }

  return [];
}

/**
 * Tries radii [10000, 30000, 100000] in order, returning as soon as it gets 3+ results.
 */
export async function fetchOSMHospitalsExpanding(
  lat: number,
  lng: number
): Promise<OSMHospital[]> {
  const radii = [10000, 30000, 100000];

  for (const radius of radii) {
    const results = await fetchOSMHospitals(lat, lng, radius);
    if (results.length >= 3) {
      return results;
    }
    // If on the last radius, return whatever was found
    if (radius === radii[radii.length - 1]) {
      return results;
    }
  }

  return [];
}