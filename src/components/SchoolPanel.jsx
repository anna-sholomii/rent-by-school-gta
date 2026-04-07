import React from 'react';

function getRatingColor(rating) {
  if (rating === null || rating === undefined) return '#9ca3af';
  if (rating >= 8) return '#16a34a';
  if (rating >= 6) return '#ca8a04';
  return '#dc2626';
}

function getTypeLabel(type) {
  const map = {
    EP: 'English Public',
    EC: 'English Catholic',
    FP: 'French Public',
    FC: 'French Catholic',
    PR: 'Private',
  };
  return map[type] || type;
}

function getTypeColor(type) {
  const map = {
    EP: '#2563eb',
    EC: '#dc2626',
    FP: '#16a34a',
    FC: '#7c3aed',
    PR: '#6b7280',
  };
  return map[type] || '#6b7280';
}

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

function formatPrice(price) {
  return '$' + price.toLocaleString();
}

export default function SchoolPanel({ school, nearbyRentals, onClose, onRentalClick, onSchoolClick }) {
  if (!school) return null;
  const props = school.properties;
  const { name, rating, website, schoolType } = school;

  return (
    <div className="panel school-panel">
      <button className="panel__close" onClick={onClose} title="Close">✕</button>

      {/* School exterior photo */}
      <img
        src={getSchoolPhoto(props.NAME || name)}
        alt={props.NAME || name}
        className="panel__photo"
        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
      />

      {/* School name & type badge */}
      <div className="panel__header">
        <h2 className="panel__name">{props.NAME}</h2>
        <span
          className="panel__type-badge"
          style={{ background: getTypeColor(schoolType) }}
        >
          {getTypeLabel(schoolType)}
        </span>
      </div>

      {/* Rating badge */}
      <div className="panel__rating-row">
        {rating !== null && rating !== undefined ? (
          <div
            className="panel__rating-badge"
            style={{ background: getRatingColor(rating) }}
          >
            <span className="panel__rating-num">{rating.toFixed(1)}</span>
            <span className="panel__rating-label">/10 Fraser</span>
          </div>
        ) : (
          <div className="panel__rating-badge panel__rating-badge--unrated">
            <span className="panel__rating-num">N/A</span>
            <span className="panel__rating-label">Unrated</span>
          </div>
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
            <span className="panel__detail-value">{props.ADDRESS_FULL}{props.POSTAL_CODE ? `, ${props.POSTAL_CODE}` : ''}</span>
          </div>
        )}
        {props.SCHOOL_LEVEL && props.SCHOOL_LEVEL !== 'None' && (
          <div className="panel__detail-row">
            <span className="panel__detail-label">Level</span>
            <span className="panel__detail-value">{props.SCHOOL_LEVEL}</span>
          </div>
        )}
      </div>

      {/* Website */}
      {website && (
        <a
          className="panel__website-btn"
          href={website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit School Website →
        </a>
      )}

      {/* Rental count summary */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>
          {nearbyRentals ? nearbyRentals.length : 0}
        </span>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
          rental{nearbyRentals?.length !== 1 ? 's' : ''} available in catchment
        </span>
      </div>

      {/* Nearby rentals */}
      <div className="panel__section panel__section--dark">
        <h3 className="panel__section-title">Nearby Rentals (within catchment)</h3>
        {nearbyRentals && nearbyRentals.length > 0 ? (
          <ul className="panel__rental-list">
            {nearbyRentals.map(r => (
              <li
                key={r.id}
                className="panel__rental-item"
                onClick={() => onRentalClick && onRentalClick(r)}
              >
                {r.imageUrl && (
                  <img
                    className="panel__rental-photo"
                    src={r.imageUrl}
                    alt={r.address}
                    loading="lazy"
                  />
                )}
                <div className="panel__rental-body">
                  <div className="panel__rental-address">{r.address}</div>
                  <div className="panel__rental-neighbourhood">{r.neighbourhood}</div>
                  <div className="panel__rental-meta">
                    <span className="panel__rental-price">{formatPrice(r.price)}/mo</span>
                    <span className="panel__rental-beds">{r.bedrooms}bd · {r.bathrooms}ba</span>
                    <span className="panel__rental-type">{r.type}</span>
                  </div>
                  {r.distance && <div className="panel__rental-distance">{Math.max(1, Math.round(r.distance / 80))} min walk</div>}
                  <div className="panel__rental-school" style={{ fontSize: '11px', color: getTypeColor(schoolType), marginTop: '4px', fontWeight: 600 }}>
                    🏫 {name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel__empty">No rentals found within 800m.</p>
        )}
      </div>
    </div>
  );
}
