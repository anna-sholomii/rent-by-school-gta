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

function formatPrice(price) {
  return '$' + price.toLocaleString();
}

export default function RentalPanel({ rental, assignedSchool, onClose, onSchoolClick }) {
  if (!rental) return null;

  return (
    <div className="panel rental-panel">
      <button className="panel__close" onClick={onClose} title="Close">✕</button>

      {/* Rental photo */}
      {rental.photo
        ? <img src={rental.photo} alt={rental.address} className="panel__photo panel__photo--rental" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
        : <div className="panel__photo panel__photo--rental"><span className="panel__photo-icon">🏠</span></div>
      }

      <div className="panel__header">
        <h2 className="panel__name">{rental.address}</h2>
        <span className="panel__neighbourhood">{rental.neighbourhood}</span>
      </div>

      {/* Price */}
      <div className="panel__price-row">
        <span className="panel__price">{formatPrice(rental.price)}</span>
        <span className="panel__price-period">/month</span>
      </div>

      <div className="panel__details">
        <div className="panel__detail-row">
          <span className="panel__detail-label">Type</span>
          <span className="panel__detail-value">{rental.type}</span>
        </div>
        <div className="panel__detail-row">
          <span className="panel__detail-label">Bedrooms</span>
          <span className="panel__detail-value">{rental.bedrooms}</span>
        </div>
        <div className="panel__detail-row">
          <span className="panel__detail-label">Bathrooms</span>
          <span className="panel__detail-value">{rental.bathrooms}</span>
        </div>
      </div>

      {rental.url && (
        <a
          className="panel__website-btn"
          href={rental.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Listing →
        </a>
      )}

      {/* Assigned school */}
      <div className="panel__section">
        <h3 className="panel__section-title">Assigned School</h3>
        {assignedSchool ? (
          <ul className="panel__school-list">
            <li
              className="panel__school-item"
              onClick={() => onSchoolClick && onSchoolClick(assignedSchool)}
            >
              <div className="panel__school-item-header">
                <span
                  className="panel__school-type-dot"
                  style={{ background: getTypeColor(assignedSchool.schoolType) }}
                />
                <span className="panel__school-item-name">{assignedSchool.name}</span>
              </div>
              <div className="panel__school-item-meta">
                <span
                  className="panel__school-item-rating"
                  style={{ background: getRatingColor(assignedSchool.rating), color: '#fff' }}
                >
                  {assignedSchool.rating != null ? assignedSchool.rating.toFixed(1) : 'N/A'}
                </span>
                <span
                  className="panel__school-item-type"
                  style={{ color: getTypeColor(assignedSchool.schoolType) }}
                >
                  {getTypeLabel(assignedSchool.schoolType)}
                </span>
              </div>
            </li>
          </ul>
        ) : (
          <p className="panel__empty">No catchment area found for this address.</p>
        )}
      </div>
    </div>
  );
}
