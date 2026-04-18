import React, { useState, useRef, useEffect } from 'react';

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
  { label: 'Elementary', value: 'elementary' },
  { label: 'Secondary', value: 'secondary' },
];

const RATING_BADGES = [
  { label: '8–10 Excellent', min: 8, max: 10, color: '#2f6b4f', bg: '#eaf4ee' },
  { label: '6–8 Good',       min: 6, max: 8,  color: '#7a6200', bg: '#fff8e1' },
  { label: '4–6 Average',    min: 4, max: 6,  color: '#7a3a00', bg: '#fff3e0' },
  { label: '<4 Low',         min: 0, max: 4,  color: '#b71c1c', bg: '#fce8e6' },
];

const BUDGET_MIN = 1500;
const BUDGET_MAX = 5000;

export default function FilterBar({
  ratingMin, ratingMax, onRatingMinChange, onRatingMaxChange,
  boardFilter, onBoardFilterChange,
  languageFilter, onLanguageFilterChange,
  gradeLevelFilter, onGradeLevelChange,
  budgetMin, budgetMax, onBudgetMinChange, onBudgetMaxChange,
  selectedSchool, nearbyRentalCount,
  schoolSearch, onSchoolSearchChange,
  allSchools, onSchoolSelect,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const searchRef = useRef(null);


  const suggestions = schoolSearch.trim().length >= 2
    ? allSchools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(school) {
    onSchoolSearchChange(school.name);
    setShowSuggestions(false);
    onSchoolSelect(school);
  }

  const minPct = (ratingMin / 10) * 100;
  const maxPct = (ratingMax / 10) * 100;
  const budgetMinPct = ((budgetMin - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const budgetMaxPct = ((budgetMax - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  // Count how many filter groups are non-default
  const activeFilterCount = [
    ratingMin !== 0 || ratingMax !== 10,
    boardFilter !== 'all',
    languageFilter !== 'all',
    gradeLevelFilter !== 'all',
    budgetMin !== BUDGET_MIN || budgetMax !== BUDGET_MAX,
  ].filter(Boolean).length;

  return (
    <div className="sidebar-header">
      {/* Logo + Title */}
      <div className="sidebar-logo-row">
        <div className="sidebar-logo-icon">🏫</div>
        <div>
          <div className="sidebar-title">Rent by School - Toronto</div>
          <div className="sidebar-subtitle">Find the rentals close to the best schools</div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search-wrap" ref={searchRef}>
        <input
          type="text"
          className="sidebar-search"
          placeholder="🔍  Search school by name..."
          value={schoolSearch}
          onChange={e => { onSchoolSearchChange(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="sidebar-suggestions">
            {suggestions.map(s => (
              <li key={s.properties._id} className="sidebar-suggestion" onMouseDown={() => handleSelect(s)}>
                <span className="sidebar-suggestion__name">{s.name}</span>
                <span className="sidebar-suggestion__meta">{s.properties.SCHOOL_TYPE_DESC} · {s.properties.ADDRESS_FULL}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Filters section */}
      <div className="sidebar-filters-header" onClick={() => setFiltersOpen(o => !o)}>
        <span className="sidebar-filters-icon">⚙</span>
        <span className="sidebar-filters-label">FILTERS</span>
        {!filtersOpen && activeFilterCount > 0 && (
          <span className="sidebar-filters-active-count">{activeFilterCount} active</span>
        )}
        <span className="sidebar-filters-caret">{filtersOpen ? '∧' : '∨'}</span>
      </div>

      {filtersOpen && (
        <div className="sidebar-filters-body">

          {/* Budget — first, most important for renters */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">BUDGET FOR RENT</span>
              <span className="sidebar-rating-value">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
            </div>
            <div className="dual-slider">
              <div className="dual-slider__track">
                <div className="dual-slider__fill" style={{ left: `${budgetMinPct}%`, right: `${100 - budgetMaxPct}%` }} />
              </div>
              <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMin}
                onChange={e => onBudgetMinChange(Math.min(Number(e.target.value), budgetMax - 100))}
                className="dual-slider__input" />
              <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMax}
                onChange={e => onBudgetMaxChange(Math.max(Number(e.target.value), budgetMin + 100))}
                className="dual-slider__input" />
            </div>
            <div className="dual-slider__labels"><span>$1,500</span><span>$3,250</span><span>$5,000</span></div>
          </div>

          {/* Rating */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">RATING</span>
              <span className="sidebar-rating-value">{ratingMin} – {ratingMax}</span>
            </div>

            <div className="dual-slider">
              <div className="dual-slider__track">
                <div className="dual-slider__fill" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
              </div>
              <input type="range" min={0} max={10} step={0.5} value={ratingMin}
                onChange={e => onRatingMinChange(Math.min(Number(e.target.value), ratingMax - 0.5))}
                className="dual-slider__input" />
              <input type="range" min={0} max={10} step={0.5} value={ratingMax}
                onChange={e => onRatingMaxChange(Math.max(Number(e.target.value), ratingMin + 0.5))}
                className="dual-slider__input" />
            </div>
            <div className="dual-slider__labels">
              <span>1</span><span>5</span><span>10</span>
            </div>

            <div className="rating-badges">
              {RATING_BADGES.map(b => (
                <button
                  key={b.label}
                  className="rating-badge"
                  style={{ color: b.color, background: b.bg, border: `1px solid ${b.color}33` }}
                  onClick={() => { onRatingMinChange(b.min); onRatingMaxChange(b.max); }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Board */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">BOARD</div>
            <div className="segmented-control">
              {BOARD_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`segmented-btn${boardFilter === t.value ? ' active' : ''}`}
                  onClick={() => onBoardFilterChange(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">LANGUAGE</div>
            <div className="segmented-control">
              {LANGUAGES.map(t => (
                <button
                  key={t.value}
                  className={`segmented-btn${languageFilter === t.value ? ' active' : ''}`}
                  onClick={() => onLanguageFilterChange(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Level */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">GRADE LEVEL</div>
            <div className="segmented-control">
              {GRADE_LEVELS.map(t => (
                <button
                  key={t.value}
                  className={`segmented-btn${gradeLevelFilter === t.value ? ' active' : ''}`}
                  onClick={() => onGradeLevelChange(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
