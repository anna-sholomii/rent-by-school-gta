import catchmentAreas from './data/catchmentAreas';
import React, { useState, useCallback } from 'react';
import MapView, { haversineDistance, rentalsData } from './components/MapView';
import SchoolPanel from './components/SchoolPanel';
import RentalPanel from './components/RentalPanel';
import FilterBar from './components/FilterBar';
import fraserRatings from './data/fraserRatings';
import './App.css';

export default function App() {
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [boardFilter, setBoardFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [gradeLevelFilter, setGradeLevelFilter] = useState('all');
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

  const handleExploreRentals = useCallback(() => setRentalExploreMode(true), []);
  const handleBackToOverview = useCallback(() => setRentalExploreMode(false), []);

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
  }, []);

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

  const assignedSchool = selectedRental
    ? loadedSchools.find(s => {
        const area = catchmentAreas[s.name.trim()];
        return area ? pointInPolygon(selectedRental.lat, selectedRental.lng, area.coordinates) : false;
      }) || null
    : null;

  return (
    <div className="app">
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
          budgetMin={budgetMin}
          budgetMax={budgetMax}
          onBudgetMinChange={setBudgetMin}
          onBudgetMaxChange={setBudgetMax}
          selectedSchool={selectedSchool}
          nearbyRentalCount={nearbyRentals.length}
          schoolSearch={schoolSearch}
          onSchoolSearchChange={setSchoolSearch}
          allSchools={loadedSchools}
          onSchoolSelect={handleSchoolClick}
        />
        {selectedSchool && (
          <SchoolPanel
            school={selectedSchool}
            nearbyRentals={nearbyRentals}
            onClose={() => { setSelectedSchool(null); setRentalExploreMode(false); }}
            onRentalClick={handleRentalClick}
            rentalMode={rentalExploreMode}
            onExploreRentals={handleExploreRentals}
            onBackToOverview={handleBackToOverview}
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
        {!selectedSchool && !selectedRental && (
          <div className="sidebar__empty-state">
            <span className="sidebar__empty-icon">🏫</span>
            <p className="sidebar__empty-text">Click a school pin to see nearby rentals in its catchment</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="app__map">
        {/* Mobile filter bar — only visible on ≤768px */}
        <div className="mobile-top-filters">
          <button
            className={`mtf-pill mtf-pill--dark${mobileFiltersOpen ? ' mtf-pill--open' : ''}`}
            onClick={() => setMobileFiltersOpen(o => !o)}
          >
            School filters {mobileFiltersOpen ? '▴' : '▾'}
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

            {/* Budget */}
            <div className="mtf-section">
              <div className="mtf-section-header">
                <div className="mtf-section-label">BUDGET</div>
                <span className="mtf-rating-value">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
              </div>
              <div className="dual-slider">
                <div className="dual-slider__track">
                  <div className="dual-slider__fill" style={{
                    left: `${((budgetMin - 1500) / 3500) * 100}%`,
                    right: `${100 - ((budgetMax - 1500) / 3500) * 100}%`
                  }} />
                </div>
                <input type="range" min={1500} max={5000} step={100} value={budgetMin}
                  onChange={e => setBudgetMin(Math.min(Number(e.target.value), budgetMax - 100))}
                  className="dual-slider__input" />
                <input type="range" min={1500} max={5000} step={100} value={budgetMax}
                  onChange={e => setBudgetMax(Math.max(Number(e.target.value), budgetMin + 100))}
                  className="dual-slider__input" />
              </div>
              <div className="dual-slider__labels"><span>$1,500</span><span>$3,250</span><span>$5,000</span></div>
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
                {['all', 'elementary', 'secondary'].map(v => (
                  <button
                    key={v}
                    className={`mtf-option${gradeLevelFilter === v ? ' mtf-option--active' : ''}`}
                    onClick={() => setGradeLevelFilter(v)}
                  >
                    {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
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

            <button className="mtf-done-btn" onClick={() => setMobileFiltersOpen(false)}>
              Done
            </button>
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
    </div>
  );
}
