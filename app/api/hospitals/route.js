import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { haversine, rankHospitals } from '@/lib/haversine';
import { fetchOSMHospitalsExpanding } from '@/lib/overpass';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), 'data', 'hospitals.json');

const CANONICAL_SPECIALTIES = [
  'Trauma',
  'Cardiac',
  'ICU',
  'Burns',
  'Pediatric',
  'Dialysis',
  'Maternity',
];

/**
 * GET /api/hospitals?lat=28.61&lng=77.20&specialty=Cardiac&prioritizeAvailability=true
 *
 * Returns hospitals strictly filtered and sorted by proximity & availability penalty.
 * OSM/community hospitals (General) are excluded when a specific specialty is requested,
 * unless fewer than 3 curated matches exist, in which case they are provided in a
 * separate fallback section labeled "Nearby general hospitals (specialty not confirmed)".
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const rawSpecialty = searchParams.get('specialty');
    const prioritizeAvailability = searchParams.get('prioritizeAvailability') !== 'false'; // default true

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Missing or invalid lat/lng query parameters' },
        { status: 400 }
      );
    }

    // 1. Resolve specialty and check casing/normalization
    const isAnyOrEmpty = !rawSpecialty || rawSpecialty.trim().toLowerCase() === 'any' || rawSpecialty.trim() === '';
    const targetSpecialty = isAnyOrEmpty
      ? null
      : (CANONICAL_SPECIALTIES.find((s) => s.toLowerCase() === rawSpecialty.trim().toLowerCase()) || rawSpecialty.trim());

    // 2. Load curated hospitals
    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const rawCurated = JSON.parse(rawData);

    // Requirement 1: Log specialty query parameter and sample hospital specialties array
    console.log(
      `[GET /api/hospitals] query specialty: "${rawSpecialty}", resolved: "${targetSpecialty}", sample specialties:`,
      rawCurated[0]?.specialties
    );

    const taggedCurated = rawCurated.map((h) => ({
      ...h,
      source: 'curated',
    }));

    // Requirement 2: Strict exact array filtering (not loose matching)
    const filteredCurated = targetSpecialty
      ? taggedCurated.filter(
          (h) => Array.isArray(h.specialties) && h.specialties.includes(targetSpecialty)
        )
      : taggedCurated;

    // Rank filtered curated hospitals
    const curatedRanked = rankHospitals(
      filteredCurated,
      lat,
      lng,
      targetSpecialty,
      30,
      prioritizeAvailability
    );

    // Fetch Redis overrides in parallel for curated ranked hospitals
    const overrides = await Promise.all(
      curatedRanked.map(async (h) => {
        try {
          const val = await redis.get(`availability:${h.id}`);
          if (!val) return null;
          return typeof val === 'string' ? JSON.parse(val) : val;
        } catch (err) {
          console.error(`Error reading Redis override for ${h.id}:`, err);
          return null;
        }
      })
    );

    const curatedWithOverrides = curatedRanked.map((h, index) => {
      const override = overrides[index];
      if (!override) return h;
      return {
        ...h,
        availability: override.status || override.availability || h.availability,
        lastUpdated: override.lastUpdated || h.lastUpdated,
      };
    });

    let results = [];
    let fallbackResults = [];
    let fallbackLabel = null;

    // Requirement 3: OSM exclusion and separate fallback handling
    if (!targetSpecialty) {
      // "Any" / all specialties: merge curated and live OSM general hospitals
      const osmHospitals = await fetchOSMHospitalsExpanding(lat, lng);
      const dedupedOSM = osmHospitals.filter((osm) => {
        return !curatedWithOverrides.some((curated) => {
          const dist = haversine(osm.lat, osm.lng, curated.lat, curated.lng);
          return dist < 0.3;
        });
      });

      const merged = [...curatedWithOverrides, ...dedupedOSM];
      results = rankHospitals(merged, lat, lng, null, 30, prioritizeAvailability);
    } else {
      // Specific specialty selected:
      // Re-rank curatedWithOverrides with availability penalties
      results = rankHospitals(curatedWithOverrides, lat, lng, targetSpecialty, 30, prioritizeAvailability);

      // Exclude OSM hospitals UNLESS fewer than 3 curated matches were found nearby (within 50 km)
      const NEARBY_THRESHOLD_KM = 50;
      const nearbyCuratedCount = curatedWithOverrides.filter(
        (h) => typeof h.distance === 'number' && h.distance <= NEARBY_THRESHOLD_KM
      ).length;

      if (nearbyCuratedCount < 3) {
        const osmHospitals = await fetchOSMHospitalsExpanding(lat, lng);
        const dedupedOSM = osmHospitals.filter((osm) => {
          return !curatedWithOverrides.some((curated) => {
            const dist = haversine(osm.lat, osm.lng, curated.lat, curated.lng);
            return dist < 0.3;
          });
        });

        if (dedupedOSM.length > 0) {
          fallbackResults = rankHospitals(dedupedOSM, lat, lng, null, 10, prioritizeAvailability);
          fallbackLabel = 'Nearby general hospitals (specialty not confirmed)';
        }
      }
    }

    const curatedCount = results.filter((h) => h.source === 'curated').length;
    const communityCount = results.filter((h) => h.source === 'osm').length + fallbackResults.length;

    return NextResponse.json({
      results,
      fallbackResults,
      fallbackLabel,
      count: results.length,
      fallbackCount: fallbackResults.length,
      sources: { curated: curatedCount, community: communityCount },
    });
  } catch (err) {
    console.error('GET /api/hospitals error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
