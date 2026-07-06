/* TellyLog — util.js
   Pure helper functions. No DOM access. Exported to Node for unit tests. */

  /* ---------- CSV ---------- */
  // RFC-4180-ish parser. Handles quoted fields, escaped quotes, CRLF.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;
    var n = text.length;
    while (i < n) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
      field += c; i++;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    // Drop fully empty trailing rows
    rows = rows.filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); });
    if (rows.length === 0) return { headers: [], rows: [] };
    var headers = rows[0].map(function (h) { return String(h).trim(); });
    return { headers: headers, rows: rows.slice(1) };
  }

  /* ---------- Column guessing for imports ---------- */
  function guessColumns(headers) {
    var h = headers.map(function (x) { return x.toLowerCase(); });
    function find(patterns) {
      for (var p = 0; p < patterns.length; p++) {
        for (var i = 0; i < h.length; i++) {
          if (patterns[p].test(h[i])) return i;
        }
      }
      return -1;
    }
    return {
      show: find([/tv[_ ]?show[_ ]?name/, /series[_ ]?name/, /show[_ ]?name/, /^series$/, /^show$/, /^name$/, /title/]),
      season: find([/season[_ ]?number/, /^season$/, /season/]),
      episode: find([/episode[_ ]?number/, /^episode$/, /\bep\b/, /episode/, /^number$/]),
      date: find([/watched[_ ]?at/, /updated[_ ]?at/, /created[_ ]?at/, /^date$/, /date/, /time/]),
      type: find([/entity[_ ]?type/, /^type$/, /media[_ ]?type/])
    };
  }

  /* ---------- Name normalisation & matching ---------- */
  function normName(s) {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'and')
      .replace(/['’`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/^the /, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Dice coefficient on character bigrams. 0..1.
  function similarity(a, b) {
    a = normName(a); b = normName(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    var map = {};
    for (var i = 0; i < a.length - 1; i++) {
      var bg = a.substr(i, 2);
      map[bg] = (map[bg] || 0) + 1;
    }
    var hits = 0;
    for (var j = 0; j < b.length - 1; j++) {
      var bg2 = b.substr(j, 2);
      if (map[bg2] > 0) { hits++; map[bg2]--; }
    }
    return (2 * hits) / (a.length - 1 + b.length - 1);
  }

  /* ---------- Dates ---------- */
  function parseDateFlexible(s) {
    if (!s) return null;
    s = String(s).trim();
    if (!s) return null;
    // "2023-05-01 12:00:00" -> ISO for Safari
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      var t0 = Date.parse(s.replace(' ', 'T'));
      if (!isNaN(t0)) return t0;
    }
    // dd/mm/yyyy or dd-mm-yyyy (UK style) takes priority over the engine's
    // US mm/dd reading for ambiguous slash dates. Netflix UK exports use dd/mm.
    var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) {
      var d = parseInt(m[1], 10);
      var mo = parseInt(m[2], 10);
      // if the first number can't be a day, it must be mm/dd
      if (d > 31 || mo > 12) { var tmp = d; d = mo; mo = tmp; }
      var t1 = Date.parse(m[3] + '-' + pad2(mo) + '-' + pad2(d));
      if (!isNaN(t1)) return t1;
    }
    var t = Date.parse(s.replace(' ', 'T'));
    if (!isNaN(t)) return t;
    t = Date.parse(s);
    if (!isNaN(t)) return t;
    return null;
  }

  function pad2(x) { return ('0' + x).slice(-2); }

  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  var DAY_MS = 24 * 60 * 60 * 1000;
  var WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Group label for an air date relative to now.
  // Returns { label, order, daysAway } — order sorts groups.
  function dayGroup(airDateStr, nowTs) {
    var t = parseDateFlexible(airDateStr);
    if (t == null) return { label: 'LATER', order: 9999, daysAway: null };
    var today = startOfDay(nowTs);
    var that = startOfDay(t);
    var diff = Math.round((that - today) / DAY_MS);
    if (diff < -1) return { label: 'EARLIER', order: -100 + Math.max(diff, -99), daysAway: diff };
    if (diff === -1) return { label: 'YESTERDAY', order: -1, daysAway: -1 };
    if (diff === 0) return { label: 'TODAY', order: 0, daysAway: 0 };
    if (diff <= 6) return { label: WEEKDAYS[new Date(that).getDay()], order: diff, daysAway: diff };
    return { label: 'LATER', order: 1000, daysAway: diff };
  }

  /* ---------- Time formatting ---------- */
  // TV Time style: months / days / hours, month = 30 days.
  function fmtTvTime(totalMinutes) {
    var m = Math.max(0, Math.round(totalMinutes));
    var months = Math.floor(m / (30 * 24 * 60));
    m -= months * 30 * 24 * 60;
    var days = Math.floor(m / (24 * 60));
    m -= days * 24 * 60;
    var hours = Math.floor(m / 60);
    return { months: months, days: days, hours: hours };
  }

  function fmtRuntime(min) {
    if (!min || min <= 0) return '';
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h === 0) return m + 'm';
    if (m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  }

  function fmtNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------- HTML escaping ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function padSE(n) { return ('0' + n).slice(-2); }
  function seLabel(s, e) { return 'S' + padSE(s) + ' | E' + padSE(e); }

  /* ---------- Import source detection ---------- */

  // Sniffs which service a CSV export came from by its header signature.
  function detectSource(headers) {
    var h = headers.map(function (x) { return String(x).trim().toLowerCase(); });
    if (h.indexOf('letterboxd uri') !== -1) return 'letterboxd';
    if (h.indexOf('const') !== -1 && h.indexOf('title type') !== -1) return 'imdb';
    if (h.length === 2 && h.indexOf('title') !== -1 && h.indexOf('date') !== -1) return 'netflix';
    if (h.some(function (x) { return /tv[_ ]?show[_ ]?name/.test(x); })) return 'tvtime';
    return 'generic';
  }

  // Netflix viewing activity titles look like:
  //   "Dark: Season 1: Secrets"
  //   "The Queen's Gambit: Limited Series: Openings"
  //   "Money Heist: Part 1: Episode 1"
  //   "Oppenheimer"                       (a film: no season segment)
  // Returns {show, season, epName} for episodes or {film} otherwise.
  var SEASON_SEG = /^(season|series|part|volume|book|chapter)\s+(\d+)$/i;
  var LIMITED_SEG = /^(limited series|miniseries|mini-series)$/i;
  function parseNetflixTitle(title) {
    var segs = String(title).split(': ');
    if (segs.length < 3) return { film: title };
    for (var i = 1; i < segs.length - 1; i++) {
      var m = segs[i].match(SEASON_SEG);
      if (m) {
        return {
          show: segs.slice(0, i).join(': '),
          season: parseInt(m[2], 10),
          epName: segs.slice(i + 1).join(': ')
        };
      }
      if (LIMITED_SEG.test(segs[i])) {
        return {
          show: segs.slice(0, i).join(': '),
          season: 1,
          epName: segs.slice(i + 1).join(': ')
        };
      }
    }
    return { film: title };
  }

export {
  parseCSV, guessColumns, detectSource, parseNetflixTitle,
  normName, similarity, parseDateFlexible, dayGroup,
  fmtTvTime, fmtRuntime, fmtNumber, fmtDate, esc, seLabel, DAY_MS
};
