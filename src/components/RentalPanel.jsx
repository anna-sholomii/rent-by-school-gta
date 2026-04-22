import React from 'react';
import { getRatingColor, getTypeLabel, getTypeColor, toTitleCase } from '../utils/school.js';

export default function RentalPanel({ rental, assignedSchool, previousSchool, onClose, onSchoolClick, onBackToSchool }) {
  if (!rental) return null;

  return (
    <div className="panel rental-panel">
      <button className="panel__close" onClick={onClose} aria-label="Close rental panel">✕</button>

      {/* Back to school navigation */}
      {previousSchool && (
        <button className="panel__back-btn" onClick={onBackToSchool}>
          ← {toTitleCase(previousSchool.name)}
        </button>
      )}

      {/* Rental photo */}
      {rental.photo
        ? <img src={rental.photo} alt={rental.address} className="panel__photo panel__photo--rental"
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
        : <div className="panel__photo panel__photo--rental"><span className="panel__photo-icon" aria-hidden="true">Home</span></div>
      }

      <div className="panel__header">
        <h2 className="panel__name">{rental.address}</h2>
        <span className="panel__neighbourhood">{rental.neighbourhood}</span>
      </div>

      {/* Price */}
      <div className="panel__price-row">
        <span className="panel__price">${rental.price.toLocaleString()}</span>
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
          aria-label="Open rental partner listing in a new tab"
        >
          View listing on partner site →
        </a>
      )}

      {/* Assigned school */}
      <div className="panel__section">
        <h3 className="panel__section-title">Assigned School</h3>
        {assignedSchool ? (
          <ul className="panel__school-list">
            <li className="panel__school-item" onClick={() => onSchoolClick && onSchoolClick(assignedSchool)}>
              <div className="panel__school-item-header">
                <span className="panel__school-type-dot" style={{ background: getTypeColor(assignedSchool.schoolType) }} />
                <span className="panel__school-item-name">{toTitleCase(assignedSchool.name)}</span>
              </div>
              <div className="panel__school-item-meta">
                <span className="panel__school-item-rating"
                  style={{ background: getRatingColor(assignedSchool.rating), color: '#fff' }}>
                  {assignedSchool.rating != null ? assignedSchool.rating.toFixed(1) : 'N/A'}
                </span>
                <span className="panel__school-item-type" style={{ color: getTypeColor(assignedSchool.schoolType) }}>
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
