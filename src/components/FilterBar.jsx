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
  else if (gradeLevelFilter === 'all') chips.push('All grades');
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

  const headerTitle = selectedSchoolId != null && !filtersOpen
    ? 'ADJUST MAP FILTERS'
    : 'SCHOOL FILTERS';

  const headerHint = selectedSchoolId != null && !filtersOpen
    ? 'Filters are tucked away while you view a school — expand to change the map'
    : undefined;

  return (
    <div className="sidebar-header">
      <div className="sidebar-brand">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo-icon" aria-hidden="true">SB</div>
          <div className="sidebar-brand__text">
            <div className="sidebar-title">Rent by School</div>
            <div className="sidebar-subtitle">Toronto · Schools & rentals</div>
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

        <p className="sidebar-search-hint">
          Renting near a street or intersection?{' '}
          <button
            type="button"
            className="sidebar-search-hint__link"
            onClick={() => onExploreMapHint && onExploreMapHint()}
          >
            Explore the map
          </button>
          {' '}— then tap a school pin for catchment rentals.
        </p>

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
            No schools match “{debouncedQuery.trim()}”. Try spelling, another keyword, or explore the map by area.
          </div>
        )}
      </div>

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
        <span className="sidebar-filters-icon" aria-hidden="true">Filter</span>
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
            <p className="sidebar-filter-meta" role="status">
              Showing <strong>{matchingSchoolCount}</strong> {matchingSchoolCount === 1 ? 'school' : 'schools'} matching these filters on the map.
            </p>

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
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={ratingMin}
                  onChange={e => onRatingMinChange(Math.min(Number(e.target.value), ratingMax - 0.5))}
                  className="dual-slider__input"
                  aria-label="Minimum Fraser rating"
                />
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={ratingMax}
                  onChange={e => onRatingMaxChange(Math.max(Number(e.target.value), ratingMin + 0.5))}
                  className="dual-slider__input"
                  aria-label="Maximum Fraser rating"
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
                  <button
                    key={t.value}
                    type="button"
                    className={`segmented-btn${boardFilter === t.value ? ' active' : ''}`}
                    onClick={() => onBoardFilterChange(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section sidebar-section--spaced">
              <div className="sidebar-section-label">LANGUAGE</div>
              <div className="segmented-control sidebar-filters-segments">
                {LANGUAGES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`segmented-btn${languageFilter === t.value ? ' active' : ''}`}
                    onClick={() => onLanguageFilterChange(t.value)}
                  >
                    {t.label}
                  </button>
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
                  <button
                    key={t.value}
                    type="button"
                    className={`segmented-btn${gradeLevelFilter === t.value ? ' active' : ''}`}
                    onClick={() => onGradeLevelChange(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
