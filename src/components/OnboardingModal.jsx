import React, { useState } from 'react';

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

const BUDGET_MIN = 1500;
const BUDGET_MAX = 5000;

export default function OnboardingModal({ onDone }) {
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [boardType, setBoardType] = useState('all');
  const [language, setLanguage] = useState('all');
  const [grade, setGrade] = useState('all');
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX);

  const minPct = (ratingMin / 10) * 100;
  const maxPct = (ratingMax / 10) * 100;
  const budgetMinPct = ((budgetMin - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const budgetMaxPct = ((budgetMax - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  function handleStart() {
    onDone({ ratingMin, ratingMax, boardType, language, grade, budgetMin, budgetMax });
  }

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        <div className="ob-logo">🏫</div>
        <h1 className="ob-title">Rent by School - Toronto</h1>
        <p className="ob-subtitle">Find the rentals close to the best schools</p>

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

        {/* Board */}
        <div className="ob-section">
          <div className="ob-section-label">BOARD</div>
          <div className="ob-toggle-group">
            {BOARD_TYPES.map(t => (
              <button key={t.value}
                className={`ob-toggle-btn${boardType === t.value ? ' active' : ''}`}
                onClick={() => setBoardType(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="ob-section">
          <div className="ob-section-label">LANGUAGE</div>
          <div className="ob-toggle-group">
            {LANGUAGES.map(t => (
              <button key={t.value}
                className={`ob-toggle-btn${language === t.value ? ' active' : ''}`}
                onClick={() => setLanguage(t.value)}>
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

        {/* Budget */}
        <div className="ob-section">
          <div className="ob-section-header">
            <span className="ob-section-label">BUDGET FOR RENT</span>
            <span className="ob-rating-value">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
          </div>
          <div className="dual-slider">
            <div className="dual-slider__track">
              <div className="dual-slider__fill" style={{ left: `${budgetMinPct}%`, right: `${100 - budgetMaxPct}%` }} />
            </div>
            <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMin}
              onChange={e => setBudgetMin(Math.min(Number(e.target.value), budgetMax - 100))}
              className="dual-slider__input" />
            <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={100} value={budgetMax}
              onChange={e => setBudgetMax(Math.max(Number(e.target.value), budgetMin + 100))}
              className="dual-slider__input" />
          </div>
          <div className="dual-slider__labels"><span>$1,500</span><span>$3,250</span><span>$5,000</span></div>
        </div>

        <button className="ob-cta" onClick={handleStart}>
          Explore the Map →
        </button>
      </div>
    </div>
  );
}
