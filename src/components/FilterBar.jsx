import React, { useState, useRef, useEffect, useMemo } from 'react';
import { haversineDistance } from '../utils/geo';
import { rankSchoolsByQuery } from '../utils/schoolSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { toTitleCase } from '../utils/school.js';

const BOARD_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Catholic', value: 'catholic' },
];

const LANGUAGES = [
  { label: 'All', value: 'all' },
  { label: 'English', value: 'english' },
  { label: 'French', value: 'french' },
];

const GRADE_LEVELS = [
  { label: 'All', value: 'all' },
  { label: 'JK–8', value: 'jk8' },
  { label: '9–12', value: 'secondary' },
];

const RATING_BADGES = [
  { label: '8–10 Excellent', min: 8, max: 10, color: '#2f6b4f', bg: '#eaf4ee' },
  { label: '6–8 Good', min: 6, max: 8, color: '#7a6200', bg: '#fff8e1' },
  { label: '4–6 Average', min: 4, max: 6, color: '#7a3a00', bg: '#fff3e0' },
  { label: '<4 Low', min: 0, max: 4, color: '#b71c1c', bg: '#fce8e6' },
];

/** Reference point for rough distance in suggestion rows (downtown Toronto). */
const REF_LAT = 43.6532;
const REF_LNG = -79.3832;

function buildFilterSummaryChips({
  ratingMin, ratingMax, boardFilter, languageFilter, gradeLevelFilter,
}) {
  const chips = [];
  if (boardFilter === 'public') chips.push('Public');
  else if (boardFilter === 'catholic') chips.push('Catholic');
  if (languageFilter === 'french') chips.push('French');
  else if (languageFilter === 'english') chips.push('English');
  if (gradeLevelFilter === 'jk8') chips.push('JK–8');
  else if (gradeLevelFilter === 'secondary') chips.push('9–12');
  if (ratingMin !== 0 || ratingMax !== 10) {
    chips.push(`${ratingMin}–${ratingMax} rating`);
  }
  return chips;
}

function formatDistKm(lat, lng) {
  if (lat == null || lng == null) return null;
  const m = haversineDistance(REF_LAT, REF_LNG, lat, lng);
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Left sidebar: brand, search, and school filters (rating, board, language, grade).
 */
const BUDGET_MIN = 1500;
const BUDGET_MAX = 5000;

export default function FilterBar({
  ratingMin, ratingMax, onRatingMinChange, onRatingMaxChange,
  boardFilter, onBoardFilterChange,
  languageFilter, onLanguageFilterChange,
  gradeLevelFilter, onGradeLevelChange,
  schoolSearch, onSchoolSearchChange,
  allSchools, onSchoolSelect,
  onResetFilters,
  selectedSchool,
  matchingSchoolCount = 0,
  onExploreMapHint,
  onApplyFilters,
  rentalExploreMode = false,
  budgetMin = BUDGET_MIN,
  budgetMax = BUDGET_MAX,
  onBudgetMinChange,
  onBudgetMaxChange,
  selectedRental = null,
  rentalTypeFilter = 'all',
  onRentalTypeChange,
  rentalBedsFilter = 0,
  onRentalBedsChange,
  rentalBathsFilter = 0,
  onRentalBathsChange,
  rentalSqftTier = 'any',
  onRentalSqftTierChange,
  rentalAmenities = [],
  onRentalAmenitiesToggle,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const listboxId = 'school-search-suggestions';

  const debouncedQuery = useDebouncedValue(schoolSearch, 220);

  const suggestions = useMemo(
    () => rankSchoolsByQuery(allSchools, debouncedQuery, 8),
    [allSchools, debouncedQuery],
  );

  const selectedSchoolId = selectedSchool?.properties?._id ?? selectedSchool?.id ?? null;

  useEffect(() => {
    if (selectedSchoolId != null) setFiltersOpen(false);
  }, [selectedSchoolId]);

  useEffect(() => {
    if (rentalExploreMode) setFiltersOpen(true);
  }, [rentalExploreMode]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!showSuggestions || suggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }
    setActiveSuggestionIndex(0);
  }, [debouncedQuery, showSuggestions, suggestions.length]);

  useEffect(() => {
    if (!showSuggestions || suggestions.length === 0 || !suggestionsRef.current) return;
    const t = window.requestAnimationFrame(() => {
      try {
        suggestionsRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch {
        /* ignore */
      }
    });
    return () => window.cancelAnimationFrame(t);
  }, [showSuggestions, suggestions.length]);

  function handleSelect(school) {
    onSchoolSearchChange(school.name);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    onSchoolSelect(school);
  }

  function handleClearSearch(e) {
    e.preventDefault();
    e.stopPropagation();
    onSchoolSearchChange('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  }

  function handleSearchKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestionIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  }

  const minPct = (ratingMin / 10) * 100;
  const maxPct = (ratingMax / 10) * 100;

  const activeFilterCount = [
    ratingMin !== 0 || ratingMax !== 10,
    boardFilter !== 'all',
    languageFilter !== 'all',
    gradeLevelFilter !== 'all',
  ].filter(Boolean).length;

  const summaryChips = buildFilterSummaryChips({
    ratingMin, ratingMax, boardFilter, languageFilter, gradeLevelFilter,
  });

  const queryTrim = schoolSearch.trim();
  const showNoResults = queryTrim.length >= 2 && debouncedQuery.trim().length >= 2 && suggestions.length === 0 && showSuggestions;

  const headerTitle = rentalExploreMode
    ? 'RENTAL FILTERS'
    : (selectedSchoolId != null && !filtersOpen ? 'ADJUST MAP FILTERS' : 'SCHOOL FILTERS');

  const headerHint = rentalExploreMode
    ? undefined
    : (selectedSchoolId != null && !filtersOpen
      ? 'Filters are tucked away while you view a school — expand to change the map'
      : undefined);

  const hasSelection = !!(selectedSchool || selectedRental);
  if (hasSelection && !rentalExploreMode) return null;

  return (
    <div className="sidebar-header">
      {!rentalExploreMode && (
        <>
          <div className="sidebar-brand">
            <div className="sidebar-logo-row">
              <img src="/logo.svg" className="sidebar-logo-img" alt="" aria-hidden="true" width="38" height="43" />
              <div className="sidebar-brand__text">
                <div className="sidebar-title">Rent by School – Toronto</div>
                <div className="sidebar-subtitle">Find the rentals close to the best schools</div>
              </div>
            </div>
          </div>

          <div className="sidebar-search-wrap" ref={searchRef}>
        <label className="sidebar-search-label" htmlFor="sidebar-school-search">
          Find a school
        </label>
        <div className="sidebar-search-field">
          <input
            id="sidebar-school-search"
            type="text"
            className="sidebar-search"
            placeholder="Search school by name..."
            value={schoolSearch}
            onChange={e => { onSchoolSearchChange(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleSearchKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && (suggestions.length > 0 || showNoResults)}
            aria-controls={
            showNoResults ? 'sidebar-search-empty-msg' : listboxId
          }
            aria-label="Search schools"
            aria-activedescendant={
              activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]
                ? `school-option-${suggestions[activeSuggestionIndex].id}`
                : undefined
            }
          />
          {queryTrim.length > 0 && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear school search"
            >
              ×
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="sidebar-suggestions" id={listboxId} role="listbox" ref={suggestionsRef}>
            {suggestions.map((s, idx) => {
              const dist = formatDistKm(s.lat, s.lng);
              const ratingLabel = s.rating != null ? `${s.rating.toFixed(1)} Fraser` : null;
              const metaLine = [
                s.properties?.SCHOOL_TYPE_DESC,
                ratingLabel,
                dist ? `${dist} · ref. centre` : null,
                s.properties?.ADDRESS_FULL,
              ].filter(Boolean).join(' · ');
              return (
                <li
                  key={s.id}
                  id={`school-option-${s.id}`}
                  className="sidebar-suggestion"
                  role="option"
                  aria-selected={idx === activeSuggestionIndex}
                  onMouseDown={() => handleSelect(s)}
                >
                  <span className="sidebar-suggestion__name">{toTitleCase(s.name)}</span>
                  {metaLine && (
                    <span className="sidebar-suggestion__meta">{metaLine}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {showSuggestions && showNoResults && (
          <div className="sidebar-search-empty" id="sidebar-search-empty-msg" role="status">
            No schools match &ldquo;{debouncedQuery.trim()}&rdquo;. Try spelling, another keyword, or explore the map by area.
          </div>
        )}
      </div>
        </>
      )}

      <div
        className={`sidebar-filters-header${selectedSchoolId != null && !filtersOpen ? ' sidebar-filters-header--hidden-context' : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={filtersOpen}
        aria-controls="sidebar-school-filters"
        title={headerHint || (filtersOpen ? 'Hide school filters' : 'Show school filters')}
        onClick={() => setFiltersOpen(o => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFiltersOpen(o => !o);
          }
        }}
      >
        <span className="sidebar-filters-label">{headerTitle}</span>
        {!filtersOpen && activeFilterCount > 0 && (
          <span className="sidebar-filters-active-count">{activeFilterCount} active</span>
        )}
        {activeFilterCount > 0 && onResetFilters && (
          <button
            type="button"
            className="sidebar-filters-reset"
            onClick={e => { e.stopPropagation(); onResetFilters(); }}
            aria-label="Reset rating, board, language, and grade filters"
            title="Clears rating range, board, language, and grade. Does not clear school search or pan the map."
          >
            Reset
          </button>
        )}
        <span className="sidebar-filters-caret" aria-hidden="true">{filtersOpen ? '▴' : '▾'}</span>
      </div>

      {!filtersOpen && summaryChips.length > 0 && (
        <div className="filter-summary-chips" aria-label="Active filters summary">
          {summaryChips.map(c => (
            <span key={c} className="filter-summary-chip">{c}</span>
          ))}
        </div>
      )}

      <div
        className={`sidebar-filters-panel${filtersOpen ? ' sidebar-filters-panel--open' : ''}`}
        id="sidebar-school-filters"
        {...(!filtersOpen ? { inert: '' } : {})}
      >
        <div className="sidebar-filters-body-inner">
          <div className="sidebar-filters-body">
            {rentalExploreMode ? (
              <>
                {/* Budget */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-header">
                    <span className="sidebar-section-label">BUDGET</span>
                    <span className="sidebar-rating-value">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
                  </div>
                  <div className="dual-slider sidebar-filters-slider">
                    <div className="dual-slider__track">
                      <div className="dual-slider__fill" style={{
                        left: `${((budgetMin - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`,
                        right: `${100 - ((budgetMax - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`,
                      }} />
                    </div>
                    <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMin}
                      onChange={e => onBudgetMinChange && onBudgetMinChange(Math.min(Number(e.target.value), budgetMax - 100))}
                      className="dual-slider__input" aria-label="Minimum budget" />
                    <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMax}
                      onChange={e => onBudgetMaxChange && onBudgetMaxChange(Math.max(Number(e.target.value), budgetMin + 100))}
                      className="dual-slider__input" aria-label="Maximum budget" />
                  </div>
                  <div className="dual-slider__labels"><span>$1,500</span><span>$3,250</span><span>$5,000</span></div>
                </div>

                {/* Type */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">TYPE</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Condo', value: 'condo' },
                      { label: 'Apt', value: 'apartment' },
                      { label: 'House', value: 'house' },
                      { label: 'Town', value: 'townhouse' },
                    ].map(({ label, value }) => (
                      <button key={value} type="button"
                        className={`segmented-btn${rentalTypeFilter === value ? ' active' : ''}`}
                        onClick={() => onRentalTypeChange && onRentalTypeChange(value)}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Beds */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">BEDS</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {[
                      { label: 'Any', value: 0 },
                      { label: '1+', value: 1 },
                      { label: '2+', value: 2 },
                      { label: '3+', value: 3 },
                      { label: '4+', value: 4 },
                    ].map(({ label, value }) => (
                      <button key={value} type="button"
                        className={`segmented-btn${rentalBedsFilter === value ? ' active' : ''}`}
                        onClick={() => onRentalBedsChange && onRentalBedsChange(value)}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Baths */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">BATHS</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {[
                      { label: 'Any', value: 0 },
                      { label: '1+', value: 1 },
                      { label: '2+', value: 2 },
                      { label: '3+', value: 3 },
                    ].map(({ label, value }) => (
                      <button key={value} type="button"
                        className={`segmented-btn${rentalBathsFilter === value ? ' active' : ''}`}
                        onClick={() => onRentalBathsChange && onRentalBathsChange(value)}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Square footage */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">SQUARE FOOTAGE</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {[
                      { label: 'Any', value: 'any' },
                      { label: '<800', value: '<800' },
                      { label: '800–1.2k', value: '800-1200' },
                      { label: '1.2–1.5k', value: '1200-1500' },
                      { label: '1.5k+', value: '1500+' },
                    ].map(({ label, value }) => (
                      <button key={value} type="button"
                        className={`segmented-btn${rentalSqftTier === value ? ' active' : ''}`}
                        onClick={() => onRentalSqftTierChange && onRentalSqftTierChange(value)}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">AMENITIES</div>
                  <div className="rental-amenity-chips">
                    {['Parking', 'Gym', 'Laundry', 'Balcony', 'Pet friendly', 'Concierge'].map(a => (
                      <button key={a} type="button"
                        className={`amenity-chip${rentalAmenities.includes(a) ? ' amenity-chip--on' : ''}`}
                        onClick={() => onRentalAmenitiesToggle && onRentalAmenitiesToggle(a)}
                      >{a}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* ── School filters ── */
              <>
                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-header">
                    <span className="sidebar-section-label">RATING</span>
                    <span className="sidebar-rating-value">{ratingMin} – {ratingMax}</span>
                  </div>
                  <div className="dual-slider sidebar-filters-slider">
                    <div className="dual-slider__track">
                      <div className="dual-slider__fill" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
                    </div>
                    <input
                      type="range" min={0} max={10} step={0.5} value={ratingMin}
                      onChange={e => onRatingMinChange(Math.min(Number(e.target.value), ratingMax - 0.5))}
                      className="dual-slider__input" aria-label="Minimum Fraser rating"
                    />
                    <input
                      type="range" min={0} max={10} step={0.5} value={ratingMax}
                      onChange={e => onRatingMaxChange(Math.max(Number(e.target.value), ratingMin + 0.5))}
                      className="dual-slider__input" aria-label="Maximum Fraser rating"
                    />
                  </div>
                  <div className="dual-slider__labels"><span>1</span><span>5</span><span>10</span></div>
                  <div className="dual-slider__band-labels">
                    <span>Below avg</span>
                    <span>Mid</span>
                    <span>Strong</span>
                  </div>
                  <div className="rating-badges">
                    {RATING_BADGES.map(b => (
                      <button
                        key={b.label}
                        type="button"
                        className="rating-badge"
                        style={{ color: b.color, background: 'transparent', border: `1px solid ${b.color}` }}
                        onClick={() => { onRatingMinChange(b.min); onRatingMaxChange(b.max); }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">BOARD</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {BOARD_TYPES.map(t => (
                      <button key={t.value} type="button"
                        className={`segmented-btn${boardFilter === t.value ? ' active' : ''}`}
                        onClick={() => onBoardFilterChange(t.value)}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">LANGUAGE</div>
                  <div className="segmented-control sidebar-filters-segments">
                    {LANGUAGES.map(t => (
                      <button key={t.value} type="button"
                        className={`segmented-btn${languageFilter === t.value ? ' active' : ''}`}
                        onClick={() => onLanguageFilterChange(t.value)}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section sidebar-section--spaced">
                  <div className="sidebar-section-label">GRADE LEVEL</div>
                  <p className="sidebar-field-hint">
                    JK–8 is elementary; 9–12 is secondary (Ontario public / Catholic boards).
                  </p>
                  <div className="segmented-control sidebar-filters-segments">
                    {GRADE_LEVELS.map(t => (
                      <button key={t.value} type="button"
                        className={`segmented-btn${gradeLevelFilter === t.value ? ' active' : ''}`}
                        onClick={() => onGradeLevelChange(t.value)}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>

                {onApplyFilters && (
                  <div className="sidebar-section sidebar-section--spaced">
                    <button
                      type="button"
                      className="sidebar-apply-btn"
                      onClick={() => { setFiltersOpen(false); onApplyFilters(); }}
                    >
                      Apply filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
