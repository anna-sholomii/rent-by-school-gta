import React, { useState } from 'react';
import { getRatingColor, getTypeLabel, toTitleCase } from '../utils/school.js';

export default function SchoolList({ schools, onSchoolSelect }) {
  const [sort, setSort] = useState('rating-desc');

  const sorted = [...schools].sort((a, b) => {
    if (sort === 'rating-desc') {
      return (b.rating ?? -1) - (a.rating ?? -1);
    }
    if (sort === 'rating-asc') {
      return (a.rating ?? 11) - (b.rating ?? 11);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  const sortOptions = [
    { key: 'rating-desc', label: 'Rating ↓' },
    { key: 'rating-asc',  label: 'Rating ↑' },
    { key: 'name',        label: 'Name A–Z' },
  ];

  return (
    <div id="school-list" className="school-list">
      <div className="school-list__sort" role="group" aria-label="Sort schools">
        <span className="school-list__sort-label" id="sort-label">Sort by:</span>
        {sortOptions.map(({ key, label }) => (
          <button
            key={key}
            className={`segmented-btn${sort === key ? ' active' : ''}`}
            onClick={() => setSort(key)}
            aria-pressed={sort === key}
            aria-describedby="sort-label"
          >
            {label}
          </button>
        ))}
      </div>

      <ul
        role="list"
        aria-label="Schools matching your filters"
        className="school-list__items"
      >
        {sorted.map(school => {
          const displayName = toTitleCase(school.name);
          const ratingText = school.rating != null
            ? `Fraser score ${school.rating.toFixed(1)}`
            : 'not rated';
          const boardText = getTypeLabel(school.schoolType);
          const ariaLabel = `${displayName}, ${ratingText}, ${boardText}, tap to explore catchment and rentals`;

          return (
            <li
              key={school.properties?._id || school.name}
              role="listitem"
            >
              <button
                className="school-list__item-inner"
                aria-label={ariaLabel}
                onClick={() => onSchoolSelect(school)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSchoolSelect(school);
                  }
                }}
              >
                <span
                  className="school-list__dot"
                  style={{ background: getRatingColor(school.rating) }}
                  aria-hidden="true"
                />
                <span className="school-list__info">
                  <span className="school-list__name">{displayName}</span>
                  <span className="school-list__meta">
                    {school.rating != null ? school.rating.toFixed(1) : '–'} · {boardText}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
