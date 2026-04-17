import React, { useState, useEffect } from 'react';
import { getRatingColor, getTypeLabel, getTypeColor, toTitleCase, walkMinutes } from '../utils/school.js';

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

export default function SchoolPanel({ school, nearbyRentals, onClose, onRentalClick }) {
  if (!school) return null;

  const props = school.properties;
  const { name, rating, website, schoolType } = school;
  const displayName = toTitleCase(props.NAME || name);
  const isFrench = FRENCH_TYPES.has(schoolType);

  const [mapLoading, setMapLoading] = useState(true);
  const [fraserExpanded, setFraserExpanded] = useState(false);

  useEffect(() => {
    setMapLoading(true);
    setFraserExpanded(false);
    const t = setTimeout(() => setMapLoading(false), 4000);
    return () => clearTimeout(t);
  }, [name]);

  const hasRentals = nearbyRentals && nearbyRentals.length > 0;

  return (
    <div className="panel school-panel">
      <button className="panel__close" onClick={onClose} aria-label="Close school panel">✕</button>

      <img
        src={getSchoolPhoto(props.NAME || name)}
        alt={displayName}
        className="panel__photo"
        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
      />

      <div className="panel__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 className="panel__name" style={{ margin: 0 }}>{displayName}</h2>
          {isFrench && (
            <span className="panel__french-badge">FR</span>
          )}
        </div>
        <span className="panel__type-badge" style={{ background: getTypeColor(schoolType) }}>
          {getTypeLabel(schoolType)}
        </span>
      </div>

      {/* Rating + collapsible Fraser note */}
      <div className="panel__rating-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {rating != null ? (
            <div className="panel__rating-badge" style={{ background: getRatingColor(rating) }}>
              <span className="panel__rating-num">{rating.toFixed(1)}</span>
              <span className="panel__rating-label">/10 Fraser</span>
            </div>
          ) : (
            <div className="panel__rating-badge panel__rating-badge--unrated">
              <span className="panel__rating-num">N/A</span>
              <span className="panel__rating-label">Unrated</span>
            </div>
          )}
          <button
            className="panel__fraser-toggle"
            onClick={() => setFraserExpanded(x => !x)}
            aria-label="What is the Fraser rating?"
          >
            ?
          </button>
        </div>
        {fraserExpanded && (
          <p className="panel__fraser-note panel__fraser-note--visible">
            Fraser Institute rates schools 1–10 based on academic results (standardised tests, graduation rates).
            It's a useful proxy but doesn't capture school culture, programs, or community.
          </p>
        )}
      </div>

      {/* Details */}
      <div className="panel__details">
        {props.BOARD_NAME && props.BOARD_NAME !== 'None' && (
          <div className="panel__detail-row">
            <span className="panel__detail-label">Board</span>
            <span className="panel__detail-value">{props.BOARD_NAME}</span>
          </div>
        )}
        {props.ADDRESS_FULL && (
          <div className="panel__detail-row">
            <span className="panel__detail-label">Address</span>
            <span className="panel__detail-value">
              {toTitleCase(props.ADDRESS_FULL)}{props.POSTAL_CODE ? `, ${props.POSTAL_CODE}` : ''}
            </span>
          </div>
        )}
        {isFrench && (
          <div className="panel__detail-row">
            <span className="panel__detail-label">Language</span>
            <span className="panel__detail-value" style={{ color: '#16a34a', fontWeight: 600 }}>French instruction</span>
          </div>
        )}
      </div>

      {website && (
        <a className="panel__website-btn" href={website} target="_blank" rel="noopener noreferrer">
          Visit School Website →
        </a>
      )}

      {/* Rental count */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>
          {nearbyRentals ? nearbyRentals.length : 0}
        </span>
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            rental{nearbyRentals?.length !== 1 ? 's' : ''} available in catchment
          </div>
          {mapLoading && hasRentals && (
            <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px' }}>
              ↗ Locating buildings on map…
            </div>
          )}
        </div>
      </div>

      {/* Nearby rentals */}
      <div className="panel__section panel__section--dark">
        <div className="panel__section-header-row">
          <h3 className="panel__section-title" style={{ margin: 0 }}>Rentals in catchment</h3>
          <button className="panel__choose-school-btn" onClick={onClose}>
            ← Choose another school
          </button>
        </div>
        {hasRentals ? (
          <ul className="panel__rental-list" style={{ marginTop: '10px' }}>
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
          <div className="panel__empty-rentals" style={{ marginTop: '10px' }}>
            <p>No rentals found in this catchment.</p>
            <p className="panel__empty-rentals-hint">Try widening your budget or explore a nearby school.</p>
          </div>
        )}
      </div>
    </div>
  );
}
