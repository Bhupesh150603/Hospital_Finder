import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { haversine, rankHospitals } from '@/lib/haversine';
import { fetchOSMHospitalsExpanding } from '@/lib/overpass';

const DATA_PATH = path.join(process.cwd(), 'data', 'hospitals.json');

/**
 * GET /api/hospitals?lat=28.61&lng=77.20&specialty=Trauma&prioritizeAvailability=true
 *
 * Returns hospitals sorted by proximity and availability penalty.
 * Merges curated hospitals.json data with live OSM results,
 * deduplicates, and ranks them together.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const specialty = searchParams.get('specialty') || null;
    const prioritizeAvailability = searchParams.get('prioritizeAvailability') !== 'false'; // default true

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Missing or invalid lat/lng query parameters' },
        { status: 400 }
      );
    }

    // 1. Load curated hospitals and tag with source
    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const rawCurated = JSON.parse(rawData);
    const taggedCurated = rawCurated.map((h) => ({
      ...h,
      source: 'curated',
    }));

    // 2. Rank the curated hospitals list first
    const curatedRanked = rankHospitals(
      taggedCurated,
      lat,
      lng,
      specialty,
      30,
      prioritizeAvailability
    );

    // 3. Call fetchOSMHospitalsExpanding(lat, lng)
    const osmHospitals = await fetchOSMHospitalsExpanding(lat, lng);

    // 4. Deduplicate: drop any OSM result within 0.3 km of a curated hospital already in results
    const dedupedOSM = osmHospitals.filter((osm) => {
      return !curatedRanked.some((curated) => {
        const dist = haversine(osm.lat, osm.lng, curated.lat, curated.lng);
        return dist < 0.3;
      });
    });

    // 5. Merge both lists and run through existing rankHospitals scoring
    // "Unknown" availability scores like "Limited" in the ranking penalty
    const merged = [...curatedRanked, ...dedupedOSM];
    const results = rankHospitals(merged, lat, lng, null, 30, prioritizeAvailability);

    // 6. Count sources in the final results
    const curatedCount = results.filter((h) => h.source === 'curated').length;
    const communityCount = results.filter((h) => h.source === 'osm').length;

    return NextResponse.json({
      results,
      count: results.length,
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
