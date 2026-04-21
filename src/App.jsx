import catchmentAreas from './data/catchmentAreas';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import MapView, { haversineDistance, rentalsData } from './components/MapView';
import SchoolPanel from './components/SchoolPanel';
import RentalPanel from './components/RentalPanel';
import FilterBar from './components/FilterBar';
import SchoolList from './components/SchoolList';
import PurposeChip from './components/PurposeChip';
import fraserRatings from './data/fraserRatings';
import './App.css';

function RentalListView({ rentals, onRentalClick, sort, onSortChange }) {
  const sorted = [...rentals].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return (a.distance || 0) - (b.distance || 0);
  });
  return (
    <div className="panel school-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="rental-list-sort-bar">
        <span className="rental-list-sort-label">Sort by</span>
        <div className="segmented-control">
          {[
            { label: 'Price ↑', value: 'price-asc' },
            { label: 'Price ↓', value: 'price-desc' },
            { label: 'Distance', value: 'distance' },
          ].map(o => (
            <button key={o.value} className={`segmented-btn${sort === o.value ? ' active' : ''}`} onClick={() => onSortChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="sidebar__empty-state">
          <span className="sidebar__empty-icon">🏠</span>
          <p className="sidebar__empty-text">No rentals found inside this catchment right now.</p>
        </div>
      ) : (
        <ul className="panel__rental-list" style={{ padding: '8px 12px' }}>
          {sorted.map(r => (
            <li key={r.id} className="panel__rental-item" onClick={() => onRentalClick(r)}>
              {r.imageUrl && <img className="panel__rental-photo" src={r.imageUrl} alt={r.address} loading="lazy" />}
              <div className="panel__rental-body">
                <div className="panel__rental-address">{r.address}</div>
                <div className="panel__rental-neighbourhood">{r.neighbourhood}</div>
                <div className="panel__rental-meta">
                  <span className="panel__rental-price">${r.price.toLocaleString()}/mo</span>
                  <span className="panel__rental-beds">{r.bedrooms}bd · {r.bathrooms}ba</span>
                  <span className="panel__rental-type">{r.type}</span>
                </div>
                {r.distance != null && (
                  <div className="panel__rental-distance">
                    {r.distance < 1000 ? `~${Math.round(r.distance * 1.3 / 80)} min walk` : `${(r.distance / 1000).toFixed(1)}km`}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [boardFilter, setBoardFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [gradeLevelFilter, setGradeLevelFilter] = useState('jk6');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [previousSchool, setPreviousSchool] = useState(null);
  const [visibleSchoolCount, setVisibleSchoolCount] = useState(0);
  const [visibleRentalCount, setVisibleRentalCount] = useState(0);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [rentalExploreMode, setRentalExploreMode] = useState(false);
  const [listView, setListView] = useState(false);
  const [rentalSort, setRentalSort] = useState('price-asc');
  const [showSchoolList, setShowSchoolList] = useState(false);

  const pendingSchoolIdRef = useRef(null);
  const pendingModeRef = useRef(null);
  const urlInitDoneRef = useRef(false);
  const toastTimerRef = useRef(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // Callback from MapView when schools are loaded and filters change
  const handleVisibleCountChange = useCallback((sc, rc) => {
    setVisibleSchoolCount(sc);
    setVisibleRentalCount(rc);
  }, []);

  // When a school marker is clicked
  const handleSchoolClick = useCallback((school) => {
    setSelectedRental(null);
    setSelectedSchool(school);
    setRentalExploreMode(false);
  }, []);

  const handleExploreRentals = useCallback(() => {
    setRentalExploreMode(true);
    setListView(false);
    setRentalSort('price-asc');
  }, []);
  const handleBackToOverview = useCallback(() => {
    setRentalExploreMode(false);
    setListView(false);
  }, []);

  // When a rental marker is clicked — remember which school we came from
  const handleRentalClick = useCallback((rental) => {
    setPreviousSchool(selectedSchool);
    setSelectedSchool(null);
    setSelectedRental(rental);
  }, [selectedSchool]);

  // Navigate back to the school we came from
  const handleBackToSchool = useCallback(() => {
    if (previousSchool) {
      setSelectedRental(null);
      setSelectedSchool(previousSchool);
      setPreviousSchool(null);
    }
  }, [previousSchool]);

  // Get rentals within the selected school's catchment polygon
  const nearbyRentals = selectedSchool
    ? (() => {
        const area = catchmentAreas[selectedSchool.name.trim()];
        if (!area) return [];
        return rentalsData
          .filter(r => pointInPolygon(r.lat, r.lng, area.coordinates))
          .filter(r => r.price >= budgetMin && r.price <= budgetMax)
          .map(r => ({
            ...r,
            distance: haversineDistance(selectedSchool.lat, selectedSchool.lng, r.lat, r.lng),
          }))
          .sort((a, b) => a.distance - b.distance);
      })()
    : [];

  // For RentalPanel: get nearby schools from GeoJSON — we'll pass the schools state up via a ref trick
  // Instead, we import fraserRatings and reconstruct schools from GeoJSON in the panel
  // We'll store schools in a ref accessible from App
  const [loadedSchools, setLoadedSchools] = useState([]);

  const handleSchoolsLoaded = useCallback((schools) => {
    setLoadedSchools(schools);
    if (pendingSchoolIdRef.current) {
      const pendingId = pendingSchoolIdRef.current;
      pendingSchoolIdRef.current = null;
      const school = schools.find(s => s.id === pendingId);
      if (school) {
        handleSchoolClick(school);
        if (pendingModeRef.current === 'explore') {
          pendingModeRef.current = null;
          setRentalExploreMode(true);
        }
      }
    }
  }, [handleSchoolClick]);

  // Mirror MapView filter logic so SchoolList shows the same set as map markers
  const filteredSchools = useMemo(() => {
    const ELEMENTARY = new Set(['EP', 'EC', 'FP', 'FC', 'FS']); // FS = French Catholic (many are elementary in Toronto)
    const SECONDARY  = new Set(['ES', 'FS']);
    return loadedSchools.filter(({ schoolType, rating }) => {
      if (schoolType === 'PR') return false;
      const isPublic   = schoolType === 'EP' || schoolType === 'FP';
      const isCatholic = schoolType === 'EC' || schoolType === 'ES' || schoolType === 'FC' || schoolType === 'FS';
      const isFrench   = schoolType === 'FP' || schoolType === 'FC' || schoolType === 'FS';
      if (boardFilter === 'public'   && !isPublic)   return false;
      if (boardFilter === 'catholic' && !isCatholic) return false;
      if (languageFilter === 'french'  && !isFrench) return false;
      if (languageFilter === 'english' &&  isFrench) return false;
      if ((gradeLevelFilter === 'jk6' || gradeLevelFilter === 'grade78') && !ELEMENTARY.has(schoolType)) return false;
      if (gradeLevelFilter === 'secondary' && !SECONDARY.has(schoolType)) return false;
      const ratingOk = rating === null ? (ratingMin === 0) : (rating >= ratingMin && rating <= ratingMax);
      return ratingOk;
    });
  }, [loadedSchools, ratingMin, ratingMax, boardFilter, languageFilter, gradeLevelFilter]);

  // Point-in-polygon (ray casting) — coordinates are [lng, lat] pairs
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

  // Write URL whenever relevant state changes.
  // MUST appear before the URL parse effect so on mount this runs first (urlInitDoneRef=false) and skips.
  useEffect(() => {
    if (!urlInitDoneRef.current) return;
    const params = new URLSearchParams();
    if (selectedSchool) {
      params.set('school', selectedSchool.id);
    } else if (pendingSchoolIdRef.current) {
      params.set('school', pendingSchoolIdRef.current);
    }
    if (boardFilter !== 'all') params.set('board', boardFilter === 'public' ? 'tdsb' : 'tcdsb');
    if (languageFilter !== 'all') params.set('lang', languageFilter);
    if (gradeLevelFilter !== 'jk6') {
      params.set('grade', gradeLevelFilter === 'secondary' ? '912' : gradeLevelFilter === 'grade78' ? '78' : gradeLevelFilter);
    }
    if (ratingMin !== 0) params.set('minScore', String(ratingMin));
    if (rentalExploreMode && selectedSchool) params.set('mode', 'explore');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }, [selectedSchool, boardFilter, languageFilter, gradeLevelFilter, ratingMin, rentalExploreMode]);

  // Parse URL on mount and restore filter/school state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const board = params.get('board');
    const lang = params.get('lang');
    const grade = params.get('grade');
    const minScore = params.get('minScore');
    const schoolId = params.get('school');
    const mode = params.get('mode');

    if (board === 'tdsb') setBoardFilter('public');
    else if (board === 'tcdsb') setBoardFilter('catholic');
    if (lang === 'french') setLanguageFilter('french');
    else if (lang === 'english') setLanguageFilter('english');
    if (grade === 'jk6') setGradeLevelFilter('jk6');
    else if (grade === '78') setGradeLevelFilter('grade78');
    else if (grade === '912') setGradeLevelFilter('secondary');
    else if (grade === 'all') setGradeLevelFilter('all');
    if (minScore) setRatingMin(Number(minScore));
    if (schoolId) pendingSchoolIdRef.current = schoolId;
    if (mode === 'explore') pendingModeRef.current = 'explore';

    urlInitDoneRef.current = true;
  }, []);

  // Share current URL — navigator.share on mobile, clipboard on desktop
  const handleShare = useCallback(() => {
    const url = window.location.href;
    const title = selectedSchool
      ? `${selectedSchool.name.replace(/\b\w/g, c => c.toUpperCase())} · Rent by School`
      : 'Rent by School';
    if (navigator.share && window.innerWidth <= 768) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard');
      }).catch(() => {});
    }
  }, [selectedSchool, showToast]);

  const assignedSchool = selectedRental
    ? loadedSchools.find(s => {
        const area = catchmentAreas[s.name.trim()];
        return area ? pointInPolygon(selectedRental.lat, selectedRental.lng, area.coordinates) : false;
      }) || null
    : null;

  return (
    <div className="app">
      {/* Skip link — visually hidden until focused, for keyboard/screen-reader users */}
      <a href="#school-list" className="skip-link">Skip to school list</a>

      {/* Unified left sidebar: filters + detail panel */}
      <div className={`app__sidebar${(selectedSchool || selectedRental) ? ' app__sidebar--expanded' : ''}`}>
        <FilterBar
          ratingMin={ratingMin}
          ratingMax={ratingMax}
          onRatingMinChange={setRatingMin}
          onRatingMaxChange={setRatingMax}
          boardFilter={boardFilter}
          onBoardFilterChange={setBoardFilter}
          languageFilter={languageFilter}
          onLanguageFilterChange={setLanguageFilter}
          gradeLevelFilter={gradeLevelFilter}
          onGradeLevelChange={setGradeLevelFilter}
          selectedSchool={selectedSchool}
          nearbyRentalCount={nearbyRentals.length}
          schoolSearch={schoolSearch}
          onSchoolSearchChange={setSchoolSearch}
          allSchools={loadedSchools}
          onSchoolSelect={handleSchoolClick}
          onResetFilters={() => {
            setRatingMin(0); setRatingMax(10);
            setBoardFilter('all'); setLanguageFilter('all'); setGradeLevelFilter('jk6');
          }}
        />
        {/* Scrollable content area below the fixed filter bar */}
        <div className="app__sidebar-content">
          {/* Desktop: Map ↔ Schools list toggle (hidden when a panel is open) */}
          {!selectedSchool && !selectedRental && (
            <div className="sidebar-view-toggle" role="group" aria-label="View mode">
              <button
                className={`segmented-btn${!showSchoolList ? ' active' : ''}`}
                onClick={() => setShowSchoolList(false)}
                aria-pressed={!showSchoolList}
              >
                Map
              </button>
              <button
                className={`segmented-btn${showSchoolList ? ' active' : ''}`}
                onClick={() => setShowSchoolList(true)}
                aria-pressed={showSchoolList}
              >
                Schools list
              </button>
            </div>
          )}

          {selectedSchool && rentalExploreMode && listView ? (
            <RentalListView
              rentals={nearbyRentals}
              onRentalClick={handleRentalClick}
              sort={rentalSort}
              onSortChange={setRentalSort}
            />
          ) : selectedSchool && (
            <SchoolPanel
              school={selectedSchool}
              nearbyRentals={nearbyRentals}
              onClose={() => { setSelectedSchool(null); setRentalExploreMode(false); }}
              onRentalClick={handleRentalClick}
              rentalMode={rentalExploreMode}
              onExploreRentals={handleExploreRentals}
              onBackToOverview={handleBackToOverview}
              onShareClick={handleShare}
              budgetMin={budgetMin}
              budgetMax={budgetMax}
              onBudgetMinChange={setBudgetMin}
              onBudgetMaxChange={setBudgetMax}
            />
          )}
          {selectedRental && (
            <RentalPanel
              rental={selectedRental}
              assignedSchool={assignedSchool}
              previousSchool={previousSchool}
              onClose={() => { setSelectedRental(null); setPreviousSchool(null); }}
              onSchoolClick={handleSchoolClick}
              onBackToSchool={handleBackToSchool}
            />
          )}
          {!selectedSchool && !selectedRental && showSchoolList && (
            <SchoolList schools={filteredSchools} onSchoolSelect={handleSchoolClick} />
          )}
          {!selectedSchool && !selectedRental && !showSchoolList && (
            <div className="sidebar__empty-state">
              <span className="sidebar__empty-icon">🏫</span>
              <p className="sidebar__empty-text">Click a school pin to see nearby rentals in its catchment</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="app__map">
        {/* "How it works" chip — always visible on map */}
        <PurposeChip />

        {/* Mobile filter bar — only visible on ≤768px */}
        <div className="mobile-top-filters">
          <button
            className={`mtf-pill mtf-pill--dark${mobileFiltersOpen ? ' mtf-pill--open' : ''}`}
            onClick={() => setMobileFiltersOpen(o => !o)}
          >
            School filters {mobileFiltersOpen ? '▴' : '▾'}
          </button>
          <button
            className={`mtf-pill${showSchoolList ? ' mtf-pill--active' : ''}`}
            onClick={() => setShowSchoolList(v => !v)}
            aria-pressed={showSchoolList}
            aria-label="Toggle school list"
          >
            ☰ Schools
          </button>
        </div>

        {/* Backdrop — closes dropdown when tapping outside */}
        {mobileFiltersOpen && (
          <div className="mtf-backdrop" onClick={() => setMobileFiltersOpen(false)} />
        )}

        {/* Mobile filter dropdown — sibling of pill bar to avoid overflow clipping */}
        {mobileFiltersOpen && (
          <div className="mtf-dropdown">
            {/* Search */}
            <div className="mtf-section">
              <div className="mtf-section-label">SEARCH SCHOOL</div>
              <input
                type="text"
                className="mtf-search-input"
                placeholder="School name..."
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                autoFocus
              />
              {schoolSearch.trim().length >= 2 && (
                <ul className="mtf-suggestions">
                  {loadedSchools
                    .filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
                    .slice(0, 5)
                    .map(s => (
                      <li
                        key={s.properties._id}
                        className="mtf-suggestion"
                        onMouseDown={() => {
                          handleSchoolClick(s);
                          setSchoolSearch(s.name);
                          setMobileFiltersOpen(false);
                        }}
                      >
                        {s.name.replace(/\b\w/g, c => c.toUpperCase())}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Board */}
            <div className="mtf-section">
              <div className="mtf-section-label">BOARD</div>
              <div className="mtf-options">
                {['all', 'public', 'catholic'].map(v => (
                  <button
                    key={v}
                    className={`mtf-option${boardFilter === v ? ' mtf-option--active' : ''}`}
                    onClick={() => setBoardFilter(v)}
                  >
                    {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mtf-section">
              <div className="mtf-section-label">LANGUAGE</div>
              <div className="mtf-options">
                {['all', 'english', 'french'].map(v => (
                  <button
                    key={v}
                    className={`mtf-option${languageFilter === v ? ' mtf-option--active' : ''}`}
                    onClick={() => setLanguageFilter(v)}
                  >
                    {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Level */}
            <div className="mtf-section">
              <div className="mtf-section-label">LEVEL</div>
              <div className="mtf-options">
                {[
                  { label: 'JK–6', value: 'jk6' },
                  { label: '7–8', value: 'grade78' },
                  { label: '9–12', value: 'secondary' },
                  { label: 'All', value: 'all' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    className={`mtf-option${gradeLevelFilter === value ? ' mtf-option--active' : ''}`}
                    onClick={() => setGradeLevelFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating slider */}
            <div className="mtf-section">
              <div className="mtf-section-header">
                <div className="mtf-section-label">FRASER RATING</div>
                <span className="mtf-rating-value">{ratingMin} – {ratingMax}</span>
              </div>
              <div className="dual-slider">
                <div className="dual-slider__track">
                  <div className="dual-slider__fill" style={{
                    left: `${(ratingMin / 10) * 100}%`,
                    right: `${100 - (ratingMax / 10) * 100}%`
                  }} />
                </div>
                <input type="range" min={0} max={10} step={0.5} value={ratingMin}
                  onChange={e => setRatingMin(Math.min(Number(e.target.value), ratingMax - 0.5))}
                  className="dual-slider__input" />
                <input type="range" min={0} max={10} step={0.5} value={ratingMax}
                  onChange={e => setRatingMax(Math.max(Number(e.target.value), ratingMin + 0.5))}
                  className="dual-slider__input" />
              </div>
              <div className="dual-slider__labels"><span>1</span><span>5</span><span>10</span></div>
            </div>

            {/* Footer buttons */}
            <div className="mtf-footer-row">
              {(boardFilter !== 'all' || languageFilter !== 'all' || gradeLevelFilter !== 'jk6' || ratingMin !== 0 || ratingMax !== 10) && (
                <button
                  className="mtf-reset-btn"
                  onClick={() => {
                    setBoardFilter('all'); setLanguageFilter('all');
                    setGradeLevelFilter('jk6'); setRatingMin(0); setRatingMax(10);
                  }}
                >
                  Reset filters
                </button>
              )}
              <button className="mtf-done-btn" onClick={() => setMobileFiltersOpen(false)}>
                Done
              </button>
            </div>
          </div>
        )}
        {/* View toggle — only visible in rental explore mode */}
        {rentalExploreMode && (
          <div className="view-toggle">
            <button
              className={`view-toggle__btn${!listView ? ' view-toggle__btn--active' : ''}`}
              onClick={() => setListView(false)}
            >
              Map
            </button>
            <button
              className={`view-toggle__btn${listView ? ' view-toggle__btn--active' : ''}`}
              onClick={() => setListView(true)}
            >
              List
            </button>
          </div>
        )}

        {/* Mobile list overlay */}
        {rentalExploreMode && listView && selectedSchool && (
          <div className="rental-list-view-mobile">
            <RentalListView
              rentals={nearbyRentals}
              onRentalClick={handleRentalClick}
              sort={rentalSort}
              onSortChange={setRentalSort}
            />
          </div>
        )}

        <MapView
          ratingMin={ratingMin}
          ratingMax={ratingMax}
          boardFilter={boardFilter}
          languageFilter={languageFilter}
          gradeLevelFilter={gradeLevelFilter}
          budgetMin={budgetMin}
          budgetMax={budgetMax}
          onSchoolClick={handleSchoolClick}
          onRentalClick={handleRentalClick}
          selectedSchool={selectedSchool}
          selectedRental={selectedRental}
          onVisibleCountChange={handleVisibleCountChange}
          onSchoolsLoaded={handleSchoolsLoaded}
          exploreRentalsMode={rentalExploreMode}
        />
      </div>
      {/* Toast notification */}
      <div className={`map-toast${toastVisible ? ' map-toast--visible' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}
