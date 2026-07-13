/* Clear (✕) button for the search and ask fields. Sits just left of the
   mic and wipes the field in one tap, so clearing a query no longer means
   reopening the keyboard and holding backspace. onMouseDown preventDefault
   keeps focus on the input, so on a phone the keyboard stays open and the
   next query can be typed straight away. The parent renders it only when
   the field has text and owns the actual clear (each field resets its own
   results). */
import React from 'react';

export default function ClearButton({ onClear, label }) {
  return (
    <button
      type="button"
      className="search-clear"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      aria-label={label || 'Clear'}
      title={label || 'Clear'}
    >
      ✕
    </button>
  );
}
