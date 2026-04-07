import React, { useState } from 'react';

const SCHOOL_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Catholic', value: 'catholic' },
];

const GRADE_LEVELS = [
  { label: 'All Grades', value: 'all' },
  { label: 'JK – Grade 8', value: 'elementary' },
  { label: 'Grade 9 – Grade 12', value: 'secondary' },
];

const RATING_BADGES = [
  { label: '8–10 Excellent', min: 8, max: 10, color: '#16a34a' },
  { label: '6–8 Good',       min: 6, max: 8,  color: '#ca8a04' },
  { label: '4–6 Average',    min: 4, max: 6,  color: '#ea580c' },
  { label: '<4 Low',         min: 0, max: 4,  color: '#dc2626' },
];

export default function OnboardingModal({ onDone }) {
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [schoolType, setSchoolType] = useState('all');
  const [grade, setGrade] = useState('all');

  const minPct = (ratingMin / 10) * 100;
  const maxPct = (ratingMax / 10) * 100;

  function handleStart() {
    onDone({ ratingMin, ratingMax, schoolType, grade });
  }

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        <div className="ob-logo">🏫</div>
        <h1 className="ob-title">Toronto School &amp; Rental Finder</h1>
        <p className="ob-subtitle">Set your preferences to find the right neighbourhood</p>

        {/* Rating */}
        <div className="ob-section">
          <div className="ob-section-header">
            <span className="ob-section-label">SCHOOL RATING</span>
            <span className="ob-rating-value">{ratingMin} – {ratingMax}</span>
          </div>
          <div className="dual-slider">
            <div className="dual-slider__track">
              <div className="dual-slider__fill" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
            </div>
            <input type="range" min={0} max={10} step={0.5} value={ratingMin}
              onChange={e => setRatingMin(Math.min(Number(e.target.value), ratingMax - 0.5))}
              className="dual-slider__input" />
            <input type="range" min={0} max={10} step={0.5} value={ratingMax}
              onChange={e => setRatingMax(Math.max(Number(e.target.value), ratingMin + 0.5))}
              className="dual-slider__input" />
          </div>
          <div className="dual-slider__labels"><span>1</span><span>5</span><span>10</span></div>
          <div className="ob-badges">
            {RATING_BADGES.map(b => (
              <button key={b.label} className="ob-badge" style={{ color: b.color, borderColor: b.color + '55' }}
                onClick={() => { setRatingMin(b.min); setRatingMax(b.max); }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* School Type */}
        <div className="ob-section">
          <div className="ob-section-label">SCHOOL TYPE</div>
          <div className="ob-toggle-group">
            {SCHOOL_TYPES.map(t => (
              <button key={t.value}
                className={`ob-toggle-btn${schoolType === t.value ? ' active' : ''}`}
                onClick={() => setSchoolType(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade */}
        <div className="ob-section">
          <div className="ob-section-label">GRADE LEVEL</div>
          <div className="ob-toggle-group ob-toggle-group--wrap">
            {GRADE_LEVELS.map(g => (
              <button key={g.value}
                className={`ob-toggle-btn${grade === g.value ? ' active' : ''}`}
                onClick={() => setGrade(g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button className="ob-cta" onClick={handleStart}>
          Explore the Map →
        </button>
      </div>
    </div>
  );
}
