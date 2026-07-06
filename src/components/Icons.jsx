/* Inline SVG icons for the tab bar and Tonight card. Stroke follows
   currentColor so active/inactive tints come from CSS. */
import React from 'react';

const base = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true
};

export function IconTv() {
  return (
    <svg {...base}>
      <rect x="3" y="6.5" width="18" height="12" rx="2.5" />
      <path d="M8.5 3.5 12 6.5l3.5-3" />
    </svg>
  );
}

export function IconCalendar() {
  return (
    <svg {...base}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function IconFilm() {
  return (
    <svg {...base}>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M7.5 4v16M16.5 4v16M3.5 8.5h4M3.5 15.5h4M16.5 8.5h4M16.5 15.5h4" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg {...base} strokeWidth="2.6">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
