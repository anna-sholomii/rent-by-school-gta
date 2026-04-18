import React, { useState, useEffect } from 'react';
import { getRatingColor, getTypeLabel, toTitleCase, walkMinutes } from '../utils/school.js';

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

export default function SchoolPanel({ school, nearbyRentals, onClose, onRentalClick, rentalMode, onExploreRentals, onBackToOverview }) {
  if (!school) return null;

  const props = school.properties;
  const { name, rating, website, schoolType } = school;
  const displayName = toTitleCase(props.NAME || name);
  const isFrench = FRENCH_TYPES.has(schoolType);
  const hasRentals = nearbyRentals && nearbyRentals.length > 0;

  const [fraserExpanded, setFraserExpanded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    setFraserExpanded(false);
    setMapLoading(true);
    const t = setTimeout(() => setMapLoading(false), 4000);
    return () => clearTimeout(t);
  }, [name]);

  const priceMin = hasRentals ? Math.min(...nearbyRentals.map(r => r.price)) : null;
  const priceMax = hasRentals ? Math.max(...nearbyRentals.map(r => r.price)) : null;
  const scoreLabel = getScoreLabel(rating);

  /* ── Rental list view ── */
  if (rentalMode) {
    return (
      <div className="panel school-panel">
        <div className="panel__rental-mode-header">
          <button className="panel__back-btn" onClick={onBackToOverview}>← School info</button>
          <span className="panel__rental-mode-count">{nearbyRentals.length} rental{nearbyRentals.length !== 1 ? 's' : ''}</span>
          <button className="panel__close panel__close--inline" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <button className="panel__choose-school-btn" onClick={onClose}>
          ← Choose another school
        </button>
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
          <div className="panel__empty-rentals" style={{ padding: '16px' }}>
            <p>No rentals found in this catchment.</p>
            <p className="panel__empty-rentals-hint">Try widening your budget or explore a nearby school.</p>
          </div>
        )}
      </div>
    );
  }

  /* ── School overview ── */
  return (
    <div className="panel school-panel">
      <button className="panel__close" onClick={onClose} aria-label="Close school panel">✕</button>

      <img
        src={getSchoolPhoto(props.NAME || name)}
        alt={displayName}
        className="panel__photo"
        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
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
          <div className="score-dot" style={{ background: rating != null ? getRatingColor(rating) : '#9ca3af' }}>
            {rating != null ? rating.toFixed(1) : '–'}
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
            {fraserExpanded && (
              <div className="explainer">
                Fraser Institute rates schools 1–10 based on academic results (standardised tests, graduation rates).
                Useful signal, but doesn't capture school culture, extracurriculars, or community.
              </div>
            )}
          </div>
        </div>

        {website && (
          <a className="panel__website-btn" href={website} target="_blank" rel="noopener noreferrer">
            Visit School Website →
          </a>
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

        {/* CTA button */}
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
