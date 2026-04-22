function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Score how well `schoolName` matches `query` (lowercase).
 * Higher = better. Used for ordering autocomplete results.
 */
export function matchScore(schoolName, queryLower) {
  const name = (schoolName || '').toLowerCase();
  const q = queryLower.trim();
  if (!q || !name) return -1;

  if (name.startsWith(q)) return 1000 - name.length * 0.01;

  const words = name.split(/\s+/).filter(Boolean);
  const firstStarts = words.some(w => w.startsWith(q));
  if (firstStarts) return 900 - name.length * 0.01;

  try {
    const re = new RegExp(`\\b${escapeRegex(q)}`, 'i');
    if (re.test(name)) return 800 - name.length * 0.01;
  } catch {
    /* ignore */
  }

  if (name.includes(q)) return 600 - name.length * 0.01;

  const tokens = q.split(/\s+/).filter(t => t.length > 0);
  if (tokens.every(t => name.includes(t))) return 500 - name.length * 0.01;

  return -1;
}

/**
 * Returns schools whose name matches every token in `query` or passes matchScore > 0,
 * sorted by match quality.
 */
export function rankSchoolsByQuery(schools, rawQuery, limit = 8) {
  const q = (rawQuery || '').trim();
  if (q.length < 2) return [];

  const lower = q.toLowerCase();
  const tokens = lower.split(/\s+/).filter(t => t.length > 0);

  const ranked = [];
  for (const s of schools) {
    const name = s.name || '';
    const nameLower = name.toLowerCase();
    const tokenOk = tokens.every(t => nameLower.includes(t));
    const score = matchScore(name, lower);
    if (!tokenOk && score < 0) continue;
    ranked.push({ school: s, score: Math.max(score, tokenOk ? 400 : 0) });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.school.name || '').localeCompare(b.school.name || '');
  });

  const seen = new Set();
  const out = [];
  for (const { school } of ranked) {
    const id = school.id ?? school.properties?._id;
    if (id != null && seen.has(id)) continue;
    if (id != null) seen.add(id);
    out.push(school);
    if (out.length >= limit) break;
  }
  return out;
}
