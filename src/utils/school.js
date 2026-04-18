// ── Rating ────────────────────────────────────────────────────────────────────

/** 4-tier color scale, consistent between map pins and all panels */
export function getRatingColor(rating) {
  if (rating === null || rating === undefined) return '#9ca3af';
  if (rating >= 8) return '#4CAF50';
  if (rating >= 6) return '#FFC107';
  if (rating >= 4) return '#FF9800';
  return '#E53935';
}

export function getRatingLabel(rating) {
  if (rating === null || rating === undefined) return 'Unrated';
  if (rating >= 8) return 'Excellent';
  if (rating >= 6) return 'Good';
  if (rating >= 4) return 'Average';
  return 'Low';
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** Convert ALL CAPS GeoJSON school names to Title Case */
export function toTitleCase(str) {
  if (!str) return str;
  // Lowercase everything, then capitalise each word
  return str.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase());
}

/** Walk-time estimate using street-grid correction factor (straight-line × 1.3) */
export function walkMinutes(straightLineMetres) {
  const streetMetres = straightLineMetres * 1.3;
  return Math.max(1, Math.round(streetMetres / 80)); // 80 m/min ≈ 4.8 km/h
}

// ── School type labels & colors ───────────────────────────────────────────────

const TYPE_LABELS = {
  EP: 'English Public',
  EC: 'English Catholic',
  FP: 'French Public',
  FC: 'French Catholic',
  ES: 'English Public Secondary',
  FS: 'French Public Secondary',
  PR: 'Private',
};

const TYPE_COLORS = {
  EP: '#2563eb',
  EC: '#dc2626',
  FP: '#16a34a',
  FC: '#7c3aed',
  ES: '#2563eb',
  FS: '#16a34a',
  PR: '#6b7280',
};

export function getTypeLabel(type) { return TYPE_LABELS[type] || type; }
export function getTypeColor(type) { return TYPE_COLORS[type] || '#6b7280'; }
