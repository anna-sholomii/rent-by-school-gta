import React, { useState, useEffect, useRef } from 'react';
import { getRatingColor, getTypeLabel, toTitleCase, walkMinutes } from '../utils/school.js';
import { MapPin, Share2 } from 'lucide-react';

const SCHOOL_PHOTOS = [
  '/schools/agus-karta-VFapGvHYsp8-unsplash.jpg',
  '/schools/christer-lassman-U1ii_Mur1tw-unsplash.jpg',
  '/schools/christer-lassman-eF7FbLqq694-unsplash.jpg',
  '/schools/dan-begel-MhIxFiEYNks-unsplash.jpg',
  '/schools/eric-sharp-JdzHrfX4l4Q-unsplash.jpg',
  '/schools/erik-mclean-6deO2JSlV2A-unsplash.jpg',
  '/schools/jack-schwartz-TlQIcAfX94U-unsplash.jpg',
  '/schools/jan-walter-luigi-TvF8b3wsvo0-unsplash.jpg',
  '/schools/kaleb-tapp-1deQbU6DhBg-unsplash.jpg',
  '/schools/michael-trimble-F28zduPmqwE-unsplash.jpg',
  '/schools/nimsibeth-LyRMxVQxJ2A-unsplash.jpg',
  '/schools/osmany-m-leyva-aldana-02vNV_KQfPg-unsplash.jpg',
  '/schools/parsoa-khorsand-GskUrRbkDMk-unsplash.jpg',
  '/schools/parsoa-khorsand-YatCXAfTCVo-unsplash.jpg',
  '/schools/peter-robbins-y6UnJJah0kI-unsplash.jpg',
  '/schools/ryan-jacobson-cXUOQWdRV4I-unsplash.jpg',
  '/schools/southeast-community-college-t_0zK-Nz_lQ-unsplash.jpg',
  '/schools/t-YlvRLu_jCmE-unsplash.jpg',
  '/schools/tommao-wang-RZ4LtWXa9h0-unsplash.jpg',
  '/schools/vladislav-vasilev-9qbPV3dvna0-unsplash.jpg',
  '/schools/wander-fleur-1lmGTHdQdjM-unsplash.jpg',
  '/schools/zachary-keimig-nxJgmZfLcJI-unsplash.jpg',
];

function getSchoolPhoto(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SCHOOL_PHOTOS[hash % SCHOOL_PHOTOS.length];
}

const FRENCH_TYPES = new Set(['FP', 'FC', 'FS']);

function formatK(price) {
  return price >= 1000 ? `$${(price / 1000).toFixed(1)}k` : `$${price}`;
}

function getScoreLabel(rating) {
  if (rating == null) return null;
  if (rating >= 8) return 'Excellent';
  if (rating >= 6) return 'Strong';
  if (rating >= 4) return 'Average';
  return 'Low';
}

// TODO: replace with Toronto Neighbourhood Equity Index or Walk Score API
function getNeighbourhoodNote(rating) {
  if (rating === null || rating === undefined) return null;
  if (rating >= 7.5) return "This school sits in a well-connected neighbourhood with good access to parks, transit, and amenities.";
  if (rating >= 5.0) return "This neighbourhood has a mix of amenities. Worth visiting before committing to a rental in this catchment.";
  return "Check walkability and transit access for this catchment before shortlisting rentals — neighbourhood quality varies.";
}

const BUDGET_MIN = 1500;
const BUDGET_MAX = 5000;

export default function SchoolPanel({
  school, nearbyRentals, onClose, onRentalClick,
  rentalMode, onExploreRentals, onBackToOverview, onShareClick,
  budgetMin = BUDGET_MIN, budgetMax = BUDGET_MAX,
  onBudgetMinChange, onBudgetMaxChange,
}) {
  if (!school) return null;

  const props = school.properties;
  const { name, rating, website, schoolType } = school;
  const displayName = toTitleCase(props.NAME || name);
  const isFrench = FRENCH_TYPES.has(schoolType);
  const hasRentals = nearbyRentals && nearbyRentals.length > 0;

  const [fraserExpanded, setFraserExpanded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const explainerRef = useRef(null);

  useEffect(() => {
    setFraserExpanded(false);
    setMapLoading(true);
    const t = setTimeout(() => setMapLoading(false), 4000);
    return () => clearTimeout(t);
  }, [name]);

  // Scroll expanded explainer into view on mobile
  useEffect(() => {
    if (fraserExpanded && explainerRef.current && window.innerWidth < 768) {
      explainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [fraserExpanded]);

  const priceMin = hasRentals ? Math.min(...nearbyRentals.map(r => r.price)) : null;
  const priceMax = hasRentals ? Math.max(...nearbyRentals.map(r => r.price)) : null;
  const scoreLabel = getScoreLabel(rating);

  // Fraser score enrichment
  const hasRating = rating != null;
  const barColor = !hasRating ? 'var(--mute)'
    : rating >= 7.5 ? 'var(--green)'
    : rating >= 5.0 ? 'var(--amber)'
    : 'var(--red)';
  const contextText = !hasRating ? null
    : rating >= 7.5 ? 'Students scored above the Ontario provincial average.'
    : rating >= 5.0 ? 'Students scored near the Ontario provincial average.'
    : 'Students scored below the Ontario provincial average.';
  // ELL heuristic — TODO: replace with TDSB open data enrolment figures
  const isELLHeavy = hasRating && rating < 4.5 && (schoolType === 'EP' || schoolType === 'ES');
  const ourkidsQuery = encodeURIComponent(displayName);
  const budgetMinPct = ((budgetMin - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const budgetMaxPct = ((budgetMax - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  /* ── Rental list view ── */
  if (rentalMode) {
    return (
      <div className="panel school-panel">
        {onShareClick && (
          <button className="panel__share-btn" onClick={onShareClick} aria-label="Share">
            <Share2 size={16} />
          </button>
        )}
        <div className="panel__rental-mode-header">
          <button className="panel__back-btn" onClick={onBackToOverview}>← School info</button>
          <span className="panel__rental-mode-count">{nearbyRentals.length} rental{nearbyRentals.length !== 1 ? 's' : ''}</span>
          <button className="panel__close panel__close--inline" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {hasRentals ? (
          <ul className="panel__rental-list">
            {nearbyRentals.map(r => (
              <li key={r.id} className="panel__rental-item" onClick={() => onRentalClick && onRentalClick(r)}>
                {r.imageUrl && (
                  <img className="panel__rental-photo" src={r.imageUrl} alt={r.address} loading="lazy" />
                )}
                <div className="panel__rental-body">
                  <div className="panel__rental-address">{r.address}</div>
                  <div className="panel__rental-neighbourhood">{r.neighbourhood}</div>
                  <div className="panel__rental-meta">
                    <span className="panel__rental-price">${r.price.toLocaleString()}/mo</span>
                    <span className="panel__rental-beds">{r.bedrooms}bd · {r.bathrooms}ba</span>
                    <span className="panel__rental-type">{r.type}</span>
                  </div>
                  {r.distance != null && (
                    <div className="panel__rental-distance">~{walkMinutes(r.distance)} min walk</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="sidebar__empty-state">
            <span className="sidebar__empty-icon">🏠</span>
            <p className="sidebar__empty-text">No rentals found inside this catchment right now.</p>
            <button className="panel__try-nearby-btn" onClick={onClose}>
              Try a nearby school →
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── School overview ── */
  return (
    <div className="panel school-panel">
      <button className="panel__close" onClick={onClose} aria-label="Close school panel">✕</button>
      {onShareClick && (
        <button className="panel__share-btn" onClick={onShareClick} aria-label="Share">
          <Share2 size={16} />
        </button>
      )}

      <img
        src={getSchoolPhoto(props.NAME || name)}
        alt={displayName}
        className="panel__photo"
        style={{ width: '100%', objectFit: 'cover', display: 'block' }}
      />

      <div className="panel__overview-body">
        {/* Type / language badges */}
        <div className="panel__badges-row">
          {isFrench && <span className="panel__badge panel__badge--french">French</span>}
          <span className="panel__badge panel__badge--type">{getTypeLabel(schoolType)}</span>
        </div>

        <h2 className="panel__name">{displayName}</h2>

        {props.ADDRESS_FULL && (
          <p className="panel__location">
            Toronto · {toTitleCase(props.ADDRESS_FULL)}{props.POSTAL_CODE ? `, ${props.POSTAL_CODE}` : ''}
          </p>
        )}

        {/* Fraser score card */}
        <div className="score-block">
          <div className="score-dot" style={{ background: hasRating ? getRatingColor(rating) : '#9ca3af' }}>
            {hasRating ? rating.toFixed(1) : '–'}
          </div>
          <div className="score-meta">
            <div className="score-meta__lbl">Fraser Score</div>
            <div className="score-meta__hdr">
              <span className="score-meta__value">{scoreLabel || 'Not rated'}</span>
              <button
                className={`qbtn${fraserExpanded ? ' qbtn--on' : ''}`}
                onClick={() => setFraserExpanded(x => !x)}
                aria-label="What is the Fraser rating?"
              >?</button>
            </div>

            {hasRating && (
              <>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${(rating / 10) * 100}%`, background: barColor }} />
                </div>
                <div className="score-bar-labels"><span>1</span><span>10</span></div>
                <p className="score-context">{contextText}</p>
              </>
            )}

            {isELLHeavy && (
              <div className="score-ell-callout">
                This school serves many English Language Learners. Fraser scores are known to underrank ELL-heavy schools due to methodology — not teaching quality.
              </div>
            )}

            {fraserExpanded && (
              <div className="explainer" ref={explainerRef}>
                <ul>
                  {[
                    { text: 'EQAO test results in reading, writing, and math', isIn: true },
                    { text: 'Year-over-year improvement trends', isIn: true },
                    { text: 'School-wide participation rates', isIn: true },
                    { text: 'Teacher quality or class sizes', isIn: false },
                    { text: 'Safety or community feel', isIn: false },
                    { text: 'Extracurriculars or arts programs', isIn: false },
                    { text: 'French immersion or special program outcomes', isIn: false },
                  ].map(({ text, isIn }) => (
                    <li key={text} style={{ color: isIn ? 'var(--green)' : 'var(--mute)' }}>
                      <span>{isIn ? '✓' : '✗'}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="score-links">
              <a className="score-link" href="https://www.tdsb.on.ca/Find-your/Schools" target="_blank" rel="noopener noreferrer">
                TDSB profile ↗
              </a>
              <a className="score-link" href={`https://www.ourkids.net/school/search/?q=${ourkidsQuery}`} target="_blank" rel="noopener noreferrer">
                Parent reviews ↗
              </a>
              <a className="score-link" href={`https://www.fraserinstitute.org/school-performance`} target="_blank" rel="noopener noreferrer">
                Fraser full report ↗
              </a>
            </div>
            <p className="score-attribution">
              Fraser Institute data, public attribution. Parent reviews via OurKids.net — not affiliated.
            </p>
          </div>
        </div>

        {hasRating && (
          <div className="panel__neighbourhood-note">
            <MapPin className="panel__neighbourhood-note-icon" size={14} color="var(--mute)" />
            <span>{getNeighbourhoodNote(rating)}</span>
          </div>
        )}

        {website && (
          <a className="panel__website-btn" href={website} target="_blank" rel="noopener noreferrer">
            Visit School Website →
          </a>
        )}

        {/* Rental budget filter */}
        {onBudgetMinChange && onBudgetMaxChange && (
          <div className="panel__budget-filter">
            <div className="panel__budget-header">
              <span className="panel__budget-label">RENTAL BUDGET</span>
              <span className="panel__budget-value">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
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
        )}

        {/* Rental count + price range */}
        <div className="panel__rental-summary">
          {hasRentals ? (
            <>
              <span>
                <strong>{nearbyRentals.length} rental{nearbyRentals.length !== 1 ? 's' : ''}</strong>
                {' '}inside this catchment
              </span>
              <span className="panel__rental-range">{formatK(priceMin)}–{formatK(priceMax)}</span>
            </>
          ) : (
            <span className="panel__rental-none">No rentals in budget range</span>
          )}
          {mapLoading && hasRentals && (
            <span className="panel__locating">↗ Locating…</span>
          )}
        </div>

      </div>

      <div className="panel__cta-sticky">
        <button
          className={`panel__explore-btn${!hasRentals ? ' panel__explore-btn--disabled' : ''}`}
          onClick={() => hasRentals && onExploreRentals && onExploreRentals()}
          disabled={!hasRentals}
        >
          {hasRentals ? 'Explore rentals →' : 'No rentals in catchment'}
        </button>
      </div>
    </div>
  );
}
