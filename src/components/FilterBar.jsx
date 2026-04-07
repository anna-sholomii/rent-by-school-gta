import React, { useState, useRef, useEffect } from 'react';

const SCHOOL_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Catholic', value: 'catholic' },
];

const GRADE_LEVELS = [
  { label: 'All', value: 'all' },
  { label: 'JK–3', value: 'jk3' },
  { label: '4–6', value: '46' },
  { label: '7–8', value: '78' },
  { label: '9–12', value: '912' },
];

const RATING_BADGES = [
  { label: '8–10 Excellent', min: 8, max: 10, color: '#16a34a', bg: '#14532d' },
  { label: '6–8 Good',       min: 6, max: 8,  color: '#d97706', bg: '#451a03' },
  { label: '4–6 Average',    min: 4, max: 6,  color: '#ea580c', bg: '#431407' },
  { label: '<4 Low',         min: 0, max: 4,  color: '#dc2626', bg: 'transparent' },
];

export default function FilterBar({
  ratingMin, ratingMax, onRatingMinChange, onRatingMaxChange,
  schoolTypeFilter, onSchoolTypeChange,
  selectedSchool, nearbyRentalCount,
  schoolSearch, onSchoolSearchChange,
  allSchools, onSchoolSelect,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const searchRef = useRef(null);

  // Collapse filters automatically when a school is selected
  useEffect(() => {
    if (selectedSchool) setFiltersOpen(false);
    else setFiltersOpen(true);
  }, [selectedSchool]);

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

  return (
    <div className="sidebar-header">
      {/* Logo + Title */}
      <div className="sidebar-logo-row">
        <div className="sidebar-logo-icon">🏫</div>
        <div>
          <div className="sidebar-title">Rent by School</div>
          <div className="sidebar-subtitle">GTA edition</div>
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
        <span className="sidebar-filters-caret">{filtersOpen ? '∧' : '∨'}</span>
      </div>

      {filtersOpen && (
        <div className="sidebar-filters-body">

          {/* Rating */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">RATING</span>
              <span className="sidebar-rating-value">{ratingMin} – {ratingMax}</span>
            </div>

            {/* Dual range slider */}
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

            {/* Rating quality badges */}
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

          {/* School Type */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">SCHOOL TYPE</div>
            <div className="segmented-control">
              {SCHOOL_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`segmented-btn${schoolTypeFilter === t.value ? ' active' : ''}`}
                  onClick={() => onSchoolTypeChange(t.value)}
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
