import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import fraserRatings, { getFraserRating } from '../data/fraserRatings';
import rentalsData from '../data/rentals';
import catchmentAreas from '../data/catchmentAreas';

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS = {
  EP: '#2563eb',
  EC: '#dc2626',
  FP: '#16a34a',
  FC: '#7c3aed',
  ES: '#dc2626', // TCDSB uses ES code
  FS: '#7c3aed',
  PR: '#6b7280',
};

const RENTAL_COLOR = '#f97316';

// Toronto Open Data CKAN API base URL
const CKAN_BASE = 'https://ckan0.cf.opendata.inter.prod-toronto.ca';
const PACKAGE_ID = 'school-attendance-boundary';

// Boundary polygon fill colors by board/type
const BOUNDARY_COLORS = {
  tdsb:          { color: '#9ca3af', fillColor: '#e5e7eb' },
  tcdsb:         { color: '#9ca3af', fillColor: '#e5e7eb' },
  csc_viamonde:  { color: '#9ca3af', fillColor: '#e5e7eb' },
  csc_catholique:{ color: '#9ca3af', fillColor: '#e5e7eb' },
  default:       { color: '#9ca3af', fillColor: '#e5e7eb' },
};

function pointInPolygon(lat, lng, coordinates) {
  const ring = coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeSchoolIcon(type, rating) {
  const ringColor = TYPE_COLORS[type] || '#6b7280';
  const ratingColor = rating === null || rating === undefined ? '#6b7280'
    : rating >= 8 ? '#16a34a'
    : rating >= 6 ? '#ca8a04'
    : rating >= 4 ? '#ea580c'
    : '#dc2626';
  const label = rating !== null && rating !== undefined ? rating.toFixed(1) : '–';
  const html = `
    <div style="
      width:42px;height:42px;border-radius:50%;
      background:${ratingColor};
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:800;font-family:sans-serif;
      letter-spacing:-0.5px;
    ">${label}</div>`;
  return L.divIcon({
    className: '',
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

function makeRentalIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="30" viewBox="0 0 32 30">
    <!-- building body -->
    <rect x="2" y="13" width="28" height="17" rx="2" fill="${RENTAL_COLOR}"/>
    <!-- roof -->
    <polygon points="0,14 16,2 32,14" fill="#e05a00"/>
    <!-- door -->
    <rect x="12" y="20" width="8" height="10" rx="1" fill="#fff" opacity="0.85"/>
    <!-- windows -->
    <rect x="4" y="17" width="6" height="5" rx="1" fill="#fff" opacity="0.7"/>
    <rect x="22" y="17" width="6" height="5" rx="1" fill="#fff" opacity="0.7"/>
  </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 30],
    iconAnchor: [16, 30],
    popupAnchor: [0, -30],
  });
}

function matchesTypeFilter(schoolType, filter) {
  if (filter === 'all') return true;
  if (filter === 'public') return schoolType === 'EP';
  if (filter === 'catholic') return schoolType === 'EC' || schoolType === 'FC' || schoolType === 'ES';
  if (filter === 'french') return schoolType === 'FP' || schoolType === 'FC' || schoolType === 'FS';
  if (filter === 'private') return schoolType === 'PR';
  return true;
}

function addLegend(map) {
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <div class="map-legend__title">School Type</div>
      ${[
        ['EP', '#2563eb', 'English Public (TDSB)'],
        ['ES', '#dc2626', 'English Catholic (TCDSB)'],
      ].map(([code, color, label]) => `
        <div class="map-legend__row">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="${color}"/></svg>
          <span>${label}</span>
        </div>
      `).join('')}
    `;
    return div;
  };
  legend.addTo(map);
}

/**
 * Normalize a school name for fuzzy matching.
 * Strips common suffixes, punctuation, extra spaces; lowercases.
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\bpublic school\b/g, '')
    .replace(/\belementary school\b/g, '')
    .replace(/\bsecondary school\b/g, '')
    .replace(/\bjunior public school\b/g, '')
    .replace(/\bjr public school\b/g, '')
    .replace(/\bjr mdl school\b/g, '')
    .replace(/\bcollegiate institute\b/g, '')
    .replace(/\bcatholic\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best matching boundary feature for a given school name.
 * Returns the GeoJSON feature or null.
 */
function findBoundaryFeature(schoolName, boundaryFeatures) {
  if (!boundaryFeatures || boundaryFeatures.length === 0) return null;

  const normalizedTarget = normalizeName(schoolName);

  // Build a list of possible name fields from boundary properties
  const getName = (props) => {
    return props.SCHOOL_NAME || props.school_name || props.Name || props.NAME ||
           props.SchoolName || props.SCHOOLNAME || props.name || '';
  };

  // Try exact match first (case-insensitive)
  const upperTarget = schoolName.toUpperCase().trim();
  for (const feature of boundaryFeatures) {
    const bName = String(getName(feature.properties)).toUpperCase().trim();
    if (bName === upperTarget) return feature;
  }

  // Try normalized partial match
  let bestMatch = null;
  let bestScore = 0;

  for (const feature of boundaryFeatures) {
    const bName = normalizeName(getName(feature.properties));
    if (!bName) continue;

    // Check if either name contains the other
    let score = 0;
    if (bName === normalizedTarget) {
      score = 100;
    } else if (bName.includes(normalizedTarget) || normalizedTarget.includes(bName)) {
      // Score by how much of the shorter name is covered
      const shorter = Math.min(bName.length, normalizedTarget.length);
      const longer = Math.max(bName.length, normalizedTarget.length);
      score = shorter / longer * 80;
    } else {
      // Token overlap scoring
      const targetTokens = new Set(normalizedTarget.split(' ').filter(t => t.length > 2));
      const bTokens = new Set(bName.split(' ').filter(t => t.length > 2));
      let overlap = 0;
      for (const t of targetTokens) {
        if (bTokens.has(t)) overlap++;
      }
      if (overlap > 0) {
        score = (overlap / Math.max(targetTokens.size, bTokens.size)) * 60;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = feature;
    }
  }

  // Only return if reasonably confident (score > 30)
  return bestScore > 30 ? bestMatch : null;
}

/**
 * Determine boundary color based on the boundary feature's board/properties.
 */
function getBoundaryColor(feature) {
  if (!feature) return BOUNDARY_COLORS.default;
  const props = feature.properties;
  const board = (props.BOARD_NAME || props.board || props.Board || '').toLowerCase();
  const name = (props.SCHOOL_NAME || props.school_name || props.Name || props.NAME || '').toLowerCase();

  if (board.includes('toronto district') || board.includes('tdsb')) {
    return BOUNDARY_COLORS.tdsb;
  }
  if (board.includes('catholic') && board.includes('toronto')) {
    return BOUNDARY_COLORS.tcdsb;
  }
  if (board.includes('viamonde')) {
    return BOUNDARY_COLORS.csc_viamonde;
  }
  if (board.includes('catholique') || board.includes('centre-sud')) {
    return BOUNDARY_COLORS.csc_catholique;
  }
  // Infer from resource name in feature if available
  return BOUNDARY_COLORS.default;
}

export default function MapView({
  ratingMin, ratingMax, schoolTypeFilter,
  onSchoolClick, onRentalClick,
  selectedSchool, selectedRental,
  onVisibleCountChange,
  onSchoolsLoaded,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const schoolLayersRef = useRef([]);
  const rentalLayersRef = useRef([]);
  const catchmentLayerRef = useRef(null);
  const circleLayerRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const clickedMarkerRef = useRef(false);
  const onSchoolClickRef = useRef(onSchoolClick);
  const selectionTokenRef = useRef(0);
  const [schools, setSchools] = useState([]);

  useEffect(() => { onSchoolClickRef.current = onSchoolClick; }, [onSchoolClick]);

  // All boundary features indexed: array of {features, resourceName, boardHint}
  const boundaryDataRef = useRef([]);
  const [boundaryStatus, setBoundaryStatus] = useState('idle'); // idle | loading | ready | error

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [43.7, -79.4],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
      attribution: 'Map tiles by <a href="https://carto.com/">Carto</a>, under CC BY 3.0. Data by <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, under ODbL.',
      subdomains: 'abc',
      maxZoom: 20,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Load boundary GeoJSON data from Toronto Open Data on mount
  useEffect(() => {
    setBoundaryStatus('loading');
    loadAllBoundaries()
      .then(allBoundaries => {
        boundaryDataRef.current = allBoundaries;
        const totalFeatures = allBoundaries.reduce((sum, b) => sum + b.features.length, 0);
        console.log(`[Boundaries] Loaded ${allBoundaries.length} boundary datasets, ${totalFeatures} total features`);
        setBoundaryStatus('ready');
      })
      .catch(err => {
        console.warn('[Boundaries] Failed to load boundary data:', err);
        setBoundaryStatus('error');
      });
  }, []);

  // Load GeoJSON school points
  useEffect(() => {
    fetch('/schools_master_table.geojson')
      .then(r => r.json())
      .then(data => {
        const catchmentKeys = new Set(Object.keys(catchmentAreas).map(k => k.trim()));
        const features = data.features.map(f => {
          const name = f.properties.NAME;
          // Only include schools that have a defined catchment area
          if (!catchmentKeys.has(name.trim())) return null;
          const fraser = getFraserRating(name) || null;
          const schoolType = f.properties.SCHOOL_TYPE;
          // MultiPoint: coordinates[0] = [lng, lat]
          const coords = f.geometry && f.geometry.coordinates && f.geometry.coordinates[0];
          if (!coords) return null;
          const [lng, lat] = coords;
          return {
            ...f,
            lat,
            lng,
            name,
            schoolType,
            rating: fraser ? fraser.rating : null,
            website: fraser ? fraser.website : null,
          };
        }).filter(Boolean);
        setSchools(features);
        onSchoolsLoaded && onSchoolsLoaded(features);
      })
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Draw markers whenever schools/filters change
  useEffect(() => {
    if (!mapInstanceRef.current || schools.length === 0) return;
    const map = mapInstanceRef.current;

    // Remove old school markers
    schoolLayersRef.current.forEach(l => map.removeLayer(l));
    schoolLayersRef.current = [];

    let visibleSchoolCount = 0;

    schools.forEach(school => {
      const { lat, lng, schoolType, rating } = school;
      if (!lat || !lng) return;

      // Skip private schools entirely
      if (schoolType === 'PR') return;

      // Skip post-secondary institutions (colleges, universities)
      const nameUpper = school.name.toUpperCase();
      if (
        /\bUNIVERSITY\b/.test(nameUpper) ||
        /\bCOLLEGE OF APPLIED\b/.test(nameUpper) ||
        /\bINSTITUTE OF TECHNOLOGY\b/.test(nameUpper) ||
        /\bCOMMUNITY COLLEGE\b/.test(nameUpper) ||
        /\bSENECA\b/.test(nameUpper) ||
        /\bHUMBER COLLEGE\b/.test(nameUpper) ||
        /\bCENTENNIAL COLLEGE\b/.test(nameUpper) ||
        /\bGEORGE BROWN\b/.test(nameUpper) ||
        /\bRYERSON\b/.test(nameUpper) ||
        /\bTMU\b/.test(nameUpper)
      ) return;

      // Type filter
      if (!matchesTypeFilter(schoolType, schoolTypeFilter)) return;

      // Rating filter: unrated schools always show unless we explicitly need a rating
      const ratingOk = rating === null
        ? (ratingMin === 0) // show unrated only when min is 0
        : (rating >= ratingMin && rating <= ratingMax);
      if (!ratingOk) return;

      visibleSchoolCount++;
      const marker = L.marker([lat, lng], { icon: makeSchoolIcon(schoolType, rating) });
      marker.bindTooltip(school.name, { direction: 'top', offset: [0, -30] });
      marker.on('click', () => {
        clickedMarkerRef.current = true;
        setTimeout(() => { clickedMarkerRef.current = false; }, 0);
        onSchoolClick(school);
      });
      marker.addTo(map);
      schoolLayersRef.current.push(marker);
    });

    onVisibleCountChange && onVisibleCountChange(visibleSchoolCount, 0);
  }, [schools, ratingMin, ratingMax, schoolTypeFilter]);

  // Handle selected school - draw catchment boundary
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove previous catchment/circle
    if (catchmentLayerRef.current) { map.removeLayer(catchmentLayerRef.current); catchmentLayerRef.current = null; }
    if (circleLayerRef.current) { map.removeLayer(circleLayerRef.current); circleLayerRef.current = null; }
    if (highlightLayerRef.current) { map.removeLayer(highlightLayerRef.current); highlightLayerRef.current = null; }

    if (!selectedSchool) {
      rentalLayersRef.current.forEach(l => map.removeLayer(l));
      rentalLayersRef.current = [];
      onVisibleCountChange && onVisibleCountChange(null, 0);
      return;
    }

    const token = ++selectionTokenRef.current;
    const { lat, lng, name } = selectedSchool;

    // Remove old rental markers
    rentalLayersRef.current.forEach(l => map.removeLayer(l));
    rentalLayersRef.current = [];

    // Pan to school
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });

    // Highlight ring around selected school marker
    const highlight = L.circleMarker([lat, lng], {
      radius: 18,
      color: '#fbbf24',
      weight: 3,
      fillOpacity: 0,
    }).addTo(map);
    highlightLayerRef.current = highlight;

    // 1. Check manually defined catchment areas first
    const manual = catchmentAreas[name.toUpperCase().trim()];
    if (manual) {
      const feature = {
        type: 'Feature',
        properties: { SCHOOL_NAME: name },
        geometry: { type: 'Polygon', coordinates: manual.coordinates },
      };
      drawBoundaryPolygon(map, feature, manual.board);
      return;
    }

    // 2. Try to find boundary from pre-loaded API data
    if (boundaryDataRef.current.length > 0) {
      let matchedFeature = null;
      let matchedBoard = null;

      for (const dataset of boundaryDataRef.current) {
        const match = findBoundaryFeature(name, dataset.features);
        if (match) {
          matchedFeature = match;
          matchedBoard = dataset.boardHint;
          break;
        }
      }

      if (matchedFeature) {
        drawBoundaryPolygon(map, matchedFeature, matchedBoard);
        return;
      }
    }

    // 3. On-demand fetch fallback
    fetchBoundaryOnDemand(name, selectedSchool)
      .then(result => {
        if (selectionTokenRef.current !== token) return;
        if (result) {
          drawBoundaryPolygon(map, result.feature, result.boardHint);
        } else {
          drawFallbackCircle(map, lat, lng);
        }
      })
      .catch(() => {
        if (selectionTokenRef.current === token) {
          drawFallbackCircle(map, lat, lng);
        }
      });

    function showNearbyRentals(schoolName, centerLat, centerLng) {
      rentalLayersRef.current.forEach(l => map.removeLayer(l));
      rentalLayersRef.current = [];
      const area = catchmentAreas[schoolName.trim()];
      let count = 0;
      rentalsData.forEach(rental => {
        if (area) {
          if (!pointInPolygon(rental.lat, rental.lng, area.coordinates)) return;
        } else {
          if (haversineDistance(centerLat, centerLng, rental.lat, rental.lng) > 800) return;
        }
        count++;
        const marker = L.marker([rental.lat, rental.lng], { icon: makeRentalIcon() });
        marker.bindTooltip(`$${rental.price.toLocaleString()}/mo — ${rental.address}`, { direction: 'top', offset: [0, -28] });
        marker.on('click', () => {
          clickedMarkerRef.current = true;
          setTimeout(() => { clickedMarkerRef.current = false; }, 0);
          onRentalClick(rental);
        });
        marker.addTo(map);
        rentalLayersRef.current.push(marker);
      });
      onVisibleCountChange && onVisibleCountChange(null, count);
    }

    function drawBoundaryPolygon(map, feature, boardHint) {
      // Guard: remove any existing catchment before drawing
      if (catchmentLayerRef.current) { map.removeLayer(catchmentLayerRef.current); catchmentLayerRef.current = null; }
      if (circleLayerRef.current) { map.removeLayer(circleLayerRef.current); circleLayerRef.current = null; }

      let colors = BOUNDARY_COLORS.default;
      if (boardHint) {
        colors = BOUNDARY_COLORS[boardHint] || BOUNDARY_COLORS.default;
      } else {
        colors = getBoundaryColor(feature);
      }

      const layer = L.geoJSON(feature, {
        style: {
          color: colors.color,
          weight: 2.5,
          fillColor: colors.fillColor,
          fillOpacity: 0.15,
          dashArray: null,
        },
      }).addTo(map);
      catchmentLayerRef.current = layer;

      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      } catch (e) { /* ignore */ }

      showNearbyRentals(name, lat, lng);
    }

    function drawFallbackCircle(map, lat, lng) {
      const circle = L.circle([lat, lng], {
        radius: 500,
        color: '#2563eb',
        weight: 2,
        fillColor: '#93c5fd',
        fillOpacity: 0.2,
        dashArray: '6 4',
      }).addTo(map);
      circleLayerRef.current = circle;
      showNearbyRentals(name, lat, lng);
    }
  }, [selectedSchool, boundaryStatus]);

  // Deselect school when clicking outside the catchment area
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSchool) return;
    const map = mapInstanceRef.current;

    const handleMapClick = () => {
      if (clickedMarkerRef.current) return;
      onSchoolClickRef.current(null);
    };

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [selectedSchool]);

  // Handle selected rental - highlight nearest school
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (highlightLayerRef.current) { map.removeLayer(highlightLayerRef.current); highlightLayerRef.current = null; }

    if (!selectedRental) return;
    map.setView([selectedRental.lat, selectedRental.lng], Math.max(map.getZoom(), 14), { animate: true });

    // Find nearest school and highlight it
    let nearest = null;
    let minDist = Infinity;
    schools.forEach(s => {
      const d = haversineDistance(selectedRental.lat, selectedRental.lng, s.lat, s.lng);
      if (d < minDist) { minDist = d; nearest = s; }
    });
    if (nearest) {
      const h = L.circleMarker([nearest.lat, nearest.lng], {
        radius: 18,
        color: '#fbbf24',
        weight: 3,
        fillOpacity: 0,
      }).addTo(map);
      highlightLayerRef.current = h;
    }
  }, [selectedRental, schools]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Boundary loading helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the Toronto Open Data package metadata and return all GeoJSON resource IDs.
 */
async function fetchPackageResources() {
  const url = `${CKAN_BASE}/api/3/action/package_show?id=${PACKAGE_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`package_show failed: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('package_show returned success=false');

  const resources = data.result.resources || [];
  // Filter to GeoJSON resources (case-insensitive format check)
  return resources
    .filter(r => {
      const fmt = (r.format || '').toLowerCase();
      return fmt === 'geojson' || fmt === 'geo json';
    })
    .map(r => ({
      id: r.id,
      name: r.name,
      packageId: r.package_id || PACKAGE_ID,
      format: r.format,
      datastoreActive: r.datastore_active,
      datastoreCache: r.datastore_cache,
    }));
}

/**
 * Determine a board hint string from a resource name.
 */
function getBoardHintFromResourceName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('tdsb') || n.includes('toronto district')) return 'tdsb';
  if (n.includes('tcdsb') || n.includes('toronto catholic')) return 'tcdsb';
  if (n.includes('viamonde')) return 'csc_viamonde';
  if (n.includes('catholique') || n.includes('centre-sud')) return 'csc_catholique';
  return null;
}

/**
 * Download a single boundary GeoJSON resource from CKAN.
 * Tries the datastore cache URL first, then the direct download URL.
 */
async function fetchBoundaryGeoJSON(resource) {
  const { id, name, packageId, datastoreCache } = resource;

  // If there's a datastore cache, try the cached GeoJSON download
  let cacheId = id;
  if (datastoreCache) {
    try {
      const cacheData = typeof datastoreCache === 'string'
        ? JSON.parse(datastoreCache)
        : datastoreCache;
      const wgs84 = cacheData['4326'];
      if (wgs84) cacheId = wgs84;
    } catch (e) { /* use original id */ }
  }

  // Try the datastore dump (GeoJSON format)
  const dumpUrl = `${CKAN_BASE}/datastore/dump/${cacheId}?format=geojson`;
  // Try the direct download URL (WGS84 / 4326)
  const downloadUrl = `${CKAN_BASE}/dataset/${packageId}/resource/${cacheId}/download/${encodeURIComponent(name)} - 4326.geojson`;
  // Fallback direct download without projection suffix
  const downloadUrlPlain = `${CKAN_BASE}/dataset/${packageId}/resource/${id}/download/${encodeURIComponent(name)}.geojson`;

  const urls = [dumpUrl, downloadUrl, downloadUrlPlain];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || text.trim().startsWith('<')) continue; // HTML error page
      const geojson = JSON.parse(text);
      if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
        return geojson;
      }
    } catch (e) {
      // try next URL
    }
  }
  throw new Error(`Could not download GeoJSON for resource ${id}`);
}

/**
 * Load all available boundary GeoJSON datasets from Toronto Open Data.
 * Returns array of { features, resourceName, boardHint }.
 */
async function loadAllBoundaries() {
  let resources;
  try {
    resources = await fetchPackageResources();
  } catch (err) {
    console.warn('[Boundaries] package_show failed, using fallback resource ID:', err.message);
    // Fall back to the known resource ID from the existing codebase
    resources = [{
      id: 'bd7b0291-1be2-4494-aa90-ad37e73ae84d',
      name: 'School Attendance Boundary',
      packageId: PACKAGE_ID,
      format: 'geojson',
    }];
  }

  if (resources.length === 0) {
    console.warn('[Boundaries] No GeoJSON resources found in package');
    return [];
  }

  console.log(`[Boundaries] Found ${resources.length} GeoJSON resource(s):`, resources.map(r => r.name));

  // Download all resources concurrently
  const results = await Promise.allSettled(
    resources.map(async (resource) => {
      const geojson = await fetchBoundaryGeoJSON(resource);
      return {
        features: geojson.features,
        resourceName: resource.name,
        boardHint: getBoardHintFromResourceName(resource.name),
      };
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * On-demand boundary fetch for a specific school name.
 * Called when pre-loaded data isn't available or doesn't match.
 */
async function fetchBoundaryOnDemand(schoolName, school) {
  // Try the CKAN datastore_search with various field names
  const fieldNames = ['SCHOOL_NAME', 'school_name', 'Name', 'NAME', 'SchoolName'];

  // Try each possible field name
  for (const field of fieldNames) {
    try {
      const filters = JSON.stringify({ [field]: schoolName });
      const url = `${CKAN_BASE}/api/3/action/datastore_search?resource_id=bd7b0291-1be2-4494-aa90-ad37e73ae84d&filters=${encodeURIComponent(filters)}&limit=5`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const records = data?.result?.records;
      if (!records || records.length === 0) continue;

      const record = records[0];
      if (record.geometry) {
        try {
          const geom = typeof record.geometry === 'string'
            ? JSON.parse(record.geometry)
            : record.geometry;
          // Wrap in a feature if it's just geometry
          const feature = geom.type === 'Feature' ? geom : {
            type: 'Feature',
            properties: { SCHOOL_NAME: schoolName, ...record },
            geometry: geom,
          };
          return {
            feature,
            boardHint: school.schoolType === 'EP' ? 'tdsb'
              : school.schoolType === 'ES' ? 'tcdsb'
              : school.schoolType === 'FP' ? 'csc_viamonde'
              : null,
          };
        } catch (e) { /* ignore bad geometry */ }
      }
    } catch (e) {
      // try next field
    }
  }

  return null;
}

export { haversineDistance, rentalsData };
