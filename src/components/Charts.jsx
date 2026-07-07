/* Phase 2b charts, made interactive in v2.5.0. Still hand-rolled SVG,
   no chart library by spec. Interactivity model: hover highlights
   (desktop only, cosmetic), CLICK selects (works on touch too). The
   parent owns the selection and renders the drill-down list, so the
   charts stay pure: rows in, onSelect out. */
import React, { useState } from 'react';

const PALETTE = ['#FFC53D', '#7C9EF5', '#5FBF8A', '#E2789F', '#B08CE8', '#EE9A5B', '#5CC8D7', '#A8B84B'];

function hoursLabel(minutes) {
  var h = minutes / 60;
  if (h >= 100) return Math.round(h) + 'h';
  return (Math.round(h * 10) / 10) + 'h';
}

export function paletteFor(i) { return PALETTE[i % PALETTE.length]; }

/* Horizontal bars, top N genres by watched minutes. Multi-genre
   titles count toward every genre they carry, so bars overlap by
   design and are not shares of a whole. Click a row to select it. */
export function GenreBars({ rows, maxRows, selected, onSelect }) {
  const [hover, setHover] = useState(null);
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
        const on = selected === r.genre;
        const dim = (selected && !on) || (hover !== null && hover !== r.genre && !selected);
        return (
          <g key={r.genre}
            className={'chart-hit' + (on ? ' chart-hit--on' : '') + (dim ? ' chart-hit--dim' : '')}
            onClick={() => onSelect && onSelect(on ? null : r.genre)}
            onMouseEnter={() => setHover(r.genre)}
            onMouseLeave={() => setHover(null)}
            role="button" tabIndex={0} aria-pressed={on}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelect) { e.preventDefault(); onSelect(on ? null : r.genre); } }}>
            <rect x="0" y={y} width={w} height={rowH} fill="transparent" />
            <text x={labelW - 8} y={y + rowH / 2 + 4} textAnchor="end" className="chart-label">{r.genre}</text>
            <rect x={labelW} y={y + 6} width={bw} height={rowH - 12} rx="4" fill={PALETTE[i % PALETTE.length]} className="chart-bar" />
            <text x={labelW + bw + 8} y={y + rowH / 2 + 4} className="chart-value">{hoursLabel(r.minutes)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Donut of PRIMARY genre only (each title's first TMDB genre), so
   slices are true shares that sum to 100% of attributed minutes.
   Top 6 slices plus Other. Slices and legend rows are both clickable;
   Other is not selectable because it is not a real genre. */
export function GenreDonut({ rows, selected, onSelect }) {
  const [hover, setHover] = useState(null);
  const top = rows.slice(0, 6);
  const rest = rows.slice(6).reduce((a, r) => a + r.minutes, 0);
  const slices = rest > 0 ? top.concat([{ genre: 'Other', minutes: rest }]) : top;
  const total = slices.reduce((a, r) => a + r.minutes, 0);
  if (!total) return null;
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  function pick(genre) {
    if (genre === 'Other' || !onSelect) return;
    onSelect(selected === genre ? null : genre);
  }
  return (
    <div className="donut-wrap">
      <svg className="chart-svg chart-svg--donut" viewBox="0 0 200 200" role="img" aria-label="Share of watch time by primary genre">
        {slices.map((s, i) => {
          const frac = s.minutes / total;
          const dash = frac * C;
          const on = selected === s.genre;
          const dim = (selected && !on) || (hover !== null && hover !== s.genre && !selected);
          const el = (
            <circle
              key={s.genre} cx="100" cy="100" r={R} fill="none"
              className={'donut-slice' + (on ? ' donut-slice--on' : '') + (dim ? ' donut-slice--dim' : '') + (s.genre === 'Other' ? ' donut-slice--other' : '')}
              stroke={s.genre === 'Other' ? 'var(--line)' : PALETTE[i % PALETTE.length]}
              strokeWidth={on ? 38 : 30}
              strokeDasharray={dash + ' ' + (C - dash)}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
              onClick={() => pick(s.genre)}
              onMouseEnter={() => setHover(s.genre)}
              onMouseLeave={() => setHover(null)}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="donut-legend">
        {slices.map((s, i) => (
          <li key={s.genre}
            className={'donut-legend__row' + (selected === s.genre ? ' donut-legend__row--on' : '') + (s.genre === 'Other' ? '' : ' donut-legend__row--tap')}
            onClick={() => pick(s.genre)}>
            <span className="donut-legend__dot" style={{ background: s.genre === 'Other' ? 'var(--line)' : PALETTE[i % PALETTE.length] }} />
            {s.genre} <span className="donut-legend__pct">{Math.round((s.minutes / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Watch minutes per month as an area line, with a clickable point per
   month (v2.5.0). Points are the touch-safe way in: hover previews on
   desktop, click selects everywhere; the parent renders what was
   logged that month. X labels thin themselves out so a decade of
   history stays readable. */
export function ActivityLine({ months, selectedKey, onSelect }) {
  const [hover, setHover] = useState(null);
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
  const active = hover || selectedKey;
  const activeIdx = active ? months.findIndex((m) => m.key === active) : -1;
  return (
    <svg className="chart-svg" viewBox={'0 0 ' + w + ' ' + h} role="img" aria-label="Watch time per month">
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} className="chart-axis" />
      <text x={padL - 6} y={padT + 8} textAnchor="end" className="chart-value">{hoursLabel(max)}</text>
      <text x={padL - 6} y={padT + innerH + 4} textAnchor="end" className="chart-value">0</text>
      <polygon points={area} fill="var(--accent-soft)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {activeIdx >= 0 && (
        <>
          <line x1={x(activeIdx)} y1={padT} x2={x(activeIdx)} y2={padT + innerH} className="chart-cursor" />
          <text x={Math.min(Math.max(x(activeIdx), padL + 30), padL + innerW - 30)} y={padT + 8} textAnchor="middle" className="chart-value chart-value--strong">
            {label(months[activeIdx].key)} · {hoursLabel(months[activeIdx].minutes)}
          </text>
        </>
      )}
      {months.map((m, i) => (i % every === 0 ? (
        <text key={m.key} x={x(i)} y={h - 8} textAnchor="middle" className="chart-label chart-label--sm">{label(m.key)}</text>
      ) : null))}
      {months.map((m, i) => (
        <g key={'pt' + m.key}>
          {/* generous invisible hit area so fingers can land on it */}
          <circle cx={x(i)} cy={y(m.minutes)} r="12" fill="transparent" className="chart-hit"
            onClick={() => onSelect && onSelect(selectedKey === m.key ? null : m.key)}
            onMouseEnter={() => setHover(m.key)}
            onMouseLeave={() => setHover(null)} />
          {m.minutes > 0 && (
            <circle cx={x(i)} cy={y(m.minutes)} r={active === m.key ? 5 : 3}
              className={'chart-dot' + (selectedKey === m.key ? ' chart-dot--on' : '')} />
          )}
        </g>
      ))}
    </svg>
  );
}

export function fmtHours(minutes) { return hoursLabel(minutes); }
