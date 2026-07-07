/* Phase 2b: hand-rolled SVG charts, no chart library by spec.
   All three take precomputed rows from store.js selectors and render
   pure SVG. Colors come from a fixed palette that reads on both
   themes; the line chart rides the accent variable. */
import React from 'react';

const PALETTE = ['#FFC53D', '#7C9EF5', '#5FBF8A', '#E2789F', '#B08CE8', '#EE9A5B', '#5CC8D7', '#A8B84B'];

function hoursLabel(minutes) {
  var h = minutes / 60;
  if (h >= 100) return Math.round(h) + 'h';
  return (Math.round(h * 10) / 10) + 'h';
}

/* Horizontal bars, top N genres by watched minutes. Multi-genre
   titles count toward every genre they carry, so bars overlap by
   design and are not shares of a whole. */
export function GenreBars({ rows, maxRows }) {
  const shown = rows.slice(0, maxRows || 8);
  if (shown.length === 0) return null;
  const max = shown[0].minutes || 1;
  const rowH = 30;
  const labelW = 118;
  const valueW = 52;
  const w = 560;
  const barMax = w - labelW - valueW;
  const h = shown.length * rowH;
  return (
    <svg className="chart-svg" viewBox={'0 0 ' + w + ' ' + h} role="img" aria-label="Watched hours by genre">
      {shown.map((r, i) => {
        const bw = Math.max(2, Math.round((r.minutes / max) * barMax));
        const y = i * rowH;
        return (
          <g key={r.genre}>
            <text x={labelW - 8} y={y + rowH / 2 + 4} textAnchor="end" className="chart-label">{r.genre}</text>
            <rect x={labelW} y={y + 6} width={bw} height={rowH - 12} rx="4" fill={PALETTE[i % PALETTE.length]} />
            <text x={labelW + bw + 8} y={y + rowH / 2 + 4} className="chart-value">{hoursLabel(r.minutes)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Donut of PRIMARY genre only (each title's first TMDB genre), so
   slices are true shares that sum to 100% of attributed minutes.
   Top 6 slices plus Other. */
export function GenreDonut({ rows }) {
  const top = rows.slice(0, 6);
  const rest = rows.slice(6).reduce((a, r) => a + r.minutes, 0);
  const slices = rest > 0 ? top.concat([{ genre: 'Other', minutes: rest }]) : top;
  const total = slices.reduce((a, r) => a + r.minutes, 0);
  if (!total) return null;
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg className="chart-svg chart-svg--donut" viewBox="0 0 200 200" role="img" aria-label="Share of watch time by primary genre">
        {slices.map((s, i) => {
          const frac = s.minutes / total;
          const dash = frac * C;
          const el = (
            <circle
              key={s.genre} cx="100" cy="100" r={R} fill="none"
              stroke={s.genre === 'Other' ? 'var(--line)' : PALETTE[i % PALETTE.length]}
              strokeWidth="30"
              strokeDasharray={dash + ' ' + (C - dash)}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="donut-legend">
        {slices.map((s, i) => (
          <li key={s.genre}>
            <span className="donut-legend__dot" style={{ background: s.genre === 'Other' ? 'var(--line)' : PALETTE[i % PALETTE.length] }} />
            {s.genre} <span className="donut-legend__pct">{Math.round((s.minutes / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Watch minutes per month as an area line. X labels thin themselves
   out so a decade of history stays readable. */
export function ActivityLine({ months }) {
  if (!months || months.length < 2) return null;
  const w = 560, h = 170, padL = 44, padB = 26, padT = 12, padR = 8;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max.apply(null, months.map((m) => m.minutes)) || 1;
  const x = (i) => padL + (i / (months.length - 1)) * innerW;
  const y = (v) => padT + innerH - (v / max) * innerH;
  const pts = months.map((m, i) => x(i) + ',' + y(m.minutes)).join(' ');
  const area = padL + ',' + (padT + innerH) + ' ' + pts + ' ' + (padL + innerW) + ',' + (padT + innerH);
  const every = Math.max(1, Math.ceil(months.length / 7));
  function label(key) {
    const p = key.split('-');
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(p[1])] + ' ' + p[0].slice(2);
  }
  return (
    <svg className="chart-svg" viewBox={'0 0 ' + w + ' ' + h} role="img" aria-label="Watch time per month">
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} className="chart-axis" />
      <text x={padL - 6} y={padT + 8} textAnchor="end" className="chart-value">{hoursLabel(max)}</text>
      <text x={padL - 6} y={padT + innerH + 4} textAnchor="end" className="chart-value">0</text>
      <polygon points={area} fill="var(--accent-soft)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {months.map((m, i) => (i % every === 0 ? (
        <text key={m.key} x={x(i)} y={h - 8} textAnchor="middle" className="chart-label chart-label--sm">{label(m.key)}</text>
      ) : null))}
    </svg>
  );
}

export function fmtHours(minutes) { return hoursLabel(minutes); }
