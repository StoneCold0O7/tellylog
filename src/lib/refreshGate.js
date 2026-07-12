/* TellyLog - refreshGate.js (v2.7.0)
   The cost guardrail on both AI surfaces (Explore rails, Profile taste
   summary). Before v2.7.0 each surface regenerated whenever the
   library hash changed, so a heavy logging evening could burn an API
   call per page visit. The gate makes staleness a feature:

   - FIRST generation is immediate. A new user sees their summary and
     their rails right away; there is nothing cached to serve instead.
   - After that, a cached result is served even when the library has
     changed, until BOTH conditions hold:
       1. at least REFRESH_MIN_DAYS days since the cached generation,
       2. at least REFRESH_MIN_UNITS signal units of change since it.
   - A signal unit is a change that genuinely moves the taste profile,
     counted by Store.signalUnits(): each show started, each film
     watched, each rating set, each extra watch-through and one unit
     per ten episodes ticked. Ticking three episodes of a show you are
     already deep into is not a taste event; six new films is.

   The thresholds are deliberate numbers, not tunables hidden in
   component code; the README documents them verbatim. Pure
   functions, node-testable without a DOM. */

export const REFRESH_MIN_DAYS = 5;
export const REFRESH_MIN_UNITS = 6;

/* v2.7.1: the rails cache carries a shape version. The v2.6.0 to
   v2.7.0 migration bug (rails headed "BECAUSE YOU WATCH UNDEFINED" on
   the live site): the old title-anchored cache was newer than 5 days,
   so the gate correctly served it stale, but its entries had no
   `genre` field. Serving a stale cache is only safe when the cache is
   the shape the UI expects, so shape validity is now checked BEFORE
   the gate ever sees the cache. Any cache failing validation is
   treated as absent, which means regenerate. */
/* Bumped to 3 when the deterministic TMDB rails backfill landed: the
   bump invalidates the pre-backfill cache so every user's Explore
   rails regenerate once, immediately, and fill to 5 cards instead of
   serving the thin owned-stripped cache stale for up to 5 days. */
export const RAILS_CACHE_V = 3;

export function validRailsCache(c) {
  return !!(c && c.v === RAILS_CACHE_V && c.h && c.ts &&
    Array.isArray(c.rails) && c.rails.length &&
    c.rails.every(function (r) { return r && typeof r.genre === 'string' && r.genre && Array.isArray(r.cards); }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/* Decide what to do with a cached AI result.
   cached: null | { h, ts, u } (hash, generated-at ms, signal units at
   generation; u may be absent on pre-2.7.0 caches).
   nowHash / nowUnits: the library's current hash and signal units.
   now: Date.now(), injectable for tests.
   Returns 'generate' | 'serve-fresh' | 'serve-stale'. */
export function refreshDecision(cached, nowHash, nowUnits, now) {
  now = typeof now === 'number' ? now : Date.now();
  if (!cached || !cached.h || !cached.ts) return 'generate';
  if (cached.h === nowHash) return 'serve-fresh';
  var oldEnough = now - cached.ts >= REFRESH_MIN_DAYS * DAY_MS;
  /* Pre-2.7.0 caches carry no unit count. Treat the units gate as
     passed once, so old installs converge onto the new bookkeeping
     instead of being stale forever. */
  var movedEnough = typeof cached.u !== 'number'
    ? true
    : Math.abs(nowUnits - cached.u) >= REFRESH_MIN_UNITS;
  return oldEnough && movedEnough ? 'generate' : 'serve-stale';
}

/* Human line for the UI fineprint, kept here so both surfaces say
   exactly the same thing and the copy cannot drift from the code. */
export function policyLine() {
  return 'Refreshes at most once every ' + REFRESH_MIN_DAYS +
    ' days and only after enough new logging has genuinely moved your profile. This keeps API spend proportional to real taste change, not to every tap.';
}
