/**
 * Pre-fetches OSM building footprints for all 82 rentals and saves to
 * public/buildingFootprints.json
 *
 * Run once:  node scripts/fetchBuildingFootprints.mjs
 *
 * Output format: { "id": [[lat,lng], ...], ... }  (null if no building found)
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, '../public/buildingFootprints.json');

// All 82 rentals — id, lat, lng
const RENTALS = [
  { id: 1,  lat: 43.6858, lng: -79.3801 },
  { id: 2,  lat: 43.6882, lng: -79.3765 },
  { id: 3,  lat: 43.7265, lng: -79.4028 },
  { id: 4,  lat: 43.7290, lng: -79.3980 },
  { id: 5,  lat: 43.7255, lng: -79.4015 },
  { id: 6,  lat: 43.7280, lng: -79.3990 },
  { id: 7,  lat: 43.7105, lng: -79.4110 },
  { id: 8,  lat: 43.7082, lng: -79.4145 },
  { id: 9,  lat: 43.7210, lng: -79.3878 },
  { id: 10, lat: 43.7188, lng: -79.3910 },
  { id: 11, lat: 43.6815, lng: -79.3945 },
  { id: 12, lat: 43.6827, lng: -79.3968 },
  { id: 13, lat: 43.6798, lng: -79.3930 },
  { id: 14, lat: 43.6790, lng: -79.3914 },
  { id: 15, lat: 43.7195, lng: -79.4072 },
  { id: 16, lat: 43.7170, lng: -79.4100 },
  { id: 17, lat: 43.6820, lng: -79.3558 },
  { id: 18, lat: 43.6795, lng: -79.3530 },
  { id: 19, lat: 43.6808, lng: -79.3555 },
  { id: 20, lat: 43.6790, lng: -79.3830 },
  { id: 21, lat: 43.6762, lng: -79.3810 },
  { id: 22, lat: 43.6778, lng: -79.3785 },
  { id: 23, lat: 43.6768, lng: -79.3760 },
  { id: 24, lat: 43.6722, lng: -79.3936 },
  { id: 25, lat: 43.6710, lng: -79.3948 },
  { id: 26, lat: 43.6699, lng: -79.3921 },
  { id: 27, lat: 43.6712, lng: -79.3530 },
  { id: 28, lat: 43.6796, lng: -79.4170 },
  { id: 29, lat: 43.6808, lng: -79.4140 },
  { id: 30, lat: 43.6442, lng: -79.4760 },
  { id: 31, lat: 43.6460, lng: -79.4780 },
  { id: 32, lat: 43.6450, lng: -79.4770 },
  { id: 33, lat: 43.6676, lng: -79.4138 },
  { id: 34, lat: 43.6686, lng: -79.4158 },
  { id: 35, lat: 43.6665, lng: -79.4145 },
  { id: 36, lat: 43.6694, lng: -79.4122 },
  { id: 37, lat: 43.6770, lng: -79.3072 },
  { id: 38, lat: 43.6755, lng: -79.3055 },
  { id: 39, lat: 43.6690, lng: -79.3038 },
  { id: 40, lat: 43.6672, lng: -79.3020 },
  { id: 41, lat: 43.6681, lng: -79.3010 },
  { id: 42, lat: 43.6695, lng: -79.2998 },
  { id: 43, lat: 43.6748, lng: -79.2988 },
  { id: 44, lat: 43.6742, lng: -79.2965 },
  { id: 45, lat: 43.6835, lng: -79.2900 },
  { id: 46, lat: 43.6856, lng: -79.4025 },
  { id: 47, lat: 43.6843, lng: -79.4000 },
  { id: 48, lat: 43.6903, lng: -79.3920 },
  { id: 49, lat: 43.6885, lng: -79.3905 },
  { id: 50, lat: 43.6895, lng: -79.3930 },
  { id: 51, lat: 43.6635, lng: -79.4408 },
  { id: 52, lat: 43.6618, lng: -79.4390 },
  { id: 53, lat: 43.7540, lng: -79.4148 },
  { id: 54, lat: 43.7525, lng: -79.4120 },
  { id: 55, lat: 43.7548, lng: -79.4130 },
  { id: 56, lat: 43.6640, lng: -79.4355 },
  { id: 57, lat: 43.8048, lng: -79.3030 },
  { id: 58, lat: 43.6475, lng: -79.4490 },
  { id: 59, lat: 43.6460, lng: -79.4510 },
  { id: 60, lat: 43.6860, lng: -79.4155 },
  { id: 61, lat: 43.6840, lng: -79.4130 },
  { id: 62, lat: 43.7628, lng: -79.3225 },
  { id: 63, lat: 43.7282, lng: -79.4048 },
  { id: 64, lat: 43.7268, lng: -79.4028 },
  { id: 65, lat: 43.7278, lng: -79.4060 },
  { id: 66, lat: 43.7258, lng: -79.4010 },
  { id: 67, lat: 43.6808, lng: -79.2958 },
  { id: 68, lat: 43.6795, lng: -79.2938 },
  { id: 69, lat: 43.8130, lng: -79.3270 },
  { id: 70, lat: 43.6852, lng: -79.5228 },
  { id: 71, lat: 43.6840, lng: -79.5210 },
  { id: 72, lat: 43.6612, lng: -79.5455 },
  { id: 73, lat: 43.7292, lng: -79.4430 },
  { id: 74, lat: 43.7278, lng: -79.4410 },
  { id: 75, lat: 43.7788, lng: -79.2260 },
  { id: 76, lat: 43.6995, lng: -79.3200 },
  { id: 77, lat: 43.6968, lng: -79.3182 },
  { id: 78, lat: 43.6975, lng: -79.3198 },
  { id: 79, lat: 43.7110, lng: -79.3985 },
  { id: 80, lat: 43.7098, lng: -79.3968 },
  { id: 81, lat: 43.7115, lng: -79.3948 },
  { id: 82, lat: 43.7090, lng: -79.3978 },
];

const BATCH_SIZE = 8;
const DELAY_MS  = 2000;   // 2 s between batches — well under the 10 req/min limit
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function insideWay(geometry, lat, lng) {
  const ring = geometry;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lon, yi = ring[i].lat;
    const xj = ring[j].lon, yj = ring[j].lat;
    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function queryOverpass(query, retryCount = 0) {
  const endpoint = ENDPOINTS[retryCount % ENDPOINTS.length];
  const url = `${endpoint}?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (res.status === 429 || res.status === 504) {
    if (retryCount < ENDPOINTS.length * 2) {
      console.log(`  ↺ ${res.status} from ${endpoint}, retrying in 5s…`);
      await sleep(5000);
      return queryOverpass(query, retryCount + 1);
    }
    throw new Error(`HTTP ${res.status} after retries`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchBatch(batch) {
  const unions = batch.map(r => `way[building](around:60,${r.lat},${r.lng});`).join('\n  ');
  const query = `[out:json][timeout:30];\n(\n  ${unions}\n);\nout geom;`;

  let data;
  try {
    data = await queryOverpass(query);
  } catch (err) {
    console.warn(`  Batch failed: ${err.message}`);
    return {};
  }

  const ways = (data.elements || []).filter(e => e.geometry?.length > 2);
  const result = {};

  batch.forEach(r => {
    // PIP — find a way that contains the point
    let hit = ways.find(w => insideWay(w.geometry, r.lat, r.lng));
    // Nearest fallback — must be within 80 m
    if (!hit) {
      let best = null, bestDist = Infinity;
      ways.forEach(w => {
        const clat = w.geometry.reduce((s, p) => s + p.lat, 0) / w.geometry.length;
        const clng = w.geometry.reduce((s, p) => s + p.lon, 0) / w.geometry.length;
        const d = haversine(r.lat, r.lng, clat, clng);
        if (d < bestDist && d < 80) { bestDist = d; best = w; }
      });
      hit = best;
    }
    result[r.id] = hit ? hit.geometry.map(p => [p.lat, p.lon]) : null;
  });

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Load existing cache so we can resume interrupted runs
let cache = {};
if (existsSync(OUT)) {
  try {
    cache = JSON.parse(readFileSync(OUT, 'utf8'));
    console.log(`Loaded ${Object.keys(cache).length} cached entries from ${OUT}`);
  } catch (_) {}
}

const todo = RENTALS.filter(r => !(r.id in cache));
console.log(`Fetching footprints for ${todo.length} rentals (${RENTALS.length - todo.length} cached)\n`);

for (let i = 0; i < todo.length; i += BATCH_SIZE) {
  const batch = todo.slice(i, i + BATCH_SIZE);
  console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(todo.length / BATCH_SIZE)}: ids ${batch.map(r => r.id).join(', ')}`);

  const batchResult = await fetchBatch(batch);
  const found    = Object.values(batchResult).filter(v => v !== null).length;
  const notFound = batch.length - found;
  console.log(`  ✓ ${found} footprints found, ${notFound} fallback\n`);

  Object.assign(cache, batchResult);
  writeFileSync(OUT, JSON.stringify(cache, null, 2));

  if (i + BATCH_SIZE < todo.length) await sleep(DELAY_MS);
}

console.log(`\nDone! Saved ${Object.keys(cache).length} entries to ${OUT}`);
