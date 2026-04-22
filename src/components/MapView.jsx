import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import fraserRatings, { getFraserRating } from '../data/fraserRatings';
import { toTitleCase } from '../utils/school.js';
import { haversineDistance } from '../utils/geo';
import rentalsData from '../data/rentals';
import catchmentAreas from '../data/catchmentAreas';
import buildingFootprints from '../data/buildingFootprints.json';
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

/** When a catchment is shown, zoom so it fills most of the map (mask / colors unchanged). */
const CATCHMENT_FIT_PADDING = [4, 4];
const CATCHMENT_FIT_MAX_ZOOM = 19;

/** Catchment outline: match former fallback circle style (dotted). */
const CATCHMENT_DASH_ARRAY = '6 4';
const CATCHMENT_OUTLINE_WEIGHT = 2;

/** Simplified catchment shape: regular pentagon, enlarged vs the real boundary envelope. */
const PENTAGON_SIDES = 5;
const PENTAGON_RADIUS_SCALE = 1.38;
const PENTAGON_MIN_RADIUS_M = 280;
/** Former 500 m circle fallback — pentagon is larger for visibility. */
const FALLBACK_PENTAGON_RADIUS_M = 680;

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

/** Geographic destination from (lat,lng) with bearing (rad) and distance (m). */
function destinationLatLng(lat, lng, bearingRad, distanceM) {
  const R = 6371000;
  const δ = distanceM / R;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearingRad)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}

/** Regular polygon vertices as [lat,lng]; first vertex points north. */
function regularPolygonLatLngs(centerLat, centerLng, radiusMeters, sides) {
  const start = -Math.PI / 2;
  const verts = [];
  for (let i = 0; i < sides; i++) {
    const brg = start + (i / sides) * 2 * Math.PI;
    verts.push(destinationLatLng(centerLat, centerLng, brg, radiusMeters));
  }
  return verts;
}

function collectExteriorVerticesLatLng(geom) {
  if (!geom || !geom.coordinates) return [];
  if (geom.type === 'Polygon') {
    return geom.coordinates[0].map(([lng, lat]) => [lat, lng]);
  }
  if (geom.type === 'MultiPolygon') {
    const verts = [];
    for (const poly of geom.coordinates) {
      poly[0].forEach(([lng, lat]) => verts.push([lat, lng]));
    }
    return verts;
  }
  return [];
}

/**
 * Larger regular pentagon wrapping the geometry (centroid + max vertex distance × scale).
 * Rentals still use true polygons elsewhere — this is display only.
 */
function pentagonRingFromGeometry(geom) {
  const verts = collectExteriorVerticesLatLng(geom);
  if (verts.length < 3) return null;
  let clat = 0;
  let clng = 0;
  verts.forEach(([la, ln]) => {
    clat += la;
    clng += ln;
  });
  clat /= verts.length;
  clng /= verts.length;
  let maxR = 0;
  verts.forEach(([la, ln]) => {
    maxR = Math.max(maxR, haversineDistance(clat, clng, la, ln));
  });
  const radiusM = Math.max(maxR * PENTAGON_RADIUS_SCALE, PENTAGON_MIN_RADIUS_M);
  return regularPolygonLatLngs(clat, clng, radiusM, PENTAGON_SIDES);
}

// Pre-compute which school names have at least one rental in their catchment.
// Runs once at module load — O(rentals × catchments), fast enough at current data size.
const SCHOOLS_WITH_RENTALS = new Set();
rentalsData.forEach(rental => {
  Object.entries(catchmentAreas).forEach(([schoolName, area]) => {
    if (!SCHOOLS_WITH_RENTALS.has(schoolName) &&
        pointInPolygon(rental.lat, rental.lng, area.coordinates)) {
      SCHOOLS_WITH_RENTALS.add(schoolName);
    }
  });
});

// Returns dark text for light backgrounds (amber, green, orange, gray),
// white for red (#E53935) which is the only dark-enough background.
function markerTextColor(bg) {
  return bg === '#E53935' ? '#fff' : '#1a1a1a';
}

function makeSchoolIcon(type, rating, hasRentals, isFrench, titleText) {
  const ratingColor = rating === null || rating === undefined ? '#9ca3af'
    : rating >= 8 ? '#4CAF50'
    : rating >= 6 ? '#FFC107'
    : rating >= 4 ? '#FF9800'
    : '#E53935';
  const textColor = markerTextColor(ratingColor);
  const label = rating !== null && rating !== undefined ? rating.toFixed(1) : '–';
  const frBadge = isFrench
    ? `<div style="position:absolute;bottom:-2px;right:-2px;background:#dcfce7;color:#15803d;font-size:8px;font-weight:800;padding:1px 4px;border-radius:6px;border:1.5px solid #fff;">FR</div>`
    : '';
  const safeTitle = (titleText || '').replace(/"/g, '&quot;');
  const html = `
    <div tabindex="0" title="${safeTitle}" style="
      position:relative;
      width:54px;height:54px;border-radius:50%;
      background:${ratingColor};
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      color:${textColor};font-size:13px;font-weight:800;font-family:sans-serif;
      letter-spacing:-0.5px;
    ">${label}${frBadge}</div>`;
  return L.divIcon({
    className: '',
    html,
    iconSize: [54, 54],
    iconAnchor: [27, 27],
    popupAnchor: [0, -30],
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

function matchesTypeFilter(schoolType, boardFilter, languageFilter) {
  const isPublic = schoolType === 'EP' || schoolType === 'FP';
  const isCatholic = schoolType === 'EC' || schoolType === 'ES' || schoolType === 'FC' || schoolType === 'FS';
  const isFrench = schoolType === 'FP' || schoolType === 'FC' || schoolType === 'FS';

  if (boardFilter === 'public' && !isPublic) return false;
  if (boardFilter === 'catholic' && !isCatholic) return false;
  if (languageFilter === 'french' && !isFrench) return false;
  if (languageFilter === 'english' && isFrench) return false;
  return true;
}

function addLegend(map) {
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <div class="map-legend__title">Fraser Rating</div>
      ${[
        ['8–10', '#4CAF50', 'Excellent'],
        ['6–8',  '#FFC107', 'Good'],
        ['4–6',  '#FF9800', 'Average'],
        ['< 4',  '#E53935', 'Below avg'],
        ['N/A',  '#9ca3af', 'Not rated'],
      ].map(([score, color, label]) => `
        <div class="map-legend__row">
          <div style="width:26px;height:26px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:800;flex-shrink:0;">${score}</div>
          <span>${label}</span>
        </div>
      `).join('')}
      <div class="map-legend__note">Pins show school scores.<br>Tap a pin to see rentals.</div>
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

const FRENCH_TYPES = new Set(['FP', 'FC', 'FS']);
const SECONDARY_TYPES = new Set(['ES', 'FS']);
// FS covers French Catholic schools — many are elementary in Toronto's GeoJSON
const ELEMENTARY_TYPES = new Set(['EP', 'EC', 'FP', 'FC', 'FS']);

export default function MapView({
  ratingMin, ratingMax, boardFilter, languageFilter, gradeLevelFilter,
  budgetMin, budgetMax,
  onSchoolClick, onRentalClick,
  selectedSchool, selectedRental,
  onVisibleCountChange,
  onSchoolsLoaded,
  exploreRentalsMode,
  onMapReady,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const schoolLayersRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const rentalLayersRef = useRef([]);
  const catchmentLayerRef = useRef(null);
  const circleLayerRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const maskLayerRef = useRef(null);
  const clickedMarkerRef = useRef(false);
  const onSchoolClickRef = useRef(onSchoolClick);
  const selectionTokenRef = useRef(0);
  // buildingCacheRef is seeded synchronously from the static JSON import.
  // Keys are "lat,lng" strings. Augmented by live Overpass for any missing entries.
  const buildingCacheRef = useRef(
    // Seed cache from static JSON. null means "no building found — skip Overpass".
    // Only omit entries where the rental ID is completely absent from the JSON.
    Object.fromEntries(
      rentalsData
        .filter(r => String(r.id) in buildingFootprints)
        .map(r => [`${r.lat},${r.lng}`, buildingFootprints[String(r.id)]])
    )
  );
  const [schools, setSchools] = useState([]);
  const [tileError, setTileError] = useState(false);
  const tileErrorTimerRef = useRef(null);

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
      zoomControl: false,
      attributionControl: false, // we place it manually to avoid mobile bottom-sheet overlap
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // Attribution at topright so it never overlaps the mobile bottom sheet
    L.control.attribution({ position: 'topright', prefix: false })
      .addAttribution(
        'Map tiles by <a href="https://carto.com/">Carto</a>, under CC BY 3.0. ' +
        'Data by <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, under ODbL.'
      )
      .addTo(map);
    // Improve SR context for attribution links injected by Leaflet.
    setTimeout(() => {
      const links = map.getContainer().querySelectorAll('.leaflet-control-attribution a');
      links.forEach((link) => {
        const label = link.textContent?.trim();
        if (!label) return;
        link.setAttribute('aria-label', `${label} attribution link`);
      });
    }, 0);
    const tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 20,
    });
    tileLayer.on('tileerror', () => {
      setTileError(true);
      if (tileErrorTimerRef.current) clearTimeout(tileErrorTimerRef.current);
      tileErrorTimerRef.current = setTimeout(() => setTileError(false), 4000);
    });
    tileLayer.addTo(map);
    mapInstanceRef.current = map;
    onMapReady && onMapReady(map);

    addLegend(map);
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
            // used for URL deep-linking — do not change existing ids
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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

    // Remove old cluster group and school markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    schoolLayersRef.current = [];

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const scores = markers.map(m => m.options.fraserScore ?? 0);
        const topScore = Math.max(...scores);
        const count = cluster.getChildCount();
        const bg = topScore >= 7.5 ? '#4CAF50' : topScore >= 5.0 ? '#FFC107' : '#E53935';
        const clusterTextColor = markerTextColor(bg);
        const subTextColor = bg === '#E53935' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)';
        const label = topScore > 0 ? topScore.toFixed(1) : '–';
        const topMarker = markers.reduce((best, m) =>
          (m.options.fraserScore ?? 0) > (best.options.fraserScore ?? 0) ? m : best
        );
        const topName = topMarker.options.schoolName ? toTitleCase(topMarker.options.schoolName) : '';
        const clusterTitle = `${count} schools in this area. Highest rated: ${topName} ${topScore > 0 ? topScore.toFixed(1) : ''}`.trim().replace(/"/g, '&quot;');
        return L.divIcon({
          className: '',
          html: `<div tabindex="0" title="${clusterTitle}" style="width:52px;height:52px;border-radius:50%;background:${bg};border:2px solid rgba(255,255,255,0.35);box-shadow:0 4px 10px -4px rgba(0,0,0,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">` +
                `<span style="color:${clusterTextColor};font-size:13px;font-weight:700;font-family:sans-serif;line-height:1;">${label}</span>` +
                `<span style="color:${subTextColor};font-size:10px;font-weight:500;font-family:sans-serif;line-height:1;">${count}</span>` +
                `</div>`,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });
      },
    });

    clusterGroup.on('clustermouseover', (e) => {
      const cluster = e.layer;
      const markers = cluster.getAllChildMarkers();
      const top = markers.reduce((best, m) =>
        (m.options.fraserScore ?? 0) > (best.options.fraserScore ?? 0) ? m : best
      );
      const score = top.options.fraserScore;
      const name = top.options.schoolName ? toTitleCase(top.options.schoolName) : '';
      if (name && score != null) {
        cluster.bindTooltip(`Top rated: ${name} · ${score.toFixed(1)}`, { direction: 'top', offset: [0, -8] }).openTooltip();
      }
    });
    clusterGroup.on('clustermouseout', (e) => {
      e.layer.unbindTooltip();
    });

    clusterGroupRef.current = clusterGroup;

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
      if (!matchesTypeFilter(schoolType, boardFilter, languageFilter)) return;

      // Grade level filter (JK–8 ≈ elementary types in board data)
      if (gradeLevelFilter === 'jk8' && !ELEMENTARY_TYPES.has(schoolType)) return;
      if (gradeLevelFilter === 'secondary' && !SECONDARY_TYPES.has(schoolType)) return;

      // Rating filter: unrated schools always show unless we explicitly need a rating
      const ratingOk = rating === null
        ? (ratingMin === 0)
        : (rating >= ratingMin && rating <= ratingMax);
      if (!ratingOk) return;

      visibleSchoolCount++;
      const hasRentals = SCHOOLS_WITH_RENTALS.has(school.name.trim());
      const isFrench = FRENCH_TYPES.has(schoolType);
      const titleName = toTitleCase(school.name);
      const markerTitle = `${titleName}, Fraser score ${rating != null ? rating.toFixed(1) : 'N/A'} out of 10`;
      const marker = L.marker([lat, lng], { icon: makeSchoolIcon(schoolType, rating, hasRentals, isFrench, markerTitle), fraserScore: rating ?? 0, schoolName: school.name });
      const shortName = titleName.length > 22 ? titleName.substring(0, 20) + '…' : titleName;
      marker.bindTooltip(shortName, {
        direction: 'top',
        offset: [0, -10],
        permanent: true,
        className: 'school-label',
      });
      marker.on('click', () => {
        clickedMarkerRef.current = true;
        setTimeout(() => { clickedMarkerRef.current = false; }, 0);
        onSchoolClick(school);
      });
      clusterGroup.addLayer(marker);
      schoolLayersRef.current.push(marker);
    });

    map.addLayer(clusterGroup);
    onVisibleCountChange && onVisibleCountChange(visibleSchoolCount, 0);

    // Attach keyboard handlers to any markers already in the DOM (non-clustered at current zoom).
    // Markers hidden inside clusters have no element yet; they pick up the handler when
    // they are individually rendered (via the tabindex="0" already in the divIcon HTML).
    requestAnimationFrame(() => {
      schoolLayersRef.current.forEach(marker => {
        const el = marker.getElement();
        if (!el) return;
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            marker.fire('click');
          }
        });
      });
    });
  }, [schools, ratingMin, ratingMax, boardFilter, languageFilter, gradeLevelFilter]);

  // Hide school cluster while in explore-rentals mode
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;
    const map = mapInstanceRef.current;
    if (exploreRentalsMode) {
      if (map.hasLayer(clusterGroupRef.current)) map.removeLayer(clusterGroupRef.current);
    } else {
      if (!map.hasLayer(clusterGroupRef.current)) map.addLayer(clusterGroupRef.current);
    }
  }, [exploreRentalsMode]);

  // Update catchment polygon border prominence when rental explore mode changes
  useEffect(() => {
    if (!catchmentLayerRef.current) return;
    if (exploreRentalsMode) {
      catchmentLayerRef.current.setStyle({
        color: '#2f6b4f',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.06,
        dashArray: CATCHMENT_DASH_ARRAY,
      });
    } else if (selectedSchool) {
      const colors = (() => {
        const r = selectedSchool.rating;
        if (r === null || r === undefined) return { color: '#9ca3af', fillColor: 'rgba(128,128,128,0.08)' };
        if (r >= 7) return { color: '#4CAF50', fillColor: 'rgba(76,175,80,0.12)' };
        if (r >= 4) return { color: '#FFC107', fillColor: 'rgba(255,193,7,0.10)' };
        return { color: '#E53935', fillColor: 'rgba(244,67,54,0.08)' };
      })();
      catchmentLayerRef.current.setStyle({
        color: colors.color,
        weight: CATCHMENT_OUTLINE_WEIGHT,
        opacity: 1,
        fillOpacity: 1,
        dashArray: CATCHMENT_DASH_ARRAY,
      });
    }
  }, [exploreRentalsMode, selectedSchool]);

  // Handle selected school - draw catchment boundary
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove previous catchment/circle/mask
    if (catchmentLayerRef.current) { map.removeLayer(catchmentLayerRef.current); catchmentLayerRef.current = null; }
    if (circleLayerRef.current) { map.removeLayer(circleLayerRef.current); circleLayerRef.current = null; }
    if (highlightLayerRef.current) { map.removeLayer(highlightLayerRef.current); highlightLayerRef.current = null; }
    if (maskLayerRef.current) { map.removeLayer(maskLayerRef.current); maskLayerRef.current = null; }

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

    // Pan only — zoom comes from fitBounds on the boundary (avoids zoom 14 then re-zoom)
    map.panTo([lat, lng], { animate: true });

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
          drawFallbackPentagon(map, lat, lng);
        }
      })
      .catch(() => {
        if (selectionTokenRef.current === token) {
          drawFallbackPentagon(map, lat, lng);
        }
      });

    // Ray-cast point-in-polygon using Overpass geometry ({lat,lon}[] ring)
    function insideWay(way, lat, lng) {
      const ring = way.geometry;
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

    /**
     * Fetch building footprints for ALL rentals in one single Overpass request.
     * The cache is pre-seeded from buildingFootprints.json at module init.
     * This function only hits Overpass for any rentals still missing from cache.
     * Returns a Map: `${lat},${lng}` → [[lat,lon], ...] coords array | null
     */
    async function fetchBuildingsBatch(rentals) {
      // Check cache first — collect only uncached rentals
      const uncached = rentals.filter(r => buildingCacheRef.current[`${r.lat},${r.lng}`] === undefined);

      if (uncached.length > 0) {
        // Build a union query: one `way[building](around:60,lat,lng)` per rental
        const unions = uncached.map(r => `way[building](around:60,${r.lat},${r.lng});`).join('\n  ');
        const query = `[out:json][timeout:25];\n(\n  ${unions}\n);\nout geom;`;

        try {
          const res = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
          );
          if (res.ok) {
            const data = await res.json();
            const ways = (data.elements || []).filter(e => e.geometry?.length > 2);

            // For each uncached rental, find the best matching building
            uncached.forEach(r => {
              const key = `${r.lat},${r.lng}`;
              // First try: a way that contains the point
              let hit = ways.find(w => insideWay(w, r.lat, r.lng));
              // Fallback: nearest way (by centroid distance)
              if (!hit && ways.length > 0) {
                let best = null, bestDist = Infinity;
                ways.forEach(w => {
                  const clat = w.geometry.reduce((s, p) => s + p.lat, 0) / w.geometry.length;
                  const clng = w.geometry.reduce((s, p) => s + p.lon, 0) / w.geometry.length;
                  const d = haversineDistance(r.lat, r.lng, clat, clng);
                  if (d < bestDist && d < 80) { bestDist = d; best = w; }
                });
                hit = best;
              }
              buildingCacheRef.current[key] = hit
                ? hit.geometry.map(p => [p.lat, p.lon])
                : null;
            });
          }
        } catch (_) {}

        // Ensure every uncached rental has a cache entry (null = no building found)
        uncached.forEach(r => {
          const key = `${r.lat},${r.lng}`;
          if (buildingCacheRef.current[key] === undefined) {
            buildingCacheRef.current[key] = null;
          }
        });
      }

      // Return a lookup map from all rentals
      const result = new Map();
      rentals.forEach(r => {
        result.set(`${r.lat},${r.lng}`, buildingCacheRef.current[`${r.lat},${r.lng}`] ?? null);
      });
      return result;
    }

    function renderRentalLayer(rental, coords, map) {
      let layer;
      if (coords) {
        layer = L.polygon(coords, {
          color: RENTAL_COLOR,
          weight: 2,
          fillColor: RENTAL_COLOR,
          fillOpacity: 0.55,
        });
      } else {
        layer = L.circleMarker([rental.lat, rental.lng], {
          radius: 10,
          color: RENTAL_COLOR,
          weight: 2,
          fillColor: RENTAL_COLOR,
          fillOpacity: 0.55,
        });
      }

      // Build mini-card popup
      const distMeters = selectedSchool
        ? haversineDistance(selectedSchool.lat, selectedSchool.lng, rental.lat, rental.lng)
        : null;
      const distText = distMeters === null ? ''
        : distMeters < 1000
        ? `${Math.round(distMeters * 1.3 / 80)} min walk`
        : `${(distMeters / 1000).toFixed(1)}km`;
      const typeCap = rental.type ? rental.type.charAt(0).toUpperCase() + rental.type.slice(1) : '';
      const btnId = `rv-${rental.id}`;
      const photoHtml = rental.imageUrl
        ? `<img src="${rental.imageUrl}" style="width:100%;height:80px;object-fit:cover;display:block;" />`
        : `<div style="width:100%;height:80px;background:#efefec;display:flex;align-items:center;justify-content:center;font-size:24px;">&#127968;</div>`;
      const bedsNum = rental.bedrooms ?? rental.beds ?? '';
      const popupHtml = `${photoHtml}<div class="rental-popup-body"><div style="font-size:15px;font-weight:700;color:#1a1a1a;">$${rental.price.toLocaleString()}/mo</div><div style="font-size:12px;color:#6b6b6b;">${bedsNum} bed · ${typeCap}</div>${distText ? `<div style="font-size:12px;color:#6b6b6b;">${distText}</div>` : ''}<a id="${btnId}" href="#" style="font-size:12px;color:#2f6b4f;font-weight:600;text-decoration:none;margin-top:4px;display:inline-block;">View details &#8594;</a></div>`;

      const popup = L.popup({
        maxWidth: 200,
        minWidth: 180,
        className: 'rental-popup',
        closeButton: false,
        offset: [0, -10],
      }).setContent(popupHtml);

      layer.bindPopup(popup);

      layer.on('popupopen', () => {
        const btn = document.getElementById(btnId);
        if (btn && !btn.dataset.listenerAdded) {
          btn.dataset.listenerAdded = 'true';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            layer.closePopup();
            clickedMarkerRef.current = true;
            setTimeout(() => { clickedMarkerRef.current = false; }, 0);
            onRentalClick(rental);
          });
        }
      });

      // Desktop: open popup on hover
      layer.on('mouseover', () => {
        if (window.innerWidth > 768) layer.openPopup();
      });

      // Always prevent map deselection; on mobile first tap opens popup
      layer.on('click', () => {
        clickedMarkerRef.current = true;
        setTimeout(() => { clickedMarkerRef.current = false; }, 0);
        if (window.innerWidth <= 768) layer.openPopup();
      });

      layer.addTo(map);
      rentalLayersRef.current.push(layer);
    }

    async function showNearbyRentals(schoolName, centerLat, centerLng, token) {
      rentalLayersRef.current.forEach(l => map.removeLayer(l));
      rentalLayersRef.current = [];
      const area = catchmentAreas[schoolName.trim()];

      const filtered = rentalsData.filter(rental => {
        if (area) {
          if (!pointInPolygon(rental.lat, rental.lng, area.coordinates)) return false;
        } else {
          if (haversineDistance(centerLat, centerLng, rental.lat, rental.lng) > 800) return false;
        }
        if (budgetMin != null && rental.price < budgetMin) return false;
        if (budgetMax != null && rental.price > budgetMax) return false;
        return true;
      });

      onVisibleCountChange && onVisibleCountChange(null, filtered.length);
      if (filtered.length === 0) return;

      // Single batch request for all building footprints
      const buildingMap = await fetchBuildingsBatch(filtered);
      if (selectionTokenRef.current !== token) return; // stale

      filtered.forEach(rental => {
        const coords = buildingMap.get(`${rental.lat},${rental.lng}`);
        renderRentalLayer(rental, coords, map);
      });
    }

    /** Dim outside using the same ring shown for the catchment (pentagon). */
    function drawCatchmentMaskFromLatLngRing(ringLatLng) {
      const closed = [...ringLatLng, ringLatLng[0]];
      const holeRing = closed.map(([latt, lng]) => [lng, latt]).reverse();
      const worldRing = [
        [90, -180], [90, 180], [-90, 180], [-90, -180], [90, -180],
      ];
      const mask = L.polygon([worldRing, holeRing], {
        color: 'transparent',
        fillColor: '#0f172a',
        fillOpacity: 0.32,
        interactive: false,
      }).addTo(map);
      maskLayerRef.current = mask;
    }

    function getRatingZoneColors(rating) {
      if (rating === null || rating === undefined) return { color: '#9ca3af', fillColor: 'rgba(128,128,128,0.08)' };
      if (rating >= 7) return { color: '#4CAF50', fillColor: 'rgba(76,175,80,0.12)' };
      if (rating >= 4) return { color: '#FFC107', fillColor: 'rgba(255,193,7,0.10)' };
      return { color: '#E53935', fillColor: 'rgba(244,67,54,0.08)' };
    }

    function drawBoundaryPolygon(map, feature, boardHint) {
      if (catchmentLayerRef.current) { map.removeLayer(catchmentLayerRef.current); catchmentLayerRef.current = null; }
      if (circleLayerRef.current) { map.removeLayer(circleLayerRef.current); circleLayerRef.current = null; }
      if (maskLayerRef.current) { map.removeLayer(maskLayerRef.current); maskLayerRef.current = null; }

      const colors = getRatingZoneColors(selectedSchool ? selectedSchool.rating : null);

      const geom = feature.geometry;
      const pentRing = geom ? pentagonRingFromGeometry(geom) : null;

      if (!pentRing) {
        const layer = L.geoJSON(feature, {
          style: {
            color: colors.color,
            weight: CATCHMENT_OUTLINE_WEIGHT,
            fillColor: colors.fillColor,
            fillOpacity: 1,
            dashArray: CATCHMENT_DASH_ARRAY,
          },
        }).addTo(map);
        catchmentLayerRef.current = layer;
        try {
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              padding: CATCHMENT_FIT_PADDING,
              maxZoom: CATCHMENT_FIT_MAX_ZOOM,
            });
          }
        } catch (e) { /* ignore */ }
        showNearbyRentals(name, lat, lng, token);
        return;
      }

      drawCatchmentMaskFromLatLngRing(pentRing);

      const layer = L.polygon(pentRing, {
        color: colors.color,
        weight: CATCHMENT_OUTLINE_WEIGHT,
        opacity: 1,
        fillColor: colors.fillColor,
        fillOpacity: 1,
        dashArray: CATCHMENT_DASH_ARRAY,
      }).addTo(map);
      catchmentLayerRef.current = layer;

      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: CATCHMENT_FIT_PADDING,
            maxZoom: CATCHMENT_FIT_MAX_ZOOM,
          });
        }
      } catch (e) { /* ignore */ }

      showNearbyRentals(name, lat, lng, token);
    }

    function drawFallbackPentagon(map, lat, lng) {
      const colors = getRatingZoneColors(selectedSchool ? selectedSchool.rating : null);
      const pentRing = regularPolygonLatLngs(lat, lng, FALLBACK_PENTAGON_RADIUS_M, PENTAGON_SIDES);
      drawCatchmentMaskFromLatLngRing(pentRing);
      const layer = L.polygon(pentRing, {
        color: colors.color,
        weight: CATCHMENT_OUTLINE_WEIGHT,
        opacity: 1,
        fillColor: colors.fillColor,
        fillOpacity: 1,
        dashArray: CATCHMENT_DASH_ARRAY,
      }).addTo(map);
      catchmentLayerRef.current = layer;
      try {
        const b = layer.getBounds();
        if (b.isValid()) {
          map.fitBounds(b, {
            padding: CATCHMENT_FIT_PADDING,
            maxZoom: CATCHMENT_FIT_MAX_ZOOM,
          });
        }
      } catch (e) { /* ignore */ }
      showNearbyRentals(name, lat, lng, token);
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

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className={`map-toast${tileError ? ' map-toast--visible' : ''}`}>
        Map tiles loading slowly — try refreshing if the map looks incomplete.
      </div>
    </>
  );
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

export { rentalsData };
export { haversineDistance } from '../utils/geo';
