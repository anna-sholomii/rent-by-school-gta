import React, { useState } from 'react';
import { getRatingColor, getTypeLabel, toTitleCase } from '../utils/school.js';

export default function SchoolList({ schools, onSchoolSelect }) {
  const [sort, setSort] = useState('rating-desc');

  function handleRatingClick() {
    if (sort === 'rating-desc') setSort('rating-asc');
    else if (sort === 'rating-asc') setSort('rating-desc');
    else setSort('rating-desc');
  }

  function handleNameClick() {
    if (sort === 'name-az') setSort('name-za');
    else if (sort === 'name-za') setSort('name-az');
    else setSort('name-az');
  }

  const ratingArrow = sort === 'rating-desc' ? ' ↓' : sort === 'rating-asc' ? ' ↑' : '';
  const nameArrow = sort === 'name-az' ? ' A→Z' : sort === 'name-za' ? ' Z→A' : '';

  const sorted = [...schools].sort((a, b) => {
    if (sort === 'rating-desc') return (b.rating ?? -1) - (a.rating ?? -1);
    if (sort === 'rating-asc') return (a.rating ?? 11) - (b.rating ?? 11);
    if (sort === 'name-az') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'name-za') return (b.name || '').localeCompare(a.name || '');
    return 0;
  });

  return (
    <div id="school-list" className="school-list">
      <div className="school-list__sort" role="group" aria-label="Sort schools">
        <button
          className={`segmented-btn${sort === 'rating-desc' || sort === 'rating-asc' ? ' active' : ''}`}
          onClick={handleRatingClick}
          aria-pressed={sort === 'rating-desc' || sort === 'rating-asc'}
        >
          Rating{ratingArrow}
        </button>
        <button
          className={`segmented-btn${sort === 'name-az' || sort === 'name-za' ? ' active' : ''}`}
          onClick={handleNameClick}
          aria-pressed={sort === 'name-az' || sort === 'name-za'}
        >
          Name{nameArrow}
        </button>
      </div>

      <div className="school-list__count">Schools ({schools.length})</div>

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
