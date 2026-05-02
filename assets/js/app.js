/* Built: 2026-03-19T14:12:40.717Z */
/* Built: 2026-03-11T14:06:51.089Z */
'use strict';
try { window.__CSPSR_BUILD_ID = 'langfix_v22_2026-04-30'; } catch (e) {}
/* ColorSource Production Suite v6.0.2 â€” ES5 compatible, no optional chaining */

// Hard reset client-side caches on plugin version change (handles offline-sync localStorage cache and stale UI text).
try {
  var __v = (window.CSPSR_CONFIG && window.CSPSR_CONFIG.version) ? String(window.CSPSR_CONFIG.version) : '';
  var __last = localStorage.getItem('cspsr_last_version') || '';
  if (__v && __last !== __v) {
    ['cspsr_offline_queue_v1','cspsr_offline_cache_v1','cspsr_offline_meta_v1','cspsr_boot_error','cspsr_bootstrap_cache'].forEach(function(k){
      try { localStorage.removeItem(k); } catch(_eK) {}
    });
    localStorage.setItem('cspsr_last_version', __v);
  }
} catch(_eV) {}

var _React    = React;
var useState  = _React.useState;
var useEffect = _React.useEffect;
var useRef    = _React.useRef;
var useCallback = _React.useCallback;
var createContext = _React.createContext;
var useContext = _React.useContext;
var h = React.createElement;

/* â”€â”€ Helpers â”€â”€ */
function g(obj, key) { return obj && obj[key] != null ? obj[key] : undefined; }
function gd(obj, key, def) { var v = g(obj, key); return v != null ? v : def; }
function asArr(v) { return Array.isArray(v) ? v : []; }
function getCust(o, lang) {
  if (!o) return '--';
  if (lang === 'en') {
    return (o.customer_company_name_en || o.company_name_en || o.customer_name_en || o.customer_company_name || o.company_name || o.customer_name) || '--';
  }
  return (o.customer_company_name || o.company_name || o.customer_name) || '--';
}
function getRec(o)  { return (o && (o.recipient_name || o.delivery_address)) || '--'; }
function toH(v) { return parseFloat(v) || 0; }
function fmtMin(m) {
  m = Math.round(m || 0);
  if (m <= 0) return '0 min';
  if (m < 60) return m + ' min';
  var h = Math.floor(m/60), rem = m%60;
  return rem > 0 ? h+'h '+rem+'m' : h+'h';
}
function fmtDaysMin(m, lang) {
  m = Math.round(m || 0);
  if (m <= 0) return lang === 'en' ? '0 min' : '0 د';
  var days = Math.floor(m / 1440);
  var rem = m % 1440;
  var hrs = Math.floor(rem / 60);
  var mins = rem % 60;
  var parts = [];
  if (lang === 'en') {
    if (days) parts.push(days + 'd');
    if (hrs) parts.push(hrs + 'h');
    if (mins) parts.push(mins + 'm');
    return parts.join(' ') || '0 min';
  }
  if (days) parts.push(days + ' يوم');
  if (hrs) parts.push(hrs + ' س');
  if (mins) parts.push(mins + ' د');
  return parts.join(' ') || '0 د';
}
function looksBrokenText(v) {
  if (v == null) return false;
  var s = String(v);
  // NOTE: "â" mojibake sequences (â€” âœ… âš…) are handled by the explicit map in `repairText`.
  // Treating "â" as a generic byte-mojibake marker can cause over-decoding and corrupt UI labels.
  return /[ØÙÃð]/.test(s) || s.indexOf('\uFFFD') >= 0;
}
function repairText(v) {
  if (v == null) return v;
  var s = String(v);
  // Normalize common invisible characters that can break matching.
  s = s.replace(/\u00A0/g, ' ');
  function __cspsr_tryDecodeUtf8BytesSegment(seg) {
    try {
      if (typeof TextDecoder === 'undefined') return null;
      // Reverse Windows-1252 mapping for bytes 0x80-0x9F (which become codepoints > 0xFF).
      var cp1252Reverse = {
        0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
        0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E,
        0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
        0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
      };
      var bytes = [];
      for (var bi = 0; bi < seg.length; bi++) {
        var cc = seg.charCodeAt(bi);
        if (cc <= 0xFF) bytes.push(cc);
        else if (cp1252Reverse[cc] != null) bytes.push(cp1252Reverse[cc]);
        else return null;
      }
      if (!bytes.length) return null;
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch (_e) { return null; }
  }
  var map = {
    // Specific mixed mojibake seen in KDS empty-state on some browsers/fonts.
    'Ù„ا توجد ط�„بات':'لا توجد طلبات',
    'â€”':'—','Ã—':'×','âœ•':'✕','â†‘':'↑','â†“':'↓','â†•':'↕','â†':'←','â†’':'→','â€¹':'‹','â€º':'›','â–¶':'▶','â¸':'⏸','âœ“':'✓','Â·':'·','Â':'',
    'ðŸ”':'🔍','ðŸ“¦':'📦','ðŸ‘¤':'👤','ðŸ‘¥':'👥','ðŸ“ž':'📞','ðŸ“':'📍','ðŸ’¾':'💾','ðŸšš':'🚚','ðŸ”´':'🔴','ðŸ¥‡':'🥇','ðŸ“Š':'📊',
    'ðŸ“…':'🗓','ðŸ—“':'🗓','ðŸ”—':'🔗','ðŸ”§':'🔧','ðŸ””':'🔔','ðŸ› ':'🛠','ðŸ“ˆ':'📈','ðŸ“‰':'📉','âœ¨':'✨','âœ…':'✅','âš ï¸':'⚠️','âš ':'⚠',
    'SRCSearch':'Search','SRC':'','â€Ž':'','â€':'','ØŒ':'،','Ø¡':'ء','Ø§Ù„':'ال','Ùˆ':'و',
    '(Ø¹Ø±Ø¨ÙŠ)':'(AR)','Ø¹Ø±Ø¨ÙŠ':'AR','â–²':'▲','â–¼':'▼','âš™':'⚙','âœŽ':'✎'
  };
  Object.keys(map).forEach(function(key){ s = s.split(key).join(map[key]); });

  // Mixed strings sometimes contain real Arabic characters plus mojibake byte-runs (e.g. "... (ÙƒÙ„ ...)" inside Arabic UI).
  // Decode only the byte-run segments to avoid bailing out when non-byte codepoints are present.
  if (/[ØÙÃð]/.test(s)) {
    s = s.replace(/[ØÙÃð][\x00-\x7F\x80-\xFF\u0080-\u00FF]{1,}/g, function (seg) {
      var decoded = __cspsr_tryDecodeUtf8BytesSegment(seg);
      return decoded && decoded !== seg ? decoded : seg;
    });
  }

  if (looksBrokenText(s)) {
    for (var i = 0; i < 2; i++) {
      try {
        // Best-effort mojibake repair:
        // Decode text that was originally UTF-8 bytes, mis-decoded as Windows-1252/Latin1.
        // Example patterns: "Ø§Ù„..." or "ðŸ…”".
        var decoded = '';
        try {
          if (typeof TextDecoder !== 'undefined') {
            // Reverse Windows-1252 mapping for bytes 0x80-0x9F (which become codepoints > 0xFF).
            var cp1252Reverse = {
              0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
              0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E,
              0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
              0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
            };
            var bytes = [];
            for (var bi = 0; bi < s.length; bi++) {
              var cc = s.charCodeAt(bi);
              if (cc <= 0xFF) {
                bytes.push(cc);
              } else if (cp1252Reverse[cc] != null) {
                bytes.push(cp1252Reverse[cc]);
              } else {
                // If we hit non-cp1252 chars, stop attempting this strategy.
                bytes = null;
                break;
              }
            }
            if (bytes && bytes.length) {
              decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
            }
          }
        } catch (_e_td) {}
        // Fallback: legacy escape/decodeURIComponent trick (works for true Latin1-only sequences).
        // Only attempt this when the string still looks like real byte-mojibake (Ø/Ù/Ã/ð/� patterns).
        if (!decoded && (/[ØÙÃð]/.test(s) || s.indexOf('\uFFFD') >= 0)) decoded = decodeURIComponent(escape(s));
        if (!decoded || decoded === s) break;
        s = decoded;
      } catch (e) { break; }
    }
  }
  s = s.replace(/^SRC(?=[A-Za-z\u0600-\u06FF])/, '');
  // Remove a few leading mojibake markers (but do NOT strip "â" which can be legitimate UI punctuation after mapping).
  s = s.replace(/^\s*[ÃðØÙ]{1,4}(?=[A-Za-z\u0600-\u06FF])/, '');
  s = s.replace(/SRC(?=Search)/g, '');
  s = s.replace(/ðŸ[^ ]*/g, function(m){ return map[m] || ''; });
  s = s.replace(/\s{2,}/g,' ').trim();
  return s;
}
function deepRepairStrings(value) {
  if (value == null) return value;
  if (typeof value === 'string') return repairText(value);
  if (Array.isArray(value)) return value.map(deepRepairStrings);
  if (typeof value === 'object') {
    var out = {};
    Object.keys(value).forEach(function(k){ out[k] = deepRepairStrings(value[k]); });
    return out;
  }
  return value;
}

// Repairs only strings that look like mojibake/garbled text (safe for API payloads).
function deepRepairBrokenStrings(value) {
  if (value == null) return value;
  if (typeof value === 'string') return looksBrokenText(value) ? repairText(value) : value;
  if (Array.isArray(value)) return value.map(deepRepairBrokenStrings);
  if (typeof value === 'object') {
    var out = Array.isArray(value) ? [] : {};
    Object.keys(value).forEach(function(k){ out[k] = deepRepairBrokenStrings(value[k]); });
    return out;
  }
  return value;
}

// Auto-repair mojibake Arabic literals in JSX children even when they are not passed through `t()`.
// This keeps hardcoded bilingual strings readable without having to touch every render callsite.
try {
  var __cspsr_h0 = h;
  var __cspsr_repair_child = function (child) {
    if (child == null) return child;
    if (typeof child === 'string') return looksBrokenText(child) ? repairText(child) : child;
    if (Array.isArray(child)) return child.map(__cspsr_repair_child);
    return child;
  };
  var __cspsr_repair_props = function (props) {
    if (!props || typeof props !== 'object') return props;
    var next = props;
    Object.keys(props).forEach(function (k) {
      if (k === 'style' || k === 'dangerouslySetInnerHTML' || k === '__html') return;
      var v = props[k];
      if (typeof v === 'string') {
        if (looksBrokenText(v)) {
          if (next === props) next = Object.assign({}, props);
          next[k] = repairText(v);
        }
        return;
      }
      if (Array.isArray(v) || (v && typeof v === 'object')) {
        // Repair nested option labels, column headers, etc., but only when they contain broken strings.
        var repaired = deepRepairBrokenStrings(v);
        if (repaired !== v) {
          if (next === props) next = Object.assign({}, props);
          next[k] = repaired;
        }
      }
    });
    return next;
  };
  h = function (type, props) {
    props = __cspsr_repair_props(props);
    var args = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < args.length; i++) args[i] = __cspsr_repair_child(args[i]);
    return __cspsr_h0.apply(null, [type, props].concat(args));
  };
} catch (_e_cspsr_h) {}
function safeTranslated(dictKey, lang, arg) {
  var dict = I18N[lang] || I18N.ar || {};
  var fallback = I18N.en || {};
  var val = dict[dictKey];
  if (val == null && fallback[dictKey] != null) val = fallback[dictKey];
  if (val == null && I18N.ar && I18N.ar[dictKey] != null) val = I18N.ar[dictKey];
  if (val == null) val = dictKey;
  val = typeof val === 'function' ? val(arg) : val;
  if (lang === 'ar' && (val == null || looksBrokenText(val)) && fallback[dictKey] != null) {
    val = typeof fallback[dictKey] === 'function' ? fallback[dictKey](arg) : fallback[dictKey];
  }
  return repairText(val);
}

// Bilingual helper for legacy hardcoded strings.
// Ensures Arabic text is repaired when the source contains mojibake (e.g. "Ù„Ø§ ØªÙˆØ¬Ø¯ ...").
function tr(lang, en, ar) {
  return (lang === 'en') ? en : repairText(ar);
}
function externalExpectedStepMins(step) {
  var metrics = step && step.external_metrics ? step.external_metrics : {};
  var promised = parseInt(metrics.promised_duration_minutes, 10) || 0;
  if (promised > 0) return promised;
  var direct = Math.round((parseFloat(step && step.expected_duration_minutes)||0));
  if (direct > 0) return direct;
  if (step && step.ext_send_at && step.ext_receive_expected) {
    var from = parseServerDate(step.ext_send_at);
    var to = parseServerDate(step.ext_receive_expected);
    if (from && to) {
      var mins = Math.round((to.getTime() - from.getTime()) / 60000);
      if (mins > 0) return mins;
    }
  }
  var hrs = parseFloat(step && step.expected_hours) || 0;
  return hrs > 0 ? Math.round(hrs * 60) : 0;
}
function stepExpectedStepMins(step, item, productSteps) {
  if (!step) return 0;
  if (parseInt(step.is_external,10) === 1) return externalExpectedStepMins(step);
  if (isDeliveryStep(step)) {
    var dhrs = parseFloat(step.expected_hours) || 0;
    return dhrs > 0 ? Math.round(dhrs * 60) : 0;
  }
  var stepNameNorm = (step.step_name||'').toLowerCase().trim();
  if (item && item.product_id) {
    var ps = asArr(productSteps||[]).filter(function(p){
      return p.product_id == item.product_id &&
        (p.step_name||'').toLowerCase().trim() === stepNameNorm;
    })[0];
    if (ps) {
      var qty = parseFloat(item.quantity)||1;
      var qpu = Math.max(1, parseInt(ps.qty_per_unit)||1);
      var scale = qty / qpu;
      if (!(scale > 0)) scale = 1;
      return Math.round(((parseFloat(ps.expected_hours)||0) * 60) * scale);
    }
  }
  var hrs = parseFloat(step.expected_hours) || 0;
  var mins = hrs > 0 ? Math.round(hrs * 60) : 0;
  return mins > 0 ? mins : 0;
}
function orderExpectedMins(order, productSteps) {
  var total = 0;
  asArr(order && order.items).forEach(function(item){
    asArr(item.steps).forEach(function(step){
      if (isDeliveryStep(step)) return;
      total += stepExpectedStepMins(step, item, productSteps);
    });
  });
  return Math.round(total);
}
var cspsrStepExpectedMins = stepExpectedStepMins;
var cspsrOrderExpectedMins = orderExpectedMins;
var stepExpectedMins = cspsrStepExpectedMins;
var orderExpectedMinsGlobal = cspsrOrderExpectedMins;
if (typeof window !== 'undefined') {
  window.cspsrStepExpectedMins = cspsrStepExpectedMins;
  window.cspsrOrderExpectedMins = cspsrOrderExpectedMins;
}
function fmtH(v) {
  var h2 = toH(v); if (!h2) return '0h';
  var abs = Math.abs(h2);
  var hrs = Math.floor(abs), mins = Math.round((abs - hrs) * 60);
  var str = hrs ? (hrs + 'h' + (mins ? ' ' + mins + 'm' : '')) : (mins + 'm');
  return h2 < 0 ? '-' + str : str;
}
function progOf(o) {
  var all = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
  if (!all.length) return 0;
  var done = all.filter(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; }).length;
  return Math.round(done / all.length * 100);
}
function isDone(o) { return o && (o.is_done == 1 || ['done','completed','cancelled'].indexOf(o.status_slug) >= 0); }
function isOpsTaskCompleted(task) {
  if (!task) return false;
  var v = String(task.completed_at || '').trim();
  return !!v && v !== '0000-00-00 00:00:00';
}
function isDeliveryStep(s) {
  if (s.is_delivery == 1) return true;
  var n = (s.step_name||'').toLowerCase();
  return n.indexOf('deliver') >= 0 || n.indexOf('\u062a\u0648\u0635\u064a\u0644') >= 0 || n.indexOf('\u062a\u0633\u0644\u064a\u0645') >= 0;
}
function deliveryDirectionOf(step) {
  var raw = String(step && (step.delivery_direction || step.delivery_mode || '') || '').toLowerCase().trim();
  if (raw === 'received_by_client' || raw === 'received' || raw === 'receive') return 'received_by_client';
  return 'delivered_to_client';
}
function deliveryDirectionMeta(direction, lang) {
  var isReceived = deliveryDirectionOf({delivery_direction: direction}) === 'received_by_client';
  return {
    key: isReceived ? 'received_by_client' : 'delivered_to_client',
    title: lang==='en'
      ? (isReceived ? 'Confirm Receipt by Client' : 'Confirm Delivery to Client')
      : (isReceived ? 'تأكيد الاستلام من الزبون' : 'تأكيد التسليم للزبون'),
    body: lang==='en'
      ? (isReceived ? 'Did the client receive this item?' : 'Did you deliver this item to the client?')
      : (isReceived ? 'هل استلم الزبون هذا المنتج؟' : 'هل قمت بتسليم هذا المنتج للزبون؟'),
    action: lang==='en'
      ? (isReceived ? 'OK - Mark as Received' : 'OK - Mark as Delivered')
      : (isReceived ? 'حفظ كاستلام' : 'حفظ كتسليم')
  };
}
function itemProductionDone(item) {
  var steps = asArr(item.steps);
  var prodSteps = steps.filter(function(s){ return !isDeliveryStep(s); });
  if (prodSteps.length === 0) return true;
  return prodSteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
}
function itemDelivered(item) {
  /* Truly delivered = delivery step completed OR explicitly marked delivered */
  if (item.is_delivered == 1) return true;
  var steps = asArr(item.steps);
  var deliverySteps = steps.filter(isDeliveryStep);
  if (deliverySteps.length === 0) return false;
  return deliverySteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
}
function itemReadyForDelivery(item) {
  /* Ready = production done OR flagged as ready */
  return item.is_ready_for_delivery == 1 || itemProductionDone(item);
}
function orderAtDelivery(o) {
  var allSteps = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
  if (allSteps.length === 0) return false;
  var prodSteps = allSteps.filter(function(s){ return !isDeliveryStep(s); });
  var deliverySteps = allSteps.filter(isDeliveryStep);
  var prodAllDone = prodSteps.length === 0 || prodSteps.every(function(s){
    return s.status_slug === 'done' || s.status_slug === 'completed';
  });
  if (!prodAllDone) return false;
  if (deliverySteps.length > 0) {
    var deliveryAllDone = deliverySteps.every(function(s){
      return s.status_slug === 'done' || s.status_slug === 'completed';
    });
    return !deliveryAllDone;
  }
  return true;
}
function findBy(arr, key, val) {
  var r = asArr(arr).filter(function(x){ return x[key] == val; });
  return r.length ? r[0] : null;
}

/* Mandatory alert sounds (distinct patterns per event) */
function playBellPatternLoud(pattern, repeatCount) {
  repeatCount = Math.max(1, parseInt(repeatCount, 10) || 4);
  var played = false;
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      var ctx = new AudioCtx();
      if (ctx.state === 'suspended' && ctx.resume) {
        try { ctx.resume(); } catch (_e1) {}
      }
      var now = ctx.currentTime;
      for (var i = 0; i < repeatCount; i++) {
        var t = now + (i * 0.55);
        var osc1 = ctx.createOscillator();
        var osc2 = ctx.createOscillator();
        var gain = ctx.createGain();
        var p = pattern || 'new_order';
        if (p === 'delivery_ready') {
          osc1.type = 'sawtooth';
          osc2.type = 'square';
          osc1.frequency.setValueAtTime(1560, t);
          osc2.frequency.setValueAtTime(1040, t);
        } else {
          osc1.type = 'square';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(1260, t);
          osc2.frequency.setValueAtTime(840, t);
        }
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.9, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.3);
        osc2.stop(t + 0.3);
      }
      played = true;
    }
  } catch (_e2) {}
  if (!played) {
    try {
      var a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      a.volume = 1;
      var n = 0;
      function ping() {
        if (n >= repeatCount) return;
        n++;
        try { a.currentTime = 0; a.play(); } catch (_e3) {}
        setTimeout(ping, pattern === 'delivery_ready' ? 430 : 550);
      }
      ping();
    } catch (_e4) {}
  }
}

function getNewOrderTonePref() {
  try {
    var v = localStorage.getItem('cspsr_new_order_tone');
    if (!v) return 'classic';
    return String(v);
  } catch (_e0) {
    return 'classic';
  }
}

function setNewOrderTonePref(v) {
  try { localStorage.setItem('cspsr_new_order_tone', String(v || 'classic')); } catch (_e0) {}
}

function getNewOrderCustomToneUrl() {
  try { return String(localStorage.getItem('cspsr_new_order_custom_url') || '').trim(); } catch (_e0) { return ''; }
}

function setNewOrderCustomToneUrl(url) {
  try { localStorage.setItem('cspsr_new_order_custom_url', String(url || '').trim()); } catch (_e0) {}
}

function playCustomAudioUrl(url) {
  try {
    url = String(url || '').trim();
    if (!url) return false;
    var a = new Audio(url);
    a.volume = 1;
    var p = a.play();
    if (p && typeof p.catch === 'function') p.catch(function(){});
    return true;
  } catch (_e0) {
    return false;
  }
}

function playNewOrderToneByPref() {
  var tone = getNewOrderTonePref();
  if (tone === 'off') return;
  if (tone === 'custom') {
    var url = getNewOrderCustomToneUrl();
    if (!playCustomAudioUrl(url)) playBellPatternLoud('new_order', 3);
    return;
  }
  if (tone === 'school') {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        var ctx = new AudioCtx();
        if (ctx.state === 'suspended' && ctx.resume) {
          try { ctx.resume(); } catch (_eR) {}
        }
        var now = ctx.currentTime;
        for (var i = 0; i < 6; i++) {
          var t = now + (i * 0.33);
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime((i % 2 === 0) ? 880 : 740, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.85, t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.26);
        }
        return;
      }
    } catch (_eSchool) {}
    playBellPatternLoud('delivery_ready', 6);
    return;
  }
  if (tone === 'soft') {
    playBellPatternLoud('new_order', 2);
    return;
  }
  if (tone === 'cafe') {
    playBellPatternLoud('delivery_ready', 5);
    return;
  }
  playBellPatternLoud('new_order', 4);
}

function notifyMandatoryEvent(kind, title, body) {
  var opts = arguments.length > 3 ? arguments[3] : null;
  if (kind === 'new_order' || kind === 'delivery_ready') {
    try {
      if (opts && opts.sound) {
        var s = String(opts.sound||'');
        var url = String(opts.sound_url||'');
        if (s === 'off') {}
        else if (s === 'custom') { if (!playCustomAudioUrl(url)) playBellPatternLoud(kind, 3); }
        else if (s === 'school') {
          // Reuse existing school bell generator.
          try {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              var ctx = new AudioCtx();
              if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (_eR) {} }
              var now = ctx.currentTime;
              for (var i = 0; i < 6; i++) {
                var t = now + (i * 0.33);
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime((i % 2 === 0) ? 880 : 740, t);
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.85, t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.26);
              }
              setTimeout(function(){ try{ ctx.close && ctx.close(); } catch(_eC){} }, 2500);
            } else {
              playBellPatternLoud(kind, 3);
            }
          } catch(_eToneSchool) { playBellPatternLoud(kind, 3); }
        } else {
          playBellPatternLoud(kind, 3);
        }
      } else {
        playNewOrderToneByPref();
      }
    } catch (_eTone0) {}
  }
  var shownSystem = false;
  try {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch(_e01) {}
      }
      if (Notification.permission === 'granted') {
        new Notification(title, { body: body || '', requireInteraction:true, silent:false });
        shownSystem = true;
      }
    }
  } catch (_e1) {}
  try {
    // Fallback only when OS/browser blocks system notifications.
    if (!shownSystem) alert(title + (body ? '\n\n' + body : ''));
  } catch (_e2) {}
}

function notifyWindowsOnly(title, body, tag) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      try {
        Notification.requestPermission().then(function(p){
          if (p === 'granted') {
            try { new Notification(title, { body: body || '', tag: tag || '', silent:false }); } catch(_e2) {}
          }
        });
      } catch(_e0) {}
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body: body || '', tag: tag || '', silent:false });
    }
  } catch (_e1) {}
}

/* â”€â”€ Design tokens â”€â”€ */
var T = {
  bg:'#ffffff', bgSub:'#f6f8fa', border:'#e3e8ef', borderDark:'#c8d0da',
  text:'#0d1117', textMid:'#424d57', textMute:'#7a8694',
  accent:'#635bff', accentDim:'#ede9ff', accentBg:'#ede9ff',
  green:'#09825d', greenBg:'#d3f5e9',
  red:'#c0123c', redBg:'#ffe0e8',
  amber:'#b54708', amberBg:'#fef3c7',
  blue:'#0055d4', blueBg:'#dbeafe',
  sidebar:'#0d1117', sidebarHov:'#161b22',
  sidebarTxt:'#c9d1d9', sidebarMut:'#484f58',
  radius:'8px', radiusLg:'12px',
  shadow:'0 1px 3px rgba(0,0,0,.08)',
  shadowLg:'0 12px 40px rgba(0,0,0,.15)',
};

/* â”€â”€ Layout helpers â”€â”€ */
function startOf(isRtl) { return isRtl ? 'right' : 'left'; }
function endOf(isRtl)   { return isRtl ? 'left' : 'right'; }


var I18N = {
  ar:{
    dashboard:'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…',orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª',completed_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©',
    customers:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',products:'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',suppliers:'Ø§Ù„Ù…Ø¬Ù‡Ø²ÙˆÙ†',product_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…Ù†ØªØ¬',product_workflow:'Ø³ÙŠØ± Ø¹Ù…Ù„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',workflow:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',workflow_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬',step_library:'Ù…ÙƒØªØ¨Ø© Ø§Ù„Ø®Ø·ÙˆØ§Øª',step_library_hint:'Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ© Ø¨ÙŠÙ† Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',pick_from_library:'Ø§Ø®ØªØ± Ù…Ù† Ø§Ù„Ù…ÙƒØªØ¨Ø©',default_minutes:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ (Ø¯Ù‚ÙŠÙ‚Ø©)',expected_min:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ (Ø¯Ù‚ÙŠÙ‚Ø©)',expected_total:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ',est_completion:'Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…ØªÙˆÙ‚Ø¹',queue_pos:'Ø§Ù„ØªØ±ØªÙŠØ¨',actual_time:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ',time_diff:'Ø§Ù„ÙØ±Ù‚',on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ahead:'Ø£Ø³Ø±Ø¹',late:'Ù…ØªØ£Ø®Ø±',delay_reason_title:'ØªØ£Ø®ÙŠØ± ÙÙŠ Ø§Ù„ØªØ³Ù„ÙŠÙ…',order_recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†',add_recipient:'Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù…',no_recipient_warn:'ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù… ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„',no_deadline_warn:'ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¯ÙŠØ¯ Ù„Ø§ÙŠÙ†',recipient_added:'ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø³ØªÙ„Ù…',select_recipient:'Ø§Ø®ØªØ± Ù…Ø³ØªÙ„Ù…Ø§Ù‹',delay_reason_prompt:'Ø§Ù„Ø·Ù„Ø¨ ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø¯ÙŠØ¯ Ù„Ø§ÙŠÙ†. ÙŠØ±Ø¬Ù‰ Ø°ÙƒØ± Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ±:',delay_reason_placeholder:'Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ±...',delay_submit:'ØªØ£ÙƒÙŠØ¯',delay_skip:'ØªØ®Ø·ÙŠ',expected_time:'Ø§Ù„ÙˆÙ‚Øª Ù„ÙƒÙ„ ÙˆØ­Ø¯Ø©',actual_min:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ',time_unit:'Ø§Ù„ÙˆØ­Ø¯Ø©',minutes:'Ø¯Ù‚ÙŠÙ‚Ø©',hours_unit:'Ø³Ø§Ø¹Ø©',time_diff:'Ø§Ù„ÙØ±Ù‚',on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ahead:'Ø£Ø³Ø±Ø¹',late:'Ù…ØªØ£Ø®Ø±',contact_person:'Ø´Ø®Øµ Ø§Ù„ØªÙˆØ§ØµÙ„',contact_name:'Ø§Ù„Ø§Ø³Ù…',contact_phone:'Ø§Ù„Ù‡Ø§ØªÙ',contact_email:'Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„',contact_map:'Ø±Ø§Ø¨Ø· Ø§Ù„Ø®Ø±ÙŠØ·Ø©',contact_address:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',temp_contact:'Ù…Ø³ØªÙ„Ù… Ù…Ø¤Ù‚Øª',temp_recipient_lbl:'Ù…Ø³ØªÙ„Ù… Ù…Ø¤Ù‚Øª',
    steps:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',my_tasks:'Ù…Ù‡Ø§Ù…ÙŠ',external_tasks:'Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ©',
    roles:'Ø§Ù„Ø£Ø¯ÙˆØ§Ø±',departments:'Ø§Ù„Ø£Ù‚Ø³Ø§Ù…',teams:'Ø§Ù„ÙØ±Ù‚',
    employees:'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†',statuses:'Ø§Ù„Ø­Ø§Ù„Ø§Øª',notifications:'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª',kds:'Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',users_mgmt:'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†',
    add:'Ø¥Ø¶Ø§ÙØ©',edit:'ØªØ¹Ø¯ÙŠÙ„',delete:'Ø­Ø°Ù',save:'Ø­ÙØ¸',cancel:'Ø¥Ù„ØºØ§Ø¡',
    confirm_delete:'Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ø­Ø°ÙØŸ',
    name:'Ø§Ù„Ø§Ø³Ù…',phone:'Ø§Ù„Ù‡Ø§ØªÙ',address:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',notes:'Ù…Ù„Ø§Ø­Ø¸Ø§Øª',color:'Ø§Ù„Ù„ÙˆÙ†',
    order_number:'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨',customer:'Ø§Ù„Ø¹Ù…ÙŠÙ„',recipient:'Ø§Ù„Ù…Ø³ØªÙ„Ù…',
    deadline:'Ù…ÙˆØ¹Ø¯ ØªØ³Ù„ÙŠÙ… Ø§Ù„Ø²Ø¨ÙˆÙ†',priority:'Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©',status:'Ø§Ù„Ø­Ø§Ù„Ø©',
    expected_hours:'Ø³Ø§Ø¹Ø§Øª Ù…ØªÙˆÙ‚Ø¹Ø©',actual_hours:'Ø³Ø§Ø¹Ø§Øª ÙØ¹Ù„ÙŠØ©',
    in_progress:'Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°',pending:'Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',done:'Ù…ÙƒØªÙ…Ù„',ready:'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªØ³Ù„ÙŠÙ…',
    no_data:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª',search:'Ø¨Ø­Ø«',company:'Ø§Ù„Ø´Ø±ÙƒØ©',map:'Ø§Ù„Ø®Ø±ÙŠØ·Ø©',print:'Ø·Ø¨Ø§Ø¹Ø©',
    quantity:'Ø§Ù„ÙƒÙ…ÙŠØ©',product:'Ø§Ù„Ù…Ù†ØªØ¬',employee:'Ø§Ù„Ù…ÙˆØ¸Ù',team:'Ø§Ù„ÙØ±ÙŠÙ‚',role:'Ø§Ù„Ø¯ÙˆØ±',department:'Ø§Ù„Ù‚Ø³Ù…',
    new_order:'Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯',add_item:'Ø¥Ø¶Ø§ÙØ© Ø¹Ù†ØµØ±',
    delivery_address:'Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªØ³Ù„ÙŠÙ…',delivery_notes:'Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…',
    recipient_name:'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªÙ„Ù…',company_name:'Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©',
    active:'Ù†Ø´Ø·',inactive:'ØºÙŠØ± Ù†Ø´Ø·',sku:'Ø±Ù‚Ù… Ø§Ù„Ù…Ù†ØªØ¬',
    step_name:'Ø§Ø³Ù… Ø§Ù„Ø®Ø·ÙˆØ©',step_order:'Ø§Ù„ØªØ±ØªÙŠØ¨',
    recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†',temp_recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ† Ø§Ù„Ù…Ø¤Ù‚ØªÙˆÙ†',add_recipient:'Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù…',
    slug:'Ø§Ù„Ù…Ø¹Ø±Ù',sort_order:'Ø§Ù„ØªØ±ØªÙŠØ¨',is_done:'Ø­Ø§Ù„Ø© Ù…Ù†ØªÙ‡ÙŠØ©',
    description:'Ø§Ù„ÙˆØµÙ',estimated_hours:'Ø³Ø§Ø¹Ø§Øª ØªÙ‚Ø¯ÙŠØ±ÙŠØ©',
    phone_alt:'Ù‡Ø§ØªÙ Ø¨Ø¯ÙŠÙ„',map_url:'Ø±Ø§Ø¨Ø· Ø§Ù„Ø®Ø±ÙŠØ·Ø©',title:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',type:'Ø§Ù„Ù†ÙˆØ¹',
    send_notification:'Ø¥Ø±Ø³Ø§Ù„',browser_notifications:'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­',
    show_in_prds:'Ø¹Ø±Ø¶ ÙÙŠ KDS',is_external:'Ù…Ù‡Ù…Ø© Ø®Ø§Ø±Ø¬ÙŠØ©',
    /* extra */
    active_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø§Ø±ÙŠØ©',total_orders:'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø·Ù„Ø¨Ø§Øª',completed:'Ù…ÙƒØªÙ…Ù„Ø©',
    urgent:'Ø¹Ø§Ø¬Ù„',clients:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',progress:'Ø§Ù„ØªÙ‚Ø¯Ù…',date:'Ø§Ù„ØªØ§Ø±ÙŠØ®',
    completed_at:'Ø§ÙƒØªÙ…Ù„ ÙÙŠ',leader:'Ù‚Ø§Ø¦Ø¯',
    customer_lbl:'Ø§Ù„Ø¹Ù…ÙŠÙ„:',recipient_lbl:'Ø§Ù„Ù…Ø³ØªÙ„Ù…:',
    choose_recipient:'-- اختر المستلم --',choose_customer_first:'-- اختر العميل أولاً --',
    select_product:'-- اختر المنتج --',
    normal:'عادي',high:'عالي',low:'منخفض',
    yes:'Ù†Ø¹Ù…',no:'Ù„Ø§',active_status:'Ù†Ø´Ø·',stopped:'Ù…ØªÙˆÙ‚Ù',
    all_statuses:'ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª',all_steps_added:'ÙƒÙ„ Ø§Ù„Ø®Ø·ÙˆØ§Øª Ù…Ø¶Ø§ÙØ©',
    production_system:'Ù†Ø¸Ø§Ù… Ø§Ù„Ø¥Ù†ØªØ§Ø¬',
    setup_system:'Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù†Ø¸Ø§Ù…',
    system_name_title:'Ø§Ø³Ù… Ù†Ø¸Ø§Ù…Ùƒ',system_name_hint:'Ù‡Ø°Ø§ Ø§Ù„Ø§Ø³Ù… Ø³ÙŠØ¸Ù‡Ø± ÙÙŠ Ø¬Ù…ÙŠØ¹ Ø£Ø¬Ø²Ø§Ø¡ Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±.',
    logo_title:'شعار الشركة',logo_hint:'ارفع شعار شركتك - PNG شفاف أو SVG هو الأنسب.',
    drag_logo:'اسحب الشعار هنا أو اضغط للرفع',logo_formats:'PNG - SVG - JPG - WEBP',
    setup_done:'Ø£Ù†Øª Ø¬Ø§Ù‡Ø² ØªÙ…Ø§Ù…Ø§Ù‹!',setup_success:'ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ù†Ø¬Ø§Ø­:',
    enter_system:'الدخول إلى النظام',next:'التالي',skip:'تخطي',
    saving:'جاري الحفظ...',save_continue:'حفظ والمتابعة',
    name_required:'Ø§Ø³Ù… Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø·Ù„ÙˆØ¨',system_name_placeholder:'Ù…Ø«Ø§Ù„: Ù…Ø·Ø¨Ø¹Ø© Ø§Ù„Ù†Ø¬Ù… Ø§Ù„Ø±Ù‚Ù…ÙŠØ©',
    no_active_orders:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø¬Ø§Ø±ÙŠØ©',full_name:'Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„',order_number_lbl:'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨',order_items_lbl:'Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø·Ù„Ø¨',steps_lbl:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',high_priority:'Ø£ÙˆÙ„ÙˆÙŠØ© Ø¹Ø§Ù„ÙŠØ©',completed_lbl:'Ù…ÙƒØªÙ…Ù„',sort_order_lbl:'Ø§Ù„ØªØ±ØªÙŠØ¨',is_final_lbl:'Ù…Ù†ØªÙ‡ÙŠØ©',expected_lbl:'Ù…ØªÙˆÙ‚Ø¹',actual_lbl:'ÙØ¹Ù„ÙŠ',login_username:'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…',login_password:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',login_subtitle:'Ù†Ø¸Ø§Ù… Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',login_required:'Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',login_error:'Ø®Ø·Ø£ ÙÙŠ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„',link_emp_label:'Ø±Ø¨Ø· Ø¨Ù…ÙˆØ¸Ù Ù…ÙˆØ¬ÙˆØ¯ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)',link_emp_placeholder:'Ø¥Ù†Ø´Ø§Ø¡ Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯',avatar_title:'ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø´Ø®ØµÙŠØ©',avatar_too_large:'Ø§Ù„ØµÙˆØ±Ø© ÙƒØ¨ÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹ØŒ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 2MB',avatar_error:'Ø®Ø·Ø£ ÙÙŠ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©',users_count:'Ù…Ø³ØªØ®Ø¯Ù…',role_admin_short:'Ù…Ø¯ÙŠØ±',role_user_short:'Ù…Ø³ØªØ®Ø¯Ù…',no_results_q:'Ù„Ø§ Ù†ØªØ§Ø¦Ø¬ Ù„Ù€',customer_lbl:'Ø§Ù„Ø¹Ù…ÙŠÙ„',recipient_lbl:'Ø§Ù„Ù…Ø³ØªÙ„Ù…',contact_persons:'Ø¬Ù‡Ø§Øª Ø§Ù„Ø§ØªØµØ§Ù„',contact_person_lbl:'Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø¹Ù† Ø§Ù„Ø·Ù„Ø¨',job_title:'Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ',add_contact:'Ø¥Ø¶Ø§ÙØ© Ø¬Ù‡Ø© Ø§ØªØµØ§Ù„',no_contacts:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù‡Ø§Øª Ø§ØªØµØ§Ù„',current_step_lbl:'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©',progress_lbl:'Ø§Ù„ØªÙ‚Ø¯Ù…',yes:'Ù†Ø¹Ù…',no:'Ù„Ø§',show_in_kds:'Ø¹Ø±Ø¶ ÙÙŠ KDS',external_task:'Ù…Ù‡Ù…Ø© Ø®Ø§Ø±Ø¬ÙŠØ©',is_delivery:'Ø®Ø·ÙˆØ© ØªÙˆØµÙŠÙ„',scales_with_qty:'ÙŠØªØ£Ø«Ø± Ø¨Ø§Ù„ÙƒÙ…ÙŠØ©',qty_per_unit:'Ù„ÙƒÙ„',unit_lbl:'ÙˆØ­Ø¯Ø©',inactive_lbl:'ØºÙŠØ± Ù†Ø´Ø·',login_btn:'Ø¯Ø®ÙˆÙ„',edit_order:'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨',order_preview_title:'Ø·Ù„Ø¨',notif_info:'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',notif_success:'Ù†Ø¬Ø§Ø­',notif_warning:'ØªØ­Ø°ÙŠØ±',notif_error:'Ø®Ø·Ø£',is_done_lbl:'Ù…Ù†ØªÙ‡ÙŠØ©',perm_sections:'Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„ØµÙØ­Ø§Øª',perm_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬',perm_save:'Ø­ÙØ¸ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª',perm_admin_full:'Ø§Ù„Ù…Ø¯ÙŠØ± ÙŠÙ…Ù„Ùƒ ÙˆØµÙˆÙ„Ø§Ù‹ ÙƒØ§Ù…Ù„Ø§Ù‹ Ø¨Ø¯ÙˆÙ† Ù‚ÙŠÙˆØ¯',perm_title:'ØµÙ„Ø§Ø­ÙŠØ§Øª',perm_view:'Ø¹Ø±Ø¶',perm_create:'Ø¥Ø¶Ø§ÙØ©',perm_edit:'ØªØ¹Ø¯ÙŠÙ„',perm_delete:'Ø­Ø°Ù',perm_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª',perm_customers:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',perm_products:'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',perm_employees:'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†',perm_kds:'Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',perm_delivery_orders:'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„',perm_reports:'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±',perm_settings:'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',settings:'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',perm_users:'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†',username_lbl:'Ø§Ø³Ù… Ø§Ù„Ø¯Ø®ÙˆÙ„ (username)',password_lbl:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',password_new:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© (Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ Ù„Ø¹Ø¯Ù… Ø§Ù„ØªØºÙŠÙŠØ±)',role_lbl:'Ø§Ù„Ø¯ÙˆØ±',role_admin:'Ù…Ø¯ÙŠØ± (ÙˆØµÙˆÙ„ ÙƒØ§Ù…Ù„)',role_user:'Ù…Ø³ØªØ®Ø¯Ù… (Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª)',dept_lbl:'Ø§Ù„Ù‚Ø³Ù…',no_dept:'-- Ø¨Ø¯ÙˆÙ† Ù‚Ø³Ù… --',status_lbl:'Ø§Ù„Ø­Ø§Ù„Ø©',active_lbl:'Ù†Ø´Ø·',stopped_lbl:'Ù…ÙˆÙ‚ÙˆÙ',new_user:'Ù…Ø³ØªØ®Ø¯Ù… Ø¬Ø¯ÙŠØ¯',edit_user:'ØªØ¹Ø¯ÙŠÙ„ Ù…Ø³ØªØ®Ø¯Ù…',no_results:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬',no_orders_done:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…ÙƒØªÙ…Ù„Ø© Ø¨Ø¹Ø¯',error:'Ø®Ø·Ø£',
    start:'بدء',complete_step:'إكمال',view:'عرض',return_to_order:'العودة للطلب',current_step:'الخطوة الحالية',stop_order:'إيقاف',force_complete:'إنهاء إجباري',confirm_stop:'هل تريد إيقاف هذا الطلب؟ سيتم وضعه كملغي.',confirm_force:'هل تريد إنهاء هذا الطلب إجبارياً؟ سيُعلَّم كمكتمل فوراً.',delete_blocked:'لا يمكن حذف طلب بدأ تنفيذه',
    start_btn:'Start',complete_btn:'Done',
    kds_subtitle:'ØªØ­Ø¯ÙŠØ« ÙƒÙ„ 30 Ø«Ø§Ù†ÙŠØ©',no_active_kds:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù†Ø´Ø·Ø© Ø­Ø§Ù„ÙŠØ§Ù‹',
    waiting:'Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',
    n_orders:function(n){ return n+' Ø·Ù„Ø¨'; },
    n_active:function(n){ return n+' Ø·Ù„Ø¨ Ù†Ø´Ø·'; },
    n_done:function(n){ return n+' Ø·Ù„Ø¨ Ù…ÙƒØªÙ…Ù„'; },
    n_tasks:function(n){ return n+' Ù…Ù‡Ù…Ø©'; },
    n_items:function(n){ return n+' Ø¹Ù†Ø§ØµØ±'; },
    n_clients:function(n){ return n+' Ø¹Ù…ÙŠÙ„'; },
    overview:'Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø­Ø§Ù„Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',
    workflow_hint:'ØªØ­Ø¯ÙŠØ¯ workflow Ù„ÙƒÙ„ Ù…Ù†ØªØ¬',
    send_notif_title:'Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø±',
    unread:function(n){ return n+' ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡'; },
    retry:'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©',ui_error:'Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©',
    loading:'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...',loading_data:'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...',
    switch_lang:'Switch to English',
    /* â”€â”€ Tasks group label â”€â”€ */
    tasks_label:'Ø§Ù„Ù…Ù‡Ø§Ù…',
    kds_interval_lbl:'ÙˆÙ‚Øª Ø§Ù„ØªØ¨Ø¯ÙŠÙ„ ÙÙŠ Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬ (Ø«Ø§Ù†ÙŠØ©)',
    kds_interval_hint:'Ø¹Ø¯Ø¯ Ø§Ù„Ø«ÙˆØ§Ù†ÙŠ Ø¨ÙŠÙ† ÙƒÙ„ ØµÙØ­Ø© ÙÙŠ Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¯ÙˆØ±ÙŠ Ø¹Ù„Ù‰ Ø§Ù„ØªÙ„ÙØ²ÙŠÙˆÙ†',
    delivery_orders:'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„',
    delivery_agent:'Ù…Ù†Ø¯ÙˆØ¨ Ø§Ù„ØªÙˆØµÙŠÙ„',
    no_delivery_orders:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª ØªÙˆØµÙŠÙ„ Ù…Ø³Ù†Ø¯Ø© Ø¥Ù„ÙŠÙƒ',
    /* â”€â”€ Operations Tasks â”€â”€ */
    operations_tasks:'Ù…Ù‡Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',operations_label:'Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',
    ops_task_no:'Ø±Ù‚Ù… Ø§Ù„Ù…Ù‡Ù…Ø©',ops_new_task:'Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©',ops_edit_task:'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù…Ø©',
    ops_stages:'Ø§Ù„Ù…Ø±Ø§Ø­Ù„',ops_add_stage:'Ø¥Ø¶Ø§ÙØ© Ù…Ø±Ø­Ù„Ø©',ops_rename_stage:'ØªØ³Ù…ÙŠØ© Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_delete_stage:'Ø­Ø°Ù Ø§Ù„Ù…Ø±Ø­Ù„Ø©',ops_stage_name:'Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_move_prev_dept:'Ø§Ø±Ø¬Ø§Ø¹ Ù„Ù„Ù‚Ø³Ù… Ø§Ù„Ø³Ø§Ø¨Ù‚',ops_move_next_dept:'Ù†Ù‚Ù„ Ù„Ù„Ù‚Ø³Ù… Ø§Ù„ØªØ§Ù„ÙŠ',ops_finish_task:'ØªÙ…Øª Ø§Ù„Ù…Ù‡Ù…Ø©',
    ops_completed_tasks:'Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©',ops_reopen:'Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­',ops_restore:'Ø§Ø³ØªØ±Ø¬Ø§Ø¹',
    ops_no_stages:'لا توجد مراحل - أضف مرحلة للبدء',
    ops_no_tasks:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_final_stage_title:'Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©',
    ops_final_stage_msg:'ÙˆØµÙ„Øª Ø§Ù„Ù…Ù‡Ù…Ø© Ø¥Ù„Ù‰ Ø¢Ø®Ø± Ø³ØªÙŠØ¬ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù…. ØªØ±ÙŠØ¯ Ù†Ù‚Ù„Ù‡Ø§ Ù„Ù„Ù‚Ø³Ù… Ø§Ù„ØªØ§Ù„ÙŠ Ø£Ù… ØªØ®Ù„ÙŠÙ‡Ø§ ØªÙ…Øª Ø§Ù„Ù…Ù‡Ù…Ø©ØŸ',
    ops_stage_has_tasks:'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ù…Ø±Ø­Ù„Ø© ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ù…Ù‡Ø§Ù…',
    ops_time:'Ø§Ù„ÙˆÙ‚Øª',ops_completed_at:'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²',ops_on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ops_delayed:'Ù…ØªØ£Ø®Ø±',
  },
  en:{
    dashboard:'Dashboard',orders:'Orders',completed_orders:'Completed Orders',
    customers:'Customers',products:'Products',suppliers:'Suppliers',product_steps:'Product Steps',product_workflow:'Product Workflow',workflow:'Workflow',workflow_steps:'Production Steps',step_library:'Step Library',step_library_hint:'Shared steps across products',pick_from_library:'Pick from Library',default_minutes:'Default Time (min)',expected_min:'Expected Time (min)',expected_total:'Expected Time',est_completion:'Est. Completion',queue_pos:'Queue',actual_time:'Actual Time',time_diff:'Difference',on_time:'On Time',ahead:'Ahead',late:'Late',delay_reason_title:'Delivery Delayed',order_recipients:'Recipients',add_recipient:'Add Recipient',no_recipient_warn:'At least one recipient is required',no_deadline_warn:'Deadline is required',recipient_added:'Recipient added',select_recipient:'Select recipient',delay_reason_prompt:'This order has passed its deadline. Please provide a reason for the delay:',delay_reason_placeholder:'Enter delay reason...',delay_submit:'Submit',delay_skip:'Skip',expected_time:'Time per Unit',actual_min:'Actual Time',time_unit:'Unit',minutes:'Minutes',hours_unit:'Hours',time_diff:'Difference',on_time:'On Time',ahead:'Ahead',late:'Late',contact_person:'Contact Person',contact_name:'Name',contact_phone:'Phone',contact_email:'Email',contact_map:'Map Link',contact_address:'Address',temp_contact:'Temp Recipient',temp_recipient_lbl:'Temp Recipient',
    steps:'Steps',my_tasks:'My Tasks',external_tasks:'External Tasks',
    roles:'Roles',departments:'Departments',teams:'Teams',
    employees:'Employees',statuses:'Statuses',notifications:'Notifications',kds:'Production Display',users_mgmt:'Users',
    add:'Add',edit:'Edit',delete:'Delete',save:'Save',cancel:'Cancel',
    confirm_delete:'Are you sure you want to delete?',
    name:'Name',phone:'Phone',address:'Address',notes:'Notes',color:'Color',
    order_number:'Order #',customer:'Customer',recipient:'Recipient',
    deadline:'Customer Delivery Deadline',priority:'Priority',status:'Status',
    expected_hours:'Exp. Hrs',actual_hours:'Act. Hrs',
    in_progress:'In Progress',pending:'Pending',done:'Done',ready:'Ready for Delivery',
    no_data:'No data found',search:'Search',company:'Company',map:'Map',print:'Print',
    quantity:'Qty',product:'Product',employee:'Employee',employees:'Assigned Employees',team:'Team',role:'Role',department:'Dept',
    new_order:'New Order',add_item:'Add Item',
    delivery_address:'Delivery Address',delivery_notes:'Delivery Notes',
    recipient_name:'Recipient Name',company_name:'Company Name',
    active:'Active',inactive:'Inactive',sku:'Product Number',
    step_name:'Step Name',step_order:'Order',
    recipients:'Recipients',temp_recipients:'Temp Recipients',add_recipient:'Add Recipient',
    slug:'Slug',sort_order:'Sort Order',is_done:'Is Final',
    description:'Description',estimated_hours:'Est. Hours',
    phone_alt:'Alt. Phone',map_url:'Map URL',title:'Title',type:'Type',
    send_notification:'Send',browser_notifications:'Browser Notifications',
    show_in_prds:'Show in KDS',is_external:'External Task',
    /* extra */
    active_orders:'Active Orders',total_orders:'Total Orders',completed:'Completed',
    urgent:'Urgent',clients:'Clients',progress:'Progress',date:'Date',
    completed_at:'Completed At',leader:'Leader',members:'Team Members',
    customer_lbl:'Customer:',recipient_lbl:'Recipient:',
    choose_recipient:'-- Select Recipient --',choose_customer_first:'-- Select Customer First --',
    select_product:'-- Select Product --',
    choose:'Select',
    normal:'Normal',high:'High',low:'Low',
    yes:'Yes',no:'No',active_status:'Active',stopped:'Stopped',
    all_statuses:'All Statuses',all_steps_added:'All steps added',
    production_system:'Production System',
    setup_system:'System Setup',
    system_name_title:'System Name',system_name_hint:'This name will appear throughout the system, reports and invoices.',
    logo_title:'Company Logo',logo_hint:'Upload your company logo - transparent PNG or SVG is best.',
    drag_logo:'Drag logo here or click to upload',logo_formats:'PNG - SVG - JPG - WEBP',
    setup_done:'You\'re all set!',setup_success:'System configured successfully:',
    enter_system:'Enter System',next:'Next',skip:'Skip',
    saving:'Saving...',save_continue:'Save & Continue',
    name_required:'System name is required',system_name_placeholder:'e.g. Bright Star Print Shop',
    no_active_orders:'No active orders',full_name:'Full Name',order_number_lbl:'Order #',order_items_lbl:'Order Items',steps_lbl:'Steps',high_priority:'High Priority',completed_lbl:'Completed',sort_order_lbl:'Sort Order',is_final_lbl:'Final Status',expected_lbl:'Expected',actual_lbl:'Actual',login_username:'Username',login_password:'Password',login_subtitle:'Production Management System',login_required:'Please enter username and password',login_error:'Login error',link_emp_label:'Link to existing employee (optional)',link_emp_placeholder:'-- Create new employee --',avatar_title:'Change Profile Picture',avatar_too_large:'Image too large, max 2MB',avatar_error:'Upload error',users_count:'users',role_admin_short:'Admin',role_user_short:'User',no_results_q:'No results for',customer_lbl:'Customer',recipient_lbl:'Recipient',contact_persons:'Contact Persons',contact_person_lbl:'Order Contact',job_title:'Job Title',add_contact:'Add Contact',no_contacts:'No contacts yet',current_step_lbl:'Current Step',progress_lbl:'Progress',yes:'Yes',no:'No',show_in_kds:'Show in KDS',external_task:'External Task',is_delivery:'Delivery Step',scales_with_qty:'Scales with Qty',qty_per_unit:'Per',unit_lbl:'unit',inactive_lbl:'Inactive',login_btn:'Login',edit_order:'Edit Order',order_preview_title:'Order',notif_info:'Info',notif_success:'Success',notif_warning:'Warning',notif_error:'Error',is_done_lbl:'Final Status',perm_sections:'Sections & Pages',perm_steps:'Production Steps',perm_save:'Save Permissions',perm_admin_full:'Admin has full access with no restrictions',perm_title:'Permissions',perm_view:'View',perm_create:'Add',perm_edit:'Edit',perm_delete:'Delete',perm_orders:'Orders',perm_customers:'Customers',perm_products:'Products',perm_employees:'Employees',perm_kds:'Production Display',perm_delivery_orders:'Delivery Orders',perm_reports:'Reports',perm_settings:'Settings',settings:'Settings',perm_users:'Users',username_lbl:'Username',password_lbl:'Password',password_new:'New Password (leave blank to keep current)',role_lbl:'Role',role_admin:'Admin (full access)',role_user:'User (by permissions)',dept_lbl:'Department',no_dept:'-- No Department --',status_lbl:'Status',active_lbl:'Active',stopped_lbl:'Stopped',new_user:'New User',edit_user:'Edit User',no_results:'No results found',no_orders_done:'No completed orders yet',error:'Error',
    start:'Start',complete_step:'Complete',view:'View',return_to_order:'Return to Order',current_step:'Current Step',stop_order:'Stop',force_complete:'Force Complete',confirm_stop:'Stop this order? It will be marked as cancelled.',confirm_force:'Force-complete this order? All steps will be marked done immediately.',delete_blocked:'Cannot delete an order that has already started',
    start_btn:'Start',complete_btn:'Complete',
    kds_subtitle:'Refreshes every 30 seconds',no_active_kds:'No active orders at the moment',
    waiting:'Waiting',
    n_orders:function(n){ return n+' orders'; },
    n_active:function(n){ return n+' active'; },
    n_done:function(n){ return n+' completed'; },
    n_tasks:function(n){ return n+' tasks'; },
    n_items:function(n){ return n+' items'; },
    n_clients:function(n){ return n+' clients'; },
    overview:'Overview of production status',
    workflow_hint:'Define workflow for each product',
    send_notif_title:'Send Notification',
    unread:function(n){ return n+' unread'; },
    retry:'Retry',ui_error:'UI Error',
    loading:'Loading...',loading_data:'Loading data...',
    switch_lang:'Ø§Ù„ØªØ¨Ø¯ÙŠÙ„ Ù„Ù„Ø¹Ø±Ø¨ÙŠØ©',
    /* â”€â”€ Tasks group label â”€â”€ */
    tasks_label:'Tasks',
    kds_interval_lbl:'Production Display Carousel Interval (seconds)',
    kds_interval_hint:'How many seconds between each page rotation on the TV display',
    delivery_orders:'Delivery Orders',
    delivery_agent:'Delivery Agent',
    no_delivery_orders:'No delivery orders assigned to you',
    /* â”€â”€ Operations Tasks â”€â”€ */
    operations_tasks:'Operations Tasks',operations_label:'Operations',
    ops_task_no:'Task #',ops_new_task:'New Task',ops_edit_task:'Edit Task',
    ops_stages:'Stages',ops_add_stage:'Add Stage',ops_rename_stage:'Rename Stage',
    ops_delete_stage:'Delete Stage',ops_stage_name:'Stage Name',
    ops_move_prev_dept:'Return to Previous Department',ops_move_next_dept:'Move to Next Department',ops_finish_task:'Mark as Done',
    ops_completed_tasks:'Completed Tasks',ops_reopen:'Reopen',ops_restore:'Restore',
    ops_no_stages:'No stages - add a stage to get started',
    ops_no_tasks:'No tasks in this stage',
    ops_final_stage_title:'Final Stage',
    ops_final_stage_msg:'This task has reached the last stage in this department. Do you want to move it to the next department or mark it as done?',
    ops_stage_has_tasks:'Cannot delete a stage that contains tasks',
    ops_time:'Time',ops_completed_at:'Completed At',ops_on_time:'On Time',ops_delayed:'Delayed',
  }
};

// Repair any mojibake that may have slipped into the bundled Arabic strings.
// (This can happen when build/zipping is done on Windows and text gets double-encoded.)
try { I18N.ar = deepRepairBrokenStrings(I18N.ar); } catch(_e_i18n_rep) {}
var CSPSR_AR_OVERRIDES = {
  dashboard:'لوحة التحكم',
  orders:'الطلبات',
  completed_orders:'الطلبات المكتملة',
  customers:'العملاء',
  suppliers:'المجهزون',
  products:'المنتجات',
  department:'القسم',
  role:'الدور',
  product_workflow:'سير عمل المنتج',
  product_steps:'خطوات المنتج',
  step_library:'مكتبة الخطوات',
  operations_tasks:'مهام العمليات',
  my_tasks:'مهامي',
  external_tasks:'المهام الخارجية',
  delivery_orders:'طلبات التوصيل',
  reports:'التقارير',
  notifications:'الإشعارات',
  employees:'الموظفون',
  departments:'الأقسام',
  teams:'الفرق',
  roles:'الأدوار',
  statuses:'الحالات',
  users_mgmt:'المستخدمون',
  settings:'الإعدادات',
  tasks_label:'المهام',
  search:'بحث',
  add:'إضافة',
  edit:'تعديل',
  delete:'حذف',
  save:'حفظ',
  cancel:'إلغاء',
  print:'طباعة',
  start:'بدء',
  retry:'إعادة المحاولة',
  ui_error:'خطأ في الواجهة',
  loading:'جاري التحميل...',
  loading_data:'جاري تحميل البيانات...',
  customer:'العميل',
  product:'المنتج',
  quantity:'الكمية',
  status:'الحالة',
  name:'الاسم',
  phone:'الهاتف',
  notes:'ملاحظات',
  color:'اللون',
  active:'نشط',
  inactive:'غير نشط',
  urgent:'عاجل',
  in_progress:'قيد التنفيذ',
  pending:'قيد الانتظار',
  done:'مكتمل',
  completed:'مكتمل',
  ready:'جاهز للتسليم',
  progress:'التقدم',
  expected:'المتوقع',
  actual:'الفعلي',
  current_step:'الخطوة الحالية',
  return_to_order:'العودة للطلب',
  stop_order:'إيقاف',
  customer_lbl:'العميل:',
  recipient_lbl:'المستلم:',
  overview:'نظرة عامة على حالة الإنتاج',
  switch_lang:'التبديل للعربية',
  workflow_hint:'تعريف سير العمل لكل منتج',
  no_active_orders:'لا توجد طلبات نشطة',
  no_results:'لا توجد نتائج',
  no_data:'لا توجد بيانات',
  ops_no_tasks:'لا توجد مهام في هذه المرحلة',
  company:'الشركة',
  map:'الخريطة',
  delivery_agent:'مندوب التوصيل',
  deadline:'موعد تسليم الزبون',
  recipient:'المستلم',
  order_number:'رقم الطلب',
  step_name:'اسم الخطوة',
  step_order:'الترتيب',
  show_in_kds:'عرض في شاشة الإنتاج',
  external_task:'مهمة خارجية',
  is_delivery:'خطوة توصيل',
  kds:'شاشة الإنتاج',
  active_orders:'الطلبات الجارية',
  total_orders:'إجمالي الطلبات',
  clients:'العملاء',
  no_delivery_orders:'لا توجد طلبات توصيل',
  normal:'عادي',
  high:'عالي',
  low:'منخفض'
};
  var CSPSR_AR_OVERRIDES_EXTRA = {
  dashboard:'لوحة التحكم',
  overview:'نظرة عامة على حالة الإنتاج',
  production_system:'نظام الإنتاج',
  production_display:'شاشة الإنتاج',
  choose:'اختر',
  loading:'جاري التحميل...',
  loading_data:'جاري تحميل البيانات...',
  login_subtitle:'نظام إدارة الإنتاج',
  login_required:'أدخل اسم المستخدم وكلمة المرور',
  login_error:'خطأ في تسجيل الدخول',
  kds_subtitle:'تحديث كل 30 ثانية',
  no_active_kds:'لا توجد طلبات نشطة حالياً',
  no_delivery_orders:'لا توجد طلبات توصيل',
  orders:'الطلبات',
  customers:'العملاء',
  products:'المنتجات',
  suppliers:'المجهزون',
  steps:'الخطوات',
  my_tasks:'مهامي',
  external_tasks:'المهام الخارجية',
  kds:'شاشة الإنتاج',
  delivery_orders:'طلبات التوصيل',
  reports:'التقارير',
  notifications:'الإشعارات',
  settings:'الإعدادات',
  search:'بحث',
  send:'إرسال',
  title:'العنوان',
  type:'النوع',
  info:'معلومات',
  success:'نجاح',
  warning:'تحذير',
  error:'خطأ',
  workflow:'سير العمل',
  workflow_steps:'خطوات الإنتاج',
  step_library_hint:'الخطوات المشتركة بين المنتجات',
  pick_from_library:'اختر من المكتبة',
  status:'الحالة',
  status_lbl:'الحالة',
  address:'العنوان',
  notes:'ملاحظات',
  contact_persons:'جهات الاتصال',
  contact_person_lbl:'المسؤول عن الطلب',
  add_contact:'إضافة جهة اتصال',
  no_contacts:'لا توجد جهات اتصال',
  recipient_name:'اسم المستلم',
  company_name:'اسم الشركة',
  map_url:'رابط الخريطة',
  phone_alt:'هاتف بديل',
  name_en:'الاسم بالإنجليزية',
  recipients:'المستلمون',
  temp_recipients:'المستلمون المؤقتون',
  temp_recipient_lbl:'مستلم مؤقت',
  active_status:'نشط',
  active_lbl:'نشط',
  stopped:'موقوف',
  stopped_lbl:'موقوف',
  expected_time:'الوقت المتوقع',
  time_unit:'الوحدة',
  minutes:'دقيقة',
  hours_unit:'ساعة',
  qty_per_unit:'لكل',
  unit_lbl:'وحدة',
  show_in_prds:'عرض في شاشة الإنتاج',
  show_in_kds:'عرض في شاشة الإنتاج',
  is_external:'مهمة خارجية',
  external_task:'مهمة خارجية',
  is_delivery:'خطوة توصيل',
  deadline:'موعد تسليم الزبون',
  priority:'الأولوية',
  contact_person:'شخص التواصل',
  select_recipient:'اختر المستلم',
  add_recipient:'إضافة مستلم',
  current_step_lbl:'الخطوة الحالية',
  no_delivery_orders:'لا توجد طلبات توصيل',
  send_notification:'إرسال',
  browser_notifications:'إشعارات المتصفح',
  title:'العنوان',
  type:'النوع',
  date:'التاريخ',
  notif_info:'معلومات',
  notif_success:'نجاح',
  notif_warning:'تحذير',
  notif_error:'خطأ',
  role_admin:'مدير (وصول كامل)',
  role_user:'مستخدم (حسب الصلاحيات)',
  role_admin_short:'مدير',
  role_user_short:'مستخدم',
  users_count:'مستخدم',
  new_user:'مستخدم جديد',
  edit_user:'تعديل مستخدم',
  working_days:'أيام العمل',
  working_hours:'ساعات الدوام',
  holidays:'العطل',
  map:'الخريطة',
  suppliers:'المجهزون',
  company_calendar:'تقويم الشركة',
  pause_reasons:'أسباب التوقف',
  production_display:'شاشة الإنتاج',
  step_type:'نوع الخطوة',
  internal_production:'إنتاج داخلي',
  external_supplier:'مجهز خارجي',
  delivery_team:'فريق التوصيل',
  permissions:'الصلاحيات',
  switch_lang:'التبديل إلى الإنجليزية'
};
  var __CSPSR_I18N_EN = deepRepairStrings(I18N.en || {});
  // IMPORTANT: The legacy I18N.ar dictionary contains many mojibake strings due to historical encoding issues.
  // Merging it here reintroduces broken Arabic in the UI. Prefer the curated overrides (and fall back to EN).
  var __CSPSR_I18N_AR = Object.assign(
    {},
    __CSPSR_I18N_EN,
    deepRepairStrings(CSPSR_AR_OVERRIDES || {}),
    deepRepairStrings(CSPSR_AR_OVERRIDES_EXTRA || {})
  );
  I18N = { ar: __CSPSR_I18N_AR, en: __CSPSR_I18N_EN };
  I18N.en.switch_lang = 'Switch to Arabic';

var I18nCtx = createContext({ t: function(k){ return k; }, lang:'ar', setLang: function(){}, isRtl:true });
function getPreferredLang(fallback) {
  try {
    var ls = localStorage.getItem('cspsr_lang');
    if (ls === 'ar' || ls === 'en') return ls;
  } catch(e) {}
  try {
    var cfgObj = (typeof cfg === 'function') ? cfg() : null;
    var cfgLang = cfgObj && cfgObj.lang;
    if (cfgLang === 'ar' || cfgLang === 'en') return cfgLang;
  } catch(e2) {}
  return fallback || 'ar';
}
function setPreferredLang(lang) {
  try { localStorage.setItem('cspsr_lang', lang === 'en' ? 'en' : 'ar'); } catch(e) {}
}
function I18nProvider(props) {
  var saved = getPreferredLang(props.initialLang || 'ar');
  var _s = useState(saved);
  var lang = _s[0], setLangRaw = _s[1];
  function setLang(l) {
    setLangRaw(l);
    setPreferredLang(l);
  }
  // Also persist on every lang change via effect
  useEffect(function() {
    setPreferredLang(lang);
  }, [lang]);
  var isRtl = lang === 'ar';
  var t = useCallback(function(k, arg) {
    return safeTranslated(k, lang, arg);
  }, [lang]);
  useEffect(function() {
    _currentLang = lang;
    var root = document.getElementById('cspsr-root');
    if (root) {
      root.style.direction = isRtl ? 'rtl' : 'ltr';
      root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      root.setAttribute('lang', lang);
    }
  }, [lang, isRtl]);
  return h(I18nCtx.Provider, { value: { t:t, lang:lang, setLang:setLang, isRtl:isRtl } }, props.children);
}
function useI18n() { return useContext(I18nCtx); }

function LangRemount(props) {
  var i18n = useI18n();
  return h('div', { key:i18n.lang, style:{ display:'contents' } }, props.children);
}

/* â”€â”€ Search Context (global topbar search) â”€â”€ */
var SearchCtx = createContext({ q:'', setQ:function(){}, placeholder:'' });
function useSearch() { return useContext(SearchCtx); }

/* â”€â”€ Topbar Context â€” views register subtitle + action â”€â”€ */
var TopbarCtx = createContext({ setMeta:function(){} });
function useTopbar(subtitle, action) {
  var ctx = useContext(TopbarCtx);
  useEffect(function(){
    ctx.setMeta({ subtitle: subtitle, action: action });
    return function(){ ctx.setMeta({ subtitle:'', action:null }); };
  }, [subtitle, action]);
}

/* â”€â”€ Date formatter â”€â”€ */
function fmtDate(val, lang) {
  if (!val) return '—';
  var l = lang || 'ar';
  try {
    var d = parseServerDate(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric' });
  } catch(e) { return val; }
}
function fmtDateTime(val, lang) {
  if (!val) return '—';
  var l = lang || 'ar';
  try {
    var d = parseServerDate(val);
    if (isNaN(d)) return val;
    return d.toLocaleString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e) { return val; }
}
function fmtDateDayTime(val, lang) {
  if (!val) return '—';
  var l = lang || 'ar';
  try {
    var d = parseServerDate(val);
    if (isNaN(d)) return val;
    return d.toLocaleString(l === 'ar' ? 'ar-IQ' : 'en-GB', {
      weekday:'short',
      year:'numeric',
      month:'short',
      day:'numeric',
      hour:'2-digit',
      minute:'2-digit'
    });
  } catch(e) { return val; }
}
function orderDeliveryDisplayAt(order) {
  if (!order) return '';
  return order.delivery_date
    || order.deadline
    || order.customer_deadline_at
    || order.requested_delivery_at
    || order.delivery_planned_at
    || order.dispatch_due_at
    || order.internal_ready_at
    || order.schedule_anchor_at
    || order.delivery_scheduled_at
    || '';
}

function parseServerDate(val) {
  if (val === null || typeof val === 'undefined' || val === '') return null;
  var s = String(val).trim();
  if (!s) return null;
  var normalized = s.replace(' ', 'T');
  var withZone = /[zZ]$/.test(normalized) || /[+\-]\d\d:\d\d$/.test(normalized);
  if (withZone) {
    var zoned = new Date(normalized);
    if (!isNaN(zoned)) return zoned;
  }
  var parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (parts) {
    var local = new Date(
      parseInt(parts[1], 10),
      parseInt(parts[2], 10) - 1,
      parseInt(parts[3], 10),
      parseInt(parts[4], 10),
      parseInt(parts[5], 10),
      parseInt(parts[6] || '0', 10)
    );
    if (!isNaN(local)) return local;
  }
  var d = new Date(normalized);
  if (!isNaN(d)) return d;
  d = new Date(withZone ? normalized : (normalized + 'Z'));
  if (!isNaN(d)) return d;
  return null;
}

function localNowSql() {
  var d = new Date();
  function pad(v) { return String(v).padStart(2, '0'); }
  return d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes()) + ':' +
    pad(d.getSeconds());
}

function openPrint(order) { openPrintWithLang(order, "ar"); }

/* â”€â”€ Safe i18n getter (for render functions outside React tree) â”€â”€ */
var _currentLang = 'ar';
function getLang() { return _currentLang; }
function getT() { return function(k, arg) {
  return safeTranslated(k, _currentLang, arg);
}; }

/* â”€â”€ API â”€â”€ */
function cfg() { return window.CSPSR_CONFIG || { root:'/wp-json/cspsr/v1/', nonce:'' }; }
var CSPSR_DATA_CHANGED_EVENT = 'cspsr:data-changed';
var CSPSR_ACTIVE_TAB_KEY = 'cspsr_active_tab';
function announceDataChanged(detail) {
  if (typeof window === 'undefined' || !window.dispatchEvent) return;
  try {
    window.dispatchEvent(new CustomEvent(CSPSR_DATA_CHANGED_EVENT, { detail: detail || {} }));
  } catch (e) {
    try {
      var ev = document.createEvent('Event');
      ev.initEvent(CSPSR_DATA_CHANGED_EVENT, true, true);
      ev.detail = detail || {};
      window.dispatchEvent(ev);
    } catch (e2) {}
  }
}
function apiFetch(path, opts) {
  opts = opts || {};
  var c = cfg();
  var url = c.root.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  if (opts.fresh) {
    url += (url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
  }
  var token = '';
  try { token = localStorage.getItem('cspsr_token') || ''; } catch(e){}
  var method = opts.method || 'GET';
  var fetchOpts = Object.assign({}, opts);
  delete fetchOpts.fresh;
  return fetch(url, {
    headers: Object.assign({ 'Content-Type':'application/json', 'X-WP-Nonce': c.nonce, 'X-CSPSR-Token': token }, opts.headers || {}),
    method: method,
    cache: opts.fresh ? 'no-store' : opts.cache,
    keepalive: !!opts.keepalive,
    body: opts.body || undefined,
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) {
        var msg = (data && (data.message || data.code)) || res.status;
        throw new Error(msg);
      }
      // Normalize/repair garbled strings coming from the server (DB mojibake).
      try { data = deepRepairBrokenStrings(data); } catch(_e_rep0) {}
      var m = String(method || 'GET').toUpperCase();
      if (m !== 'GET' && m !== 'HEAD') {
        announceDataChanged({ method:m, path:path, at:Date.now() });
      }
      return data;
    });
  }).catch(function(err){
    throw err;
  });
}

function normalizeTabId(tab, fallback) {
  var raw = String(tab || '').trim();
  if (!raw) return fallback || 'dashboard';
  var normalized = raw.toLowerCase();
  var aliases = {
    'dashboard': 'dashboard',
    'لوحة التحكم': 'dashboard',
    'orders': 'orders',
    'الطلبات': 'orders',
    'completed-orders': 'completed-orders',
    'completedorders': 'completed-orders',
    'الطلبات المكتملة': 'completed-orders',
    'production-display': 'production-display',
    'productiondisplay': 'production-display',
    'شاشة الإنتاج': 'production-display',
    'customers': 'customers',
    'العملاء': 'customers',
    'suppliers': 'suppliers',
    'المجهزون': 'suppliers',
    'products': 'products',
    'المنتجات': 'products',
    'product-workflow': 'product-workflow',
    'productworkflow': 'product-workflow',
    'سير عمل المنتجات': 'product-workflow',
    'ops-tasks': 'ops-tasks',
    'opstasks': 'ops-tasks',
    'مهام العمليات': 'ops-tasks',
    'my-tasks': 'my-tasks',
    'mytasks': 'my-tasks',
    'مهامي': 'my-tasks',
    'external-tasks': 'external-tasks',
    'externaltasks': 'external-tasks',
    'المهام الخارجية': 'external-tasks',
    'delivery-orders': 'delivery-orders',
    'deliveryorders': 'delivery-orders',
    'طلبات التوصيل': 'delivery-orders',
    'reports': 'reports',
    'التقارير': 'reports',
    'notifications': 'notifications',
    'الإشعارات': 'notifications',
    'assigned-employees': 'assigned-employees',
    'assignedemployees': 'assigned-employees',
    'الموظفون المعينون': 'assigned-employees',
    'departments': 'departments',
    'الأقسام': 'departments',
    'teams': 'teams',
    'الفرق': 'teams',
    'roles': 'roles',
    'الأدوار': 'roles',
    'statuses': 'statuses',
    'الحالات': 'statuses',
    'users': 'users',
    'المستخدمون': 'users',
    'settings': 'settings',
    'الإعدادات': 'settings'
  };
  return aliases.hasOwnProperty(raw) ? aliases[raw] : (aliases.hasOwnProperty(normalized) ? aliases[normalized] : raw);
}

function readPersistedTab(fallback) {
  var cleanFallback = fallback || 'dashboard';
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hash) {
      var hash = String(window.location.hash || '').replace(/^#/, '');
      if (hash.indexOf('tab=') === 0) {
        var hashTab = normalizeTabId(decodeURIComponent(hash.slice(4)), cleanFallback);
        if (hashTab) return hashTab;
      }
      if (hash) {
        var cleanHash = normalizeTabId(hash, cleanFallback);
        if (cleanHash && /^[a-z0-9-]+$/i.test(cleanHash)) return cleanHash;
      }
    }
  } catch (_e0) {}
  try {
    var stored = normalizeTabId(localStorage.getItem(CSPSR_ACTIVE_TAB_KEY) || '', cleanFallback);
    if (stored && /^[a-z0-9-]+$/i.test(stored)) return stored;
  } catch (_e1) {}
  return cleanFallback;
}

function persistActiveTab(tab) {
  var value = normalizeTabId(tab, '').trim();
  if (!value) return;
  try { localStorage.setItem(CSPSR_ACTIVE_TAB_KEY, value); } catch (_e0) {}
  try {
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#tab=' + encodeURIComponent(value));
    }
  } catch (_e1) {}
}

/* â”€â”€ Print slip â”€â”€ */
function openPrintWithLang(order, lang) {
  var qrItemIds = asArr(order.qr_item_ids || []);
  var qrBatchId = order.qr_batch_id || '';
  var qrPartial = order.qr_partial ? true : false;
  var printUrl = ((cfg().site_url || '').replace(/\/+$/, '') || (location.origin || '')) + '/?cspsr_qr_contact=' + order.id
    + (qrPartial ? '&partial=1' : '')
    + (qrBatchId ? '&batch_id=' + qrBatchId : '')
    + (qrItemIds.length ? '&item_ids=' + qrItemIds.join(',') : '')
    + '&print=1';
  window.open(printUrl, '_blank');
  return;
  var items = asArr(order.items);
  var itemsHtml = items.length ? '<br><b>Ø§Ù„Ø¹Ù†Ø§ØµØ±:</b><ul>' + items.map(function(i){ return '<li>'+i.product_name+' Ã— '+i.quantity+'</li>'; }).join('') + '</ul>' : '';
  var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Ø·Ù„Ø¨ #'+order.order_number+'</title>'
    + '<style>body{font-family:system-ui;padding:1.5rem;font-size:13px}table{width:100%;border-collapse:collapse}td{padding:.35rem .6rem;border:1px solid #e3e8ef}.lbl{color:#7a8694;width:35%}</style></head><body>'
    + '<h2>ðŸ“¦ Ø·Ù„Ø¨ #'+order.order_number+'</h2><table>'
    + '<tr><td class="lbl">Ø§Ù„Ø¹Ù…ÙŠÙ„</td><td>'+getCust(order)+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„Ù…Ø³ØªÙ„Ù…</td><td>'+getRec(order)+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„Ø­Ø§Ù„Ø©</td><td>'+order.status_slug+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„ØªÙ‚Ø¯Ù…</td><td>'+progOf(order)+'%</td></tr>'
    + (order.deadline ? '<tr><td class="lbl">Ø§Ù„Ù…ÙˆØ¹Ø¯</td><td>'+fmtDateTime(order.deadline, lang)+'</td></tr>' : '')
    + (order.delivery_address ? '<tr><td class="lbl">Ø§Ù„Ø¹Ù†ÙˆØ§Ù†</td><td>'+order.delivery_address+'</td></tr>' : '')
    + '</table>' + itemsHtml + '</body></html>';
  var w = window.open('', '_blank', 'width=600,height=700');
  w.document.write(html);
  w.document.close();
  setTimeout(function(){ w.print(); }, 500);
}

/* â”€â”€ Hooks â”€â”€ */
function normalizeOrderRuntimeState(order) {
  if (!order || !order.items) return order;
  var clone = JSON.parse(JSON.stringify(order));
  var activeFound = false;
  var latestEventByStep = {};
  var latestStartAtByStep = {};
  var orderSlugNorm = String(clone.status_slug || '').toLowerCase().replace(/[^a-z_]/g,'');
  var hasStepRuntimeEvidence = false;
  asArr(clone.items).forEach(function(item){
    asArr(item && item.steps).forEach(function(step){
      if (!step) return;
      if (step.actual_started_at || step.started_at || step.actual_completed_at || step.completed_at) {
        hasStepRuntimeEvidence = true;
        return;
      }
      var s = stepStatusSlug(step);
      if (s === 'in_progress' || s === 'done' || s === 'completed' || parseInt(step.is_paused, 10) === 1) {
        hasStepRuntimeEvidence = true;
      }
    });
  });
  asArr(clone.events).forEach(function(ev){
    if (hasStepRuntimeEvidence) return;
    var t = String((ev && ev.event_type) || '').toLowerCase();
    if (!t) return;
    if (
      t === 'step_started' ||
      t === 'step_auto_started' ||
      t === 'step_completed' ||
      t === 'step_done' ||
      t === 'step_paused' ||
      t === 'step_resumed' ||
      t === 'order_started'
    ) {
      hasStepRuntimeEvidence = true;
    }
  });
  var explicitNotStarted =
    !hasStepRuntimeEvidence &&
    !clone.started_at &&
    !clone.production_started_at &&
    (orderSlugNorm === 'pending' || orderSlugNorm === '');

  asArr(clone.events).forEach(function(ev){
    var sid = ev && ev.step_id != null ? String(ev.step_id) : '';
    if (!sid) return;
    var eventType = String(ev.event_type || '');
    if (!latestEventByStep[sid]) latestEventByStep[sid] = eventType;
    if (!latestStartAtByStep[sid] && ['step_started','step_auto_started','step_resumed'].indexOf(eventType) >= 0) {
      var payload = ev && ev.payload;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch(e) { payload = null; }
      }
      latestStartAtByStep[sid] =
        (payload && (payload.actual_started_at || payload.started_at)) ||
        ev.event_time ||
        null;
    }
  });

  asArr(clone.items).forEach(function(item){
    var steps = asArr(item.steps);

    steps.forEach(function(step){
      var latestEvent = step && step.id != null ? latestEventByStep[String(step.id)] : '';
      var latestStartAt = step && step.id != null ? latestStartAtByStep[String(step.id)] : '';
      if (step && latestStartAt) {
        var currentStart = step.actual_started_at || step.started_at || null;
        var currentStartDate = currentStart ? parseServerDate(currentStart) : null;
        var eventStartDate = parseServerDate(latestStartAt);
        var shouldPatchStart =
          !currentStartDate ||
          (eventStartDate && currentStartDate && eventStartDate.getTime() > currentStartDate.getTime());
        if (shouldPatchStart) {
          step.started_at = latestStartAt;
          step.actual_started_at = latestStartAt;
        }
      }
      var started = !!(step && (step.actual_started_at || step.started_at));
      var finished = !!(step && (step.actual_completed_at || step.completed_at));
      var eventImpliesStarted = ['step_started','step_auto_started','step_resumed'].indexOf(latestEvent) >= 0;
      if (!explicitNotStarted && step && step.status_slug === 'pending' && ((started && !finished) || (eventImpliesStarted && !finished))) {
        step.status_slug = 'in_progress';
      }
      if (step && step.status_slug === 'in_progress') activeFound = true;
    });

    if (!explicitNotStarted && !activeFound && clone && clone.current_step_label) {
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (!step || step.status_slug !== 'pending') continue;
        if (String(step.step_name || '') !== String(clone.current_step_label || '')) continue;
        var blocked = false;
        for (var j = 0; j < i; j++) {
          var prev = steps[j];
          if (!prev || ['done','completed'].indexOf(prev.status_slug) >= 0) continue;
          blocked = true;
          break;
        }
        if (!blocked) {
          step.status_slug = 'in_progress';
          activeFound = true;
          break;
        }
      }
    }

    if (explicitNotStarted) {
      var firstPendingForced = false;
      steps.forEach(function(step){
        if (!step) return;
        if (['done','completed'].indexOf(stepStatusSlug(step)) >= 0) return;
        step.status_slug = 'pending';
        step.started_at = null;
        step.actual_started_at = null;
        if (!firstPendingForced) {
          firstPendingForced = true;
          clone.current_step_label = step.step_name || step.step_name_en || null;
        }
      });
    }
  });

  return clone;
}

function normalizeBootstrapData(data) {
  if (!data || !data.orders) return data;
  if (data.time_meta && typeof window !== 'undefined') {
    window.CSPSR_CONFIG = Object.assign({}, window.CSPSR_CONFIG || {}, data.time_meta);
  }
  var next = Object.assign({}, data);
  next.orders = asArr(data.orders).map(normalizeOrderRuntimeState);
  return next;
}

function stepStatusSlug(step) {
  var slug = String((step && step.status_slug) || '').toLowerCase().trim();
  if (!slug) return '';
  slug = slug.replace(/[^a-z_]/g,'');
  if (slug.indexOf('inprogress') === 0) return 'in_progress';
  if (slug.indexOf('pending') === 0) return 'pending';
  if (slug.indexOf('done') === 0) return 'done';
  if (slug.indexOf('completed') === 0 || slug.indexOf('complet') === 0) return 'completed';
  if (slug.indexOf('cancel') === 0) return 'cancelled';
  if (slug.indexOf('paused') === 0) return 'paused';
  return slug;
}

function orderIsPaused(order) {
  if (!order) return false;
  if (parseInt(order.is_paused, 10) === 1) return true;
  if (stepStatusSlug({status_slug:order.status_slug}) === 'paused') return true;
  return asArr(order.items).some(function(item){
    return asArr(item.steps).some(function(step){ return parseInt(step.is_paused, 10) === 1; });
  });
}

function orderActualStats(order) {
  var nowMs = Date.now();
  var totalActiveMs = 0;
  var hasStarted = false;
  asArr(order && order.items).forEach(function(item){
    asArr(item.steps).forEach(function(step){
      if (parseInt(step.is_delivery, 10) === 1) return;
      var storedActualMins = parseInt(step.actual_duration_minutes, 10);
      if (storedActualMins > 0 && stepStatusSlug(step) !== 'in_progress') {
        hasStarted = true;
        totalActiveMs += storedActualMins * 60000;
        return;
      }
      var startedAt = step.actual_started_at || step.started_at;
      if (!startedAt) return;
      hasStarted = true;
      var endAt = step.actual_completed_at || step.completed_at;
      var startDate = parseServerDate(startedAt);
      var endDate = endAt ? parseServerDate(endAt) : null;
      var startMs = startDate ? startDate.getTime() : NaN;
      var endMs = endDate ? endDate.getTime() : nowMs;
      if (!isFinite(startMs) || !isFinite(endMs) || endMs < startMs) return;
      var pausedSecs = parseInt(step.paused_seconds, 10) || 0;
      if (parseInt(step.is_paused, 10) === 1 && step.paused_at) {
        var pausedAtDate = parseServerDate(step.paused_at);
        var pausedAtMs = pausedAtDate ? pausedAtDate.getTime() : NaN;
        if (isFinite(pausedAtMs) && pausedAtMs > startMs && nowMs > pausedAtMs) {
          pausedSecs += Math.max(0, Math.round((nowMs - pausedAtMs) / 1000));
        }
      }
      totalActiveMs += Math.max(0, (endMs - startMs) - (pausedSecs * 1000));
    });
  });
  var mins = Math.round(totalActiveMs / 60000);
  var secs = Math.round(totalActiveMs / 1000);
  return {
    mins: mins,
    secs: secs,
    hasActual: hasStarted && totalActiveMs > 0
  };
}

function stepActualStats(step) {
  if (!step || parseInt(step.is_delivery, 10) === 1) return { mins:0, secs:0, hasActual:false };
  var storedActualMins = parseInt(step.actual_duration_minutes, 10);
  if (storedActualMins > 0 && stepStatusSlug(step) !== 'in_progress') {
    return { mins:storedActualMins, secs:storedActualMins * 60, hasActual:true };
  }
  var startedAt = step.actual_started_at || step.started_at;
  if (!startedAt) return { mins:0, secs:0, hasActual:false };
  var nowMs = Date.now();
  var endAt = step.actual_completed_at || step.completed_at;
  var startDate = parseServerDate(startedAt);
  var endDate = endAt ? parseServerDate(endAt) : null;
  var startMs = startDate ? startDate.getTime() : NaN;
  var endMs = endDate ? endDate.getTime() : nowMs;
  if (!isFinite(startMs) || !isFinite(endMs) || endMs < startMs) return { mins:0, secs:0, hasActual:false };
  var pausedSecs = parseInt(step.paused_seconds, 10) || 0;
  if (parseInt(step.is_paused, 10) === 1 && step.paused_at) {
    var pausedAtDate = parseServerDate(step.paused_at);
    var pausedAtMs = pausedAtDate ? pausedAtDate.getTime() : NaN;
    if (isFinite(pausedAtMs) && pausedAtMs > startMs && nowMs > pausedAtMs) {
      pausedSecs += Math.max(0, Math.round((nowMs - pausedAtMs) / 1000));
    }
  }
  var totalActiveMs = Math.max(0, (endMs - startMs) - (pausedSecs * 1000));
  return {
    mins: Math.round(totalActiveMs / 60000),
    secs: Math.round(totalActiveMs / 1000),
    hasActual: totalActiveMs > 0
  };
}

function useBootstrap(enabled) {
  var _s = useState({data:null, loading:!!enabled, error:null});
  var state = _s[0], setState = _s[1];

  var patchOrder = useCallback(function(updatedOrder) {
    if (!updatedOrder || !updatedOrder.id) return;
    setState(function(prev){
      var data = prev && prev.data ? prev.data : null;
      if (!data) return prev;
      var nextData = Object.assign({}, data, {
        orders: asArr(data.orders).map(function(order){
          return String(order.id) === String(updatedOrder.id) ? normalizeOrderRuntimeState(updatedOrder) : order;
        })
      });
      try { window.__CSPSR_BS__ = nextData; } catch(e) {}
      return Object.assign({}, prev, { data: nextData });
    });
  }, []);

  var load = useCallback(function() {
    if (!enabled) {
      setState(function(prev){ return Object.assign({}, prev, { loading:false, error:null }); });
      return;
    }
    /* only show spinner on first load */
    setState(function(prev){ return Object.assign({},prev,{loading:true}); });
    apiFetch('bootstrap', {fresh:true})
      .then(function(d){ d = normalizeBootstrapData(d); setState({data:d, loading:false, error:null}); try{window.__CSPSR_BS__=d;}catch(e){} })
      .catch(function(e){ setState(function(prev){ return Object.assign({},prev,{loading:false,error:e.message}); }); });
  }, [enabled]);

  var silentReload = useCallback(function() {
    if (!enabled) return;
    apiFetch('bootstrap', {fresh:true})
      .then(function(d){ d = normalizeBootstrapData(d); setState(function(prev){ return Object.assign({},prev,{data:d}); }); })
      .catch(function(){});
  }, [enabled]);

  useEffect(function(){
    if (!enabled) return;
    if (typeof window === 'undefined' || !window.addEventListener) return;
    var timer = null;
    function onDataChanged() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function(){
        silentReload();
      }, 200);
    }
    window.addEventListener(CSPSR_DATA_CHANGED_EVENT, onDataChanged);
    return function(){
      if (timer) clearTimeout(timer);
      window.removeEventListener(CSPSR_DATA_CHANGED_EVENT, onDataChanged);
    };
  }, [enabled, silentReload]);

  useEffect(function(){ load(); }, [load]);
  return { data:state.data, loading:state.loading, error:state.error, reload:load, silentReload:silentReload, patchOrder:patchOrder };
}
function useCRUD(resource, opts) {
  opts = opts || {};
  var _s = useState([]); var items = _s[0], setItems = _s[1];
  var _l = useState(false); var loading = _l[0], setLoading = _l[1];
  var _m = useState({page:1,per_page:25,total:0,total_pages:1}); var meta = _m[0], setMeta = _m[1];
  var load = useCallback(function() {
    setLoading(true);
    var path = resource;
    if (opts.paginated) {
      var qp = [];
      qp.push('page=' + encodeURIComponent(opts.page || 1));
      qp.push('per_page=' + encodeURIComponent(opts.perPage || 25));
      if (opts.q && String(opts.q).trim()) qp.push('q=' + encodeURIComponent(String(opts.q).trim()));
      if (opts.extraQuery) {
        Object.keys(opts.extraQuery).forEach(function(k){
          var val = opts.extraQuery[k];
          if (val === undefined || val === null || val === '') return;
          qp.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(val)));
        });
      }
      path += (path.indexOf('?') >= 0 ? '&' : '?') + qp.join('&');
    }
    apiFetch(path, { fresh: !!opts.paginated }).then(function(d){
      if (d && Array.isArray(d.items) && d.meta) {
        setItems(d.items);
        setMeta({
          page: parseInt(d.meta.page, 10) || 1,
          per_page: parseInt(d.meta.per_page, 10) || (opts.perPage || 25),
          total: parseInt(d.meta.total, 10) || 0,
          total_pages: parseInt(d.meta.total_pages, 10) || 1
        });
      } else {
        var arr = Array.isArray(d) ? d : [];
        setItems(arr);
        setMeta({ page:1, per_page:arr.length || (opts.perPage || 25), total:arr.length, total_pages:1 });
      }
      setLoading(false);
    }).catch(function(){ setLoading(false); });
  }, [resource, opts.paginated, opts.page, opts.perPage, opts.q, JSON.stringify(opts.extraQuery || {})]);
  useEffect(function(){ load(); }, [load]);
  useEffect(function(){
    if (typeof window === 'undefined' || !window.addEventListener) return;
    var timer = null;
    function onDataChanged() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function(){ load(); }, 250);
    }
    window.addEventListener(CSPSR_DATA_CHANGED_EVENT, onDataChanged);
    return function(){
      if (timer) clearTimeout(timer);
      window.removeEventListener(CSPSR_DATA_CHANGED_EVENT, onDataChanged);
    };
  }, [load]);
  function create(d) { return apiFetch(resource, {method:'POST',body:JSON.stringify(d)}).then(load); }
  function update(id,d) { return apiFetch(resource+'/'+id, {method:'PUT',body:JSON.stringify(d)}).then(load); }
  function remove(id) { return apiFetch(resource+'/'+id, {method:'DELETE'}).then(load); }
  return { items:items, loading:loading, meta:meta, create:create, update:update, remove:remove, load:load };
}

function PagerControls(props) {
  var page = Math.max(1, parseInt(props.page, 10) || 1);
  var totalPages = Math.max(1, parseInt(props.totalPages, 10) || 1);
  var total = Math.max(0, parseInt(props.total, 10) || 0);
  var onPageChange = typeof props.onPageChange === 'function' ? props.onPageChange : function(){};
  var lang = props.lang || 'en';
  return h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:12, flexWrap:'wrap' } },
    h('div', { style:{ fontSize:12, color:T.textMute } },
      (lang === 'en' ? 'Total: ' : 'المجموع: ') + total + ' • ' +
      (lang === 'en' ? 'Page ' : 'صفحة ') + page + '/' + totalPages
    ),
    h('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
      h(Btn, {
        size:'sm',
        variant:'secondary',
        disabled: page <= 1,
        onClick:function(){ onPageChange(Math.max(1, page - 1)); }
      }, lang === 'en' ? 'Prev' : 'السابق'),
      h(Btn, {
        size:'sm',
        variant:'secondary',
        disabled: page >= totalPages,
        onClick:function(){ onPageChange(Math.min(totalPages, page + 1)); }
      }, lang === 'en' ? 'Next' : 'التالي')
    )
  );
}

/* â•â•â• UI COMPONENTS â•â•â• */

function Spinner(props) {
  var size = props.size || 20;
  return h('div', { style:{ width:size, height:size, border:'2px solid '+T.border, borderTopColor:T.accent, borderRadius:'50%', animation:'csSpin .7s linear infinite', flexShrink:0 } });
}
function PageLoader() {
  var t = useI18n().t;
  return h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, color:T.textMute, fontSize:14 } }, h(Spinner), t('loading'));
}

function Badge(props) {
  var label = props.label, color = props.color || 'gray', dot = props.dot;
  var m = {
    gray:   [T.bgSub,    T.textMid,  T.border],
    purple: [T.accentDim, T.accent,  '#c4b8ff'],
    green:  [T.greenBg,  T.green,    '#a7f3d0'],
    red:    [T.redBg,    T.red,      '#fda4af'],
    amber:  [T.amberBg,  T.amber,    '#fcd34d'],
    blue:   [T.blueBg,   T.blue,     '#93c5fd'],
  };
  var c = m[color] || m.gray;
  return h('span', { style:{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', background:c[0], color:c[1], border:'1px solid '+c[2], borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:'nowrap' } },
    dot && h('span', { style:{ width:5, height:5, borderRadius:'50%', background:c[1], flexShrink:0 } }),
    label
  );
}
function statusBadge(slug, statuses, lang) {
  var s = asArr(statuses).find(function(x){ return x.slug === slug; });
  if (!s) s = asArr(statuses).find(function(x){ return x.slug && x.slug.toLowerCase().replace(/\s+/g,'_') === (slug||'').toLowerCase().replace(/\s+/g,'_'); });
  var map = { pending:'gray', in_progress:'blue', review:'amber', ready:'green', done:'green', completed:'green', cancelled:'red' };
  var fallbackAr = { pending:'Ø¹Ù„Ù‰ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±', in_progress:'Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°', review:'Ù…Ø±Ø§Ø¬Ø¹Ø©', ready:'Ø¬Ø§Ù‡Ø²', done:'Ù…ÙƒØªÙ…Ù„', completed:'Ù…ÙƒØªÙ…Ù„', cancelled:'Ù…Ù„ØºÙŠ' };
  var fallbackEn = { pending:'Pending', in_progress:'In Progress', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var label = s ? ln(s, lang||'ar') : ((lang==='en' ? fallbackEn[slug] : fallbackAr[slug]) || slug || 'â€”');
  var color = map[slug] || (s && s.is_done==1 ? 'green' : 'gray');
  return h(Badge, { label:label, color:color, dot:true });
}

function Btn(props) {
  var variant = props.variant || 'primary', size = props.size || 'md';
  var sz = { sm:{padding:'5px 12px',fontSize:12}, md:{padding:'8px 16px',fontSize:13}, lg:{padding:'11px 20px',fontSize:14} };
  var vr = {
    primary:   { background:T.accent, color:'#fff' },
    secondary: { background:T.bg, color:T.text, border:'1px solid '+T.border, boxShadow:T.shadow },
    danger:    { background:T.redBg, color:T.red, border:'1px solid #fda4af' },
    success:   { background:T.greenBg, color:T.green, border:'1px solid #a7f3d0' },
    ghost:     { background:'transparent', color:T.accent },
  };
  var style = Object.assign({
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
    border:'none', borderRadius:T.radius, cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontWeight:600, fontFamily:'inherit', transition:'all .12s',
    opacity: props.disabled ? 0.55 : 1,
  }, sz[size], vr[variant] || vr.primary, props.style || {});
  return h('button', { type: props.type || 'button', onClick: props.onClick, disabled: props.disabled, style: style }, props.children);
}

var iSt = { width:'100%', padding:'8px 12px', fontSize:13, color:T.text, background:T.bg, border:'1px solid '+T.border, borderRadius:T.radius, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border .12s', lineHeight:'1.5', textAlign:'start' };
var selSt = Object.assign({}, iSt, { cursor:'pointer', height:38, padding:'0 12px 0 32px', appearance:'none', WebkitAppearance:'none', MozAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%237a8694' d='M5 6L0 0h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'left 10px center', textAlign:'start' });

function onFocus(e) { e.target.style.borderColor = T.accent; e.target.style.boxShadow = '0 0 0 3px ' + T.accentDim; }
function onBlur(e)  { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }

function Fld(props) {
  return h('div', { style:{ marginBottom:14 } },
    props.label && h('label', { style:{ display:'block', fontSize:12, fontWeight:600, color:T.textMid, marginBottom:5 } }, props.label),
    props.children,
    props.hint && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:3 } }, props.hint)
  );
}
function Input(props) {
  return h(Fld, { label:props.label, hint:props.hint },
    h('input', { type:props.type||'text', value:props.value != null ? props.value : '', placeholder:props.placeholder||'', onChange:function(e){ props.onChange(e.target.value); }, style:Object.assign({}, iSt, props.style||{}), onFocus:onFocus, onBlur:onBlur })
  );
}
function Textarea(props) {
  function handleFocus(e) {
    onFocus(e);
    if (typeof props.onFocus === 'function') props.onFocus(e);
  }
  function handleBlur(e) {
    onBlur(e);
    if (typeof props.onBlur === 'function') props.onBlur(e);
  }
  return h(Fld, { label:props.label, hint:props.hint },
    h('textarea', { value:props.value != null ? props.value : '', rows:props.rows||3, placeholder:props.placeholder||'', onChange:function(e){ props.onChange(e.target.value); }, style:Object.assign({}, iSt, {resize:'vertical'}), onFocus:handleFocus, onBlur:handleBlur })
  );
}
function Select(props) {
  var opts = props.options || [];
  var searchable = !!props.searchable;
  var _q = useState(''); var q = _q[0], setQ = _q[1];
  var _open = useState(false); var open = _open[0], setOpen = _open[1];
  var _idx = useState(-1); var idx = _idx[0], setIdx = _idx[1];
  var query = String(q || '').toLowerCase().trim();
  var shown = (!searchable || !query)
    ? []
    : opts.filter(function(o){
        var lbl = String((o && o.label) || '').toLowerCase();
        var val = String((o && o.value) || '').toLowerCase();
        return lbl.indexOf(query) >= 0 || val.indexOf(query) >= 0;
      }).slice(0, 8);

  function chooseOption(o) {
    if (!o) return;
    props.onChange(String(o.value));
    setQ(String(o.label || ''));
    setOpen(false);
    setIdx(-1);
  }

  function onInputKeyDown(e) {
    if (!shown.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setIdx(function(prev){ return prev < shown.length - 1 ? prev + 1 : 0; });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setIdx(function(prev){ return prev > 0 ? prev - 1 : (shown.length - 1); });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      chooseOption(shown[idx >= 0 ? idx : 0]);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setIdx(-1);
    }
  }

  return h(Fld, { label:props.label, hint:props.hint },
    searchable && h('div', { style:{ position:'relative', marginBottom:6 } },
      h('input', {
        type:'text',
        value:q,
        onChange:function(e){ setQ(e.target.value); setOpen(true); setIdx(-1); },
        onKeyDown:onInputKeyDown,
        placeholder:props.searchPlaceholder || (getLang()==='en' ? 'Quick search...' : 'بحث سريع...'),
        style:Object.assign({}, iSt, { height:34 }),
        onFocus:function(e){ onFocus(e); setOpen(true); },
        onBlur:function(e){ onBlur(e); setTimeout(function(){ setOpen(false); }, 120); }
      }),
      (open && shown.length > 0) ? h('div', {
        style:{
          position:'absolute', zIndex:90, left:0, right:0, top:'calc(100% + 4px)',
          background:T.bg, border:'1px solid '+T.border, borderRadius:T.radius,
          boxShadow:T.shadow, maxHeight:220, overflowY:'auto'
        }
      }, shown.map(function(o, i){
        var active = i === idx;
        return h('div', {
          key:o.value,
          onMouseDown:function(e){ e.preventDefault(); chooseOption(o); },
          style:{
            padding:'8px 10px',
            cursor:'pointer',
            fontSize:12,
            color:T.text,
            background:active ? T.accentDim : 'transparent',
            borderBottom:i < shown.length - 1 ? ('1px solid '+T.border) : 'none'
          }
        }, o.label);
      })) : null
    ),
    h('select', { value:props.value != null ? props.value : '', onChange:function(e){
      var v = e.target.value;
      props.onChange(v);
      if (searchable) {
        var picked = opts.filter(function(o){ return String(o.value) === String(v); })[0];
        if (picked) setQ(String(picked.label || ''));
      }
    }, style:selSt, onFocus:onFocus, onBlur:onBlur },
      h('option', { value:'' }, props.placeholder || (getLang()==='en' ? 'â€” Select â€”' : 'â€” Ø§Ø®ØªØ± â€”')),
      opts.map(function(o){ return h('option', { key:o.value, value:o.value }, o.label); })
    ),
    searchable && q && shown.length === 0
      ? h('div', { style:{ fontSize:11, color:T.textMute, marginTop:4 } }, getLang()==='en' ? 'No results' : 'لا توجد نتائج')
      : null
  );
}


function MultiSelect(props) {
  /* Inline checkbox grid */
  var values = props.values || [];
  var options = props.options || [];
  function toggle(val) {
    var v = String(val);
    var next = values.indexOf(v) >= 0
      ? values.filter(function(x){ return x !== v; })
      : values.concat([v]);
    props.onChange(next);
  }
  return h(Fld, { label:props.label },
    h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radius, padding:'8px 10px', background:T.bgSub, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'6px 12px' } },
      options.length === 0
        ? h('span', { style:{ fontSize:12, color:T.textMute } }, 'â€”')
        : options.map(function(o){
            var checked = values.indexOf(String(o.value)) >= 0;
            return h('label', { key:o.value, style:{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'3px 0' } },
              h('input', { type:'checkbox', checked:checked, onChange:function(){ toggle(o.value); }, style:{ accentColor:T.accent, flexShrink:0, width:14, height:14 } }),
              h('span', { style:{ fontSize:12, color: checked ? T.text : T.textMute, fontWeight: checked ? 600 : 400 } }, o.label)
            );
          })
    )
  );
}
function CheckboxGroup(props) {
  return h(MultiSelect, {
    label: props.label,
    hint: props.hint,
    values: props.value || props.values || [],
    options: props.options || [],
    onChange: props.onChange
  });
}
function parseJsonArraySafe(value, fallback) {
  fallback = Array.isArray(fallback) ? fallback : [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return fallback;
  try {
    var decoded = JSON.parse(value);
    return Array.isArray(decoded) ? decoded : fallback;
  } catch (e) {
    return fallback;
  }
}
function normalizeHolidayList(value) {
  var out = [];
  var seen = {};
  var raw = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(/[\r\n,;]+/) : []);
  raw.forEach(function(item){
    var s = String(item || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return;
    if (seen[s]) return;
    seen[s] = 1;
    out.push(s);
  });
  return out.sort();
}
function HolidayManagerField(props) {
  var lang = props.lang || 'en';
  var value = normalizeHolidayList(props.value || []);
  var _draft = useState(''); var draft = _draft[0], setDraft = _draft[1];
  var _editIdx = useState(-1); var editIdx = _editIdx[0], setEditIdx = _editIdx[1];
  function addOrUpdate() {
    var nextDate = String(draft || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return;
    var next = value.slice();
    if (editIdx >= 0 && editIdx < next.length) {
      next[editIdx] = nextDate;
    } else {
      next.push(nextDate);
    }
    props.onChange(normalizeHolidayList(next));
    setDraft('');
    setEditIdx(-1);
  }
  function removeAt(idx) {
    props.onChange(value.filter(function(_, i){ return i !== idx; }));
    if (editIdx === idx) {
      setDraft('');
      setEditIdx(-1);
    }
  }
  function startEdit(idx) {
    setEditIdx(idx);
    setDraft(value[idx] || '');
  }
  function cancelEdit() {
    setDraft('');
    setEditIdx(-1);
  }
  return h(Fld, { label:props.label || (lang==='en'?'Holidays':'العطل'), hint:props.hint || (lang==='en'?'Add dates, then edit or delete them from the list below.':'أضف التواريخ ثم عدلها أو احذفها من القائمة أدناه.') },
    h('div', { style:{ display:'flex', flexDirection:'column', gap:10 } },
      h('div', { style:{ display:'grid', gridTemplateColumns:'minmax(0,1fr) auto auto', gap:8, alignItems:'end' } },
        h(Input, {
          type:'date',
          label:lang==='en'?'Holiday Date':'تاريخ العطلة',
          value:draft,
          onChange:setDraft
        }),
        h(Btn, { variant:'primary', onClick:addOrUpdate, disabled:!/^\d{4}-\d{2}-\d{2}$/.test(draft||'') }, editIdx >= 0 ? (lang==='en'?'Update':'تحديث') : (lang==='en'?'Add':'إضافة')),
        editIdx >= 0 && h(Btn, { variant:'secondary', onClick:cancelEdit }, lang==='en'?'Cancel':'إلغاء')
      ),
      h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radius, overflow:'hidden', background:T.bg } },
        value.length
          ? h('table', { style:{ width:'100%', borderCollapse:'collapse', fontSize:12 } },
              h('thead', null,
                h('tr', { style:{ background:T.bgSub } },
                  h('th', { style:{ textAlign:'left', padding:'10px 12px', color:T.textMute, borderBottom:'1px solid '+T.border } }, lang==='en'?'Date':'التاريخ'),
                  h('th', { style:{ textAlign:'left', padding:'10px 12px', color:T.textMute, borderBottom:'1px solid '+T.border, width:140 } }, lang==='en'?'Actions':'الإجراءات')
                )
              ),
              h('tbody', null,
                value.map(function(date, idx){
                  return h('tr', { key:date, style:{ borderBottom: idx === value.length - 1 ? 'none' : ('1px solid '+T.border) } },
                    h('td', { style:{ padding:'10px 12px', color:T.text, fontWeight:600 } }, date),
                    h('td', { style:{ padding:'8px 12px' } },
                      h('div', { style:{ display:'flex', gap:8 } },
                        h(Btn, { size:'sm', variant:'secondary', onClick:function(){ startEdit(idx); } }, lang==='en'?'Edit':'تعديل'),
                        h(Btn, { size:'sm', variant:'danger', onClick:function(){ removeAt(idx); } }, lang==='en'?'Delete':'حذف')
                      )
                    )
                  );
                })
              )
            )
          : h('div', { style:{ padding:'12px', color:T.textMute, fontSize:12 } }, lang==='en'?'No holidays added yet.':'لا توجد عطل مضافة بعد.')
      )
    )
  );
}
function SupplierWorkingDaysField(props) {
  var vals = parseJsonArraySafe(props.value, [0,1,2,3,4,5,6]).map(function(v){ return String(v); });
  var names = props.lang === 'en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return h(Fld, { label:props.label, hint:props.hint },
    h('div', { style:{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8} },
      names.map(function(name, idx){
        var checked = vals.indexOf(String(idx)) >= 0;
        return h('label', { key:idx, style:{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',border:'1px solid '+T.border,borderRadius:T.radius,background:T.bgSub,cursor:'pointer',fontSize:12} },
          h('input', { type:'checkbox', checked:checked, onChange:function(e){
            var next = vals.slice();
            if (e.target.checked) {
              if (next.indexOf(String(idx)) < 0) next.push(String(idx));
            } else {
              next = next.filter(function(v){ return v !== String(idx); });
            }
            props.onChange(next.map(function(v){ return parseInt(v,10); }).sort());
          }, style:{accentColor:T.accent} }),
          h('span', null, name)
        );
      })
    )
  );
}
function WorkScheduleFields(props) {
  var form = props.form || {};
  var setForm = props.setForm;
  var lang = props.lang || 'en';
  function setField(key, value) {
    setForm(function(f){ var u={}; u[key]=value; return Object.assign({}, f, u); });
  }
  return h('div', { style:{marginTop:12,padding:12,border:'1px solid '+T.border,borderRadius:T.radiusLg,background:T.bgSub,display:'flex',flexDirection:'column',gap:12} },
    h('div', { style:{fontSize:12,fontWeight:700,color:T.text} }, props.title || (lang==='en' ? 'Working Schedule' : 'جدول العمل')),
    h('div', { style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12} },
      h(Input,{label:lang==='en'?'Workday Start':'بداية الدوام',type:'time',value:form.workday_start||'09:00',onChange:function(v){ setField('workday_start', v||'09:00'); }}),
      h(Input,{label:lang==='en'?'Workday End':'نهاية الدوام',type:'time',value:form.workday_end||'17:00',onChange:function(v){ setField('workday_end', v||'17:00'); }})
    ),
    h(SupplierWorkingDaysField,{
      label:lang==='en'?'Working Days':'أيام العمل',
      hint:lang==='en'?'Days considered business days for this calendar.':'الأيام التي تعتبر أيام عمل.',
      value:form.working_days || [0,1,2,3,4,5,6],
      onChange:function(v){ setField('working_days', v); },
      lang:lang
    }),
    h(HolidayManagerField,{
      lang:lang,
      value:form.holidays || [],
      onChange:function(v){ setField('holidays', v); }
    })
  );
}

function Modal(props) {
  return h('div', { style:{ position:'fixed', inset:0, background:'rgba(13,17,23,.45)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(3px)' }, onClick:function(e){ if(e.target===e.currentTarget) props.onClose(); } },
    h('div', { style:{ background:T.bg, borderRadius:T.radiusLg, width:'100%', maxWidth:props.width||560, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:T.shadowLg, border:'1px solid '+T.border } },
      /* sticky header */
      h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 24px', borderBottom:'1px solid '+T.border, flexShrink:0 } },
        h('div', null,
          h('div', { style:{ fontWeight:700, fontSize:15, color:T.text } }, props.title),
          props.subtitle && h('div', { style:{ fontSize:12, color:T.textMute, marginTop:2 } }, props.subtitle)
        ),
        h('button', { onClick:props.onClose, style:{ border:'none', background:'none', cursor:'pointer', color:T.textMute, fontSize:22, lineHeight:1, padding:'0 4px' } }, 'Ã—')
      ),
      /* scrollable body */
      h('div', { style:{ padding:24, overflowY:'auto', flex:1 } }, props.children),
      /* sticky footer */
      props.footer && h('div', { style:{ padding:'14px 24px', borderTop:'1px solid '+T.border, display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 } }, props.footer)
    )
  );
}

function Card(props) {
  return h('div', { style: Object.assign({ background:T.bg, border:'1px solid '+T.border, borderRadius:T.radiusLg, boxShadow:T.shadow }, props.style || {}) }, props.children);
}

function StatCard(props) {
  var colors = { accent:T.accent, green:T.green, red:T.red, amber:T.amber, blue:T.blue };
  var bgs    = { accent:T.accentDim, green:T.greenBg, red:T.redBg, amber:T.amberBg, blue:T.blueBg };
  var c = props.color || 'accent';
  return h(Card, { style:{ padding:'18px 22px' } },
    h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' } },
      h('div', null,
        h('div', { style:{ fontSize:11, fontWeight:600, color:T.textMute, letterSpacing:.5, textTransform:'uppercase', marginBottom:8 } }, props.label),
        h('div', { style:{ fontSize:28, fontWeight:700, color:T.text, lineHeight:1 } }, props.value),
        props.sub && h('div', { style:{ fontSize:12, color:T.textMute, marginTop:6 } }, props.sub)
      ),
      props.icon && h('div', { style:{ width:40, height:40, borderRadius:10, background:bgs[c]||T.accentDim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 } }, props.icon)
    )
  );
}

function UserAvatar(props) {
  /* props: user {name,avatar}, size (default 32), style */
  var user = props.user || {};
  var size = props.size || 32;
  var fontSize = Math.round(size * 0.4);
  var base = { width:size, height:size, borderRadius:'50%', flexShrink:0, objectFit:'cover', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' };
  if (user.avatar) {
    return h('img', { src:user.avatar, style:Object.assign({}, base, props.style||{}), alt:user.name||'' });
  }
  var initials = (user.name||'?').trim().split(' ').map(function(w){ return w[0]||''; }).slice(0,2).join('').toUpperCase();
  return h('div', { style:Object.assign({}, base, { background:T.accent, color:'#fff', fontWeight:700, fontSize:fontSize }, props.style||{}) }, initials);
}

function ProgressBar(props) {
  var p = Math.min(100, Math.max(0, props.value || 0));
  var c = props.color || (p >= 100 ? T.green : p >= 60 ? T.accent : T.amber);
  return h('div', { style:{ background:T.bgSub, borderRadius:99, height:5, overflow:'hidden' } },
    h('div', { style:{ width:p+'%', background:c, height:'100%', borderRadius:99, transition:'width .4s' } })
  );
}

function DataTable(props) {
  var i18n = useI18n(); var t = i18n.t;
  var cols = props.columns || [], rows = props.rows || [];
  var globalSearch = useSearch();

  /* Use global search if available, else local */
  var _q = useState(''); var localQ = _q[0], setLocalQ = _q[1];
  var q = props.useGlobalSearch !== false ? globalSearch.q : localQ;
  var setQ = props.useGlobalSearch !== false ? globalSearch.setQ : setLocalQ;

  var _sort = useState({key:null,dir:'asc'}); var sort = _sort[0], setSort = _sort[1];

  /* searchable columns = those without custom render, or explicitly marked searchable */
  var searchCols = cols.filter(function(c){ return !c.noSearch; });

  /* filter */
  var filtered = q.trim() === '' ? rows : rows.filter(function(row){
    var text = q.trim().toLowerCase();
    /* always search name_en if present */
    if (row.name_en && String(row.name_en).toLowerCase().indexOf(text) >= 0) return true;
    if (row.step_name_en && String(row.step_name_en).toLowerCase().indexOf(text) >= 0) return true;
    return searchCols.some(function(c){
      var val = c.render ? '' : (row[c.key] != null ? String(row[c.key]) : '');
      var raw = row[c.key] != null ? String(row[c.key]) : '';
      return val.toLowerCase().indexOf(text) >= 0 || raw.toLowerCase().indexOf(text) >= 0;
    });
  });

  /* sort */
  var sorted = filtered.slice();
  if (sort.key) {
    sorted.sort(function(a, b){
      var av = a[sort.key] != null ? a[sort.key] : '';
      var bv = b[sort.key] != null ? b[sort.key] : '';
      var aStr = String(av).toLowerCase();
      var bStr = String(bv).toLowerCase();
      var aNum = parseFloat(av);
      var bNum = parseFloat(bv);
      var cmp = (!isNaN(aNum) && !isNaN(bNum)) ? (aNum - bNum) : (aStr < bStr ? -1 : aStr > bStr ? 1 : 0);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  function toggleSort(key) {
    setSort(function(prev){
      if (prev.key === key) return { key:key, dir:prev.dir==='asc'?'desc':'asc' };
      return { key:key, dir:'asc' };
    });
  }

  var showSearch = props.search !== false && rows.length > 0 && props.useGlobalSearch === false;

  return h('div', null,
    /* Search bar â€” only shown if NOT using global topbar search */
    showSearch && h('div', { style:{ marginBottom:12, display:'flex', alignItems:'center', gap:8 } },
      h('div', { style:{ position:'relative', flex:1, maxWidth:360 } },
        h('span', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'right':'left']:12, color:T.textMute, fontSize:14, pointerEvents:'none' } }, '🔍'),
        h('input', {
          value:q, onChange:function(e){ setQ(e.target.value); },
          placeholder: props.searchPlaceholder || t('search')+'...',
          style:{ width:'100%', padding: i18n.isRtl ? '8px 36px 8px 12px' : '8px 12px 8px 36px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, outline:'none', background:T.bg, color:T.text, fontFamily:'inherit' },
          onFocus:function(e){ e.target.style.borderColor=T.accent; },
          onBlur:function(e){ e.target.style.borderColor=T.border; },
        })
      ),
      q && h('button', { onClick:function(){ setQ(''); }, style:{ padding:'7px 12px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:12, fontFamily:'inherit' } }, '✕'),
      q && h('span', { style:{ fontSize:12, color:T.textMute } }, sorted.length + ' / ' + rows.length)
    ),
    h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radiusLg, overflow:'hidden' } },
      h('table', { style:{ width:'100%', borderCollapse:'collapse', fontSize:13 } },
        h('thead', null,
          h('tr', { style:{ background:T.bgSub } },
            cols.map(function(c, i){
              var isSorted = sort.key === c.key;
              var sortable = !c.noSort;
              var labelText = c.label;
              if (typeof labelText === 'string') {
                if (typeof repairText === 'function') labelText = repairText(labelText);
                if (i18n && i18n.lang === 'ar' && typeof window !== 'undefined' && typeof window.cspsrTranslateKnownUiText === 'function') {
                  labelText = window.cspsrTranslateKnownUiText(labelText);
                }
              }
              return h('th', {
                key:i,
                onClick: sortable && c.key ? function(){ toggleSort(c.key); } : undefined,
                style:{ padding:'10px 16px', textAlign:'start', borderBottom:'1px solid '+T.border, color: isSorted ? T.accent : T.textMute, fontWeight:600, fontSize:11, letterSpacing:.5, textTransform:'uppercase', whiteSpace:'nowrap', cursor: sortable && c.key ? 'pointer' : 'default', userSelect:'none', transition:'color .15s' }
              },
                h('span', { style:{ display:'inline-flex', alignItems:'center', gap:5 } },
                  labelText,
                  sortable && c.key && h('span', { style:{ fontSize:11, fontWeight:700, lineHeight:1, opacity: isSorted ? 1 : 0.4, color: isSorted ? T.accent : 'inherit' } },
                    isSorted ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'
                  )
                )
              );
            }),
            (props.onEdit || props.onDelete || props.actions || props.extraActions) && h('th', { style:{ padding:'10px 16px', background:T.bgSub, borderBottom:'1px solid '+T.border, width:220 } })
          )
        ),
        h('tbody', null,
          !sorted.length
            ? h('tr', null, h('td', { colSpan:99, style:{ padding:'40px 20px', textAlign:'center', color:T.textMute, fontSize:13 } }, q ? (t('no_results_q')+' "'+q+'"') : (props.empty || t('no_data'))))
            : sorted.map(function(row, ri) {
                return h('tr', { key:ri, style:{ borderBottom:'1px solid '+T.border }, onMouseEnter:function(e){ e.currentTarget.style.background=T.bgSub; }, onMouseLeave:function(e){ e.currentTarget.style.background=''; } },
                  cols.map(function(c, ci){ return h('td', { key:ci, style:{ padding:'11px 16px', color:T.text } }, c.render ? c.render(row) : (row[c.key] != null ? row[c.key] : '—')); }),
                  (props.onEdit || props.onDelete || props.actions || props.extraActions) && h('td', { style:{ padding:'8px 16px' } },
                    h('div', { style:{ display:'flex', gap:4, justifyContent:'flex-end', flexWrap:'nowrap', whiteSpace:'nowrap' } },
                      props.extraActions && props.extraActions(row),
                      props.actions && props.actions(row),
                      props.onEdit && h(Btn, { size:'sm', variant:'secondary', onClick:function(){ props.onEdit(row); } }, t('edit')),
                      props.onDelete && h(Btn, { size:'sm', variant:'danger', onClick:function(){ if(confirm(t('confirm_delete'))) props.onDelete(row); } }, t('delete'))
                    )
                  )
                );
              })
        )
      )
    )
  );
}

function PageHeader(props) {
  return h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 } },
    h('div', null,
      h('h1', { style:{ margin:0, fontSize:20, fontWeight:700, color:T.text } }, props.title),
      props.subtitle && h('p', { style:{ margin:'4px 0 0', fontSize:13, color:T.textMute } }, props.subtitle)
    ),
    props.action
  );
}

function Divider(props) {
  return h('div', { style:{ display:'flex', alignItems:'center', gap:10, margin:'18px 0' } },
    h('div', { style:{ flex:1, height:1, background:T.border } }),
    props.label && h('span', { style:{ fontSize:11, color:T.textMute, fontWeight:600, letterSpacing:.5, textTransform:'uppercase' } }, props.label),
    h('div', { style:{ flex:1, height:1, background:T.border } })
  );
}

/* â•â•â• SETUP WIZARD â•â•â• */
function SetupWizard(props) {
  var _step = useState(1); var step = _step[0], setStep = _step[1];
  var _name = useState(''); var sysName = _name[0], setSysName = _name[1];
  var _logo = useState(''); var logoB64 = _logo[0], setLogoB64 = _logo[1];
  var _prev = useState(''); var logoPrev = _prev[0], setLogoPrev = _prev[1];
  var _err  = useState(''); var nameErr = _err[0], setNameErr = _err[1];
  var _sav  = useState(false); var saving = _sav[0], setSaving = _sav[1];
  var fileRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    var r = new FileReader();
    r.onload = function(e) { setLogoB64(e.target.result); setLogoPrev(e.target.result); };
    r.readAsDataURL(f);
  }
  function next() {
    if (step === 1) {
      if (!sysName.trim()) { setNameErr(t('name_required')); return; }
      apiFetch('setup', { method:'POST', body:JSON.stringify({ system_name:sysName }) }).then(function(){ setStep(2); }).catch(function(){ setStep(2); });
    } else if (step === 2) {
      setSaving(true);
      apiFetch('setup', { method:'POST', body:JSON.stringify({ logo_base64:logoB64, mark_done:true }) }).then(function(){ setSaving(false); setStep(3); }).catch(function(){ setSaving(false); setStep(3); });
    } else {
      props.onComplete({ system_name:sysName, logo_base64:logoB64 });
    }
  }
  function skip() {
    apiFetch('setup', { method:'POST', body:JSON.stringify({ mark_done:true }) }).then(function(){
      props.onComplete({ system_name:sysName, logo_base64:'' });
    }).catch(function(){ props.onComplete({ system_name:sysName, logo_base64:'' }); });
  }

  var btnSt = { width:'100%', padding:'13px', borderRadius:10, border:'none', background:T.accent, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', marginTop:4 };

  var i18n_sw = useI18n(); var t = i18n_sw.t; var isRtl = i18n_sw.isRtl; var dir = isRtl ? 'rtl' : 'ltr';
  return h('div', { style:{ minHeight:'100vh', background:T.bgSub, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", direction:dir, padding:20 } },
    h('div', { style:{ position:'fixed', top:0, right:isRtl?0:undefined, left:isRtl?undefined:0, bottom:0, width:3, background:'linear-gradient(to bottom,#635bff,#0055d4,#09825d)' } }),
    h('div', { style:{ width:'100%', maxWidth:460 } },
      h('div', { style:{ textAlign:'center', marginBottom:28 } },
        h('div', { style:{ display:'inline-flex', width:48, height:48, borderRadius:12, background:T.accent, alignItems:'center', justifyContent:'center', marginBottom:10 } },
          h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none' },
            h('path', { d:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', stroke:'#fff', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' })
          )
        ),
        h('div', { style:{ fontSize:12, color:T.textMute, fontWeight:500 } }, t('setup_system'))
      ),
      h('div', { style:{ background:T.bg, border:'1px solid '+T.border, borderRadius:16, padding:'36px 40px', boxShadow:'0 4px 24px rgba(0,0,0,.06)' } },
        /* Progress steps */
        h('div', { style:{ display:'flex', marginBottom:32 } },
          [1,2,3].map(function(i, idx) {
            return h('div', { key:i, style:{ flex:1, display:'flex', alignItems:'center' } },
              h('div', { style:{ width:28, height:28, borderRadius:'50%', flexShrink:0, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', background:step >= i ? T.accent : T.bgSub, color:step >= i ? '#fff' : T.textMute, border:'2px solid '+(step >= i ? T.accent : T.border), transition:'all .3s' } }, step > i ? t('complete_btn') : i),
              idx < 2 && h('div', { style:{ flex:1, height:2, background:step > i ? T.accent : T.border, transition:'background .3s' } })
            );
          })
        ),
        /* Step 1 */
        step === 1 && h('div', null,
          h('h2', { style:{ margin:'0 0 6px', fontSize:22, fontWeight:700, color:T.text } }, t('system_name_title')),
          h('p', { style:{ margin:'0 0 24px', fontSize:14, color:T.textMute, lineHeight:1.7 } }, t('system_name_hint')),
          h('input', { value:sysName, autoFocus:true, onChange:function(e){ setSysName(e.target.value); setNameErr(''); }, onKeyDown:function(e){ if(e.key==='Enter') next(); }, placeholder:t('system_name_placeholder'), style:{ width:'100%', padding:'13px 16px', fontSize:15, color:T.text, border:'1.5px solid '+(nameErr?T.red:T.border), borderRadius:10, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fafbfc', marginBottom:4 } }),
          nameErr && h('div', { style:{ color:T.red, fontSize:12, marginBottom:8 } }, nameErr),
          h('button', { onClick:next, style:btnSt }, t('next'))
        ),
        /* Step 2 */
        step === 2 && h('div', null,
          h('h2', { style:{ margin:'0 0 6px', fontSize:22, fontWeight:700, color:T.text } }, t('logo_title')),
          h('p', { style:{ margin:'0 0 20px', fontSize:14, color:T.textMute, lineHeight:1.7 } }, t('logo_hint')),
          h('div', {
            onClick:function(){ if(fileRef.current) fileRef.current.click(); },
            onDrop:function(e){ e.preventDefault(); handleFile(e.dataTransfer.files[0]); },
            onDragOver:function(e){ e.preventDefault(); },
            style:{ border:'2px dashed '+T.borderDark, borderRadius:12, padding:'32px 20px', textAlign:'center', cursor:'pointer', marginBottom:16, background:logoPrev?'#fafbfc':T.bgSub }
          },
            logoPrev
              ? h('img', { src:logoPrev, style:{ maxHeight:90, maxWidth:'70%', objectFit:'contain', borderRadius:8 } })
              : h('div', null, h('div', { style:{ fontSize:36, marginBottom:8 } }, 'ðŸ–¼ï¸'), h('div', { style:{ color:T.textMid, fontSize:14, fontWeight:500 } }, t('drag_logo')), h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } }, t('logo_formats'))),
            h('input', { ref:fileRef, type:'file', accept:'image/*', style:{ display:'none' }, onChange:function(e){ handleFile(e.target.files[0]); } })
          ),
          h('div', { style:{ display:'flex', gap:10 } },
            h('button', { onClick:skip, style:{ flex:1, padding:'12px', borderRadius:10, border:'1px solid '+T.border, background:T.bg, color:T.textMute, fontSize:14, cursor:'pointer', fontFamily:'inherit' } }, t('skip')),
            h('button', { onClick:next, disabled:saving, style:Object.assign({}, btnSt, { flex:2, margin:0, opacity:saving?0.7:1 }) }, saving ? t('saving') : t('save_continue'))
          )
        ),
        /* Step 3 */
        step === 3 && h('div', { style:{ textAlign:'center', padding:'8px 0' } },
          h('div', { style:{ fontSize:56, marginBottom:16, animation:'csBounce .6s' } }, 'ðŸŽ‰'),
          h('h2', { style:{ margin:'0 0 8px', fontSize:22, fontWeight:700, color:T.text } }, t('setup_done')),
          h('p', { style:{ color:T.textMute, fontSize:14, margin:'0 0 4px' } }, t('setup_success')),
          h('p', { style:{ color:T.accent, fontSize:18, fontWeight:700, margin:'0 0 20px' } }, sysName),
          logoPrev && h('img', { src:logoPrev, style:{ maxHeight:52, maxWidth:160, objectFit:'contain', margin:'0 auto 20px', display:'block', borderRadius:6 } }),
          h('button', { onClick:next, style:btnSt }, t('enter_system'))
        )
      )
    )
  );
}

/* â•â•â• SIDEBAR â•â•â• */
var NAV = [
  {id:'dashboard',icon:'\u229e',key:'dashboard'},
  {id:'orders',icon:'\u2261',key:'orders'},
  {id:'completed-orders',icon:'\u2713',key:'completed_orders'},
  {id:'kds',icon:'\u229f',key:'kds'},
  null,
  {id:'customers',icon:'\u25cb',key:'customers'},
  {id:'suppliers',icon:'\u25c9',key:'suppliers'},
  {id:'products',icon:'\u25c8',key:'products'},
  {id:'steps',icon:'\u25b3',key:'product_workflow'},
  null,
  /* â”€â”€ Tasks group â”€â”€ */
  {id:'_label_tasks',type:'label',key:'tasks_label'},
  {id:'ops-tasks',icon:'\u2699',key:'operations_tasks',indent:true},
  {id:'my-tasks',icon:'\u2690',key:'my_tasks',indent:true},
  {id:'external-tasks',icon:'\u21d2',key:'external_tasks',indent:true},
  {id:'delivery-orders',icon:h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',xmlns:'http://www.w3.org/2000/svg',style:{display:'block'}},
    h('path',{d:'M12 2 21 7v10l-9 5-9-5V7l9-5Z',stroke:'currentColor',strokeWidth:1.8,strokeLinejoin:'round'}),
    h('path',{d:'M12 2v10l9-5',stroke:'currentColor',strokeWidth:1.8,strokeLinejoin:'round'}),
    h('path',{d:'M12 12 3 7',stroke:'currentColor',strokeWidth:1.8,strokeLinejoin:'round'})
  ),key:'delivery_orders',indent:true},
  {id:'reports',icon:'\u25ab',key:'perm_reports',indent:true},
  {id:'notifications',icon:'\u25ce',key:'notifications'},
  null,
  {id:'employees',icon:'\u25cb',key:'employees'},
  {id:'departments',icon:'\u25a6',key:'departments'},
  {id:'teams',icon:'\u25c8',key:'teams'},
  {id:'roles',icon:'\u25c6',key:'roles'},
  {id:'statuses',icon:'\u25cf',key:'statuses'},
  null,
  {id:'users',icon:'\ud83d\udc65',key:'users_mgmt',role:'admin'},
  {id:'settings',icon:'\u2699',key:'settings',role:'admin'},
];

function Sidebar(props) {
  var _c = useState(false); var col = _c[0], setCol = _c[1];
  var i18n = useI18n(); var t = i18n.t, lang = i18n.lang, setLang = i18n.setLang, isRtl = i18n.isRtl;
  var name = (props.branding && props.branding.system_name) || 'Production';
  var logo = props.branding && (props.branding.logo_base64 || props.branding.logo_url);
  useEffect(function(){
    try {
      document.documentElement.style.setProperty('--cspsr-sidebar-width', (col ? 56 : 220) + 'px');
    } catch(e) {}
  }, [col]);

  return h('nav', { style:{ width:col?56:220, background:T.sidebar, height:'100vh', position:'fixed', top:0, left:isRtl?'auto':0, right:isRtl?0:'auto', display:'flex', flexDirection:'column', flexShrink:0, transition:'width .2s', borderLeft:isRtl?'1px solid rgba(255,255,255,.06)':'none', borderRight:isRtl?'none':'1px solid rgba(255,255,255,.06)', overflowX:'hidden', overflowY:'hidden', zIndex:400 } },
    h('div', { onClick:function(){ setCol(function(c){ return !c; }); }, style:{ padding:col?'14px 0':'14px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.06)', justifyContent:col?'center':'flex-start', minHeight:56, flexShrink:0 } },
      logo
        ? h('img', { src:logo, style:{ width:28, height:28, objectFit:'contain', borderRadius:5, flexShrink:0 } })
        : h('div', { style:{ width:28, height:28, borderRadius:7, background:T.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13, flexShrink:0 } }, name[0] ? name[0].toUpperCase() : 'P'),
      !col && h('div', { style:{ overflow:'hidden', flex:1 } },
        h('div', { style:{ color:'#f0f6fc', fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, name),
        h('div', { style:{ color:T.sidebarMut, fontSize:10, marginTop:1 } }, t('production_system'))
      )
    ),
    h('div', { style:{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0', display:'flex', flexDirection:'column' } },
      NAV.map(function(item, i) {
        if (!item) return h('div', { key:'d'+i, style:{ height:1, background:'rgba(255,255,255,.04)', margin:'5px 0' } });
        if (item.type === 'label') {
          if (col) return null;
          return h('div', { key:item.id, style:{ padding:'8px 16px 2px', fontSize:10, fontWeight:700, color:T.sidebarMut, textTransform:'uppercase', letterSpacing:1 } }, t(item.key));
        }
        /* hide role-restricted items */
        if (item.role) {
          var au = props.authUser;
          var userRole = au ? String(au.role||'').replace(/['"]/g,'').trim().toLowerCase() : '';
          var requiredRole = item.role.toLowerCase();
          if (userRole !== requiredRole) return null;
        }
        var active = props.tab === item.id;
        var indentPad = item.indent && !col ? '8px 16px 8px 28px' : (col ? '9px 0' : '9px 16px');
        return h('button', {
          key:item.id,
          type:'button',
          onClick:function(){
            var nextId = normalizeTabId(item.id, 'dashboard');
            try { persistActiveTab(nextId); } catch(_e0) {}
            props.setTab(nextId);
          },
          title:col?t(item.key):undefined,
          style:{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:indentPad, justifyContent:col?'center':'flex-start', border:'none', cursor:'pointer', position:'relative', background:active?'rgba(99,91,255,.25)':'transparent', color:active?'#ffffff':T.sidebarTxt, fontSize:item.indent?12:13, fontWeight:active?700:400, fontFamily:'inherit', transition:'color .15s,background .15s', borderLeft: isRtl&&active ? '3px solid '+T.accent : '3px solid transparent', borderRight: !isRtl&&active ? '3px solid '+T.accent : '3px solid transparent' },
          onMouseEnter:function(e){ if(!active){ e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='#f0f6fc'; } },
          onMouseLeave:function(e){ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.sidebarTxt; } },
        },
          h('span', {
            style:{
              width:18,
              minWidth:18,
              textAlign:'center',
              fontSize:14,
              lineHeight:'1',
              opacity:active?1:0.78,
              flexShrink:0
            }
          }, item.icon || '•'),
          !col && h('span', { style:{ whiteSpace:'nowrap', flex:1, textAlign:'start' } }, t(item.key)),
          col && h('span', { style:{ fontSize:11, fontWeight:700, opacity:active?1:0.7 } }, '•')
        );
      }),
      h('div', { style:{ flex:1 } })
    ),
    h('div', { style:{ flexShrink:0, height:4 } })
  );
}

/* â•â•â• DASHBOARD â•â•â• */
function DashboardView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders    = asArr(bs.orders);
  var customers = asArr(bs.customers);
  var employees = asArr(bs.employees);
  var allTasks  = asArr(bs['ops-tasks']);
  useTopbar(t('overview'), null);
  var _cmp = useState(false); var showCompare = _cmp[0], setShowCompare = _cmp[1];
  var _cmpPie = useState(false); var showComparePie = _cmpPie[0], setShowComparePie = _cmpPie[1];
  var _pdModal = useState(false); var showPartialModal = _pdModal[0]; var setShowPartialModal = _pdModal[1];

  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0);

  /* â”€â”€ Active orders classification â”€â”€ */
  var active         = orders.filter(function(o){ return !isDone(o); });
  var inProg         = active.filter(function(o){ return !orderAtDelivery(o) && !asArr(o.items).some(function(i){ return itemProductionDone(i)&&!itemDelivered(i); }); });
  var readyDel       = active.filter(function(o){ return orderAtDelivery(o); });
  function hasExplicitPartialDelivery(o){
    var items = asArr(o.items);
    if (items.length <= 1 || orderAtDelivery(o)) return false;
    return items.some(function(i){
      return !itemDelivered(i) && !!i.delivery_batch_id;
    });
  }
  var partialDel = active.filter(hasExplicitPartialDelivery);
  var urgentOrders   = active.filter(function(o){ return o.is_urgent==1; });

  /* â”€â”€ Time totals for active orders â”€â”€ */
  var totalExpectedMins = 0;
  var totalActualMins   = 0;
  active.forEach(function(o){
    totalExpectedMins += orderExpectedMins(o, bs.product_steps);
    totalActualMins += orderActualStats(o).mins;
  });
  totalExpectedMins = Math.round(totalExpectedMins);
  totalActualMins   = Math.round(totalActualMins);
  var totalDiffMins = totalActualMins - totalExpectedMins;
  var totalTimeStatus = totalExpectedMins > 0
    ? (totalDiffMins <= 0 ? (totalDiffMins < -5 ? 'ahead' : 'on_time') : 'late')
    : null;
  var monthOrders = orders.filter(function(o){
    var d = new Date((o.started_at||o.created_at||'').replace(' ','T'));
    return d >= monthStart && d <= monthEnd;
  });

  /* â”€â”€ Active / Inactive clients this month â”€â”€ */
  var activeClientIds = {};
  monthOrders.forEach(function(o){ if(o.customer_id) activeClientIds[o.customer_id]=1; });
  var activeClients   = customers.filter(function(c){ return activeClientIds[c.id]; });
  var inactiveClients = customers.filter(function(c){ return !activeClientIds[c.id]; });

  /* â”€â”€ Tasks this month â”€â”€ */
  var monthTasks = allTasks.filter(function(task){
    var d = new Date((task.created_at||'').replace(' ','T'));
    return d >= monthStart;
  });

  /* â”€â”€ Top 3 clients by order count THIS MONTH â”€â”€ */
  var custOrderCount = {};
  monthOrders.forEach(function(o){ if(o.customer_id) custOrderCount[String(o.customer_id)]=(custOrderCount[String(o.customer_id)]||0)+1; });
  var topClients = customers.filter(function(c){ return custOrderCount[String(c.id)]; }).sort(function(a,b){
    return (custOrderCount[String(b.id)]||0)-(custOrderCount[String(a.id)]||0);
  }).slice(0,3);
  var maxCount = topClients.length ? (custOrderCount[String(topClients[0].id)]||1) : 1;

  /* â”€â”€ Monthly orders for year chart â”€â”€ */
  var monthlyOrders = [];
  var monthlyOrdersPrev = [];
  for(var m=0;m<12;m++){
    var ms = new Date(now.getFullYear(),m,1);
    var me = new Date(now.getFullYear(),m+1,0);
    var msPrev = new Date(now.getFullYear()-1,m,1);
    var mePrev = new Date(now.getFullYear()-1,m+1,0);
    var cnt = orders.filter(function(o){
      var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
      return d>=ms&&d<=me;
    }).length;
    var cntPrev = orders.filter(function(o){
      var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
      return d>=msPrev&&d<=mePrev;
    }).length;
    var arMonths=['ÙƒØ§Ù†ÙˆÙ†Ø«','Ø´Ø¨Ø§Ø·','Ø¢Ø°Ø§Ø±','Ù†ÙŠØ³Ø§Ù†','Ø¢ÙŠØ§Ø±','Ø­Ø²ÙŠØ±Ø§Ù†','ØªÙ…ÙˆØ²','Ø¢Ø¨','Ø£ÙŠÙ„ÙˆÙ„','ØªØ´Ø±ÙŠÙ†Ø£','ØªØ´Ø±ÙŠÙ†Ø«','ÙƒØ§Ù†ÙˆÙ†Ø£'];
    var enMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var monthLabel = lang==='en' ? enMonths[m] : arMonths[m];
    monthlyOrders.push({month:monthLabel, count:cnt});
    monthlyOrdersPrev.push({month:monthLabel, count:cntPrev});
  }
  var maxMonthly = Math.max.apply(null,
    monthlyOrders.map(function(m){return m.count;}).concat(monthlyOrdersPrev.map(function(m){return m.count;}))
  ) || 1;

  /* Employee of Month — points system (custom rules) */
  var empPoints = {};
  var empOnTime = {};
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if ((s.status_slug==='done'||s.status_slug==='completed') && s.completed_at) {
          var compDate = new Date(s.completed_at.replace(' ','T'));
          if (compDate < monthStart) return;
          var ids = [];
          try { ids = typeof s.completed_by_ids==='string'?JSON.parse(s.completed_by_ids||'[]'):(s.completed_by_ids||[]); } catch(e){}
          if (!ids.length) {
            try { ids = typeof s.assigned_employee_ids==='string'?JSON.parse(s.assigned_employee_ids||'[]'):(s.assigned_employee_ids||[]); } catch(e2){}
            if (s.assigned_employee_id) ids = ids.concat([s.assigned_employee_id]);
          }
          var isDelivery = parseInt(s.is_delivery,10) === 1;
          var dir = String(s.delivery_direction || '').toLowerCase().trim();
          // If client received directly, do not bind/award delivery employee points.
          if (isDelivery && dir === 'received_by_client') ids = [];
          ids.forEach(function(eid){
            var key=String(eid);
            if(!empPoints[key]) empPoints[key]=0;
            if(!empOnTime[key]) empOnTime[key]=0;
            var points = 0;
            var expectedAt = order.deadline || s.expected_end || order.delivery_date || null;
            var exp = expectedAt ? new Date(String(expectedAt).replace(' ','T')) : null;
            var comp = s.completed_at ? new Date(String(s.completed_at).replace(' ','T')) : null;
            var hasDeadline = !!(exp && comp && isFinite(exp.getTime()) && isFinite(comp.getTime()));
            var isLate = false;
            if (hasDeadline) isLate = comp.getTime() > exp.getTime();

            if (isDelivery) {
              // Delivery rule: with deadline +5 (not-late only).
              if (hasDeadline && comp.getTime() <= exp.getTime()) points = 5;
            } else {
              // Internal + External: before +10, at deadline +5, after -5.
              if (hasDeadline) {
                if (comp.getTime() < exp.getTime()) points = 10;
                else if (comp.getTime() === exp.getTime()) points = 5;
                else points = -5;
              }
            }
            empPoints[key] += points;
            if (!isLate && hasDeadline) empOnTime[key]++;
          });
        }
      });
    });
  });
  var eomId = null, eomPts = -9999, eomOnTime = -1;
  Object.keys(empPoints).forEach(function(id){
    var pts = empPoints[id];
    var onTime = empOnTime[id] || 0;
    if (pts > eomPts || (pts === eomPts && onTime > eomOnTime)) {
      eomPts = pts; eomId = id; eomOnTime = onTime;
    }
  });
  var eomEmp = eomId ? findBy(employees,'id',parseInt(eomId)) : null;
  var arMonthsFull=['\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u062b\u0627\u0646\u064a','\u0634\u0628\u0627\u0637','\u0622\u0630\u0627\u0631','\u0646\u064a\u0633\u0627\u0646','\u0622\u064a\u0627\u0631','\u062d\u0632\u064a\u0631\u0627\u0646','\u062a\u0645\u0648\u0632','\u0622\u0628','\u0623\u064a\u0644\u0648\u0644','\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u0623\u0648\u0644','\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u062b\u0627\u0646\u064a','\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u0623\u0648\u0644'];
  var monthName = lang==='en'
    ? now.toLocaleString('en-US',{month:'long',year:'numeric'})
    : arMonthsFull[now.getMonth()] + ' ' + now.getFullYear();

  /* â”€â”€ Stat card component â”€â”€ */
  function BigStat(p){
    var colors = {blue:{bg:'#eff6ff',text:'#1d4ed8',border:'#bfdbfe'},green:{bg:'#f0fdf4',text:'#15803d',border:'#bbf7d0'},red:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},amber:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},purple:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'}};
    var c = colors[p.color]||colors.blue;
    var clickable = !!p.onClick;
    return h('div',{
      onClick: p.onClick || undefined,
      style:{
        background:c.bg,border:'1px solid '+c.border,borderRadius:T.radiusLg,
        padding:'16px 18px',display:'flex',flexDirection:'column',gap:4,
        cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'transform .12s,box-shadow .12s' : undefined,
        boxShadow: clickable ? T.shadow : undefined
      },
      onMouseEnter: clickable ? function(e){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'; } : undefined,
      onMouseLeave: clickable ? function(e){ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=T.shadow; } : undefined
    },
      h('div',{style:{fontSize:20}},p.icon),
      h('div',{style:{fontSize:28,fontWeight:800,color:c.text,lineHeight:1}},p.value),
      h('div',{style:{fontSize:12,fontWeight:600,color:c.text,opacity:.8}},p.label),
      clickable && h('div',{style:{fontSize:10,color:c.text,opacity:.5,marginTop:2}},lang==='en'?'Click to view':'اضغط للعرض')
    );
  }

  return h('div',{style:{padding:'0 2px'}},

    /* ROW 1 â€” 4 status cards */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(BigStat,{icon:'⚙',label:lang==='en'?'In Progress':'قيد الإنتاج',value:inProg.length,color:'blue'}),
      h(BigStat,{icon:'🚚',label:lang==='en'?'Ready to Deliver':'جاهز للتوصيل',value:readyDel.length,color:'green'}),
      h(BigStat,{icon:'📦',label:lang==='en'?'Partial Delivery':'توصيل جزئي',value:partialDel.length,color:'amber',onClick:partialDel.length>0?function(){ setShowPartialModal(true); }:undefined}),
      h(BigStat,{icon:'●',label:lang==='en'?'Urgent':'عاجل',value:urgentOrders.length,color:'red'})
    ),

    /* TIME SUMMARY â€” active orders production time */
    h(Card,{style:{padding:'14px 18px',marginBottom:14}},
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
      (lang==='en'?'Production Time - Active Orders':'وقت الإنتاج - الطلبات النشطة')
        ),
        active.length > 0 && h('span',{style:{fontSize:11,color:T.textMute}},
          active.length+(lang==='en'?' active orders':' طلب نشط')
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},
        /* Expected */
        h('div',{style:{background:'#eff6ff',borderRadius:T.radius,padding:'10px 14px',border:'1px solid #bfdbfe'}},
          h('div',{style:{fontSize:11,color:'#1d4ed8',fontWeight:600,marginBottom:4}},
            lang==='en'?'Total Expected':'المتوقع الإجمالي'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,color:'#1d4ed8'}},
            totalExpectedMins > 0 ? fmtMin(totalExpectedMins) : '--'
          )
        ),
        /* Actual */
        h('div',{style:{
          background: totalTimeStatus==='late'?'#fef2f2': totalTimeStatus==='ahead'?'#f0fdf4':'#f8fafc',
          borderRadius:T.radius,padding:'10px 14px',
          border:'1px solid '+(totalTimeStatus==='late'?'#fecaca':totalTimeStatus==='ahead'?'#bbf7d0':'#e2e8f0')
        }},
          h('div',{style:{fontSize:11,fontWeight:600,marginBottom:4,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            lang==='en'?'Total Actual':'الفعلي الإجمالي'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalActualMins > 0 ? fmtMin(totalActualMins) : '--'
          )
        ),
        /* Diff */
        h('div',{style:{
          background: totalTimeStatus==='late'?'#fef2f2': totalTimeStatus==='ahead'?'#f0fdf4':'#f8fafc',
          borderRadius:T.radius,padding:'10px 14px',
          border:'1px solid '+(totalTimeStatus==='late'?'#fecaca':totalTimeStatus==='ahead'?'#bbf7d0':'#e2e8f0')
        }},
          h('div',{style:{fontSize:11,fontWeight:600,marginBottom:4,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalTimeStatus==='late'
              ? (lang==='en'?'Behind':'متأخر')
              : totalTimeStatus==='ahead'
              ? (lang==='en'?'Ahead':'أسرع')
              : (lang==='en'?'On Track':'في الوقت')
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalExpectedMins > 0 && totalActualMins > 0
              ? (totalDiffMins > 0 ? '+' : '') + fmtMin(Math.abs(totalDiffMins))
              : '--'
          )
        )
      )
    ),

    /* ROW 2 â€” 4 month stats */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Active Clients':'عملاء نشطون'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.green}},activeClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'هذا الشهر')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Inactive Clients':'عملاء غير نشطين'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.red}},inactiveClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'هذا الشهر')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Tasks This Month':'مهام الشهر'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.accent}},monthTasks.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},monthName)
      ),
      /* Employee of Month â€” square full bleed avatar */
      h('div',{style:{
        borderRadius:T.radiusLg,
        overflow:'hidden',
        position:'relative',
        aspectRatio:'1/1',
        background: eomEmp && (eomEmp.avatar_url||eomEmp.avatar)
          ? 'url('+(eomEmp.avatar_url||eomEmp.avatar)+') center/cover no-repeat'
          : 'linear-gradient(135deg,#f59e0b,#d97706)',
        boxShadow:'0 2px 8px rgba(0,0,0,.15)'
      }},
        /* dark overlay */
        h('div',{style:{
          position:'absolute',inset:0,
          background:'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.2) 60%, transparent 100%)'
        }}),
        /* badge top */
        h('div',{style:{
          position:'absolute',top:10,right:10,
          background:'#f59e0b',color:'#fff',
          borderRadius:99,padding:'3px 10px',
          fontSize:10,fontWeight:800,
          letterSpacing:.5,
          boxShadow:'0 2px 6px rgba(245,158,11,.5)'
        }},lang==='en'?'OF THE MONTH':'موظف الشهر'),
        /* content bottom */
        h('div',{style:{
          position:'relative',
          padding:'64px 14px 14px',
          display:'flex',flexDirection:'column'
        }},
          eomEmp
            ? h('div',null,
                /* If no avatar show initials big */
                !(eomEmp.avatar_url||eomEmp.avatar) && h('div',{style:{
                  fontSize:40,fontWeight:800,color:'rgba(255,255,255,.3)',
                  position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
                  fontFamily:'system-ui'
                }},((eomEmp.name||'?')[0]||'?').toUpperCase()),
                h('div',{style:{fontWeight:800,fontSize:15,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.5)'}},(lang==='en'&&eomEmp.name_en)?eomEmp.name_en:eomEmp.name),
                h('div',{style:{
                  display:'inline-flex',alignItems:'center',gap:4,
                  background:'rgba(255,255,255,.2)',
                  backdropFilter:'blur(4px)',
                  color:'#fef9c3',borderRadius:99,
                  padding:'2px 10px',fontSize:11,fontWeight:700,marginTop:4
                }},'PTS '+eomPts+' '+(lang==='en'?'pts':'نقطة'))
              )
            : h('div',{style:{fontSize:12,color:'rgba(255,255,255,.7)',paddingTop:20}},
                lang==='en'?'No data yet':'لا توجد بيانات بعد')
        )
      )
    ),

    /* ROW 3 â€” Top clients + Annual chart + Pie chart */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},

      /* Top 3 clients */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text,marginBottom:2}},lang==='en'?'Top Clients':'أفضل الزبائن'),
        h('div',{style:{fontSize:11,color:T.textMute,marginBottom:12}},monthName),
        topClients.length===0
          ? h('div',{style:{color:T.textMute,fontSize:12}},lang==='en'?'No data':'Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª')
          : topClients.map(function(c,i){
              var cnt = custOrderCount[String(c.id)]||0;
              var pct = Math.round((cnt/maxCount)*100);
              var medals = ['ðŸ¥‡','ðŸ¥ˆ','ðŸ¥‰'];
              var name = c.company_name_en||c.company_name||c.name_en||c.name||'â€”';
              return h('div',{key:c.id,style:{marginBottom:i<topClients.length-1?12:0}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                    h('span',{style:{fontSize:14}},String(i+1)+'.'),
                    h('span',{style:{fontSize:13,fontWeight:600,color:T.text}},name)
                  ),
                  h('span',{style:{fontSize:12,color:T.textMute,fontWeight:600}},cnt+' '+(lang==='en'?'orders':'طلب'))
                ),
                h('div',{style:{background:T.bgSub,borderRadius:99,height:6,overflow:'hidden'}},
                  h('div',{style:{width:pct+'%',height:'100%',borderRadius:99,background:i===0?'#f59e0b':i===1?'#9ca3af':'#cd7c32',transition:'width .5s'}})
                )
              );
            })
      ),

      /* Annual orders chart */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
            lang==='en'?'Orders This Year':'الطلبات هذا العام'
          ),
          h('button',{
            onClick:function(){ setShowCompare(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showCompare?T.accent:T.border),background:showCompare?T.accentDim:'transparent',color:showCompare?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'Ù…Ù‚Ø§Ø±Ù†Ø© '+(now.getFullYear()-1))
        ),
        /* Legend if compare */
        showCompare && h('div',{style:{display:'flex',gap:12,marginBottom:8}},
          h('div',{style:{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.textMute}},
            h('div',{style:{width:10,height:10,borderRadius:2,background:T.accent}}),
            String(now.getFullYear())
          ),
          h('div',{style:{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.textMute}},
            h('div',{style:{width:10,height:10,borderRadius:2,background:'#d1d5db'}}),
            String(now.getFullYear()-1)
          )
        ),
        h('div',{style:{display:'flex',alignItems:'flex-end',gap:showCompare?2:4,height:100}},
          monthlyOrders.map(function(m,i){
            var pct     = Math.round((m.count/maxMonthly)*100);
            var pctPrev = Math.round((monthlyOrdersPrev[i].count/maxMonthly)*100);
            var isNow   = i===now.getMonth();
            return h('div',{key:i,style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}},
              h('div',{style:{width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:1,height:80}},
                /* Current year bar */
                h('div',{style:{
                  flex:1, height:Math.max(pct||1,2)+'%', minHeight:2,
                  background:isNow?T.accent:'#bfdbfe',
                  borderRadius:'3px 3px 0 0',
                  position:'relative',
                  display:'flex',alignItems:'flex-start',justifyContent:'center'
                }},
                  m.count>0 && h('span',{style:{
                    fontSize:8,fontWeight:700,
                    color:isNow?T.accent:'#6b7280',
                    position:'absolute',top:-13,
                    whiteSpace:'nowrap'
                  }},m.count)
                ),
                /* Previous year bar (if compare on) */
                showCompare && h('div',{style:{
                  flex:1, height:Math.max(pctPrev||1,2)+'%', minHeight:2,
                  background:'#d1d5db',
                  borderRadius:'3px 3px 0 0',
                  position:'relative'
                }})
              ),
              h('div',{style:{fontSize:8,color:isNow?T.accent:T.textMute,fontWeight:isNow?700:400,whiteSpace:'nowrap'}},m.month)
            );
          })
        )
      ),

      /* Pie chart â€” top clients this year */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
            lang==='en'?'Clients Share (Year)':'حصة الزبائن (السنة)'
          ),
          h('button',{
            onClick:function(){ setShowComparePie(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showComparePie?T.accent:T.border),background:showComparePie?T.accentDim:'transparent',color:showComparePie?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'Ù…Ù‚Ø§Ø±Ù†Ø© '+(now.getFullYear()-1))
        ),
        (function(){
          /* Build year orders per customer â€” current or previous year */
          var yr = showComparePie ? now.getFullYear()-1 : now.getFullYear();
          var yearStart = new Date(yr,0,1);
          var yearEnd   = new Date(yr,11,31);
          var custYear = {};
          orders.forEach(function(o){
            var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
            if(d < yearStart || d > yearEnd) return;
            var key = String(o.customer_id||'unknown');
            custYear[key] = (custYear[key]||0)+1;
          });
          var total = Object.values(custYear).reduce(function(a,b){return a+b;},0);
          if(!total) return h('div',{style:{color:T.textMute,fontSize:12,textAlign:'center',padding:'20px 0'}},lang==='en'?'No data':'Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª');

          /* Sort and take top 5 + others */
          var sorted = Object.keys(custYear).sort(function(a,b){return custYear[b]-custYear[a];});
          var pieColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#6b7280'];
          var slices = sorted.slice(0,5).map(function(id,i){
            var c = findBy(customers,'id',parseInt(id));
            var name = c ? (c.company_name_en||c.company_name||c.name_en||c.name||'â€”') : (lang==='en'?'Unknown':'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ');
            return {name:name, count:custYear[id], color:pieColors[i]};
          });
          if(sorted.length > 5){
            var otherCount = sorted.slice(5).reduce(function(a,id){return a+custYear[id];},0);
            slices.push({name:lang==='en'?'Others':'Ø£Ø®Ø±Ù‰', count:otherCount, color:pieColors[5]});
          }

          /* Draw SVG pie */
          var cx=70,cy=70,r=60;
          var paths=[];
          var angle=0;
          slices.forEach(function(s,i){
            var pct = s.count/total;
            var sweep = pct*2*Math.PI;
            var x1=cx+r*Math.sin(angle), y1=cy-r*Math.cos(angle);
            var x2=cx+r*Math.sin(angle+sweep), y2=cy-r*Math.cos(angle+sweep);
            var large = sweep>Math.PI?1:0;
            paths.push(h('path',{key:i,
              d:'M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+large+',1 '+x2+','+y2+' Z',
              fill:s.color,stroke:'#fff',strokeWidth:2
            }));
            angle += sweep;
          });

          return h('div',null,
            h('div',{style:{display:'flex',justifyContent:'center',marginBottom:10}},
              h('svg',{width:140,height:140,viewBox:'0 0 140 140',xmlns:'http://www.w3.org/2000/svg'},paths)
            ),
            h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
              slices.map(function(s,i){
                var pct = Math.round((s.count/total)*100);
                return h('div',{key:i,style:{display:'flex',alignItems:'center',gap:6}},
                  h('div',{style:{width:10,height:10,borderRadius:2,background:s.color,flexShrink:0}}),
                  h('div',{style:{fontSize:11,color:T.textMid,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},s.name),
                  h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,flexShrink:0}},pct+'%')
                );
              })
            )
          );
        })()
      )
    ),

  /* â”€â”€ Partial Delivery Modal â”€â”€ */
  showPartialModal && h(Modal,{
    title: lang==='en' ? 'Partial Delivery Orders' : 'طلبات التوصيل الجزئي',
    onClose: function(){ setShowPartialModal(false); },
    footer: h(Btn,{variant:'secondary',onClick:function(){ setShowPartialModal(false); }},t('cancel'))
  },
    partialDel.length === 0
      ? h('div',{style:{color:'#7a8694',textAlign:'center',padding:'20px 0',fontSize:13}},t('no_data'))
      : h('div',{style:{display:'flex',flexDirection:'column',gap:10,maxHeight:480,overflowY:'auto',paddingRight:2}},
          partialDel.map(function(order){
            var readyItems = asArr(order.items).filter(function(i){ return !!i.delivery_batch_id && !itemDelivered(i); });
            var totalItems = asArr(order.items).length;
            var custName = getCust(order, lang);
            var recip = getRec(order);
            return h('div',{key:order.id,style:{
              border:'1px solid #fde68a',
              borderRadius:'12px',
              padding:'12px 14px',
              background:'#fffbeb'
            }},
              h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
                h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                  h('span',{style:{fontWeight:700,fontSize:13,color:'#0d1117'}},'#'+(order.order_number||order.id)),
                  h('span',{style:{fontSize:11,background:'#fef3c7',color:'#b45309',borderRadius:99,padding:'2px 8px',fontWeight:600}},
                    lang==='en'?'Partial':'Ø¬Ø²Ø¦ÙŠ'
                  )
                ),
                order.is_urgent==1 && h('span',{style:{fontSize:11,background:'#fee2e2',color:'#b91c1c',borderRadius:99,padding:'2px 8px',fontWeight:600}},'ðŸ”´ '+(lang==='en'?'Urgent':'Ø¹Ø§Ø¬Ù„'))
              ),
              h('div',{style:{fontSize:12,color:'#424d57',marginBottom:8,display:'flex',gap:16,flexWrap:'wrap'}},
                custName!=='â€”' && h('span',null,'ðŸ‘¤ '+custName),
                recip!=='â€”'   && h('span',null,'ðŸ“ '+recip)
              ),
              h('div',{style:{fontSize:11,color:'#92400e',marginBottom:6,fontWeight:600}},
                (lang==='en'?'Ready items: ':'Ø§Ù„Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø¬Ø§Ù‡Ø²Ø©: ')+readyItems.length+' / '+totalItems
              ),
              h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
                readyItems.map(function(item){
                  return h('div',{key:item.id,style:{
                    display:'flex',alignItems:'center',gap:8,
                    background:'#fff',borderRadius:6,
                    padding:'6px 10px',
                    border:'1px solid #fde68a'
                  }},
                    h('span',{style:{fontSize:12,flex:1,color:'#0d1117',fontWeight:500}},
                      (lang==='en'&&item.product_name_en ? item.product_name_en : item.product_name)||'â€”'
                    ),
                    item.quantity && h('span',{style:{fontSize:11,color:'#7a8694'}},
                      (lang==='en'?'Qty: ':'Ø§Ù„ÙƒÙ…ÙŠØ©: ')+item.quantity
                    ),
                    h('span',{style:{fontSize:11,background:'#d1fae5',color:'#065f46',borderRadius:99,padding:'2px 7px',fontWeight:600}},
                      'âœ“ '+(lang==='en'?'Ready':'Ø¬Ø§Ù‡Ø²')
                    )
                  );
                })
              )
            );
          })
        )
  )

  );
}


/* â•â•â• PAUSE MODAL â€” 3 Ù…Ø±Ø§Ø­Ù„: ÙØ¦Ø© â† Ù…Ø§ÙƒÙŠÙ†Ø© â† Ø³Ø¨Ø¨ â•â•â• */
function PauseModal(props) {
  /* props: pauseReasons[], stepLabel, onConfirm(reason,machine), onClose */
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var reasons = props.pauseReasons || [];

  var _phase = useState('category'); var phase = _phase[0], setPhase = _phase[1];
  var _cat   = useState(null);      var selCat = _cat[0],  setSelCat = _cat[1];
  var _mach  = useState(null);      var selMach = _mach[0], setSelMach = _mach[1];
  var _other = useState(false);     var isOther = _other[0], setIsOther = _other[1];
  var _otherTxt = useState('');     var otherTxt = _otherTxt[0], setOtherTxt = _otherTxt[1];

  /* â”€â”€ ÙØ¦Ø§Øª Ø«Ø§Ø¨ØªØ© â”€â”€ */
  var CATEGORIES = [
    {key:'print',   icon:'\ud83d\udda8', ar:'Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',    en:'Printing Machines'},
    {key:'finish',  icon:'\u2702', ar:'Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„ØªØ´Ø·ÙŠØ¨',    en:'Finishing Machines'},
    {key:'material',icon:'\ud83d\udce6', ar:'Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ©',          en:'Raw Materials'},
    {key:'power',   icon:'\u26a1', ar:'ÙƒÙ‡Ø±Ø¨Ø§Ø¡ / Ø´Ø¨ÙƒØ©',      en:'Power / Network'},
    {key:'ops',     icon:'\ud83e\uddd1', ar:'Ø£Ø³Ø¨Ø§Ø¨ ØªØ´ØºÙŠÙ„ÙŠØ©',      en:'Operational'},
    {key:'other',   icon:'\ud83d\udcac', ar:'Ø£Ø®Ø±Ù‰',               en:'Other'},
  ];

  /* ØªØµÙ†ÙŠÙ Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø­Ø³Ø¨ Ø§Ù„ÙØ¦Ø© */
  var CAT_MACHINES = {
    print:   ['Xerox Versant 180','Canon C650i','Canon 5550i','Epson L805'],
    finish:  ['Flat Heat Press Freesub','3D Heat Press Freesub','Hat Heat Press Freesub',
               'Booklet Stapler Yale','Trimming Machine','Binding Machine',
               'Spiral Punching Machine','Rounded Corner Press','Circle Press 5x5','Cameo 3'],
    material:[],
    power:   ['UPS','Server Dell'],
    ops:     [],
  };

  /* ÙÙ„ØªØ±Ø© Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨ */
  function getReasonsForMachine(machine) {
    return reasons.filter(function(r){ return r.machine === machine; });
  }
  function getReasonsForCat(cat) {
    /* Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© ÙˆØªØ´ØºÙŠÙ„ÙŠØ© â€” Ø¨Ø¯ÙˆÙ† Ù…Ø§ÙƒÙŠÙ†Ø© */
    return reasons.filter(function(r){ return !r.machine || r.machine.trim()===''; });
  }

  /* Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„ÙØ¦Ø© Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© Ø§Ù„Ù„ÙŠ Ø¹Ù†Ø¯Ù‡Ø§ Ø£Ø³Ø¨Ø§Ø¨ */
  var machines = selCat ? (CAT_MACHINES[selCat.key] || []).filter(function(m){
    return reasons.some(function(r){ return r.machine === m; });
  }) : [];

  /* Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø© */
  var filteredReasons = selMach
    ? getReasonsForMachine(selMach)
    : (selCat && (selCat.key==='material'||selCat.key==='ops'))
      ? getReasonsForCat(selCat.key)
      : [];

  var btnStyle = function(sel){ return {
    display:'flex', alignItems:'center', gap:10, width:'100%',
    padding:'11px 14px', borderRadius:T.radius, cursor:'pointer', textAlign:'right',
    border:'2px solid '+(sel?T.accent:T.border),
    background: sel?T.accentDim:T.bgSub,
    color: sel?T.accent:T.text,
    fontSize:13, fontWeight: sel?600:400, transition:'all .15s'
  }; };

  var backBtn = function(onClick){ return h('button',{onClick:onClick,style:{
    background:'transparent',border:'none',color:T.textMute,cursor:'pointer',
    fontSize:12,padding:'0 0 12px 0',display:'flex',alignItems:'center',gap:4
  }},'â† '+(lang==='en'?'Back':'Ø±Ø¬ÙˆØ¹')); };

  var title = phase==='category'
    ? (lang==='en'?'Select Category':'Ø§Ø®ØªØ± Ø§Ù„ÙØ¦Ø©')
    : phase==='machine'
      ? (lang==='en'?'Select Machine':'Ø§Ø®ØªØ± Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø©')
      : (lang==='en'?'Select Reason':'Ø§Ø®ØªØ± Ø§Ù„Ø³Ø¨Ø¨');

  return h('div', { style:{ position:'fixed', inset:0, background:'rgba(13,17,23,.65)', zIndex:99000,
    display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    onClick:function(e){ if(e.target===e.currentTarget) props.onClose(); }
  },
    h('div', { style:{ background:T.bg, border:'1px solid '+T.border, borderRadius:T.radiusLg,
      padding:24, width:'100%', maxWidth:460, boxShadow:'0 24px 48px rgba(0,0,0,.3)',
      maxHeight:'85vh', display:'flex', flexDirection:'column' }
    },
      /* Header */
      h('div', {style:{marginBottom:16}},
        h('div', {style:{fontWeight:700, fontSize:15, marginBottom:4}}, 'â¸ '+(lang==='en'?'Pause Step':'Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª Ù„Ù„Ø®Ø·ÙˆØ©')),
        props.stepLabel && h('div',{style:{fontSize:12,color:T.accent,fontWeight:600,padding:'3px 10px',
          background:T.accentDim,borderRadius:T.radius,display:'inline-block',marginBottom:6}}, props.stepLabel),
        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:8}},

          /* breadcrumb */
          h('span',{style:{color: phase==='category'?T.accent:T.textMute, fontWeight:600}}, lang==='en'?'Category':'Ø§Ù„ÙØ¦Ø©'),
          h('span',{style:{margin:'0 6px'}}, 'â€º'),
          h('span',{style:{color: phase==='machine'?T.accent:selMach?T.text:T.border, fontWeight: phase==='machine'?600:400}},
            selCat ? (lang==='en'?selCat.en:selCat.ar) : (lang==='en'?'Machine':'Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø©')
          ),
          h('span',{style:{margin:'0 6px'}}, 'â€º'),
          h('span',{style:{color: phase==='reason'?T.accent:T.border, fontWeight: phase==='reason'?600:400}},
            selMach || (lang==='en'?'Reason':'Ø§Ù„Ø³Ø¨Ø¨')
          )
        )
      ),

      /* Scrollable content */
      h('div', {style:{overflowY:'auto', flex:1}},

        /* â”€â”€ Phase 1: Category â”€â”€ */
        phase==='category' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          CATEGORIES.map(function(cat){
            /* Ø£Ø®Ø±Ù‰ Ø¯Ø§Ø¦Ù…Ø§Ù‹ ØªØ¸Ù‡Ø±ØŒ Ø¨Ù‚ÙŠØ© Ø§Ù„ÙØ¦Ø§Øª Ø¨Ø³ Ø¥Ø°Ø§ Ø¹Ù†Ø¯Ù‡Ø§ Ø£Ø³Ø¨Ø§Ø¨ */
            var hasReasons = cat.key==='other' ? true :
              cat.key==='material'||cat.key==='ops'
                ? reasons.some(function(r){ return !r.machine||r.machine.trim()===''; })
                : (CAT_MACHINES[cat.key]||[]).some(function(m){
                    return reasons.some(function(r){ return r.machine===m; });
                  });
            if (!hasReasons) return null;
            return h('button',{key:cat.key, onClick:function(){
              if (cat.key==='other') { setIsOther(true); setPhase('reason'); setSelCat(cat); return; }
              setSelCat(cat);
              /* Ø¥Ø°Ø§ Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© Ø£Ùˆ ØªØ´ØºÙŠÙ„ÙŠØ© â†’ ØªØ®Ø·Ù‰ Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø© */
              if (cat.key==='material'||cat.key==='ops') { setPhase('reason'); }
              else { setPhase('machine'); }
            }, style:btnStyle(false)},
              h('span',{style:{fontSize:18}}, cat.icon),
              h('span',null, lang==='en'?cat.en:cat.ar)
            );
          })
        ),

        /* â”€â”€ Phase 2: Machine â”€â”€ */
        phase==='machine' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){ setPhase('category'); setSelCat(null); }),
          machines.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No machines found':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø§ÙƒÙŠÙ†Ø§Øª')
            : machines.map(function(m){
                return h('button',{key:m, onClick:function(){ setSelMach(m); setPhase('reason'); },
                  style:btnStyle(false)},
                  h('span',{style:{fontSize:16}},'ðŸ”§'),
                  h('span',null, m)
                );
              })
        ),

        /* â”€â”€ Phase 3: Reason â”€â”€ */
        phase==='reason' && !isOther && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){
            if (selCat&&(selCat.key==='material'||selCat.key==='ops')){ setPhase('category'); setSelCat(null); }
            else { setPhase('machine'); setSelMach(null); }
          }),
          filteredReasons.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No reasons found':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø³Ø¨Ø§Ø¨ â€” Ø£Ø¶ÙÙ‡Ø§ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª')
            : filteredReasons.map(function(r,i){
                var label = (lang==='en'&&r.en)?r.en:r.ar;
                return h('button',{key:i, onClick:function(){
                  props.onConfirm(label, selMach||r.machine||'');
                }, style:btnStyle(false)},
                  h('span',null, label)
                );
              }),
          /* Ø£Ø®Ø±Ù‰ */
          h('button',{onClick:function(){ setIsOther(true); },style:btnStyle(false)},
            h('span',{style:{fontSize:16}},'ðŸ’¬'),
            h('span',{style:{color:T.textMute}}, lang==='en'?'Other...':'Ø£Ø®Ø±Ù‰...')
          )
        ),

        /* Other â€” free text */
        isOther && h('div',null,
          backBtn(function(){ setIsOther(false); setOtherTxt(''); }),
          h('textarea',{
            autoFocus:true, rows:4,
            style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,
              fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,
              boxSizing:'border-box',outline:'none'},
            placeholder: lang==='en'?'Enter reason...':'Ø§ÙƒØªØ¨ Ø§Ù„Ø³Ø¨Ø¨...',
            value: otherTxt,
            onChange:function(e){ setOtherTxt(e.target.value); }
          }),
          h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}},
            h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel')),
            h(Btn,{variant:'primary',disabled:!otherTxt.trim(),onClick:function(){
              props.onConfirm(otherTxt.trim(), selMach||'');
            }}, lang==='en'?'Pause':'Ø¥ÙŠÙ‚Ø§Ù')
          )
        )
      ),

      /* Footer â€” cancel only (confirm happens by clicking reason) */
      !isOther && h('div',{style:{marginTop:16,display:'flex',justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel'))
      )
    )
  );
}

/* â•â•â• ORDERS â•â•â• */
function OrdersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var pauseReasons = (props.branding && props.branding.pause_reasons && props.branding.pause_reasons.length) ? props.branding.pause_reasons : (props.pauseReasons || []);
  var orders    = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var customers = asArr(bs.customers);
  var _liveCustomers = useState(customers); var liveCustomers = _liveCustomers[0], setLiveCustomers = _liveCustomers[1];
  var products  = asArr(bs.products);
  var _liveProducts = useState(products); var liveProducts = _liveProducts[0], setLiveProducts = _liveProducts[1];
  var _liveProductSteps = useState(asArr(bs.product_steps||[])); var liveProductSteps = _liveProductSteps[0], setLiveProductSteps = _liveProductSteps[1];
  var statuses  = asArr(bs.statuses);
  var employees = asArr(bs.employees);
  var suppliers = asArr(bs.suppliers);
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var _p = useState(null); var preview = _p[0], setPreview = _p[1];
  var _ct = useState([]); var contacts = _ct[0], setContacts = _ct[1];
  var _dp = useState(null); var delayPrompt = _dp[0], setDelayPrompt = _dp[1]; /* {orderId, reason} */
  var _pp = useState(null); var pausePrompt = _pp[0], setPausePrompt = _pp[1]; /* {orderId, reason} */
  var _or = useState([]); var orderRecipients = _or[0], setOrderRecipients = _or[1];
  var _selRec = useState(''); var selRecId = _selRec[0], setSelRecId = _selRec[1];
  var _custRecs = useState([]); var custRecs = _custRecs[0], setCustRecs = _custRecs[1];
  var _ps = useState(''); var productQuickSearch = _ps[0], setProductQuickSearch = _ps[1];
  var _custQ = useState(''); var customerQuickSearch = _custQ[0], setCustomerQuickSearch = _custQ[1];
  var _contactQ = useState(''); var contactQuickSearch = _contactQ[0], setContactQuickSearch = _contactQ[1];
  var _recQ = useState(''); var recipientQuickSearch = _recQ[0], setRecipientQuickSearch = _recQ[1];
  var _custSugOpen = useState(false); var customerSuggestOpen = _custSugOpen[0], setCustomerSuggestOpen = _custSugOpen[1];
  var _contactSugOpen = useState(false); var contactSuggestOpen = _contactSugOpen[0], setContactSuggestOpen = _contactSugOpen[1];
  var _recipientSugOpen = useState(false); var recipientSuggestOpen = _recipientSugOpen[0], setRecipientSuggestOpen = _recipientSugOpen[1];
  var _productSugOpen = useState(false); var productSuggestOpen = _productSugOpen[0], setProductSuggestOpen = _productSugOpen[1];
  var search = useSearch().q;
  var _q = useState(orders.map(function(o){ return o.id; })); var queueIds = _q[0], setQueueIds = _q[1];

  useEffect(function(){
    setLiveCustomers(asArr(bs.customers));
  }, [bs.customers]);
  useEffect(function(){
    setLiveProducts(asArr(bs.products));
  }, [bs.products]);
  useEffect(function(){
    setLiveProductSteps(asArr(bs.product_steps||[]));
  }, [bs.product_steps]);

  function refreshCustomersList() {
    return apiFetch('customers', { fresh:true })
      .then(function(r){
        var arr = Array.isArray(r) ? r : [];
        setLiveCustomers(arr);
        return arr;
      })
      .catch(function(){
        return liveCustomers;
      });
  }
  function refreshCatalogList() {
    return Promise.all([
      apiFetch('products', { fresh:true }).catch(function(){ return liveProducts; }),
      apiFetch('product-steps', { fresh:true }).catch(function(){ return liveProductSteps; })
    ]).then(function(results){
      var nextProducts = Array.isArray(results[0]) ? results[0] : liveProducts;
      var nextSteps = Array.isArray(results[1]) ? results[1] : liveProductSteps;
      setLiveProducts(nextProducts);
      setLiveProductSteps(nextSteps);
      return { products: nextProducts, product_steps: nextSteps };
    });
  }

  function applyUpdatedOrder(updatedOrder) {
    if (!updatedOrder || !updatedOrder.id) return updatedOrder;
    setPreview(function(prev){
      return prev && String(prev.id) === String(updatedOrder.id) ? updatedOrder : prev;
    });
    if (props.onOrderUpdate) props.onOrderUpdate(updatedOrder);
    return updatedOrder;
  }

  function productWorkflowSteps(productId) {
    return asArr(liveProductSteps||[]).filter(function(ps){ return String(ps.product_id) === String(productId||''); });
  }
  function productHasExternal(productId) {
    return productWorkflowSteps(productId).some(function(ps){ return parseInt(ps.is_external,10) === 1; });
  }
  function defaultExternalSupplierForProduct(productId) {
    var ext = productWorkflowSteps(productId).filter(function(ps){ return parseInt(ps.is_external,10) === 1; })[0] || null;
    return ext && ext.supplier_id ? String(ext.supplier_id) : '';
  }
  function productHasDelivery(productId) {
    return productWorkflowSteps(productId).some(function(ps){ return parseInt(ps.is_delivery,10) === 1; });
  }
  function itemExternalStep(item) {
    return asArr(item && item.steps).filter(function(s){ return parseInt(s.is_external,10) === 1; })[0] || null;
  }
  function itemDeliveryStep(item) {
    return asArr(item && item.steps).filter(function(s){ return parseInt(s.is_delivery,10) === 1; })[0] || null;
  }
  function externalExpectedMins(step) {
    var metrics = step && step.external_metrics ? step.external_metrics : {};
    var promised = parseInt(metrics.promised_duration_minutes, 10) || 0;
    if (promised > 0) return promised;
    var direct = Math.round((parseFloat(step && step.expected_duration_minutes)||0));
    if (direct > 0) return direct;
    if (step && step.ext_send_at && step.ext_receive_expected) {
      var from = parseServerDate(step.ext_send_at);
      var to = parseServerDate(step.ext_receive_expected);
      if (from && to) {
        var mins = Math.round((to.getTime() - from.getTime()) / 60000);
        if (mins > 0) return mins;
      }
    }
    var hrs = parseFloat(step && step.expected_hours) || 0;
    return hrs > 0 ? Math.round(hrs * 60) : 0;
  }
  function stepExpectedMins(step, item) {
    if (!step) return 0;
    if (parseInt(step.is_external,10) === 1) return externalExpectedMins(step);
    if (isDeliveryStep(step)) {
      var dhrs = parseFloat(step.expected_hours) || 0;
      return dhrs > 0 ? Math.round(dhrs * 60) : 0;
    }
    var hrs = parseFloat(step.expected_hours) || 0;
    var mins = hrs > 0 ? Math.round(hrs * 60) : 0;
    if (mins > 0) return mins;
    var stepNameNorm = (step.step_name||'').toLowerCase().trim();
    if (item && item.product_id) {
      var ps = asArr(liveProductSteps||[]).filter(function(p){
        return p.product_id == item.product_id &&
          (p.step_name||'').toLowerCase().trim() === stepNameNorm;
      })[0];
      if (ps) {
        var qty = parseFloat(item.quantity)||1;
        var qpu = Math.max(1, parseInt(ps.qty_per_unit)||1);
        mins = Math.round(((parseFloat(ps.expected_hours)||0) * 60) * (ps.scales_with_qty ? qty/qpu : 1));
      }
    }
    return mins > 0 ? mins : 0;
  }

  /* compute expected minutes for one order â€” production steps only (no delivery) */
  function orderExpectedMins(order) {
    var total = 0;
    asArr(order.items).forEach(function(item) {
      asArr(item.steps).forEach(function(step) {
        if (isDeliveryStep(step)) return;
        total += stepExpectedStepMins(step, item, liveProductSteps);
      });
    });
    return Math.round(total);
  }
  function orderDeliveryMins(order) {
    var total = 0;
    asArr(order.items).forEach(function(item) {
      asArr(item.steps).forEach(function(step) {
        if (step.is_delivery != 1) return;
        var hrs = parseFloat(step.expected_hours) || 0;
        total += hrs * 60;
      });
    });
    return Math.round(total);
  }

  /* build sorted queue â€” pending + in_progress, sorted by queue_order */
  function getQueue() {
    return orders.slice().sort(function(a,b){
      return (parseInt(a.queue_order)||9999) - (parseInt(b.queue_order)||9999);
    });
  }

  /* compute estimated completion for each order in queue */
  function getEstCompletions() {
    var queue = getQueue();
    var now = Date.now();
    var cursor = now;
    var map = {};
    queue.forEach(function(o) {
      var mins = orderExpectedMins(o);
      cursor += mins * 60 * 1000;
      map[o.id] = cursor;
    });
    return map;
  }

  function moveOrder(orderId, dir) {
    var queue = getQueue();
    var idx = queue.findIndex(function(o){ return String(o.id)===String(orderId); });
    if (idx < 0) return;
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= queue.length) return;
    var arr = queue.slice();
    var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
    var ids = arr.map(function(o){ return o.id; });
    apiFetch('orders/requeue', {method:'POST', body:JSON.stringify({ids:ids})})
      .then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }

  var blank = { order_number:'', customer_id:'', contact_person_id:'', contact_person_name:'', contact_person_phone:'', delivery_address:'', delivery_map_url:'', delivery_notes:'', priority:'normal', is_urgent:0, deadline:'', delivery_date:'', items:[], contact_name:'', contact_phone:'', contact_email:'', contact_map:'', contact_address:'', is_temp_contact:0, delivery_employee_id:'' };

  /* open new order form â€” pre-fill order_number with CS-0 prefix for user to complete */
  function openNewOrder() {
    setProductQuickSearch('');
    setCustomerQuickSearch('');
    setContactQuickSearch('');
    setRecipientQuickSearch('');
    setCustomerSuggestOpen(false);
    setContactSuggestOpen(false);
    setRecipientSuggestOpen(false);
    setProductSuggestOpen(false);
    setContacts([]);
    setCustRecs([]);
    setSelRecId('');
    setOrderRecipients([]);
    setForm(Object.assign({}, blank, { order_number: 'CS-0' }));
    refreshCustomersList();
    refreshCatalogList();
  }

  function onCustChange(cid) {
    setForm(function(f){ return Object.assign({}, f, { customer_id:cid, contact_person_id:'', contact_person_name:'', contact_person_phone:'' }); });
    setContacts([]);
    setCustRecs([]);
    setContactQuickSearch('');
    setRecipientQuickSearch('');
    setContactSuggestOpen(false);
    setRecipientSuggestOpen(false);
    setSelRecId('');
    if (!cid) {
      setCustomerQuickSearch('');
      setCustomerSuggestOpen(false);
      return;
    }
    apiFetch('customers/'+cid+'/contacts', { fresh:true }).then(function(r){ setContacts(Array.isArray(r)?r:[]); }).catch(function(){});
    apiFetch('customers/'+cid+'/recipients', { fresh:true }).catch(function(){ return []; })
      .then(function(r){
        setCustRecs(Array.isArray(r) ? r.filter(function(rec){ return rec.is_active!=0; }) : []);
      });
    var c = findBy(liveCustomers, 'id', cid);
    if (c) {
      var custLabel = (lang==='en'&&(c.company_name_en||c.name_en)) ? (c.company_name_en||c.name_en) : (c.company_name||c.name);
      setCustomerQuickSearch(custLabel || '');
      setForm(function(f){ return Object.assign({}, f, {
        customer_id: cid,
        delivery_address: c.address||f.delivery_address,
        delivery_map_url: c.map_url||f.delivery_map_url
      }); });
    }
  }
  function addItem() { setForm(function(f){ return Object.assign({}, f, { items: f.items.concat([{product_id:'',product_name:'',product_name_en:'',quantity:1,notes:'',supplier_id:'',external_send_at:'',external_receive_expected:'',delivery_scheduled_at:''}]) }); }); }
  function productLabel(p) {
    var nm = ln(p, lang);
    var num = (p && (p.sku || p.product_number || p.code)) ? String(p.sku || p.product_number || p.code) : '';
    return num ? (num + ' â€” ' + nm) : nm;
  }
  function addProductBySearch(prod) {
    if (!prod) return;
    var autoNotes = lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'');
    setForm(function(f){
      return Object.assign({}, f, { items: f.items.concat([{
        product_id:String(prod.id||''),
        product_name:prod.name||'',
        product_name_en:prod.name_en||'',
        quantity:1,
        notes:autoNotes||'',
        supplier_id:defaultExternalSupplierForProduct(prod.id||''),
        external_send_at:'',
        external_receive_expected:'',
        delivery_scheduled_at:''
      }]) });
    });
    setProductQuickSearch('');
    setProductSuggestOpen(false);
  }
  function removeItem(idx) { setForm(function(f){ return Object.assign({}, f, { items: f.items.filter(function(_,i){ return i!==idx; }) }); }); }
  function updateItem(idx, k, v) {
    setForm(function(f){
      return Object.assign({}, f, { items: f.items.map(function(it, i){
        if (i !== idx) return it;
        var patch = {}; patch[k] = v;
        if (k === 'product_id') {
          var p = findBy(liveProducts,'id',v);
          patch.product_name = p ? p.name : '';
          patch.product_name_en = p ? (p.name_en||'') : '';
          patch.supplier_id = defaultExternalSupplierForProduct(v);
        }
        return Object.assign({}, it, patch);
      })});
    });
  }
  function save() {
    if (!form.deadline) { alert(t('no_deadline_warn')); return; }
    var payload = Object.assign({}, form);
    if (!payload.order_number) payload.order_number = 'ORD-' + Date.now().toString(36).toUpperCase();
    payload.order_number = String(payload.order_number || '').trim();
    if (!payload.order_number) { alert(lang==='en' ? 'Order number is required' : 'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ Ù…Ø·Ù„ÙˆØ¨'); return; }
    payload.recipients = orderRecipients;
    var prom = form.id
      ? apiFetch('orders/'+form.id, {method:'PUT', body:JSON.stringify(payload)})
      : apiFetch('orders', {method:'POST', body:JSON.stringify(payload)}).then(function(res){ if(res && res.id) setTimeout(function(){ openPrintWithLang(res, lang); }, 300); });
    prom.then(function(){ setForm(null); if(props.onSilentReload) props.onSilentReload(); else props.onReload(); }).catch(function(e){ alert((e && e.message) || t('error')); });
  }
  function del(id) {
    if (!confirm(t('confirm_delete'))) return;
    apiFetch('orders/'+id, {method:'DELETE'})
      .then(function(res){
        if (res && res.code === 'error') { alert(t('delete_blocked')); return; }
        props.onReload();
      })
      .catch(function(){ alert(t('delete_blocked')); });
  }
  function cancelOrder(id) {
    if (!confirm(t('confirm_stop'))) return;
    apiFetch('orders/'+id+'/cancel', {method:'POST'}).then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }
  function forceComplete(id) {
    if (!confirm(t('confirm_force'))) return;
    apiFetch('orders/'+id+'/force-complete', {method:'POST'}).then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }
  /* startStep: starts a pending step â€” checks deadline after */
  function startStep(stepId, orderId) {
    return apiFetch('steps/'+stepId+'/start', {method:'POST', keepalive:true})
      .then(function(res){
        if (res && res.needs_delay_reason) {
          setDelayPrompt({orderId: res.order_id || orderId, reason:''});
        }
        var immediate = res && res.order && res.order.id ? res.order : null;
        if (immediate) {
          applyUpdatedOrder(immediate);
        }
        return apiFetch('orders/'+orderId, {fresh:true}).then(function(updated){
          if (updated && updated.id) {
            applyUpdatedOrder(updated);
          }
          if (props.onSilentReload) props.onSilentReload();
          return updated || immediate || null;
        });
      }).catch(function(e){
        alert(e.message||t('error'));
        throw e;
      });
  }

  /* completeStep: completes an in_progress step â€” checks deadline after */
  function completeStep(stepId, orderId, completedByIds, meta) {
    var payload = {};
    if (completedByIds && completedByIds.length) payload.completed_by_ids = completedByIds;
    if (meta && meta.delivery_direction) payload.delivery_direction = meta.delivery_direction;
    var body = Object.keys(payload).length ? JSON.stringify(payload) : undefined;
    return apiFetch('steps/'+stepId+'/advance', {method:'POST', body: body, keepalive:true})
      .then(function(res){
        var immediate = res && res.order && res.order.id ? res.order : null;
        if (immediate) {
          applyUpdatedOrder(immediate);
        }
        // Prompt delay reason if server says deadline passed
        if (res && res.needs_delay_reason) {
          setDelayPrompt({orderId: res.order_id || orderId, reason:''});
        }
        return apiFetch('orders/'+orderId, {fresh:true}).then(function(updated){
          if (!updated || !updated.id) return;
          if (updated.is_done == 1 || updated.is_done === '1' || updated.is_done === true) {
            setPreview(null);
            props.onReload();
            setTimeout(function(){ if (props.onSilentReload) props.onSilentReload(); }, 800);
          } else {
            if (props.onSilentReload) props.onSilentReload();
            applyUpdatedOrder(updated);
          }
          return updated || immediate || null;
        });
      })
      .catch(function(e){
        alert(e.message||t('error'));
        throw e;
      });
  }

  /* pauseStep: opens pause prompt for a specific step */
  function pauseStep(stepId, orderId, stepLabel, stepNameAr, stepNameEn) {
    setPausePrompt({stepId:stepId, orderId:orderId, reason:'', machine:'', stepLabel:stepLabel||'', stepNameAr:stepNameAr||'', stepNameEn:stepNameEn||''});
  }
  /* resumeStep: resumes a paused step */
  function resumeStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/resume', {method:'POST', keepalive:true})
      .then(function(){
        apiFetch('orders/'+orderId, {fresh:true}).then(function(updated){
          if (updated && updated.id) applyUpdatedOrder(updated);
          if (props.onSilentReload) props.onSilentReload();
        });
      });
  }

  /* pauseOrder (order-level, kept for resume button on row) */
  function pauseOrder(orderId) { setPausePrompt({orderId:orderId, reason:''}); }
  function resumeOrder(orderId) {
    apiFetch('orders/'+orderId+'/resume', {method:'POST'})
      .then(function(){ if (props.onSilentReload) props.onSilentReload(); });
  }

  var filtered = orders.filter(function(o){
    if (!search) return true;
    return (o.order_number + getCust(o) + getRec(o)).toLowerCase().indexOf(search.toLowerCase()) >= 0;
  });
  var quickProductMatches = !productQuickSearch ? [] : liveProducts.filter(function(p){
    var q = String(productQuickSearch||'').toLowerCase().trim();
    var sku = String((p && (p.sku || p.product_number || p.code)) || '').toLowerCase();
    var nameAr = String((p && p.name) || '').toLowerCase();
    var nameEn = String((p && p.name_en) || '').toLowerCase();
    var descAr = String((p && p.description) || '').toLowerCase();
    var descEn = String((p && p.description_en) || '').toLowerCase();
    return sku.indexOf(q) >= 0 || nameAr.indexOf(q) >= 0 || nameEn.indexOf(q) >= 0 || descAr.indexOf(q) >= 0 || descEn.indexOf(q) >= 0;
  }).slice(0,8);
  var quickCustomerMatches = !customerQuickSearch ? [] : liveCustomers.filter(function(c){
    var q = String(customerQuickSearch||'').toLowerCase().trim();
    var ar = String((c && (c.company_name || c.name)) || '').toLowerCase();
    var en = String((c && (c.company_name_en || c.name_en)) || '').toLowerCase();
    var phone = String((c && c.phone) || '').toLowerCase();
    return ar.indexOf(q) >= 0 || en.indexOf(q) >= 0 || phone.indexOf(q) >= 0;
  }).slice(0,8);
  var contactOpts = contacts.map(function(c){
    var nm = (lang==='en' && c.name_en) ? c.name_en : c.name;
    var jt = (lang==='en' && c.job_title_en) ? c.job_title_en : c.job_title;
    var ph = c.phone ? (' - ' + c.phone) : '';
    return {
      value: String(c.id),
      label: String(nm || '') + (jt ? (' (' + jt + ')') : '') + ph
    };
  });
  var availableRecipients = custRecs.filter(function(r){
    return !orderRecipients.some(function(or){ return String(or.recipient_id)===String(r.id); });
  });
  var quickRecipientMatches = !recipientQuickSearch ? [] : availableRecipients.filter(function(r){
    var q = String(recipientQuickSearch||'').toLowerCase().trim();
    var nmAr = String((r && r.name) || '').toLowerCase();
    var nmEn = String((r && r.name_en) || '').toLowerCase();
    var phone = String((r && r.phone) || '').toLowerCase();
    return nmAr.indexOf(q) >= 0 || nmEn.indexOf(q) >= 0 || phone.indexOf(q) >= 0;
  }).slice(0,8);
  useTopbar(t('n_active',orders.length), h(Btn, { variant:'primary', onClick:openNewOrder }, '+ '+t('new_order')));

  return h('div', null,
    filtered.length === 0
      ? h(Card, { style:{ padding:40, textAlign:'center' } }, h('div', { style:{ fontSize:40, marginBottom:12 } }, 'LIST'), h('div', { style:{ color:T.textMute } }, search?t('no_results'):t('no_active_orders')))
      : (function(){
          var queue = getQueue();
          var estMap = getEstCompletions();
          var queueIds = queue.map(function(o){ return o.id; });
          return filtered.map(function(order){
            var qpos = queueIds.indexOf(order.id);
            return h(OrderRow, { key:order.id, order:order, statuses:statuses,
              queuePos: qpos,
              queueLen: queue.length,
              expectedMins: orderExpectedMins(order),
              deliveryMins: orderDeliveryMins(order),
              estCompletion: estMap[order.id],
              onMoveUp:   function(){ moveOrder(order.id, -1); },
              onMoveDown: function(){ moveOrder(order.id,  1); },
              onPreview:function(){
                apiFetch('orders/'+order.id, {fresh:true}).then(function(fresh){
                  var opened = fresh && fresh.id ? fresh : order;
                  applyUpdatedOrder(opened);
                  setPreview(opened);
                  if(props.onSilentReload) props.onSilentReload();
                }).catch(function(){ setPreview(order); });
              },
              onStartedPreview:function(updatedOrder){
                if (updatedOrder && updatedOrder.id) {
                  applyUpdatedOrder(updatedOrder);
                  setPreview(updatedOrder);
                }
              },
      onEdit:function(){
        refreshCatalogList();
        var normalizedItems = asArr(order.items).map(function(item){
          /* Auto-fill notes from product description if notes are empty */
          var prod = liveProducts.find(function(p){ return String(p.id)===String(item.product_id); });
          var autoNotes = (item.notes && item.notes.trim()) ? item.notes : (prod ? (lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'')) : '');
          return {
            id:              item.id || null,
            product_id:      String(item.product_id||''),
            product_name:    item.product_name||'',
            product_name_en: item.product_name_en||(prod?prod.name_en||'':''),
            quantity:        parseInt(item.quantity)||1,
            notes:           autoNotes,
            supplier_id:     (itemExternalStep(item) && itemExternalStep(item).supplier_id) ? String(itemExternalStep(item).supplier_id) : (item.supplier_id || defaultExternalSupplierForProduct(item.product_id)),
            external_send_at: (itemExternalStep(item) && itemExternalStep(item).ext_send_at) || item.external_send_at || '',
            external_receive_expected: (itemExternalStep(item) && itemExternalStep(item).ext_receive_expected) || item.external_receive_expected || '',
            delivery_scheduled_at: (itemDeliveryStep(item) && (itemDeliveryStep(item).planned_start_at || itemDeliveryStep(item).delivery_scheduled_at)) || item.delivery_scheduled_at || '',
            steps:           item.steps||[]
          };
        });
        setForm(Object.assign({},order,{items:normalizedItems}));
        setCustomerQuickSearch(getCust(order, lang) || '');
        setContactQuickSearch(order.contact_person_name || '');
        setRecipientQuickSearch('');
        setProductQuickSearch('');
        setCustomerSuggestOpen(false);
        setContactSuggestOpen(false);
        setRecipientSuggestOpen(false);
        setProductSuggestOpen(false);
        setOrderRecipients(asArr(order.recipients));
        setSelRecId('');
        setCustRecs([]);
        setContacts([]);
        if (order.customer_id) {
          Promise.all([
            apiFetch('customers/'+order.customer_id+'/recipients', { fresh:true }).catch(function(){ return []; }),
            apiFetch('customers/'+order.customer_id+'/contacts', { fresh:true }).catch(function(){ return []; })
          ]).then(function(results){
            setCustRecs(Array.isArray(results[0]) ? results[0].filter(function(r){ return r.is_active!=0; }) : []);
            setContacts(Array.isArray(results[1]) ? results[1] : []);
          });
        }
      },
              onDelete:function(){ del(order.id); },
              onPrint:function(){ openPrintWithLang(order, lang); },
              onStart:function(stepId, orderId){
                return startStep(stepId, orderId).then(function(updated){
                  if (updated && updated.id) {
                    applyUpdatedOrder(updated);
                  }
                  return updated;
                });
              },
              onAdvance:function(stepId, completedByIds, meta){ completeStep(stepId, order.id, completedByIds, meta); },
              onCancel:function(){ cancelOrder(order.id); },
              onForceComplete:function(){ forceComplete(order.id); },
              onPause:function(){ pauseOrder(order.id); },
              onResume:function(){ resumeOrder(order.id); },
            });
          });
        })(),
    /* Delay reason prompt â€” linked to Settings pause reasons */
    delayPrompt && h(Modal, {
      title:'⚠️ '+t('delay_reason_title'), onClose:function(){setDelayPrompt(null);}, width:460,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setDelayPrompt(null);}},t('delay_skip')),
        h(Btn,{variant:'primary',disabled:!delayPrompt.reason.trim(),onClick:function(){
          if (!delayPrompt.reason.trim()) return;
          apiFetch('orders/'+delayPrompt.orderId+'/delay-reason',{method:'POST',body:JSON.stringify({reason:delayPrompt.reason})})
            .then(function(){ setDelayPrompt(null); if(props.onSilentReload) props.onSilentReload(); });
        }},t('delay_submit'))
      )
    },
      h('p',{style:{color:T.textMid,marginBottom:12,fontSize:13}},t('delay_reason_prompt')),
      pauseReasons.length > 0
        ? h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginBottom:12}},
            pauseReasons.map(function(r,i){
              var label = (lang==='en' && r.en) ? r.en : r.ar;
              var isSel = delayPrompt.reason === label;
              return h('button',{key:i,onClick:function(){ setDelayPrompt(function(d){ return Object.assign({},d,{reason:label,isOther:false}); }); },
                style:{padding:'9px 14px',borderRadius:T.radius,border:'2px solid '+(isSel?T.accent:T.border),
                  background:isSel?T.accentBg:T.bgSub,color:isSel?T.accent:T.text,
                  cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:isSel?600:400,transition:'all .15s'}
              },label);
            }),
            h('button',{onClick:function(){ setDelayPrompt(function(d){ return Object.assign({},d,{reason:'',isOther:true}); }); },
              style:{padding:'9px 14px',borderRadius:T.radius,border:'2px solid '+(delayPrompt.isOther?T.accent:T.border),
                background:delayPrompt.isOther?T.accentBg:T.bgSub,color:delayPrompt.isOther?T.accent:T.textMute,
                cursor:'pointer',fontSize:13,fontFamily:'inherit',transition:'all .15s'}
            },lang==='en'?'Other...':'Ø£Ø®Ø±Ù‰...')
          )
        : null,
      (delayPrompt.isOther || pauseReasons.length === 0) && h('textarea',{
        autoFocus: pauseReasons.length === 0,
        value:delayPrompt.reason,
        onChange:function(e){setDelayPrompt(function(d){return Object.assign({},d,{reason:e.target.value});});},
        placeholder:t('delay_reason_placeholder'),
        rows:3,
        style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,boxSizing:'border-box',marginTop:8}
      })
    ),
    /* Pause prompt */
    pausePrompt && h(PauseModal, {
      pauseReasons: pauseReasons,
      stepLabel: pausePrompt.stepLabel || '',
      onClose: function(){ setPausePrompt(null); },
      onConfirm: function(reason, machine){
        var url = pausePrompt.stepId
          ? 'steps/'+pausePrompt.stepId+'/pause'
          : 'orders/'+pausePrompt.orderId+'/pause';
        apiFetch(url,{method:'POST',body:JSON.stringify({reason:reason, machine:machine||''})})
          .then(function(){
            setPausePrompt(null);
            if (pausePrompt.orderId) {
              apiFetch('orders/'+pausePrompt.orderId, {fresh:true}).then(function(updated){
                if (updated && updated.id) applyUpdatedOrder(updated);
              });
            }
            if(props.onSilentReload) props.onSilentReload();
          });
      }
    }),
    /* Form modal */
    form && h(Modal, {
      title:form.id?t('edit_order'):t('new_order'), subtitle:form.id?'#'+form.order_number:null,
      onClose:function(){ setForm(null); }, width:620,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);setOrderRecipients([]);setSelRecId('');}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    },
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Input, { label:t('order_number'), value:form.order_number, placeholder:'ORD-...', onChange:function(v){ setForm(function(f){return Object.assign({},f,{order_number:v});}); } }),
        h(Select, { label:t('priority'), value:form.priority, onChange:function(v){ setForm(function(f){return Object.assign({},f,{priority:v});}); }, options:[{value:'normal',label:t('normal')},{value:'high',label:t('high')},{value:'low',label:t('low')}] }),
        h('div', { style:{ position:'relative', marginBottom:14 } },
          h('label', { style:{ display:'block', fontSize:12, fontWeight:600, color:T.textMid, marginBottom:5 } }, t('customer')),
          h('input', {
            type:'text',
            value:customerQuickSearch,
            onChange:function(e){ setCustomerQuickSearch(e.target.value); setCustomerSuggestOpen(true); },
            placeholder:(lang==='en'?'Search customer...':'بحث سريع عن الزبون...'),
            style:Object.assign({}, iSt, { marginBottom:6 }),
            onFocus:function(e){ onFocus(e); setCustomerSuggestOpen(true); },
            onBlur:function(e){ onBlur(e); setTimeout(function(){ setCustomerSuggestOpen(false); }, 120); }
          }),
          customerSuggestOpen && customerQuickSearch && h('div', {
            style:{ position:'absolute', top:62, left:0, right:0, zIndex:50, background:T.bg, border:'1px solid '+T.border, borderRadius:T.radius, boxShadow:T.shadowLg, maxHeight:220, overflowY:'auto' }
          },
            quickCustomerMatches.length > 0
              ? quickCustomerMatches.map(function(c){
                  var lbl = (lang==='en'&&(c.company_name_en||c.name_en)) ? (c.company_name_en||c.name_en) : (c.company_name||c.name);
                  return h('button', {
                    key:c.id, type:'button',
                    onMouseDown:function(e){ e.preventDefault(); onCustChange(String(c.id)); setCustomerQuickSearch(lbl || ''); setCustomerSuggestOpen(false); },
                    style:{ width:'100%', textAlign:'start', padding:'9px 10px', border:'none', borderBottom:'1px solid '+T.border, background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:T.text }
                  }, lbl || '—');
                })
              : h('div', {
                  style:{ padding:'10px 12px', fontSize:12, color:T.textMute }
                }, lang==='en' ? 'No matching customers' : 'لا توجد نتائج مطابقة')
          )
        ),
        h(Select, {
          key:'order-contact-'+String(form.customer_id || ''),
          label:'👤 '+t('contact_person_lbl'),
          value:String(form.contact_person_id || ''),
          searchable:true,
          searchPlaceholder:(lang==='en' ? 'Search contact...' : 'بحث سريع عن جهة الاتصال...'),
          placeholder:(lang==='en' ? '— Select —' : '— اختر —'),
          options:contactOpts,
          onChange:function(v){
            var picked = contacts.filter(function(c){ return String(c.id) === String(v); })[0];
            setForm(function(f){
              return Object.assign({}, f, {
                contact_person_id: v || '',
                contact_person_name: picked ? (picked.name || '') : '',
                contact_person_phone: picked ? (picked.phone || '') : ''
              });
            });
          }
        }),
        h(Select, { label:'🚚 '+(lang==='en'?'Delivery Agent':'مندوب التوصيل'),
          value:String(form.delivery_employee_id||''),
          onChange:function(v){ setForm(function(f){ return Object.assign({},f,{delivery_employee_id:v}); }); },
          options: (function(){
            var deliveryEmpIds = {};
            /* From product_steps templates (assigned_employee_id / assigned_employee_ids) */
            asArr(liveProductSteps||[]).filter(function(ps){ return ps.is_delivery==1; }).forEach(function(ps){
              var eids = [];
              try { eids = typeof ps.assigned_employee_ids==='string' ? JSON.parse(ps.assigned_employee_ids||'[]') : asArr(ps.assigned_employee_ids); } catch(x){}
              if (ps.assigned_employee_id) eids = eids.concat([String(ps.assigned_employee_id)]);
              eids.forEach(function(id){ if(id) deliveryEmpIds[String(id)]=1; });
            });
            /* From actual item_steps in existing orders */
            asArr(orders).forEach(function(o){
              asArr(o.items).forEach(function(item){
                asArr(item.steps).forEach(function(step){
                  if (step.is_delivery != 1) return;
                  var eids = [];
                  try { eids = typeof step.assigned_employee_ids==='string' ? JSON.parse(step.assigned_employee_ids||'[]') : asArr(step.assigned_employee_ids); } catch(x){}
                  if (step.assigned_employee_id) eids = eids.concat([String(step.assigned_employee_id)]);
                  eids.forEach(function(id){ if(id) deliveryEmpIds[String(id)]=1; });
                });
              });
            });
            var filtered = asArr(bs.employees).filter(function(e){ return deliveryEmpIds[String(e.id)]; });
            return filtered.map(function(e){
                var nm=(lang==='en'&&e.name_en)?e.name_en:e.name;
                return {value:String(e.id), label:nm};
              });
          })()
        }),
        h(Input, { label:lang==='en'?'🗓 Customer Delivery Deadline':'🗓 موعد تسليم الزبون', type:'datetime-local', value:form.delivery_date||form.deadline||'', onChange:function(v){ setForm(function(f){return Object.assign({},f,{delivery_date:v, deadline:v});});} }),
        h('div', { style:{ display:'flex', alignItems:'center', paddingTop:20 } },
          h('label', { style:{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:T.textMid, fontWeight:600 } },
            h('input', { type:'checkbox', checked:form.is_urgent==1, onChange:function(e){ setForm(function(f){return Object.assign({},f,{is_urgent:e.target.checked?1:0});}); }, style:{ accentColor:T.red } }),
            '🔴 '+(lang==='en'?'Urgent':'عاجل')
          )
        )
      ),
      /* â”€â”€ Recipients section â”€â”€ */
      h('div', null,
        h(Divider, { label:t('order_recipients') }),
        h('div',{style:{display:'flex',gap:8,marginBottom:10,alignItems:'flex-end'}},
          h('div',{style:{flex:1, position:'relative'}},
            h('label', { style:{ display:'block', fontSize:12, fontWeight:600, color:T.textMid, marginBottom:5 } }, t('select_recipient')),
            h('input', {
              type:'text',
              value:recipientQuickSearch,
              onChange:function(e){ setRecipientQuickSearch(e.target.value); setRecipientSuggestOpen(true); },
              placeholder:(lang==='en'?'Search recipient...':'بحث سريع عن المستلم...'),
              style:Object.assign({}, iSt, { marginBottom:6 }),
              onFocus:function(e){ onFocus(e); setRecipientSuggestOpen(true); },
              onBlur:function(e){ onBlur(e); setTimeout(function(){ setRecipientSuggestOpen(false); }, 120); }
            }),
            recipientSuggestOpen && recipientQuickSearch && h('div', {
              style:{ position:'absolute', top:62, left:0, right:0, zIndex:50, background:T.bg, border:'1px solid '+T.border, borderRadius:T.radius, boxShadow:T.shadowLg, maxHeight:220, overflowY:'auto' }
            },
              quickRecipientMatches.length > 0
                ? quickRecipientMatches.map(function(r){
                    var nm=(lang==='en'&&r.name_en)?r.name_en:r.name;
                    var fullLabel = nm + (r.phone?' — '+r.phone:'');
                    return h('button', {
                      key:r.id, type:'button',
                      onMouseDown:function(e){ e.preventDefault(); setSelRecId(String(r.id)); setRecipientQuickSearch(fullLabel); setRecipientSuggestOpen(false); },
                      style:{ width:'100%', textAlign:'start', padding:'9px 10px', border:'none', borderBottom:'1px solid '+T.border, background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:T.text }
                    }, fullLabel);
                  })
                : h('div', {
                    style:{ padding:'10px 12px', fontSize:12, color:T.textMute }
                  }, lang==='en' ? 'No matching recipients' : 'لا توجد نتائج مطابقة')
            )
          ),
          h(Btn,{size:'sm',variant:'primary',disabled:!selRecId,onClick:function(){
            var rec = custRecs.find(function(r){ return String(r.id)===String(selRecId); });
            if (!rec) return;
            setOrderRecipients(function(prev){ return prev.concat([{recipient_id:rec.id,name:rec.name,phone:rec.phone||'',address:rec.address||''}]); });
            setSelRecId('');
            setRecipientQuickSearch('');
            setRecipientSuggestOpen(false);
          }},'+ '+t('add_recipient'))
        ),
        orderRecipients.length === 0
          ? null
          : orderRecipients.map(function(rec,idx){
              return h('div',{key:idx,style:{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border,marginBottom:6}},
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13}},rec.name||rec.rec_name||'â€”'),
                  rec.phone||rec.rec_phone ? h('div',{style:{fontSize:11,color:T.textMute}},rec.phone||rec.rec_phone) : null
                ),
                h(Btn,{size:'sm',variant:'danger',onClick:function(){ setOrderRecipients(function(prev){ return prev.filter(function(_,i){ return i!==idx; }); }); }},'Ã—')
              );
            })
      ),
      (function(){
        /* Order Items: always visible.
           - If editing and a specific item has started steps â†’ qty only (no delete, no product change, no notes)
           - If editing and item has no started steps â†’ full edit (add/delete/change product/qty/notes)
           - New order â†’ full edit always */
        var globalStarted = false;
        if (form.id) {
          var allSteps = [];
          asArr(form.items).forEach(function(item){ asArr(item.steps).forEach(function(s){ allSteps.push(s); }); });
          globalStarted = allSteps.some(function(s){ return s.status_slug==='in_progress'||s.status_slug==='done'; });
        }
        return h('div', null,
          h(Divider, { label:t('order_items_lbl') }),
          h('div', { style:{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 } },
            h('div', { style:{ flex:1, position:'relative' } },
              h('label', { style:{ display:'block', fontSize:12, fontWeight:600, color:T.textMid, marginBottom:5 } }, lang==='en' ? 'Search by Product Number / Name' : 'البحث برقم المنتج / الاسم'),
              h('input', {
                type:'text',
                value: productQuickSearch,
                placeholder: lang==='en' ? 'Type product number or name...' : 'اكتب رقم المنتج أو الاسم...',
                onChange: function(e){ setProductQuickSearch(e.target.value); setProductSuggestOpen(true); },
                style: Object.assign({}, iSt),
                onFocus: function(e){ onFocus(e); setProductSuggestOpen(true); },
                onBlur: function(e){ onBlur(e); setTimeout(function(){ setProductSuggestOpen(false); }, 120); }
              }),
              productSuggestOpen && quickProductMatches.length > 0 && h('div', {
                style:{
                  position:'absolute',
                  top:66,
                  left:0,
                  right:0,
                  zIndex:40,
                  background:T.bg,
                  border:'1px solid '+T.border,
                  borderRadius:T.radius,
                  boxShadow:T.shadowLg,
                  maxHeight:260,
                  overflowY:'auto'
                }
              },
                quickProductMatches.map(function(prod){
                  var desc = lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'');
                  return h('button', {
                    key:prod.id,
                    type:'button',
                    onMouseDown:function(e){ e.preventDefault(); addProductBySearch(prod); },
                    style:{
                      width:'100%',
                      textAlign:'start',
                      padding:'10px 12px',
                      border:'none',
                      borderBottom:'1px solid '+T.border,
                      background:'transparent',
                      cursor:'pointer',
                      fontFamily:'inherit'
                    }
                  },
                    h('div', { style:{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center' } },
                      h('div', { style:{ fontWeight:700, color:T.text, fontSize:13 } }, productLabel(prod)),
                      h('div', { style:{ fontSize:11, color:T.accent, fontWeight:700 } }, '+ '+t('add_item'))
                    ),
                    desc && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:5, lineHeight:1.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, desc)
                  );
                })
              )
            ),
            h('div', { style:{ paddingTop:24 } },
              h(Btn, { size:'sm', variant:'secondary', onClick:addItem }, '+ '+t('add_item'))
            )
          ),
          asArr(form.items).length === 0
            ? h('div',{style:{textAlign:'center',padding:'16px 0',color:T.textMute,fontSize:13}},'â€” '+t('add_item')+' â€”')
            : asArr(form.items).map(function(item, idx){
              var captureIdx = idx;
              /* Check if THIS specific item has started steps */
              var itemStarted = form.id && asArr(item.steps).some(function(s){ return s.status_slug==='in_progress'||s.status_slug==='done'; });
              return h('div', { key:idx, style:{ background:T.cardBg, border:'1px solid '+(itemStarted ? T.blue||'#6c63ff' : T.border), borderRadius:T.radius, padding:'12px', marginBottom:10 } },
                /* Row 1: product + qty + delete â€” all same height */
                h('div', { style:{ display:'flex', gap:8, alignItems:'flex-end' } },
                  /* Product dropdown â€” grows â€” disabled if item started */
                  h('div', { style:{ flex:'1 1 auto' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('product')),
                    itemStarted
                      ? h('div', {
                          style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box', display:'flex', alignItems:'center' }
                        }, ln(liveProducts.find(function(p){ return String(p.id)===String(item.product_id); })||{name_ar:item.product_name,name_en:item.product_name}, lang) || item.product_name || 'â€”')
                      : h('select', {
                          value: String(item.product_id||''),
                          onChange: function(e){
                            var pid = e.target.value;
                            var prod = liveProducts.find(function(p){ return String(p.id)===String(pid); });
                            var autoNotes = prod ? (lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'')) : '';
                            setForm(function(f){
                              var newItems = f.items.slice();
                              var existingNotes = newItems[captureIdx].notes;
                              newItems[captureIdx] = Object.assign({}, newItems[captureIdx], {
                                product_id: pid,
                                notes: (existingNotes && existingNotes.trim()) ? existingNotes : autoNotes
                              });
                              return Object.assign({}, f, {items: newItems});
                            });
                        },
                        style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                      },
                      h('option',{value:''},'â€” '+t('choose')+' â€”'),
                          liveProducts.map(function(p){ return h('option',{key:p.id,value:String(p.id)},productLabel(p)); })
                        )
                  ),
                  /* Qty input â€” always editable */
                  h('div', { style:{ flex:'0 0 80px' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('quantity')),
                    h('input', {
                      type:'number', min:1,
                      value: item.quantity,
                      onChange: function(e){ updateItem(captureIdx,'quantity',parseInt(e.target.value)||1); },
                      style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                    })
                  ),
                  /* Delete button â€” hidden if item started */
                  !itemStarted && h('button', {
                    onClick: function(){ removeItem(captureIdx); },
                    style:{ flex:'0 0 38px', height:38, background:'#c0123c', color:'#fff', border:'none', borderRadius:T.radius, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:0 }
                  }, 'Ã—')
                ),
                /* Row 2: notes/specs â€” always visible */
                h('div', { style:{ marginTop:8 } },
                  h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } },
                    lang==='ar' ? 'Ø§Ù„Ù…ÙˆØ§ØµÙØ§Øª' : 'Specifications'
                  ),
                  itemStarted
                    ? h('div', {
                        style:{ width:'100%', minHeight:38, padding:'8px 10px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box' }
                      }, item.notes || 'â€”')
                    : h('input', {
                        type:'text',
                        value: item.notes||'',
                        placeholder: lang==='ar' ? 'مواصفات / ملاحظات خاصة بهذا الطلب...' : 'Specs / notes for this order item...',
                        onChange: function(e){ updateItem(captureIdx,'notes',e.target.value); },
                        style:{ width:'100%', height:38, padding:'0 10px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                      })
                ),
                (productHasExternal(item.product_id) || itemExternalStep(item)) && h('div',{style:{marginTop:10,padding:'10px 12px',background:T.bgSub,border:'1px solid '+T.border,borderRadius:T.radius}},
                  h('div',{style:{fontSize:11,fontWeight:700,color:T.accent,marginBottom:8}},lang==='en'?'External Supplier Timing':'????? ?????? ???????'),
                  h('div',{style:{marginBottom:8}},
                    h(Select,{
                      label:lang==='en'?'Supplier':'??????',
                      value:String(item.supplier_id||''),
                      onChange:function(v){ updateItem(captureIdx,'supplier_id',v); },
                      options:[{value:'',label:lang==='en'?'? Select supplier ?':'? ???? ?????? ?'}].concat(
                        suppliers.map(function(s){
                          return {value:String(s.id), label:supplierLabel(s,lang)+(s.phone?' ? '+s.phone:'')};
                        })
                      )
                    })
                  ),
                  h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}},
                    h(Input,{label:lang==='en'?'Send Date/Time':'??? ???????',type:'datetime-local',value:item.external_send_at||'',onChange:function(v){ updateItem(captureIdx,'external_send_at',v); }}),
                    h(Input,{label:lang==='en'?'Promised Return':'??? ?????? ???????',type:'datetime-local',value:item.external_receive_expected||'',onChange:function(v){ updateItem(captureIdx,'external_receive_expected',v); }})
                  )
                ),
                null
              );
            })
        );
      })()
    ),
    /* Preview modal */
    preview && h(OrderPreviewModal, { order:preview, statuses:statuses, employees:employees, suppliers:suppliers, onClose:function(){ setPreview(null); },
      onOrderUpdate: function(updatedOrder){ 
        if(updatedOrder&&updatedOrder.id){ 
          applyUpdatedOrder(updatedOrder);
        } 
      },
      onSilentReload: props.onSilentReload,
      onReload: function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); },
      onStart:function(stepId){ return startStep(stepId, preview.id); },
      onAdvance:function(stepId, completedByIds, meta){ return completeStep(stepId, preview.id, completedByIds, meta); },
      onAdvanceWithExecutors:function(stepId, completedByIds, meta){ return completeStep(stepId, preview.id, completedByIds, meta); },
      onPauseStep:function(stepId, stepLabel, stepNameAr, stepNameEn){ pauseStep(stepId, preview.id, stepLabel, stepNameAr, stepNameEn); },
      onResumeStep:function(stepId){ resumeStep(stepId, preview.id); } })
  );
}

function OrderRow(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var order = props.order, statuses = props.statuses;
  var expectedMins  = props.expectedMins  || 0;
  var deliveryMins  = props.deliveryMins  || 0;
  var estCompletion = props.estCompletion || 0;
  var queuePos      = props.queuePos != null ? props.queuePos : -1;
  var queueLen      = props.queueLen || 0;
  var p = progOf(order);

  /* actual elapsed time on whole order lifecycle (production only) */
  var actualMins = 0;
  var timeDiffMins = 0;
  var timeStatus = null; /* 'on_time' | 'ahead' | 'late' */
  var nowMs = Date.now();
  var timingStats = orderActualStats(order);
  actualMins = timingStats.mins;
  var actualSecs = timingStats.secs;
  if (expectedMins > 0 && (timingStats.hasActual || order.started_at || order.production_started_at)) {
    timeDiffMins = actualMins - expectedMins;
    timeStatus = timeDiffMins <= 0 ? (timeDiffMins < -2 ? 'ahead' : 'on_time') : 'late';
  }
  var hasActual = timingStats.hasActual;
  var actualDisplay = actualMins > 0 ? fmtMin(actualMins) : (actualSecs > 0 ? actualSecs+'s' : null);

  /* deadline check: est finish of production + delivery vs deadline */
  var deadlineStatus = null; /* 'ok' | 'tight' | 'overdue' */
  var minsUntilDeadline = null;
  if (order.deadline && (expectedMins > 0 || deliveryMins > 0)) {
    var deadlineMs = new Date(order.deadline.replace(' ','T')).getTime();
    // remaining production time = expected - actual (floor 0)
    var remainingProdMs = Math.max(0, (expectedMins - actualMins) * 60000);
    var deliveryMs = deliveryMins * 60000;
    var estFinishMs = nowMs + remainingProdMs + deliveryMs;
    var diffMs = deadlineMs - estFinishMs;
    minsUntilDeadline = Math.round(diffMs / 60000);
    if (diffMs < 0) deadlineStatus = 'overdue';
    else if (diffMs < 60 * 60 * 1000) deadlineStatus = 'tight'; // less than 1h buffer
    else deadlineStatus = 'ok';
  }
  var allSteps = asArr(order.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
  var firstPending  = allSteps.filter(function(s){ return stepStatusSlug(s)==='pending'; })[0];
  var hasInProgress = allSteps.some(function(s){ return stepStatusSlug(s)==='in_progress'; });
  var hasDone       = allSteps.some(function(s){ var st = stepStatusSlug(s); return st==='done' || st==='completed'; });
  var orderSlugNorm = String(order.status_slug || '').toLowerCase().replace(/[^a-z_]/g,'');
  var explicitNotStarted = !order.started_at && !order.production_started_at && (orderSlugNorm === 'pending' || orderSlugNorm === '');
  /* orderStarted = actual order lifecycle start wins over noisy step payloads */
  var orderStarted  = explicitNotStarted ? false : (!!order.started_at || !!order.production_started_at || hasInProgress || hasDone);
  var showStart  = !!firstPending && !orderStarted;
  var next = orderStarted ? (allSteps.filter(function(s){ return stepStatusSlug(s)==='in_progress'; })[0] || null) : null;
  var isCancelled = order.status_slug === 'cancelled';
  var isPausedOrder = orderIsPaused(order);

  /* â”€â”€ status badge helpers â”€â”€ */
  var _activeStep = null;
  asArr(order.items).forEach(function(item){ asArr(item.steps).forEach(function(s){ if (!_activeStep && stepStatusSlug(s)==='in_progress') _activeStep = s; }); });
  var _stepLabel = _activeStep ? lnStep(_activeStep, lang) : null;
  var _sfallEn = { pending:'Pending', in_progress:'In Progress', paused:'Paused', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var _sfallAr = { pending:'Pending', in_progress:'In Progress', paused:'Paused', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var _sobj = asArr(statuses).find(function(x){ return x.slug===order.status_slug; });
  if (!_sobj) _sobj = asArr(statuses).find(function(x){ return (x.slug||'').toLowerCase().replace(/[^a-z]/g,'') === (order.status_slug||'').toLowerCase().replace(/[^a-z]/g,''); });
  var _normalSlug = (order.status_slug||'').toLowerCase().replace(/[^a-z_]/g,'').replace(/^in_progress.*/,'in_progress').replace(/^paus.*/,'paused').replace(/^done.*/,'done').replace(/^complet.*/,'completed').replace(/^cancel.*/,'cancelled').replace(/^pend.*/,'pending');
  var _sLabel = _sobj ? ln(_sobj,lang) : ((lang==='en'?_sfallEn:_sfallAr)[_normalSlug]||(order.status_slug||'').replace(/_/g,' ').replace(/I$/,''));
  var _scolor = ({pending:'gray',in_progress:'blue',paused:'amber',review:'amber',ready:'green',done:'green',completed:'green',cancelled:'red'})[_normalSlug]||'gray';
  var _sc = ({blue:{bg:'#dbeafe',text:'#1d4ed8'},green:{bg:'#dcfce7',text:'#15803d'},amber:{bg:'#fef3c7',text:'#b45309'},red:{bg:'#fee2e2',text:'#dc2626'},gray:{bg:T.bgSub,text:T.textMid}})[_scolor]||{bg:T.bgSub,text:T.textMid};
  var _badgeLabel = _stepLabel && !isDone(order) ? _sLabel+' — '+_stepLabel : _sLabel;
  var _dd = orderDeliveryDisplayAt(order);
  var _ddDate = parseServerDate(_dd);
  var _ddColor = _ddDate && !isNaN(_ddDate) && _ddDate < new Date() ? T.red : T.green;

  return h(Card, { style:{ marginBottom:10, padding:0, overflow:'hidden' } },
    h('div', { style:{ display:'flex' } },
      h('div', { style:{ width:4, background:order.is_urgent==1?T.red:T.accent, flexShrink:0 } }),
      h('div', { style:{ flex:1, padding:'12px 16px', minWidth:0 } },

        /* ROW 1: badges + buttons */
        h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8 } },
          h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' } },
            order.is_urgent==1 && h(Badge,{label:t('urgent'),color:'red',dot:true}),
            h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:14,color:T.text,whiteSpace:'nowrap'}},'#'+order.order_number),
            h('span',{style:{fontSize:11,padding:'2px 10px',borderRadius:99,background:_sc.bg,color:_sc.text,fontWeight:600,whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:4}},
              h('span',{style:{width:6,height:6,borderRadius:'50%',background:_sc.text,flexShrink:0}}),
              _badgeLabel
            ),
            isPausedOrder && h(Badge,{label:'Paused',color:'amber'}),
            order.priority==='high' && h(Badge,{label:t('high_priority'),color:'amber'})
          ),
          h('div',{style:{display:'flex',alignItems:'center',gap:6,flexShrink:0}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1,alignItems:'center'}},
              h('button',{onClick:props.onMoveUp,disabled:queuePos<=0,style:{background:'transparent',border:'none',cursor:queuePos>0?'pointer':'default',color:queuePos>0?T.accent:T.border,fontSize:11,padding:'2px',lineHeight:1}},'▲'),
              h('button',{onClick:props.onMoveDown,disabled:queuePos>=queueLen-1,style:{background:'transparent',border:'none',cursor:queuePos<queueLen-1?'pointer':'default',color:queuePos<queueLen-1?T.accent:T.border,fontSize:11,padding:'2px',lineHeight:1}},'▼')
            ),
            !showStart && h(Btn,{size:'sm',variant:'secondary',onClick:props.onPreview},next?t('return_to_order'):t('view')),
            showStart && h(Btn,{size:'sm',variant:'primary',onClick:function(){
              var req = props.onStart(firstPending.id, order.id);
              if (req && req.then && props.onStartedPreview) {
                req.then(function(updated){
                  if (updated && updated.id) props.onStartedPreview(updated);
                }).catch(function(){});
              }
            }},t('start')),
            !isCancelled && h(Btn,{size:'sm',variant:'secondary',onClick:props.onEdit},t('edit')),
            h(Btn,{size:'sm',variant:'secondary',onClick:props.onPrint},t('print')),
            orderStarted && !isCancelled
              ? h('div',{style:{display:'flex',gap:6}},
                  h(Btn,{size:'sm',variant:'danger',onClick:props.onCancel},t('stop_order'))
                )
              : !isCancelled && h(Btn,{size:'sm',variant:'danger',onClick:props.onDelete},t('delete'))
          )
        ),

        /* ROW 2: progress */
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:8}},
          h('div',{style:{flex:1}},h(ProgressBar,{value:p})),
          h('span',{style:{fontSize:11,color:T.textMute,whiteSpace:'nowrap'}},p+'%')
        ),

        /* ROW 3: customer + time | delivery date */
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8}},
            h('span',{style:{fontSize:12,whiteSpace:'nowrap'}},
              h('span',{style:{color:T.textMute}},t('customer_lbl')+' '),
              h('b',{style:{color:T.text,fontWeight:600}},getCust(order,lang))
            ),
            isDone(order) && expectedMins>0 && actualMins>0
              ? h('span',{style:{fontSize:11,fontWeight:600,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',color:actualMins<=expectedMins?T.green:T.red,background:actualMins<=expectedMins?'#dcfce7':'#fee2e2'}},
                  actualMins<=expectedMins
                    ? ((lang==='en'?'Faster by ':'أسرع بـ ')+fmtMin(expectedMins-actualMins))
                    : ((lang==='en'?'Slower by ':'أبطأ بـ ')+fmtMin(actualMins-expectedMins))
                )
              : h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                  expectedMins>0 && h('span',{style:{fontSize:11,color:T.textMute,background:T.bgSub,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap'}},'Exp: '+fmtMin(expectedMins)),
                  (order.started_at || order.production_started_at || hasActual) && actualDisplay && h('span',{style:{fontSize:11,fontWeight:600,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',color:timeStatus==='late'?T.red:timeStatus==='ahead'?T.green:T.textMid,background:timeStatus==='late'?'#fee2e2':timeStatus==='ahead'?'#dcfce7':T.bgSub}},
                    (lang==='en'?'Calculating: ':'الحساب: ')+actualDisplay
                  )
                ),
            order.delay_reason && h('span',{style:{background:'#fee2e2',color:T.red,borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},title:order.delay_reason},'Delay: '+order.delay_reason.slice(0,20)+(order.delay_reason.length>20?'...':'')),
            order.pause_reason && h('span',{style:{background:'#fef3c7',color:'#b45309',borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}},'Pause: '+order.pause_reason.slice(0,20)+(order.pause_reason.length>20?'...':''))
          ),
          _dd && h('div',{style:{display:'flex',alignItems:'center',gap:4,flexShrink:0}},
            h('span',{style:{fontSize:10,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}},lang==='en'?'Delivery':'التوصيل'),
            h('span',{style:{fontSize:12,fontWeight:600,whiteSpace:'nowrap',color:_ddColor}},fmtDateDayTime(_dd,lang))
          )
        )

      )
    )
  );
}


/* â•â•â• EXTERNAL STEP DATE PICKER â•â•â•
 * Props: step, orderId, suppliers, lang, onSaved(updatedOrder)
 * Clean component â€” no IIFE, no dead state, no closure issues
 * Uses controlled inputs with local state initialized once from props
 * After save: fetches fresh order and calls onSaved
 */
function ExtStepDatePicker(props) {
  var step      = props.step;
  var lang      = props.lang;
  var suppliers = props.suppliers || [];
  var sup       = step.supplier_id ? suppliers.filter(function(s){ return String(s.id)===String(step.supplier_id); })[0] : null;

  /* Local state â€” initialized once from DB values */
  var _send = useState(step.ext_send_at ? step.ext_send_at.slice(0,16) : '');
  var sendVal = _send[0], setSendVal = _send[1];
  var _recv = useState(step.ext_receive_expected ? step.ext_receive_expected.slice(0,16) : '');
  var recvVal = _recv[0], setRecvVal = _recv[1];
  var _saving = useState(false);
  var saving = _saving[0], setSaving = _saving[1];

  /* Local datetime string in browser timezone */
  function localNow() {
    var d = new Date();
    var p = function(n){ return String(n).padStart(2,'0'); };
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
  }

  function save() {
    setSaving(true);
    apiFetch('steps/'+step.id+'/ext-supplier', {
      method: 'POST',
      body: JSON.stringify({ ext_send_at: sendVal||null, ext_receive_expected: recvVal||null })
    }).then(function() {
      apiFetch('orders/'+props.orderId).then(function(u) {
        setSaving(false);
        if (u && u.id && props.onSaved) props.onSaved(u);
      }).catch(function(){ setSaving(false); });
    }).catch(function(){ setSaving(false); });
  }

  /* Delay indicator */
  var delay = null;
  var externalMetrics = step.external_metrics || {};
  var promisedMins = parseInt(externalMetrics.promised_duration_minutes, 10) || 0;
  var actualMins = parseInt(externalMetrics.actual_duration_minutes, 10) || 0;
  if (!promisedMins && step.ext_send_at && step.ext_receive_expected) {
    promisedMins = Math.round((new Date(step.ext_receive_expected) - new Date(step.ext_send_at)) / 60000);
    if (promisedMins < 0) promisedMins = 0;
  }
  if (!actualMins && step.ext_send_at && step.ext_receive_actual) {
    actualMins = Math.round((new Date(step.ext_receive_actual) - new Date(step.ext_send_at)) / 60000);
    if (actualMins < 0) actualMins = 0;
  }
  if (step.ext_receive_expected && step.ext_receive_actual) {
    var diffH = Math.round((new Date(step.ext_receive_actual) - new Date(step.ext_receive_expected)) / 36e5);
    delay = diffH > 0
      ? h('span',{style:{fontSize:11,fontWeight:700,color:T.red}}, diffH+'h '+(lang==='en'?'late':'تأخير'))
      : h('span',{style:{fontSize:11,fontWeight:700,color:T.green}}, (lang==='en'?'On time':'في الوقت'));
  }

  var inpSt = {fontSize:12,padding:'5px 8px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,outline:'none'};
  var nowSt = {fontSize:11,padding:'4px 8px',borderRadius:T.radius,border:'1px solid '+T.accent,background:T.accentDim,color:T.accent,cursor:'pointer',whiteSpace:'nowrap'};

  return h('div',{style:{padding:'10px 12px',borderTop:'1px dashed rgba(99,91,255,.2)',background:'rgba(99,91,255,.03)'}},
    /* Header: supplier info */
    h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
      h('span',{style:{fontSize:11,fontWeight:700,color:T.accent}},(lang==='en'?'External Step':'خطوة خارجية')),
      sup && h('span',{style:{fontSize:11,color:T.text,fontWeight:600}}, ln(sup,lang)),
      sup && sup.phone && h('a',{href:'tel:'+sup.phone,style:{fontSize:11,color:T.textMid,textDecoration:'none'}},sup.phone),
      sup && sup.map_url && h('a',{href:sup.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:11,color:T.accent,textDecoration:'none'}},(lang==='en'?'Map':'الخريطة'))
    ),
    /* Date fields */
    h('div',{style:{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}},
      /* Sent */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'Sent to Supplier':'أُرسل للمجهز'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:sendVal,
            onChange:function(e){ setSendVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setSendVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'Ø§Ù„Ø¢Ù†')
        )
      ),
      /* Expected receive */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'Expected Receive':'استلام متوقع'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:recvVal,
            onChange:function(e){ setRecvVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setRecvVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'Ø§Ù„Ø¢Ù†')
        )
      ),
      /* Save button */
      h('button',{
        onClick: save,
        disabled: saving,
        style:{alignSelf:'flex-end',padding:'6px 16px',background:saving?T.border:T.accent,color:'#fff',border:'none',borderRadius:T.radius,fontWeight:700,fontSize:12,cursor:saving?'default':'pointer',marginBottom:1}
      }, saving ? (lang==='en'?'Saving...':'جاري الحفظ...') : (lang==='en'?'Save':'حفظ')),
      (promisedMins>0 || actualMins>0) && h('div',{style:{display:'flex',flexDirection:'column',gap:3,marginInlineStart:4}},
        promisedMins>0 && h('span',{style:{fontSize:11,color:T.textMid,fontWeight:600}},(lang==='en'?'Promised Work Time: ':'وقت الوعد للمجهز: ')+fmtMin(promisedMins)),
        actualMins>0 && h('span',{style:{fontSize:11,color:T.textMid,fontWeight:600}},(lang==='en'?'Actual: ':'الفعلي: ')+fmtMin(actualMins))
      ),
      /* Delay indicator */
      delay
    )
  );
}

function OrderPreviewModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  /* Use local order state so we can update steps without full remount */
  var _ord = useState(props.order); var order = _ord[0], setOrder = _ord[1];
  var statuses = props.statuses;
  useEffect(function(){
    if (!props.order) return;
    setOrder(function(prev){
      if (!prev || String(prev.id) !== String(props.order && props.order.id)) {
        return props.order;
      }
      try {
        var prevJson = JSON.stringify(prev);
        var nextJson = JSON.stringify(props.order);
        return prevJson === nextJson ? prev : props.order;
      } catch (e) {
        return props.order;
      }
    });
  }, [props.order]);




  var employees = asArr(props.employees);
  var suppliers = asArr(props.suppliers);
  var p = progOf(order);
  var previewTiming = orderActualStats(order);
  var previewActualDisplay = previewTiming.mins > 0 ? fmtMin(previewTiming.mins) : (previewTiming.secs > 0 ? previewTiming.secs+'s' : null);
  var previewPaused = orderIsPaused(order);

  /* Partial delivery state */
  var _pd = useState(false); var showPartial = _pd[0]; var setShowPartial = _pd[1];
  var _selItems = useState({}); var selItems = _selItems[0]; var setSelItems = _selItems[1];
  var _pdSaving = useState(false); var pdSaving = _pdSaving[0]; var setPdSaving = _pdSaving[1];
  var _opsExpand = useState({}); var opsExpand = _opsExpand[0]; var setOpsExpand = _opsExpand[1];

  /* Delivery step confirm state */
  var _dc = useState(null); var deliveryConfirm = _dc[0]; var setDeliveryConfirm = _dc[1];
  var _dcm = useState('delivered_to_client'); var deliveryMode = _dcm[0]; var setDeliveryMode = _dcm[1];
  var _dce = useState(''); var deliveryExecutorId = _dce[0]; var setDeliveryExecutorId = _dce[1];
  var _ex = useState(null); var executorPrompt = _ex[0]; var setExecutorPrompt = _ex[1]; /* {stepId, teamId, employees} */
  var _sel = useState([]); var selectedExecutors = _sel[0]; var setSelectedExecutors = _sel[1];

  var items = asArr(order.items);
  /* Items that are production-done but not yet marked as delivered
     Detection: delivery step by flag OR by name containing deliver/ØªÙˆØµÙŠÙ„/ØªØ³Ù„ÙŠÙ… */
  function _isDelivStep(s) {
    if (s.is_delivery == 1) return true;
    var n = (s.step_name||'').toLowerCase();
    return n.indexOf('deliver') >= 0 || n.indexOf('ØªÙˆØµÙŠÙ„') >= 0 || n.indexOf('ØªØ³Ù„ÙŠÙ…') >= 0;
  }
  var deliverableItems = items.filter(function(item){
    var steps = asArr(item.steps);
    var prodSteps = steps.filter(function(s){ return !_isDelivStep(s); });
    var prodDone = prodSteps.length === 0 || prodSteps.every(function(s){ return s.status_slug==='done'||s.status_slug==='completed'; });
    var deliverySteps = steps.filter(_isDelivStep);
    var alreadyDelivered = deliverySteps.length > 0 && deliverySteps.every(function(s){ return s.status_slug==='done'||s.status_slug==='completed'; });
    return prodDone && !alreadyDelivered;
  });

  function toggleItem(id) {
    setSelItems(function(prev){ var n=Object.assign({},prev); n[id]=!n[id]; return n; });
  }
  function submitPartial() {
    var ids = Object.keys(selItems).filter(function(k){ return selItems[k]; }).map(Number);
    if (!ids.length) return;
    setPdSaving(true);
    apiFetch('orders/'+order.id+'/partial-deliver', {method:'POST', body:JSON.stringify({item_ids:ids})})
      .then(function(res){
        setPdSaving(false);
        setShowPartial(false);
        setSelItems({});
        if (props.onReload) props.onReload();
        /* Update preview with fresh order data */
        if (res && res.order) {
          /* keep modal open so user sees updated state */
        }
      })
      .catch(function(e){ setPdSaving(false); alert(e.message||'Error'); });
  }

  function optimisticStartStep(stepId) {
    var nowIso = localNowSql();
    setOrder(function(prev){
      var cloned = Object.assign({}, prev);
      cloned.status_slug = 'in_progress';
      if (!cloned.started_at) cloned.started_at = nowIso;
      cloned.items = asArr(prev.items).map(function(item){
        var hadMatch = false;
        var nextSteps = asArr(item.steps).map(function(step){
          if (String(step.id) !== String(stepId)) return step;
          hadMatch = true;
          return Object.assign({}, step, {
            status_slug:'in_progress',
            started_at: step.started_at || nowIso,
            actual_started_at: step.actual_started_at || nowIso
          });
        });
        if (hadMatch) {
          var active = nextSteps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
          if (active) cloned.current_step_label = active.step_name || prev.current_step_label || '';
        }
        return Object.assign({}, item, { steps: nextSteps });
      });
      return cloned;
    });
  }

  function optimisticAdvanceStep(stepId) {
    var nowIso = localNowSql();
    setOrder(function(prev){
      if (!prev) return prev;
      var cloned = Object.assign({}, prev);
      var anyInProgress = false;
      cloned.items = asArr(prev.items).map(function(item){
        var completedCurrent = false;
        var nextStarted = false;
        var nextSteps = asArr(item.steps).map(function(step){
          if (String(step.id) === String(stepId)) {
            completedCurrent = true;
            return Object.assign({}, step, {
              status_slug: 'done',
              completed_at: step.completed_at || nowIso,
              actual_completed_at: step.actual_completed_at || nowIso
            });
          }
          if (completedCurrent && !nextStarted && step.status_slug === 'pending') {
            nextStarted = true;
            anyInProgress = true;
            cloned.current_step_label = step.step_name || cloned.current_step_label || '';
            cloned.status_slug = 'in_progress';
            return Object.assign({}, step, {
              status_slug: 'in_progress',
              started_at: step.started_at || nowIso,
              actual_started_at: step.actual_started_at || nowIso
            });
          }
          if (step.status_slug === 'in_progress') anyInProgress = true;
          return step;
        });
        return Object.assign({}, item, { steps: nextSteps });
      });
      if (!anyInProgress) {
        var remainingPending = false;
        asArr(cloned.items).forEach(function(item){
          asArr(item.steps).forEach(function(step){
            if (step.status_slug === 'pending' || step.status_slug === 'in_progress') remainingPending = true;
          });
        });
        if (!remainingPending) {
          cloned.current_step_label = null;
          cloned.status_slug = 'done';
          cloned.completed_at = cloned.completed_at || nowIso;
          cloned.is_done = 1;
        }
      }
      return cloned;
    });
  }

  return h(Modal, {
    title:t('order_preview_title')+' #'+order.order_number, subtitle:getCust(order, lang),
    onClose:props.onClose, width:780,
    footer:h('div',{style:{display:'flex',gap:8,flex:1,alignItems:'center'}},
      h(Btn,{variant:"secondary",onClick:function(){openPrintWithLang(order,lang);}}, t('print')),
      order.delivery_map_url && h('a',{href:order.delivery_map_url,target:'_blank',style:{display:'inline-flex',alignItems:'center',padding:'8px 14px',background:T.blueBg,color:T.blue,borderRadius:T.radius,fontSize:13,textDecoration:'none',fontWeight:600}},t('map')),
      deliverableItems.length > 0 && items.length > 1 && h(Btn,{style:{background:'#d97706',color:'#fff',border:'none'},onClick:function(){
        var autoSel = {};
        deliverableItems.forEach(function(item){ autoSel[item.id] = true; });
        setSelItems(autoSel);
        setShowPartial(true);
      }},
        (lang==='en'?'Partial Delivery':'تسليم جزئي')
      ),
      h('div',{style:{flex:1}}),
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
null
    )
  },
    h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 } },
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('customer_lbl')),h('div',{style:{fontWeight:700,color:T.text}},getCust(order, lang)),
        order.contact_person_name && h('div',{style:{fontSize:12,color:T.accent,marginTop:4}}, order.contact_person_name+(order.contact_person_phone?' · '+order.contact_person_phone:''))
      ),
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('current_step_lbl')),
        (function(){
          var activeStep = null;
          asArr(order.items).forEach(function(item){
            asArr(item.steps).forEach(function(step){
              if (!activeStep && step.status_slug==='in_progress') activeStep = step;
            });
          });
          if (activeStep) return h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
            h('div',{style:{width:7,height:7,borderRadius:'50%',background:T.accent,flexShrink:0}}),
            h('span',{style:{fontWeight:700,color:T.text,fontSize:13}},lnStep(activeStep,lang)),
            previewPaused && h(Badge,{label:'Paused',color:'amber'})
          );
          if (p>=100) return h(Badge,{label:t('completed_lbl'),color:'green'});
          return statusBadge(order.status_slug, statuses, lang);
        })()
      ),
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('progress_lbl')),
        h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{flex:1}},h(ProgressBar,{value:p})),h('span',{style:{fontSize:12,fontWeight:700}},p+'%')),
        h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginTop:8}},
          previewActualDisplay && h('span',{style:{fontSize:11,fontWeight:700,borderRadius:99,padding:'2px 8px',background:T.bg,color:T.text}},(lang==='en'?'Calculating: ':'الحساب: ')+previewActualDisplay),
          previewPaused && h('span',{style:{fontSize:11,fontWeight:700,borderRadius:99,padding:'2px 8px',background:'#fef3c7',color:'#b45309'}},'Order Paused')
        )
      )
    ),
    h(Divider, { label:t('steps_lbl') }),
    (function(){
      var linkedOpsTasks = asArr(order.ops_tasks);
      if (!linkedOpsTasks.length) return null;
      function isExpanded(taskId) {
        return !!opsExpand[String(taskId)];
      }
      function toggleExpand(taskId) {
        setOpsExpand(function(prev){
          var key = String(taskId);
          var next = Object.assign({}, prev || {});
          next[key] = !next[key];
          return next;
        });
      }
      function parseEmployeeIds(raw) {
        if (Array.isArray(raw)) return raw.map(function(v){ return String(v); }).filter(Boolean);
        if (!raw) return [];
        if (typeof raw === 'string') {
          try {
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.map(function(v){ return String(v); }).filter(Boolean) : [];
          } catch(_e) { return []; }
        }
        return [];
      }
      function employeeNameById(id) {
        var emp = findBy(asArr(employees), 'id', parseInt(id, 10));
        if (!emp) return '';
        return (lang === 'en' && emp.name_en) ? emp.name_en : (emp.name || emp.name_en || '');
      }
      function taskAssignees(task) {
        if (!task) return [];
        var names = [];
        if (Array.isArray(task.assigned_employees) && task.assigned_employees.length) {
          names = task.assigned_employees.map(function(e){
            return (lang === 'en' && e.name_en) ? e.name_en : (e.name || e.name_en || '');
          }).filter(Boolean);
        }
        if (!names.length) {
          var ids = parseEmployeeIds(task.assigned_employee_ids);
          if (!ids.length && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
          names = ids.map(employeeNameById).filter(Boolean);
        }
        if (!names.length && (task.assigned_employee_name || task.assigned_employee_name_en)) {
          names = [ (lang==='en' && task.assigned_employee_name_en) ? task.assigned_employee_name_en : (task.assigned_employee_name || task.assigned_employee_name_en) ];
        }
        return names;
      }
      function eventAssignees(evt) {
        var pld = (evt && evt.payload) || {};
        var ids = parseEmployeeIds(pld.assigned_employee_ids);
        if (!ids.length && pld.assigned_employee_id) ids = [String(pld.assigned_employee_id)];
        var names = ids.map(employeeNameById).filter(Boolean);
        if (!names.length && evt && evt.created_by_name) names = [evt.created_by_name];
        return names;
      }
      return h('div', { style:{ marginBottom:14 } },
        h('div', { style:{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8, textTransform:'uppercase', letterSpacing:.3 } },
          lang==='en' ? 'Operations completed before production' : 'مهام التشغيل المنجزة قبل الإنتاج'
        ),
        linkedOpsTasks.map(function(task){
          var events = asArr(task.timeline).filter(function(evt){
            return evt && (evt.event_type === 'task_moved' || evt.event_type === 'task_completed');
          }).slice().sort(function(a, b){
            return String(a.event_time || a.created_at || '').localeCompare(String(b.event_time || b.created_at || ''));
          });
          var expanded = isExpanded(task.id);
          var latestEvt = events.length ? events[events.length - 1] : null;
          var assignees = taskAssignees(task);
          return h('div', { key:'ops-task-'+task.id, style:{ border:'1px solid '+T.border, borderRadius:T.radius, background:T.bgSub, padding:'8px 10px', marginBottom:8 } },
            h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6 } },
              h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' } },
                h('span', { style:{ fontSize:12, fontWeight:700, color:T.accent } }, task.task_no || ('OT-' + task.id)),
                h(Btn, {
                  size:'sm',
                  variant:'secondary',
                  onClick:function(){ toggleExpand(task.id); }
                }, expanded
                  ? (lang==='en' ? 'Collapse' : 'طي')
                  : (lang==='en' ? 'Expand' : 'توسيع')
                )
              ),
              h('div', { style:{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' } },
                task.deadline && h(Badge,{label:(lang==='en'?'Deadline: ':'الموعد النهائي: ')+fmtDateTime(task.deadline, lang), color:'gray'}),
                h(Badge,{label:(lang==='en'?'Done: ':'الإنجاز: ')+(task.completed_at ? fmtDateTime(task.completed_at, lang) : '—'), color:'green'})
              )
            ),
            task.description && expanded && h('div', { style:{ fontSize:12, color:T.text, marginBottom:6 } }, task.description),
            h('div', { style:{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:8 } },
              h('span', { style:{ fontSize:11, color:T.textMute, fontWeight:700 } }, lang==='en' ? 'Assigned:' : 'المكلف:'),
              assignees.length
                ? assignees.map(function(n, i){ return h(Badge, { key:'ops-task-assignee-'+task.id+'-'+i, label:n, color:'blue' }); })
                : h('span',{style:{fontSize:11,color:T.textMute}},'—')
            ),
            !expanded
              ? h('div', { style:{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'center', flexWrap:'wrap', padding:'6px 8px', border:'1px solid '+T.border, borderRadius:10, background:T.bg } },
                  h('div', { style:{ fontSize:11, color:T.textMid } },
                    latestEvt
                      ? ((latestEvt.event_type === 'task_completed'
                          ? (lang==='en' ? 'Latest: Completed' : 'آخر حدث: مكتملة')
                          : (lang==='en' ? 'Latest: Moved' : 'آخر حدث: انتقال')
                        ) + ' • ' + fmtDateTime(latestEvt.event_time || latestEvt.created_at, lang))
                      : (lang==='en' ? 'No movement log yet' : 'لا يوجد سجل تنقّل بعد')
                  ),
                  h(Badge, { label:(events.length || 0) + ' ' + (lang==='en' ? 'events' : 'حدث'), color:'gray' })
                )
              : (events.length === 0
                ? h('div', { style:{ fontSize:11, color:T.textMute } }, lang==='en' ? 'No movement log yet' : 'لا يوجد سجل تنقّل بعد')
                : h('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
                  events.map(function(evt, idx){
                    var pld = evt.payload || {};
                    var fromTxt = [pld.from_department_name, pld.from_stage_name].filter(Boolean).join(' / ');
                    var toTxt = [pld.to_department_name, pld.to_stage_name].filter(Boolean).join(' / ');
                    var prev = idx > 0 ? events[idx - 1] : null;
                    var gapTxt = '';
                    if (prev) {
                      var a = parseServerDate(evt.event_time || evt.created_at || '');
                      var b = parseServerDate(prev.event_time || prev.created_at || '');
                      if (!isNaN(a) && !isNaN(b)) {
                        var mins = Math.max(0, Math.round((a - b) / 60000));
                        gapTxt = ' • ' + (lang==='en' ? 'Gap: ' : 'الفاصل: ') + fmtMin(mins);
                      }
                    }
                    var evAssignees = eventAssignees(evt);
                    return h('div', { key:'ops-evt-' + (evt.id || idx), style:{ border:'1px solid '+T.border, borderRadius:10, background:T.bg, padding:'8px 10px', fontSize:11, color:T.textMid, lineHeight:1.5 } },
                      h('div', { style:{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap' } },
                        h('div', { style:{ fontWeight:700, color:T.text } },
                          evt.event_type === 'task_completed'
                            ? (lang==='en' ? 'Completed' : 'مكتملة')
                            : (lang==='en' ? 'Moved' : 'انتقال')
                        ),
                        h('div', { style:{ color:T.textMute } }, fmtDateTime(evt.event_time || evt.created_at, lang) + gapTxt)
                      ),
                      h('div', { style:{ marginTop:4 } },
                        (evt.event_type === 'task_completed'
                          ? ((lang==='en' ? 'Completed at ' : 'اكتملت عند ') + ((toTxt || fromTxt || '—')))
                          : ((lang==='en' ? 'Moved ' : 'انتقلت ') + (fromTxt || '—') + ' → ' + (toTxt || '—'))
                        )
                      ),
                      h('div', { style:{ marginTop:6, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' } },
                        h('span', { style:{ fontSize:10, color:T.textMute, fontWeight:700 } }, lang==='en' ? 'By:' : 'بواسطة:'),
                        evAssignees.length
                          ? evAssignees.map(function(n, i){ return h(Badge, { key:'ops-evt-assignee-'+(evt.id||idx)+'-'+i, label:n, color:'gray' }); })
                          : h('span', { style:{ fontSize:10, color:T.textMute } }, '—')
                      )
                    );
                  })
                ))
          );
        })
      );
    })(),
    asArr(order.items).map(function(item){
      return h('div', { key:item.id, style:{ marginBottom:14 } },
        h('div', { style:{ fontWeight:700, fontSize:13, marginBottom: item.notes ? 4 : 8, display:'flex', alignItems:'center', gap:8 } },
          h('span', { style:{ background:T.bgSub, padding:'2px 10px', borderRadius:99, fontSize:12 } }, (lang==='en' && item.product_name_en) ? item.product_name_en : item.product_name),
          h('span', { style:{ color:T.textMute, fontWeight:400 } }, '× '+item.quantity)
        ),
        item.notes && h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:8, padding:'4px 10px', background:T.bgSub, borderRadius:T.radius, borderLeft:'3px solid '+T.accent } },
          item.notes
        ),
        (function(){
          var hasAnyInProgress = asArr(item.steps).some(function(s){ return s.status_slug==='in_progress'; });
          var firstPendingStep = asArr(item.steps).filter(function(s){ return s.status_slug==='pending'; })[0] || null;
          return asArr(item.steps).map(function(step, stepIdx){
            var isDoneStep  = step.status_slug==='done'||step.status_slug==='completed';
            var isActive    = step.status_slug==='in_progress';
            var isPaused    = step.is_paused == 1;
            var isFirstPend = step.status_slug==='pending' && firstPendingStep && String(step.id)===String(firstPendingStep.id) && !hasAnyInProgress;
            var isNextPend  = step.status_slug==='pending' && firstPendingStep && String(step.id)===String(firstPendingStep.id) && hasAnyInProgress;
            var emp = step.assigned_employee_id ? findBy(employees, 'id', step.assigned_employee_id) : null;
            // completed_by_ids = who actually did it (set at confirm time)
            var completedByIds = [];
            try { completedByIds = typeof step.completed_by_ids==='string' ? JSON.parse(step.completed_by_ids||'[]') : (step.completed_by_ids||[]); } catch(e){}
            var completedEmps = completedByIds.map(function(id){ return findBy(employees,'id',id); }).filter(Boolean);
            // fallback to assigned if completed_by_ids empty
            var assignedEmpIds = [];
            try { assignedEmpIds = typeof step.assigned_employee_ids==='string' ? JSON.parse(step.assigned_employee_ids||'[]') : (step.assigned_employee_ids||[]); } catch(e){}
            var assignedEmps = completedEmps.length > 0 ? completedEmps :
              assignedEmpIds.map(function(id){ return findBy(employees,'id',id); }).filter(Boolean);
            if (!assignedEmps.length && emp) assignedEmps = [emp];
            var isExt = step.is_external == 1 && !isDoneStep;
            var stepActual = stepActualStats(step);
            var stepActualDisplay = stepActual.mins > 0 ? fmtMin(stepActual.mins) : (stepActual.secs > 0 ? stepActual.secs+'s' : '0m');
            return h('div', { key:step.id, style:{ display:'flex', flexDirection:'column', gap:0, background: isPaused ? 'rgba(251,191,36,.07)' : isActive ? 'rgba(34,197,94,.08)' : (isFirstPend||isNextPend) ? 'rgba(99,91,255,.06)' : T.bgSub, borderRadius:T.radius, marginBottom:5, border: isPaused ? '1px solid rgba(251,191,36,.3)' : isActive ? '1px solid rgba(34,197,94,.35)' : (isFirstPend||isNextPend) ? '1px dashed '+T.accent : step.is_external==1 ? '1px solid rgba(99,91,255,.3)' : '1px solid transparent' } },
              h('div',{style:{display:'grid', gridTemplateColumns:'16px 1fr 160px 44px 130px auto', alignItems:'center', gap:8, padding:'10px 12px'}},
              h('div', { style:{ width:7, height:7, borderRadius:'50%', background: isDoneStep?'#22c55e': isPaused?'#f59e0b': isActive?'#22c55e' : (isFirstPend||isNextPend) ? T.accent : T.border, justifySelf:'center', opacity: (isFirstPend||isNextPend) ? .55 : 1 } }),
              h('div',{style:{display:'flex',flexDirection:'column',gap:2}},
                h('span', { style:{ fontSize:13, fontWeight: isActive||isFirstPend||isNextPend?600:400, color: isActive?'#16a34a':(isFirstPend||isNextPend)?T.accent:T.text } }, lnStep(step,lang)),
                isActive && h('span',{style:{fontSize:11,color:'#16a34a',fontWeight:600}},lang==='en'?'Current step':'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©'),
                isNextPend && h('span',{style:{fontSize:11,color:T.accent,fontWeight:600}},lang==='en'?'Next step':'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©'),
                isPaused && step.pause_reason && h('span',{style:{fontSize:11,color:'#b45309'}},'Pause: '+step.pause_reason+(step.paused_machine?' - '+step.paused_machine:'')),
null
              ),
              h('div', { style:{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', flexWrap:'wrap' } },
                isDoneStep && assignedEmps.length > 0
                  ? assignedEmps.map(function(e){ return h('div',{key:e.id,style:{display:'flex',alignItems:'center',gap:4,background:T.bg,borderRadius:99,padding:'3px 8px',border:'1px solid '+T.border}},
                      h('span',{style:{fontSize:11,color:T.textMid,whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}},ln(e,lang))
                    ); })
                  : null
              ),
              h('div', { style:{ fontSize:11, color:T.textMute, textAlign:'center', display:'flex', flexDirection:'column', gap:2 } },
                h('span', null, (lang==='en'?'Exp: ':'المتوقع: ')+fmtMin(stepExpectedStepMins(step, item, null))),
                h('span', { style:{ color:T.textMid, fontWeight:600 } }, (lang==='en'?'Act: ':'الفعلي: ')+stepActualDisplay)
              ),
              h('div', { style:{ display:'flex', justifyContent:'center' } }, statusBadge(isPaused?'paused':step.status_slug, statuses, lang)),
              h('div', { style:{ display:'flex', justifyContent:'flex-end', gap:4 } },
                isFirstPend && !isPaused
                  ? h(Btn,{size:'sm',variant:'primary',onClick:function(){
                      var req = props.onStart(step.id);
                      if (req && req.then) {
                        req.then(function(updated){
                          if (updated && updated.id) setOrder(updated);
                        }).catch(function(){});
                      }
                    }}, '▶ '+t('start'))
                  : isActive && !isPaused
                    ? h('div',{style:{display:'flex',gap:4}},
                        step.is_delivery == 1
                           ? h(Btn,{size:'sm',variant:'success',onClick:function(){
                               var assignedIds = [];
                               try {
                                 var rawIds = step.assigned_employee_ids;
                                 if (Array.isArray(rawIds)) assignedIds = rawIds.map(String);
                                 else assignedIds = JSON.parse(rawIds||'[]').map(String);
                               } catch(e) { assignedIds = []; }
                               var teamId = step.assigned_team_id || '';
                               var teamEmployees = [];
                               if (assignedIds.length > 0) {
                                 teamEmployees = employees.filter(function(e){
                                   return assignedIds.indexOf(String(e.id)) >= 0;
                                 });
                               }
                               if (!teamEmployees.length && teamId) {
                                 teamEmployees = employees.filter(function(e){
                                   return String(e.team_id) === String(teamId);
                                 });
                               }
                               var direction = deliveryDirectionOf(step);
                               setDeliveryMode(direction || 'delivered_to_client');
                               setDeliveryExecutorId(teamEmployees.length ? String(teamEmployees[0].id) : '');
                               setDeliveryConfirm({
                                 stepId: step.id,
                                 itemName: item.product_name||item.product_name_en||'—',
                                 qty: item.quantity,
                                 direction: direction,
                                 teamEmployees: teamEmployees.map(function(e){
                                   return { id:String(e.id), name:ln(e,lang) };
                                 })
                               });
                             }}, '✓')
                          : h(Btn,{size:'sm',variant:'success',onClick:function(){
                              /* show who-did-it prompt if step has assigned employees or team */
                              var assignedIds = [];
                              try {
                                var raw = step.assigned_employee_ids;
                                if (Array.isArray(raw)) { assignedIds = raw; }
                                else { assignedIds = JSON.parse(raw||'[]'); }
                              } catch(e){ assignedIds = []; }
                              var teamId = step.assigned_team_id;
                              var teamEmps = [];
                              if (assignedIds.length > 0) {
                                teamEmps = employees.filter(function(e){ return assignedIds.indexOf(parseInt(e.id)) >= 0 || assignedIds.indexOf(String(e.id)) >= 0; });
                              }
                              if (!teamEmps.length && teamId) {
                                teamEmps = employees.filter(function(e){ return String(e.team_id) === String(teamId); });
                              }
                              if (teamEmps.length > 0) {
                                setSelectedExecutors([]); // âœ… reset selections for new step
                                setExecutorPrompt({stepId: step.id, employees: teamEmps, stepName: lnStep(step, lang)});
                              } else {
                                optimisticAdvanceStep(step.id);
                                props.onAdvance(step.id);
                              }
                            }}, '✓'),
                        step.is_delivery != 1 && props.onPauseStep && h('button',{onClick:function(){props.onPauseStep(step.id, lnStep(step,lang), step.step_name, step.step_name_en);},style:{padding:'4px 8px',borderRadius:T.radius,border:'1px solid #f59e0b',background:'rgba(245,158,11,.1)',color:'#b45309',cursor:'pointer',fontSize:12,fontWeight:600}},'â¸')
                      )
                    : isPaused
                      ? props.onResumeStep && h(Btn,{size:'sm',style:{background:'#22c55e',color:'#fff',border:'none'},onClick:function(){props.onResumeStep(step.id);}},lang==='en'?'Resume':'Ø§Ø³ØªØ¦Ù†Ø§Ù')
                      : isDoneStep
                        ? h('div',{style:{width:28,height:28,borderRadius:6,background:'rgba(34,197,94,.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22c55e',fontSize:14}},'✓')
                        : null
              )
              ), /* end inner grid row */
              /* â”€â”€ External Supplier Panel â”€â”€ */
              step.is_external==1 && h(ExtStepDatePicker,{
                key: 'ext-'+step.id,
                step: step,
                orderId: order.id,
                suppliers: suppliers,
                lang: lang,
                onSaved: function(updatedOrder){
                  if(props.onSilentReload) props.onSilentReload();
                  if(props.onOrderUpdate) props.onOrderUpdate(updatedOrder);
                }
              })
            );
          });
        })()
      );
    }),
    /* â”€â”€ Partial Delivery modal â”€â”€ */
    showPartial && h(Modal, {
      title: lang==='en' ? 'Move to Delivery' : 'تحويل للتوصيل',
      onClose: function(){ setShowPartial(false); setSelItems({}); },
      width: 460,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setShowPartial(false); setSelItems({}); }},t('cancel')),
        h(Btn,{variant:'primary',disabled:pdSaving||!Object.values(selItems).some(Boolean),onClick:submitPartial},
          pdSaving ? (lang==='en'?'Saving...':'جاري الحفظ...') : (lang==='en'?'Move to Delivery':'تحويل للتوصيل')
        )
      )
    },
      deliverableItems.length === 0
        ? h('div',{style:{color:T.textMute,textAlign:'center',padding:'20px 0'}},
            lang==='en'?'No items ready for delivery yet':'لا توجد منتجات جاهزة للتسليم'
          )
        : h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            h('p',{style:{color:T.textMid,fontSize:13,margin:'0 0 8px'}},
              lang==='en'?'These products are ready. Select which to move to delivery:':'المنتجات الجاهزة، اختر ما تريد تحويله إلى التوصيل:'
            ),
            deliverableItems.map(function(item){
              var checked = !!selItems[item.id];
              var itemName = (lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name;
              return h('div',{key:item.id,
                onClick:function(){ toggleItem(item.id); },
                style:{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:T.radius,
                  border:'2px solid '+(checked?T.accent:T.border),
                  background:checked?T.accentDim:T.bgSub,
                  cursor:'pointer',transition:'all .15s'}
              },
                h('div',{style:{width:22,height:22,borderRadius:4,border:'2px solid '+(checked?T.accent:T.border),
                  background:checked?T.accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}},
                  checked && h('span',{style:{color:'#fff',fontSize:13,fontWeight:700}},'✓')
                ),
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13,color:T.text}},itemName),
                  h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'× '+item.quantity)
                ),
                h('span',{style:{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#dcfce7',color:'#15803d',fontWeight:600,flexShrink:0}},
                  lang==='en'?'Ready':'جاهز'
                )
              );
            })
          )
    ),

    /* â”€â”€ Delivery Confirm Modal â”€â”€ */
    deliveryConfirm && h(Modal, {
      title: '📦 '+deliveryDirectionMeta(deliveryMode || deliveryConfirm.direction, lang).title,
      onClose: function(){ setDeliveryConfirm(null); setDeliveryMode('delivered_to_client'); setDeliveryExecutorId(''); },
      width: 460,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setDeliveryConfirm(null); setDeliveryMode('delivered_to_client'); setDeliveryExecutorId(''); }}, t('cancel')),
        h(Btn,{variant:'primary',onClick:function(){
          if (deliveryMode === 'delivered_to_client' && !deliveryExecutorId) {
            alert(lang==='en' ? 'Please select who delivered the order.' : 'يرجى اختيار من قام بالتوصيل.');
            return;
          }
          var completedIds = deliveryMode === 'delivered_to_client' && deliveryExecutorId ? [String(deliveryExecutorId)] : [];
          optimisticAdvanceStep(deliveryConfirm.stepId);
          var req = props.onAdvance(deliveryConfirm.stepId, completedIds, {delivery_direction:deliveryMode});
          if (req && req.then) {
            req.then(function(updated){
              if (updated && updated.id) setOrder(updated);
            }).catch(function(){});
          }
          setDeliveryConfirm(null);
          setDeliveryMode('delivered_to_client');
          setDeliveryExecutorId('');
        }}, deliveryDirectionMeta(deliveryMode || deliveryConfirm.direction, lang).action)
      )
    },
      h('div',{style:{padding:'4px 0'}},
        h(Select,{
          label:(lang==='en'?'Delivery mode':'نوع التوصيل'),
          value:deliveryMode || (deliveryConfirm.direction || 'delivered_to_client'),
          onChange:function(v){ setDeliveryMode(v||'delivered_to_client'); if (v !== 'delivered_to_client') setDeliveryExecutorId(''); },
          options:[
            {value:'delivered_to_client',label:(lang==='en'?'Delivered to client':'توصيل الى الزبون')},
            {value:'received_by_client',label:(lang==='en'?'Received by client':'استلمت من قبل الزبون')}
          ]
        }),
        (deliveryMode === 'delivered_to_client') && h(Select,{
          label:(lang==='en'?'Who delivered it?':'منو وصلها؟'),
          value:String(deliveryExecutorId||''),
          onChange:function(v){ setDeliveryExecutorId(String(v||'')); },
          options:(deliveryConfirm.teamEmployees||[]).map(function(e){ return {value:String(e.id), label:e.name}; }),
          placeholder:(lang==='en'?'— Select delivery employee —':'— اختر موظف التوصيل —')
        }),
        h('p',{style:{fontSize:13,color:T.textMid,marginBottom:14}},
          deliveryDirectionMeta(deliveryMode || deliveryConfirm.direction, lang).body
        ),
        h('div',{style:{border:'1.5px solid '+T.accent,borderRadius:T.radius,padding:'12px 16px',background:T.accentDim,display:'flex',alignItems:'center',gap:10}},
          h('div',{style:{width:20,height:20,borderRadius:4,background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},
            h('span',{style:{color:'#fff',fontSize:12,fontWeight:700}},'✓')
          ),
          h('div',null,
            h('div',{style:{fontWeight:600,fontSize:13,color:T.text}}, deliveryConfirm.itemName),
            h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'× '+deliveryConfirm.qty)
          )
        )
      )
    ),

    /* â”€â”€ Who did it? Modal â”€â”€ */
    executorPrompt && h(Modal, {
      title: '👤 '+(lang==='en'?'Who completed this step?':'من نفّذ هذه الخطوة؟'),
      onClose: function(){ setExecutorPrompt(null); setSelectedExecutors([]); },
      width: 420,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'primary',onClick:function(){
          var stepId = executorPrompt.stepId;
          var ids = selectedExecutors.slice();
          optimisticAdvanceStep(stepId);
          setExecutorPrompt(null); setSelectedExecutors([]);
          // use onAdvanceWithExecutors if available, else fallback to onAdvance
          if (props.onAdvanceWithExecutors) {
            var req = props.onAdvanceWithExecutors(stepId, ids);
            if (req && req.then) {
              req.then(function(updated){
                if (updated && updated.id) setOrder(updated);
              }).catch(function(){});
            }
          } else {
            var req2 = props.onAdvance(stepId, ids);
            if (req2 && req2.then) {
              req2.then(function(updated){
                if (updated && updated.id) setOrder(updated);
              }).catch(function(){});
            }
          }
        }}, lang==='en'?'Confirm':'تأكيد')
      )
    },
      h('div',{style:{marginBottom:8,fontSize:13,color:T.textMid}},
        lang==='en'?'Step: ':'الخطوة: ',
        h('b',null, executorPrompt.stepName)
      ),
      h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
        executorPrompt.employees.map(function(emp){
          var isSelected = selectedExecutors.indexOf(String(emp.id)) !== -1;
          return h('div',{
            key:emp.id,
            onClick:function(){
              var sid = String(emp.id);
              setSelectedExecutors(function(prev){
                return isSelected ? prev.filter(function(x){ return x!==sid; }) : prev.concat([sid]);
              });
            },
            style:{
              display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
              borderRadius:T.radius,cursor:'pointer',transition:'background .15s, border .15s',
              border:'2px solid '+(isSelected ? T.accent : T.border),
              background: isSelected ? T.accentDim : T.bgSub
            }
          },
            h('div',{style:{
              width:20,height:20,borderRadius:4,flexShrink:0,
              border:'2px solid '+(isSelected?T.accent:T.border),
              background:isSelected?T.accent:'transparent',
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'
            }},
              isSelected && h('span',{style:{color:'#fff',fontSize:12,fontWeight:700,lineHeight:1}},'✓')
            ),
            h('span',{style:{fontWeight:600,fontSize:13,color:T.text}},ln(emp,lang))
          );
        })
      )
    )
  );
}

/* â•â•â• ARCHIVED ORDERS â•â•â• */
function ArchivedOrdersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders   = asArr(bs.orders).filter(isDone);
  var statuses = asArr(bs.statuses);
  var _p = useState(null); var preview = _p[0], setPreview = _p[1];
  var _rm = useState(null); var restoreModal = _rm[0], setRestoreModal = _rm[1];
  var _rs = useState(false); var restoring = _rs[0], setRestoring = _rs[1];
  var _page = useState(1); var page = _page[0], setPage = _page[1];
  var _perPage = useState(25); var perPage = _perPage[0], setPerPage = _perPage[1];
  var search = useSearch().q;
  var products = asArr(bs.products);

  var filtered = search.trim()
    ? orders.filter(function(o){
        var q = search.toLowerCase();
        return (o.order_number||'').toLowerCase().indexOf(q)>=0
          || getCust(o, lang).toLowerCase().indexOf(q)>=0
          || (o.completed_at||'').indexOf(q)>=0;
      })
    : orders;

  var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  var safePage   = Math.min(page, totalPages);
  var pageOrders = filtered.slice((safePage-1)*perPage, safePage*perPage);

  function buildRestoreModal(order) {
    var fresh = order || {};
    var items = asArr(fresh.items).map(function(item){
      return {
        id: item.id || null,
        product_id: String(item.product_id || ''),
        product_name: item.product_name || '',
        product_name_en: item.product_name_en || '',
        quantity: parseInt(item.quantity) || 1,
        notes: item.notes || ''
      };
    });
    var stepMap = {};
    var stepOptions = [];
    asArr(fresh.items).forEach(function(item){
      asArr(item.steps).forEach(function(step){
        if (!step || !step.id) return;
        var key = String(step.id);
        if (stepMap[key]) return;
        stepMap[key] = 1;
        var prodName = lang === 'en'
          ? (item.product_name_en || item.product_name || '')
          : (item.product_name || item.product_name_en || '');
        var stepName = lang === 'en' && step.step_name_en ? step.step_name_en : (step.step_name || step.step_name_en || '');
        stepOptions.push({
          order: (step.step_order ? parseInt(step.step_order, 10) : 0) || 0,
          value: String(step.id),
          label: (step.step_order ? (step.step_order + '. ') : '') + stepName + (prodName ? ' — ' + prodName : '')
        });
      });
    });
    stepOptions.sort(function(a, b){
      if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
      return a.label < b.label ? -1 : 1;
    });
    return {
      order: fresh,
      reason: '',
      restart_step_id: stepOptions.length ? stepOptions[0].value : '',
      items: items,
      stepOptions: stepOptions
    };
  }

  function openRestore(order) {
    apiFetch('orders/' + order.id, { fresh:true }).then(function(fresh){
      var base = fresh && fresh.id ? fresh : order;
      setRestoreModal(buildRestoreModal(base));
    }).catch(function(){
      setRestoreModal(buildRestoreModal(order));
    });
  }

  function updateRestoreItem(idx, key, value) {
    setRestoreModal(function(mod){
      if (!mod) return mod;
      return Object.assign({}, mod, {
        items: mod.items.map(function(it, i){
          if (i !== idx) return it;
          var patch = {}; patch[key] = value;
          if (key === 'product_id') {
            var prod = products.find(function(p){ return String(p.id) === String(value); });
            patch.product_name = prod ? (prod.name || '') : '';
            patch.product_name_en = prod ? (prod.name_en || '') : '';
          }
          return Object.assign({}, it, patch);
        })
      });
    });
  }

  function addRestoreItem() {
    setRestoreModal(function(mod){
      if (!mod) return mod;
      return Object.assign({}, mod, {
        items: mod.items.concat([{ id:null, product_id:'', product_name:'', product_name_en:'', quantity:1, notes:'' }])
      });
    });
  }

  function removeRestoreItem(idx) {
    setRestoreModal(function(mod){
      if (!mod) return mod;
      return Object.assign({}, mod, {
        items: mod.items.filter(function(_, i){ return i !== idx; })
      });
    });
  }

  function submitRestore() {
    if (!restoreModal || !restoreModal.order) return;
    if (!restoreModal.reason.trim()) { alert(lang === 'en' ? 'Restore reason is required' : 'سبب الاسترجاع مطلوب'); return; }
    if (!restoreModal.restart_step_id) { alert(lang === 'en' ? 'Choose a restart step' : 'اختر خطوة البداية'); return; }
    var payload = {
      reason: restoreModal.reason.trim(),
      restart_step_id: restoreModal.restart_step_id,
      items: restoreModal.items
        .filter(function(it){ return String(it.product_id || '').trim() !== ''; })
        .map(function(it){
          return {
            id: it.id || null,
            product_id: it.product_id ? parseInt(it.product_id, 10) : null,
            quantity: parseInt(it.quantity, 10) || 1,
            notes: it.notes || '',
            product_name: it.product_name || '',
            product_name_en: it.product_name_en || ''
          };
        })
    };
    setRestoring(true);
    apiFetch('orders/' + restoreModal.order.id + '/restore', { method:'POST', body: JSON.stringify(payload) })
      .then(function(){
        setRestoring(false);
        setRestoreModal(null);
        if (props.onReload) props.onReload();
      })
      .catch(function(e){
        setRestoring(false);
        alert((e && e.message) || (lang === 'en' ? 'Restore failed' : 'فشل الاسترجاع'));
      });
  }

  /* reset to page 1 when filter/perPage changes */
  useEffect(function(){ setPage(1); }, [search, perPage]);

  var perPageOpts = [
    {value:25, label:'25'},
    {value:50, label:'50'},
    {value:100, label:'100'},
    {value:500, label:'500'},
  ];

  useTopbar(t('n_done', filtered.length),
    h('div', {style:{display:'flex',gap:8,alignItems:'center'}},
      h('span',{style:{fontSize:12,color:T.textMute}}, lang==='en'?'Per page:':'لكل صفحة:'),
      h('select',{
        value:perPage,
        onChange:function(e){ setPerPage(parseInt(e.target.value)); },
        style:{padding:'5px 28px 5px 10px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:T.bg,color:T.text,fontSize:13,fontFamily:'inherit',cursor:'pointer'}
      }, perPageOpts.map(function(o){ return h('option',{key:o.value,value:o.value},o.label); }))
    )
  );

  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'order_number',label:t('order_number_lbl'),render:function(o){return h('span',{style:{fontFamily:'monospace',fontWeight:700}},'#'+o.order_number);}},
        {key:'customer_name',label:t('customer'),render:function(o){return getCust(o,lang);}},
        {key:'status_slug',label:t('status_lbl'),render:function(o){return statusBadge(o.status_slug, statuses, lang);},noSort:true},
        {key:'expected_hours_total',label:(lang==='en'?'EXPECTED':'المتوقع'),render:function(o){return fmtH(o.expected_hours_total);}},
        {key:'actual_hours_total',label:(lang==='en'?'ACTUAL':'الفعلي'),render:function(o){return fmtH(o.actual_hours_total);}},
        {key:'time_diff',label:(lang==='en'?'DIFF':'الفرق'),noSort:true,render:function(o){
          var exp = (parseFloat(o.expected_hours_total)||0)*60;
          var act = (parseFloat(o.actual_hours_total)||0)*60;
          if (!exp || !act) return 'â€”';
          var diff = act - exp;
          var faster = diff <= 0;
          return h('span',{style:{
            fontWeight:700,fontSize:12,borderRadius:99,padding:'2px 8px',
            color: faster ? T.green : T.red,
            background: faster ? '#dcfce7' : '#fee2e2'
          }}, faster
            ? 'ðŸŸ¢ '+(lang==='en'?'Faster by ':'أسرع بـ ')+fmtMin(Math.abs(diff))
            : 'ðŸ”´ '+(lang==='en'?'Slower by ':'أبطأ بـ ')+fmtMin(diff)
          );
        }},
        {key:'completed_at',label:(lang==='en'?'COMPLETED AT':'اكتمل في'),render:function(o){return o.completed_at?fmtDate(o.completed_at, getLang()):'â€”';}},
      ],
      rows:pageOrders,
      actions:function(o){ return h('div',{style:{display:'flex',gap:6,alignItems:'center'}},
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){setPreview(o);}}, '👁'),
        h(Btn,{size:'sm',variant:'primary',onClick:function(){ openRestore(o); }}, lang==='en' ? 'Restore' : 'استرجاع')
      ); },
      empty:t('no_orders_done')
    }),
    /* Pagination controls */
    totalPages > 1 && h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:16,flexWrap:'wrap'}},
      h('button',{
        disabled:safePage<=1,
        onClick:function(){setPage(function(p){return Math.max(1,p-1);});},
        style:{padding:'6px 14px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:safePage>1?T.bg:'transparent',color:safePage>1?T.text:T.textMute,
          cursor:safePage>1?'pointer':'default',fontSize:13,fontFamily:'inherit'}
      }, lang==='en'?'â† Prev':'Ø§Ù„Ø³Ø§Ø¨Ù‚ â†'),
      /* page numbers â€” show up to 7 */
      (function(){
        var pages=[]; var start=Math.max(1,safePage-3); var end=Math.min(totalPages,start+6);
        if (start>1) pages.push(h('button',{key:'s1',onClick:function(){setPage(1);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},'1'));
        if (start>2) pages.push(h('span',{key:'e1',style:{color:T.textMute,fontSize:13}},'â€¦'));
        for (var i=start;i<=end;i++) {
          var pg=i;
          pages.push(h('button',{key:pg,onClick:function(){setPage(pg);},
            style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+(pg===safePage?T.accent:T.border),
              background:pg===safePage?T.accent:'transparent',color:pg===safePage?'#fff':T.text,
              cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:pg===safePage?700:400}
          },pg));
        }
        if (end<totalPages-1) pages.push(h('span',{key:'e2',style:{color:T.textMute,fontSize:13}},'â€¦'));
        if (end<totalPages) pages.push(h('button',{key:'sl',onClick:function(){setPage(totalPages);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},totalPages));
        return pages;
      })(),
      h('button',{
        disabled:safePage>=totalPages,
        onClick:function(){setPage(function(p){return Math.min(totalPages,p+1);});},
        style:{padding:'6px 14px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:safePage<totalPages?T.bg:'transparent',color:safePage<totalPages?T.text:T.textMute,
          cursor:safePage<totalPages?'pointer':'default',fontSize:13,fontFamily:'inherit'}
      }, lang==='en'?'Next â†’':'â†’ Ø§Ù„ØªØ§Ù„ÙŠ')
    ),
    restoreModal && h(Modal, {
      title:(lang === 'en' ? 'Restore Order' : 'استرجاع الطلب') + ' #'+(restoreModal.order.order_number || ''),
      subtitle: lang === 'en'
        ? 'Pick a restart step, explain why, and adjust products if needed.'
        : 'اختر خطوة البداية، اذكر السبب، ويمكنك تعديل الكميات أو إضافة منتجات.',
      width: 840,
      onClose:function(){ if (!restoring) setRestoreModal(null); },
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){ if (!restoring) setRestoreModal(null); },disabled:restoring}, t('cancel')),
        h(Btn,{variant:'primary',onClick:submitRestore,disabled:restoring}, restoring ? (lang==='en' ? 'Restoring...' : 'جاري الاسترجاع...') : (lang==='en' ? 'Restore' : 'استرجاع'))
      )
    },
      h('div',{style:{display:'grid',gridTemplateColumns:'1.25fr .95fr',gap:12}},
        h(Textarea,{
          label:lang==='en' ? 'Reason for restore' : 'سبب الاسترجاع',
          value:restoreModal.reason,
          rows:3,
          placeholder:lang==='en' ? 'Explain why this order must be restored' : 'اكتب سبب الاسترجاع',
          onChange:function(v){
            setRestoreModal(function(mod){
              if (!mod) return mod;
              return Object.assign({}, mod, { reason:v });
            });
          }
        }),
        h(Select,{
          label:lang==='en' ? 'Restart from step' : 'إعادة البدء من خطوة',
          value:restoreModal.restart_step_id,
          onChange:function(v){
            setRestoreModal(function(mod){
              if (!mod) return mod;
              return Object.assign({}, mod, { restart_step_id:v });
            });
          },
          options:restoreModal.stepOptions || [],
          placeholder:lang==='en' ? 'Choose step' : 'اختر خطوة'
        })
      ),
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,margin:'18px 0 10px'}},
        h('div',null,
          h('div',{style:{fontWeight:700,fontSize:14,color:T.text}}, lang==='en' ? 'Products to restore' : 'المنتجات المراد استرجاعها'),
          h('div',{style:{fontSize:12,color:T.textMute,marginTop:2}}, lang==='en' ? 'Edit quantities or add extra products before restoring.' : 'عدّل الكميات أو أضف منتجات قبل الاسترجاع.')
        ),
        h(Btn,{size:'sm',variant:'secondary',onClick:addRestoreItem}, lang==='en' ? '+ Add Product' : '+ إضافة منتج')
      ),
      h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
        (restoreModal.items || []).length ? restoreModal.items.map(function(it, idx){
          var existing = !!it.id;
          var productLabel = existing
            ? (lang === 'en' ? (it.product_name_en || it.product_name || 'Product') : (it.product_name || it.product_name_en || 'منتج'))
            : '';
          var selectedProduct = products.find(function(p){ return String(p.id) === String(it.product_id || ''); });
          return h(Card,{key:(it.id || ('new-'+idx)),style:{padding:12,border:'1px solid '+T.border}},
            h('div',{style:{display:'grid',gridTemplateColumns: existing ? '1.2fr .45fr 1fr auto' : '1.2fr .45fr 1fr auto',gap:10,alignItems:'end'}},
              existing
                ? h('div',null,
                    h('div',{style:{fontSize:12,color:T.textMute,marginBottom:6}}, lang==='en' ? 'Existing product' : 'منتج موجود'),
                    h('div',{style:{fontWeight:700,color:T.text}}, productLabel)
                  )
                : h(Select,{
                    label:lang==='en' ? 'Product' : 'المنتج',
                    value:String(it.product_id || ''),
                    onChange:function(v){ updateRestoreItem(idx, 'product_id', v); },
                    options:products.map(function(p){
                      return { value:String(p.id), label: ln(p, lang) };
                    }),
                    placeholder:lang==='en' ? 'Select product' : 'اختر منتج'
                  }),
              h(Input,{
                label:lang==='en' ? 'Qty' : 'الكمية',
                type:'number',
                value:String(it.quantity || 1),
                onChange:function(v){ updateRestoreItem(idx, 'quantity', v); },
                style:{textAlign:'center'}
              }),
              h(Input,{
                label:lang==='en' ? 'Notes' : 'ملاحظات',
                value:it.notes || '',
                placeholder:lang==='en' ? 'Optional notes' : 'ملاحظات اختيارية',
                onChange:function(v){ updateRestoreItem(idx, 'notes', v); }
              }),
              h(Btn,{
                size:'sm',
                variant:'secondary',
                disabled:existing,
                onClick:function(){ removeRestoreItem(idx); }
              }, lang==='en' ? 'Remove' : 'حذف')
            ),
            existing && selectedProduct && h('div',{style:{marginTop:8,fontSize:11,color:T.textMute}},
              lang==='en'
                ? ('Product library: ' + ln(selectedProduct, lang))
                : ('مكتبة المنتجات: ' + ln(selectedProduct, lang))
            )
          );
        }) : h('div',{style:{padding:'14px 16px',border:'1px dashed '+T.border,borderRadius:T.radius,color:T.textMute,fontSize:13}}, lang==='en' ? 'No products yet. Add one if needed.' : 'لا توجد منتجات بعد. يمكنك إضافة منتج إذا لزم الأمر.')
      )
    ),
    preview && h(OrderPreviewModal,{order:preview,statuses:statuses,onClose:function(){setPreview(null);},onAdvance:function(stepId,completedByIds,meta){
      var payload = {};
      if (completedByIds && completedByIds.length) payload.completed_by_ids = completedByIds;
      if (meta && meta.delivery_direction) payload.delivery_direction = meta.delivery_direction;
      apiFetch('steps/'+stepId+'/advance',{method:'POST',body:Object.keys(payload).length?JSON.stringify(payload):undefined}).catch(function(){});
    }})
  );
}

/* â•â•â• CUSTOMERS â•â•â• */
function CustomersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _q = useState(''); var q = _q[0], setQ = _q[1];
  var _page = useState(1); var page = _page[0], setPage = _page[1];
  var _perPage = useState(25); var perPage = _perPage[0], setPerPage = _perPage[1];
  var crud = useCRUD('customers', { paginated:true, page:page, perPage:perPage, q:q });
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var _r = useState(null); var recView = _r[0], setRecView = _r[1];
  var _c = useState(null); var contactsView = _c[0], setContactsView = _c[1];
  var blank = {name:'',name_en:'',phone:'',phone_alt:'',address:'',address_en:'',map_url:''};
  useEffect(function(){ setPage(1); }, [q, perPage]);
  function save() {
    var p = form.id ? crud.update(form.id,form) : crud.create(form);
    p.then(function(){ setForm(null); if (props.onReload) props.onReload(); });
  }
  useTopbar(t('n_clients',crud.meta.total || crud.items.length), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(Card,{style:{padding:10,marginBottom:10}},
      h('div',{style:{display:'grid',gridTemplateColumns:'2fr 120px',gap:10,alignItems:'end'}},
        h(Input,{
          label:lang==='en'?'Search':'بحث',
          value:q,
          placeholder:lang==='en'?'Search customer, phone, address...':'ابحث باسم الزبون أو الهاتف أو العنوان...',
          onChange:setQ
        }),
        h(Select,{
          label:lang==='en'?'Per page':'لكل صفحة',
          value:String(perPage),
          onChange:function(v){ setPerPage(parseInt(v,10)||25); },
          options:[{value:'10',label:'10'},{value:'25',label:'25'},{value:'50',label:'50'},{value:'100',label:'100'}]
        })
      )
    ),
    h(DataTable, {
      columns:[
        {key:'company_name',label:t('company'),render:function(r){
          var hasEn = lang==='en' && (r.company_name_en || r.name_en);
          var cname = (lang==='en' && r.company_name_en) ? r.company_name_en : (lang==='en' && r.name_en) ? r.name_en : (r.company_name||r.name);
          var sub   = (lang==='en' && r.name_en) ? r.name_en : r.name;
          var isFallback = lang==='en' && !hasEn;
          return h('div',null,
            h('div',{style:{fontWeight:600, color: isFallback?T.textMute:T.text, fontStyle: isFallback?'italic':'normal'}}, cname),
            (r.company_name||r.company_name_en) && r.name && h('div',{style:{fontSize:11,color:T.textMute}},sub)
          );
        }},
        {key:'phone',label:t('phone')},
        {key:'address',label:t('address'),render:function(r){ var addr = (lang==='en' && r.address_en) ? r.address_en : (r.address||''); return addr?addr.slice(0,40)+(addr.length>40?'â€¦':''):'â€”'; }},
      ],
      rows:crud.items, onEdit:function(r){setForm(Object.assign({},blank,r));}, onDelete:function(r){crud.remove(r.id);},
      actions:function(r){ return h('div',{style:{display:'flex',gap:6}},
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){setRecView(r);}}, t('temp_recipients')),
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){setContactsView(r);}}, 'ðŸ‘¤ '+t('contact_persons'))
      ); }
    }),
    h(PagerControls,{
      page:crud.meta.page,
      totalPages:crud.meta.total_pages,
      total:crud.meta.total,
      onPageChange:setPage,
      lang:lang
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('name'),ar:form.name||'',en:form.name_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});}); }}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('phone'),value:form.phone||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});});}}),
        h(Input,{label:t('phone_alt'),value:form.phone_alt||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone_alt:v});});}})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
      h(Textarea,{label:lang==='en' ? t('address')+' (AR)' : t('address')+' (عربي)',value:form.address||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address:v});});}}),
      h(Textarea,{label:lang==='en' ? t('address')+' (EN)' : t('address')+' (إنكليزي)',value:form.address_en||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address_en:v});});}})
      ),
      h(Input,{label:t('map_url'),value:form.map_url||'',placeholder:lang==='en' ? 'https://maps.google.com/...' : 'رابط الخريطة',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}})
    ),
    recView && h(RecipientsModal,{customer:recView,onClose:function(){setRecView(null);}}),
    contactsView && h(ContactsModal,{customer:contactsView,onClose:function(){setContactsView(null);}})
  );
}


function ContactsModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var customer = props.customer;
  var _i = useState([]); var items = _i[0], setItems = _i[1];
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var blank = {name:'',name_en:'',job_title:'',job_title_en:'',phone:'',phone_alt:'',email:'',map_url:'',is_temp_recipient:0};
  function load() { apiFetch('customers/'+customer.id+'/contacts').then(function(r){ setItems(Array.isArray(r)?r:[]); }).catch(function(){ setItems([]); }); }
  useEffect(function(){ load(); }, [customer.id]);
  function save() {
    var prom = form.id ? apiFetch('contacts/'+form.id,{method:'PUT',body:JSON.stringify(form)}) : apiFetch('customers/'+customer.id+'/contacts',{method:'POST',body:JSON.stringify(form)});
    prom.then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('contacts/'+id,{method:'DELETE'}).then(load); }
  return h(Modal, {
    title:'👤 '+t('contact_persons')+' — '+((lang==='en'&&customer.company_name_en)?customer.company_name_en:(customer.company_name||customer.name)),
    onClose:props.onClose, width:480,
    footer: form
      ? h('div',{style:{display:'flex',gap:8}},
          h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
          h(Btn,{onClick:save},t('save'))
        )
      : h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add_contact'))
  },
    items.length===0 && !form ? h('div',{style:{textAlign:'center',padding:'24px 0',color:T.textMute}},t('no_contacts')) : null,
    items.map(function(c){
      return h(Card,{key:c.id,style:{padding:'12px 16px',marginBottom:8}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}},
          h('div',null,
            h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{fontWeight:700,fontSize:14}},c.name),c.is_temp_recipient==1&&h(Badge,{label:t('temp_recipient_lbl'),color:'amber'})),
            (c.job_title||c.job_title_en) && h('div',{style:{fontSize:12,color:T.accent,marginTop:1}},(lang==='en'&&c.job_title_en)?c.job_title_en:c.job_title),
            h('div',{style:{fontSize:12,color:T.textMute,marginTop:3,display:'flex',gap:12}},
              c.phone && h('span',null,'📞 '+c.phone),
              c.phone_alt && h('span',null,'📞 '+c.phone_alt),
              c.email && h('span',null,'✉ '+c.email)
            ),
            c.map_url && h('a',{href:c.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},'Map')
          ),
          h('div',{style:{display:'flex',gap:6}},
            h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},c));}},t('edit')),
            h(Btn,{size:'sm',variant:'danger',onClick:function(){del(c.id);}},t('delete'))
          )
        )
      );
    }),
    form && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:14,marginTop:8}},
      h(BiInput,{label:t('name'),ar:form.name||'',en:form.name_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});});}}),
      h(BiInput,{label:t('job_title'),ar:form.job_title||'',en:form.job_title_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{job_title:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{job_title_en:v});});}}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}},
        h(Input,{label:t('phone'),value:form.phone||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});})}},),
        h(Input,{label:t('phone_alt'),value:form.phone_alt||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone_alt:v});})}},)
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}},
        h(Input,{label:t('email'),type:'email',value:form.email||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{email:v});})}},),
        h(Input,{label:'Map URL',value:form.map_url||'',placeholder:'https://maps.google.com/...',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});})}},)
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,marginTop:8}},
        h('input',{type:'checkbox',checked:form.is_temp_recipient==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_temp_recipient:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
        h('span',null,t('temp_recipient_lbl'))
      ),
      h('div',{style:{display:'flex',gap:8,marginTop:10}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    )
  );
}

function RecipientsModal(props) {
  var t = useI18n().t;
  var customer = props.customer;
  var _i = useState([]); var items = _i[0], setItems = _i[1];
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var blank = {name:'',phone:'',address:'',map_url:''};
  function load() { apiFetch('customers/'+customer.id+'/recipients').then(function(r){ setItems(Array.isArray(r)?r:[]); }).catch(function(){ setItems([]); }); }
  useEffect(function(){ load(); }, [customer.id]);
  function save() {
    var prom = form.id ? apiFetch('recipients/'+form.id,{method:'PUT',body:JSON.stringify(form)}) : apiFetch('customers/'+customer.id+'/recipients',{method:'POST',body:JSON.stringify(form)});
    prom.then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('recipients/'+id,{method:'DELETE'}).then(load); }
  return h(Modal, { title:t('recipients')+' — '+(customer.company_name||customer.name), onClose:props.onClose, width:520, footer:h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add_recipient')) },
    items.map(function(r){
      return h(Card, { key:r.id, style:{ padding:'12px 16px', marginBottom:8 } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('div',null,h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{fontWeight:700}},r.name),r.is_active==0&&h(Badge,{label:t('inactive_lbl'),color:'gray'})),h('div',{style:{fontSize:12,color:T.textMute}},r.phone||'—'),r.address&&h('div',{style:{fontSize:12,color:T.textMute,marginTop:1}},r.address),r.map_url&&h('a',{href:r.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},t('map_url'))),
          h('div',{style:{display:'flex',gap:6}},h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},r));}},t('edit')),h(Btn,{size:'sm',variant:'danger',onClick:function(){del(r.id);}},t('delete')))
        )
      );
    }),
    form && h('div',{style:{marginTop:16,borderTop:'1px solid '+T.border,paddingTop:16}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('recipient_name'),value:form.name,onChange:function(v){setForm(function(f){return Object.assign({},f,{name:v});});}}),
        h(Input,{label:t('phone'),value:form.phone,onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});})}})
      ),
      h(Textarea,{label:t('address'),value:form.address,onChange:function(v){setForm(function(f){return Object.assign({},f,{address:v});});}}),
      h(Input,{label:t('map_url'),value:form.map_url,placeholder:'https://maps.google.com/...',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}}),
      h('div',{style:{display:'flex',gap:8,marginTop:4}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    )
  );
}

/* â•â•â• SIMPLE CRUD FACTORY â•â•â• */
function SimpleCRUD(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _q = useState(''); var q = _q[0], setQ = _q[1];
  var _page = useState(1); var page = _page[0], setPage = _page[1];
  var _perPage = useState(25); var perPage = _perPage[0], setPerPage = _perPage[1];
  var crud = useCRUD(props.resource, { paginated:true, page:page, perPage:perPage, q:q });
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  useEffect(function(){ setPage(1); }, [q, perPage]);

  var serverPaged = (parseInt(crud.meta.total_pages, 10) || 1) > 1 || (parseInt(crud.meta.total, 10) || 0) > asArr(crud.items).length;
  var localTotalPages = Math.max(1, Math.ceil(asArr(crud.items).length / Math.max(1, perPage)));
  var effectiveTotalPages = serverPaged ? Math.max(1, parseInt(crud.meta.total_pages, 10) || 1) : localTotalPages;
  var safePage = Math.min(Math.max(1, page), effectiveTotalPages);
  var tableRows = serverPaged
    ? asArr(crud.items)
    : asArr(crud.items).slice((safePage - 1) * perPage, safePage * perPage);
  var effectiveTotal = serverPaged ? (parseInt(crud.meta.total, 10) || asArr(crud.items).length) : asArr(crud.items).length;

  function afterMutation() { setForm(null); if (props.onReload) props.onReload(); }
  function save() {
    var p = form.id ? crud.update(form.id,form) : crud.create(form);
    p.then(function(res){
      var savedId = form.id || (res && res.id);
      if (props.onAfterSave) props.onAfterSave(savedId, form);
      afterMutation();
    });
  }
  function doRemove(id) { crud.remove(id).then(function(){ if (props.onReload) props.onReload(); }).catch(function(e){ alert(e.message); }); }
  function openEdit(r) {
    /* merge blankForm first so all fields exist, then overlay DB values, converting nullâ†’'' */
    var base = Object.assign({}, props.blankForm || {});
    Object.keys(r).forEach(function(k){ base[k] = r[k] != null ? r[k] : (base[k] != null ? base[k] : ''); });
    setForm(base);
  }
  useTopbar(t('n_items',effectiveTotal), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},props.blankForm));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(Card,{style:{padding:10,marginBottom:10}},
      h('div',{style:{display:'grid',gridTemplateColumns:'2fr 120px',gap:10,alignItems:'end'}},
        h(Input,{
          label:lang==='en'?'Search':'بحث',
          value:q,
          placeholder:lang==='en'?'Search...':'بحث...',
          onChange:setQ
        }),
        h(Select,{
          label:lang==='en'?'Per page':'لكل صفحة',
          value:String(perPage),
          onChange:function(v){ setPerPage(parseInt(v,10)||25); },
          options:[{value:'10',label:'10'},{value:'25',label:'25'},{value:'50',label:'50'},{value:'100',label:'100'}]
        })
      )
    ),
    h(DataTable, { columns:props.columns, rows:tableRows, onEdit:function(r){openEdit(r);}, onDelete:function(r){doRemove(r.id);}, extraActions:props.extraActions }),
    h(PagerControls,{
      page: serverPaged ? (parseInt(crud.meta.page,10) || safePage) : safePage,
      totalPages: effectiveTotalPages,
      total: effectiveTotal,
      onPageChange:setPage,
      lang:lang
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);},
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    }, props.FormContent({ form:form, setForm:setForm }))
  );
}

function colorDot(c) { return h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{width:12,height:12,borderRadius:'50%',background:c,border:'1px solid '+T.border}}),h('code',{style:{fontSize:11,color:T.textMute}},c)); }
/* ln(obj, lang) â€” picks name_en if lang=en and available, else name */
function ln(obj, lang) {
  if (!obj) return '—';
  var primary = null;
  if (lang === 'en' && obj.name_en && obj.name_en !== '') primary = obj.name_en;
  if (!primary) primary = obj.name || obj.step_name || obj.company_name || obj.name_en || obj.step_name_en || obj.company_name_en || '—';
  if (lang === 'ar' && looksBrokenText(primary)) primary = obj.name_en || obj.step_name_en || obj.company_name_en || primary;
  return repairText(primary);
}
function supplierLabel(obj, lang) {
  if (!obj) return '—';
  var label = null;
  if (lang === 'en') {
    label = obj.name_en || obj.company_name_en || obj.name || obj.company_name || '—';
  } else {
    label = obj.name || obj.company_name || obj.name_en || obj.company_name_en || '—';
    if (looksBrokenText(label)) label = obj.name_en || obj.company_name_en || label;
  }
  return repairText(label);
}
function hasRealLabel(v) {
  var s = String(v == null ? '' : v).trim();
  return !!s && s !== '—' && s !== '-';
}
function isDebugEnabled(flag) {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search.indexOf(flag + '=1') >= 0) return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(flag) === '1') return true;
  } catch(e) {}
  return false;
}
function lnStep(obj, lang) {
  if (!obj) return '—';
  var label = (lang === 'en' && obj.step_name_en) ? obj.step_name_en : (obj.step_name || obj.step_name_en || '—');
  if (lang === 'ar' && looksBrokenText(label)) label = obj.step_name_en || label;
  return repairText(label);
}
function nameOf(arr, id, lang) { var x = findBy(arr,'id',id); return x ? ln(x, lang||'ar') : '—'; }
var SLUG_LABELS_AR = { pending:'Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±', in_progress:'Ø¬Ø§Ø±ÙŠ', done:'Ù…ÙƒØªÙ…Ù„', completed:'Ù…ÙƒØªÙ…Ù„', cancelled:'Ù…Ù„ØºÙŠ' };
var SLUG_LABELS_EN = { pending:'Pending', in_progress:'In Progress', done:'Done', completed:'Completed', cancelled:'Cancelled' };
function slugLabel(slug, statuses, lang) {
  if (!slug) return 'â€”';
  var st = findBy(statuses, 'slug', slug);
  if (st) return ln(st, lang);
  /* fallback: try case-insensitive match */
  var stLow = asArr(statuses).find(function(s){ return s.slug && s.slug.toLowerCase().replace(/\s+/g,'_') === slug.toLowerCase().replace(/\s+/g,'_'); });
  if (stLow) return ln(stLow, lang);
  /* hardcoded fallback */
  return lang === 'en' ? (SLUG_LABELS_EN[slug] || slug) : (SLUG_LABELS_AR[slug] || slug);
}

/* BilingualInputs: two side-by-side inputs for ar/en */
function BiInput(props) {
  var i18n = useI18n();
  var t = i18n.t;
  var lang = i18n.lang;
  return h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
    h(Input, { label:(props.label||t('name'))+(lang==='en' ? ' (AR)' : ' (عربي)'), value:props.ar, onChange:props.onAr, placeholder:lang==='en' ? 'In Arabic' : 'بالعربي' }),
    h(Input, { label:(props.label||t('name'))+(lang==='en' ? ' (EN)' : ' (إنكليزي)'), value:props.en, onChange:props.onEn, placeholder:lang==='en' ? 'In English' : 'بالإنكليزية' })
  );
}
function RolesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  return h(SimpleCRUD, { title:t('roles'), resource:'roles', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){return h('span',{style:{fontWeight:600}},ln(r,lang));}},
      {key:'color',label:t('color'),render:function(r){return colorDot(r.color);}}
    ],
    blankForm:{name:'',name_en:'',color:'#635bff'},
    FormContent:function(p){ return h('div',null,
      h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
      h(Input,{label:t('color'),type:'color',value:p.form.color,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{color:v});});}})
    ); }
  });
}
function DepartmentsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('departments');
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var blank = {name:'',name_en:'',color:'#0055d4',sort_order:0,workday_start:'09:00',workday_end:'17:00',working_days:[0,1,2,3,4,5,6],holidays:[]};

  useTopbar(t('departments'), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));

  function save() {
    var payload = Object.assign({}, form, {
      working_days: parseJsonArraySafe(form.working_days, [0,1,2,3,4,5,6]).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); }).sort(),
      holidays: normalizeHolidayList(form.holidays)
    });
    var p = form.id ? crud.update(form.id,payload) : crud.create(payload);
    p.then(function(){ setForm(null); if(props.onReload) props.onReload(); });
  }

  function move(idx, dir) {
    var items = crud.items.slice();
    var target = idx + dir;
    if (target < 0 || target >= items.length) return;
    var tmp = items[idx]; items[idx] = items[target]; items[target] = tmp;
    var ids = items.map(function(d){ return d.id; });
    apiFetch('departments/reorder', {method:'POST', body:JSON.stringify({ids:ids})})
      .then(function(){ crud.load(); if(props.onReload) props.onReload(); });
  }

  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h('div', {style:{background:T.bgCard,borderRadius:T.radiusLg,border:'1px solid '+T.border,overflow:'hidden'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'32px 1fr 140px auto',gap:8,padding:'10px 16px',borderBottom:'1px solid '+T.border,background:T.bgSub}},
        h('span',null),
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Name':'الاسم'),
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Color':'اللون'),
        h('span',null)
      ),
      crud.items.length === 0
        ? h('div',{style:{padding:32,textAlign:'center',color:T.textMute,fontSize:13}}, lang==='en'?'No departments yet':'لا توجد أقسام بعد')
        : crud.items.map(function(dept, idx){
          return h('div',{key:dept.id,style:{display:'grid',gridTemplateColumns:'32px 1fr 140px auto',gap:8,padding:'10px 16px',borderBottom:'1px solid '+T.border,alignItems:'center',background:T.bg}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1,alignItems:'center'}},
              h('button',{onClick:function(){move(idx,-1);},disabled:idx===0,
                style:{background:'transparent',border:'none',cursor:idx===0?'default':'pointer',color:idx===0?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'▲'),
              h('button',{onClick:function(){move(idx,1);},disabled:idx===crud.items.length-1,
                style:{background:'transparent',border:'none',cursor:idx===crud.items.length-1?'default':'pointer',color:idx===crud.items.length-1?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'▼')
            ),
            h('div',null,
              h('span',{style:{fontWeight:600,fontSize:13,color:T.text}}, ln(dept,lang)),
              dept.name_en && lang==='ar' && h('div',{style:{fontSize:11,color:T.textMute}}, dept.name_en)
            ),
            h('div',{style:{display:'flex',alignItems:'center',gap:6}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:dept.color||'#0ea5e9',flexShrink:0}}),
              h('span',{style:{fontSize:12,color:T.textMute}}, dept.color||'—')
            ),
            h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end'}},
              h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},blank,dept));}}, t('edit')),
              h(Btn,{size:'sm',variant:'danger',onClick:function(){ if(confirm(lang==='en'?'Delete?':'حذف؟')) crud.remove(dept.id).then(function(){ if(props.onReload) props.onReload(); }); }}, t('delete'))
            )
          );
        })
    ),
    form && h(Modal,{
      title:form.id?t('edit'):t('add')+' '+t('department'),
      onClose:function(){setForm(null);}, width:440,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    },
      h(BiInput,{label:t('name'),ar:form.name,en:form.name_en,
        onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},
        onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});});}
      }),
      h('div',{style:{marginTop:12}},
        h(Input,{label:t('color'),type:'color',value:form.color,onChange:function(v){setForm(function(f){return Object.assign({},f,{color:v});})}})
      ),
      h(WorkScheduleFields,{
        form:Object.assign({}, form, {
          working_days: parseJsonArraySafe(form.working_days, [0,1,2,3,4,5,6]),
          holidays: Array.isArray(form.holidays) ? form.holidays : parseJsonArraySafe(form.holidays, [])
        }),
        setForm:setForm,
        lang:lang,
        title:lang==='en' ? 'Department Calendar' : 'تقويم القسم'
      })
    )
  );
}
function TeamsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var depts = asArr(props.bootstrap && props.bootstrap.departments);
  var emps  = asArr(props.bootstrap && props.bootstrap.employees);

  /* member_ids: employees whose team_id matches */
  function getMemberIds(teamId) {
    if (!teamId) return [];
    return emps.filter(function(e){ return String(e.team_id)===String(teamId); }).map(function(e){ return String(e.id); });
  }

  return h(SimpleCRUD, { title:t('teams'), resource:'teams', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){
        var members = emps.filter(function(e){ return String(e.team_id)===String(r.id); });
        return h('div',null,
          h('span',{style:{fontWeight:600}},ln(r,lang)),
          members.length>0 && h('div',{style:{display:'flex',flexWrap:'wrap',gap:3,marginTop:3}},
            members.map(function(e){ return h('span',{key:e.id,style:{fontSize:10,background:T.accentDim,color:T.accent,borderRadius:3,padding:'1px 5px'}},ln(e,lang)); })
          )
        );
      }},
      {key:'department_id',label:t('department'),render:function(r){return nameOf(depts,r.department_id,lang);}},
    ],
    blankForm:{name:'',name_en:'',department_id:'',lead_employee_id:'',member_ids:[],workday_start:'09:00',workday_end:'17:00',working_days:[0,1,2,3,4,5,6],holidays:[]},
    onBeforeSave:function(form) {
      /* member_ids is handled server-side via extra endpoint */
      return Object.assign({}, form, {
        working_days: parseJsonArraySafe(form.working_days, [0,1,2,3,4,5,6]).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); }).sort(),
        holidays: normalizeHolidayList(form.holidays)
      });
    },
    FormContent:function(p){
      /* init member_ids from current employees if editing */
      var memberIds = Array.isArray(p.form.member_ids) ? p.form.member_ids : getMemberIds(p.form.id);
      if (!Array.isArray(p.form.member_ids) && p.form.id) {
        /* first render of edit form â€” populate */
        setTimeout(function(){ p.setForm(function(f){ return Object.assign({},f,{member_ids: getMemberIds(f.id)}); }); }, 0);
      }
      return h('div',null,
        h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
        h('div',{style:{marginTop:8}},
          h(Select,{label:t('department'),value:p.form.department_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{department_id:v});});},options:depts.map(function(d){return {value:d.id,label:ln(d,lang)};})})
        ),
        h(MultiSelect,{label:t('members'),
          values:memberIds,
          onChange:function(v){ p.setForm(function(f){ return Object.assign({},f,{member_ids:v}); }); },
          options:emps.map(function(e){ return {value:String(e.id),label:ln(e,lang)}; })
        }),
        h(WorkScheduleFields,{
          form:Object.assign({}, p.form, {
            working_days: parseJsonArraySafe(p.form.working_days, [0,1,2,3,4,5,6]),
            holidays: Array.isArray(p.form.holidays) ? p.form.holidays : parseJsonArraySafe(p.form.holidays, [])
          }),
          setForm:p.setForm,
          lang:lang,
          title:lang==='en' ? 'Team Calendar' : 'تقويم الفريق'
        })
      );
    }
  });
}
function EmployeesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var roles = asArr(props.bootstrap && props.bootstrap.roles);
  var depts = asArr(props.bootstrap && props.bootstrap.departments);
  var teams = asArr(props.bootstrap && props.bootstrap.teams);
  var _leaveEmp = useState(null); var leaveEmp = _leaveEmp[0]; var setLeaveEmp = _leaveEmp[1];
  return h(React.Fragment,null,
    h(SimpleCRUD, { title:t('employees'), resource:'employees', onReload:props.onReload,
      columns:[
        {key:'avatar',label:'',noSort:true,render:function(r){return h(UserAvatar,{user:r,size:32});}},
        {key:'name',label:t('name'),render:function(r){
          var displayName = (lang==='en' && r.name_en && r.name_en !== '') ? r.name_en : r.name;
          var isFallback  = (lang==='en' && (!r.name_en || r.name_en === ''));
          return h('div',null,
            h('div',{style:{fontWeight:700,color:isFallback?T.textMute:T.text,fontStyle:isFallback?'italic':'normal'}},displayName),
            h('div',{style:{fontSize:11,color:T.textMute}},r.phone||'')
          );
        }},
        {key:'role_id',label:t('role'),render:function(r){return nameOf(roles,r.role_id,lang);}},
        {key:'department_id',label:t('department'),render:function(r){return nameOf(depts,r.department_id,lang);}},
        {key:'is_active',label:t('status_lbl'),render:function(r){return h(Badge,{label:r.is_active==1?t('active_status'):t('stopped'),color:r.is_active==1?'green':'gray'});}},
      ],
      extraActions:function(r){
        return h(Btn,{size:'sm',variant:'secondary',onClick:function(){ setLeaveEmp(r); }}, lang==='en' ? 'Leaves' : 'الإجازات');
      },
      blankForm:{name:'',name_en:'',role_id:'',department_id:'',team_id:'',phone:'',is_active:1,workday_start:'09:00',workday_end:'17:00',working_days:[0,1,2,3,4,5,6],holidays:[]},
      onBeforeSave:function(form){
        return Object.assign({}, form, {
          working_days: parseJsonArraySafe(form.working_days, [0,1,2,3,4,5,6]).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); }).sort(),
          holidays: normalizeHolidayList(form.holidays)
        });
      },
      FormContent:function(p){ return h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
        h(BiInput,{label:t('name'),ar:p.form.name,en:p.form.name_en,
          onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},
          onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});});}}),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
          h(Input,{label:t('phone'),value:p.form.phone,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{phone:v});});}}),
          h(Select,{label:t('role'),value:p.form.role_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{role_id:v});});},options:roles.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
          h(Select,{label:t('department'),value:p.form.department_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{department_id:v});});},options:depts.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
          h(Select,{label:t('team'),value:p.form.team_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{team_id:v});});},options:teams.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
          h(Select,{label:t('status_lbl'),value:String(p.form.is_active),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_active:parseInt(v)});});},options:[{value:'1',label:t('active_status')},{value:'0',label:t('stopped')}]})
        ),
        h(WorkScheduleFields,{
          form:Object.assign({}, p.form, {
            working_days: parseJsonArraySafe(p.form.working_days, [0,1,2,3,4,5,6]),
            holidays: Array.isArray(p.form.holidays) ? p.form.holidays : parseJsonArraySafe(p.form.holidays, [])
          }),
          setForm:p.setForm,
          lang:lang,
          title:lang==='en' ? 'Employee Calendar' : 'تقويم الموظف'
        })
      ); }
    }),
    leaveEmp && h(EmployeeLeavesModal,{employee:leaveEmp,bootstrap:props.bootstrap,onClose:function(){ setLeaveEmp(null); },onSaved:function(){ if(props.onReload) props.onReload(); }})
  );
}

function EmployeeLeavesModal(props) {
  var i18n = useI18n(); var lang = i18n.lang;
  var employee = props.employee;
  var _items = useState([]); var items = _items[0]; var setItems = _items[1];
  var _preview = useState([]); var preview = _preview[0]; var setPreview = _preview[1];
  var _loading = useState(false); var loading = _loading[0]; var setLoading = _loading[1];
  var _saving = useState(false); var saving = _saving[0]; var setSaving = _saving[1];
  var _form = useState({ leave_start:'', leave_end:'', reason:'', reassignments:{} }); var form = _form[0]; var setForm = _form[1];

  function load() {
    setLoading(true);
    apiFetch('employee-leaves?employee_id='+employee.id).then(function(r){
      setItems(Array.isArray(r)?r:[]);
      setLoading(false);
    }).catch(function(){ setItems([]); setLoading(false); });
  }
  useEffect(function(){ load(); }, [employee.id]);

  function previewImpact() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.leave_start||'') || !/^\d{4}-\d{2}-\d{2}$/.test(form.leave_end||'')) {
      alert(lang==='en' ? 'Choose valid leave dates first.' : 'حدد تواريخ إجازة صحيحة أولاً.');
      return;
    }
    setSaving(true);
    apiFetch('employee-leaves/preview',{method:'POST',body:JSON.stringify({
      employee_id:parseInt(employee.id,10),
      leave_start:form.leave_start,
      leave_end:form.leave_end
    })}).then(function(r){
      setPreview(Array.isArray(r)?r:[]);
      setSaving(false);
    }).catch(function(e){ setSaving(false); alert(e.message||'Error'); });
  }

  useEffect(function(){
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.leave_start||'') || !/^\d{4}-\d{2}-\d{2}$/.test(form.leave_end||'')) {
      setPreview([]);
      return;
    }
    previewImpact();
  }, [form.leave_start, form.leave_end]);

  function saveLeave() {
    if (!form.leave_start || !form.leave_end) { alert(lang==='en' ? 'Choose leave dates first.' : 'حدد تواريخ الإجازة أولاً.'); return; }
    setSaving(true);
    apiFetch('employee-leaves',{method:'POST',body:JSON.stringify({
      employee_id:parseInt(employee.id,10),
      leave_start:form.leave_start,
      leave_end:form.leave_end,
      reason:form.reason,
      reassignments:preview.map(function(group){
        var rid = parseInt(form.reassignments[group.scope_key]||'',10);
        if (!rid) return null;
        return { scope_key:group.scope_key, department_id:group.department_id||null, replacement_employee_id:rid };
      }).filter(Boolean)
    })}).then(function(){
      setSaving(false);
      setForm({ leave_start:'', leave_end:'', reason:'', reassignments:{} });
      setPreview([]);
      load();
      if (props.onSaved) props.onSaved();
    }).catch(function(e){ setSaving(false); alert(e.message||'Error'); });
  }

  function deleteLeave(id) {
    if (!confirm(lang==='en' ? 'Delete this leave?' : 'حذف هذه الإجازة؟')) return;
    apiFetch('employee-leaves/'+id,{method:'DELETE'}).then(function(){ load(); }).catch(function(e){ alert(e.message||'Error'); });
  }

  return h(Modal,{
    title:(lang==='en' ? 'Leaves' : 'الإجازات')+' — '+ln(employee,lang),
    onClose:props.onClose,
    width:760,
    footer:h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:'secondary',onClick:props.onClose},lang==='en'?'Close':'إغلاق'),
      h(Btn,{variant:'secondary',onClick:previewImpact},saving ? h(Spinner) : (lang==='en'?'Preview impact':'معاينة التأثير')),
      h(Btn,{variant:'primary',onClick:saveLeave},saving ? h(Spinner) : (lang==='en'?'Save leave':'حفظ الإجازة'))
    )
  },
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
      h(Fld,{label:lang==='en'?'Leave start':'بداية الإجازة'},
        h('input',{type:'date',value:form.leave_start||'',onChange:function(e){ setForm(function(f){ return Object.assign({},f,{leave_start:e.target.value}); }); },style:iSt,onFocus:onFocus,onBlur:onBlur})
      ),
      h(Fld,{label:lang==='en'?'Leave end':'نهاية الإجازة'},
        h('input',{type:'date',value:form.leave_end||'',onChange:function(e){ setForm(function(f){ return Object.assign({},f,{leave_end:e.target.value}); }); },style:iSt,onFocus:onFocus,onBlur:onBlur})
      )
    ),
    h(Textarea,{label:lang==='en'?'Reason (optional)':'السبب (اختياري)',rows:2,value:form.reason,onChange:function(v){ setForm(function(f){ return Object.assign({},f,{reason:v}); }); }}),
    h('div',{style:{marginTop:16,fontWeight:700,fontSize:14}}, lang==='en' ? 'Affected work during leave' : 'الأعمال المتأثرة خلال الإجازة'),
    preview.length === 0
      ? h('div',{style:{marginTop:10,padding:12,border:'1px dashed '+T.border,borderRadius:T.radius,color:T.textMute,fontSize:13}},
          (/^\d{4}-\d{2}-\d{2}$/.test(form.leave_start||'') && /^\d{4}-\d{2}-\d{2}$/.test(form.leave_end||''))
            ? (lang==='en' ? 'No affected work was found yet for this range.' : 'لم يتم العثور على أعمال متأثرة حالياً ضمن هذه الفترة.')
            : (lang==='en' ? 'Choose leave dates to load the reassignment options.' : 'اختر تواريخ الإجازة لتحميل خيارات التحويل.'))
      : h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginTop:10}},
          preview.map(function(group){
            return h(Card,{key:group.scope_key,style:{padding:12}},
              h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}},
                h('div',null,
                  h('div',{style:{fontWeight:700}}, repairText(group.label||group.scope_key)),
                  h('div',{style:{fontSize:12,color:T.textMute}}, (group.affected_count||0)+' '+(lang==='en' ? 'affected items' : 'عنصر متأثر')),
                  (!group.replacement_options || !group.replacement_options.length) && h('div',{style:{fontSize:12,color:T.red,marginTop:4}},
                    lang==='en' ? 'No replacement employees available in this scope.' : 'لا يوجد موظفون بدلاء متاحون ضمن هذا النطاق.'
                  )
                ),
                h(Select,{
                  value:String(form.reassignments[group.scope_key]||''),
                  onChange:function(v){ setForm(function(f){ var next=Object.assign({},f.reassignments); next[group.scope_key]=v; return Object.assign({},f,{reassignments:next}); }); },
                  options:[{value:'',label:lang==='en'?'— Select replacement —':'— اختر البديل —'}].concat(asArr(group.replacement_options).map(function(emp){ return {value:String(emp.id),label:ln(emp,lang)}; }))
                })
              )
            );
          })
        ),
    h('div',{style:{marginTop:16,fontWeight:700,fontSize:14}}, lang==='en' ? 'Saved leaves' : 'الإجازات المسجلة'),
    loading ? h('div',{style:{padding:16}}, h(Spinner))
      : items.length === 0
        ? h('div',{style:{marginTop:10,padding:12,border:'1px dashed '+T.border,borderRadius:T.radius,color:T.textMute,fontSize:13}},
            lang==='en' ? 'No leaves recorded yet.' : 'لا توجد إجازات مسجلة بعد.')
        : h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginTop:10}},
            items.map(function(row){
              return h(Card,{key:row.id,style:{padding:12}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}},
                  h('div',null,
                    h('div',{style:{fontWeight:700}}, (row.leave_start||'')+' → '+(row.leave_end||'')),
                    row.reason && h('div',{style:{fontSize:12,color:T.textMute,marginTop:4}}, row.reason)
                  ),
                  h(Btn,{size:'sm',variant:'danger',onClick:function(){ deleteLeave(row.id); }}, lang==='en' ? 'Delete' : 'حذف')
                )
              );
            })
          )
  );
}
function StatusesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  return h(SimpleCRUD, { title:t('statuses'), resource:'statuses', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){return h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{width:10,height:10,borderRadius:'50%',background:r.color}}),ln(r,lang));}},
      {key:'slug',label:t('slug'),render:function(r){return h('code',{style:{fontSize:12,background:T.bgSub,padding:'2px 6px',borderRadius:4}},r.slug);}},
      {key:'sort_order',label:t('sort_order_lbl')},
      {key:'is_done',label:t('is_final_lbl'),render:function(r){return h(Badge,{label:r.is_done==1?t('yes'):t('no'),color:r.is_done==1?'green':'gray'});}},
    ],
    blankForm:{name:'',name_en:'',slug:'',color:'#6b7280',sort_order:0,is_done:0},
    FormContent:function(p){ return h('div',null,
      h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('slug'),value:p.form.slug,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{slug:v});});}}),
        h(Input,{label:t('color'),type:'color',value:p.form.color,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{color:v});});}}),
        h(Input,{label:t('sort_order'),type:'number',value:p.form.sort_order,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{sort_order:parseInt(v)||0});});}}),
        h(Select,{label:t('is_done'),value:String(p.form.is_done),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_done:parseInt(v)});});},options:[{value:'0',label:t('no')},{value:'1',label:t('yes')}]})
      )
    ); }
  });
}
function ProductWorkflowModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var product = props.product;
  var bs = props.bootstrap || {};
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var suppliers = asArr(bs.suppliers);
  var stepLib   = asArr(bs.step_library);
  var _steps = useState([]); var steps = _steps[0], setSteps = _steps[1];
  var _form  = useState(null); var form = _form[0], setForm = _form[1];
  var _loading = useState(false); var loading = _loading[0], setLoading = _loading[1];
  /* selLibId tracks which library step is selected for adding */
  var _sel = useState(''); var selLibId = _sel[0], setSelLibId = _sel[1];
  function getTeamEmployeeIds(teamId) {
    if (!teamId) return [];
    return employees.filter(function(e){ return String(e.team_id)===String(teamId); }).map(function(e){ return String(e.id); });
  }

  function load() {
    setLoading(true);
    apiFetch('products/'+product.id+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setLoading(false); });
  }
  useEffect(function(){ load(); }, [product.id]);

  function fmtMin(m) {
    if (!m || m==0) return '—';
    var mins = parseInt(m);
    if (mins < 60) return mins+' '+t('minutes');
    var hh = Math.floor(mins/60); var rem = mins%60;
    return hh+'h'+(rem?(' '+rem+'m'):'');
  }

  /* Add step from library */
  function addFromLib(libId) {
    var lib = findBy(stepLib,'id',libId);
    if (!lib) return;
    var libType = (parseInt(lib.is_delivery,10)===1) ? 'delivery' : (parseInt(lib.is_external,10)===1 ? 'external' : 'internal');
    var data = {
      step_name: lib.step_name,
      step_name_en: lib.step_name_en||'',
      step_order: steps.length+1,
      assigned_employee_ids: lib.default_employee_ids ? (typeof lib.default_employee_ids==='string' ? JSON.parse(lib.default_employee_ids||'[]') : lib.default_employee_ids) : [],
      assigned_team_id: lib.default_team_id||'',
        assigned_role_id: '',
        expected_hours: 0,
        show_in_prds: lib.show_in_prds,
        is_external: lib.is_external,
        is_delivery: lib.is_delivery || 0,
        scales_with_qty: lib.scales_with_qty != null ? parseInt(lib.scales_with_qty,10) : (libType === 'internal' ? 1 : 0),
        delivery_direction: lib.delivery_direction || (libType === 'delivery' ? 'delivered_to_client' : ''),
        supplier_id: lib.supplier_id || '',
        ext_send_at: '',
        ext_receive_expected: ''
      };
    if ((!data.assigned_employee_ids || !data.assigned_employee_ids.length) && data.assigned_team_id) {
      data.assigned_employee_ids = getTeamEmployeeIds(data.assigned_team_id);
    }
    apiFetch('products/'+product.id+'/steps',{method:'POST',body:JSON.stringify(data)}).then(function(){
      setSelLibId('');
      load();
      if (props.onReload) props.onReload();
    });
  }

  /* Edit: only allow changing employee/team and step_order */
  function saveEdit() {
    var data = Object.assign({},form);
    var stepType = data.step_type || stepTypeOf(data);
    var mins = data.time_unit==='hr' ? (parseFloat(data.expected_time_val)||0)*60 : (parseFloat(data.expected_time_val)||0);
    data.expected_hours = mins/60;
    data.expected_minutes = mins;
    data.expected_time_val = data.expected_time_val==='' ? '' : String(data.expected_time_val);
    data.qty_per_unit = Math.max(1, parseInt(data.qty_per_unit,10)||1);
    data.scales_with_qty = stepType === 'internal' ? (parseInt(data.scales_with_qty,10) === 0 ? 0 : 1) : 0;
    if (stepType === 'delivery') {
      data.delivery_direction = data.delivery_direction || 'delivered_to_client';
    } else {
      data.delivery_direction = '';
    }
    if (stepType !== 'internal') {
      data.scales_with_qty = 0;
      data.qty_per_unit = 1;
    }
    data.assigned_employee_ids = Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [];
    apiFetch('product-steps/'+form.id,{method:'PUT',body:JSON.stringify(data)}).then(function(){
      setForm(null);
      load();
      if (props.onReload) props.onReload();
    });
  }
  function del(id) {
    if(!confirm(t('confirm_delete')))return;
    apiFetch('product-steps/'+id,{method:'DELETE'}).then(function(){
      load();
      if (props.onReload) props.onReload();
    });
  }

  /* Steps already added (to filter library) */
  var addedNames = steps.map(function(s){ return s.step_name; });
  var availableLib = stepLib.filter(function(s){ return addedNames.indexOf(s.step_name)<0; });

  return h(Modal, {
    title: '⚙ '+t('product_workflow')+' - '+ln(product,lang),
    onClose: props.onClose, width: 680
  },
    loading ? h(PageLoader) : h('div',null,

      /* â”€â”€ Add from library â”€â”€ */
      h('div',{style:{marginBottom:16,display:'flex',gap:8,alignItems:'flex-end'}},
        h('div',{style:{flex:1}},
          h(Select,{
            label:'📚 '+t('pick_from_library'),
            value:selLibId,
            onChange:setSelLibId,
            options:availableLib.map(function(s){ return {value:String(s.id),label:lnStep(s,lang)}; }),
            placeholder: availableLib.length>0 ? '— '+t('pick_from_library')+' —' : '— '+t('all_steps_added')+' —'
          })
        ),
        h(Btn,{variant:'primary',onClick:function(){ if(selLibId) addFromLib(selLibId); },disabled:!selLibId},'+ '+t('add'))
      ),

      /* â”€â”€ Steps list â”€â”€ */
      steps.length === 0
        ? h('div',{style:{textAlign:'center',padding:'24px 0',color:T.textMute}},t('no_data'))
        : h('div',{style:{display:'flex',flexDirection:'column',gap:6,marginBottom:form?12:0}},
            steps.map(function(s){
              return h('div',{key:s.id,style:{display:'flex',alignItems:'center',gap:10,background:T.bgSub,borderRadius:T.radius,padding:'10px 14px',border:'1px solid '+T.border}},
                h('div',{style:{width:26,height:26,borderRadius:'50%',background:T.accentDim,color:T.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0}},s.step_order),
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13}},lnStep(s,lang)),
                  h('div',{style:{fontSize:11,color:T.textMute,marginTop:2,display:'flex',gap:10}},
                    (function(){
                      var ids = Array.isArray(s.assigned_employee_ids) ? s.assigned_employee_ids : (s.assigned_employee_ids ? JSON.parse(s.assigned_employee_ids||'[]') : (s.assigned_employee_id ? [String(s.assigned_employee_id)] : []));
                      return ids.length ? h('span',null,'👤 '+ids.map(function(id){ return nameOf(employees,id,lang); }).join(', ')) : null;
                    })(),
                    s.assigned_team_id ? h('span',null,'👥 '+nameOf(teams,s.assigned_team_id,lang)) : null,
                    h('span',null,'⏱ '+(s.expected_time_val||fmtMin(Math.round((parseFloat(s.expected_hours)||0)*60)))+((parseInt(s.is_external,10)===1 || parseInt(s.is_delivery,10)===1)?'':' / '+(s.qty_per_unit||1)+' '+t('unit_lbl'))),

                  )
                ),
                h('div',{style:{display:'flex',gap:6}},
                  h(Btn,{size:'sm',variant:'secondary',onClick:function(){
                    /* Read fresh from steps state to avoid stale closure */
                    var fresh = steps.filter(function(x){ return String(x.id) === String(s.id); })[0] || s;
                    var eids = Array.isArray(fresh.assigned_employee_ids) ? fresh.assigned_employee_ids : (fresh.assigned_employee_ids ? (function(){ try{ return JSON.parse(fresh.assigned_employee_ids); }catch(e){ return []; } })() : (fresh.assigned_employee_id ? [String(fresh.assigned_employee_id)] : []));
                    if ((!eids || !eids.length) && fresh.assigned_team_id) eids = getTeamEmployeeIds(fresh.assigned_team_id);
                    var rawMins = Math.round((parseFloat(fresh.expected_hours)||0)*60);
                    var timeUnit = (rawMins > 0 && rawMins % 60 === 0) ? 'hr' : 'min';
                    var timeVal  = timeUnit === 'hr' ? rawMins/60 : rawMins;
                    setForm({id:fresh.id,step_order:fresh.step_order,expected_minutes:rawMins,expected_time_val:String(timeVal),time_unit:timeUnit,assigned_employee_ids:eids.map(String),assigned_team_id:fresh.assigned_team_id?String(fresh.assigned_team_id):'',step_name:fresh.step_name,step_name_en:fresh.step_name_en||'',scales_with_qty:(fresh.scales_with_qty == null ? 1 : parseInt(fresh.scales_with_qty,10)||0),qty_per_unit:String(fresh.qty_per_unit||1),show_in_prds:fresh.show_in_prds!=null?parseInt(fresh.show_in_prds):1,is_external:parseInt(fresh.is_external)||0,is_delivery:parseInt(fresh.is_delivery)||0,delivery_direction:fresh.delivery_direction||'',step_type:stepTypeOf(fresh),supplier_id:fresh.supplier_id||'',ext_send_at:fresh.ext_send_at||'',ext_receive_expected:fresh.ext_receive_expected||''});
                  }},t('edit')),
                  h(Btn,{size:'sm',variant:'danger',onClick:function(){del(s.id);}},t('delete'))
                )
              );
            })
          ),

      /* â”€â”€ Edit form â”€â”€ */
      form && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:14,marginTop:8}},
        h('div',{style:{fontWeight:600,fontSize:13,marginBottom:10,color:T.accent}},t('edit')+': '+(lang==='en'&&form.step_name_en?form.step_name_en:form.step_name)),
        h(Select,{label:(lang==='en'?'Step Type':'نوع الخطوة'),value:form.step_type||stepTypeOf(form),onChange:function(v){setForm(function(f){ var next = applyStepType(f,v); if (v === 'delivery') { var ds = askDeliverySetup({lang:lang,currentDirection:next.delivery_direction,teamId:next.assigned_team_id,getTeamEmployeeIds:getTeamEmployeeIds,employees:employees}); next.delivery_direction = ds.direction; if (ds.employeeId) next.assigned_employee_ids = [String(ds.employeeId)]; } return next; });},options:[
          {value:'internal',label:(lang==='en'?'Internal Production':'إنتاج داخلي')},
          {value:'external',label:(lang==='en'?'External Supplier':'مجهز خارجي')},
          {value:'delivery',label:(lang==='en'?'Delivery':'توصيل')}
        ]}),
        ((form.step_type||stepTypeOf(form))==='internal')
          ? h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:4}},
              h(Input,{label:'# '+t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
              h(Input,{label:t('expected_time'),type:'number',value:form.expected_time_val!=null?form.expected_time_val:'',onChange:function(v){setForm(function(f){return Object.assign({},f,{expected_time_val:v});});}}),
              h(Select,{label:t('time_unit'),value:form.time_unit||'min',onChange:function(v){setForm(function(f){return Object.assign({},f,{time_unit:v});});},options:[{value:'min',label:t('minutes')},{value:'hr',label:t('hours_unit')}]}),
              h(Input,{label:(lang==='en'?'Per (unit)':'لكل (وحدة)'),type:'number',value:form.qty_per_unit!=null?form.qty_per_unit:'',onChange:function(v){setForm(function(f){return Object.assign({},f,{qty_per_unit:v});});}})
            )
          : h('div',{style:{display:'grid',gridTemplateColumns:'1fr',gap:10,marginBottom:4}},
              h(Input,{label:'# '+t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
              h('div',{style:{fontSize:12,color:T.textMid,padding:'10px 12px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
                (form.step_type||stepTypeOf(form))==='external'
                  ? (lang==='en'?'External step timing will be entered on the order itself based on supplier load and promised return date.':'وقت الخطوة الخارجية يُحدد داخل الطلب نفسه حسب حمل المجهز والموعد الذي يعد به.')
                  : (lang==='en'?'Delivery timing will be entered on the order itself based on customer deadline and delivery scheduling.':'وقت التوصيل يُحدد داخل الطلب نفسه حسب موعد العميل وجدولة التوصيل.')
              )
            ),
        ((form.step_type||stepTypeOf(form))==='internal') && h('div',{style:{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',marginBottom:10}},
          h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},
            h('input',{type:'checkbox',checked:form.scales_with_qty!=0,onChange:function(e){setForm(function(f){return Object.assign({},f,{scales_with_qty:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
            t('scales_with_qty')
          ),
          h('div',{style:{fontSize:11,color:T.textMute,padding:'4px 6px',background:T.bgSub,borderRadius:T.radius}},
            '📐 '+(lang==='ar'?'مثال':'Example')+': '+( form.expected_time_val!=='' && form.expected_time_val!=null ? form.expected_time_val : 0 )+' '+(form.time_unit==='hr'?t('hours_unit'):t('minutes'))+' '+(lang==='ar'?'لكل':'per')+' '+(form.qty_per_unit!=='' && form.qty_per_unit!=null ? form.qty_per_unit : 1)+' '+(lang==='ar'?'وحدة':'unit')
          )
        ),
        ((form.step_type||stepTypeOf(form))==='delivery') && h('div',{style:{marginBottom:10}},
          h(Select,{
          label:(lang==='en'?'Delivery confirmation':'تأكيد التوصيل'),
            value:form.delivery_direction || 'delivered_to_client',
            onChange:function(v){setForm(function(f){return Object.assign({},f,{delivery_direction:v});});},
            options:[
              {value:'delivered_to_client',label:(lang==='en'?'Delivered to client':'تسليم للزبون')},
              {value:'received_by_client',label:(lang==='en'?'Received by client':'استلام من الزبون')}
            ]
          })
        ),
        ((form.step_type||stepTypeOf(form))!=='external') && h(Select,{label:(form.step_type||stepTypeOf(form))==='delivery'?(lang==='en'?'Delivery Team':'فريق التوصيل'):t('team'),value:String(form.assigned_team_id||''),onChange:function(v){
          setForm(function(f){
            var teamIds = getTeamEmployeeIds(v);
            return Object.assign({},f,{assigned_team_id:v,assigned_employee_ids:teamIds.length?teamIds:(v?f.assigned_employee_ids:[])});
          });
        },options:[{value:'',label:'â€”'}].concat(teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        ((form.step_type||stepTypeOf(form))==='external') && suppliers.length > 0 && h('div',{style:{marginTop:10,padding:'12px 14px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
          h('div',{style:{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10}},'🏭 '+(lang==='en'?'External Supplier Details':'تفاصيل المجهز الخارجي')),
          h(Select,{
            label:(lang==='en'?'Supplier':'المجهز'),
            value:String(form.supplier_id||''),
            onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
            options:[{value:'',label:(lang==='en'?'— Select Supplier —':'— اختر المجهز —')}].concat(suppliers.map(function(s){ return {value:String(s.id),label:ln(s,lang)+(s.phone?' · '+s.phone:'')}; }))
          }),
          h('div',{style:{fontSize:12,color:T.textMute,lineHeight:1.8,marginTop:10}},
            lang==='en'?'Send/receive times are captured later on each order item, not here in the product workflow.':'أوقات الإرسال والاستلام تُسجل لاحقاً داخل الطلب لكل منتج، وليس هنا في بناء سير العمل.'
          )
        ),
        ((form.step_type||stepTypeOf(form))!=='external') && form.assigned_team_id
          ? h(Fld,{label:t('employees')},
              h('div',{style:{border:'1px solid '+T.border,borderRadius:T.radius,padding:'10px 12px',background:T.bgSub,fontSize:12,color:T.textMid,lineHeight:1.8}},
                getTeamEmployeeIds(form.assigned_team_id).length
                  ? getTeamEmployeeIds(form.assigned_team_id).map(function(id){ return nameOf(employees,id,lang); }).join(', ')
                  : (lang==='en' ? 'No employees linked to this team yet.' : 'لا يوجد موظفون مربوطون بهذا الفريق حالياً.')
              ),
              h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},
                lang==='en' ? 'Employees are assigned automatically from the selected team.' : 'يتم تعيين الموظفين تلقائياً من الفريق المختار.'
              )
            )
          : ((form.step_type||stepTypeOf(form))!=='external') && h(MultiSelect,{label:t('employees'),
              values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
              onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
              options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
            }),
        h('div',{style:{display:'flex',gap:24,marginTop:12,flexWrap:'wrap'}},
          h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
          ((form.step_type||stepTypeOf(form))==='external') && h('span',{style:{fontSize:13,color:T.accent,fontWeight:600}},'🏭 '+(lang==='en'?'Tracked by supplier promise/actual times':'تُحسب حسب وعد المجهز والوقت الفعلي')),
          ((form.step_type||stepTypeOf(form))==='delivery') && h('span',{style:{fontSize:13,color:'#f59e0b',fontWeight:600}},'🚚 '+(lang==='en'?'Tracked by delivery window/deadline':'تُحسب حسب نافذة التوصيل والموعد النهائي'))
        ),
        h('div',{style:{fontSize:10,color:'#888',marginTop:4,padding:'4px 6px',background:'#f5f5f5',borderRadius:4}},
          'DEBUG â€” saved IDs: '+JSON.stringify(form.assigned_employee_ids)+' | employee IDs: '+employees.slice(0,3).map(function(e){return e.id+':'+e.name;}).join(', ')
        ),

        h('div',{style:{display:'flex',gap:8,marginTop:10}},
          h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
          h(Btn,{onClick:saveEdit},t('save'))
        )
      )
    )
  );
}

function ProductsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _wf = useState(null); var wfProduct = _wf[0], setWfProduct = _wf[1];
  return h('div',null,
    h(SimpleCRUD, { title:t('products'), resource:'products', onReload:props.onReload,
      columns:[
        {key:'name',label:t('name'),render:function(r){return h('div',null,h('div',{style:{fontWeight:700}},ln(r,lang)),h('div',{style:{fontSize:11,color:T.textMute}},r.sku||''));}},
        {key:'is_active',label:t('status_lbl'),render:function(r){return h(Badge,{label:r.is_active==1?t('active_status'):t('stopped'),color:r.is_active==1?'green':'gray'});}},
      ],
      blankForm:{name:'',name_en:'',sku:'',description:'',description_en:'',is_active:1},
      extraActions:function(r){ return h(Btn,{size:'sm',variant:'secondary',onClick:function(){setWfProduct(r);}}, '⚙ '+t('workflow')); },
      FormContent:function(p){ return h('div',null,
        h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
          h(Input,{label:t('sku'),value:p.form.sku,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{sku:v});});}}),
          h(Select,{label:t('status_lbl'),value:String(p.form.is_active),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_active:parseInt(v)});});},options:[{value:'1',label:t('active_status')},{value:'0',label:t('stopped')}]})
        ),
        h(Textarea,{label:t('description')+' (Ø¹Ø±Ø¨ÙŠ)',value:p.form.description,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{description:v});});}}),
        h(Textarea,{label:t('description')+' (EN)',value:p.form.description_en||'',onChange:function(v){p.setForm(function(f){return Object.assign({},f,{description_en:v});});}})
      ); }
    }),
    wfProduct && h(ProductWorkflowModal,{product:wfProduct,bootstrap:props.bootstrap,onReload:props.onReload,onClose:function(){setWfProduct(null);}})
  );
}

function stepTypeOf(step) {
  if (parseInt(step && step.is_delivery, 10) === 1) return 'delivery';
  if (parseInt(step && step.is_external, 10) === 1) return 'external';
  return 'internal';
}

function askDeliverySetup(opts) {
  var o = opts || {};
  var lang = String(o.lang || 'en');
  var isEn = lang === 'en';
  var cur = String(o.currentDirection || '').trim();
  var def = cur === 'received_by_client' ? '2' : '1';
  var msg = isEn
    ? 'Choose delivery mode:\n1) Delivered to client\n2) Received by client\n\nType 1 or 2'
    : 'اختر نوع التوصيل:\n1) توصيل الى الزبون\n2) استلمت من قبل الزبون\n\nاكتب 1 او 2';
  var ans = '';
  try { ans = String(window.prompt(msg, def) || '').trim(); } catch (e) { ans = ''; }
  var direction = ans === '2' ? 'received_by_client' : 'delivered_to_client';

  if (direction !== 'delivered_to_client') return { direction: direction, employeeId: '' };

  var teamId = String(o.teamId || '');
  var getTeamEmployeeIds = typeof o.getTeamEmployeeIds === 'function' ? o.getTeamEmployeeIds : function(){ return []; };
  var employees = Array.isArray(o.employees) ? o.employees : [];
  var ids = getTeamEmployeeIds(teamId);
  if (!teamId || !ids.length) {
    try { window.alert(isEn ? 'Please choose a delivery team first (with at least one employee).' : 'اختر فريق التوصيل أولاً (ويحتوي موظف واحد على الأقل).'); } catch(e) {}
    return { direction: direction, employeeId: '' };
  }

  var list = ids.map(function(id, idx){
    var e = employees.filter(function(x){ return String(x.id) === String(id); })[0] || null;
    var nm = e ? (e.name || e.name_en || ('#'+id)) : ('#'+id);
    return (idx+1)+') '+nm;
  }).join('\n');
  var pickMsg = isEn
    ? ('Who delivered it? (from delivery team)\n'+list+'\n\nType number')
    : ('منو وصلها؟ (من ضمن فريق التوصيل)\n'+list+'\n\nاكتب الرقم');
  var pick = '';
  try { pick = String(window.prompt(pickMsg, '1') || '').trim(); } catch (e2) { pick = ''; }
  var i = Math.max(1, parseInt(pick,10)||1) - 1;
  var employeeId = ids[i] ? String(ids[i]) : String(ids[0]);
  return { direction: direction, employeeId: employeeId };
}

function applyStepType(form, type) {
  var next = Object.assign({}, form || {});
  next.step_type = type;
  if (type === 'delivery') {
    next.is_delivery = 1;
    next.is_external = 0;
    next.scales_with_qty = 0;
    next.qty_per_unit = 1;
    next.supplier_id = '';
    next.ext_send_at = '';
    next.ext_receive_expected = '';
    next.show_in_prds = 1;
    next.delivery_direction = next.delivery_direction || 'delivered_to_client';
  } else if (type === 'external') {
    next.is_delivery = 0;
    next.is_external = 1;
    next.scales_with_qty = 0;
    next.qty_per_unit = 1;
    next.assigned_team_id = '';
    next.assigned_employee_ids = [];
    next.delivery_direction = '';
  } else {
    next.is_delivery = 0;
    next.is_external = 0;
    if (next.scales_with_qty == null || next.scales_with_qty === '') next.scales_with_qty = 1;
    if (!next.qty_per_unit) next.qty_per_unit = 1;
    next.supplier_id = '';
    next.ext_send_at = '';
    next.ext_receive_expected = '';
    next.delivery_direction = '';
  }
  return next;
}

/* â•â•â• PRODUCT STEPS â•â•â• */
function ProductStepsView(props) {
  var t = useI18n().t;
  var bs = props.bootstrap || {};
  var products  = asArr(bs.products);
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var roles     = asArr(bs.roles);
  var suppliers = asArr(bs.suppliers);
  var _pid = useState(''); var pid = _pid[0], setPid = _pid[1];
  var _steps = useState([]); var steps = _steps[0], setSteps = _steps[1];
  var _loading = useState(false); var loading = _loading[0], setLoading = _loading[1];
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var lang = useI18n().lang;
  function getTeamEmployeeIds(teamId) {
    if (!teamId) return [];
    return employees.filter(function(e){ return String(e.team_id)===String(teamId); }).map(function(e){ return String(e.id); });
  }
  var blank = {step_name:'',step_name_en:'',step_order:0,assigned_employee_id:'',assigned_team_id:'',assigned_role_id:'',status_slug:'pending',expected_hours:0,show_in_prds:0,is_external:0,is_delivery:0,step_type:'internal',supplier_id:'',ext_send_at:'',ext_receive_expected:'',scales_with_qty:1,qty_per_unit:1,delivery_direction:'delivered_to_client'};

  function loadSteps(p) {
    setLoading(true);
    apiFetch('products/'+p+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setSteps([]); setLoading(false); });
  }
  useEffect(function(){ if(pid) loadSteps(pid); }, [pid]);

  function save() {
    var data = Object.assign({}, form);
    var stepType = data.step_type || stepTypeOf(data);
    if (stepType === 'internal') {
      data.scales_with_qty = data.scales_with_qty === 0 || data.scales_with_qty === '0' ? 0 : 1;
      data.qty_per_unit = Math.max(1, parseInt(data.qty_per_unit,10)||1);
    } else {
      data.scales_with_qty = 0;
      data.qty_per_unit = 1;
    }
    if (stepType === 'delivery') data.delivery_direction = data.delivery_direction || 'delivered_to_client';
    else data.delivery_direction = '';
    data.assigned_employee_ids = Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [];
    var prom = form.id ? apiFetch('product-steps/'+form.id,{method:'PUT',body:JSON.stringify(data)}) : apiFetch('products/'+pid+'/steps',{method:'POST',body:JSON.stringify(data)});
    prom.then(function(){ setForm(null); loadSteps(pid); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('product-steps/'+id,{method:'DELETE'}).then(function(){ loadSteps(pid); }); }

  useTopbar(t('workflow_hint'), null);
  return h('div', null,
    h(Card,{style:{padding:'14px 20px',marginBottom:16}}, h(Select,{label:t('product'),value:pid,onChange:setPid,options:products.map(function(p){return {value:p.id,label:ln(p,lang)};})})),
    pid && h('div',{style:{marginBottom:12,display:'flex',justifyContent:'flex-end'}}, h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add'))),
    loading ? h(PageLoader) : h(DataTable, {
      columns:[
        {key:'step_order',label:'#',render:function(r){return h('span',{style:{fontFamily:'monospace',color:T.textMute}},r.step_order);}},
        {key:'step_name',label:t('step_name'),render:function(r){return h('span',{style:{fontWeight:600}},lnStep(r,lang));}},
        {key:'assigned_employee_id',label:t('employee'),render:function(r){return nameOf(employees,r.assigned_employee_id);}},
        {key:'assigned_team_id',label:t('team'),render:function(r){return nameOf(teams,r.assigned_team_id,lang);}},
        {key:'expected_hours',label:t('expected_hours'),render:function(r){return fmtH(r.expected_hours);}},
        {key:'show_in_prds',label:'KDS',render:function(r){return h(Badge,{label:r.show_in_prds==1?t('complete_btn'):'â€”',color:r.show_in_prds==1?'green':'gray'});}},
      ],
      rows:steps, onEdit:function(r){
        var eids = [];
        try { eids = typeof r.assigned_employee_ids==='string' ? JSON.parse(r.assigned_employee_ids||'[]') : (r.assigned_employee_ids||[]); } catch(e){}
        setForm(Object.assign({},blank,r,{step_type:stepTypeOf(r),assigned_employee_ids:eids.map(String),scales_with_qty:(r.scales_with_qty == null ? 1 : parseInt(r.scales_with_qty,10)||0),qty_per_unit:(r.qty_per_unit == null ? 1 : parseInt(r.qty_per_unit,10)||1),delivery_direction:r.delivery_direction||'delivered_to_client'}));
      }, onDelete:function(r){del(r.id);}
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('step_name'),ar:form.step_name,en:form.step_name_en,onAr:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{step_name_en:v});});}}),
      h(Select,{label:(lang==='en'?'Step Type':'Ù†ÙˆØ¹ Ø§Ù„Ø®Ø·ÙˆØ©'),value:form.step_type||stepTypeOf(form),onChange:function(v){setForm(function(f){ var next = applyStepType(f,v); if (v === 'delivery') { var ds = askDeliverySetup({lang:lang,currentDirection:next.delivery_direction,teamId:next.assigned_team_id,getTeamEmployeeIds:getTeamEmployeeIds,employees:employees}); next.delivery_direction = ds.direction; if (ds.employeeId) next.assigned_employee_ids = [String(ds.employeeId)]; } return next; });},options:[
        {value:'internal',label:(lang==='en'?'Internal Production':'Ø¥Ù†ØªØ§Ø¬ Ø¯Ø§Ø®Ù„ÙŠ')},
        {value:'external',label:(lang==='en'?'External Supplier':'Ù…Ø¬Ù‡Ø² Ø®Ø§Ø±Ø¬ÙŠ')},
        {value:'delivery',label:(lang==='en'?'Delivery':'ØªÙˆØµÙŠÙ„')}
      ]}),
      ((form.step_type||stepTypeOf(form))==='internal') && h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13,marginTop:8,marginBottom:6}},
        h('input',{type:'checkbox',checked:form.scales_with_qty!=0,onChange:function(e){setForm(function(f){return Object.assign({},f,{scales_with_qty:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
        t('scales_with_qty')
      ),
      ((form.step_type||stepTypeOf(form))==='delivery') && h(Select,{label:(lang==='en'?'Delivery confirmation':'تأكيد التوصيل'),value:form.delivery_direction||'delivered_to_client',onChange:function(v){setForm(function(f){return Object.assign({},f,{delivery_direction:v});});},options:[
        {value:'delivered_to_client',label:(lang==='en'?'Delivered to client':'تسليم للزبون')},
        {value:'received_by_client',label:(lang==='en'?'Received by client':'استلام من الزبون')}
      ]}),
      ((form.step_type||stepTypeOf(form))==='internal')
        ? h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
            h(Input,{label:t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
            h(Input,{label:t('expected_hours'),type:'number',value:form.expected_hours,onChange:function(v){setForm(function(f){return Object.assign({},f,{expected_hours:parseFloat(v)||0});})}})
          )
        : h('div',{style:{display:'grid',gridTemplateColumns:'1fr',gap:12}},
            h(Input,{label:t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
            h('div',{style:{fontSize:12,color:T.textMid,padding:'10px 12px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
              (form.step_type||stepTypeOf(form))==='external'
                ? (lang==='en'?'Expected timing for this external step is entered later per order item.':'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ© ÙŠÙØ¯Ø®Ù„ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ù„ÙƒÙ„ Ù…Ù†ØªØ¬ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø·Ù„Ø¨.')
                : (lang==='en'?'Expected delivery timing is entered later per order item.':'ÙˆÙ‚Øª Ø§Ù„ØªÙˆØµÙŠÙ„ Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ ÙŠÙØ¯Ø®Ù„ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ù„ÙƒÙ„ Ù…Ù†ØªØ¬ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø·Ù„Ø¨.')
            )
          ),
      ((form.step_type||stepTypeOf(form))!=='external') && h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Select,{label:(form.step_type||stepTypeOf(form))==='delivery'?(lang==='en'?'Delivery Team':'ÙØ±ÙŠÙ‚ Ø§Ù„ØªÙˆØµÙŠÙ„'):t('team'),value:String(form.assigned_team_id||''),onChange:function(v){setForm(function(f){ var teamIds = getTeamEmployeeIds(v); return Object.assign({},f,{assigned_team_id:v,assigned_employee_ids:teamIds.length?teamIds:(v?f.assigned_employee_ids:[])}); });},options:[{value:'',label:'â€”'}].concat(teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        h(Select,{label:t('role'),value:String(form.assigned_role_id||''),onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_role_id:v});});},options:[{value:'',label:'â€”'}].concat(roles.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))})
      ),
      h('div',{style:{display:'flex',gap:24,marginTop:14,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
        (form.step_type||stepTypeOf(form))==='external' && h('span',{style:{fontSize:13,color:T.accent,fontWeight:600}},'ðŸ­ '+(lang==='en'?'Tracked by supplier promise/actual times':'ØªÙØ­Ø³Ø¨ Ø­Ø³Ø¨ ÙˆØ¹Ø¯ Ø§Ù„Ù…Ø¬Ù‡Ø² ÙˆØ§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ')),
        (form.step_type||stepTypeOf(form))==='delivery' && h('span',{style:{fontSize:13,color:'#f59e0b',fontWeight:600}},'ðŸšš '+(lang==='en'?'Tracked by delivery window/deadline':'ØªÙØ­Ø³Ø¨ Ø­Ø³Ø¨ Ù†Ø§ÙØ°Ø© Ø§Ù„ØªÙˆØµÙŠÙ„ ÙˆØ§Ù„Ù…ÙˆØ¹Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ'))
      ),
      /* External supplier fields â€” only shown when step type is external */
      (form.step_type||stepTypeOf(form))==='external' && h('div',{style:{marginTop:12,padding:'12px 14px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
        h('div',{style:{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10}},'ðŸ­ '+(lang==='en'?'External Supplier Details':'ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø¬Ù‡Ø² Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ')),
        h(Select,{label:lang==='en'?'Supplier':'Ø§Ù„Ù…Ø¬Ù‡Ø²',value:String(form.supplier_id||''),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
          options:[{value:'',label:lang==='en'?'â€” Select Supplier â€”':'â€” Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¬Ù‡Ø² â€”'}].concat(
            suppliers.map(function(s){ return {value:String(s.id),label:supplierLabel(s,lang)+(s.phone?' Â· '+s.phone:'')};})
          )
        }),
        h('div',{style:{fontSize:12,color:T.textMute,lineHeight:1.8,marginTop:10}},
          lang==='en'?'Supplier promised and actual times are filled later on the order item.':'Ø£ÙˆÙ‚Ø§Øª ÙˆØ¹Ø¯ Ø§Ù„Ù…Ø¬Ù‡Ø² ÙˆØ§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ ØªÙØ³Ø¬Ù„ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„ÙƒÙ„ Ù…Ù†ØªØ¬.'
        )
      ),
      ((form.step_type||stepTypeOf(form))!=='external') && form.assigned_team_id
        ? h('div',{style:{gridColumn:'1 / -1'}},
            h(Fld,{label:t('employees')},
              h('div',{style:{border:'1px solid '+T.border,borderRadius:T.radius,padding:'10px 12px',background:T.bgSub,fontSize:12,color:T.textMid,lineHeight:1.8}},
                getTeamEmployeeIds(form.assigned_team_id).length
                  ? getTeamEmployeeIds(form.assigned_team_id).map(function(id){ return nameOf(employees,id,lang); }).join(', ')
                  : (lang==='en' ? 'No employees linked to this team yet.' : 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆØ¸ÙÙˆÙ† Ù…Ø±Ø¨ÙˆØ·ÙˆÙ† Ø¨Ù‡Ø°Ø§ Ø§Ù„ÙØ±ÙŠÙ‚ Ø­Ø§Ù„ÙŠØ§Ù‹.')
              ),
              h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},
                lang==='en' ? 'Employees are assigned automatically from the selected team.' : 'ÙŠØªÙ… ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù…Ù† Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø®ØªØ§Ø±.'
              )
            )
          )
        : ((form.step_type||stepTypeOf(form))!=='external') && h('div',{style:{gridColumn:'1 / -1'}},
            h(MultiSelect,{label:t('employees'),
              values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
              onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
              options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
            })
          )
    )
  );
}

/* â•â•â• TASKS / STEPS / NOTIFICATIONS â•â•â• */
/* â•â•â• EXTERNAL TASKS VIEW â•â•â•
 * Groups external steps by supplier â€” each supplier is a row with a carousel of order cards
 */
function ExternalTasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders    = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var suppliers = asArr(bs.suppliers);
  var productSteps = asArr(bs.product_steps);
  var stepLibrary = asArr(bs.step_library);
  var debugExternal = isDebugEnabled('cspsr_debug_external');

  function resolveSupplierForStep(stepObj) {
    if (!stepObj) return { id:'', name:'' };
    var sid = stepObj.supplier_id || stepObj.external_supplier_id || stepObj.supplier || (stepObj.item && (stepObj.item.supplier_id || stepObj.item.external_supplier_id)) || '';
    var sname = stepObj.supplier_name || stepObj.external_supplier_name || (stepObj.item && (stepObj.item.supplier_name || stepObj.item.external_supplier_name)) || '';
    if (sid) {
      var matchedSupplier = suppliers.filter(function(x){ return String(x.id) === String(sid); })[0] || null;
      var matchedName = matchedSupplier ? supplierLabel(matchedSupplier, lang) : '';
      var directResolved = { id:String(sid), name:(sname||matchedName||'') };
      if (debugExternal) {
        console.groupCollapsed('[CSPSR External Debug] direct supplier resolve');
        console.log('step', stepObj);
        console.log('sid', sid);
        console.log('step name', sname);
        console.log('matched supplier', matchedSupplier);
        console.log('resolved', directResolved);
        console.groupEnd();
      }
      return directResolved;
    }
    var item = stepObj.item || {};
    var stepNameNorm = String(stepObj.step_name || '').toLowerCase().trim();
    var stepNameEnNorm = String(stepObj.step_name_en || '').toLowerCase().trim();
    var tpl = productSteps.filter(function(ps){
      if (String(ps.product_id||'') !== String(item.product_id||'')) return false;
      var psAr = String(ps.step_name||'').toLowerCase().trim();
      var psEn = String(ps.step_name_en||'').toLowerCase().trim();
      return (!!stepNameNorm && (psAr === stepNameNorm || psEn === stepNameNorm)) ||
             (!!stepNameEnNorm && (psAr === stepNameEnNorm || psEn === stepNameEnNorm));
    })[0] || productSteps.filter(function(ps){
      return String(ps.product_id||'') === String(item.product_id||'') && parseInt(ps.is_external,10) === 1;
    })[0];
    if (tpl) {
      var tplSid = String(tpl.supplier_id || tpl.external_supplier_id || '');
      var tplSup = tplSid ? suppliers.filter(function(x){ return String(x.id) === tplSid; })[0] || null : null;
      var tplSupName = tplSup ? supplierLabel(tplSup, lang) : '';
      if (!tplSid) {
        var lib = stepLibrary.filter(function(sl){
          var slAr = String(sl.step_name||'').toLowerCase().trim();
          var slEn = String(sl.step_name_en||'').toLowerCase().trim();
          return (!!stepNameNorm && (slAr === stepNameNorm || slEn === stepNameNorm)) ||
                 (!!stepNameEnNorm && (slAr === stepNameEnNorm || slEn === stepNameEnNorm));
        })[0] || stepLibrary.filter(function(sl){
          return parseInt(sl.is_external,10) === 1;
        })[0] || null;
        if (lib) {
          tplSid = String(lib.supplier_id || lib.external_supplier_id || '');
          tplSup = tplSid ? suppliers.filter(function(x){ return String(x.id) === tplSid; })[0] || null : null;
          tplSupName = tplSup ? supplierLabel(tplSup, lang) : '';
        }
      }
      var tplResolved = {
        id: tplSid,
        name: hasRealLabel(tpl.supplier_name) ? tpl.supplier_name
          : hasRealLabel(tpl.external_supplier_name) ? tpl.external_supplier_name
          : hasRealLabel(tplSupName) ? tplSupName
          : ''
      };
      if (debugExternal) {
        console.groupCollapsed('[CSPSR External Debug] template supplier resolve');
        console.log('step', stepObj);
        console.log('matched template', tpl);
        console.log('matched supplier', tplSup);
        console.log('resolved', tplResolved);
        console.groupEnd();
      }
      return tplResolved;
    }
    var emptyResolved = { id:'', name:sname||'' };
    if (debugExternal) {
      console.groupCollapsed('[CSPSR External Debug] unresolved supplier');
      console.log('step', stepObj);
      console.log('resolved', emptyResolved);
      console.groupEnd();
    }
    return emptyResolved;
  }

  /* Collect all active external steps */
  var allSteps = [];
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if (['done','completed','cancelled'].indexOf(s.status_slug) >= 0) return;
        if (s.is_external != 1) return;
        allSteps.push(Object.assign({}, s, {order:order, item:item}));
      });
    });
  });

  var _view = useState('live'); var activeView = _view[0], setActiveView = _view[1];

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  function startOfWeek(d) {
    var x = startOfDay(d);
    var day = x.getDay();
    var diff = (day === 0 ? -6 : 1 - day);
    x.setDate(x.getDate() + diff);
    return x;
  }
  function endOfWeek(d) {
    var x = startOfWeek(d);
    x.setDate(x.getDate() + 6);
    x.setHours(23,59,59,999);
    return x;
  }
  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }
  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  function expectedDateOf(step) {
    return step && step.ext_receive_expected ? parseServerDate(step.ext_receive_expected) : null;
  }
  function sentDateOf(step) {
    return step && step.ext_send_at ? parseServerDate(step.ext_send_at) : null;
  }
  function dueDateOf(step) {
    return expectedDateOf(step) || sentDateOf(step);
  }
  function inRange(dt, from, to) {
    if (!dt) return false;
    return dt >= from && dt <= to;
  }
  function isOverdueStep(step, now) {
    var expected = expectedDateOf(step);
    return !!expected && !step.ext_receive_actual && expected < now;
  }
  function isNearReceiptStep(step, now) {
    var expected = expectedDateOf(step);
    if (!expected || step.ext_receive_actual) return false;
    var diff = expected.getTime() - now.getTime();
    return diff >= 0 && diff <= (72 * 60 * 60 * 1000);
  }
  function matchesView(step, view, now) {
    var expected = expectedDateOf(step);
    var sent = sentDateOf(step);
    var anchor = expected || sent;
    if (view === 'live') return true;
    if (view === 'overdue') return isOverdueStep(step, now);
    if (view === 'near') return isNearReceiptStep(step, now);
    if (!anchor) return false;
    if (view === 'today') return inRange(anchor, startOfDay(now), endOfDay(now));
    if (view === 'week') return inRange(anchor, startOfWeek(now), endOfWeek(now));
    if (view === 'month') return inRange(anchor, startOfMonth(now), endOfMonth(now));
    return true;
  }
  function sortStepsForView(steps, view, now) {
    return steps.slice().sort(function(a,b){
      var ad = dueDateOf(a), bd = dueDateOf(b);
      var at = ad ? ad.getTime() : Number.MAX_SAFE_INTEGER;
      var bt = bd ? bd.getTime() : Number.MAX_SAFE_INTEGER;
      if (view === 'overdue' || view === 'near') return at - bt;
      if (view === 'today' || view === 'week' || view === 'month') return at - bt;
      var aLate = isOverdueStep(a, now) ? 1 : 0;
      var bLate = isOverdueStep(b, now) ? 1 : 0;
      if (aLate !== bLate) return bLate - aLate;
      return at - bt;
    });
  }
  function buildRows(filteredSteps, view, now) {
    var supplierMap = {};
    filteredSteps.forEach(function(s){
      var resolvedSupplier = resolveSupplierForStep(s);
      s._resolved_supplier_id = resolvedSupplier.id || '';
      s._resolved_supplier_name = resolvedSupplier.name || '';
      var sid = String(resolvedSupplier.id || ('name:' + (resolvedSupplier.name || 'none')));
      if (!supplierMap[sid]) supplierMap[sid] = [];
      supplierMap[sid].push(s);
    });
    var out = Object.keys(supplierMap).map(function(sid){
      var steps = sortStepsForView(supplierMap[sid], view, now);
      var numericSid = sid.indexOf('name:')===0 ? '' : sid;
      var sup = numericSid ? suppliers.filter(function(x){ return String(x.id)===numericSid; })[0] : null;
      var lateCount = steps.filter(function(s){ return isOverdueStep(s, now); }).length;
      var nearestExpected = null;
      steps.forEach(function(s){
        var d = expectedDateOf(s);
        if (d && (!nearestExpected || d < nearestExpected)) nearestExpected = d;
      });
      return {sid:sid, sup:sup, steps:steps, lateCount:lateCount, nearestExpected:nearestExpected};
    });
    out.sort(function(a,b){
      if (view === 'overdue' || view === 'near' || view === 'today' || view === 'week' || view === 'month') {
        var at = a.nearestExpected ? a.nearestExpected.getTime() : Number.MAX_SAFE_INTEGER;
        var bt = b.nearestExpected ? b.nearestExpected.getTime() : Number.MAX_SAFE_INTEGER;
        return at - bt;
      }
      if (a.lateCount !== b.lateCount) return b.lateCount - a.lateCount;
      var at2 = a.nearestExpected ? a.nearestExpected.getTime() : Number.MAX_SAFE_INTEGER;
      var bt2 = b.nearestExpected ? b.nearestExpected.getTime() : Number.MAX_SAFE_INTEGER;
      return at2 - bt2;
    });
    return out;
  }

  var now = new Date();
  var views = [
    { key:'live',  label:lang==='en'?'Live':'مباشر', note:lang==='en'?'All active supplier tasks':'كل المهام الخارجية النشطة' },
    { key:'today', label:lang==='en'?'Today':'اليوم', note:lang==='en'?'Tasks anchored today':'مهام اليوم' },
    { key:'week',  label:lang==='en'?'Week':'الأسبوع', note:lang==='en'?'This week pipeline':'مهام هذا الأسبوع' },
    { key:'month', label:lang==='en'?'Month':'الشهر', note:lang==='en'?'This month pipeline':'مهام هذا الشهر' },
    { key:'near',  label:lang==='en'?'Near Receipts':'استلامات قريبة', note:lang==='en'?'What should be received soon':'ما يجب استلامه قريباً' },
    { key:'overdue', label:lang==='en'?'Overdue':'متأخر', note:lang==='en'?'Expected returns that are late':'الاستلامات المتأخرة' }
  ];
  var countsByView = {};
  views.forEach(function(v){
    countsByView[v.key] = allSteps.filter(function(s){ return matchesView(s, v.key, now); }).length;
  });
  var filteredSteps = allSteps.filter(function(s){ return matchesView(s, activeView, now); });
  var rows = buildRows(filteredSteps, activeView, now);

  if (debugExternal && typeof window !== 'undefined') {
    window.__CSPSR_EXTERNAL_DEBUG__ = {
      suppliers: suppliers,
      productSteps: productSteps,
      allSteps: allSteps,
      filteredSteps: filteredSteps,
      activeView: activeView,
      rows: rows
    };
    console.log('[CSPSR External Debug] window.__CSPSR_EXTERNAL_DEBUG__ ready', window.__CSPSR_EXTERNAL_DEBUG__);
  }

  /* Carousel state: {sid: currentIndex} */
  var _pos = useState({}); var positions = _pos[0], setPositions = _pos[1];

  function getPos(sid){ return positions[sid]||0; }
  function setPos(sid, idx){
    setPositions(function(prev){
      var n = Object.assign({},prev); n[sid]=idx; return n;
    });
  }

  /* Delay indicator */
  function delayBadge(s){
    var m = s.external_metrics || {};
    var variance = parseInt(s.ext_receive_actual ? (m.variance_minutes||0) : (m.live_variance_minutes||0), 10) || 0;
    var status = m.on_time_status || '';
    if (!s.ext_receive_expected) return null;
    if (status === 'late' && variance > 0) {
      return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}},
        (lang==='en'?'Late ':'متأخر ')+fmtDaysMin(variance, lang)
      );
    }
    if (status === 'early' && variance < 0) {
      return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}},
        (lang==='en'?'Early ':'مبكر ')+fmtDaysMin(Math.abs(variance), lang)
      );
    }
    if (status === 'at_supplier' || status === 'scheduled') {
      return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(59,130,246,.1)',color:T.blue}},
        lang==='en'?'At supplier':'عند المجهز'
      );
    }
    return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}},
      lang==='en'?'On time':'في الوقت'
    );
  }

  function fmtDT(str){
    if (!str) return null;
    var d = parseServerDate(str);
    if (lang==='en') {
      return d.toLocaleString('en-GB',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    }
    return d.toLocaleString('ar-IQ',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'});
  }

  var CARD_W = 220;

  useTopbar(lang==='en'?'External Tasks':'المهام الخارجية', null);

  return h('div',{style:{display:'flex',flexDirection:'column',gap:10}},

    h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:2}},
      views.map(function(v){
        var active = activeView === v.key;
        return h('button',{
          key:v.key,
          onClick:function(){ setActiveView(v.key); },
          style:{
            border:'1px solid '+(active?T.accent:T.border),
            background:active?T.accent:T.bg,
            color:active?'#fff':T.text,
            borderRadius:999,
            padding:'8px 12px',
            cursor:'pointer',
            fontSize:12,
            fontWeight:700,
            display:'inline-flex',
            alignItems:'center',
            gap:8
          }
        },
          h('span',null,v.label),
          h('span',{style:{
            minWidth:18,height:18,padding:'0 6px',
            borderRadius:99,
            background:active?'rgba(255,255,255,.18)':T.bgSub,
            color:active?'#fff':T.textMute,
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            fontSize:11,fontWeight:800
          }}, String(countsByView[v.key] || 0))
        );
      })
    ),

    /* Total summary */
    h('div',{style:{fontSize:13,color:T.textMute,marginBottom:4}},
      (rows.length+' '+(lang==='en'?'suppliers':'مجهز'))+' · '+
      (filteredSteps.length+' '+(lang==='en'?'tasks':'مهام'))+' · '+
      ((views.filter(function(v){ return v.key===activeView; })[0] || {}).note || '')
    ),

    rows.length === 0
      ? h('div',{style:{padding:40,textAlign:'center'}},
          h('div',{style:{fontSize:32,marginBottom:10}}, activeView==='near' ? '📥' : (activeView==='overdue' ? '⏰' : '🏭')),
          h('div',{style:{color:T.textMute,fontSize:14}},
            activeView==='near'
              ? (lang==='en'?'No nearby receipts':'لا توجد استلامات قريبة')
              : activeView==='overdue'
                ? (lang==='en'?'No overdue external tasks':'لا توجد مهام خارجية متأخرة')
                : (lang==='en'?'No external tasks in this view':'لا توجد مهام في هذا العرض')
          )
        )
      : null,

    rows.map(function(row){
      var sup = row.sup;
      var steps = row.steps;
      var cur = getPos(row.sid);
      var total = steps.length;

      /* Avatar initials */
      var fallbackStep = steps[0] || {};
      var fallbackName = fallbackStep._resolved_supplier_name || '';
      var supplierDisplay = sup ? supplierLabel(sup,lang) : '';
      var name = hasRealLabel(supplierDisplay) ? supplierDisplay : (hasRealLabel(fallbackName) ? fallbackName : (lang==='en'?'Unknown':'غير محدد'));
      var initials = name.slice(0,2);
      var avatarColors = ['#EEEDFE/#3C3489','#E1F5EE/#085041','#FAEEDA/#633806','#FAECE7/#993C1D','#E6F1FB/#185FA5'];
      var ci = parseInt(row.sid)%5||0;
      var aColors = avatarColors[ci].split('/');

      return h('div',{key:row.sid, style:{
        display:'grid',
        gridTemplateColumns:'150px 1fr',
        border:'1px solid '+T.border,
        borderRadius:T.radiusLg,
        overflow:'hidden',
        background:T.bg
      }},

        /* Supplier cell */
        h('div',{style:{
          background:T.bgSub,
          padding:'16px 14px',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center',
          gap:6,
          borderLeft:'1px solid '+T.border
        }},
          h('div',{style:{
            width:40,height:40,borderRadius:'50%',
            background:aColors[0],color:aColors[1],
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:700,marginBottom:4
          }}, initials),
          h('div',{style:{fontSize:13,fontWeight:600,color:T.text}}, name),
          sup && sup.phone && h('div',{style:{fontSize:11,color:T.textMute}}, sup.phone),
          h('div',{style:{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}},
            h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:T.bg,border:'1px solid '+T.border,color:T.textMid}},
              total+' '+(lang==='en'?'tasks':'مهمة')
            ),
            row.lateCount > 0 && h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}},
              row.lateCount+' '+(lang==='en'?'late':'متأخرة')
            )
          )
        ),

        /* Carousel */
        h('div',{style:{display:'flex',flexDirection:'column',minWidth:0}},

          /* Track */
          h('div',{style:{overflow:'hidden',flex:1}},
            h('div',{style:{
              display:'flex',
              transform:'translateX(-'+(cur*CARD_W)+'px)',
              transition:'transform 0.3s ease'
            }},
              steps.map(function(s,i){
                return h('div',{key:s.id, style:{
                  minWidth:CARD_W,maxWidth:CARD_W,
                  padding:'14px',
                  borderLeft: i===0?'none':'1px solid '+T.border,
                  display:'flex',flexDirection:'column',gap:7
                }},
                  /* Order number */
                  h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                    h('span',{style:{fontSize:12,fontWeight:600,color:T.accent}},'#'+s.order.order_number),
                    statusBadge(s.status_slug, asArr(bs.statuses), lang)
                  ),
                  /* Product + customer */
                  h('div',null,
                    h('div',{style:{fontSize:13,fontWeight:600,color:T.text}},
                      (lang==='en'&&s.item.product_name_en) ? s.item.product_name_en : s.item.product_name
                    ),
                    h('div',{style:{fontSize:11,color:T.textMute}}, getCust(s.order,lang))
                  ),
                  /* Step name */
                  h('div',{style:{fontSize:11,color:T.accent,background:T.accentDim,borderRadius:4,padding:'2px 6px',width:'fit-content'}},
                    lnStep(s,lang)
                  ),
                  /* Dates */
                  h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
                    h('div',{style:{fontSize:11,color:T.textMute}},
                      (lang==='en'?'Sent: ':'أُرسل: ')+(s.ext_send_at ? fmtDT(s.ext_send_at) : (lang==='en'?'Not sent':'لم يُرسل'))
                    ),
                    h('div',{style:{fontSize:11,color:T.textMute}},
                      (lang==='en'?'Expected: ':'المتوقع: ')+(s.ext_receive_expected ? fmtDT(s.ext_receive_expected) : '--')
                    ),
                    s.ext_receive_actual && h('div',{style:{fontSize:11,color:T.green}},
                      (lang==='en'?'Received: ':'استُلِم: ')+fmtDT(s.ext_receive_actual)
                    ),
                    (s.external_metrics && (s.external_metrics.promised_duration_minutes || s.external_metrics.actual_duration_minutes)) && h('div',{style:{fontSize:11,color:T.textMid}},
                      (lang==='en'?'Promised Work Time: ':'وقت الوعد للمجهز: ')+fmtMin(s.external_metrics.promised_duration_minutes||0)
                      +' · '+
                      (lang==='en'?'Actual: ':'الفعلي: ')+(s.external_metrics.actual_duration_minutes?fmtMin(s.external_metrics.actual_duration_minutes):(lang==='en'?'Waiting':'بانتظار'))
                    )
                  ),
                  /* Delay badge */
                  delayBadge(s)
                );
              })
            )
          ),

          /* Footer: dots + nav */
          h('div',{style:{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'8px 12px',
            borderTop:'1px solid '+T.border,
            background:T.bgSub
          }},
            /* Dots */
            h('div',{style:{display:'flex',gap:4,alignItems:'center'}},
              Array.from({length:Math.min(total,8)}).map(function(_,i){
                var active = i===Math.min(cur,Math.min(total,8)-1);
                return h('div',{
                  key:i,
                  onClick:function(){ setPos(row.sid, i); },
                  style:{
                    width:active?18:6, height:6,
                    borderRadius:active?3:99,
                    background:active?T.accent:T.border,
                    cursor:'pointer',
                    transition:'all 0.2s'
                  }
                });
              })
            ),
            /* Page counter */
            h('span',{style:{fontSize:12,color:T.textMute}}, (cur+1)+' / '+total),
            /* Nav buttons */
            h('div',{style:{display:'flex',gap:4}},
              h('button',{
                onClick:function(){ setPos(row.sid, Math.max(0,cur-1)); },
                disabled:cur===0,
                style:{
                  width:28,height:28,borderRadius:6,
                  border:'1px solid '+T.border,
                  background:T.bg,color:T.text,
                  cursor:cur===0?'default':'pointer',
                  opacity:cur===0?0.3:1,
                  fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'
                }
              },'â€¹'),
              h('button',{
                onClick:function(){ setPos(row.sid, Math.min(total-1,cur+1)); },
                disabled:cur===total-1,
                style:{
                  width:28,height:28,borderRadius:6,
                  border:'1px solid '+T.border,
                  background:T.bg,color:T.text,
                  cursor:cur===total-1?'default':'pointer',
                  opacity:cur===total-1?0.3:1,
                  fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'
                }
              },'â€º')
            )
          )
        )
      );
    })
  );
}


function TasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var authUser = props.authUser || {};
  var isAdmin = String(authUser.role||'').replace(/['"]/g,'').trim() === 'admin';
  var myEmpId = authUser.employee_id ? parseInt(authUser.employee_id) : null;
  var employees = asArr(bs.employees);
  var orders   = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var statuses = asArr(bs.statuses);

  /* Admin: employee filter dropdown */
  var _selEmp = useState(''); var selEmpId = _selEmp[0], setSelEmpId = _selEmp[1];

  /* Collect all steps */
  var allSteps = [];
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if (['done','completed','cancelled'].indexOf(s.status_slug) >= 0) return;
        if (props.externalOnly && s.is_external != 1) return;
        if (!props.externalOnly && s.is_external == 1) return;
        allSteps.push(Object.assign({}, s, { order:order, item:item }));
      });
    });
  });

  /* Filter by employee */
  function stepBelongsToEmp(s, empId) {
    if (!empId) return true;
    var id = parseInt(empId);
    /* assigned_employee_ids is JSON array */
    var ids = [];
    try { ids = typeof s.assigned_employee_ids === 'string' ? JSON.parse(s.assigned_employee_ids||'[]') : (s.assigned_employee_ids||[]); } catch(e){}
    ids = ids.map(function(x){ return parseInt(x); });
    if (ids.indexOf(id) >= 0) return true;
    if (parseInt(s.assigned_employee_id) === id) return true;
    return false;
  }

  var steps = allSteps.filter(function(s){
    if (isAdmin) {
      /* Admin: show all OR filtered by selected employee */
      return selEmpId ? stepBelongsToEmp(s, selEmpId) : true;
    } else {
      /* Non-admin: show only their own tasks */
      return myEmpId ? stepBelongsToEmp(s, myEmpId) : true;
    }
  });

  /* Operations tasks should also show in My Tasks */
  var targetEmpId = isAdmin ? (selEmpId ? parseInt(selEmpId, 10) : null) : myEmpId;
  function opsAssignedIds(task) {
    var ids = [];
    try { ids = typeof task.assigned_employee_ids === 'string' ? JSON.parse(task.assigned_employee_ids||'[]') : (task.assigned_employee_ids||[]); } catch(e){}
    ids = asArr(ids).map(function(x){ return parseInt(x, 10); }).filter(function(x){ return !isNaN(x) && x > 0; });
    if ((!ids || !ids.length) && task.assigned_employee_id) ids = [parseInt(task.assigned_employee_id, 10)];
    return ids;
  }
  var opsTasks = [];
  if (!props.externalOnly) {
    opsTasks = asArr(bs['ops-tasks']).filter(function(task){
      if (!task || isOpsTaskCompleted(task)) return false;
      var taskEmpIds = opsAssignedIds(task).map(function(x){ return String(x); });
      var taskCreatorId = String(task.created_by_user_id || '');
      var isMine = myEmpId ? (taskEmpIds.indexOf(String(myEmpId)) >= 0 || taskCreatorId === String(authUser.id || '')) : false;
      if (isAdmin) {
        if (!targetEmpId) return true;
        return taskEmpIds.indexOf(String(targetEmpId)) >= 0 || taskCreatorId === String(targetEmpId);
      }
      return isMine;
    });
  }

  var employeeById = {};
  var employeeByUserId = {};
  employees.forEach(function(e){
    employeeById[String(e.id)] = e;
    if (e.user_id != null && e.user_id !== '') employeeByUserId[String(e.user_id)] = e;
  });
  function employeeLabelById(empId) {
    var e = employeeById[String(empId || '')];
    return e ? ln(e, lang) : (lang === 'en' ? 'Unassigned' : 'غير مسند');
  }
  function parseEmpIds(v) {
    try {
      var arr = typeof v === 'string' ? JSON.parse(v || '[]') : (Array.isArray(v) ? v : []);
      return arr.map(function(x){ return parseInt(x, 10); }).filter(function(x){ return !isNaN(x) && x > 0; });
    } catch(e) { return []; }
  }
  function stepOwnerId(step) {
    if (isAdmin && !selEmpId) {
      var ids = parseEmpIds(step.assigned_employee_ids);
      if (step.assigned_employee_id) ids.unshift(parseInt(step.assigned_employee_id, 10));
      ids = ids.filter(function(x){ return !isNaN(x) && x > 0; });
      return ids.length ? ids[0] : null;
    }
    if (isAdmin && selEmpId) return parseInt(selEmpId, 10) || null;
    return myEmpId || null;
  }
  function opsOwnerId(task) {
    if (isAdmin && !selEmpId) {
      var aid = (opsAssignedIds(task)[0] || 0);
      if (aid > 0) return aid;
      var creatorEmp = employeeByUserId[String(task.created_by_user_id || '')];
      return creatorEmp ? parseInt(creatorEmp.id, 10) : null;
    }
    if (isAdmin && selEmpId) return parseInt(selEmpId, 10) || null;
    return myEmpId || null;
  }
  function groupKeyFor(ownerId) {
    return ownerId ? 'emp:' + ownerId : 'unassigned';
  }
  function groupLabelFor(ownerId) {
    return ownerId ? employeeLabelById(ownerId) : (lang === 'en' ? 'Unassigned' : 'غير مسند');
  }
  function ownerSortName(ownerId) {
    return (groupLabelFor(ownerId) || '').toString().toLowerCase();
  }
  function stepCardMeta(step) {
    return [
      step.order && step.order.order_number ? '#'+step.order.order_number : '',
      getCust(step.order, lang),
      step.item && ((lang==='en' && step.item.product_name_en) ? step.item.product_name_en : (step.item.product_name || '')),
      step.order && (step.order.delivery_planned_at || step.order.dispatch_due_at || step.order.delivery_date || '')
    ].filter(Boolean);
  }
  function opsCardMeta(task) {
    return [
      task.customer_company || task.customer_name || '',
      (lang==='en' && task.product_name_en) ? task.product_name_en : (task.product_name || ''),
      task.deadline || '',
      task.time || ''
    ].filter(Boolean);
  }
  function taskAccent(row) {
    if (row.kind === 'step') return row.raw.is_delivery == 1 ? '#16a34a' : T.accent;
    return '#d97706';
  }
  function taskKindLabel(row) {
    if (row.kind === 'step') return lang === 'en' ? 'Production step' : 'خطوة إنتاج';
    return lang === 'en' ? 'Operations task' : 'مهمة إدارية';
  }
  function taskTitle(row) {
    if (row.kind === 'step') return lnStep(row.raw, lang);
    return row.raw.title || row.raw.description || '—';
  }
  function taskSubtitle(row) {
    if (row.kind === 'step') {
      return row.raw.item && ((lang==='en' && row.raw.item.product_name_en) ? row.raw.item.product_name_en : (row.raw.item.product_name || ''));
    }
    return row.raw.description && row.raw.title ? row.raw.description : '';
  }
  function taskOpenLabel(row) {
    if (row.kind === 'step') return statusBadge(row.raw.status_slug, statuses, lang);
    return h(Badge,{label:lang==='en'?'Open':'مفتوحة', color:'orange'});
  }
  function taskAction(row) {
    if (row.kind === 'step') {
      return h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        row.raw.status_slug==='pending' && h(Btn,{size:'sm',variant:'primary',onClick:function(){startStep(row.raw.id, row.raw.order.id);}}, '▶ '+t('start')),
        row.raw.status_slug==='in_progress' && h(Btn,{size:'sm',variant:'success',onClick:function(){completeStep(row.raw.id, row.raw.order.id);}}, '✓ '+t('complete_step'))
      );
    }
    return h(Btn,{size:'sm',variant:'success',onClick:function(){
      apiFetch('ops-tasks/'+row.raw.id+'/complete',{method:'POST',keepalive:true})
        .then(props.onSilentReload||props.onReload);
    }}, '✓ '+(lang==='en'?'Done':'تم'));
  }
  function taskProgress(row) {
    if (row.kind === 'step') return timeBadge(row.raw);
    return row.raw.time ? h(Badge,{label:'⏱ '+row.raw.time,color:'gray'}) : null;
  }
  function taskDeadline(row) {
    if (row.kind === 'step') {
      var due = row.raw.order && (row.raw.order.delivery_planned_at || row.raw.order.dispatch_due_at || row.raw.order.delivery_date);
      return due ? h(Badge,{label:'🗓 '+fmtDateTime(due, lang), color:'blue'}) : null;
    }
    return row.raw.deadline ? h(Badge,{label:'🗓 '+fmtDateTime(row.raw.deadline, lang), color:'blue'}) : null;
  }
  var taskRows = [];
  steps.forEach(function(s){
    taskRows.push({ kind:'step', ownerId: stepOwnerId(s), raw:s, sortRank: s.status_slug === 'in_progress' ? 0 : 1, sortDate: s.started_at || s.planned_start_at || '', kindOrder: 0 });
  });
  opsTasks.forEach(function(task){
    taskRows.push({ kind:'ops', ownerId: opsOwnerId(task), raw:task, sortRank: 2, sortDate: task.deadline || task.created_at || '', kindOrder: 1 });
  });
  taskRows.sort(function(a,b){
    if (a.ownerId == null && b.ownerId != null) return 1;
    if (a.ownerId != null && b.ownerId == null) return -1;
    if ((a.ownerId || 0) !== (b.ownerId || 0)) return ownerSortName(a.ownerId).localeCompare(ownerSortName(b.ownerId));
    if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
    if (a.kindOrder !== b.kindOrder) return a.kindOrder - b.kindOrder;
    return String(a.sortDate || '').localeCompare(String(b.sortDate || ''));
  });
  var taskGroups = [];
  var grouped = {};
  taskRows.forEach(function(row){
    var key = groupKeyFor(row.ownerId);
    if (!grouped[key]) grouped[key] = { key:key, ownerId:row.ownerId, label:groupLabelFor(row.ownerId), rows:[] };
    grouped[key].rows.push(row);
  });
  Object.keys(grouped).forEach(function(k){ taskGroups.push(grouped[k]); });
  taskGroups.sort(function(a,b){
    if (a.ownerId == null && b.ownerId != null) return 1;
    if (a.ownerId != null && b.ownerId == null) return -1;
    return (a.label || '').localeCompare((b.label || ''), getLang() === 'ar' ? 'ar' : 'en');
  });

  var _dp2 = useState(null); var delayPrompt2 = _dp2[0], setDelayPrompt2 = _dp2[1];
  function startStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/start',{method:'POST', keepalive:true}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }
  function completeStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/advance',{method:'POST', keepalive:true}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }

  /* Time performance badge */
  function timeBadge(r) {
    if (r.status_slug !== 'in_progress' && r.status_slug !== 'done') return h('span',{style:{color:T.textMute}},'—');
    if (!r.started_at) return h('span',{style:{color:T.textMute}},'—');
    var exp = (parseFloat(r.expected_hours)||0) * 60;
    if (exp <= 0) return h('span',{style:{color:T.textMute}},'—');
    var endMs = isOpsTaskCompleted(r) ? new Date(r.completed_at) : new Date();
    var actual = (endMs - new Date(r.started_at)) / 60000;
    var diff = actual - exp;
    if (diff < -2)  return h(Badge,{label:'âœ… '+(lang==='en'?'Ahead':t('ahead'))+' '+Math.abs(Math.round(diff))+'m', color:'green'});
    if (diff < 5)   return h(Badge,{label:'âœ… '+(lang==='en'?'On Time':t('on_time')), color:'green'});
    return h(Badge,{label:'⚠️ '+(lang==='en'?'Late':t('late'))+' +'+Math.round(diff)+'m', color:'red'});
  }

  var filterBar = isAdmin && h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 16px', background:T.bgSub, borderRadius:T.radius, border:'1px solid '+T.border } },
    h('span',{style:{fontSize:13,color:T.textMute,fontWeight:600}}, lang==='en'?'Filter by employee:':'فلتر حسب الموظف:'),
    h('select', { value:selEmpId, onChange:function(e){ setSelEmpId(e.target.value); },
      style:{ padding:'6px 10px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13, minWidth:160 }
    },
      h('option',{value:''}, lang==='en'?'All employees':'كل الموظفين'),
      employees.map(function(e){ return h('option',{key:e.id, value:String(e.id)}, ln(e,lang)); })
    ),
    selEmpId && h('button',{onClick:function(){setSelEmpId('');}, style:{padding:'5px 10px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.textMute,cursor:'pointer',fontSize:12}},'âœ•')
  );

  useTopbar(t('n_tasks',taskRows.length), null);
  var showEmptyTasks = taskRows.length === 0;
  function cardField(label, value, icon, color) {
    if (!value) return null;
    return h('div',{style:{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',border:'1px solid '+T.border,borderRadius:999,background:T.bgSub,fontSize:11,color:T.textMid}},
      icon ? h('span',{style:{fontSize:12,lineHeight:1,color:color || T.accent}},icon) : null,
      h('span',null,label ? (label+': ') : '',value)
    );
  }
  function taskCard(row) {
    var ownerLabel = groupLabelFor(row.ownerId);
    var accent = taskAccent(row);
    return h(Card,{
      key: (row.kind || 'task')+'-'+(row.raw.id || row.raw.task_no || row.raw.step_no || Math.random()),
      style:{
        borderTop:'3px solid '+accent,
        padding:'14px 14px 12px',
        boxShadow:'0 4px 18px rgba(15,23,42,0.04)',
        background:'linear-gradient(180deg, '+T.bg+' 0%, '+T.bgSub+' 100%)'
      }
    },
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}},
        h('div',{style:{minWidth:0,flex:1}},
          h('div',{style:{display:'flex',flexWrap:'wrap',alignItems:'center',gap:6,marginBottom:6}},
            h(Badge,{label:taskKindLabel(row),color:row.kind === 'step' ? 'blue' : 'orange'}),
            h(Badge,{label:ownerLabel, color: ownerLabel === (lang==='en' ? 'Unassigned' : 'غير مسند') ? 'gray' : 'purple'})
          ),
          h('div',{style:{fontWeight:700,fontSize:14,color:T.text,lineHeight:1.35,overflow:'hidden',textOverflow:'ellipsis'}}, taskTitle(row)),
          taskSubtitle(row) && h('div',{style:{marginTop:4,fontSize:12,color:T.textMid,lineHeight:1.5}}, taskSubtitle(row))
        ),
        h('div',{style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}},
          h('div',{style:{fontSize:12,fontWeight:700,color:accent}}, row.kind === 'step' ? ('#'+(row.raw.order && row.raw.order.order_number ? row.raw.order.order_number : row.raw.id)) : ('#'+(row.raw.task_no || row.raw.id))),
          taskOpenLabel(row)
        )
      ),
      h('div',{style:{display:'flex',flexWrap:'wrap',gap:6,margin:'8px 0 10px'}},
        row.kind === 'step' && cardField(lang==='en' ? 'Order' : 'الطلب', row.raw.order && row.raw.order.order_number ? '#'+row.raw.order.order_number : null, '№', accent),
        row.kind === 'step' && cardField(lang==='en' ? 'Customer' : 'الزبون', getCust(row.raw.order, lang), '👤', T.accent),
        row.kind === 'step' && cardField(lang==='en' ? 'Product' : 'المنتج', row.raw.item ? ((lang==='en' && row.raw.item.product_name_en) ? row.raw.item.product_name_en : (row.raw.item.product_name || '')) : '', '📦', '#2563eb'),
        row.kind === 'step' && cardField(lang==='en' ? 'Step' : 'الخطوة', lnStep(row.raw, lang), '⚙', '#0f766e'),
        row.kind === 'step' && cardField(lang==='en' ? 'Expected' : 'المتوقع', fmtH(row.raw.expected_hours), '⏱', '#7c3aed'),
        row.kind === 'step' && cardField(lang==='en' ? 'Actual' : 'الفعلي', row.raw.actual_duration_minutes != null ? fmtMin(row.raw.actual_duration_minutes) : null, '▶', '#dc2626'),
        row.kind === 'step' && cardField(lang==='en' ? 'Deadline' : 'الموعد', fmtDateTime(row.raw.order && (row.raw.order.delivery_planned_at || row.raw.order.dispatch_due_at || row.raw.order.delivery_date), lang), '🗓', '#2563eb'),
        row.kind === 'ops' && cardField(lang==='en' ? 'Task No' : 'رقم المهمة', '#'+(row.raw.task_no || row.raw.id), '№', accent),
        row.kind === 'ops' && cardField(lang==='en' ? 'Customer' : 'الزبون', row.raw.customer_company || row.raw.customer_name || null, '👤', T.accent),
        row.kind === 'ops' && cardField(lang==='en' ? 'Product' : 'المنتج', (lang==='en' && row.raw.product_name_en) ? row.raw.product_name_en : (row.raw.product_name || null), '📦', '#2563eb'),
        row.kind === 'ops' && cardField(lang==='en' ? 'Assigned' : 'المسند', row.raw.assigned_employee_name || ownerLabel, '👥', '#7c3aed'),
        row.kind === 'ops' && cardField(lang==='en' ? 'Deadline' : 'الموعد', row.raw.deadline ? fmtDateTime(row.raw.deadline, lang) : null, '🗓', '#2563eb'),
        row.kind === 'ops' && cardField(lang==='en' ? 'Estimate' : 'التقدير', row.raw.time || null, '⏱', '#dc2626')
      ),
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:6}},
        h('div',{style:{display:'flex',flexWrap:'wrap',gap:8}}, taskProgress(row)),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}, taskAction(row))
      )
    );
  }
  function employeeBucket(group) {
    var stepCount = group.rows.filter(function(r){ return r.kind === 'step'; }).length;
    var opsCount = group.rows.filter(function(r){ return r.kind === 'ops'; }).length;
    return h(Card,{
      key:'grp-'+group.key,
      style:{
        marginBottom:14,
        padding:14,
        border:'1px solid '+T.border,
        borderLeft:'4px solid '+(group.ownerId ? T.accent : '#f59e0b'),
        background:'linear-gradient(180deg, '+T.bg+' 0%, '+T.bgSub+' 100%)'
      }
    },
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}},
          h('div',{style:{fontWeight:800,fontSize:15,color:T.text}}, group.label || (lang === 'en' ? 'Unassigned' : 'غير مسند')),
          h(Badge,{label:(stepCount + opsCount)+' '+(lang === 'en' ? 'tasks' : 'مهمة'), color:'purple'}),
          stepCount > 0 && h(Badge,{label:stepCount+' '+(lang==='en'?'production':'إنتاج'), color:'blue'}),
          opsCount > 0 && h(Badge,{label:opsCount+' '+(lang==='en'?'operations':'عمليات'), color:'orange'})
        ),
        h('div',{style:{fontSize:12,color:T.textMute}}, lang==='en' ? 'Current employee bucket' : 'مجموعة الموظف الحالية')
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:10}},
        group.rows.map(function(row){ return taskCard(row); })
      )
    );
  }
  return h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
     filterBar,
     showEmptyTasks
       ? h(Card,{style:{padding:24,textAlign:'center',border:'1px dashed '+T.border,background:T.bgSub}},
           h('div',{style:{fontSize:22,fontWeight:700,marginBottom:6,color:T.text}}, lang==='en' ? 'No tasks available' : 'لا توجد مهام'),
           h('div',{style:{color:T.textMute,fontSize:13}}, lang==='en' ? 'Tasks will appear here once they are assigned or created.' : 'ستظهر المهام هنا عند إسنادها أو إنشائها.')
         )
       : taskGroups.map(function(group){ return employeeBucket(group); }),
      delayPrompt2 && h(Modal,{
        title:'⚠️ '+(lang==='en'?'Delay Reason Required':'Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ± Ù…Ø·Ù„ÙˆØ¨'), onClose:function(){setDelayPrompt2(null);}, width:460,
        footer:h('div',{style:{display:'flex',gap:8}},
          h(Btn,{variant:'secondary',onClick:function(){setDelayPrompt2(null);}},lang==='en'?'Skip':'ØªØ®Ø·ÙŠ'),
         h(Btn,{variant:'primary',onClick:function(){
           if(!delayPrompt2.reason.trim())return;
          apiFetch('orders/'+delayPrompt2.orderId+'/delay',{method:'POST',body:JSON.stringify({reason:delayPrompt2.reason})}).then(function(){setDelayPrompt2(null);(props.onSilentReload||props.onReload)();});
        }},lang==='en'?'Save':'Ø­ÙØ¸'))
    },
      h('p',{style:{color:T.textMid,marginBottom:12}},lang==='en'?'The deadline has passed. Please enter a reason for the delay:':'ÙØ§Øª Ø§Ù„Ù€ Deadline â€” ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ±:'),
      h('textarea',{value:delayPrompt2.reason,onChange:function(e){setDelayPrompt2(function(d){return Object.assign({},d,{reason:e.target.value});});},rows:4,style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,boxSizing:'border-box'}})
    )
  );
}

/* â•â•â• SUPPLIERS â€” Ù…Ø¬Ù‡Ø²ÙˆÙ† Ø®Ø§Ø±Ø¬ÙŠÙˆÙ† â•â•â• */
function SuppliersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _q = useState(''); var q = _q[0], setQ = _q[1];
  var _page = useState(1); var page = _page[0], setPage = _page[1];
  var _perPage = useState(25); var perPage = _perPage[0], setPerPage = _perPage[1];
  var crud = useCRUD('suppliers', { paginated:true, page:page, perPage:perPage, q:q });
  var blank = {name:'',name_en:'',phone:'',phone_alt:'',workday_start:'09:00',workday_end:'17:00',working_days:[0,1,2,3,4,5,6],holidays:[],map_url:'',notes:'',is_active:1};
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  useEffect(function(){ setPage(1); }, [q, perPage]);

  useTopbar(lang==='en'?'Suppliers':'المجهزون', h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+(lang==='en'?'Add':'إضافة')));

  function save() {
    var payload = Object.assign({}, form, {
      working_days: parseJsonArraySafe(form.working_days, [0,1,2,3,4,5,6]).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); }).sort(),
      holidays: normalizeHolidayList(form.holidays)
    });
    var p = form.id ? crud.update(form.id, payload) : crud.create(payload);
    p.then(function(){ setForm(null); if (props.onReload) props.onReload(); });
  }

  function setField(field) {
    return function(v){ setForm(function(f){ var u={}; u[field]=v; return Object.assign({},f,u); }); };
  }

  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(Card,{style:{padding:10,marginBottom:10}},
      h('div',{style:{display:'grid',gridTemplateColumns:'2fr 120px',gap:10,alignItems:'end'}},
        h(Input,{
          label:lang==='en'?'Search':'بحث',
          value:q,
          placeholder:lang==='en'?'Search supplier, phone...':'ابحث باسم المجهز أو الهاتف...',
          onChange:setQ
        }),
        h(Select,{
          label:lang==='en'?'Per page':'لكل صفحة',
          value:String(perPage),
          onChange:function(v){ setPerPage(parseInt(v,10)||25); },
          options:[{value:'10',label:'10'},{value:'25',label:'25'},{value:'50',label:'50'},{value:'100',label:'100'}]
        })
      )
    ),
    h(DataTable, {
      columns:[
        {key:'name', label:lang==='en'?'Name':'الاسم', render:function(r){
          return h('div',null,
            h('div',{style:{fontWeight:600}}, lang==='en'&&r.name_en ? r.name_en : r.name),
            r.name_en && lang==='ar' && h('div',{style:{fontSize:11,color:T.textMute}}, r.name_en)
          );
        }},
        {key:'phone', label:lang==='en'?'Phone':'الهاتف', render:function(r){
          return h('div',null,
            r.phone && h('a',{href:'tel:'+r.phone,style:{color:T.accent,fontSize:13,textDecoration:'none',display:'block'}}, 'ðŸ“ž '+r.phone),
            r.phone_alt && h('a',{href:'tel:'+r.phone_alt,style:{color:T.textMid,fontSize:12,textDecoration:'none',display:'block',marginTop:2}}, r.phone_alt)
          );
        }},
        {key:'map_url', label:lang==='en'?'Map':'الخريطة', render:function(r){
          return r.map_url
            ? h('a',{href:r.map_url,target:'_blank',rel:'noopener noreferrer',style:{color:T.accent,fontSize:12,textDecoration:'none'}}, '📍 '+(lang==='en'?'Open Map':'فتح الخريطة'))
            : h('span',{style:{color:T.border}}, '—');
        }},
        {key:'notes', label:lang==='en'?'Notes':'ملاحظات', render:function(r){
          return r.notes ? h('span',{style:{fontSize:12,color:T.textMid}}, r.notes) : '—';
        }},
        {key:'is_active', label:lang==='en'?'Status':'الحالة', render:function(r){
          return h(Badge,{label:r.is_active==1?(lang==='en'?'Active':'نشط'):(lang==='en'?'Inactive':'موقوف'),color:r.is_active==1?'green':'gray'});
        }},
        {key:'workday', label:lang==='en'?'Working Hours':'ساعات الدوام', render:function(r){
          var start = r.workday_start || '09:00';
          var end = r.workday_end || '17:00';
          return h('span',{style:{fontSize:12,color:T.textMid,fontWeight:600}}, start+' - '+end);
        }},
        {key:'working_days', label:lang==='en'?'Working Days':'أيام العمل', render:function(r){
          var days = parseJsonArraySafe(r.working_days, [0,1,2,3,4,5,6]);
          var names = lang==='en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
          return h('span',{style:{fontSize:12,color:T.textMid}}, days.map(function(d){ return names[parseInt(d,10)] || d; }).join('، '));
        }},
        {key:'holidays', label:lang==='en'?'Holidays':'العطل', render:function(r){
          var holidays = parseJsonArraySafe(r.holidays, []);
          return holidays.length ? h('span',{style:{fontSize:12,color:T.textMid}}, holidays.join('، ')) : '—';
        }},
      ],
      rows: crud.items,
      onEdit: function(r){ setForm(Object.assign({},blank,r,{working_days:parseJsonArraySafe(r.working_days,[0,1,2,3,4,5,6]),holidays:parseJsonArraySafe(r.holidays,[])})); },
      onDelete: function(r){ crud.remove(r.id); }
    }),
    h(PagerControls,{
      page:crud.meta.page,
      totalPages:crud.meta.total_pages,
      total:crud.meta.total,
      onPageChange:setPage,
      lang:lang
    }),
    form && h(Modal, {
      title: form.id ? (lang==='en'?'Edit Supplier':'تعديل مجهز') : (lang==='en'?'Add Supplier':'إضافة مجهز'),
      onClose: function(){ setForm(null); }, width:560,
      footer: h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}}, t('cancel')),
        h(Btn,{onClick:save}, t('save'))
      )
    },
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}},
        h(Input,{label:(lang==='en'?'Name':'الاسم')+' (AR)',value:form.name,onChange:setField('name')}),
        h(Input,{label:(lang==='en'?'Name':'الاسم')+' (EN)',value:form.name_en,onChange:setField('name_en')})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}},
        h(Input,{label:lang==='en'?'Phone':'الهاتف الرئيسي',value:form.phone,onChange:setField('phone')}),
        h(Input,{label:lang==='en'?'Alt Phone':'هاتف بديل',value:form.phone_alt,onChange:setField('phone_alt')})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}},
        h(Input,{label:lang==='en'?'Workday Start':'بداية الدوام',type:'time',value:form.workday_start||'09:00',onChange:setField('workday_start')}),
        h(Input,{label:lang==='en'?'Workday End':'نهاية الدوام',type:'time',value:form.workday_end||'17:00',onChange:setField('workday_end')})
      ),
      h(SupplierWorkingDaysField,{
        label:lang==='en'?'Working Days':'أيام العمل',
        hint:lang==='en'?'External timing skips unchecked days.':'أي يوم غير محدد هنا لن يدخل في حساب وقت المجهز.',
        lang:lang,
        value:form.working_days,
        onChange:setField('working_days')
      }),
      h('div',{style:{marginTop:12,marginBottom:12}},
        h(HolidayManagerField,{
          lang:lang,
          value:form.holidays || [],
          onChange:setField('holidays'),
          label:lang==='en'?'Holidays':'العطل',
          hint:lang==='en'?'Manage supplier holidays with add, edit, and delete actions.':'إدارة عطل المجهز بالإضافة والتعديل والحذف.'
        })
      ),
      h('div',{style:{fontSize:11,color:T.textMute,marginTop:-2,marginBottom:12}},
        lang==='en'
          ? 'External promised/actual hours are calculated only inside supplier working hours, working days, and excluding holidays.'
          : 'يتم احتساب الوقت الموعود والفعلي للمجهز فقط ضمن ساعات الدوام وأيام العمل المحددة مع استثناء العطل.'
      ),
      h(Input,{label:lang==='en'?'Google Maps URL':'رابط Google Maps',value:form.map_url,onChange:setField('map_url')}),
      h('div',{style:{marginTop:12,marginBottom:12}},
        h('textarea',{
          placeholder:lang==='en'?'Notes...':'ملاحظات...',
          value:form.notes||'',
          onChange:function(e){setField('notes')(e.target.value);},
          rows:3,
          style:{width:'100%',padding:'9px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bgSub,color:T.text,fontSize:13,resize:'vertical',outline:'none',boxSizing:'border-box'}
        })
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}},
        h('input',{type:'checkbox',checked:form.is_active==1,
          onChange:function(e){setField('is_active')(e.target.checked?1:0);},
          style:{accentColor:T.accent}
        }),
        lang==='en'?'Active':'نشط'
      )
    )
  );
}

function StepsDirectoryView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var suppliers = asArr(bs.suppliers);
  var crud = useCRUD('step-library');
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var blank = {step_name:'',step_name_en:'',default_employee_ids:[],default_team_id:'',show_in_prds:1,is_external:0,is_delivery:0,step_type:'internal',sort_order:0,supplier_id:'',scales_with_qty:1,qty_per_unit:1,delivery_direction:'delivered_to_client'};

  function fmtMin(m) {
    if (!m || m==0) return '—';
    var mins = parseInt(m);
    if (mins < 60) return mins+' '+t('minutes');
    var h = Math.floor(mins/60); var rem = mins%60;
    return h+'h'+(rem?(' '+rem+'m'):'');
  }

    function save() {
      var payload = Object.assign({},form);
      var stepType = payload.step_type || stepTypeOf(payload);
      if (stepType === 'internal') {
        payload.scales_with_qty = payload.scales_with_qty === 0 || payload.scales_with_qty === '0' ? 0 : 1;
        payload.qty_per_unit = Math.max(1, parseInt(payload.qty_per_unit,10)||1);
      } else {
        payload.scales_with_qty = 0;
        payload.qty_per_unit = 1;
      }
      if (stepType === 'delivery') payload.delivery_direction = payload.delivery_direction || 'delivered_to_client';
      else payload.delivery_direction = '';
      // âœ… FIX: robust unwrap of employee IDs regardless of nesting level
      function unwrapEmpIds(raw) {
      if (!raw) return [];
      var decoded = raw;
      for (var i = 0; i < 10; i++) {
        if (typeof decoded !== 'string') break;
        try { decoded = JSON.parse(decoded); } catch(e) { break; }
      }
      if (!Array.isArray(decoded)) return [];
      var flat = [];
      function extract(v) {
        if (Array.isArray(v)) { v.forEach(extract); }
        else if (typeof v === 'string') {
          try { extract(JSON.parse(v)); } catch(e) { if (v && v !== 'null') flat.push(v); }
        } else if (v !== null && v !== undefined) { flat.push(String(v)); }
      }
      decoded.forEach(extract);
      return flat;
    }
    payload.default_employee_ids = unwrapEmpIds(payload.default_employee_ids);
    var p = payload.id ? crud.update(payload.id, payload) : crud.create(payload);
    p.then(function(){ setForm(null); if(props.onReload) props.onReload(); });
  }

  useTopbar(t('step_library'), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'step_name',label:t('step_name'),render:function(r){ return h('div',null,h('div',{style:{fontWeight:600}},lnStep(r,lang)),r.step_name_en&&lang==='ar'&&h('div',{style:{fontSize:11,color:T.textMute}},r.step_name_en)); }},
        {key:'default_employee_ids',label:t('employee'),render:function(r){ var ids=Array.isArray(r.default_employee_ids)?r.default_employee_ids:(r.default_employee_ids?JSON.parse(r.default_employee_ids||'[]'):[]); if(!ids.length) return '—'; return h('div',{style:{display:'flex',flexWrap:'wrap',gap:4}},ids.map(function(id){ var e=findBy(employees,'id',id); return e?h('span',{key:id,style:{fontSize:11,background:T.accentDim,color:T.accent,borderRadius:4,padding:'1px 6px'}},ln(e,lang)):null; })); }},
        {key:'show_in_prds',label:'KDS',render:function(r){ return h(Badge,{label:r.show_in_prds==1?t('yes'):t('no'),color:r.show_in_prds==1?'green':'gray'}); }},
        {key:'is_external',label:t('external_task'),render:function(r){ return r.is_external==1?h(Badge,{label:t('yes'),color:'amber'}):'—'; }},
        {key:'is_delivery',label:t('is_delivery'),render:function(r){ return r.is_delivery==1?h(Badge,{label:'🚚',color:'blue'}):'—'; }},
      ],
      rows:crud.items,
      onEdit:function(r){
        function unwrapEmpIds(raw) {
          if (!raw) return [];
          var decoded = raw;
          for (var i = 0; i < 10; i++) {
            if (typeof decoded !== 'string') break;
            try { decoded = JSON.parse(decoded); } catch(e) { break; }
          }
          if (!Array.isArray(decoded)) return [];
          var flat = [];
          function extract(v) {
            if (Array.isArray(v)) { v.forEach(extract); }
            else if (typeof v === 'string') {
              try { extract(JSON.parse(v)); } catch(e) { if (v && v !== 'null') flat.push(v); }
            } else if (v !== null && v !== undefined) { flat.push(String(v)); }
          }
          decoded.forEach(extract);
          return flat;
        }
        var empIds = unwrapEmpIds(r.default_employee_ids);
          setForm(Object.assign({},blank,r,{step_type:stepTypeOf(r),default_employee_ids:empIds,scales_with_qty:(r.scales_with_qty == null ? 1 : parseInt(r.scales_with_qty,10)||0),qty_per_unit:(r.qty_per_unit == null ? 1 : parseInt(r.qty_per_unit,10)||1),delivery_direction:r.delivery_direction||'delivered_to_client'}));
      },
      onDelete:function(r){ crud.remove(r.id).then(function(){ if(props.onReload) props.onReload(); }); }
    }),
    form && h(Modal,{title:form.id?t('edit'):t('add')+' '+t('step'),onClose:function(){setForm(null);},width:660,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      /* Row 1: bilingual name */
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('step_name')+' (AR)',value:form.step_name,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});}}),
        h(Input,{label:t('step_name')+' (EN)',value:form.step_name_en,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_name_en:v});})}})
      ),
      h(Select,{label:(lang==='en'?'Step Type':'نوع الخطوة'),value:form.step_type||stepTypeOf(form),onChange:function(v){setForm(function(f){ var next = applyStepType(f,v); if (v === 'delivery') { var _get = function(teamId){ if (!teamId) return []; return employees.filter(function(e){ return String(e.team_id)===String(teamId); }).map(function(e){ return String(e.id); }); }; var ds = askDeliverySetup({lang:lang,currentDirection:next.delivery_direction,teamId:next.default_team_id,getTeamEmployeeIds:_get,employees:employees}); next.delivery_direction = ds.direction; if (ds.employeeId) next.default_employee_ids = [String(ds.employeeId)]; } return next; });},options:[
        {value:'internal',label:(lang==='en'?'Internal Production':'إنتاج داخلي')},
        {value:'external',label:(lang==='en'?'External Supplier':'مجهز خارجي')},
        {value:'delivery',label:(lang==='en'?'Delivery':'توصيل')}
      ]}),
      ((form.step_type||stepTypeOf(form))==='internal') && h('div',{style:{display:'flex',alignItems:'center',gap:8,marginTop:8,marginBottom:6,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},
          h('input',{type:'checkbox',checked:form.scales_with_qty!=0,onChange:function(e){setForm(function(f){return Object.assign({},f,{scales_with_qty:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
          t('scales_with_qty')
        ),
        h('span',{style:{fontSize:11,color:T.textMute}},lang==='en'?'Time changes when quantity changes.':'الوقت يتغير عند زيادة أو نقصان الكمية.')
      ),
      ((form.step_type||stepTypeOf(form))==='delivery') && h('div',{style:{marginTop:8,marginBottom:10}},
        h(Select,{
          label:(lang==='en'?'Delivery confirmation':'تأكيد التوصيل'),
          value:form.delivery_direction || 'delivered_to_client',
          onChange:function(v){setForm(function(f){return Object.assign({},f,{delivery_direction:v});});},
          options:[
            {value:'delivered_to_client',label:(lang==='en'?'Delivered to client':'تسليم للزبون')},
            {value:'received_by_client',label:(lang==='en'?'Received by client':'استلام من الزبون')}
          ]
        })
      ),
      ((form.step_type||stepTypeOf(form))==='internal') && h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13,marginTop:8,marginBottom:6}},
        h('input',{type:'checkbox',checked:form.scales_with_qty!=0,onChange:function(e){setForm(function(f){return Object.assign({},f,{scales_with_qty:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
        t('scales_with_qty')
      ),
      ((form.step_type||stepTypeOf(form))==='delivery') && h(Select,{label:(lang==='en'?'Delivery confirmation':'تأكيد التوصيل'),value:form.delivery_direction||'delivered_to_client',onChange:function(v){setForm(function(f){return Object.assign({},f,{delivery_direction:v});});},options:[
        {value:'delivered_to_client',label:(lang==='en'?'Delivered to client':'تسليم للزبون')},
        {value:'received_by_client',label:(lang==='en'?'Received by client':'استلام من الزبون')}
      ]}),
      /* Row 2: team + multiselect side by side */
      h('div',{style:{display:'grid',gridTemplateColumns:((form.step_type||stepTypeOf(form))==='external'?'1fr':'1fr 2fr'),gap:12,marginTop:10}},
        ((form.step_type||stepTypeOf(form))!=='external') && h(Select,{label:(form.step_type||stepTypeOf(form))==='delivery'?(lang==='en'?'Delivery Team':'فريق التوصيل'):t('team'),value:String(form.default_team_id||''),
          onChange:function(v){
            setForm(function(f){
              var teamEmps = v ? employees.filter(function(e){ return String(e.team_id)===String(v); }).map(function(e){ return String(e.id); }) : f.default_employee_ids;
              return Object.assign({},f,{default_team_id:v, default_employee_ids: v && teamEmps.length ? teamEmps : f.default_employee_ids});
            });
          },
          options:teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
        }),
        ((form.step_type||stepTypeOf(form))!=='external') && h(MultiSelect,{label:t('employees'),
          values:Array.isArray(form.default_employee_ids)?form.default_employee_ids:(form.default_employee_ids?[String(form.default_employee_ids)]:[]),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{default_employee_ids:v});});},
          options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
        }),
        ((form.step_type||stepTypeOf(form))==='external') && h('div',{style:{paddingTop:4}},
          h('div',{style:{fontSize:12,fontWeight:700,color:T.accent,marginBottom:8}},'🏭 '+(lang==='en'?'Supplier-linked step':'خطوة مرتبطة بمجهز')),
          h('div',{style:{fontSize:12,color:T.textMute,lineHeight:1.8}},lang==='en'?'This step is tracked by supplier send/promise/receive times instead of internal production staffing.':'تُدار هذه الخطوة بأوقات الإرسال والوعد والاستلام الخاصة بالمجهز بدل التعيين الداخلي للكادر.')
        )
      ),
      /* Row 3: checkboxes */
      h('div',{style:{display:'flex',gap:24,marginTop:14,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
        ((form.step_type||stepTypeOf(form))==='external') && h('span',{style:{fontSize:13,color:T.accent,fontWeight:600}},'🏭 '+(lang==='en'?'External supplier timing':'توقيت مجهز خارجي')),
        ((form.step_type||stepTypeOf(form))==='delivery') && h('span',{style:{fontSize:13,color:'#f59e0b',fontWeight:600}},'🚚 '+(lang==='en'?'Delivery timing':'توقيت توصيل'))
      ),
      /* Row 4: supplier (only when is_external) */
      (form.step_type||stepTypeOf(form))==='external' && suppliers.length > 0 && h('div',{style:{marginTop:12}},
        h(Select,{
          label:'🏭 '+(lang==='en'?'External Supplier (optional)':'المجهز الخارجي (اختياري)'),
          value:String(form.supplier_id||''),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
          options:[{value:'',label:lang==='en'?'— None —':'— بدون مجهز —'}].concat(
            suppliers.map(function(s){ return {value:String(s.id), label:ln(s,lang)+(s.phone?' · '+s.phone:'') }; })
          )
        })
      )
    )
  );
}

function NotificationsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('notifications');
  var _f = useState({title:'',body:'',type:'info',scope:'me',department_id:'',team_id:''}); var form = _f[0], setForm = _f[1];
  var _perm = useState((typeof Notification!=='undefined' ? Notification.permission : 'unsupported')); var notifPerm = _perm[0], setNotifPerm = _perm[1];
  var _tone = useState(getNewOrderTonePref()); var newOrderTone = _tone[0], setNewOrderTone = _tone[1];
  var _custom = useState(getNewOrderCustomToneUrl()); var customUrl = _custom[0], setCustomUrl = _custom[1];
  var authUser = props && props.authUser ? props.authUser : null;
  var isAdmin = !!(authUser && authUser.role === 'admin');
  var bs = props && props.bootstrap ? props.bootstrap : {};
  var departments = asArr(bs.departments);
  var teams = asArr(bs.teams);
  var unread = asArr(crud.items).filter(function(n){return !n.is_read;}).length;
  useTopbar(unread+' '+(lang==='en'?'Unread':'غير مقروء'), null);
  function refreshPerm() {
    try { setNotifPerm(typeof Notification!=='undefined' ? Notification.permission : 'unsupported'); } catch(_e0) {}
  }
  useEffect(function(){ refreshPerm(); }, []);
  useEffect(function(){ setNewOrderTonePref(newOrderTone); }, [newOrderTone]);
  useEffect(function(){ setNewOrderCustomToneUrl(customUrl); }, [customUrl]);
  function enableNotifications() {
    try {
      if (typeof Notification === 'undefined') {
        alert(lang==='en' ? 'This browser does not support notifications.' : 'هذا المتصفح لا يدعم الإشعارات.');
        return;
      }
      Notification.requestPermission().then(function(p){
        setNotifPerm(p);
        if (p === 'granted') {
          try { new Notification(lang==='en' ? 'Notifications Enabled' : 'تم تفعيل الإشعارات', { body: lang==='en' ? 'System notifications are now active.' : 'إشعارات النظام أصبحت مفعلة.', silent:false }); } catch(_e1) {}
        } else {
          alert(lang==='en' ? 'Please allow notifications from browser settings.' : 'يرجى السماح بالإشعارات من إعدادات المتصفح.');
        }
      });
    } catch(_e2) {}
  }
  function send() {
    if (!form.title) return;
    var payload = { title: form.title, body: form.body, type: form.type };
    if (isAdmin) {
      payload.scope = form.scope || 'me';
      if (payload.scope === 'department') payload.department_id = form.department_id ? parseInt(form.department_id, 10) : 0;
      if (payload.scope === 'team') payload.team_id = form.team_id ? parseInt(form.team_id, 10) : 0;
    }
    crud.create(payload).then(function(){ setForm({title:'',body:'',type:'info',scope:'me',department_id:'',team_id:''}); });
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(form.title, {body:form.body});
  }
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(Card, { style:{ padding:'20px 24px', marginBottom:20 } },
      h('div', { style:{ fontWeight:700, color:T.text, marginBottom:14 } }, t('send_notification')),
      h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10, padding:'8px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:T.bgSub } },
        h('div', { style:{ fontSize:12, color:T.textMid } },
          (lang==='en' ? 'Browser notifications status: ' : 'حالة إشعارات المتصفح: '),
          h('b', { style:{ color:(notifPerm==='granted'?T.green:(notifPerm==='denied'?T.red:T.text)) } },
            notifPerm === 'granted' ? (lang==='en'?'Allowed':'مسموح')
            : notifPerm === 'denied' ? (lang==='en'?'Blocked':'محظور')
            : notifPerm === 'default' ? (lang==='en'?'Ask':'يطلب إذن')
            : (lang==='en'?'Unsupported':'غير مدعوم')
          )
        ),
        h('div', { style:{ display:'flex', gap:8 } },
          h(Btn, { variant:'secondary', onClick:refreshPerm }, lang==='en'?'Refresh':'تحديث'),
          h(Btn, { onClick:enableNotifications }, lang==='en'?'Enable Notifications':'تفعيل الإشعارات')
        )
      ),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12, marginBottom:10 } },
        h(Select, {
          label: (lang==='en' ? 'New order sound' : 'صوت الطلب الجديد'),
          value: newOrderTone,
          onChange: function(v){ setNewOrderTone(v || 'classic'); },
          options: [
            { value:'classic', label:(lang==='en' ? 'Classic (Default)' : 'كلاسيك (افتراضي)') },
            { value:'school', label:(lang==='en' ? 'School Bell (Old)' : 'جرس مدرسة (قديم)') },
            { value:'soft', label:(lang==='en' ? 'Soft' : 'هادئ') },
            { value:'cafe', label:(lang==='en' ? 'Cafe Bell (Loud)' : 'جرس مقهى (عالي)') },
            { value:'custom', label:(lang==='en' ? 'Custom URL' : 'رابط صوت مخصص') },
            { value:'off', label:(lang==='en' ? 'Off' : 'إيقاف') }
          ]
        }),
        h('div', { style:{ display:'flex', alignItems:'end' } },
          h(Btn, { variant:'secondary', onClick:function(){ playNewOrderToneByPref(); } }, (lang==='en' ? 'Test Sound' : 'تجربة الصوت'))
        )
      ),
      (newOrderTone === 'custom') && h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12, marginBottom:10 } },
        h(Input, {
          label: (lang==='en' ? 'Custom sound URL' : 'رابط الصوت المخصص'),
          value: customUrl,
          onChange: function(v){ setCustomUrl(v || ''); }
        }),
        h('div', { style:{ display:'flex', alignItems:'end' } },
          h(Btn, { variant:'secondary', onClick:function(){ playCustomAudioUrl(getNewOrderCustomToneUrl()); } }, (lang==='en' ? 'Test URL' : 'تجربة الرابط'))
        )
      ),
      isAdmin && h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12, marginBottom:10 } },
        h(Select, {
          label: (lang==='en' ? 'Send notification to' : 'إرسال الإشعار إلى'),
          value: form.scope || 'me',
          onChange: function(v){ setForm(function(f){ return Object.assign({}, f, { scope: v || 'me' }); }); },
          options: [
            { value:'me', label:(lang==='en' ? 'Only me' : 'فقط أنا') },
            { value:'broadcast', label:(lang==='en' ? 'Everyone' : 'الكل') },
            { value:'department', label:(lang==='en' ? 'A department' : 'قسم محدد') },
            { value:'team', label:(lang==='en' ? 'A team' : 'فريق محدد') },
          ]
        }),
        h('div', { style:{ display:'flex', alignItems:'end', color:T.textMute, fontSize:12 } },
          (lang==='en' ? 'Default is personal.' : 'الافتراضي إشعار شخصي.')
        )
      ),
      isAdmin && (form.scope === 'department') && h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12, marginBottom:10 } },
        h(Select, {
          label: (lang==='en' ? 'Department' : 'القسم'),
          value: form.department_id || '',
          onChange: function(v){ setForm(function(f){ return Object.assign({}, f, { department_id: v || '' }); }); },
          options: [{ value:'', label:(lang==='en' ? '— Choose —' : '— اختر —') }].concat(
            departments.map(function(d){ return { value:String(d.id), label: ln(d, lang) || ('#'+d.id) }; })
          )
        }),
        h('div', { style:{ display:'flex', alignItems:'end', color:T.textMute, fontSize:12 } },
          (lang==='en' ? 'Sends to all users in this department.' : 'يرسل لكل مستخدمي هذا القسم.')
        )
      ),
      isAdmin && (form.scope === 'team') && h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12, marginBottom:10 } },
        h(Select, {
          label: (lang==='en' ? 'Team' : 'الفريق'),
          value: form.team_id || '',
          onChange: function(v){ setForm(function(f){ return Object.assign({}, f, { team_id: v || '' }); }); },
          options: [{ value:'', label:(lang==='en' ? '— Choose —' : '— اختر —') }].concat(
            teams.map(function(t0){ return { value:String(t0.id), label: ln(t0, lang) || ('#'+t0.id) }; })
          )
        }),
        h('div', { style:{ display:'flex', alignItems:'end', color:T.textMute, fontSize:12 } },
          (lang==='en' ? 'Sends to all users in this team.' : 'يرسل لكل مستخدمي هذا الفريق.')
        )
      ),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Input, { label:t('title'), value:form.title, onChange:function(v){ setForm(function(f){return Object.assign({},f,{title:v});}); } }),
        h(Select, { label:t('type'), value:form.type, onChange:function(v){ setForm(function(f){return Object.assign({},f,{type:v});}); }, options:[{value:'info',label:t('notif_info')},{value:'success',label:t('notif_success')},{value:'warning',label:t('notif_warning')},{value:'error',label:t('notif_error')}] })
      ),
      h(Textarea, { label:t('notes'), value:form.body, onChange:function(v){ setForm(function(f){return Object.assign({},f,{body:v});}); } }),
      h('div', { style:{ display:'flex', gap:8 } },
        h(Btn, { onClick:send }, t('send_notification')),
        h(Btn, { variant:'secondary', onClick:enableNotifications }, t('browser_notifications'))
      )
    ),
    h(DataTable, {
      columns:[
        {key:'title',label:t('title'),render:function(n){return h('div',null,h('div',{style:{fontWeight:600}},n.title),n.body&&h('div',{style:{fontSize:12,color:T.textMute}},n.body));}},
        {key:'type',label:t('type'),render:function(n){var c={info:'blue',success:'green',warning:'amber',error:'red'};return h(Badge,{label:n.type,color:c[n.type]||'gray'});}},
        {key:'created_at',label:t('date'),render:function(n){return n.created_at?fmtDateTime(n.created_at, getLang()):'—';}},
      ],
      rows:asArr(crud.items), onDelete:function(n){crud.remove(n.id);}
    })
  );
}

/* â•â•â• KDS â•â•â• */
function KDSView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang; var isRtl = i18n.isRtl;
  var bs = props.bootstrap || {};
  var pauseReasons = (props.branding && props.branding.pause_reasons && props.branding.pause_reasons.length) ? props.branding.pause_reasons : (props.pauseReasons || []);
  var carouselInterval = Math.max(3, parseInt(props.carouselInterval||8, 10));
  var CARDS_PER_PAGE = 5;
  var orders   = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var statuses = asArr(bs.statuses);
  var _v = useState('grid'); var view = _v[0], setView = _v[1];
  var _fs = useState(false); var fullKDS = _fs[0], setFullKDS = _fs[1];
  var _pp = useState(null); var pausePrompt = _pp[0]; var setPausePrompt = _pp[1];
  /* carousel page per section â€” advances automatically on standalone */
  var _pages = useState({ip:0,rd:0,pd:0}); var carouselPages = _pages[0], setCarouselPages = _pages[1];
  var kdsSubtitle = lang==='en'
    ? ('Refreshes every ' + carouselInterval + ' seconds')
    : ('تحديث كل ' + carouselInterval + ' ثانية');
  useEffect(function(){
    var id = setInterval(props.onReload, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [props.onReload, carouselInterval]);

  /* detect standalone KDS mode */
  var rootEl = document.getElementById('cspsr-root');
  var isStandalone = rootEl && rootEl.dataset && rootEl.dataset.mode === 'kds';

  /* carousel auto-advance â€” only in standalone mode */
  useEffect(function(){
    if (!isStandalone || view !== 'grid') return;
    var id = setInterval(function(){
      setCarouselPages(function(prev){
        var next = {};
        ['ip','rd','pd'].forEach(function(k){ next[k] = prev[k]; });
        return next; /* will be updated below with real counts */
      });
    }, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [isStandalone, view, carouselInterval]);

  /* -- Classify orders into 3 sections --
     IN PROGRESS   : has items still in production
     READY TO DELIVER : ALL production steps done, delivery step pending/in-progress
     PARTIAL DELIVERY : some items delivered, others still in progress
  -- */
  /* Detect delivery step by flag OR by name */
  function isDeliveryStep(s) {
    if (s.is_delivery == 1) return true;
    var n = (s.step_name||'').toLowerCase();
    return n.indexOf('deliver') >= 0 || n.indexOf('توصيل') >= 0 || n.indexOf('تسليم') >= 0;
  }
  function itemProductionDone(item) {
    var steps = asArr(item.steps);
    var prodSteps = steps.filter(function(s){ return !isDeliveryStep(s); });
    if (prodSteps.length === 0) return true;
    return prodSteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
  }
  function itemDelivered(item) {
    if (item.is_delivered == 1) return true;
    var steps = asArr(item.steps);
    var deliverySteps = steps.filter(isDeliveryStep);
    if (deliverySteps.length === 0) return false;
    return deliverySteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
  }
  function orderAtDelivery(o) {
    var allSteps = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
    if (allSteps.length === 0) return false;
    var prodSteps = allSteps.filter(function(s){ return !isDeliveryStep(s); });
    var deliverySteps = allSteps.filter(isDeliveryStep);
    var prodAllDone = prodSteps.length === 0 || prodSteps.every(function(s){
      return s.status_slug === 'done' || s.status_slug === 'completed';
    });
    if (!prodAllDone) return false;
    if (deliverySteps.length > 0) {
      var deliveryAllDone = deliverySteps.every(function(s){
        return s.status_slug === 'done' || s.status_slug === 'completed';
      });
      return !deliveryAllDone;
    }
    return true;
  }

  function itemQueuedForPartial(item) {
    return !itemDelivered(item) && !!item.delivery_batch_id;
  }

  function orderHasExplicitPartial(o) {
    var items = asArr(o.items);
    return items.length > 1 && items.some(itemQueuedForPartial);
  }

  function cloneOrderForSection(order, items, sectionKey) {
    return Object.assign({}, order, {
      items: asArr(items).slice(),
      _section_key: sectionKey || '',
      _source_order_items: asArr(order.items).slice()
    });
  }

  var inProg = [], readyDeliver = [], partialDeliver = [];
  orders.forEach(function(o) {
    var items = asArr(o.items);
    var partialItems = items.filter(itemQueuedForPartial);
    /* Items fully finished in production, not yet explicitly queued for partial */
    var readyItems = items.filter(function(item){
      return !itemQueuedForPartial(item) && itemProductionDone(item) && !itemDelivered(item);
    });
    /* Items still genuinely under production */
    var pendingItems = items.filter(function(item){
      return !itemDelivered(item) && !itemQueuedForPartial(item) && !itemProductionDone(item);
    });

    var hasPending = pendingItems.length > 0;
    var hasReady   = readyItems.length > 0;
    var hasPartial = partialItems.length > 0 && items.length > 1;

    if (hasPartial) {
      if (hasPending) inProg.push(cloneOrderForSection(o, pendingItems, 'ip'));
      partialDeliver.push(cloneOrderForSection(o, partialItems, 'pd'));
    } else if (!hasPending && (hasReady || orderAtDelivery(o))) {
      /* All production done â†’ Ready to Deliver */
      readyDeliver.push(cloneOrderForSection(o, hasReady ? readyItems : items, 'rd'));
    } else {
      /* All still in progress */
      inProg.push(cloneOrderForSection(o, hasPending ? pendingItems : items, 'ip'));
    }
  });

  /* QR modal state */
  var _qr = useState(null); var qrOrder = _qr[0], setQrOrder = _qr[1];
  /* Recipient contact modal state */
  var _rc = useState(null); var rcOrder = _rc[0], setRcOrder = _rc[1];

  function startStep(stepId) { apiFetch('steps/'+stepId+'/start',{method:'POST', keepalive:true}).then(props.onSilentReload||props.onReload); }
  function completeStep(stepId) { apiFetch('steps/'+stepId+'/advance',{method:'POST', keepalive:true}).then(props.onSilentReload||props.onReload); }
  function pauseStep(stepId, orderId, stepLabel, stepNameAr, stepNameEn) { setPausePrompt({stepId:stepId, orderId:orderId, reason:'', machine:'', stepLabel:stepLabel||'', stepNameAr:stepNameAr||'', stepNameEn:stepNameEn||''}); }
  function resumeStep(stepId) { apiFetch('steps/'+stepId+'/resume',{method:'POST', keepalive:true}).then(props.onSilentReload||props.onReload); }

  /* get contact info from order */
  function getContact(order) {
    return {
      name:  order.contact_person_name_linked || order.contact_person_name || order.contact_name || '',
      phone: order.contact_person_phone_linked || order.contact_person_phone || order.contact_phone || order.customer_phone || '',
      email: order.contact_person_email_linked || order.contact_email || '',
      map:   order.contact_person_map_linked || order.contact_map || order.delivery_map_url || order.recipient_map_url || ''
    };
  }

  /* â”€â”€ Dark card for standalone, light card for embedded â”€â”€ */
  /* â”€â”€ Partial Delivery card: shows only ready items with "Delivered" button per item â”€â”€ */
  function renderPartialCard(order) {
    var isStandaloneCard = isStandalone;
    var bg   = isStandaloneCard ? '#161b22' : T.bg;
    var text = isStandaloneCard ? '#e6edf3' : T.text;
    var mid  = isStandaloneCard ? '#8b949e' : T.textMute;
    var bord = isStandaloneCard ? '#30363d' : T.border;
    var subBg= isStandaloneCard ? '#21262d' : T.bgSub;

    var sourceItems = asArr(order._source_order_items || order.items);
    var readyItems = asArr(order.items).filter(itemQueuedForPartial);
    var inProductionItems = sourceItems.filter(function(item){
      return !itemProductionDone(item) && !itemDelivered(item);
    });

    var urgBorder = order.is_urgent==1
      ? (isStandaloneCard ? '2px solid #f85149' : '2px solid '+T.red)
      : (isStandaloneCard ? '1px solid #d97706' : '1px solid '+T.border);

    var readyItemIds = readyItems.map(function(item){ return item.id; });
    var readyBatchId = readyItems.length && readyItems[0].delivery_batch_id ? readyItems[0].delivery_batch_id : '';
    var partialQrPageUrl = ((cfg().site_url || '').replace(/\/+$/, '') || (location.origin || '')) + '/?cspsr_qr_contact=' + order.id + '&partial=1' + (readyBatchId ? '&batch_id=' + readyBatchId : '') + '&item_ids=' + readyItemIds.join(',');
    var qrPartialUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=' + encodeURIComponent(partialQrPageUrl);
    var p = progOf(Object.assign({}, order, { items: sourceItems }));
    var allS = sourceItems.reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
    var activeStep = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
    var stepLabel = activeStep ? lnStep(activeStep, getLang()) : (order.current_step_label || t('waiting'));

    return h('div', { style:{ background:bg, border:urgBorder, borderRadius:isStandaloneCard?10:T.radiusLg, padding:'10px 12px', boxShadow:isStandaloneCard?'none':T.shadow, marginBottom:8 } },
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:7}},
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:6}},
            h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:isStandaloneCard?'#d97706':T.accent}},'#'+order.order_number),
            order.is_urgent==1 && h(Badge,{label:t('urgent'),color:'red',dot:true})
          ),
          h('div',{style:{fontSize:12,fontWeight:600,color:text,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
          orderDeliveryDisplayAt(order) && h('div',{style:{fontSize:11,color:'#d97706',fontWeight:600,marginTop:2}},'📅 '+fmtDateDayTime(orderDeliveryDisplayAt(order),getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(Object.assign({}, order, { qr_item_ids: readyItemIds, qr_batch_id: readyBatchId, qr_partial: true, items: readyItems.slice() }));}},
          h('img',{src:qrPartialUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid '+(isStandaloneCard?'#30363d':T.border),background:'#fff',padding:2},alt:'QR'})
        )
      ),
      !isStandaloneCard && h(ProgressBar,{value:p}),
        h('div',{style:{fontSize:10,color:mid,marginTop:isStandaloneCard?0:3,marginBottom:7}},p+'% — '+stepLabel),
      h('div',{style:{borderTop:'1px solid '+bord,paddingTop:6}},
        readyItems.map(function(item){
          var itemName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'?');
          return h('div',{key:'r'+item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0'}},
            h('span',{style:{fontSize:11,color:text,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},itemName),
            h('span',{style:{fontSize:11,color:isStandaloneCard?'#3fb950':'#166534',background:isStandaloneCard?'rgba(59,190,80,.2)':'#dcfce7',borderRadius:99,padding:'2px 8px',flexShrink:0}},lang==='en'?'Queued':'جاهز')
          );
        }),
        inProductionItems.map(function(item){
          var itemName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'?');
          return h('div',{key:'p'+item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0'}},
            h('span',{style:{fontSize:11,color:mid,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},itemName),
            h('span',{style:{fontSize:11,color:mid,background:subBg,borderRadius:99,padding:'2px 8px',flexShrink:0}},lang==='en'?'In Production':'قيد الإنتاج')
          );
        })
      ),
      readyItems.length > 0 && h('div',{style:{marginTop:8,paddingTop:8,borderTop:'1px solid '+bord}},
        h('button',{
          onClick:function(){
            var orderCopy = Object.assign({},order,{items:readyItems});
            openPrintWithLang(orderCopy, getLang());
          },
          style:{width:'100%',padding:'8px',borderRadius:6,border:'1px solid '+bord,background:'transparent',color:mid,cursor:'pointer',fontSize:12,fontFamily:'inherit'}
        }, (lang==='en'?'Print delivery slip':'طباعة وصل التوصيل'))
      )
    );
  }

  function renderKCard(order) {
    var sourceItems = asArr(order.items);
    var p = progOf(order);
    var prds = sourceItems.reduce(function(a,i){ return a.concat(asArr(i.steps).filter(function(s){ return s.show_in_prds==1; })); }, []);
    var allS = sourceItems.reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
    var next          = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
    var firstPending  = allS.filter(function(s){ return s.status_slug==='pending'; })[0];
    var showStart     = firstPending && !next;

    if (isStandalone) {
      var urgentBorder = order.is_urgent==1 ? '#f85149' : '#30363d';
      var qrItemIds = sourceItems.map(function(item){ return item.id; });
      var qrPageUrl = (((cfg().site_url || '').replace(/\/+$/, '') || (location.origin || '')) + '/?cspsr_qr_contact=' + order.id + (qrItemIds.length ? '&item_ids=' + qrItemIds.join(',') : ''));
      var qrApiUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=' + encodeURIComponent(qrPageUrl);
      var activeStep = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
      var stepLabel  = activeStep ? lnStep(activeStep, getLang()) : (order.current_step_label || t('waiting'));
      return h('div', { style:{ background:'#161b22', border:'1px solid '+urgentBorder, borderRadius:10, padding:'10px 12px' } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:7}},
          h('div',{style:{flex:1,minWidth:0}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6}},
              h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:order.is_urgent==1?'#f85149':'#58a6ff'}},'#'+order.order_number),
              order.is_urgent==1 && h('span',{style:{fontSize:9,background:'#f85149',color:'#fff',borderRadius:3,padding:'1px 4px',fontWeight:700}},tr(lang,'URGENT','Ø¹Ø§Ø¬Ù„'))
            ),
            h('div',{style:{fontSize:12,fontWeight:600,color:'#e6edf3',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
            orderDeliveryDisplayAt(order) && h('div',{style:{fontSize:10,color:'#d29922',marginTop:2}},tr(getLang(),'Delivery: ','التسليم: ')+fmtDateDayTime(orderDeliveryDisplayAt(order),getLang()))
          ),
          h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(Object.assign({}, order, { qr_item_ids: qrItemIds, items: sourceItems.slice() }));}},
            h('img',{src:qrApiUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid #30363d',background:'#fff',padding:2},alt:'QR'})
          )
        ),
        h('div',{style:{background:'#21262d',borderRadius:99,height:4,overflow:'hidden',marginBottom:4}},
          h('div',{style:{width:p+'%',background:p>=100?'#3fb950':p>=50?'#58a6ff':'#d29922',height:'100%',borderRadius:99}})
        ),
        h('div',{style:{fontSize:10,color:'#8b949e',marginBottom:7}},p+'% — '+stepLabel),
        asArr(order.items).length > 0 && h('div',{style:{borderTop:'1px solid #21262d',paddingTop:6}},
          asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
            var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
            return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
              h('span',{style:{fontSize:11,color:'#c9d1d9',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
            h('span',{style:{fontSize:11,color:'#6e7681',flexShrink:0}},'×'+item.quantity)
            );
          })
        )
      );
    }
    /* â”€â”€ Light card for embedded (inside app) â”€â”€ */
    var urgentBorderLight = order.is_urgent==1 ? '2px solid '+T.red : '1px solid '+T.border;
    var qrEmbUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=' + encodeURIComponent((((cfg().site_url || '').replace(/\/+$/, '') || (location.origin || '')) + '/?cspsr_qr_contact=' + order.id));
    var activeStepEmb = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
    var stepLabelEmb  = activeStepEmb ? lnStep(activeStepEmb, getLang()) : (order.current_step_label||t('waiting'));
    return h('div', { style:{ background:T.bg, border:urgentBorderLight, borderRadius:T.radiusLg, padding:'10px 12px', boxShadow:T.shadow } },
      /* Row 1: order info + QR */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:7}},
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:6}},
            h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:T.accent}},'#'+order.order_number),
            order.is_urgent==1 && h(Badge,{label:t('urgent'),color:'red',dot:true})
          ),
          h('div',{style:{fontSize:12,fontWeight:600,color:T.text,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
          orderDeliveryDisplayAt(order) && h('div',{style:{fontSize:11,color:T.amber,fontWeight:600,marginTop:2}},tr(getLang(),'Delivery: ','التسليم: ')+fmtDateDayTime(orderDeliveryDisplayAt(order),getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(order);}},
          h('img',{src:qrEmbUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
        )
      ),
      /* Row 2: progress */
      h(ProgressBar,{value:p}),
      h('div',{style:{fontSize:10,color:T.textMute,marginTop:3,marginBottom:7}},p+'% — '+stepLabelEmb),
      /* Row 3: in-production products only */
      asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).length > 0 && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:6,marginBottom:7}},
        asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
          var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
          return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
            h('span',{style:{fontSize:11,color:T.textMid,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
            h('span',{style:{fontSize:11,color:T.textMute,flexShrink:0}},'×'+item.quantity)
          );
        })
      ),
      /* Row 4: action buttons â€” hidden in KDS display */
    );
  }
  var gridSt = view==='grid'
    ? {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:isStandalone?14:16}
    : {display:'flex',flexDirection:'column',gap:10};

  var sections = [
    {key:'ip',  label:lang==='en'?'In Progress':'قيد الإنتاج',         count:inProg.length,        items:inProg,        color:isStandalone?'#58a6ff':T.blue,   icon:'\u2699', renderFn: renderKCard},
    {key:'rd',  label:lang==='en'?'Ready to Deliver':'جاهز للتوصيل',   count:readyDeliver.length,  items:readyDeliver,  color:isStandalone?'#3fb950':T.green,  icon:'\ud83d\ude9a', renderFn: renderKCard},
    {key:'pd',  label:lang==='en'?'Partial Delivery':'توصيل جزئي',     count:partialDeliver.length,items:partialDeliver,color:isStandalone?'#d29922':'#d97706', icon:'\ud83d\udce6', renderFn: renderPartialCard},
  ];

  /* carousel: advance each column's page every N seconds â€” always active */
  useEffect(function(){
    var sectionLengths = {ip:inProg.length, rd:readyDeliver.length, pd:partialDeliver.length};
    var id = setInterval(function(){
      setCarouselPages(function(prev){
        var next = {};
        Object.keys(sectionLengths).forEach(function(k){
          var total = sectionLengths[k];
          var pages = Math.ceil(total / CARDS_PER_PAGE) || 1;
          next[k] = pages > 1 ? (prev[k] + 1) % pages : 0;
        });
        return next;
      });
    }, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [carouselInterval, inProg.length, readyDeliver.length, partialDeliver.length]);

  /* get visible slice for a section in carousel mode */
  function getPageItems(key, items) {
    if (items.length <= CARDS_PER_PAGE) return items;
    var page = carouselPages[key] || 0;
    return items.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
  }

  /* -- Standalone dark fullscreen layout (TV) -- */
  if (isStandalone) {
    return h('div', { style:{ minHeight:'100vh', background:'#0d1117', color:'#e6edf3', padding:'16px 20px', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", direction:isRtl?'rtl':'ltr', overflow:'hidden' } },
      /* Header */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,paddingBottom:10,borderBottom:'1px solid #21262d'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}},
          h('div',{style:{width:10,height:10,borderRadius:'50%',background:'#3fb950',boxShadow:'0 0 10px #3fb950',flexShrink:0}}),
          h('h1',{style:{margin:0,fontSize:20,fontWeight:700,color:'#e6edf3'}},t('kds')),
          h('div',{style:{fontSize:12,color:'#484f58',marginTop:2}},t('n_active',orders.length)+' | '+carouselInterval+'s')
        ),
        h('div',{style:{display:'flex',gap:6,alignItems:'center'}},
          ['grid','list'].map(function(m){
            return h('button',{key:m,onClick:function(){setView(m);},style:{padding:'5px 12px',borderRadius:6,border:'1px solid #30363d',cursor:'pointer',fontSize:11,fontWeight:600,background:view===m?'#21262d':'transparent',color:view===m?'#e6edf3':'#6e7681'}},
              m==='grid'?'Grid':'List'
            );
          })
        )
      ),
      orders.length===0 && h('div',{style:{textAlign:'center',padding:'80px 20px',color:'#484f58'}},
        h('div',{style:{fontSize:16,fontWeight:600}},t('no_active_kds'))
      ),
      /* GRID VIEW: 3 columns with carousel (5 cards per page) */
      view==='grid' && orders.length > 0 && h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,alignItems:'start'}},
        sections.map(function(sec){
          var pageItems = getPageItems(sec.key, sec.items);
          var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
          var curPage = carouselPages[sec.key] || 0;
          return h('div',{key:sec.key,style:{background:'#161b22',border:'1px solid #21262d',borderRadius:12,overflow:'hidden'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid #21262d',background:'#0d1117'}},
              h('span',{style:{fontSize:14}},sec.icon),
              h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:1,flex:1}},sec.label),
              totalPages > 1 && h('span',{style:{color:'#484f58',fontSize:10,marginLeft:4}},(curPage+1)+'/'+totalPages),
              h('span',{style:{background:'#21262d',color:'#8b949e',borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700,marginLeft:4}},sec.count)
            ),
            h('div',{style:{padding:'10px',display:'flex',flexDirection:'column',gap:8,minHeight:100}},
              pageItems.length===0
                ? h('div',{style:{textAlign:'center',padding:'20px 0',color:'#484f58',fontSize:12}},tr(lang,'No orders','لا توجد طلبات'))
                : pageItems.map(function(o){ return h('div',{key:o.id},(sec.renderFn||renderKCard)(o)); })
            )
          );
        })
      ),
      /* LIST VIEW: compact horizontal rows */
      view==='list' && orders.length > 0 && h('div',{style:{display:'flex',flexDirection:'column',gap:0}},
        sections.map(function(sec){
          if (sec.items.length===0) return null;
          return h('div',{key:sec.key,style:{marginBottom:16}},
            h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#0d1117',borderRadius:8,marginBottom:6}},
              h('span',{style:{fontSize:13}},sec.icon),
              h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:1,flex:1}},sec.label),
              h('span',{style:{background:'#21262d',color:'#8b949e',borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700}},sec.count)
            ),
            h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
              sec.items.map(function(o){
                var p = progOf(o);
                var allSteps = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); },[]);
                var activeStep = allSteps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
                var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=60x60&data='+encodeURIComponent(((cfg().site_url||'').replace(/\/+$/,'') || (location.origin||''))+'/?cspsr_qr_contact='+o.id);
                return h('div',{key:o.id,style:{display:'grid',gridTemplateColumns:'160px 1fr auto 70px',gap:10,alignItems:'center',background:'#161b22',border:'1px solid #21262d',borderRadius:8,padding:'8px 12px'}},
                  h('div',null,
                    h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:sec.color}},'#'+o.order_number),
                    h('div',{style:{fontSize:12,color:'#c9d1d9',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(o,getLang())),
                    o.is_urgent==1 && h('span',{style:{fontSize:10,background:'#f85149',color:'#fff',borderRadius:4,padding:'1px 5px',marginTop:2,display:'inline-block'}},tr(lang,'Urgent','Ø¹Ø§Ø¬Ù„'))
                  ),
                  h('div',null,
                    h('div',{style:{background:'#21262d',borderRadius:4,height:6,overflow:'hidden',marginBottom:4}},
                      h('div',{style:{background:p===100?'#3fb950':'#58a6ff',height:'100%',width:p+'%',transition:'width .3s'}})
                    ),
                h('div',{style:{fontSize:11,color:'#8b949e'}},p+'% | '+(activeStep?lnStep(activeStep,lang):(o.current_step_label||'—')))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:3}},
                    asArr(o.items).slice(0,2).map(function(item){
                      var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'');
                      return h('span',{key:item.id,style:{fontSize:10,background:'#21262d',color:'#8b949e',borderRadius:4,padding:'2px 6px',whiteSpace:'nowrap',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',display:'inline-block'}},iName+' Ã—'+item.quantity);
                    }),
                    asArr(o.items).length>2 && h('span',{style:{fontSize:10,color:'#484f58'}},'+' +(asArr(o.items).length-2))
                  ),
                  h('img',{src:qrUrl,width:56,height:56,style:{display:'block',borderRadius:4,border:'1px solid #30363d',background:'#fff'},alt:'QR'})
                );
              })
            )
          );
        })
      ),
      pausePrompt && h(PauseModal, {
        pauseReasons: pauseReasons,
        stepLabel: pausePrompt.stepLabel || '',
        onClose: function(){ setPausePrompt(null); },
        onConfirm: function(reason, machine){
          apiFetch('steps/'+pausePrompt.stepId+'/pause',{method:'POST',body:JSON.stringify({reason:reason,machine:machine||''})})
            .then(function(){ setPausePrompt(null); (props.onSilentReload||props.onReload)(); });
        }
      }),
      /* â”€â”€ QR Contact Modal standalone â”€â”€ */
      qrOrder && renderQRModal(qrOrder, true),
      rcOrder && renderRecipientModal(rcOrder, true)
    );
  }

  /* â”€â”€ Embedded light layout (inside app sidebar) â”€â”€ */
  useTopbar(t('n_active',orders.length)+' - '+kdsSubtitle,
    h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:view==='grid'?'primary':'secondary',size:'sm',onClick:function(){setView('grid');}}, 'Grid'),
      h(Btn,{variant:view==='list'?'primary':'secondary',size:'sm',onClick:function(){setView('list');}}, 'List'),
      h(Btn,{variant:fullKDS?'primary':'secondary',size:'sm',
        onClick:function(){
          var next = !fullKDS;
          setFullKDS(next);
          if (next) {
            var el = document.documentElement;
            var req = el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
            if (req) req.call(el);
          } else {
            var ex = document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen||document.msExitFullscreen;
            if (ex) ex.call(document);
          }
        }
      }, fullKDS ? 'Exit' : (lang==='en'?'Fullscreen':'ملء الشاشة'))
    )
  );

  /* Fullscreen overlay â€” covers entire viewport, no sidebar or header */
  var kdsWrapStyle = fullKDS ? {
    position:'fixed', inset:0, zIndex:9999,
    background:T.bg, overflow:'auto',
    padding:'16px 20px'
  } : {};

  /* Grid: 3 columns with carousel | List: horizontal slider */
  if (view === 'list') {
    var sectionCount = sections.filter(function(s){ return s.items.length > 0; }).length || 1;
    return h('div', { style: Object.assign({ display:'flex', flexDirection:'column', gap:8, height:'calc(100vh - 80px)', overflow:'hidden' }, kdsWrapStyle) },
      fullKDS && h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:6}},
        h('button',{
          onClick:function(){ setFullKDS(false); },
          style:{padding:'5px 12px',borderRadius:8,border:'1px solid '+T.border,background:T.bgSub,color:T.textMid,cursor:'pointer',fontSize:12,fontWeight:600}
        }, lang==='en'?'Exit Fullscreen':'Ø®Ø±ÙˆØ¬ Ù…Ù† Ù…Ù„Ø¡ Ø§Ù„Ø´Ø§Ø´Ø©')
      ),
      sections.map(function(sec){
        if (sec.items.length === 0) return null;
        var pageItems = getPageItems(sec.key, sec.items);
        var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
        var curPage = carouselPages[sec.key] || 0;
        return h('div',{key:sec.key, style:{flex:1, display:'flex', flexDirection:'column', minHeight:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
            h('span',{style:{fontSize:13}},sec.icon),
            h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:.8,flex:1}},sec.label),
            totalPages > 1 && h('span',{style:{fontSize:11,color:T.textMute}},(curPage+1)+'/'+totalPages),
            h('span',{style:{background:T.bgSub,color:T.textMute,borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700}},sec.count)
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+CARDS_PER_PAGE+', 1fr)',gap:10,flex:1,minHeight:0}},
            Array.from({length:CARDS_PER_PAGE}).map(function(_,i){
              var o = pageItems[i];
              if (!o) return h('div',{key:'empty-'+i, style:{background:T.bgSub,borderRadius:T.radiusLg,border:'1px dashed '+T.border,opacity:.3}});
              var p = progOf(o);
              var allStps = asArr(o.items).reduce(function(a,it){ return a.concat(asArr(it.steps)); },[]);
              var activeStep = allStps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
              var stepLbl = activeStep ? lnStep(activeStep,getLang()) : (o.current_step_label||t('waiting'));
              var qrItemIds = asArr(o.items).map(function(item){ return item.id; });
              var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='+encodeURIComponent(((cfg().site_url||'').replace(/\/+$/,'') || (location.origin||''))+'/?cspsr_qr_contact='+o.id+(qrItemIds.length ? '&item_ids='+qrItemIds.join(',') : ''));
              var urgBorder = o.is_urgent==1 ? '2px solid '+T.red : '1px solid '+T.border;
              var displayItems = asArr(o.items);
              return h('div',{key:o.id, style:{
                background:T.bg, border:urgBorder,
                borderTop:'3px solid '+sec.color,
                borderRadius:T.radiusLg, padding:'10px 12px',
                display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0
              }},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}},
                  h('div',{style:{flex:1,minWidth:0}},
                    h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:12,color:sec.color}},'#'+o.order_number),
                    h('div',{style:{fontSize:11,fontWeight:600,color:T.text,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(o,getLang())),
                    o.deadline && h('div',{style:{fontSize:10,color:T.amber,marginTop:1}},'ðŸ—“ '+fmtDate(o.deadline,getLang()))
                  ),
                  h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(Object.assign({}, o, { qr_item_ids: qrItemIds, items: displayItems.slice() }));}},
                    h('img',{src:qrUrl,width:120,height:120,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
                  )
                ),
                h('div',{style:{background:T.bgSub,borderRadius:99,height:4,overflow:'hidden',marginBottom:3}},
                  h('div',{style:{width:p+'%',background:p>=100?'#22c55e':T.accent,height:'100%',borderRadius:99}})
                ),
                h('div',{style:{fontSize:10,color:T.textMute,marginBottom:4}},p+'% â€” '+stepLbl),
                h('div',{style:{flex:1,overflow:'hidden'}},
                  displayItems.map(function(item){
                    var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
                    return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',fontSize:10,padding:'1px 0',borderBottom:'1px solid '+T.bgSub}},
                      h('span',{style:{color:T.textMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
                      h('span',{style:{color:T.textMute,flexShrink:0}},'Ã—'+item.quantity)
                    );
                  })
                )
              );
            })
          )
        );
      }),
      qrOrder && renderQRModal(qrOrder, false),
      rcOrder && renderRecipientModal(rcOrder, false)
    );
  }



  var embColStyle = {display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,alignItems:'start'};

  return h('div', { style: kdsWrapStyle || {} },
    fullKDS && h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:10}},
      h('button',{
        onClick:function(){ setFullKDS(false); },
        style:{padding:'6px 14px',borderRadius:8,border:'1px solid '+T.border,background:T.bgSub,color:T.textMid,cursor:'pointer',fontSize:12,fontWeight:600}
      }, 'âœ• '+(lang==='en'?'Exit Fullscreen':'Ø®Ø±ÙˆØ¬ Ù…Ù† Ù…Ù„Ø¡ Ø§Ù„Ø´Ø§Ø´Ø©'))
    ),
    orders.length===0 && h(Card,{style:{padding:40,textAlign:'center'}},
      h('div',{style:{fontSize:48,marginBottom:12}},'ðŸ“‹'),
      h('div',{style:{color:T.textMute,fontSize:14}},t('no_active_kds'))
    ),
    orders.length > 0 && h('div',{style:embColStyle},
      sections.map(function(sec){
        var pageItems = getPageItems(sec.key, sec.items);
        var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
        var curPage = carouselPages[sec.key] || 0;
        return h('div',{key:sec.key,style:{background:T.bg,border:'1px solid '+T.border,borderRadius:T.radiusLg,overflow:'hidden'}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid '+T.border,background:T.bgSub}},
            h('span',{style:{fontSize:15}},sec.icon),
            h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:.5,flex:1}},sec.label),
            totalPages > 1 && h('span',{style:{fontSize:11,color:T.textMute,marginRight:4}},(curPage+1)+'/'+totalPages),
            h(Badge,{label:String(sec.count),color:'gray'})
          ),
          h('div',{style:{padding:'12px',display:'flex',flexDirection:'column',gap:10,minHeight:100}},
            sec.items.length===0
              ? h('div',{style:{textAlign:'center',padding:'20px 0',color:T.textMute,fontSize:12,width:'100%'}},lang==='en'?'No orders':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª')
              : pageItems.map(function(o){ return h('div',{key:o.id},(sec.renderFn||renderKCard)(o)); })
          )
        );
      })
    ),
    /* â”€â”€ Pause Modal embedded â€” linked to Settings reasons â”€â”€ */
    pausePrompt && h(PauseModal, {
      pauseReasons: pauseReasons,
      stepLabel: pausePrompt.stepLabel || '',
      onClose: function(){ setPausePrompt(null); },
      onConfirm: function(reason, machine){
        apiFetch('steps/'+pausePrompt.stepId+'/pause',{method:'POST',body:JSON.stringify({reason:reason,machine:machine||''})})
          .then(function(){ setPausePrompt(null); (props.onSilentReload||props.onReload)(); });
      }
    }),
    /* â”€â”€ QR Contact Modal embedded â”€â”€ */
    qrOrder && renderQRModal(qrOrder, false),
    rcOrder && renderRecipientModal(rcOrder, false)
  );

  /* â”€â”€ QR Contact Modal builder â”€â”€ */
  function renderQRModal(order, dark) {
    var ct = getContact(order);
    var qrItemIds = asArr(order.qr_item_ids || []);
    var qrBatchId = order.qr_batch_id || '';
    var qrPartial = order.qr_partial ? true : false;
    var qrPageUrl = (((cfg().site_url || '').replace(/\/+$/, '') || (location.origin || '')) + '/?cspsr_qr_contact=' + order.id + (qrPartial ? '&partial=1' : '') + (qrBatchId ? '&batch_id=' + qrBatchId : '') + (qrItemIds.length ? '&item_ids=' + qrItemIds.join(',') : ''));
    var qrApiUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(qrPageUrl);
    var bg    = dark ? '#161b22' : T.bg;
    var text  = dark ? '#e6edf3' : T.text;
    var mid   = dark ? '#c9d1d9' : T.textMid;
    var mute  = dark ? '#8b949e' : T.textMute;
    var bord  = dark ? '#30363d' : T.border;
    var subBg = dark ? '#21262d' : T.bgSub;
    var isRtlDir = i18n.isRtl ? 'rtl' : 'ltr';

    /* Collect all phones: customer + contact + recipient */
    var phones = [];
    if (ct.phone) phones.push(ct.phone);
    if (order.customer_phone && phones.indexOf(order.customer_phone)<0) phones.push(order.customer_phone);
    if (order.recipient_phone && phones.indexOf(order.recipient_phone)<0) phones.push(order.recipient_phone);

    /* Map link */
    var mapUrl = ct.map || order.delivery_map_url || order.recipient_map_url || '';

    /* Products */
    var items = asArr(order.items).filter(function(item){
      if (order.qr_partial && item.is_ready_for_delivery == 1 && item.is_delivered != 1) return true;
      if (qrBatchId && String(item.delivery_batch_id||'') === String(qrBatchId)) return true;
      if (qrItemIds.length && (qrItemIds.indexOf(item.id) >= 0 || qrItemIds.indexOf(String(item.id)) >= 0)) return true;
      return !order.qr_partial && !qrBatchId && !qrItemIds.length;
    });

    return h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:99000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, onClick:function(e){ if(e.target===e.currentTarget) setQrOrder(null); } },
      h('div', { style:{ background:bg, border:'1px solid '+bord, borderRadius:16, width:'100%', maxWidth:400, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,.6)', direction:isRtlDir } },
        /* Header */
        h('div',{style:{padding:'16px 20px',borderBottom:'1px solid '+bord,display:'flex',alignItems:'center',justifyContent:'space-between'}},
          h('div',null,
            h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:14,color:dark?'#58a6ff':T.accent}},'#'+order.order_number),
            h('div',{style:{fontWeight:700,fontSize:15,color:text,marginTop:2}},getCust(order,lang))
          ),
          h('button',{onClick:function(){setQrOrder(null);},style:{border:'none',background:'transparent',cursor:'pointer',color:mute,fontSize:20,lineHeight:1,padding:4}},'Ã—')
        ),
        /* Body */
        h('div',{style:{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}},
          /* QR code */
          h('div',{style:{display:'flex',justifyContent:'center'}},
            h('div',{style:{background:'#fff',padding:8,borderRadius:10,display:'inline-block',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}},
              h('img',{src:qrApiUrl,width:120,height:120,style:{display:'block',borderRadius:4},alt:'QR'})
            )
          ),
          h('div',{style:{fontSize:11,color:mute,textAlign:'center'}}, lang==='en'?'Scan to open contact page':'Ø§Ù…Ø³Ø­ Ù„Ù„ÙˆØµÙˆÙ„ Ù„ØµÙØ­Ø© Ø§Ù„ØªÙˆØ§ØµÙ„'),
          /* Recipient */
          (order.recipient_name||ct.name) && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:4}},lang==='en'?'Recipient':'Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
            h('div',{style:{fontWeight:600,fontSize:13,color:text}},order.recipient_name||ct.name||'â€”'),
            ct.name && order.recipient_name && ct.name!==order.recipient_name && h('div',{style:{fontSize:12,color:mid,marginTop:2}},ct.name)
          ),
          /* Phones */
          phones.length > 0 && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            phones.map(function(ph,i){
              var waNum = ph.replace(/[^0-9]/g,'');
              return h('div',{key:i,style:{display:'flex',gap:8}},
                h('a',{href:'tel:'+ph,style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'ðŸ“ž'), ph
                ),
                h('a',{href:'https://wa.me/'+waNum,target:'_blank',style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#d1fae5',color:'#065f46',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'ðŸ’¬'), 'WhatsApp'
                )
              );
            })
          ),
          /* Maps */
          mapUrl && h('a',{href:mapUrl,target:'_blank',style:{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderRadius:9,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:13}},
            h('span',{style:{fontSize:18}},'ðŸ“'),
            lang==='en'?'Open in Google Maps':'ÙØªØ­ ÙÙŠ Ø®Ø±Ø§Ø¦Ø· ÙƒÙˆÙƒÙ„'
          ),
          /* Products */
          items.length > 0 && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:8}},lang==='en'?'Products in this order':'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ÙÙŠ Ø§Ù„Ø·Ù„Ø¨'),
            items.map(function(item,i){
              return h('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<items.length-1?'1px solid '+bord:'none'}},
                h('span',{style:{fontSize:13,color:text,fontWeight:500}},(lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name||'â€”'),
                h('span',{style:{fontSize:12,color:mute,background:dark?'#161b22':T.bg,borderRadius:99,padding:'1px 8px'}},
                  'Ã—'+item.quantity
                )
              );
            })
          ),
          !ct.phone && !mapUrl && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:subBg,borderRadius:8,textAlign:'center'}},lang==='en'?'No contact info available':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ØªÙˆØ§ØµÙ„')
        )
      )
    );
  }

  /* â”€â”€ Recipient Contact Modal builder â”€â”€ */
  function renderRecipientModal(order, dark) {
    var bg   = dark ? '#161b22' : T.bg;
    var text = dark ? '#e6edf3' : T.text;
    var mute = dark ? '#8b949e' : T.textMute;
    var bord = dark ? '#30363d' : T.border;
    var cardBg = dark ? '#21262d' : T.bgSub;

    /* Pick recipient fields */
    var name    = order.rec_name || order.recipient_name || '';
    var phone   = order.rec_phone || order.recipient_phone || '';
    var address = order.rec_address || order.recipient_address || order.delivery_address || '';
    var map     = order.rec_map || order.recipient_map_url || order.delivery_map_url || '';
    var customer = getCust(order, lang);

    return h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:99000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, onClick:function(e){ if(e.target===e.currentTarget) setRcOrder(null); } },
      h('div', { style:{ background:bg, border:'1px solid '+bord, borderRadius:16, padding:'24px 20px', width:'100%', maxWidth:360, boxShadow:'0 24px 48px rgba(0,0,0,.5)', direction:'rtl' } },
        /* Header */
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:16}},
          h('div',{style:{width:40,height:40,borderRadius:10,background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}},'ðŸ“¦'),
          h('div',null,
            h('div',{style:{fontWeight:700,fontSize:14,color:text}}, lang==='en'?'Recipient':'Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
            h('div',{style:{fontSize:12,color:mute}},'#'+order.order_number+' â€” '+customer)
          )
        ),
        /* Recipient info card */
        h('div',{style:{background:cardBg,borderRadius:10,padding:'14px 16px',marginBottom:16}},
          name && h('div',{style:{fontWeight:700,fontSize:15,color:text,marginBottom:6}},name),
          address && h('div',{style:{fontSize:12,color:mute,marginBottom:4}},'ðŸ“ '+address),
          !name && !address && h('div',{style:{color:mute,fontSize:13}}, lang==='en'?'No recipient info':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø³ØªÙ„Ù…')
        ),
        /* Contact buttons */
        h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          phone && h('a',{href:'tel:'+phone, style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ“ž'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Call Recipient':'Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          phone && h('a',{href:'https://wa.me/'+phone.replace(/[^0-9]/g,''), target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ’¬'),
            h('div',{style:{textAlign:'right'}},
              h('div',null,'WhatsApp'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          map && h('a',{href:map, target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ“'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Open Map':'ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©')
            )
          ),
          !phone && !map && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:cardBg,borderRadius:8}}, lang==='en'?'No contact info':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ØªÙˆØ§ØµÙ„')
        ),
        h('button',{onClick:function(){setRcOrder(null);}, style:{marginTop:16,padding:'8px 24px',borderRadius:8,border:'1px solid '+bord,background:'transparent',color:mute,cursor:'pointer',fontSize:13,width:'100%'}}, lang==='en'?'Close':'Ø¥ØºÙ„Ø§Ù‚')
      )
    );
  }
}

function AppLayout(props) {
  var i18n = useI18n(); var isRtl = i18n.isRtl;
  var dir = isRtl ? 'rtl' : 'ltr';
  return h('div', { style:{ display:'flex', height:'100vh', background:T.bgSub, direction:dir, overflow:'hidden', ['--cspsr-sidebar-width']:'220px' } },
    props.children
  );
}
var ErrorBoundary = (function() {
  function EB(p) { React.Component.call(this,p); this.state = {err:false,msg:''}; }
  EB.prototype = Object.create(React.Component.prototype);
  EB.getDerivedStateFromError = function(e) { return {err:true,msg:e.message}; };
  EB.prototype.render = function() {
    if (this.state.err) return h(Card,{style:{margin:20,padding:24,borderColor:'#fda4af'}},
      h('div',{style:{fontWeight:700,color:T.red,marginBottom:8}},'UI Error'),
      h('code',{style:{fontSize:12,color:T.textMute,display:'block',marginBottom:14}},this.state.msg),
      h(Btn,{variant:'secondary',onClick:function(){ this.setState({err:false,msg:''}); }.bind(this)},'Retry')
    );
    return this.props.children;
  };
  return EB;
})();

/* â•â•â• OPERATIONS TASKS â•â•â• */

/* â”€â”€ OpsTaskForm: create/edit a task â”€â”€ */
function OpsTaskForm(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var authUser = props.authUser || {};
  var myEmpId = parseInt(authUser.employee_id, 10) || 0;
  var customers     = asArr(bs.customers);
  var products      = asArr(bs.products);
  var orders        = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var employees     = asArr(bs.employees);
  var defaultDeptId = String(props.defaultDepartmentId || '');

  var blank = { linked_order_id:'', customer_id:'', contact_person_id:'', product_id:'', assigned_employee_id:'', assigned_employee_ids:[], description:'', deadline:'', time:'' };
  var initialTask = Object.assign({}, blank, props.task || {});
  try {
    var initIds = Array.isArray(initialTask.assigned_employee_ids)
      ? initialTask.assigned_employee_ids
      : (initialTask.assigned_employee_ids ? JSON.parse(initialTask.assigned_employee_ids || '[]') : []);
    if ((!initIds || !initIds.length) && initialTask.assigned_employee_id) initIds = [String(initialTask.assigned_employee_id)];
    initialTask.assigned_employee_ids = asArr(initIds).map(function(v){ return String(v); });
    if (initialTask.assigned_employee_ids.length) initialTask.assigned_employee_id = initialTask.assigned_employee_ids[0];
  } catch(e) {
    initialTask.assigned_employee_ids = initialTask.assigned_employee_id ? [String(initialTask.assigned_employee_id)] : [];
  }
  var _f = useState(initialTask);
  var form = _f[0]; var setForm = _f[1];
  var descInputRef = useRef(null);
  var descValueRef = useRef(initialTask.description || '');
  var _contacts = useState([]); var contacts = _contacts[0]; var setContacts = _contacts[1];
  var _loading = useState(false); var saving = _loading[0]; var setSaving = _loading[1];

  useEffect(function(){
    var nextDesc = (initialTask && initialTask.description) || '';
    descValueRef.current = nextDesc;
    if (descInputRef.current && descInputRef.current.value !== nextDesc) {
      descInputRef.current.value = nextDesc;
    }
  }, [props.task && props.task.id]);

  /* When customer changes load their contacts */
  useEffect(function() {
    if (!form.customer_id) { setContacts([]); return; }
    apiFetch('customers/' + form.customer_id + '/contacts')
      .then(function(d){ setContacts(Array.isArray(d) ? d : []); })
      .catch(function(){ setContacts([]); });
  }, [form.customer_id]);

  /* When order changes, pre-fill customer */
  useEffect(function() {
    if (!form.linked_order_id) return;
    var ord = findBy(orders, 'id', parseInt(form.linked_order_id));
    if (ord && ord.customer_id) {
      setForm(function(f){ return Object.assign({}, f, { customer_id: String(ord.customer_id) }); });
    }
  }, [form.linked_order_id]);

  function set(k, v) { setForm(function(f){ return Object.assign({}, f, { [k]: v }); }); }

  function save() {
    if (!form.customer_id) { alert(lang === 'en' ? 'Customer is required' : 'Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù…Ø·Ù„ÙˆØ¨'); return; }
    setSaving(true);
    var body = Object.assign({}, form, {
      description: String((descInputRef.current && descInputRef.current.value) || descValueRef.current || ''),
      linked_order_id:   form.linked_order_id   ? parseInt(form.linked_order_id)   : null,
      customer_id:       parseInt(form.customer_id),
      contact_person_id: form.contact_person_id ? parseInt(form.contact_person_id) : null,
      product_id:        form.product_id        ? parseInt(form.product_id)        : null,
      assigned_employee_ids: Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(function(v){ return String(v); }) : [],
      assigned_employee_id: (Array.isArray(form.assigned_employee_ids) && form.assigned_employee_ids.length)
        ? parseInt(form.assigned_employee_ids[0], 10)
        : (form.assigned_employee_id ? parseInt(form.assigned_employee_id) : null),
    });
    var prom = form.id
      ? apiFetch('ops-tasks/' + form.id, { method:'PUT', body:JSON.stringify(body) })
      : apiFetch('ops-tasks', { method:'POST', body:JSON.stringify(body) });
    prom
      .then(function(res){
        setSaving(false);
        try {
          var assigneeIds = asArr(body.assigned_employee_ids).map(function(v){ return String(v); });
          var isSelfByEmpId = myEmpId && assigneeIds.indexOf(String(myEmpId)) >= 0;
          var isSelfByName = false;
          if (!isSelfByEmpId && assigneeIds.length) {
            var myName = String(authUser.name || '').toLowerCase().trim();
            if (myName) {
              var assigneeNames = employees
                .filter(function(e){ return assigneeIds.indexOf(String(e.id)) >= 0; })
                .map(function(e){ return String((lang==='en' && e.name_en) ? e.name_en : (e.name || e.name_en || '')).toLowerCase().trim(); });
              isSelfByName = assigneeNames.indexOf(myName) >= 0;
            }
          }
          if (isSelfByEmpId || isSelfByName) {
            var taskNo = (res && (res.task_no || res.id)) ? (res.task_no || ('OT-' + res.id)) : (form.task_no || 'Task');
            var ord = form.linked_order_id ? findBy(orders, 'id', parseInt(form.linked_order_id, 10)) : null;
            notifyWindowsOnly(
              lang === 'en' ? '🔔 Task Assigned to You' : '🔔 تم إسناد مهمة لك',
              (lang === 'en'
                ? ('Task ' + taskNo + ' is now assigned to you' + (ord ? (' | Order #' + ord.order_number) : ''))
                : ('المهمة ' + taskNo + ' أصبحت مسندة لك' + (ord ? (' | طلب #' + ord.order_number) : ''))
              ),
              'cspsr-assigned-self-' + String(res && res.id ? res.id : taskNo)
            );
          }
        } catch(_eNotify) {}
        props.onSaved(res && res.id ? res.id : null);
      })
      .catch(function(e){ setSaving(false); alert(e.message || 'Error'); });
  }

  var orderOpts = [{ value:'', label: lang==='en' ? 'â€” No linked order â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ø·Ù„Ø¨ Ù…Ø±ØªØ¨Ø· â€”' }]
    .concat(orders.map(function(o){ return { value:String(o.id), label:'#'+o.order_number+' â€” '+getCust(o,lang) }; }));

  var custOpts = [{ value:'', label: lang==='en' ? 'â€” Select customer â€”' : 'â€” Ø§Ø®ØªØ± Ø§Ù„Ø¹Ù…ÙŠÙ„ â€”' }]
    .concat(customers.map(function(c){ return { value:String(c.id), label:ln(c,lang) }; }));

  var contactOpts = [{ value:'', label: lang==='en' ? 'â€” No contact person â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ø´Ø®Øµ ØªÙˆØ§ØµÙ„ â€”' }]
    .concat(contacts.map(function(c){ return { value:String(c.id), label:c.name+(c.phone?' ('+c.phone+')':'') }; }));

  var productOpts = [{ value:'', label: lang==='en' ? 'â€” No product â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ù…Ù†ØªØ¬ â€”' }]
    .concat(products.map(function(p){ return { value:String(p.id), label:ln(p,lang) }; }));
  var scopedDeptId = String(form._targetDeptId || defaultDeptId || '');
  var scopedEmployees = scopedDeptId
    ? employees.filter(function(e){ return String(e.department_id || '') === scopedDeptId; })
    : employees;
  var employeeOpts = scopedEmployees.map(function(e){ return { value:String(e.id), label:ln(e,lang) }; });

  return h(Modal, {
    title: form.id ? t('ops_edit_task') : t('ops_new_task'),
    onClose: props.onClose,
    width: 540,
    footer: h('div', { style:{ display:'flex', gap:8 } },
      h(Btn, { variant:'secondary', onClick:props.onClose }, t('cancel')),
      h(Btn, { variant:'primary', onClick:save }, saving ? h(Spinner) : t('save'))
    )
  },
    h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
      h(Fld, { label: lang==='en' ? 'Linked Order (optional)' : 'Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ø±ØªØ¨Ø· (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)' },
        h(Select, { value:form.linked_order_id||'', options:orderOpts, onChange:function(v){ set('linked_order_id',v); } })
      ),
      h(Fld, { label: t('customer')+' *' },
        h(Select, { value:form.customer_id||'', options:custOpts, onChange:function(v){ set('customer_id',v); } })
      ),
      form.customer_id && h(Fld, { label: t('contact_person') },
        h(Select, { value:form.contact_person_id||'', options:contactOpts, onChange:function(v){ set('contact_person_id',v); } })
      ),
      h(Fld, { label: t('product')+' ('+t('optional')+')' },
        h(Select, { value:form.product_id||'', options:productOpts, onChange:function(v){ set('product_id',v); } })
      ),
      h(MultiSelect, {
        label: lang==='en' ? 'Assigned Employees' : 'الموظفون المرتبطون',
        values: Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [],
        options: employeeOpts,
        onChange: function(v){
          var ids = asArr(v).map(function(x){ return String(x); });
          setForm(function(f){ return Object.assign({}, f, { assigned_employee_ids: ids, assigned_employee_id: ids.length ? ids[0] : '' }); });
        }
      }),
      scopedDeptId && !employeeOpts.length && h('div', { style:{ marginTop:-4, fontSize:12, color:T.textMute } },
        lang==='en'
          ? 'No employees found in this department.'
          : 'لا يوجد موظفون مرتبطون بهذا القسم.'
      ),
      h(Fld, { label: t('description') },
        h('textarea', {
          key:'ops-desc-'+String((form && form.id) || 'new'),
          ref:descInputRef,
          defaultValue:descValueRef.current,
          rows:3,
          placeholder:'',
          spellCheck:false,
          autoCapitalize:'off',
          autoCorrect:'off',
          dir:'auto',
          style:Object.assign({}, iSt, {resize:'vertical', willChange:'auto'})
        })
      ),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Fld, { label: t('deadline') },
          h(Input, { type:'datetime-local', value:form.deadline||'', onChange:function(v){ set('deadline',v); } })
        ),
        h(Fld, { label: t('ops_time') },
          h(Input, { value:form.time, placeholder: lang==='en'?'e.g. 2h':'Ù…Ø«Ø§Ù„: 2 Ø³Ø§Ø¹Ø©', onChange:function(v){ set('time',v); } })
        )
      )
    )
  );
}

/* â”€â”€ OpsTaskCard: a single task card in the kanban â”€â”€ */
function OpsTaskCard(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var task = props.task;
  var isOverdue = task.deadline && !isOpsTaskCompleted(task) && new Date(task.deadline) < new Date();
  var requestedBy = task.requested_by_name
    || task.contact_person_name
    || task.created_by_name
    || task.created_by_username
    || '';
  var assignees = [];
  if (Array.isArray(task.assigned_employees) && task.assigned_employees.length) {
    assignees = task.assigned_employees.map(function(e){
      return (lang==='en' && e.name_en) ? e.name_en : (e.name || e.name_en || '');
    }).filter(Boolean);
  } else {
    var ids = [];
    try { ids = Array.isArray(task.assigned_employee_ids) ? task.assigned_employee_ids : (task.assigned_employee_ids ? JSON.parse(task.assigned_employee_ids || '[]') : []); } catch(e){}
    if ((!ids || !ids.length) && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
    assignees = asArr(ids).map(function(v){
      var emp = findBy(asArr(props.employees || []), 'id', parseInt(v, 10));
      return emp ? ln(emp, lang) : '';
    }).filter(Boolean);
  }
  if (!assignees.length && (task.assigned_employee_name || task.assigned_employee_name_en)) {
    assignees = [ (lang==='en' && task.assigned_employee_name_en) ? task.assigned_employee_name_en : (task.assigned_employee_name || task.assigned_employee_name_en) ];
  }

  return h('div', {
    draggable: true,
    onDragStart: function(e){ e.dataTransfer.setData('text/plain', String(task.id)); },
    style:{
      background: props.draggingId === task.id ? T.accentDim : T.bg,
      border: '1px solid ' + (isOverdue ? T.red : T.border),
      borderRadius: T.radius,
      padding: '10px 12px',
      marginBottom: 8,
      cursor: 'grab',
      boxShadow: T.shadow,
      opacity: props.draggingId === task.id ? 0.5 : 1,
      transition: 'box-shadow .15s',
    },
    onMouseEnter: function(e){ e.currentTarget.style.boxShadow = T.shadowLg; },
    onMouseLeave: function(e){ e.currentTarget.style.boxShadow = T.shadow; },
  },
    /* Task number + actions */
    h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 } },
      h('code', { style:{ fontSize:11, color:T.accent, fontWeight:700 } }, task.task_no),
      h('div', { style:{ display:'flex', gap:4 } },
        /* Arrow left (prev stage) */
        (props.canMovePrev || props.canReturnPrevDept) && h('button', {
          title: lang==='en' ? 'Move to previous stage' : 'Ù†Ù‚Ù„ Ù„Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©',
          onClick: function(e){ e.stopPropagation(); props.onMovePrev(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:14, padding:2, lineHeight:1 }
        }, 'â†'),
        /* Arrow right (next stage) */
        props.canMoveNext && h('button', {
          title: lang==='en' ? 'Move to next stage' : 'Ù†Ù‚Ù„ Ù„Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©',
          onClick: function(e){ e.stopPropagation(); props.onMoveNext(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.accent, fontSize:14, padding:2, lineHeight:1 }
        }, 'â†’'),
        h('button', {
          title: t('ops_finish_task'),
          onClick: function(e){
            e.stopPropagation();
            if (typeof props.onDone === 'function') {
              props.onDone(task);
              return;
            }
            alert(lang === 'en' ? 'This action is not available right now.' : 'هذه العملية غير متاحة حالياً.');
          },
          style:{
            border:'1px solid '+T.accent,
            background:T.accentDim,
            cursor:'pointer',
            color:T.accent,
            fontSize:12,
            padding:'2px 8px',
            lineHeight:1,
            borderRadius:999,
            fontWeight:700
          }
        }, t('ops_finish_task')),
        h('button', {
          title: t('edit'),
          onClick: function(e){ e.stopPropagation(); props.onEdit(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:13, padding:2, lineHeight:1 }
        }, 'âœŽ'),
        h('button', {
          title: t('delete'),
          onClick: function(e){ e.stopPropagation(); if(confirm(t('confirm_delete'))) props.onDelete(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:13, padding:2, lineHeight:1 }
        }, 'âœ•')
      )
    ),
    /* Customer + requester */
    h('div', { style:{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 } },
      task.customer_company || task.customer_name || '—'
    ),
    requestedBy && h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:4 } },
      (lang === 'en' ? 'Requested by: ' : 'طلبها: '), requestedBy
    ),
    /* Description */
    task.description && h('div', { style:{ fontSize:12, color:T.textMid, marginBottom:5, lineHeight:1.4 } },
      (lang === 'en' ? 'Brief: ' : 'بريف: '), task.description
    ),
    /* Footer: deadline + time */
    h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 } },
      assignees.map(function(nm, ix){
        return h(Badge, {
          key:'a_'+ix,
          label: '🧑 ' + nm,
          color: '#7c3aed',
        });
      }),
      task.deadline && h(Badge, {
        label: '🗓 ' + fmtDate(task.deadline, lang),
        color: isOverdue ? 'red' : 'blue',
      }),
      task.time && h(Badge, { label:'⏱ '+task.time, color:'gray' })
    )
  );
}

/* â”€â”€ OpsKanbanColumn: one stage column â”€â”€ */
function OpsKanbanColumn(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var stage = props.stage;
  var tasks = props.tasks;
  var _over = useState(false); var isOver = _over[0]; var setOver = _over[1];
  var _rename = useState(false); var renaming = _rename[0]; var setRenaming = _rename[1];
  var _rname = useState(stage.name); var rname = _rname[0]; var setRname = _rname[1];

  function submitRename() {
    if (!rname.trim()) { setRenaming(false); return; }
    apiFetch('ops-stages/' + stage.id, { method:'PUT', body:JSON.stringify({ name:rname.trim() }) })
      .then(function(){ setRenaming(false); props.onReload(); });
  }

  function deleteStage() {
    if (!confirm(t('ops_delete_stage') + '?')) return;
    apiFetch('ops-stages/' + stage.id, { method:'DELETE' })
      .then(function(){ props.onReload(); })
      .catch(function(e){ alert(e.message || t('ops_stage_has_tasks')); });
  }

  return h('div', {
    style:{
      width: '100%',
      minWidth: 250,
      flex: '1 1 280px',
      background: isOver ? T.accentDim : T.bgSub,
      border: '1px solid ' + (isOver ? T.accent : T.border),
      borderRadius: T.radiusLg,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color .15s, background .15s',
    },
    onDragOver: function(e){ e.preventDefault(); setOver(true); },
    onDragLeave: function(){ setOver(false); },
    onDrop: function(e){
      e.preventDefault(); setOver(false);
      var taskId = parseInt(e.dataTransfer.getData('text/plain'));
      if (taskId) props.onDropTask(taskId, stage);
    },
  },
    /* Column header */
    h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:10, flexShrink:0 } },
      renaming
        ? h('input', {
            autoFocus: true,
            value: rname,
            onChange: function(e){ setRname(e.target.value); },
            onKeyDown: function(e){ if(e.key==='Enter') submitRename(); if(e.key==='Escape') setRenaming(false); },
            onBlur: submitRename,
            style:{ flex:1, padding:'3px 8px', border:'1px solid '+T.accent, borderRadius:T.radius, fontSize:13, fontFamily:'inherit', background:T.bg, color:T.text }
          })
        : h('div', { style:{ fontWeight:700, fontSize:13, color:T.text, flex:1 } }, stage.name),
      h('span', { style:{ fontSize:11, color:T.textMute, background:T.border, borderRadius:99, padding:'1px 7px' } }, tasks.length),
      /* Rename button */
      h('button', {
        title: t('ops_rename_stage'), onClick:function(){ setRenaming(true); setRname(stage.name); },
        style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:12, padding:2 }
      }, 'âœŽ'),
      /* Delete button */
      h('button', {
        title: t('ops_delete_stage'), onClick: deleteStage,
        style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:12, padding:2 }
      }, 'ðŸ—‘')
    ),
    /* Task cards */
    h('div', { style:{ flex:1, paddingBottom:4 } },
      tasks.length === 0
        ? h('div', { style:{ color:T.textMute, fontSize:12, textAlign:'center', padding:'20px 0' } }, t('ops_no_tasks'))
        : tasks.map(function(task){
          return h(OpsTaskCard, {
              key: task.id,
              task: task,
              draggingId: props.draggingId,
              canMovePrev: props.stageIndex > 0,
              canReturnPrevDept: props.stageIndex === 0 && !!props.canReturnPrevDept,
              canMoveNext: props.stageIndex < props.totalStages - 1,
              onMovePrev: props.onMovePrev,
              onMoveNext: props.onMoveNext,
              onDone: props.onDone,
              onEdit: props.onEdit,
              onDelete: props.onDelete,
              employees: props.employees || [],
            });
          })
    ),
    /* + Add Task button at bottom of column */
    props.onAddTask && h('button', {
      onClick: function(){ props.onAddTask(stage); },
      style:{ width:'100%', padding:'8px', border:'1px dashed '+T.border, borderRadius:T.radius,
        background:'transparent', color:T.textMute, cursor:'pointer', fontSize:12, fontFamily:'inherit',
        marginTop:8, transition:'all .15s' },
      onMouseEnter: function(e){ e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.color=T.accent; },
      onMouseLeave: function(e){ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMute; }
    }, '+ '+(lang==='en'?'Add Task':'إضافة مهمة'))
  );
}


/* -- DeliveryOrdersView: mobile-friendly page for delivery agent -- */
function DeliveryOrdersView(props) {
  var bs = props.bootstrap || {};
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang; var isRtl = i18n.isRtl;
  var authUser = props.authUser || {};
  var employees = asArr(bs.employees);
  var deliveryOpsTasks = asArr(bs['ops-tasks'] || bs.ops_tasks || []);
  var notifyWa  = props.whatsappNotify || '';
  var debugDelivery = isDebugEnabled('cspsr_debug_delivery');
  function deliveryDebug(label, payload) {
    if (!debugDelivery) return;
    try { console.log('[CSPSR Delivery Debug] ' + label, payload || {}); } catch (_e) {}
  }

  useTopbar(t('delivery_orders'));

  /* Find employee linked to current user */
  var myEmp = employees.filter(function(e){ return String(e.user_id) === String(authUser.id); })[0];
  var isAdmin = !authUser.role || authUser.role === 'admin' || authUser.role_slug === 'admin' || authUser.is_admin == 1;

  function deliveryItemQueuedForPartial(item) {
    return !itemDelivered(item) && !!item.delivery_batch_id;
  }

  function deliveryOrderHasExplicitPartial(o) {
    var items = asArr(o.items);
    return items.length > 1 && items.some(deliveryItemQueuedForPartial);
  }

  /* Filter orders: ready to deliver or partial, assigned to me (admin sees all) */
  var orders = asArr(bs.orders).filter(function(o){
    if (isDone(o)) return false;
    if (!isAdmin && String(o.delivery_employee_id) !== String(myEmp && myEmp.id)) return false;
    return orderAtDelivery(o) || deliveryOrderHasExplicitPartial(o);
  });

  deliveryDebug('bootstrap', {
    authUser: authUser,
    employeeCount: employees.length,
    myEmployeeId: myEmp && myEmp.id,
    opsTaskCount: deliveryOpsTasks.length,
    orderCount: asArr(bs.orders).length,
    visibleOrderCount: orders.length
  });

  try {
    window.__CSPSR_DELIVERY_DEBUG__ = {
      authUser: authUser,
      bootstrap: bs,
      employees: employees,
      opsTasks: deliveryOpsTasks,
      orders: orders,
      myEmployee: myEmp || null
    };
  } catch (_err) {}

  function buildWaMsg(o) {
    var cust = getCust(o, lang);
    var items = asArr(o.items).map(function(i){ return (lang==='en'&&i.product_name_en?i.product_name_en:i.product_name||'')+'x'+i.quantity; }).join(', ');
    var addr = o.rec_address || o.recipient_address || o.delivery_address || '';
    var map  = o.rec_map || o.recipient_map_url || o.delivery_map_url || '';
    var phone = o.rec_phone || o.recipient_phone || '';
    var qrLink = ((cfg().site_url||'').replace(/\/+$/,'') || (location.origin||'')) + '/?cspsr_qr_contact=' + o.id;
    return encodeURIComponent(
      (lang==='en'?'Delivery Order':'طلب توصيل') + ': #' + o.order_number + '\n' +
      (lang==='en'?'Customer':'الزبون') + ': ' + cust + '\n' +
      (phone ? (lang==='en'?'Phone':'الهاتف') + ': ' + phone + '\n' : '') +
      (addr  ? (lang==='en'?'Address':'العنوان') + ': ' + addr + '\n' : '') +
      (items ? (lang==='en'?'Items':'المنتجات') + ': ' + items + '\n' : '') +
      (map   ? (lang==='en'?'Map':'الخريطة') + ': ' + map + '\n' : '') +
      (lang==='en'?'Details':'التفاصيل') + ': ' + qrLink
    );
  }

  if (!myEmp && !isAdmin) {
    return h('div', { style:{ padding:32, textAlign:'center', color:T.textMute } },
      h('div', { style:{ fontSize:40, marginBottom:12 } }, '🚚'),
      h('div', { style:{ fontSize:14, fontWeight:600 } },
        lang==='en' ? 'Your account is not linked to an employee profile.' : 'حسابك غير مرتبط بموظف في النظام.'
      )
    );
  }

  return h('div', { style:{ padding:'0 4px' } },
    orders.length === 0 && h(Card, { style:{ padding:40, textAlign:'center' } },
      h('div', { style:{ fontSize:48, marginBottom:12 } }, '🚚'),
      h('div', { style:{ color:T.textMute, fontSize:14 } }, t('no_delivery_orders'))
    ),
    orders.length > 0 && h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,alignItems:'start'}},
    orders.map(function(o) {
      var p = progOf(o);
      var cust = getCust(o, lang);
      var phone = o.rec_phone || o.recipient_phone || '';
      var addr  = o.rec_address || o.recipient_address || o.delivery_address || '';
      var map   = o.rec_map || o.recipient_map_url || o.delivery_map_url || '';
      var waPhone = phone.replace(/[^0-9]/g,'');
      var isPartial = deliveryOrderHasExplicitPartial(o);
      var readyItems = asArr(o.items).filter(function(item){ return deliveryItemQueuedForPartial(item); });
      var displayItems = isPartial ? readyItems : asArr(o.items);
      var secColor = isPartial ? '#d97706' : T.green;
      var secLabel = isPartial ? (lang==='en'?'Partial Delivery':'توصيل جزئي') : (lang==='en'?'Ready to Deliver':'جاهز للتوصيل');

      return h('div', { key:o.id },
      h(Card, { style:{ borderTop:'3px solid '+secColor, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 } },
                        /* Badge + order number */
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between'}},
          h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:12,color:secColor}},'#'+o.order_number),
          h('span',{style:{fontSize:10,fontWeight:600,color:secColor,background:isPartial?'#fef3c7':'#dcfce7',borderRadius:99,padding:'1px 7px'}},secLabel)
        ),
        h('div',{style:{fontSize:12,fontWeight:700,color:T.text}},cust),
        h('div',{style:{background:T.bgSub,borderRadius:99,height:4,overflow:'hidden',marginTop:4}},
          h('div',{style:{width:p+'%',background:p>=100?T.green:T.accent,height:'100%',borderRadius:99}})
        ),
        h('div',{style:{fontSize:10,color:T.textMute}},p+'%'),
        h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:8}},
          displayItems.map(function(item){
            var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'—');
            return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0'}},
              h('span',{style:{color:T.textMid,fontWeight:500}},iName),
              h('span',{style:{color:T.textMute,flexShrink:0}},'×'+item.quantity)
            );
          })
        ),
        h('div',{style:{display:'flex',gap:8,marginTop:8}},
          h('button',{
            onClick:function(){window.open(((cfg().site_url||'').replace(/\/+$/,'') || (location.origin||''))+'/?cspsr_qr_contact='+o.id+'&print=1','_blank');},
            style:{flex:1,padding:'9px 6px',background:T.bgSub,color:T.textMid,border:'1px solid '+T.border,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}
          },'🖨 '+(lang==='en'?'Print':'اطبع')),
          h('button',{
            onClick:function(){
              var itemIds=displayItems.map(function(item){return item.id;});
              apiFetch('orders/'+o.id+'/partial-deliver',{method:'POST',body:JSON.stringify({item_ids:itemIds})})
                .then(props.onSilentReload||props.onReload);
            },
            style:{flex:1,padding:'9px 6px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}
          },'✅ '+(lang==='en'?'Delivered':'تم التوصيل'))
        )
      ));
    })),

    /* External Tasks section */
    (function(){
      var myTasks = deliveryOpsTasks.filter(function(task){
        if (!(task.is_external == 1 && task.status !== 'done')) return false;
        if (!myEmp) return false;
        var ids = [];
        try { ids = typeof task.assigned_employee_ids === 'string' ? JSON.parse(task.assigned_employee_ids||'[]') : (task.assigned_employee_ids||[]); } catch(e){}
        ids = asArr(ids).map(function(x){ return String(x); });
        if ((!ids || !ids.length) && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
        return ids.indexOf(String(myEmp.id)) >= 0;
      });
      if (!myTasks.length) return null;
      return h('div', { style:{ marginTop:24 } },
        h('div',{style:{fontWeight:700,fontSize:14,color:T.text,marginBottom:10,display:'flex',alignItems:'center',gap:6}},
          '📋 '+(lang==='en'?'External Tasks':'المهام الخارجية'),
          h('span',{style:{background:T.accent,color:'#fff',borderRadius:99,padding:'1px 8px',fontSize:11}},myTasks.length)
        ),
        myTasks.map(function(task){
          return h(Card, { key:task.id, style:{ marginBottom:10, padding:'12px 14px' } },
            h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}},
              h('div',{style:{flex:1}},
                h('div',{style:{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}},task.title||task.description||'—'),
                task.description && task.title && h('div',{style:{fontSize:11,color:T.textMute,marginBottom:4}},task.description),
                task.deadline && h('div',{style:{fontSize:11,color:T.amber}},'🗓 '+(lang==='en'?'Due: ':'الموعد: ')+fmtDate(task.deadline,getLang()))
              ),
              h('button',{
                onClick:function(){
                  apiFetch('ops-tasks/'+task.id,{method:'PUT',body:JSON.stringify(Object.assign({},task,{status:'done'}))})
                    .then(props.onSilentReload||props.onReload);
                },
                style:{padding:'6px 12px',background:'#dcfce7',color:'#16a34a',border:'1px solid #bbf7d0',borderRadius:T.radius,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}
              },'✅ '+(lang==='en'?'Done':'تم'))
            )
          );
        })
      );
    })()
  );
}

/* â”€â”€ OperationsTasksView: main page â”€â”€ */
function OperationsTasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var departments = asArr(bs.departments);
  var employees = asArr(bs.employees);
  var debugOps = isDebugEnabled('cspsr_debug_ops');
  function opsDebug(label, payload) {
    if (!debugOps) return;
    try { console.log('[CSPSR Ops Debug] ' + label, payload || {}); } catch (e) {}
  }

  /* State */
  var _tab      = useState(departments.length ? String(departments[0].id) : '');
  var activeTab = _tab[0]; var setActiveTab = _tab[1];

  var _view     = useState('kanban'); /* 'kanban' | 'completed' */
  var view      = _view[0]; var setView = _view[1];

  var _stages   = useState([]); var stages = _stages[0]; var setStages = _stages[1];
  var _tasks    = useState([]); var tasks  = _tasks[0];  var setTasks  = _tasks[1];
  var _completed = useState([]); var completedTasks = _completed[0]; var setCompleted = _completed[1];
  var _completedMeta = useState({page:1,per_page:25,total:0,total_pages:1}); var completedMeta = _completedMeta[0]; var setCompletedMeta = _completedMeta[1];
  var _completedPage = useState(1); var completedPage = _completedPage[0]; var setCompletedPage = _completedPage[1];
  var _completedPerPage = useState(25); var completedPerPage = _completedPerPage[0]; var setCompletedPerPage = _completedPerPage[1];
  var _completedQ = useState(''); var completedQ = _completedQ[0]; var setCompletedQ = _completedQ[1];
  var _includeArchive = useState(0); var includeArchive = _includeArchive[0]; var setIncludeArchive = _includeArchive[1];
  var _itinerary = useState(null); var itineraryModal = _itinerary[0]; var setItineraryModal = _itinerary[1];
  
  var _loading  = useState(true); var loading = _loading[0]; var setLoading = _loading[1];
  var _dragging = useState(null); var draggingId = _dragging[0]; var setDraggingId = _dragging[1];

  var _form     = useState(null); var form = _form[0]; var setForm = _form[1];
  var _finalModal = useState(null); var finalModal = _finalModal[0]; var setFinalModal = _finalModal[1];
  /* { task, currentDeptId, nextDeptId } */
  var _backModal = useState(null); var backModal = _backModal[0]; var setBackModal = _backModal[1];
  /* { task, currentDeptId, prevDeptId } */
  var _moveModal = useState(null); var moveModal = _moveModal[0]; var setMoveModal = _moveModal[1];
  /* { task, stageId, direction } */
  var _deptEdgeModal = useState(null); var deptEdgeModal = _deptEdgeModal[0]; var setDeptEdgeModal = _deptEdgeModal[1];
  /* { task, edge:'first', prevDeptId } */
  var _deptMoveModal = useState(null); var deptMoveModal = _deptMoveModal[0]; var setDeptMoveModal = _deptMoveModal[1];
  /* { task, deptOptions, deptId, stageOptions, targetStageId, assignedEmployeeIds, deadline, linkedOrderId, requireOrderLink } */

  /* Load stages for active department */
  function loadStages(deptId) {
    if (!deptId) return;
    setLoading(true);
    apiFetch('departments/' + deptId + '/ops-stages')
      .then(function(d){ setStages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }

  /* Load all active tasks */
  function loadTasks() {
    apiFetch('ops-tasks')
      .then(function(d){ setTasks(Array.isArray(d) ? d : []); })
      .catch(function(){});
  }

  /* Load completed tasks */
  function loadCompleted() {
    var qp = [
      'page=' + encodeURIComponent(completedPage),
      'per_page=' + encodeURIComponent(completedPerPage)
    ];
    if (completedQ && String(completedQ).trim()) qp.push('q=' + encodeURIComponent(String(completedQ).trim()));
    if (includeArchive) qp.push('include_archive=1');
    apiFetch('ops-tasks/completed?' + qp.join('&'), { fresh:true })
      .then(function(d){
        if (d && Array.isArray(d.items) && d.meta) {
          setCompleted(d.items);
          setCompletedMeta({
            page: parseInt(d.meta.page,10) || 1,
            per_page: parseInt(d.meta.per_page,10) || completedPerPage,
            total: parseInt(d.meta.total,10) || 0,
            total_pages: parseInt(d.meta.total_pages,10) || 1
          });
        } else {
          var arr = Array.isArray(d) ? d : [];
          setCompleted(arr);
          setCompletedMeta({page:1,per_page:arr.length || completedPerPage,total:arr.length,total_pages:1});
        }
      })
      .catch(function(){});
  }

  function openItinerary(task) {
    if (!task) return;
    setItineraryModal({ task: task, loading: true, error: '', data: null });
    apiFetch('ops-tasks/' + task.id + '/timeline')
      .then(function(d){
        setItineraryModal({ task: task, loading: false, error: '', data: d || {} });
      })
      .catch(function(e){
        setItineraryModal({
          task: task,
          loading: false,
          error: (e && e.message) ? e.message : (lang === 'en' ? 'Could not load itinerary.' : 'تعذر تحميل المسار.'),
          data: null
        });
      });
  }

  function formatOpsDeadline(v) {
    if (!v) return '—';
    return String(v).indexOf(':') >= 0 ? fmtDateTime(v, lang) : fmtDate(v, lang);
  }

  function toDateTimeLocalValue(v) {
    if (!v) return '';
    try {
      var d = parseServerDate(v);
      if (!d || !isFinite(d.getTime())) return '';
      var pad = function(n){ return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return ''; }
  }

  function taskAssigneeNames(task) {
    if (!task) return [];
    if (Array.isArray(task.assigned_employees) && task.assigned_employees.length) {
      return task.assigned_employees.map(function(e){
        return (lang==='en' && e.name_en) ? e.name_en : (e.name || e.name_en || '');
      }).filter(Boolean);
    }
    var ids = [];
    try { ids = Array.isArray(task.assigned_employee_ids) ? task.assigned_employee_ids : (task.assigned_employee_ids ? JSON.parse(task.assigned_employee_ids || '[]') : []); } catch(e){}
    if ((!ids || !ids.length) && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
    var names = asArr(ids).map(function(v){
      var emp = findBy(asArr(bs.employees), 'id', parseInt(v, 10));
      return emp ? ln(emp, lang) : '';
    }).filter(Boolean);
    if (!names.length && (task.assigned_employee_name || task.assigned_employee_name_en)) {
      names = [ (lang==='en' && task.assigned_employee_name_en) ? task.assigned_employee_name_en : (task.assigned_employee_name || task.assigned_employee_name_en) ];
    }
    return names;
  }

  function opsTimelineLabel(type) {
    var map = {
      task_created: lang === 'en' ? 'Task created' : 'تم إنشاء المهمة',
      task_moved: lang === 'en' ? 'Task moved' : 'تم نقل المهمة',
      task_completed: lang === 'en' ? 'Task completed' : 'تم إكمال المهمة',
      task_reopened: lang === 'en' ? 'Task reopened' : 'إعادة فتح المهمة',
    };
    return map[type] || type || '—';
  }

  function opsTimelineDetails(evt) {
    var p = (evt && evt.payload) || {};
    var lines = [];
    if (!evt) return lines;
    if (evt.event_type === 'task_created') {
      if (p.department_name || p.stage_name) {
        lines.push((lang === 'en' ? 'Created in: ' : 'تم الإنشاء في: ') + [p.department_name, p.stage_name].filter(Boolean).join(' / '));
      }
    }
    if (evt.event_type === 'task_moved') {
      var fromTxt = [p.from_department_name, p.from_stage_name].filter(Boolean).join(' / ');
      var toTxt = [p.to_department_name, p.to_stage_name].filter(Boolean).join(' / ');
      if (fromTxt || toTxt) {
        lines.push((lang === 'en' ? 'Moved:' : 'نُقلت: ') + ' ' + (fromTxt || '—') + ' → ' + (toTxt || '—'));
      }
    }
    if (evt.event_type === 'task_completed' && (p.department_name || p.stage_name)) {
      lines.push((lang === 'en' ? 'Completed in: ' : 'اكتملت في: ') + [p.department_name, p.stage_name].filter(Boolean).join(' / '));
    }
    return lines;
  }

  function reload() { loadStages(activeTab); loadTasks(); }
  function openNewTaskModal() {
    setForm({ _targetDeptId: String(activeTab || '') });
  }

  useEffect(function(){
    if (activeTab) loadStages(activeTab);
  }, [activeTab]);

  useEffect(function(){
    loadTasks();
  }, []);

  useEffect(function(){
    if (view === 'completed') loadCompleted();
  }, [view, completedPage, completedPerPage, completedQ, includeArchive]);
  useEffect(function(){ setCompletedPage(1); }, [completedQ, completedPerPage, includeArchive]);

  /* Stats for topbar */
  var totalTasks  = tasks.length;
  var totalStagesCount = stages.length;

  useTopbar(t('operations_tasks'), h('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
    h(Btn, { variant: view==='kanban'    ? 'primary' : 'secondary', size:'sm', onClick:function(){ setView('kanban'); } },
      (lang==='en' ? '⚙ Board' : '⚙ اللوحة')),
    h(Btn, { variant: view==='completed' ? 'primary' : 'secondary', size:'sm', onClick:function(){ setView('completed'); } },
      t('ops_completed_tasks')),
    h(Btn, { variant:'primary', onClick:openNewTaskModal }, '+ '+t('ops_new_task'))
  ));

  /* â”€â”€ Completed Tasks view â”€â”€ */
  var completedViewNode = null;
  if (view === 'completed') {
    var completedCols = [
      { key:'task_no', label:t('ops_task_no'), render:function(r){ return h('code',{style:{color:T.accent,fontWeight:700}},r.task_no); } },
      { key:'customer', label:t('customer'), render:function(r){ return r.customer_company||r.customer_name||'â€”'; } },
      { key:'requested_by', label: lang==='en' ? 'Requested by' : 'الطلب من', render:function(r){ return r.contact_person_name || 'â€”'; } },
      { key:'created_by', label: lang==='en' ? 'Created by' : 'أنشأها', render:function(r){ return r.created_by_name || r.created_by_username || 'â€”'; } },
      { key:'assigned_to', label: lang==='en' ? 'Assigned to' : 'المسندة إلى', render:function(r){
        var names = taskAssigneeNames(r);
        return names.length ? names.join('، ') : 'â€”';
      } },
      { key:'deadline', label:t('deadline'), render:function(r){
        return formatOpsDeadline(r.deadline);
      }},
      { key:'time', label:t('ops_time'), render:function(r){ return r.time||'â€”'; } },
      { key:'completed_at', label:t('ops_completed_at'), render:function(r){ return isOpsTaskCompleted(r) ? fmtDateTime(r.completed_at, lang) : 'â€”'; } },
      { key:'status', label:t('status'), render:function(r){
        if (!r.deadline || !isOpsTaskCompleted(r)) return 'â€”';
        var onTime = new Date(r.completed_at) <= new Date(r.deadline);
        return h(Badge, { label: onTime ? t('ops_on_time') : t('ops_delayed'), color: onTime ? 'green' : 'red' });
      }},
    ];
    completedViewNode = h('div', null,
      h(Card,{style:{padding:10,marginBottom:10}},
        h('div',{style:{display:'grid',gridTemplateColumns:'2fr 140px 170px',gap:10,alignItems:'end'}},
          h(Input,{
            label:lang==='en'?'Search completed tasks':'بحث المهام المكتملة',
            value:completedQ,
            placeholder:lang==='en'?'Task no, customer, employee...':'رقم المهمة، الزبون، الموظف...',
            onChange:setCompletedQ
          }),
          h(Select,{
            label:lang==='en'?'Per page':'لكل صفحة',
            value:String(completedPerPage),
            onChange:function(v){ setCompletedPerPage(parseInt(v,10)||25); },
            options:[{value:'10',label:'10'},{value:'25',label:'25'},{value:'50',label:'50'},{value:'100',label:'100'}]
          }),
          h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,paddingBottom:8}},
            h('input',{
              type:'checkbox',
              checked:includeArchive==1,
              onChange:function(e){ setIncludeArchive(e.target.checked?1:0); },
              style:{accentColor:T.accent}
            }),
            lang==='en' ? 'Include archive' : 'ضمن الأرشيف'
          )
        )
      ),
      h(DataTable, {
        columns: completedCols,
        rows: completedTasks,
        actions: function(r){
          var archived = parseInt(r.is_archived,10) === 1;
          return h('div', { style:{ display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end', flexWrap:'wrap' } },
            archived && h(Badge,{label:lang==='en'?'Archived':'مؤرشف',color:'gray'}),
            h(Btn, { size:'sm', variant:'secondary', onClick:function(){ openItinerary(r); } }, lang === 'en' ? 'Itinerary' : 'المسار'),
            h(Btn, { size:'sm', variant:'primary',
              disabled: archived,
              onClick:function(){
                if (archived) return;
                if (!confirm(lang==='en'?'Restore this task to active board?':'استرجاع هذه المهمة إلى اللوحة النشطة؟')) return;
                apiFetch('ops-tasks/'+r.id+'/restore',{method:'POST'}).then(function(){ loadCompleted(); loadTasks(); });
              }
            }, t('ops_restore')),
            h(Btn, { size:'sm', variant:'secondary',
              disabled: archived,
              onClick:function(){
                if (archived) return;
                if (!confirm(lang==='en'?'Reopen this task?':'Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ù‡Ù…Ø©ØŸ')) return;
                apiFetch('ops-tasks/'+r.id+'/reopen',{method:'POST'}).then(function(){ loadCompleted(); loadTasks(); });
              }
            }, t('ops_reopen'))
          );
        }
      }),
      h(PagerControls,{
        page:completedMeta.page,
        totalPages:completedMeta.total_pages,
        total:completedMeta.total,
        onPageChange:setCompletedPage,
        lang:lang
      }),
      itineraryModal && h(Modal, {
        title: lang === 'en' ? 'Task itinerary' : 'مسار المهمة',
        subtitle: itineraryModal.task ? (itineraryModal.task.task_no || '') : '',
        width: 900,
        onClose: function(){ setItineraryModal(null); },
        footer: h(Btn, { variant:'secondary', onClick:function(){ setItineraryModal(null); } }, lang === 'en' ? 'Close' : 'إغلاق')
      },
        itineraryModal.loading
          ? h('div', { style:{ padding:'24px', textAlign:'center', color:T.textMute } }, lang === 'en' ? 'Loading itinerary...' : 'جاري تحميل المسار...')
          : itineraryModal.error
            ? h('div', { style:{ padding:'24px', textAlign:'center', color:T.red } }, itineraryModal.error)
            : (function(){
                var data = itineraryModal.data || {};
                var task = data.task || itineraryModal.task || {};
                var currentPos = data.current_position || null;
                var events = asArr(data.events);
                return h('div', { style:{ display:'flex', flexDirection:'column', gap:14, paddingBottom:4 } },
                  h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:10 } },
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, lang === 'en' ? 'Customer' : 'الزبون'),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, task.customer_company || task.customer_name || '—')
                    ),
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, lang === 'en' ? 'Requested by' : 'طلبها'),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, task.contact_person_name || '—')
                    ),
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, lang === 'en' ? 'Created by' : 'أنشأها'),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, task.created_by_name || task.created_by_username || '—')
                    ),
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, lang === 'en' ? 'Assigned to' : 'مسندة إلى'),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, (taskAssigneeNames(task).length ? taskAssigneeNames(task).join('، ') : '—'))
                    ),
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, t('deadline')),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, formatOpsDeadline(task.deadline))
                    ),
                    h('div', { style:{ padding:12, background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius } },
                      h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, t('ops_completed_at')),
                      h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } }, isOpsTaskCompleted(task) ? fmtDateTime(task.completed_at, lang) : '—')
                    )
                  ),
                  h('div', { style:{ padding:12, background:'#f8fafc', border:'1px solid '+T.border, borderRadius:T.radius } },
                    h('div', { style:{ fontSize:11, color:T.textMute, marginBottom:6 } }, lang === 'en' ? 'Current position' : 'الموقع الحالي'),
                    h('div', { style:{ fontSize:13, fontWeight:700, color:T.text } },
                      currentPos ? ((currentPos.department_name || '—') + ' / ' + (currentPos.stage_name || '—')) : '—'
                    ),
                    currentPos && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:4 } },
                      (lang === 'en' ? 'Sort order' : 'ترتيب العرض') + ': ' + (currentPos.sort_order != null ? currentPos.sort_order : '—')
                    )
                  ),
                  h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
                    h('div', { style:{ fontSize:14, fontWeight:700, color:T.text } }, lang === 'en' ? 'Timeline' : 'الخط الزمني'),
                    h('div', { style:{ fontSize:12, color:T.textMute } }, events.length ? (events.length + ' ' + (lang === 'en' ? 'events' : 'حدث')) : (lang === 'en' ? 'No history recorded yet' : 'لا يوجد سجل حتى الآن'))
                  ),
                  events.length === 0
                    ? h('div', { style:{ padding:14, border:'1px dashed '+T.border, borderRadius:T.radius, color:T.textMute, textAlign:'center' } },
                        lang === 'en' ? 'No timeline events were recorded for this task.' : 'لا توجد أحداث مسجلة لهذه المهمة.'
                      )
                    : h('div', { style:{ display:'flex', flexDirection:'column', gap:10, maxHeight:360, overflowY:'auto', paddingRight:2 } },
                        events.map(function(evt, idx){
                          var prev = idx > 0 ? events[idx - 1] : null;
                          var gap = null;
                          if (prev) {
                            var c = parseServerDate(evt.event_time || evt.created_at || '');
                            var p = parseServerDate(prev.event_time || prev.created_at || '');
                            if (!isNaN(c) && !isNaN(p)) gap = Math.max(0, Math.round((c - p) / 60000));
                          }
                          return h('div', { key: evt.id || idx, style:{ padding:12, border:'1px solid '+T.border, borderRadius:T.radius, background:T.bgSub } },
                            h('div', { style:{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' } },
                              h('div', null,
                                h('div', { style:{ fontWeight:700, fontSize:13, color:T.text, marginBottom:4 } }, opsTimelineLabel(evt.event_type)),
                                h('div', { style:{ fontSize:11, color:T.textMute } }, evt.created_by_name ? ((lang === 'en' ? 'By' : 'بواسطة') + ': ' + evt.created_by_name) : (lang === 'en' ? 'By: system' : 'بواسطة: النظام'))
                              ),
                              h('div', { style:{ textAlign:'right' } },
                                h('div', { style:{ fontSize:12, color:T.text } }, fmtDateTime(evt.event_time, lang)),
                                gap !== null && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:2 } }, (lang === 'en' ? 'Gap' : 'الفاصل') + ': ' + fmtMin(gap))
                              )
                            ),
                            opsTimelineDetails(evt).length > 0 && h('div', { style:{ marginTop:8, display:'flex', flexDirection:'column', gap:4, color:T.textMid, fontSize:12, lineHeight:1.5 } },
                              opsTimelineDetails(evt).map(function(line, i){ return h('div', { key: i }, line); })
                            )
                          );
                        })
                      )
                );
              })()
      )
    );
  }

  /* â”€â”€ Kanban view â”€â”€ */
  var activeDept = findBy(departments, 'id', parseInt(activeTab));

  /* Get tasks positioned in this specific stage */
  function tasksInStage(stageId) {
    var positioned = tasks.filter(function(task){
      var pos = asArr(task.positions).find(function(p){ return String(p.department_id) === String(activeTab); });
      return pos && String(pos.stage_id) === String(stageId);
    }).sort(function(a,b){
      var pa = asArr(a.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
      var pb = asArr(b.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
      return (pa?parseInt(pa.sort_order):0) - (pb?parseInt(pb.sort_order):0);
    });
    return positioned;
  }

  /* Find previous/next department in sequence */
  function isPrintingDeptById(deptId) {
    var d = findBy(departments, 'id', parseInt(deptId, 10));
    if (!d) return false;
    var nm = ((d.name || '') + ' ' + (d.name_en || '')).toLowerCase();
    return nm.indexOf('print') >= 0 || nm.indexOf('production') >= 0 || nm.indexOf('طباعة') >= 0 || nm.indexOf('انتاج') >= 0 || nm.indexOf('إنتاج') >= 0;
  }

  function activeOrdersForLink() {
    return asArr(bs.orders).filter(function(o){
      return !isDone(o);
    });
  }

  function getNextDept(currentDeptId) {
    var idx = departments.findIndex(function(d){ return String(d.id)===String(currentDeptId); });
    if (idx < 0 || idx >= departments.length - 1) return null;

    /* Department flow rule: skip next dept if task has no linked_order_id AND next dept name contains 'Ø·Ø¨Ø§Ø¹' or 'print' */
    /* Note: The rule checks by name heuristic â€” exact dept marked as Production in app context */
    return departments[idx + 1] || null;
  }

  function getPrevDept(currentDeptId) {
    var idx = departments.findIndex(function(d){ return String(d.id)===String(currentDeptId); });
    if (idx <= 0) return null;
    return departments[idx - 1] || null;
  }
  function moveDepartmentOptions(currentDeptId) {
    return departments.filter(function(d){ return String(d.id) !== String(currentDeptId); });
  }

  function employeesForDept(deptId) {
    return asArr(bs.employees).filter(function(emp){
      return String(emp.department_id || '') === String(deptId || '');
    });
  }

  function employeeOptionsForTask(preferredDeptId) {
    return employeesForDept(preferredDeptId).map(function(emp){
      return { value: String(emp.id), label: ln(emp, lang) };
    });
  }

  function defaultEmployeeForDept(deptId) {
    var list = employeesForDept(deptId);
    return list.length ? String(list[0].id) : '';
  }

  function currentStageIndex(task) {
    var pos = asArr(task.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
    if (!pos) return -1;
    return stages.findIndex(function(s){ return String(s.id) === String(pos.stage_id); });
  }

  function currentStageForTask(task) {
    var idx = currentStageIndex(task);
    return idx >= 0 ? stages[idx] : null;
  }

  function openFinalStageModal(task) {
    if (!task) return;
    var nextDept = getNextDept(activeTab);
    var deptOptions = moveDepartmentOptions(activeTab);
    var nextDeptId = nextDept ? String(nextDept.id) : (deptOptions[0] ? String(deptOptions[0].id) : '');
    if (!nextDeptId) {
      setFinalModal({
        task: task,
        currentDeptId: activeTab,
        nextDeptId: '',
        deptOptions: deptOptions,
        stageOptions: [],
        targetStageId: '',
        assignedEmployeeIds: [],
        requireOrderLink: false,
        linkedOrderId: task.linked_order_id ? String(task.linked_order_id) : '',
        deadline: toDateTimeLocalValue(task.deadline)
      });
      return;
    }
    apiFetch('departments/' + nextDeptId + '/ops-stages')
      .then(function(list){
        var stageOptions = Array.isArray(list) ? list : [];
        var isPrintingDest = isPrintingDeptById(nextDeptId);
        var defaultStage = isPrintingDest ? '' : (stageOptions.length ? String(stageOptions[0].id) : '');
        var defaultEmp = defaultEmployeeForDept(nextDeptId);
        var requireOrderLink = !!(isPrintingDest && !task.linked_order_id);
        setFinalModal({
          task: task,
          currentDeptId: activeTab,
          nextDeptId: String(nextDeptId),
          deptOptions: deptOptions,
          stageOptions: stageOptions,
          targetStageId: defaultStage,
          assignedEmployeeIds: defaultEmp ? [String(defaultEmp)] : [],
          requireOrderLink: requireOrderLink,
          linkedOrderId: task.linked_order_id ? String(task.linked_order_id) : '',
          deadline: toDateTimeLocalValue(task.deadline)
        });
      });
  }

  function moveTaskToStage(taskId, stage, deadline, afterMove) {
    if (!stage) return;
    var payload = {
      stage_id: stage.id,
      department_id: parseInt(activeTab, 10),
      deadline: deadline || null,
      sort_order: 0
    };
    opsDebug('moveTaskToStage:request', { taskId: taskId, payload: payload });
    apiFetch('ops-tasks/' + taskId + '/move', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(function(){
      opsDebug('moveTaskToStage:success', { taskId: taskId, stageId: stage.id, deadline: deadline || null });
      if (typeof afterMove === 'function') afterMove();
      loadTasks();
    }).catch(function(e){
      opsDebug('moveTaskToStage:error', { taskId: taskId, message: (e && e.message) ? e.message : e });
      alert((e && e.message) ? e.message : (lang==='en' ? 'Move failed' : 'فشل النقل'));
    });
  }

  function moveTaskToDept(taskId, deptId, employeeIds, deadline, afterMove, targetStageId, linkedOrderId) {
    if (!deptId) return;
    var picked = Array.isArray(employeeIds) ? employeeIds : (employeeIds ? [employeeIds] : []);
    var normalizedIds = asArr(picked).map(function(v){ return String(v); }).filter(function(v){ return !!v; });
    var printingDest = isPrintingDeptById(deptId);
    opsDebug('moveTaskToDept:prepare', {
      taskId: taskId,
      deptId: deptId,
      employeeIds: normalizedIds,
      deadline: deadline || null,
      targetStageId: targetStageId || null,
      linkedOrderId: linkedOrderId || null,
      printingDest: printingDest
    });
    apiFetch('departments/' + deptId + '/ops-stages')
      .then(function(nextStages){
        var stageList = Array.isArray(nextStages) ? nextStages : [];
        var targetStage = null;
        if (targetStageId) {
          targetStage = stageList.find(function(s){ return String(s.id) === String(targetStageId); }) || null;
        }
        if (!targetStage) targetStage = stageList.length ? stageList[0] : null;
        if (!targetStage) {
          if (!printingDest) {
            throw new Error(lang==='en' ? 'No stages found in destination department.' : 'لا توجد مراحل في القسم الوجهة.');
          }
          if (!linkedOrderId) {
            throw new Error(lang==='en' ? 'Printing destination requires linked order.' : 'النقل إلى قسم الطباعة يتطلب ربط المهمة بطلب.');
          }
          return apiFetch('ops-tasks/' + taskId + '/complete', {
            method: 'POST',
            body: JSON.stringify({
              linked_order_id: parseInt(linkedOrderId, 10),
              deadline: deadline || null
            })
          }).then(function(){ return { mode: 'completed' }; });
        }
        return apiFetch('ops-tasks/' + taskId + '/move', {
          method: 'POST',
          body: JSON.stringify({
            stage_id: targetStage.id,
            department_id: parseInt(deptId, 10),
            assigned_employee_id: normalizedIds.length ? parseInt(normalizedIds[0], 10) : null,
            assigned_employee_ids: normalizedIds,
            linked_order_id: linkedOrderId ? parseInt(linkedOrderId, 10) : null,
            deadline: deadline || null,
            sort_order: 0
          })
        }).then(function(){ return { mode: 'moved' }; });
      })
      .then(function(result){
        opsDebug('moveTaskToDept:success', { taskId: taskId, result: result || { mode: 'moved' } });
        var moveResult = result || { mode: 'moved' };
        if (typeof afterMove === 'function') afterMove(moveResult);
        loadTasks();
        if (moveResult.mode === 'completed' && typeof loadCompleted === 'function') {
          loadCompleted();
        }
      })
      .catch(function(e){
        opsDebug('moveTaskToDept:error', { taskId: taskId, message: (e && e.message) ? e.message : e });
        alert((e && e.message) ? e.message : (lang==='en' ? 'Move failed' : 'فشل النقل'));
      });
  }

  function openBackDeptModal(task, prevDept) {
    var deptOptions = moveDepartmentOptions(activeTab);
    var initialDeptId = prevDept ? String(prevDept.id) : (deptOptions[0] ? String(deptOptions[0].id) : '');
    if (!initialDeptId) return;
    apiFetch('departments/' + initialDeptId + '/ops-stages')
      .then(function(list){
        var stageList = Array.isArray(list) ? list : [];
        var defaultStage = stageList.length ? stageList[stageList.length - 1] : null;
        setBackModal({
          task: task,
          currentDeptId: activeTab,
          deptOptions: deptOptions,
          prevDeptId: String(initialDeptId),
          stageOptions: stageList,
          stageId: defaultStage ? String(defaultStage.id) : '',
          assignedEmployeeIds: defaultEmployeeForDept(initialDeptId) ? [String(defaultEmployeeForDept(initialDeptId))] : [],
          deadline: toDateTimeLocalValue(task.deadline)
        });
      });
  }

  function openStagePicker(task, direction) {
    var idx = currentStageIndex(task);
    if (idx < 0 || stages.length === 0) return;
    var fallbackIdx = direction === 'prev'
      ? Math.max(0, idx - 1)
      : Math.min(stages.length - 1, idx + 1);
    var fallbackStage = stages[fallbackIdx] || stages[idx];
    setMoveModal({
      task: task,
      direction: direction,
      stageId: fallbackStage ? String(fallbackStage.id) : '',
      deadline: toDateTimeLocalValue(task.deadline)
    });
  }

  /* Drop a task into a stage */
  function handleDropTask(taskId, stage) {
    setDraggingId(null);
    var taskObj = tasks.find(function(t){ return String(t.id) === String(taskId); }) || null;
    if (!taskObj || !stage) return;
    // Apply the same transition scenario everywhere: ask before moving (or marking as done).
    setMoveModal({
      task: taskObj,
      direction: 'drop',
      stageId: String(stage.id),
      deadline: toDateTimeLocalValue(taskObj.deadline)
    });
  }

  /* Move task to previous stage via arrow */
  function handleMovePrev(task) {
    var currentIdx = currentStageIndex(task);
    if (currentIdx <= 0) {
      var prevDept = getPrevDept(activeTab);
      setDeptEdgeModal({
        task: task,
        edge: 'first',
        prevDeptId: prevDept ? String(prevDept.id) : ''
      });
      return;
    }
    openStagePicker(task, 'prev');
  }

  /* Move task to next stage via arrow (triggers final-stage modal if applicable) */
  function handleMoveNext(task) {
    var currentIdx = currentStageIndex(task);
    if (currentIdx < 0) return;
    if (currentIdx >= stages.length - 1) {
      /* Already at last stage â€” show unified final decision modal */
      openFinalStageModal(task);
      return;
    }
    openStagePicker(task, 'next');
  }

  function handleMarkDone(task) {
    if (!task) return;
    apiFetch('ops-tasks/' + task.id + '/complete', { method:'POST', body: JSON.stringify({}) })
      .then(function(){
        loadTasks();
        loadCompleted();
      })
      .catch(function(e){
        alert((e && e.message) ? e.message : (lang === 'en' ? 'Could not mark task as done.' : 'تعذر إكمال المهمة.'));
      });
  }

  function openDeptMoveModal(task) {
    if (!task) return;
    var deptOptions = moveDepartmentOptions(activeTab);
    var nextDept = getNextDept(activeTab);
    var initialDeptId = nextDept ? String(nextDept.id) : (deptOptions[0] ? String(deptOptions[0].id) : '');
    if (!initialDeptId) return;
    apiFetch('departments/' + initialDeptId + '/ops-stages')
      .then(function(list){
        var stageList = Array.isArray(list) ? list : [];
        var isPrintingDest = isPrintingDeptById(initialDeptId);
        var defaultStage = isPrintingDest ? '' : (stageList.length ? String(stageList[0].id) : '');
        var defaultEmp = defaultEmployeeForDept(initialDeptId);
        var linkedOrderId = task.linked_order_id ? String(task.linked_order_id) : '';
        var requireOrderLink = !!(isPrintingDest && !linkedOrderId);
        setDeptMoveModal({
          task: task,
          deptOptions: deptOptions,
          deptId: String(initialDeptId),
          stageOptions: stageList,
          targetStageId: defaultStage,
          assignedEmployeeIds: defaultEmp ? [String(defaultEmp)] : [],
          deadline: toDateTimeLocalValue(task.deadline),
          linkedOrderId: linkedOrderId,
          requireOrderLink: requireOrderLink
        });
      });
  }

  /* Add a stage */
  function addStage() {
    var name = prompt(lang==='en' ? 'Stage name:' : 'Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø­Ù„Ø©:');
    if (!name || !name.trim()) return;
    apiFetch('departments/' + activeTab + '/ops-stages', { method:'POST', body:JSON.stringify({ name:name.trim() }) })
      .then(function(){ loadStages(activeTab); });
  }

  /* Delete a task */
  function deleteTask(task) {
    apiFetch('ops-tasks/' + task.id, { method:'DELETE' }).then(function(){ loadTasks(); });
  }

  useEffect(function(){
    if (!debugOps || typeof window === 'undefined') return;
    window.__CSPSR_OPS_DEBUG__ = {
      activeTab: activeTab,
      getTasks: function(){ return tasks; },
      getStages: function(){ return stages; },
      moveModal: moveModal,
      backModal: backModal,
      finalModal: finalModal
    };
    opsDebug('window.__CSPSR_OPS_DEBUG__ ready', window.__CSPSR_OPS_DEBUG__);
  }, [debugOps, activeTab, tasks, stages, moveModal, backModal, finalModal]);

  var kanbanViewNode = h('div', null,
    /* Department tabs */
    h('div', { style:{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center' } },
      departments.map(function(dept){
        var active = String(dept.id) === String(activeTab);
        return h('button', {
          key: dept.id,
          onClick: function(){ setActiveTab(String(dept.id)); },
          style:{
            padding:'6px 16px', borderRadius:T.radius, border:'1px solid '+(active?T.accent:T.border),
            background: active ? T.accent : T.bg,
            color: active ? '#fff' : T.textMid,
            fontWeight: active ? 700 : 400,
            cursor:'pointer', fontSize:13, fontFamily:'inherit',
            transition:'all .15s',
          }
        }, h('span', { style:{ display:'flex', alignItems:'center', gap:6 } },
          dept.color && h('span', { style:{ width:8, height:8, borderRadius:'50%', background:dept.color, display:'inline-block' } }),
          ln(dept, lang)
        ));
      }),
      h(Btn, { size:'sm', variant:'secondary', onClick:addStage }, '+ '+t('ops_add_stage')),
      h(Btn, { size:'sm', variant:'primary', onClick:openNewTaskModal }, '+ '+t('ops_new_task'))
    ),

    /* Kanban board */
    loading
      ? h(PageLoader)
      : stages.length === 0
        ? h(Card, { style:{ padding:40, textAlign:'center' } },
            h('div', { style:{ fontSize:32, marginBottom:10 } }, 'LIST'),
            h('div', { style:{ color:T.textMute } }, t('ops_no_stages'))
          )
        : h('div', {
            style:{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
              gap:14,
              paddingBottom:16,
              alignItems:'start'
            },
            onDragStart: function(e){ setDraggingId(parseInt(e.dataTransfer.getData('text/plain'))||null); },
            onDragEnd:   function(){ setDraggingId(null); },
          },
            stages.map(function(stage, si){
              return h(OpsKanbanColumn, {
                key: stage.id,
                stage: stage,
                tasks: tasksInStage(stage.id),
                draggingId: draggingId,
                stageIndex: si,
                totalStages: stages.length,
                canReturnPrevDept: !!getPrevDept(activeTab),
                onDropTask: handleDropTask,
                onMovePrev: handleMovePrev,
                onMoveNext: handleMoveNext,
                onDone: handleMarkDone,
                onEdit: function(task){ setForm(Object.assign({}, task)); },
                onDelete: deleteTask,
                employees: asArr((props.bootstrap || {}).employees),
                onReload: function(){ loadStages(activeTab); loadTasks(); },
                onAddTask: function(){ setForm({ _targetStageId: stage.id, _targetDeptId: activeTab }); },
              });
            })
          ),

    /* Create/Edit task form */
    form !== null && h(OpsTaskForm, {
      task: form.id ? form : null,
      bootstrap: props.bootstrap,
      authUser: props.authUser,
      defaultDepartmentId: String(form._targetDeptId || activeTab || ''),
      onClose: function(){ setForm(null); },
      onSaved: function(newTaskId){
        /* If created from a specific stage button, move the task there */
        if (!form.id && form._targetStageId && newTaskId) {
          apiFetch('ops-tasks/'+newTaskId+'/move', {
            method:'POST',
            body: JSON.stringify({ stage_id: parseInt(form._targetStageId), department_id: parseInt(form._targetDeptId||activeTab), sort_order:0 })
          }).then(function(){ setForm(null); reload(); });
        } else {
          setForm(null); reload();
        }
      },
    }),

    /* Stage chooser modal */
    moveModal && h(
      Modal,
      {
        title: lang === 'en' ? 'Transition' : 'انتقال',
        onClose: function(){ setMoveModal(null); },
        width: 420,
        footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center' } },
          h(Btn, { variant:'secondary', onClick:function(){ setMoveModal(null); } }, t('cancel')),
          h(Btn, { variant:'primary', onClick:function(){
            var task = moveModal.task;
            if (!task) return;
            apiFetch('ops-tasks/' + task.id + '/complete', { method:'POST', body: JSON.stringify({}) })
              .then(function(){
                setMoveModal(null);
                loadTasks();
                loadCompleted();
              })
              .catch(function(e){
                alert((e && e.message) ? e.message : (lang === 'en' ? 'Could not mark task as done.' : 'تعذر إكمال المهمة.'));
              });
          }}, t('ops_finish_task')),
          h(Btn, { variant:'warning', onClick:function(){
            var task = moveModal.task;
            setMoveModal(null);
            openDeptMoveModal(task);
          }}, lang === 'en' ? 'Move to Department' : 'نقل إلى قسم'),
          h(Btn, {
            variant:'success',
            onClick:function(){
              var task = moveModal.task;
              var stage = stages.find(function(s){ return String(s.id) === String(moveModal.stageId); });
              if (!task || !stage) return;
              if (!moveModal.deadline) {
                alert(lang === 'en' ? 'Please set a deadline for this transition.' : 'يرجى تحديد موعد نهائي جديد لهذه النقلة.');
                return;
              }
              var isLastTarget = stages.findIndex(function(s){ return String(s.id) === String(stage.id); }) === (stages.length - 1);
              moveTaskToStage(task.id, stage, moveModal.deadline, function(){
                setMoveModal(null);
                if (moveModal.direction === 'next' && isLastTarget) openFinalStageModal(task);
              });
            }
          }, lang === 'en' ? 'Move' : 'نقل')
        )
      },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
        h('div', { style:{ fontSize:13, color:T.textMid, lineHeight:1.6 } },
          lang === 'en'
            ? 'Choose one action: move to a stage, mark as done, or move to another department.'
            : 'اختر إجراء واحد: نقل إلى ستيج، إكمال المهمة، أو نقل إلى قسم آخر.'
        ),
        h('div', { style:{ padding:'10px 12px', background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, color:T.text } },
          lang === 'en' ? 'Task: ' : 'المهمة: ',
          moveModal.task ? (moveModal.task.task_no || moveModal.task.title || '—') : '—'
        ),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
        h('select', {
          value: moveModal.stageId,
          onChange: function(e){ setMoveModal(function(m){ return Object.assign({}, m, { stageId: e.target.value }); }); },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        }, stages.map(function(stage, idx){
          return h('option', {
            key: stage.id,
            value: String(stage.id)
          }, (idx + 1) + '. ' + stage.name);
        })),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'New deadline' : 'الموعد النهائي الجديد'),
        h('input', {
          type:'datetime-local',
          value: moveModal.deadline || '',
          onChange: function(e){ setMoveModal(function(m){ return Object.assign({}, m, { deadline: e.target.value }); }); },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        })
      )
    ),

    /* First-stage edge modal */
    deptEdgeModal && deptEdgeModal.edge === 'first' && h(Modal, {
      title: lang === 'en' ? 'First Stage' : 'أول مرحلة',
      onClose: function(){ setDeptEdgeModal(null); },
      width: 420,
      footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' } },
        h(Btn, { variant:'secondary', onClick:function(){ setDeptEdgeModal(null); } }, t('cancel')),
        (deptEdgeModal.prevDeptId ? h(Btn, { variant:'warning', onClick:function(){
          var prevDept = getPrevDept(activeTab);
          setDeptEdgeModal(null);
          openBackDeptModal(deptEdgeModal.task, prevDept);
        }}, t('ops_move_prev_dept')) : null),
        h(Btn, { variant:'primary', onClick:function(){
          var task = deptEdgeModal.task;
          if (!task) return;
          apiFetch('ops-tasks/' + task.id + '/complete', { method:'POST', body: JSON.stringify({}) })
            .then(function(){
              setDeptEdgeModal(null);
              loadTasks();
              loadCompleted();
            })
            .catch(function(e){
              alert((e && e.message) ? e.message : (lang === 'en' ? 'Could not mark task as done.' : 'تعذر إكمال المهمة.'));
            });
        }}, t('ops_finish_task'))
      )
    },
      h('div', { style:{ color:T.textMid, lineHeight:1.7, fontSize:13 } },
        lang === 'en'
          ? 'This task is already in the first stage of this department. Choose one action: move to the previous department, or mark the task as done.'
          : 'هذه المهمة موجودة في أول مرحلة لهذا القسم. اختر إجراء واحد: النقل إلى القسم السابق، أو إكمال المهمة.'
      )
    ),

    /* Move to any department modal */
    deptMoveModal && h(Modal, {
      title: lang === 'en' ? 'Move to Department' : 'نقل إلى قسم',
      onClose: function(){ setDeptMoveModal(null); },
      width: 420,
      footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' } },
        h(Btn, { variant:'secondary', onClick:function(){ setDeptMoveModal(null); } }, t('cancel')),
        h(Btn, { variant:'success', onClick:function(){
          var task = deptMoveModal.task;
          var deptId = deptMoveModal.deptId;
          var employeeIds = deptMoveModal.assignedEmployeeIds || [];
          var deadline = deptMoveModal.deadline || '';
          var targetStageId = deptMoveModal.targetStageId || '';
          var linkedOrderId = (deptMoveModal.linkedOrderId || '').trim();
          if (!task || !deptId) return;
          if (!deadline) {
            alert(lang === 'en' ? 'Please set a deadline for this transition.' : 'يرجى تحديد موعد نهائي جديد لهذه النقلة.');
            return;
          }
          var isPrintingDest = isPrintingDeptById(deptId);
          if (isPrintingDest && deptMoveModal.requireOrderLink && !linkedOrderId) {
            alert(lang === 'en' ? 'Please link this task to an order before moving to Printing.' : 'اختر الطلب المرتبط قبل النقل إلى قسم الطباعة.');
            return;
          }
          if (!isPrintingDest && !targetStageId) {
            alert(lang === 'en' ? 'Please choose stage in destination department.' : 'اختر الستيج في القسم الوجهة.');
            return;
          }
          moveTaskToDept(
            task.id,
            deptId,
            employeeIds,
            deadline,
            function(result){
              setDeptMoveModal(null);
              if (result && result.mode === 'completed') {
                loadTasks();
                loadCompleted();
                return;
              }
              setActiveTab(String(deptId));
              loadStages(String(deptId));
            },
            targetStageId,
            linkedOrderId ? linkedOrderId : null
          );
        }}, lang === 'en' ? 'Move' : 'نقل')
      )
    },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
        h('div', { style:{ fontSize:13, color:T.textMid, lineHeight:1.6 } },
          lang === 'en'
            ? 'Choose the destination department, then pick a stage and assignees.'
            : 'اختر القسم الوجهة، ثم حدد الستيج والموظفين.'
        ),
        h('div', { style:{ padding:'10px 12px', background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, color:T.text } },
          lang === 'en' ? 'Task: ' : 'المهمة: ',
          deptMoveModal.task ? (deptMoveModal.task.task_no || deptMoveModal.task.title || '—') : '—'
        ),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Select department' : 'اختر القسم'),
        h('select', {
          value: deptMoveModal.deptId || '',
          onChange: function(e){
            var deptId = e.target.value || '';
            if (!deptId) return;
            apiFetch('departments/' + deptId + '/ops-stages').then(function(list){
              var stageList = Array.isArray(list) ? list : [];
              var isPrintingDest = isPrintingDeptById(deptId);
              var defaultStage = isPrintingDest ? '' : (stageList.length ? String(stageList[0].id) : '');
              var defaultEmp = defaultEmployeeForDept(deptId);
              setDeptMoveModal(function(m){
                var linkedOrderId = m && m.task && m.task.linked_order_id ? String(m.task.linked_order_id) : (m.linkedOrderId || '');
                return Object.assign({}, m, {
                  deptId: String(deptId),
                  stageOptions: stageList,
                  targetStageId: defaultStage,
                  assignedEmployeeIds: defaultEmp ? [String(defaultEmp)] : [],
                  requireOrderLink: !!(isPrintingDest && !linkedOrderId)
                });
              });
            });
          },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        },
          h('option', { value:'' }, lang === 'en' ? 'Select department' : 'اختر القسم'),
          (deptMoveModal.deptOptions || []).map(function(dept){
            return h('option', { key: dept.id, value: String(dept.id) }, ln(dept, lang));
          })
        ),
        !isPrintingDeptById(deptMoveModal.deptId) && h(React.Fragment, null,
          h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
          h('select', {
            value: deptMoveModal.targetStageId || '',
            onChange: function(e){ setDeptMoveModal(function(m){ return Object.assign({}, m, { targetStageId: e.target.value }); }); },
            style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
          },
            h('option', { value:'' }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
            (deptMoveModal.stageOptions || []).map(function(stage, idx){
              return h('option', { key: stage.id, value: String(stage.id) }, (idx + 1) + '. ' + stage.name);
            })
          )
        ),
        isPrintingDeptById(deptMoveModal.deptId) && deptMoveModal.requireOrderLink && h('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
          h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Linked Order ID (required)' : 'رقم الطلب المرتبط (إلزامي)'),
          h('input', {
            type:'number',
            min:1,
            value: deptMoveModal.linkedOrderId || '',
            onChange: function(e){ setDeptMoveModal(function(m){ return Object.assign({}, m, { linkedOrderId: e.target.value }); }); },
            style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
          })
        ),
        h(MultiSelect, {
          label: lang === 'en' ? 'Assign employee(s)' : 'اختر الموظفين',
          values: Array.isArray(deptMoveModal.assignedEmployeeIds) ? deptMoveModal.assignedEmployeeIds : [],
          options: employeeOptionsForTask(deptMoveModal.deptId),
          onChange: function(v){ setDeptMoveModal(function(m){ return Object.assign({}, m, { assignedEmployeeIds: asArr(v).map(String) }); }); }
        }),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'New deadline' : 'الموعد النهائي الجديد'),
        h('input', {
          type:'datetime-local',
          value: deptMoveModal.deadline || '',
          onChange: function(e){ setDeptMoveModal(function(m){ return Object.assign({}, m, { deadline: e.target.value }); }); },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        })
      )
    ),

    /* Previous department modal */
    backModal && h(Modal, {
      title: lang === 'en' ? 'Move to Department' : 'نقل إلى قسم',
      onClose: function(){ setBackModal(null); },
      width: 420,
      footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center' } },
        h(Btn, { variant:'secondary', onClick:function(){ setBackModal(null); } }, t('cancel')),
        h(Btn, {
          variant:'warning',
          onClick:function(){
            var task = backModal.task;
            var prevDeptId = backModal.prevDeptId;
            var employeeIds = backModal.assignedEmployeeIds || [];
            var stageId = backModal.stageId;
            var deadline = backModal.deadline || '';
            if (!task || !prevDeptId) return;
            if (!stageId) {
              alert(lang === 'en' ? 'Please choose stage in destination department.' : 'اختر الستيج في القسم الوجهة.');
              return;
            }
            if (!deadline) {
              alert(lang === 'en' ? 'Please set a deadline for this transition.' : 'يرجى تحديد موعد نهائي جديد لهذه النقلة.');
              return;
            }
            moveTaskToDept(task.id, prevDeptId, employeeIds, deadline, function(){ setBackModal(null); setActiveTab(prevDeptId); loadStages(prevDeptId); }, stageId);
          }
        }, lang === 'en' ? 'Return' : 'رجوع')
      )
    },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
        h('div', { style:{ fontSize:13, color:T.textMid, lineHeight:1.6 } },
          lang === 'en'
            ? 'Choose the department and stage you want to move this task to.'
            : 'اختر القسم والستيج الذي تريد نقل المهمة إليه.'
        ),
        h('div', { style:{ padding:'10px 12px', background:T.bgSub, border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, color:T.text } },
          lang === 'en' ? 'Task: ' : 'المهمة: ',
          backModal.task ? (backModal.task.task_no || backModal.task.title || '—') : '—'
        ),
        h('div', { style:{ padding:'10px 12px', background:'#fff7ed', border:'1px solid #fdba74', borderRadius:T.radius, fontSize:12, color:'#9a3412' } },
          lang === 'en'
            ? 'Choose the department, stage and employee.'
            : 'اختر القسم والستيج والموظف.'
        ),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Select department' : 'اختر القسم'),
        h('select', {
          value: backModal.prevDeptId || '',
          onChange: function(e){
            var deptId = e.target.value || '';
            if (!deptId) return;
            apiFetch('departments/' + deptId + '/ops-stages').then(function(list){
              var stageList = Array.isArray(list) ? list : [];
              var defaultStage = stageList.length ? String(stageList[stageList.length - 1].id) : '';
              var defaultEmp = defaultEmployeeForDept(deptId);
              setBackModal(function(m){
                return Object.assign({}, m, {
                  prevDeptId: String(deptId),
                  stageOptions: stageList,
                  stageId: defaultStage,
                  assignedEmployeeIds: defaultEmp ? [String(defaultEmp)] : []
                });
              });
            });
          },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        },
          h('option', { value:'' }, lang === 'en' ? 'Select department' : 'اختر القسم'),
          (backModal.deptOptions || []).map(function(dept){
            return h('option', { key: dept.id, value: String(dept.id) }, ln(dept, lang));
          })
        ),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
        h('select', {
          value: backModal.stageId || '',
          onChange: function(e){ setBackModal(function(m){ return Object.assign({}, m, { stageId: e.target.value }); }); },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        },
          h('option', { value:'' }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
          (backModal.stageOptions || []).map(function(stage, idx){
            return h('option', {
              key: stage.id,
              value: String(stage.id)
            }, (idx + 1) + '. ' + stage.name);
          })
        ),
        h(MultiSelect, {
          label: lang === 'en' ? 'Assign employee(s) in previous department' : 'اختر الموظفين في القسم السابق',
          values: Array.isArray(backModal.assignedEmployeeIds) ? backModal.assignedEmployeeIds : [],
          options: employeeOptionsForTask(backModal.prevDeptId),
          onChange: function(v){ setBackModal(function(m){ return Object.assign({}, m, { assignedEmployeeIds: asArr(v).map(String) }); }); }
        }),
        h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'New deadline' : 'الموعد النهائي الجديد'),
        h('input', {
          type:'datetime-local',
          value: backModal.deadline || '',
          onChange: function(e){ setBackModal(function(m){ return Object.assign({}, m, { deadline: e.target.value }); }); },
          style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
        })
      )
    ),

    /* Final stage modal */
    finalModal && h(Modal, {
      title: t('ops_final_stage_title'),
      onClose: function(){ setFinalModal(null); },
      width: 420,
      footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center' } },
        h(Btn, { variant:'secondary', onClick:function(){ setFinalModal(null); } }, t('cancel')),
        h(Btn, { variant:'primary', onClick:function(){
          /* Finish task */
          apiFetch('ops-tasks/'+finalModal.task.id+'/complete', {
            method:'POST',
            body: JSON.stringify({
              linked_order_id: finalModal.linkedOrderId ? parseInt(finalModal.linkedOrderId, 10) : null
            })
          })
            .then(function(){
              setFinalModal(null);
              loadTasks();
              loadCompleted();
            })
            .catch(function(e){
              alert((e && e.message) ? e.message : (lang === 'en' ? 'Could not mark task as done.' : 'تعذر إكمال المهمة.'));
            });
        }}, t('ops_finish_task')),
        (function(){
          var prevDept = getPrevDept(finalModal.currentDeptId);
          return prevDept ? h(Btn, { variant:'warning', onClick:function(){
            setFinalModal(null);
            openBackDeptModal(finalModal.task, prevDept);
          }}, t('ops_move_prev_dept')) : null;
        })(),
        finalModal.nextDeptId && h(Btn, { variant:'success', onClick:function(){
          var isPrintingDest = isPrintingDeptById(finalModal.nextDeptId);
          if (finalModal.requireOrderLink && !finalModal.linkedOrderId) {
            alert(lang === 'en' ? 'Please select the linked order before moving to Printing.' : 'اختر الطلب المرتبط قبل النقل إلى قسم الطباعة.');
            return;
          }
          if (!finalModal.deadline) {
            alert(lang === 'en' ? 'Please set a deadline for this transition.' : 'يرجى تحديد موعد نهائي جديد لهذه النقلة.');
            return;
          }
          if (!isPrintingDest && !finalModal.targetStageId) {
            alert(lang === 'en' ? 'Please select target stage in next department.' : 'اختر الستيج في القسم التالي.');
            return;
          }
          moveTaskToDept(finalModal.task.id, finalModal.nextDeptId, finalModal.assignedEmployeeIds || [], finalModal.deadline, function(result){
            setFinalModal(null);
            if (result && result.mode === 'completed') {
              loadTasks();
              loadCompleted();
              return;
            }
            setActiveTab(finalModal.nextDeptId);
            loadStages(finalModal.nextDeptId);
          }, finalModal.targetStageId, finalModal.linkedOrderId || null);
        }}, t('ops_move_next_dept'))
      )
    },
      h('div', { style:{ textAlign:'center', padding:'10px 0' } },
        h('div', { style:{ fontSize:36, marginBottom:12 } }, t('ops_finish_task')),
        h('p', { style:{ color:T.textMid, lineHeight:1.6 } }, t('ops_final_stage_msg')),
        finalModal.nextDeptId && h('div', { style:{ marginTop:12, textAlign:'left', display:'flex', flexDirection:'column', gap:8 } },
          h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Choose destination department' : 'اختر القسم الوجهة'),
          h('select', {
            value: finalModal.nextDeptId || '',
            onChange: function(e){
              var deptId = e.target.value || '';
              if (!deptId) return;
              apiFetch('departments/' + deptId + '/ops-stages').then(function(list){
                var stageOptions = Array.isArray(list) ? list : [];
                var isPrintingDest = isPrintingDeptById(deptId);
                var defaultEmp = defaultEmployeeForDept(deptId);
                setFinalModal(function(m){
                  return Object.assign({}, m, {
                    nextDeptId: String(deptId),
                    stageOptions: stageOptions,
                    targetStageId: isPrintingDest ? '' : (stageOptions.length ? String(stageOptions[0].id) : ''),
                    assignedEmployeeIds: defaultEmp ? [String(defaultEmp)] : [],
                    requireOrderLink: !!(isPrintingDest && !m.linkedOrderId)
                  });
                });
              });
            },
            style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
          },
            h('option', { value:'' }, lang === 'en' ? 'Select department' : 'اختر القسم'),
            (finalModal.deptOptions || []).map(function(dept){
              return h('option', { key: dept.id, value: String(dept.id) }, ln(dept, lang));
            })
          ),
          !isPrintingDeptById(finalModal.nextDeptId) && h(React.Fragment, null,
            h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Choose stage in destination department' : 'اختر الستيج في القسم الوجهة'),
            h('select', {
              value: finalModal.targetStageId || '',
              onChange: function(e){ setFinalModal(function(m){ return Object.assign({}, m, { targetStageId: e.target.value }); }); },
              style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
            },
              h('option', { value:'' }, lang === 'en' ? 'Select stage' : 'اختر الستيج'),
              (finalModal.stageOptions || []).map(function(stage, idx){
                return h('option', {
                  key: stage.id,
                  value: String(stage.id)
                }, (idx + 1) + '. ' + stage.name);
              })
            )
          ),
          finalModal.requireOrderLink && h('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
            h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'Link to order (required for Printing)' : 'ربط مع الطلب (إلزامي للطباعة)'),
            h('select', {
              value: finalModal.linkedOrderId || '',
              onChange: function(e){ setFinalModal(function(m){ return Object.assign({}, m, { linkedOrderId: e.target.value }); }); },
              style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
            },
              h('option', { value:'' }, lang === 'en' ? 'Select order' : 'اختر الطلب'),
              activeOrdersForLink().map(function(o){
                return h('option', { key:o.id, value:String(o.id) }, '#' + (o.order_number || o.id) + ' — ' + getCust(o, lang));
              })
            )
          ),
          h(MultiSelect, {
            label: lang === 'en' ? 'Assign employee(s) in next department' : 'اختر الموظفين في القسم التالي',
            values: Array.isArray(finalModal.assignedEmployeeIds) ? finalModal.assignedEmployeeIds : [],
            options: employeeOptionsForTask(finalModal.nextDeptId),
            onChange: function(v){ setFinalModal(function(m){ return Object.assign({}, m, { assignedEmployeeIds: asArr(v).map(String) }); }); }
          }),
          h('label', { style:{ fontSize:12, color:T.textMute, fontWeight:600 } }, lang === 'en' ? 'New deadline' : 'الموعد النهائي الجديد'),
          h('input', {
            type:'datetime-local',
            value: finalModal.deadline || '',
            onChange: function(e){ setFinalModal(function(m){ return Object.assign({}, m, { deadline: e.target.value }); }); },
            style:{ width:'100%', padding:'10px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13 }
          })
        )
      )
    )
  );

  return view === 'completed' ? completedViewNode : kanbanViewNode;
}

/* â•â•â• ROOT APP â•â•â• */
/* â•â•â• AUTH HELPERS â•â•â• */
function getStoredAuth() {
  try {
    var t = localStorage.getItem('cspsr_token');
    var u = localStorage.getItem('cspsr_user');
    var p = localStorage.getItem('cspsr_perms');
    if (t && u) return { token:t, user:JSON.parse(u), permissions:JSON.parse(p||'[]') };
  } catch(e) {}
  return null;
}
function setAuthCookie(token) {
  try {
    var secure = (location.protocol === 'https:') ? '; Secure' : '';
    if (!token) {
      document.cookie = 'cspsr_token=; Path=/; Max-Age=0; SameSite=Lax' + secure;
      return;
    }
    document.cookie = 'cspsr_token=' + encodeURIComponent(token) + '; Path=/; Max-Age=' + (60*60*24*30) + '; SameSite=Lax' + secure;
  } catch(_e0) {}
}
function setStoredAuth(token, user, permissions) {
  try {
    localStorage.setItem('cspsr_token', token);
    localStorage.setItem('cspsr_user', JSON.stringify(user));
    localStorage.setItem('cspsr_perms', JSON.stringify(permissions||[]));
  } catch(e) {}
  setAuthCookie(token);
}
function clearStoredAuth() {
  try { localStorage.removeItem('cspsr_token'); localStorage.removeItem('cspsr_user'); localStorage.removeItem('cspsr_perms'); } catch(e) {}
  setAuthCookie('');
}

/* â•â•â• LOGIN SCREEN â•â•â• */
function LoginScreen(props) {
  var i18n = useI18n(); var t = i18n.t;
  var _u = useState(''); var username = _u[0], setUsername = _u[1];
  var _p = useState(''); var password = _p[0], setPassword = _p[1];
  var _e = useState(''); var error = _e[0], setError = _e[1];
  var _l = useState(false); var loading = _l[0], setLoading = _l[1];

  function doLogin() {
    if (!username || !password) { setError(t('login_required')); return; }
    setLoading(true); setError('');
    apiFetch('auth/login', { method:'POST', body:JSON.stringify({ username:username, password:password }) })
      .then(function(res) {
        setStoredAuth(res.token, res.user, res.permissions);
        // Ensure an HttpOnly cookie exists for pages opened via normal browser navigation (e.g. QR print tab).
        apiFetch('auth/sync-cookie', { method:'POST' }).catch(function(){});
        props.onLogin(res.user, res.permissions);
      })
      .catch(function(e) { setError(e.message || t('login_error')); setLoading(false); });
  }

  function onKey(e) { if (e.key === 'Enter') doLogin(); }

  return h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bgSub } },
    h('div', { style:{ background:T.bg, borderRadius:T.radiusLg, padding:'40px 48px', boxShadow:T.shadowLg, width:'100%', maxWidth:400, textAlign:'center' } },
      h('div', { style:{ fontSize:36, marginBottom:8 } }, 'CS'),
      h('div', { style:{ fontWeight:800, fontSize:20, color:T.text, marginBottom:4 } }, 'ColorSource'),
      h('div', { style:{ color:T.textMute, fontSize:13, marginBottom:28 } }, t('login_subtitle')),
      h('div', { style:{ textAlign:'right', marginBottom:12 } },
        h(Input, { label:t('login_username'), value:username, onChange:setUsername, onKeyDown:onKey })
      ),
      h('div', { style:{ textAlign:'right', marginBottom:20 } },
        h(Input, { label:t('login_password'), type:'password', value:password, onChange:setPassword, onKeyDown:onKey })
      ),
      error && h('div', { style:{ color:T.red, fontSize:13, marginBottom:12, padding:'8px 12px', background:'rgba(239,68,68,.08)', borderRadius:T.radius } }, error),
      h(Btn, { variant:'primary', onClick:doLogin, style:{ width:'100%' } }, loading ? h(Spinner) : t('login_btn'))
    )
  );
}

/* â•â•â• USERS VIEW â•â•â• */
function UsersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _items = useState([]); var items = _items[0], setItems = _items[1];
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var _perm = useState(null); var permUser = _perm[0], setPermUser = _perm[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];

  var bs = props.bootstrap || {};
  var allStepNames = [];
  var productSteps = asArr(bs.product_steps || []);
  var stepLibrary  = asArr(bs.step_library  || []);
  productSteps.forEach(function(s){ if (s.step_name && allStepNames.indexOf(s.step_name)<0) allStepNames.push(s.step_name); });
  var departments = asArr(bs.departments);
  var allEmployees = asArr(bs.employees);

  function load() {
    setLoading(true);
    apiFetch('app-users').then(function(d){ setItems(Array.isArray(d)?d:[]); setLoading(false); }).catch(function(){ setLoading(false); });
  }
  useEffect(function(){ load(); }, []);

  var blank = { name:'', name_en:'', username:'', password:'', role:'user', is_active:1, department_id:'', link_employee_id:'' };

  function save() {
    var prom = form.id
      ? apiFetch('app-users/'+form.id, { method:'PUT', body:JSON.stringify(form) })
      : apiFetch('app-users', { method:'POST', body:JSON.stringify(form) });
    prom.then(function(){ setForm(null); load(); if (props.onReload) props.onReload(); }).catch(function(e){ alert(e.message); });
  }

  function del(id) {
    if (!confirm(t('confirm_delete'))) return;
    apiFetch('app-users/'+id, { method:'DELETE' }).then(function(){ load(); if (props.onReload) props.onReload(); }).catch(function(e){ alert(e.message); });
  }

  useTopbar(items.length+' '+t('users_count'), h(Btn, { variant:'primary', onClick:function(){ setForm(Object.assign({},blank)); } }, '+ '+t('new_user')));
  if (loading) return h(PageLoader);

  return h('div', null,
    h(DataTable, {
      columns:[
        { key:'avatar', label:'', noSort:true, render:function(r){ return h(UserAvatar,{user:r,size:32}); } },
        { key:'name', label:t('name'), render:function(r){ return h('span',{style:{fontWeight:600}},ln(r,lang)); } },
        { key:'username',  label:t('username_lbl') },
        { key:'role',      label:t('role_lbl'),   render:function(r){ return h(Badge,{label:r.role==='admin'?t('role_admin'):t('role_user'),color:r.role==='admin'?'purple':'blue'}); } },
        { key:'is_active', label:t('status_lbl'), render:function(r){ return h(Badge,{label:r.is_active==1?t('active_lbl'):t('stopped_lbl'),color:r.is_active==1?'green':'gray'}); } },
      ],
      rows:items,
      actions:function(r){ return h('div',{style:{display:'flex',gap:6}},
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){ setPermUser(r); }}, lang==='en'?'🔐 Permissions':'🔐 صلاحيات'),
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){ setForm(Object.assign({name_en:''},r,{password:''})); }},t('edit')),
        h(Btn,{size:'sm',variant:'danger',onClick:function(){ del(r.id); }},t('delete'))
      ); }
    }),

    /* User form modal */
    form && h(Modal, {
      title: form.id ? t('edit_user') : t('new_user'),
      onClose:function(){ setForm(null); }, width:480,
      footer: h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}}, t('cancel')),
        h(Btn,{onClick:save}, t('save'))
      )
    },
      h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
        /* Link to existing employee â€” only when creating new user */
        !form.id && h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'10px 14px',border:'1px solid '+T.border}},
          h(Select,{
            label:t('link_emp_label'),
            value:String(form.link_employee_id||''),
            placeholder:t('link_emp_placeholder'),
            onChange:function(v){
              if (v) {
                var emp = findBy(allEmployees,'id',parseInt(v));
                setForm(function(f){ return Object.assign({},f,{
                  link_employee_id:v,
                  name: emp ? (emp.name||f.name) : f.name,
                  name_en: emp ? (emp.name_en||f.name_en) : f.name_en,
                }); });
              } else {
                setForm(function(f){ return Object.assign({},f,{link_employee_id:''}); });
              }
            },
            options:allEmployees.map(function(e){ return {value:String(e.id), label:ln(e,lang)}; })
          })
        ),
        h(BiInput,{label:t('full_name'),ar:form.name,en:form.name_en,onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});});}}),
        h(Input,{label:t('username_lbl'),value:form.username,onChange:function(v){setForm(function(f){return Object.assign({},f,{username:v});});}}),
        h(Input,{label:form.id?t('password_new'):t('password_lbl'),type:'password',value:form.password,onChange:function(v){setForm(function(f){return Object.assign({},f,{password:v});});}}),
        h(Select,{label:t('role_lbl'),value:form.role,onChange:function(v){setForm(function(f){return Object.assign({},f,{role:v});});},options:[{value:'admin',label:t('role_admin')},{value:'user',label:t('role_user')}]}),
        h(Select,{label:t('dept_lbl'),value:String(form.department_id||''),onChange:function(v){setForm(function(f){return Object.assign({},f,{department_id:v||''});});},options:departments.map(function(d){return {value:String(d.id),label:ln(d,lang)};}),placeholder:t('no_dept')}),
        h(Select,{label:t('status_lbl'),value:String(form.is_active),onChange:function(v){setForm(function(f){return Object.assign({},f,{is_active:parseInt(v)});});},options:[{value:'1',label:t('active_lbl')},{value:'0',label:t('stopped_lbl')}]})
      )
    ),

    /* Permissions modal */
    permUser && h(PermissionsModal, {
      user: permUser,
      allStepNames: allStepNames,
      onClose: function(){ setPermUser(null); }
    })
  );
}

/* â•â•â• PERMISSIONS MODAL â•â•â• */
var PERM_SECTIONS = [
  { key:'orders',          perms:['view','create','edit','delete'] },
  { key:'customers',       perms:['view','create','edit','delete'] },
  { key:'products',        perms:['view','create','edit','delete'] },
  { key:'employees',       perms:['view','create','edit','delete'] },
  { key:'kds',             perms:['view'] },
  { key:'delivery_orders', perms:['view'] },
  { key:'reports',         perms:['view'] },
  { key:'settings',        perms:['view','edit'] },
  { key:'users',           perms:['view','create','edit','delete'] },
];

function PermissionsModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var user = props.user;
  var _perms = useState(null); var perms = _perms[0], setPerms = _perms[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];

  useEffect(function(){
    apiFetch('app-users/'+user.id+'/permissions')
      .then(function(d){ setPerms(Array.isArray(d)?d:[]); })
      .catch(function(){ setPerms([]); });
  }, [user.id]);

  function toggle(key) {
    setPerms(function(prev){
      if (!prev) return [key];
      var idx = prev.indexOf(key);
      if (idx >= 0) { var n=[].concat(prev); n.splice(idx,1); return n; }
      return prev.concat([key]);
    });
  }

  function toggleSection(sectionKey) {
    var sectionPerms = PERM_SECTIONS.find(function(s){return s.key===sectionKey;}).perms.map(function(p){return sectionKey+'.'+p;});
    var allOn = sectionPerms.every(function(k){ return perms && perms.indexOf(k)>=0; });
    setPerms(function(prev){
      var next = (prev||[]).filter(function(k){ return sectionPerms.indexOf(k)<0; });
      if (!allOn) next = next.concat(sectionPerms);
      return next;
    });
  }

  function toggleStep(stepName) {
    var key = 'steps.'+stepName;
    toggle(key);
  }

  function save() {
    setSaving(true);
    apiFetch('app-users/'+user.id+'/permissions', { method:'POST', body:JSON.stringify({ permissions: perms||[] }) })
      .then(function(){ setSaving(false); props.onClose(); })
      .catch(function(){ setSaving(false); });
  }

  var isAdmin = user.role === 'admin';

  return h(Modal, {
    title: 'ðŸ” '+t('perm_title')+': '+user.name,
    onClose: props.onClose, width: 600,
    footer: h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
      h(Btn,{onClick:save},saving?h(Spinner):t('perm_save'))
    )
  },
    isAdmin
      ? h('div',{style:{padding:'20px',textAlign:'center',color:T.green,fontWeight:600}},'âœ… '+t('perm_admin_full'))
      : !perms
        ? h('div',{style:{textAlign:'center',padding:20}},h(Spinner))
        : h('div',{style:{display:'flex',flexDirection:'column',gap:16}},

          /* Section permissions */
          h('div',null,
            h('div',{style:{fontWeight:700,fontSize:13,color:T.textMute,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}},t('perm_sections')),
            PERM_SECTIONS.map(function(sec){
              var sectionPerms = sec.perms.map(function(p){return sec.key+'.'+p;});
              var allOn = sectionPerms.every(function(k){ return perms.indexOf(k)>=0; });
              return h('div',{key:sec.key,style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 16px',marginBottom:6}},
                h('div',{style:{display:'flex',alignItems:'center',gap:12,marginBottom:sec.perms.length>1?8:0}},
                  h('input',{type:'checkbox',checked:allOn,onChange:function(){toggleSection(sec.key);},style:{width:16,height:16,cursor:'pointer',accentColor:T.accent}}),
                  h('span',{style:{fontWeight:600,fontSize:13,color:T.text}},t('perm_'+sec.key))
                ),
                sec.perms.length > 1 && h('div',{style:{display:'flex',gap:16,paddingRight:28}},
                  sec.perms.map(function(p){
                    var key = sec.key+'.'+p;
                    var on = perms.indexOf(key)>=0;
                    return h('label',{key:p,style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:T.textMid}},
                      h('input',{type:'checkbox',checked:on,onChange:function(){toggle(key);},style:{accentColor:T.accent}}),
                      t('perm_'+p)||p
                    );
                  })
                )
              );
            })
          ),

          /* Step permissions */
          props.allStepNames && props.allStepNames.length > 0 && h('div',null,
            h('div',{style:{fontWeight:700,fontSize:13,color:T.textMute,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}},t('perm_steps')),
            h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 16px'}},
              h('div',{style:{display:'flex',flexWrap:'wrap',gap:10}},
                props.allStepNames.map(function(name){
                  var key = 'steps.'+name;
                  var on = perms.indexOf(key)>=0;
                  return h('label',{key:name,style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,
                    background:on?'rgba(99,91,255,.12)':T.bg,
                    border:'1px solid '+(on?T.accent:T.border),
                    borderRadius:T.radius,padding:'6px 12px',color:on?T.accent:T.textMid,fontWeight:on?600:400,transition:'all .15s'}},
                    h('input',{type:'checkbox',checked:on,onChange:function(){toggleStep(name);},style:{display:'none'}}),
                    on?'âœ“ ':' ',name
                  );
                })
              )
            )
          )
        )
  );
}

/* â•â•â• AVATAR MODAL â•â•â• */
function AvatarModal(props) {
  var i18n = useI18n(); var t = i18n.t;
  var _prev = useState(props.user.avatar||null); var preview = _prev[0], setPreview = _prev[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];
  var _err = useState(''); var err = _err[0], setErr = _err[1];

  function onFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { setErr(t('avatar_too_large')); return; }
    var reader = new FileReader();
    reader.onload = function(ev){ setPreview(ev.target.result); setErr(''); };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!preview || preview === props.user.avatar) { props.onClose(); return; }
    setSaving(true);
    apiFetch('app-users/'+props.user.id+'/avatar', { method:'POST', body:JSON.stringify({ avatar:preview }) })
      .then(function(res){
        setSaving(false);
        props.onSaved(res.avatar);
        props.onClose();
      })
      .catch(function(e){ setSaving(false); setErr(e.message||t('avatar_error')); });
  }

  return h(Modal, { title:t('avatar_title'), onClose:props.onClose, width:380,
    footer:h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
      h(Btn,{onClick:save},saving?h(Spinner):t('save'))
    )},
    h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'8px 0'}},
      h(UserAvatar,{user:Object.assign({},props.user,{avatar:preview}),size:90}),
      h('label',{style:{cursor:'pointer',padding:'8px 20px',border:'1px dashed '+T.border,borderRadius:T.radius,color:T.textMute,fontSize:13,textAlign:'center',width:'100%'}},
        'ðŸ“· Ø§Ø®ØªØ± ØµÙˆØ±Ø©',
        h('input',{type:'file',accept:'image/*',onChange:onFile,style:{display:'none'}})
      ),
      preview && h('button',{onClick:function(){setPreview(null);},style:{fontSize:12,color:T.red,background:'transparent',border:'none',cursor:'pointer'}},'âœ• Ø­Ø°Ù Ø§Ù„ØµÙˆØ±Ø©'),
      err && h('div',{style:{color:T.red,fontSize:12}},err)
    )
  );
}

function SettingsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var branding = props.branding || {};
  var initReasons = (branding.pause_reasons || []).map(function(r,i){ return Object.assign({},r,{_id:i}); });
  var _rs = useState(initReasons); var reasons = _rs[0], setReasons = _rs[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];
  var _saved = useState(false); var saved = _saved[0], setSaved = _saved[1];
  var _newAr = useState(''); var newAr = _newAr[0], setNewAr = _newAr[1];
  var _newEn = useState(''); var newEn = _newEn[0], setNewEn = _newEn[1];
  var _newMachine = useState(''); var newMachine = _newMachine[0], setNewMachine = _newMachine[1];
  var _newStep = useState(''); var newStep = _newStep[0], setNewStep = _newStep[1];
  var _kdsInterval = useState(branding.kds_carousel_interval || 8); var kdsInterval = _kdsInterval[0], setKdsInterval = _kdsInterval[1];
  var _waNotify = useState(branding.whatsapp_notify || ''); var waNotify = _waNotify[0], setWaNotify = _waNotify[1];
  var _debugBarEnabled = useState(branding.debug_bar_enabled !== false); var debugBarEnabled = _debugBarEnabled[0], setDebugBarEnabled = _debugBarEnabled[1];
  var _companyWorkdayStart = useState(branding.company_workday_start || '09:00'); var companyWorkdayStart = _companyWorkdayStart[0], setCompanyWorkdayStart = _companyWorkdayStart[1];
  var _companyWorkdayEnd = useState(branding.company_workday_end || '17:00'); var companyWorkdayEnd = _companyWorkdayEnd[0], setCompanyWorkdayEnd = _companyWorkdayEnd[1];
  var _companyWorkingDays = useState(parseJsonArraySafe(branding.company_working_days, [0,1,2,3,4,5,6])); var companyWorkingDays = _companyWorkingDays[0], setCompanyWorkingDays = _companyWorkingDays[1];
  var _companyHolidays = useState(parseJsonArraySafe(branding.company_holidays, [])); var companyHolidays = _companyHolidays[0], setCompanyHolidays = _companyHolidays[1];
  var _notifyPrintingTeamId = useState(String(branding.notify_printing_team_id || 0)); var notifyPrintingTeamId = _notifyPrintingTeamId[0], setNotifyPrintingTeamId = _notifyPrintingTeamId[1];
  var _notifyLogisticsDeptId = useState(String(branding.notify_logistics_department_id || 0)); var notifyLogisticsDeptId = _notifyLogisticsDeptId[0], setNotifyLogisticsDeptId = _notifyLogisticsDeptId[1];
  var notifyTeams = asArr(props.bootstrap && props.bootstrap.teams);
  var notifyDepartments = asArr(props.bootstrap && props.bootstrap.departments);
  var _notifRules = useState((branding.notification_rules && Array.isArray(branding.notification_rules)) ? branding.notification_rules : []); var notifRules = _notifRules[0], setNotifRules = _notifRules[1];
  var _calendarSupplierIds = useState([]); var calendarSupplierIds = _calendarSupplierIds[0], setCalendarSupplierIds = _calendarSupplierIds[1];
  var _applyingCompanyHolidays = useState(false); var applyingCompanyHolidays = _applyingCompanyHolidays[0], setApplyingCompanyHolidays = _applyingCompanyHolidays[1];
  var _confirmPreset = useState(false); var confirmPreset = _confirmPreset[0], setConfirmPreset = _confirmPreset[1];
  var supplierRowsForCalendar = asArr(props.bootstrap && props.bootstrap.suppliers);

  // Push notifications (Firebase/FCM)
  var _pushStatus = useState(''); var pushStatus = _pushStatus[0], setPushStatus = _pushStatus[1];
  var _pushErr = useState(''); var pushErr = _pushErr[0], setPushErr = _pushErr[1];
  var _pushBusy = useState(false); var pushBusy = _pushBusy[0], setPushBusy = _pushBusy[1];
  var _pushCfgOk = useState(false); var pushCfgOk = _pushCfgOk[0], setPushCfgOk = _pushCfgOk[1];

  useEffect(function(){
    try {
      var fcm = (branding && branding.fcm) ? branding.fcm : {};
      var cfg = (fcm && fcm.config) ? fcm.config : null;
      var vapid = (fcm && fcm.vapid_public) ? String(fcm.vapid_public) : '';
      var enabled = !!(fcm && fcm.enabled);
      var ok = enabled && !!vapid && !!cfg && (typeof cfg === 'object') && (Object.keys(cfg||{}).length > 0);
      setPushCfgOk(!!ok);
      // Auto-clear stale error once config becomes valid (e.g., after admin fixes options).
      if (ok) {
        setPushErr('');
      }
    } catch(_e0) {}
  }, [branding && branding.fcm && branding.fcm.enabled, branding && branding.fcm && branding.fcm.vapid_public, branding && branding.fcm && branding.fcm.config]);

  function loadScriptOnce(url) {
    return new Promise(function(resolve, reject){
      try {
        if (document.querySelector('script[data-cspsr="'+url+'"]')) return resolve(true);
        var s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.defer = true;
        s.setAttribute('data-cspsr', url);
        s.onload = function(){ resolve(true); };
        s.onerror = function(){ reject(new Error('Failed to load '+url)); };
        document.head.appendChild(s);
      } catch(e) { reject(e); }
    });
  }

  function enablePushNotifications() {
    var fcm = (branding && branding.fcm) ? branding.fcm : {};
    var cfg = fcm && fcm.config ? fcm.config : null;
    var vapid = (fcm && fcm.vapid_public) ? String(fcm.vapid_public) : '';
    var enabled = !!(fcm && fcm.enabled);
    if (!enabled || !vapid || !cfg || (typeof cfg !== 'object') || (Object.keys(cfg||{}).length === 0)) {
      setPushErr(lang==='en' ? 'FCM is not configured yet (ask admin to set Firebase config + VAPID).' : 'إعدادات الإشعارات (FCM) غير مكتملة بعد. اطلب من المدير إضافة Firebase + VAPID.');
      return;
    }
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      setPushErr(lang==='en' ? 'This browser does not support notifications.' : 'هذا المتصفح لا يدعم الإشعارات.');
      return;
    }

    setPushBusy(true); setPushErr(''); setPushStatus('');

    // Register SW at the root scope (served by WP)
    navigator.serviceWorker.register('/?cspsr_fcm_sw=1&v='+(Date.now()), { scope:'/' })
      .then(function(reg){
        // Load Firebase compat SDK
        return loadScriptOnce('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js')
          .then(function(){ return loadScriptOnce('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js'); })
          .then(function(){
            if (!window.firebase || !firebase.initializeApp) throw new Error('Firebase SDK not loaded');
            try { firebase.apps && firebase.apps.length ? null : firebase.initializeApp(cfg); } catch(_e0) {}
            var messaging = firebase.messaging();

            return Notification.requestPermission().then(function(permission){
              if (permission !== 'granted') throw new Error('Permission not granted');
              return messaging.getToken({ vapidKey: vapid, serviceWorkerRegistration: reg });
            });
          });
      })
      .then(function(token){
        if (!token) throw new Error('No token');
        var ua = (navigator.userAgent||'').slice(0, 120);
        return apiFetch('push/register-token', { method:'POST', body: JSON.stringify({ token: token, platform:'web', device_label: ua }) })
          .then(function(){
            setPushBusy(false);
            setPushStatus(lang==='en' ? 'Notifications enabled on this device.' : 'تم تفعيل الإشعارات على هذا الجهاز.');
          });
      })
      .catch(function(e){
        setPushBusy(false);
        var msg = (e && e.message) ? e.message : 'Error';
        if (msg === 'Permission not granted') msg = (lang==='en' ? 'Notifications permission denied or blocked.' : 'تم رفض/حظر إذن الإشعارات.');
        setPushErr(msg);
      });
  }

  function toggleCalendarSupplier(id) {
    var sid = String(id);
    setCalendarSupplierIds(function(prev){
      prev = asArr(prev).map(String);
      return prev.indexOf(sid) >= 0 ? prev.filter(function(v){ return v !== sid; }) : prev.concat([sid]);
    });
  }
  function applyCompanyHolidaysToSelectedSuppliers() {
    var selected = asArr(calendarSupplierIds).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); });
    if (!selected.length) return Promise.resolve();
    setApplyingCompanyHolidays(true);
    var holidayList = normalizeHolidayList(companyHolidays);
    return Promise.all(selected.map(function(id){
      var supplier = supplierRowsForCalendar.find(function(s){ return parseInt(s.id,10) === id; });
      if (!supplier) return Promise.resolve();
      return apiFetch('suppliers/'+id, {
        method:'PUT',
        body: JSON.stringify({
          name: supplier.name || '',
          name_en: supplier.name_en || '',
          phone: supplier.phone || '',
          phone_alt: supplier.phone_alt || '',
          workday_start: supplier.workday_start || '09:00',
          workday_end: supplier.workday_end || '17:00',
          working_days: parseJsonArraySafe(supplier.working_days, [0,1,2,3,4,5,6]),
          holidays: normalizeHolidayList(parseJsonArraySafe(supplier.holidays, []).concat(holidayList)),
          map_url: supplier.map_url || '',
          notes: supplier.notes || '',
          is_active: supplier.is_active == null ? 1 : supplier.is_active
        })
      });
    })).then(function(){
      setApplyingCompanyHolidays(false);
      setSaved(true);
      setTimeout(function(){ setSaved(false); }, 2000);
      if (props.onReload) props.onReload();
    }).catch(function(){
      setApplyingCompanyHolidays(false);
    });
  }

  // â”€â”€ PRESET REASONS â€” ÙƒÙ„ Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„ØªÙˆÙ‚Ù Ù„Ù…Ø¹Ø¯Ø§Øª Ø§Ù„Ù…Ø·Ø¨Ø¹Ø© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var PRESET_REASONS = [
    // â”€â”€ XEROX VERSANT 180 â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØªÙˆÙ†Ø±',en:'Toner Empty',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªØ­Ø°ÙŠØ± ØªÙˆÙ†Ø± Ù…Ù†Ø®ÙØ¶',en:'Low Toner Warning',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù†Ù‚Ù„ IBT',en:'IBT Belt Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ØªØºØ°ÙŠØ© Ø§Ù„ÙˆØ±Ù‚',en:'Paper Feed Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ø±ØªÙØ§Ø¹ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Overheat Shutdown',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„ ÙÙŠ Ø§Ù„Ø´Ø§Ø´Ø©',en:'Error Code on Screen',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ© Ù…Ø¬Ø¯ÙˆÙ„Ø©',en:'Scheduled Maintenance',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ø³ØªØ¨Ø¯Ø§Ù„ ÙˆØ­Ø¯Ø© Ø§Ù„ØµÙˆØ± Drum',en:'Drum Unit Replacement',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ø£Ù„ÙˆØ§Ù† ÙƒØ§Ù„ÙŠØ¨Ø±ÙŠØ´Ù†',en:'Color Calibration',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©',en:'Internal Path Cleaning',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø³ØªÙŠØ¨Ù„Ø± Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ',en:'Internal Stapler Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Finisher',en:'Finisher Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø«Ù†ÙŠ',en:'Fold Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ CANON C650i â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± CMYK',en:'Ink Cartridge Empty (CMYK)',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø­Ø¨Ø± Waste Toner',en:'Waste Toner Box Full',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¯Ø±Ø¬',en:'Tray Feed Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø·Ø¨Ù„ Drum',en:'Drum Unit Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„',en:'Error Code',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ©',en:'Periodic Maintenance',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· ÙƒØ«Ø§ÙØ© Ø§Ù„Ø£Ù„ÙˆØ§Ù†',en:'Color Density Calibration',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Finisher',en:'Finisher Unit Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Print Head Cleaning',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Stapler Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ',en:'External Stapler Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ CANON 5550i â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Error',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± CMYK',en:'Ink Empty (CMYK)',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø­Ø¨Ø± Waste Toner',en:'Waste Toner Full',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¯Ø±Ø¬',en:'Tray Feed Error',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„',en:'Error Code',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ©',en:'Periodic Maintenance',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ EVLOIS / EPSON L805 â”€â”€
    {ar:'Ø§Ù†Ø³Ø¯Ø§Ø¯ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Printhead Clog',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± - Ø£ÙŠ Ù„ÙˆÙ†',en:'Ink Empty (any color)',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø© Ø£Ùˆ Ù…Ù†Ø­Ø±ÙØ©',en:'Paper Jam / Skew',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªØ³Ø±Ø¨ Ø­Ø¨Ø± Ø¯Ø§Ø®Ù„ÙŠ',en:'Ink Leak',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Encoder Strip',en:'Encoder Strip Error',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ù†ØªÙ‡Ø§Ø¡ Ø¹Ù…Ø± Waste Ink Pad',en:'Waste Ink Pad Full',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù…Ø­Ø±Ùƒ Ø§Ù„ÙƒØ§Ø±ØªØ±ÙŠØ¯Ø¬',en:'Cartridge Motor Error',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ù…Ø­Ø§Ø°Ø§Ø©',en:'Alignment Calibration',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Head Cleaning Cycle',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ FLAT HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Temperature Fluctuation',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Pressure Issue',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø§Ù„Ø³ÙŠÙ„ÙŠÙƒÙˆÙ† Ø§Ù„ÙˆØ§Ù‚ÙŠ',en:'Silicone Pad Damaged',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªÙÙ„ÙˆÙ†',en:'Teflon Sheet Worn Out',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Timer',en:'Timer Error',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ù…Ù†ØªØ¬ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¶ØºØ·',en:'Product Misalignment During Press',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Transfer Paper',en:'Transfer Paper Out of Stock',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ 3D HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù‚Ø§Ù„Ø¨ Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ',en:'Outer Mold Issue',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Temperature Fluctuation',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªØ³Ø¨Ù„ÙŠÙ…ÙŠØ´Ù†',en:'Sublimation Blanks Empty',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„',en:'Transfer Paper Out of Stock',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ HAT HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù‚Ø§Ù„Ø¨ Ø§Ù„ÙƒØ§Ø¨',en:'Hat Mold Issue',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙƒØ§Ø¨',en:'Print Misalignment on Hat',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„',en:'Transfer Paper Out of Stock',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ BOOKLET STAPLE YALE â”€â”€
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø¯Ø¨Ø§Ø³Ø© Ø³ØªÙŠØ¨Ù„',en:'Staples Empty',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ÙˆØ±Ù‚ Ù…Ø³Ø­ÙˆØ¨ Ø¬Ø§Ù…',en:'Paper Jam',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø¹Ø¯Ù… Ù…Ø­Ø§Ø°Ø§Ø© Ø§Ù„ÙˆØ±Ù‚',en:'Paper Misalignment',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø·ÙŠ',en:'Folding Unit Error',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø¶Ø¨Ø· Ù…Ù‚Ø§Ø³ Ø§Ù„ÙƒØªÙŠØ¨',en:'Booklet Size Adjustment',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¥Ø¨Ø±Ø© Ø§Ù„Ø¯Ø¨Ø§Ø³Ø©',en:'Staple Needle Damaged',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ TRIMMING MACHINE â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø§Ù„Ø´ÙØ±Ø©',en:'Blade Worn Out',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù‚Ø§Ø³',en:'Size Drift',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'ÙˆØ±Ù‚ Ø¹Ø§Ù„Ù‚ ÙÙŠ Ø§Ù„Ø´ÙØ±Ø©',en:'Paper Stuck in Blade',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ù€ Back Gauge',en:'Back Gauge Adjustment',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'ØªØºÙŠÙŠØ± Ø§Ù„Ø´ÙØ±Ø©',en:'Blade Replacement',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶Ø§ØºØ· Ø§Ù„Ù‡ÙˆØ§Ø¦ÙŠ',en:'Air Clamp Issue',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ù‚Ø·Ø¹ Ø¹Ù† Ø§Ù„Ù…Ù‚Ø§Ø³',en:'Cut Size Off',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    // â”€â”€ BINDING MACHINE â”€â”€
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„ØºØ±Ø§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Hot Glue Issue',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø§Ù„ØºØ±Ø§Ø¡ Ù„Ù… ÙŠØµÙ„ Ù„Ù„Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Glue Not Heated',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØºØ±Ø§Ø¡',en:'Glue Empty',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„ÙˆØ±Ù‚ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¬Ù„ÙŠØ¯',en:'Paper Shift During Binding',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø­Ø§Ù…Ù„ Ø§Ù„ÙƒØªØ§Ø¨',en:'Book Clamp Damaged',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø¹Ø¯Ù… Ø§Ù„ØªØµØ§Ù‚ Ø§Ù„ØºÙ„Ø§Ù',en:'Cover Not Adhering',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ù…Ø­Ø§Ø°Ø§Ø© Ø§Ù„ÙƒØªØ§Ø¨',en:'Book Misalignment',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    // â”€â”€ SPIRAL PUNCHING / MANUAL â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø³ÙƒØ§ÙƒÙŠÙ† Ø§Ù„Ø«Ù‚Ø¨',en:'Punch Dies Worn Out',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ø«Ù‚ÙˆØ¨ Ø¹Ù† Ø§Ù„Ù…Ø­Ø§Ø°Ø§Ø©',en:'Hole Misalignment',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ¹Ø·Ù„ Ù…Ø­Ø±Ùƒ Ø§Ù„Ø«Ù‚Ø¨',en:'Punch Motor Error',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Out of Stock',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Insertion Issue',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ÙˆØ±Ù‚ Ø¹Ø§Ù„Ù‚ ÙÙŠ Ø§Ù„Ø«Ø§Ù‚Ø¨Ø©',en:'Paper Stuck in Puncher',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ ROUNDED CORNER PRESS â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ø²Ø§ÙˆÙŠØ©',en:'Corner Die Worn Out',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù†ØªØ¬',en:'Product Misalignment',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Press Pressure Issue',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØºÙŠÙŠØ± Ù‚Ø§Ù„Ø¨ Ø§Ù„Ù‚Øµ',en:'Die Change Required',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ CIRCLE PRESS 5x5 â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ø¯Ø§Ø¦Ø±Ø©',en:'Circle Die Worn Out',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù†ØªØ¬',en:'Product Misalignment',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Press Pressure Issue',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØºÙŠÙŠØ± Ù‚Ø§Ù„Ø¨ Ø§Ù„Ù‚Øµ',en:'Die Change Required',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ UV / CAMEO 3 â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ù‚Ø·Ø¹',en:'Cutting Blade Worn',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ø³Ø¬Ù„ Registration',en:'Registration Offset',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ØªØºØ°ÙŠØ© Ø§Ù„ÙˆØ±Ù‚ Ø£Ùˆ Ø§Ù„ÙÙŠÙ†ÙŠÙ„',en:'Media Feed Error',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Mat',en:'Mat Worn / Dirty',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'ØªÙ„Ù Ø±Ø£Ø³ Ø§Ù„Ù‚Ø·Ø¹',en:'Cutting Head Damaged',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ USB',en:'USB Connection Error',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø¶Ø¨Ø· Ù‚ÙˆØ© Ø§Ù„Ù‚Ø·Ø¹',en:'Cut Force Calibration',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù„Ù…Ù„Ù Ù„Ø§ ÙŠÙÙ‚Ø±Ø£ ÙÙŠ Silhouette Studio',en:'File Read Error in Studio',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    // â”€â”€ UPS â”€â”€
    {ar:'Ø§Ù†Ù‚Ø·Ø§Ø¹ Ø§Ù„ØªÙŠØ§Ø± Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠ',en:'Power Outage',machine:'UPS',step:''},
    {ar:'ØªØ­Ø°ÙŠØ± Ø¨Ø·Ø§Ø±ÙŠØ© UPS Ù…Ù†Ø®ÙØ¶Ø©',en:'UPS Battery Low',machine:'UPS',step:''},
    {ar:'ØªÙ„Ù Ø¨Ø·Ø§Ø±ÙŠØ© UPS',en:'UPS Battery Failure',machine:'UPS',step:''},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø§Ù„Ø¬Ù‡Ø¯ Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠ',en:'Voltage Fluctuation',machine:'UPS',step:''},
    {ar:'ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ù…Ù„ Ø¹Ù„Ù‰ UPS',en:'UPS Overload',machine:'UPS',step:''},
    // â”€â”€ SERVER / NETWORK â”€â”€
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ RIP Server',en:'RIP Server Error',machine:'Server Dell',step:''},
    {ar:'Ø§Ù„Ø´Ø¨ÙƒØ© Ù…Ù†Ù‚Ø·Ø¹Ø©',en:'Network Down',machine:'Server Dell',step:''},
    {ar:'Ø§Ù„Ø¬Ù‡Ø§Ø² ÙŠØ¹ÙŠØ¯ Ø§Ù„ØªØ´ØºÙŠÙ„',en:'System Restart',machine:'Server Dell',step:''},
    {ar:'Ù…Ø³Ø§Ø­Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ù…Ù…ØªÙ„Ø¦Ø©',en:'Storage Full',machine:'Server Dell',step:''},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ù…Ù„ÙØ§Øª',en:'File Receiving Error',machine:'Server Dell',step:''},
    // â”€â”€ Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© â”€â”€
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ÙˆØ±Ù‚',en:'Paper Out of Stock',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚ ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ù…ÙˆØ§ØµÙØ§Øª',en:'Wrong Paper Spec',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚ Ø±Ø·Ø¨ Ø£Ùˆ ØªØ§Ù„Ù',en:'Wet / Damaged Paper',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± ØªÙˆØ±ÙŠØ¯ Ø§Ù„ÙˆØ±Ù‚',en:'Waiting for Paper Delivery',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ ÙÙŠÙ„Ù… Ø§Ù„Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†',en:'Lamination Film Empty',machine:'',step:'Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†'},
    {ar:'ÙÙŠÙ„Ù… Ù„Ø§ ÙŠÙ„ØªØµÙ‚ Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­',en:'Film Not Adhering',machine:'',step:'Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Transfer Paper Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªØ³Ø¨Ù„ÙŠÙ…ÙŠØ´Ù†',en:'Sublimation Blanks Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØºØ±Ø§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Hot Glue Empty',machine:'',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø¯Ø¨Ø§Ø³Ø©',en:'Staples Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ Ø£Ø³Ø¨Ø§Ø¨ ØªØ´ØºÙŠÙ„ÙŠØ© â”€â”€
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± Ù…ÙˆØ§ÙÙ‚Ø© Ø¨Ø±ÙˆÙ Ù…Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„',en:'Waiting for Client Proof Approval',machine:'',step:''},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù…Ù„Ù Ø§Ù„ØªØµÙ…ÙŠÙ…',en:'Design File Issue',machine:'',step:''},
    {ar:'Ø¥Ø¹Ø§Ø¯Ø© Ø·Ø¨Ø§Ø¹Ø© Ø¨Ø³Ø¨Ø¨ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù„ÙˆÙ†',en:'Reprint â€” Color Error',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¥Ø¹Ø§Ø¯Ø© Ø·Ø¨Ø§Ø¹Ø© Ø¨Ø³Ø¨Ø¨ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù‚Øµ',en:'Reprint â€” Cutting Error',machine:'',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± Ù‚Ø³Ù… Ø¢Ø®Ø±',en:'Waiting for Another Department',machine:'',step:''},
    {ar:'ØºÙŠØ§Ø¨ Ù…ÙˆØ¸Ù Ù…Ø³Ø¤ÙˆÙ„',en:'Staff Absence',machine:'',step:''},
    {ar:'ØªÙˆÙ‚Ù ØºÙŠØ± Ù…Ø¨Ø±Ø±',en:'Unexplained Stoppage',machine:'',step:''},
  ];

  useTopbar(lang==='en' ? 'Settings' : 'الإعدادات');

  function addReason() {
    if (!newAr.trim() && !newEn.trim()) return;
    setReasons(function(prev){ return prev.concat([{ar:newAr.trim(), en:newEn.trim(), machine:newMachine.trim(), step:newStep.trim(), _id:Date.now()}]); });
    setNewAr(''); setNewEn(''); setNewMachine(''); setNewStep('');
  }
  function removeReason(id) { setReasons(function(prev){ return prev.filter(function(r){ return r._id !== id; }); }); }
  function updateReason(id, field, val) {
    setReasons(function(prev){ return prev.map(function(r){ if (r._id!==id) return r; var u={}; u[field]=val; return Object.assign({},r,u); }); });
  }
  function save() {
    setSaving(true);
    var clean = reasons.map(function(r){ return {ar:r.ar||'', en:r.en||'', machine:r.machine||'', step:r.step||''}; });
    var interval = Math.max(3, Math.min(120, parseInt(kdsInterval,10)||8));
    var rulesClean = asArr(notifRules).map(function(r){
      return {
        event: String(r.event||''),
        target_type: String(r.target_type||'department'),
        department_id: (r && (r.department_id === '' || r.department_id === null || typeof r.department_id === 'undefined')) ? 0 : (parseInt(r.department_id,10) || 0),
        team_id: (r && (r.team_id === '' || r.team_id === null || typeof r.team_id === 'undefined')) ? 0 : (parseInt(r.team_id,10) || 0),
        sound: String(r.sound||''),
        sound_url: String(r.sound_url||'')
      };
    });
    apiFetch('setup', {method:'POST', body:JSON.stringify({
      pause_reasons: clean,
      kds_carousel_interval: interval,
      whatsapp_notify: waNotify.trim(),
      debug_bar_enabled: !!debugBarEnabled,
      company_workday_start: companyWorkdayStart || '09:00',
      company_workday_end: companyWorkdayEnd || '17:00',
      company_working_days: parseJsonArraySafe(companyWorkingDays, [0,1,2,3,4,5,6]).map(function(v){ return parseInt(v,10); }).filter(function(v){ return !isNaN(v); }).sort(),
      company_holidays: normalizeHolidayList(companyHolidays),
      notify_printing_team_id: parseInt(notifyPrintingTeamId,10) || 0,
      notify_logistics_department_id: parseInt(notifyLogisticsDeptId,10) || 0,
      notification_rules: rulesClean
    })})
      .then(function(){
        setSaving(false); setSaved(true);
        setTimeout(function(){ setSaved(false); }, 2000);
        if (props.onBrandingUpdate) props.onBrandingUpdate(Object.assign({},branding,{
          pause_reasons:clean,
          kds_carousel_interval:interval,
          whatsapp_notify:waNotify.trim(),
          debug_bar_enabled: !!debugBarEnabled,
          company_workday_start: companyWorkdayStart || '09:00',
          company_workday_end: companyWorkdayEnd || '17:00',
          company_working_days: parseJsonArraySafe(companyWorkingDays, [0,1,2,3,4,5,6]),
          company_holidays: normalizeHolidayList(companyHolidays),
          notify_printing_team_id: parseInt(notifyPrintingTeamId,10) || 0,
          notify_logistics_department_id: parseInt(notifyLogisticsDeptId,10) || 0,
          notification_rules: rulesClean
        }));
      })
      .catch(function(){ setSaving(false); });
  }

  var inSt = {width:'100%',padding:'7px 9px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bgSub,color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'};

  var _stab = useState('reasons'); var stab = _stab[0], setStab = _stab[1];
  var STABS = [
    {key:'reasons', icon:'⏸', ar:'أسباب التوقف', en:'Pause Reasons'},
    {key:'kds',     icon:'📺', ar:'شاشة الإنتاج', en:'Production Display'},
    {key:'notify',  icon:'🔔', ar:'إشعارات الأقسام', en:'Department Alerts'},
    {key:'calendar', icon:'🗓', ar:'تقويم الشركة', en:'Company Calendar'},
    {key:'backup', icon:'💾', ar:'تصدير/استيراد', en:'Export / Import'},
  ];

  var _exporting = useState(false); var exporting = _exporting[0], setExporting = _exporting[1];
  var _importing = useState(false); var importing = _importing[0], setImporting = _importing[1];
  var _importErr = useState(''); var importErr = _importErr[0], setImportErr = _importErr[1];
  var _importOk  = useState(''); var importOk = _importOk[0], setImportOk = _importOk[1];
  var _replaceMode = useState(false); var replaceMode = _replaceMode[0], setReplaceMode = _replaceMode[1];
  var _incSetup = useState(true); var incSetup = _incSetup[0], setIncSetup = _incSetup[1];
  var _incMaster = useState(true); var incMaster = _incMaster[0], setIncMaster = _incMaster[1];
  var _incCustomers = useState(false); var incCustomers = _incCustomers[0], setIncCustomers = _incCustomers[1];
  var _incUsers = useState(false); var incUsers = _incUsers[0], setIncUsers = _incUsers[1];
  var _incOperational = useState(false); var incOperational = _incOperational[0], setIncOperational = _incOperational[1];
  var _incOps = useState(false); var incOps = _incOps[0], setIncOps = _incOps[1];
  var _incHr = useState(false); var incHr = _incHr[0], setIncHr = _incHr[1];

  // Granular export/import toggles (Operational + Ops Tasks)
  var _incOpOrders = useState(false); var incOpOrders = _incOpOrders[0], setIncOpOrders = _incOpOrders[1];
  var _incOpItems = useState(false); var incOpItems = _incOpItems[0], setIncOpItems = _incOpItems[1];
  var _incOpSteps = useState(false); var incOpSteps = _incOpSteps[0], setIncOpSteps = _incOpSteps[1];
  var _incOpEvents = useState(false); var incOpEvents = _incOpEvents[0], setIncOpEvents = _incOpEvents[1];
  var _incOpDelivery = useState(false); var incOpDelivery = _incOpDelivery[0], setIncOpDelivery = _incOpDelivery[1];
  var _incOpNotifications = useState(false); var incOpNotifications = _incOpNotifications[0], setIncOpNotifications = _incOpNotifications[1];

  var _incOpsBoards = useState(false); var incOpsBoards = _incOpsBoards[0], setIncOpsBoards = _incOpsBoards[1];
  var _incOpsStages = useState(false); var incOpsStages = _incOpsStages[0], setIncOpsStages = _incOpsStages[1];
  var _incOpsEvents = useState(false); var incOpsEvents = _incOpsEvents[0], setIncOpsEvents = _incOpsEvents[1];

  var _opFrom = useState(''); var opFrom = _opFrom[0], setOpFrom = _opFrom[1];
  var _opTo = useState(''); var opTo = _opTo[0], setOpTo = _opTo[1];
  var _opMax = useState(300); var opMax = _opMax[0], setOpMax = _opMax[1];
  var _opIncludeDone = useState(true); var opIncludeDone = _opIncludeDone[0], setOpIncludeDone = _opIncludeDone[1];

  function buildIncludeList() {
    var out = [];
    if (incSetup) out.push('setup');
    if (incMaster) out.push('master');
    if (incCustomers) out.push('customers');
    if (incUsers) out.push('users');

    // Operational (granular, with back-compat shortcut when all selected)
    var opAll = incOpOrders && incOpItems && incOpSteps && incOpEvents && incOpDelivery && incOpNotifications;
    if (opAll) {
      out.push('operational');
    } else {
      if (incOpOrders) out.push('op_orders');
      if (incOpItems) out.push('op_items');
      if (incOpSteps) out.push('op_steps');
      if (incOpEvents) out.push('op_events');
      if (incOpDelivery) out.push('op_delivery');
      if (incOpNotifications) out.push('op_notifications');
    }

    // Ops tasks (granular, with back-compat shortcut when all selected)
    var opsAll = incOpsBoards && incOpsStages && incOpsEvents;
    if (opsAll) {
      out.push('ops');
    } else {
      if (incOpsBoards) out.push('ops_boards');
      if (incOpsStages) out.push('ops_stages');
      if (incOpsEvents) out.push('ops_events');
    }
    if (incHr) out.push('hr');
    return out.length ? out : ['setup','master'];
  }
  function downloadJsonFile(name, obj) {
    try {
      var blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(_e0){} try{ document.body.removeChild(a); }catch(_e1){} }, 0);
    } catch (_e2) {}
  }
  function doExport() {
    setExporting(true); setImportErr(''); setImportOk('');
    var include = buildIncludeList();
    var filters = {};
    if (include.indexOf('operational') >= 0 || include.some(function(k){ return /^op_/.test(String(k||'')); })) {
      filters.operational = {
        from: (opFrom || '').trim(),
        to: (opTo || '').trim(),
        max_orders: Math.max(1, Math.min(5000, parseInt(opMax,10) || 300)),
        include_done: !!opIncludeDone
      };
    }
    apiFetch('export', { method:'POST', body: JSON.stringify({ include: include, filters: filters }) })
      .then(function(res){
        setExporting(false);
        var ts = new Date();
        var pad = function(n){ return (n<10?'0':'')+n; };
        var fname = 'cspsr_export_' + ts.getFullYear() + pad(ts.getMonth()+1) + pad(ts.getDate()) + '_' + pad(ts.getHours()) + pad(ts.getMinutes()) + '.json';
        downloadJsonFile(fname, res || {});
        setImportOk(lang==='en' ? 'Exported.' : 'تم التصدير.');
        setTimeout(function(){ setImportOk(''); }, 2500);
      })
      .catch(function(e){
        setExporting(false);
        setImportErr((e && e.message) ? e.message : (lang==='en' ? 'Export failed' : 'فشل التصدير'));
      });
  }
  function onImportFile(ev) {
    setImportErr(''); setImportOk('');
    var file = ev && ev.target && ev.target.files ? ev.target.files[0] : null;
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try {
        var text = String(reader.result || '');
        var json = JSON.parse(text);
        setImporting(true);
        apiFetch('import', { method:'POST', body: JSON.stringify({ payload: json, include: buildIncludeList(), mode: replaceMode ? 'replace' : 'merge' }) })
          .then(function(res){
            setImporting(false);
            setImportOk(lang==='en' ? 'Imported.' : 'تم الاستيراد.');
            setTimeout(function(){ setImportOk(''); }, 2500);
            if (props.onReload) props.onReload();
          })
          .catch(function(e){
            setImporting(false);
            setImportErr((e && e.message) ? e.message : (lang==='en' ? 'Import failed' : 'فشل الاستيراد'));
          });
      } catch (e) {
        setImportErr(lang==='en' ? 'Invalid JSON file' : 'ملف JSON غير صالح');
      }
      try { ev.target.value = ''; } catch(_e0) {}
    };
    reader.readAsText(file);
  }

  return h('div', { style:{ maxWidth:960, padding:'0 4px' } },
    /* â”€â”€ Tab bar â”€â”€ */
    h('div', { style:{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid '+T.border, paddingBottom:0 } },
      STABS.map(function(tb){
        var active = stab === tb.key;
        return h('button', { key:tb.key, onClick:function(){ setStab(tb.key); }, style:{
          padding:'9px 18px', background:'transparent', border:'none', borderBottom: active?'2px solid '+T.accent:'2px solid transparent',
          marginBottom:'-2px', color: active?T.accent:T.textMute, fontWeight: active?700:400,
          fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .15s'
        }},
          h('span',null, tb.icon), h('span',null, lang==='en'?tb.en:tb.ar)
        );
      })
    ),

    /* â•â• Tab: Pause Reasons â•â• */
    stab==='reasons' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:8 } },
        h('div', null,
          h('div', { style:{ fontWeight:700, fontSize:15 } }, lang==='en' ? 'Delay & Pause Reasons' : 'أسباب التأخير والإيقاف'),
          h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } },
            lang==='en' ? 'Appear when pausing a step or recording a delivery delay.' : 'تظهر عند إيقاف خطوة أو تسجيل سبب تأخير.'
          )
        ),
        h('button', {
          onClick: function(){ setConfirmPreset(true); },
          style:{ padding:'6px 14px', borderRadius:T.radius, border:'1px solid '+T.accent, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }
        }, lang==='en' ? '⚡ Load Preset Reasons' : '⚡ تحميل الأسباب الجاهزة')
      ),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:12 } },
        lang==='en'
          ? 'These reasons appear when pausing a step or recording a delivery delay. Optionally specify the machine and step for each reason.'
          : 'هذه الأسباب تظهر عند إيقاف خطوة أو تسجيل سبب تأخير. يمكن تحديد الماكينة والخطوة لكل سبب.'
      ),
      confirmPreset && h('div', { style:{ background:'rgba(245,158,11,.08)', border:'1px solid #f59e0b', borderRadius:T.radius, padding:'12px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' } },
        h('span', { style:{ fontSize:13, color:T.text, flex:1 } },
          lang==='en'
            ? '⚠️ This will replace all current reasons with the preset list ('+PRESET_REASONS.length+' reasons). Continue?'
            : 'سيتم استبدال كل الأسباب الحالية بالقائمة الجاهزة ('+PRESET_REASONS.length+' سبب). تأكيد؟'
        ),
        h('div', { style:{ display:'flex', gap:8 } },
          h('button', { onClick:function(){ setConfirmPreset(false); }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bgCard, color:T.text, cursor:'pointer', fontSize:12 } }, lang==='en'?'Cancel':'إلغاء'),
          h('button', { onClick:function(){
            setReasons(PRESET_REASONS.map(function(r,i){ return Object.assign({},r,{_id:Date.now()+i}); }));
            setConfirmPreset(false);
          }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 } }, lang==='en'?'Yes, Load':'نعم، حمّل')
        )
      ),
      /* Column headers */
      reasons.length > 0 && h('div', {style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,marginBottom:6,paddingBottom:6,borderBottom:'1px solid '+T.border}},
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Arabic':'العربي'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'English':'الإنجليزي'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Machine':'الماكينة'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Step':'الخطوة'),
        h('span',null)
      ),
      /* Existing reasons */
      reasons.length === 0
        ? h('div', { style:{ color:T.textMute, fontSize:13, marginBottom:16, padding:'16px', background:T.bgSub, borderRadius:T.radius, textAlign:'center' } },
            lang==='en' ? 'No reasons added yet' : 'لم تُضف أسباب بعد'
          )
        : h('div', { style:{ marginBottom:16 } },
            reasons.map(function(r) {
              return h('div', { key:r._id, style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center' } },
                h('input', { value:r.ar||'', onChange:function(e){ updateReason(r._id,'ar',e.target.value); }, style:Object.assign({},inSt,{direction:'rtl'}), placeholder:'سبب الإيقاف...' }),
                h('input', { value:r.en||'', onChange:function(e){ updateReason(r._id,'en',e.target.value); }, style:inSt, placeholder:'Pause reason...' }),
                h('input', { value:r.machine||'', onChange:function(e){ updateReason(r._id,'machine',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Press A':'مثال: مكبس A' }),
                h('input', { value:r.step||'', onChange:function(e){ updateReason(r._id,'step',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Printing':'مثال: طباعة' }),
                h('button', { onClick:function(){ removeReason(r._id); }, style:{ padding:'6px 11px', borderRadius:T.radius, border:'none', background:'#fee2e2', color:T.red, cursor:'pointer', fontWeight:700, fontSize:13 } }, '✕')
              );
            })
          ),
      /* Add new reason */
      h('div', { style:{ borderTop:'1px solid '+T.border, paddingTop:16 } },
        h('div',{style:{fontSize:12,fontWeight:600,color:T.textMute,marginBottom:8}}, lang==='en'?'Add new reason:':'إضافة سبب جديد:'),
        h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'flex-end' } },
          h(Input, { label:lang==='en'?'Arabic':'العربي', value:newAr, onChange:setNewAr, placeholder:'سبب الإيقاف...' }),
          h(Input, { label:lang==='en'?'English':'الإنجليزي', value:newEn, onChange:setNewEn, placeholder:'Pause reason...' }),
          h(Input, { label:lang==='en'?'Machine (optional)':'الماكينة (اختياري)', value:newMachine, onChange:setNewMachine }),
          h(Input, { label:lang==='en'?'Step (optional)':'الخطوة (اختياري)', value:newStep, onChange:setNewStep }),
          h(Btn, { variant:'primary', onClick:addReason, style:{marginBottom:2} }, '+ '+(lang==='en'?'Add':'إضافة'))
        )
      ),
      /* Save */
      h('div', { style:{ marginTop:20, display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
      )
    ),

    /* â•â• Tab: Production Display â•â• */
    stab==='kds' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } },
        lang==='en' ? 'Production Display (TV)' : 'شاشة الإنتاج (TV)'
      ),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:20 } }, t('kds_interval_hint')),
      /* Carousel interval */
      h('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:20, maxWidth:400, background:T.bgSub, borderRadius:T.radius, padding:'14px 16px' } },
        h('label', { style:{ fontSize:13, fontWeight:600, color:T.text, flex:1 } }, t('kds_interval_lbl')),
        h('input', {
          type:'number', min:3, max:120, step:1,
          value: kdsInterval,
          onChange: function(e){ setKdsInterval(parseInt(e.target.value,10)||8); },
          style:{ width:72, padding:'7px 10px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:15, fontWeight:700, outline:'none', textAlign:'center' }
        }),
        h('span', { style:{ fontSize:12, color:T.textMute } }, lang==='en'?'seconds':'ثانية')
      ),
      /* WhatsApp */
      h('div', { style:{ fontWeight:600, fontSize:13, marginBottom:8, color:T.text } },
        (lang==='en' ? 'WhatsApp Notify Number' : 'رقم واتساب للإشعارات')
      ),
      h('div', { style:{ display:'flex', alignItems:'center', gap:10, maxWidth:400, marginBottom:6 } },
        h('input', {
          type:'text',
          placeholder: '9647701234567',
          value: waNotify,
          onChange: function(e){ setWaNotify(e.target.value); },
          style:{ flex:1, padding:'9px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bgSub, color:T.text, fontSize:13, outline:'none' }
        })
      ),
      h('div',{style:{fontSize:11,color:T.textMute,marginBottom:20}},
        lang==='en' ? 'With country code, no + (e.g. 9647701234567)' : 'مع رمز الدولة، بدون + (مثال: 9647701234567)'
      ),
      h('div', { style:{ marginBottom:20, maxWidth:520, background:T.bgSub, borderRadius:T.radius, padding:'14px 16px', border:'1px solid '+T.border } },
        h('div', { style:{ fontWeight:600, fontSize:13, color:T.text, marginBottom:6 } },
          lang==='en' ? 'Debug Bar' : 'شريط الديبغ'
        ),
        h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:10, lineHeight:1.6 } },
          lang==='en'
            ? 'Show or hide the fixed debug bar at the bottom of the app.'
            : 'إظهار أو إخفاء شريط الديبغ الثابت أسفل النظام.'
        ),
        h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', color:T.text, fontSize:13, fontWeight:600 } },
          h('input', {
            type:'checkbox',
            checked: !!debugBarEnabled,
            onChange: function(e){ setDebugBarEnabled(!!e.target.checked); }
          }),
          h('span', null, debugBarEnabled ? (lang==='en' ? 'Enabled' : 'مفعّل') : (lang==='en' ? 'Disabled' : 'معطّل'))
        )
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
      )
    ),

    stab==='notify' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } }, lang==='en' ? 'Notification Rules' : 'قواعد الإشعارات'),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:14, lineHeight:1.6 } },
        lang==='en'
          ? 'Choose which department/team receives each type of alert, and what sound to play.'
          : 'اختر أي قسم/فريق يستلم نوع الإشعار، واختر صوت الإشعار.'
      ),
      h('div', { style:{ marginBottom:14, padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:T.bgSub } },
        h('div', { style:{ fontWeight:800, fontSize:12, marginBottom:6, color:T.text, letterSpacing:'.04em', textTransform:'uppercase' } },
          lang==='en' ? 'Push notifications (FCM)' : 'إشعارات المتصفح/الموبايل (FCM)'
        ),
        h('div', { style:{ fontSize:12, color:T.textMute, lineHeight:1.6, marginBottom:10 } },
          lang==='en'
            ? 'Enable push notifications on this device. You must allow browser notifications.'
            : 'فعّل الإشعارات على هذا الجهاز. لازم توافق على إذن الإشعارات من المتصفح.'
        ),
        h('div', { style:{ fontSize:12, color: pushCfgOk ? T.green : T.red, fontWeight:700, marginBottom:10 } },
          pushCfgOk ? (lang==='en' ? 'FCM configured' : 'FCM مهيأ') : (lang==='en' ? 'FCM not configured' : 'FCM غير مهيأ')
        ),
        h('div', { style:{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' } },
          h(Btn, { variant:'primary', onClick:enablePushNotifications, disabled:pushBusy }, pushBusy ? (lang==='en'?'Enabling…':'جاري التفعيل…') : (lang==='en'?'Enable on this device':'تفعيل على هذا الجهاز')),
          h(Btn, { variant:'secondary', onClick:function(){
            setPushErr(''); setPushStatus(lang==='en'?'Reloading…':'جاري إعادة التحميل…');
            Promise.resolve(props.onReload ? props.onReload() : null).then(function(){
              setTimeout(function(){ setPushStatus(''); }, 1200);
            });
          }, disabled:pushBusy }, lang==='en' ? 'Reload data' : 'تحديث البيانات'),
          h(Btn, { variant:'secondary', onClick:function(){
            setPushBusy(true); setPushErr(''); setPushStatus('');
            apiFetch('push/test', { method:'POST', body: JSON.stringify({ title:'CSPSR', body:(lang==='en'?'Test notification':'إشعار تجريبي') }) })
              .then(function(res){
                setPushBusy(false);
                var sent = res && typeof res.sent === 'number' ? res.sent : 0;
                var devices = res && typeof res.devices === 'number' ? res.devices : 0;
                var err = res && res.error ? String(res.error) : '';
                if (sent > 0) {
                  setPushStatus(lang==='en'
                    ? ('Sent to '+sent+' of '+devices+' device(s).')
                    : ('تم الإرسال إلى '+sent+' من '+devices+' جهاز.')
                  );
                } else {
                  setPushStatus('');
                  setPushErr(err || (lang==='en' ? 'Not sent (see server config).' : 'لم يتم الإرسال (تحقق من إعدادات السيرفر).'));
                }
              })
              .catch(function(e){ setPushBusy(false); setPushErr((e && e.message) ? e.message : 'Error'); });
          }, disabled:pushBusy }, lang==='en' ? 'Send test' : 'إرسال تجربة')
        ),
        pushStatus && h('div', { style:{ marginTop:10, color:T.green, fontSize:12, fontWeight:700 } }, pushStatus),
        pushErr && h('div', { style:{ marginTop:10, color:T.red, fontSize:12, fontWeight:700 } }, pushErr)
      ),
      (!notifRules || !notifRules.length) && h('div', { style:{ padding:12, border:'1px dashed '+T.border, borderRadius:T.radiusLg, background:T.bgSub, color:T.textMute, fontSize:12, marginBottom:12 } },
        lang==='en'
          ? 'No rules yet. Add rules below. (Tip: create one rule for New Order and one for Delivery Ready)'
          : 'لا توجد قواعد حالياً. أضف قواعد بالأسفل. (نصيحة: قاعدة لطلب جديد وقاعدة لمرحلة التوصيل)'
      ),
      h('div', { style:{ display:'flex', flexDirection:'column', gap:10, marginBottom:12 } },
        asArr(notifRules).map(function(r, idx){
          var event = String(r.event||'new_order');
          var targetType = String(r.target_type||'department');
          var sound = String(r.sound||'');
          var soundUrl = String(r.sound_url||'');
          var evOpts = [
            { value:'new_order', label:(lang==='en' ? 'New Order' : 'طلب جديد') },
            { value:'delivery_ready', label:(lang==='en' ? 'Delivery Stage' : 'مرحلة التوصيل') },
          ];
          var targetOpts = [
            { value:'department', label:(lang==='en' ? 'Department' : 'قسم') },
            { value:'team', label:(lang==='en' ? 'Team' : 'فريق') },
          ];
          var soundOpts = [
            { value:'', label:(lang==='en' ? 'Default' : 'افتراضي') },
            { value:'school', label:(lang==='en' ? 'School bell' : 'جرس مدرسة') },
            { value:'bell', label:(lang==='en' ? 'Bell' : 'جرس') },
            { value:'custom', label:(lang==='en' ? 'Custom URL' : 'رابط مخصص') },
            { value:'off', label:(lang==='en' ? 'Off' : 'بدون صوت') },
          ];
          var deptOptions = [{ value:'', label:(lang==='en' ? 'Select department' : 'اختر القسم') }, { value:'0', label:(lang==='en' ? 'All departments' : 'كل الأقسام') }].concat(
            notifyDepartments.map(function(dRow){
              return { value:String(dRow.id), label:(lang==='en' ? (dRow.name_en || dRow.name) : (dRow.name || dRow.name_en || ('#'+dRow.id))) };
            })
          );
          var teamOptions = [{ value:'', label:(lang==='en' ? 'Select team' : 'اختر الفريق') }, { value:'0', label:(lang==='en' ? 'All teams' : 'كل الفرق') }].concat(
            notifyTeams.map(function(tRow){
              return { value:String(tRow.id), label:(lang==='en' ? (tRow.name_en || tRow.name) : (tRow.name || tRow.name_en || ('#'+tRow.id))) };
            })
          );

          function patch(field, value){
            setNotifRules(function(prev){
              prev = asArr(prev);
              return prev.map(function(x,i){
                if (i !== idx) return x;
                var u = {}; u[field] = value;
                return Object.assign({}, x, u);
              });
            });
          }
          function remove(){
            setNotifRules(function(prev){
              prev = asArr(prev);
              return prev.filter(function(_x,i){ return i !== idx; });
            });
          }

          return h('div', { key:idx, style:{ padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:T.bg } },
            h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 } },
              h(Select, { label:(lang==='en'?'Alert type':'نوع الإشعار'), value:event, onChange:function(v){ patch('event', String(v||'new_order')); }, options: evOpts }),
              h(Select, { label:(lang==='en'?'Target':'الجهة'), value:targetType, onChange:function(v){ patch('target_type', String(v||'department')); }, options: targetOpts }),
              h(Select, { label:(lang==='en'?'Sound':'الصوت'), value:sound, onChange:function(v){ patch('sound', String(v||'')); }, options: soundOpts })
            ),
            h('div', { style:{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 120px', gap:10, alignItems:'end' } },
              (targetType === 'team')
                ? h(Select, { label:(lang==='en'?'Team':'الفريق'), value:(r.team_id === '' ? '' : String(r.team_id||0)), onChange:function(v){ patch('team_id', (typeof v === 'undefined' || v === null) ? '' : String(v)); }, options: teamOptions })
                : h(Select, { label:(lang==='en'?'Department':'القسم'), value:(r.department_id === '' ? '' : String(r.department_id||0)), onChange:function(v){ patch('department_id', (typeof v === 'undefined' || v === null) ? '' : String(v)); }, options: deptOptions }),
              h(Btn, { variant:'secondary', onClick:remove }, lang==='en' ? 'Remove' : 'حذف')
            ),
            (sound === 'custom') && h('div', { style:{ marginTop:10 } },
              h(Input, { label:(lang==='en'?'Custom sound URL':'رابط الصوت المخصص'), value:soundUrl, onChange:function(v){ patch('sound_url', v||''); } })
            )
          );
        })
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' } },
        h(Btn, { variant:'secondary', onClick:function(){
          setNotifRules(function(prev){
            prev = asArr(prev);
            return prev.concat([{ event:'new_order', target_type:'department', department_id:0, team_id:0, sound:'', sound_url:'' }]);
          });
        } }, lang==='en' ? '+ Add rule' : '+ إضافة قاعدة'),
        h('div', { style:{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' } },
          h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
          saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
        )
      )
    ),

    stab==='calendar' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } }, lang==='en' ? 'Company Working Calendar' : 'تقويم عمل الشركة'),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:16 } },
        lang==='en' ? 'Default working hours, days, and holidays used when no team or employee override exists.' : 'الدوام الافتراضي للشركة ويُستخدم عند عدم وجود إعداد خاص للفريق أو الموظف.'
      ),
      h(WorkScheduleFields,{
        form:{ workday_start:companyWorkdayStart, workday_end:companyWorkdayEnd, working_days:companyWorkingDays, holidays:companyHolidays },
        setForm:function(updater){
          var current = { workday_start:companyWorkdayStart, workday_end:companyWorkdayEnd, working_days:companyWorkingDays, holidays:companyHolidays };
          var next = typeof updater === 'function' ? updater(current) : updater;
          setCompanyWorkdayStart(next.workday_start || '09:00');
          setCompanyWorkdayEnd(next.workday_end || '17:00');
          setCompanyWorkingDays(parseJsonArraySafe(next.working_days, [0,1,2,3,4,5,6]));
          setCompanyHolidays(normalizeHolidayList(next.holidays));
        },
        lang:lang,
        title:lang==='en' ? 'Company Calendar' : 'تقويم الشركة'
      }),
      h('div', { style:{ marginTop:18, padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:T.bgSub } },
        h('div', { style:{ fontSize:13, fontWeight:700, color:T.text, marginBottom:6 } }, lang==='en' ? 'Apply company holidays to suppliers' : 'تطبيق عطل الشركة على المجهزين'),
        h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:10 } },
          lang==='en' ? 'Select one or more suppliers, then apply the current company holiday list to all of them at once.' : 'اختر مجهزًا واحدًا أو أكثر ثم طبق قائمة عطل الشركة الحالية عليهم دفعة واحدة.'
        ),
        h(CheckboxGroup, {
          label:lang==='en' ? 'Suppliers' : 'المجهزون',
          value:calendarSupplierIds,
          options:supplierRowsForCalendar.map(function(s){
            return { value:String(s.id), label:(lang==='en' && s.name_en ? s.name_en : s.name || s.name_en || ('#'+s.id)) };
          }),
          onChange:setCalendarSupplierIds
        }),
        h('div', { style:{ display:'flex', gap:10, alignItems:'center', marginTop:12, flexWrap:'wrap' } },
          h(Btn, { variant:'secondary', onClick:function(){ setCalendarSupplierIds(supplierRowsForCalendar.map(function(s){ return String(s.id); })); } }, lang==='en'?'Select all suppliers':'تحديد كل المجهزين'),
          h(Btn, { variant:'secondary', onClick:function(){ setCalendarSupplierIds([]); } }, lang==='en'?'Clear selection':'مسح التحديد'),
          h(Btn, { variant:'primary', onClick:applyCompanyHolidaysToSelectedSuppliers, disabled:applyingCompanyHolidays || !calendarSupplierIds.length }, applyingCompanyHolidays ? '...' : (lang==='en'?'Apply holidays to selected suppliers':'تطبيق العطل على المجهزين المحددين'))
        )
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center', marginTop:18 } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
      )
    ),

    /* ══ Tab: Export / Import ══ */
    stab==='backup' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } }, lang==='en' ? 'Export / Import' : 'تصدير / استيراد'),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:14, lineHeight:1.6 } },
        lang==='en'
          ? 'Export system data to a JSON file, then import it later to restore settings and master data.'
          : 'صدر بيانات النظام إلى ملف JSON، ثم استوردها لاحقاً لاسترجاع الإعدادات وبيانات النظام.'
      ),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 } },
        h('div', { style:{ padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:T.bgSub } },
          h('div', { style:{ fontWeight:700, fontSize:13, marginBottom:10, color:T.text } }, lang==='en' ? 'Include' : 'ماذا تريد تضمينه؟'),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!incSetup, onChange:function(e){ setIncSetup(!!e.target.checked); } }),
            h('span', null, lang==='en' ? 'Setup / Branding' : 'الإعدادات / الهوية')
          ),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!incMaster, onChange:function(e){ setIncMaster(!!e.target.checked); } }),
            h('span', null, lang==='en' ? 'Master data (roles, products, steps, …)' : 'بيانات النظام (الأدوار، المنتجات، الخطوات، …)')
          ),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!incCustomers, onChange:function(e){ setIncCustomers(!!e.target.checked); } }),
            h('span', null, lang==='en' ? 'Customers (optional)' : 'العملاء (اختياري)')
          ),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text } },
            h('input', { type:'checkbox', checked:!!incUsers, onChange:function(e){ setIncUsers(!!e.target.checked); } }),
            h('span', null, lang==='en' ? 'App users & permissions (optional)' : 'مستخدمي النظام والصلاحيات (اختياري)')
          ),
          h('div', { style:{ height:10 } }),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!incOperational, onChange:function(e){
              var v = !!e.target.checked;
              setIncOperational(v);
              if (v) {
                setIncOpOrders(true); setIncOpItems(true); setIncOpSteps(true); setIncOpEvents(true); setIncOpDelivery(true); setIncOpNotifications(true);
              } else {
                setIncOpOrders(false); setIncOpItems(false); setIncOpSteps(false); setIncOpEvents(false); setIncOpDelivery(false); setIncOpNotifications(false);
              }
            } }),
            h('span', null, lang==='en' ? 'Operational data' : 'بيانات التشغيل')
          ),
          incOperational && h('div', { style:{ margin:'-4px 0 10px 28px', paddingLeft:12, borderLeft:'2px solid '+T.border } },
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpOrders, onChange:function(e){ setIncOpOrders(!!e.target.checked); } }),
              h('span', null, lang==='en' ? 'Orders' : 'الطلبات')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpItems, onChange:function(e){
                var v = !!e.target.checked; setIncOpItems(v); if (v) setIncOpOrders(true);
              } }),
              h('span', null, lang==='en' ? 'Order items' : 'عناصر الطلب')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpSteps, onChange:function(e){
                var v = !!e.target.checked; setIncOpSteps(v); if (v) { setIncOpOrders(true); setIncOpItems(true); }
              } }),
              h('span', null, lang==='en' ? 'Item steps' : 'خطوات العناصر')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpEvents, onChange:function(e){
                var v = !!e.target.checked; setIncOpEvents(v); if (v) setIncOpOrders(true);
              } }),
              h('span', null, lang==='en' ? 'Events' : 'الأحداث')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpDelivery, onChange:function(e){
                var v = !!e.target.checked; setIncOpDelivery(v); if (v) setIncOpOrders(true);
              } }),
              h('span', null, lang==='en' ? 'Delivery' : 'التوصيل')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text } },
              h('input', { type:'checkbox', checked:!!incOpNotifications, onChange:function(e){ setIncOpNotifications(!!e.target.checked); } }),
              h('span', null, lang==='en' ? 'Notifications' : 'الإشعارات')
            )
          ),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!incOps, onChange:function(e){
              var v = !!e.target.checked;
              setIncOps(v);
              if (v) {
                setIncOpsBoards(true); setIncOpsStages(true); setIncOpsEvents(true);
              } else {
                setIncOpsBoards(false); setIncOpsStages(false); setIncOpsEvents(false);
              }
            } }),
            h('span', null, lang==='en' ? 'Operations tasks' : 'مهام التشغيل')
          ),
          incOps && h('div', { style:{ margin:'-4px 0 10px 28px', paddingLeft:12, borderLeft:'2px solid '+T.border } },
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpsBoards, onChange:function(e){ setIncOpsBoards(!!e.target.checked); } }),
              h('span', null, lang==='en' ? 'Boards' : 'البوردات')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
              h('input', { type:'checkbox', checked:!!incOpsStages, onChange:function(e){ setIncOpsStages(!!e.target.checked); } }),
              h('span', null, lang==='en' ? 'Stages' : 'المراحل')
            ),
            h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text } },
              h('input', { type:'checkbox', checked:!!incOpsEvents, onChange:function(e){ setIncOpsEvents(!!e.target.checked); } }),
              h('span', null, lang==='en' ? 'Events' : 'الأحداث')
            )
          ),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text } },
            h('input', { type:'checkbox', checked:!!incHr, onChange:function(e){ setIncHr(!!e.target.checked); } }),
            h('span', null, lang==='en' ? 'HR (leaves & points)' : 'الموارد البشرية (الإجازات والنقاط)')
          )
        ),
        h('div', { style:{ padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:T.bgSub } },
          h('div', { style:{ fontWeight:700, fontSize:13, marginBottom:10, color:T.text } }, lang==='en' ? 'Import mode' : 'وضع الاستيراد'),
          h('label', { style:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:T.text, marginBottom:8 } },
            h('input', { type:'checkbox', checked:!!replaceMode, onChange:function(e){ setReplaceMode(!!e.target.checked); } }),
            h('span', null, replaceMode ? (lang==='en' ? 'Replace (truncate + write)' : 'استبدال (حذف ثم كتابة)') : (lang==='en' ? 'Merge (upsert)' : 'دمج (تحديث/إضافة)'))
          ),
          h('div', { style:{ fontSize:12, color:T.textMute, lineHeight:1.6 } },
            lang==='en'
              ? 'Replace will clear selected tables before writing. Use with caution.'
              : 'الاستبدال يمسح الجداول المحددة قبل الكتابة. استخدمه بحذر.'
          )
        )
      ),
      (incOpOrders||incOpItems||incOpSteps||incOpEvents||incOpDelivery||incOpNotifications) && h('div', { style:{ marginBottom:14, padding:12, border:'1px solid '+T.border, borderRadius:T.radiusLg, background:'rgba(99,102,241,.06)' } },
        h('div', { style:{ fontWeight:800, fontSize:12, marginBottom:10, color:T.text, letterSpacing:'.04em', textTransform:'uppercase' } }, lang==='en' ? 'Operational export filters' : 'فلاتر تصدير بيانات التشغيل'),
        h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 } },
          h('div', null,
            h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:6 } }, lang==='en' ? 'From date (optional)' : 'من تاريخ (اختياري)'),
            h('input', { type:'date', value:opFrom, onChange:function(e){ setOpFrom(e.target.value); }, style:inSt })
          ),
          h('div', null,
            h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:6 } }, lang==='en' ? 'To date (optional)' : 'إلى تاريخ (اختياري)'),
            h('input', { type:'date', value:opTo, onChange:function(e){ setOpTo(e.target.value); }, style:inSt })
          ),
          h('div', null,
            h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:6 } }, lang==='en' ? 'Max orders' : 'أقصى عدد طلبات'),
            h('input', { type:'number', min:1, max:5000, value:String(opMax), onChange:function(e){ setOpMax(e.target.value); }, style:inSt })
          )
        ),
        h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginTop:10 } },
          h('input', { type:'checkbox', checked:!!opIncludeDone, onChange:function(e){ setOpIncludeDone(!!e.target.checked); } }),
          h('span', { style:{ fontSize:13, color:T.text, fontWeight:600 } }, lang==='en' ? 'Include completed/cancelled orders' : 'تضمين الطلبات المكتملة/الملغاة')
        ),
        h('div', { style:{ marginTop:8, fontSize:12, color:T.textMute, lineHeight:1.6 } },
          lang==='en'
            ? 'Operational exports can become very large. Use the date range + max orders to keep the file size manageable.'
            : 'تصدير بيانات التشغيل قد يصبح كبيرًا جدًا. استخدم المدى الزمني وأقصى عدد طلبات لتقليل حجم الملف.'
        )
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' } },
        h(Btn, { variant:'primary', onClick:doExport, disabled:exporting || importing }, exporting ? '...' : (lang==='en' ? 'Export JSON' : 'تصدير JSON')),
        h('label', { style:{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 12px', border:'1px dashed '+T.border, borderRadius:T.radius, cursor: importing||exporting ? 'not-allowed' : 'pointer', color:T.text, fontSize:13, fontWeight:600, opacity:(importing||exporting)?0.6:1 } },
          importing ? (lang==='en' ? 'Importing…' : 'جاري الاستيراد…') : (lang==='en' ? 'Import JSON' : 'استيراد JSON'),
          h('input', { type:'file', accept:'application/json,.json', onChange:onImportFile, disabled:importing||exporting, style:{ display:'none' } })
        ),
        importOk && h('span', { style:{ color:T.green, fontSize:13, fontWeight:700 } }, '✅ ' + importOk),
        importErr && h('span', { style:{ color:T.red, fontSize:13, fontWeight:700 } }, '⚠️ ' + importErr)
      )
    )
  );
}



function ReportsView(props) {
  var i18n = useI18n(); var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders = asArr(bs.orders || []);
  var search = useSearch().q || '';
  var _sel = useState(''); var selectedId = _sel[0], setSelectedId = _sel[1];
  var _lf = useState({loading:false, data:null, error:null}); var lifecycle = _lf[0], setLifecycle = _lf[1];
  var todayYmd = new Date().toISOString().slice(0,10);
  var monthStartYmd = todayYmd.slice(0,8) + '01';
  var _rf = useState(monthStartYmd); var repFrom = _rf[0], setRepFrom = _rf[1];
  var _rt = useState(todayYmd); var repTo = _rt[0], setRepTo = _rt[1];
  var _er = useState({loading:false, rows:[], error:null}); var empReport = _er[0], setEmpReport = _er[1];

  function statCard(label, value, note, tone) {
    var tones = {
      blue:['rgba(59,130,246,.10)', '#2563eb'],
      green:['rgba(34,197,94,.10)', '#15803d'],
      amber:['rgba(245,158,11,.12)', '#b45309'],
      red:['rgba(239,68,68,.10)', '#dc2626'],
      gray:['rgba(148,163,184,.10)', T.text]
    };
    var tc = tones[tone||'gray'] || tones.gray;
    return h('div',{style:{background:tc[0],border:'1px solid '+T.border,borderRadius:18,padding:'16px 18px',minHeight:104}},
      h('div',{style:{fontSize:11,color:T.textMute,fontWeight:800,textTransform:'uppercase',letterSpacing:'.08em'}},label),
      h('div',{style:{fontSize:26,fontWeight:900,color:tc[1],marginTop:10,lineHeight:1.1}},value||'?'),
      note && h('div',{style:{fontSize:12,color:T.textMute,marginTop:8,lineHeight:1.5}},note)
    );
  }

  var filtered = orders.filter(function(o){
    if (!search) return true;
    var hay = String(o.order_number||'') + ' ' + String(getCust(o,lang)||'') + ' ' + String(o.status_slug||'');
    return hay.toLowerCase().indexOf(search.toLowerCase()) >= 0;
  });

  useEffect(function(){
    if (!filtered.length) { if (selectedId) setSelectedId(''); return; }
    var exists = filtered.some(function(o){ return String(o.id) === String(selectedId); });
    if (!selectedId || !exists) setSelectedId(String(filtered[0].id));
  }, [selectedId, filtered.length, search]);

  useEffect(function(){
    if (!selectedId) { setLifecycle({loading:false,data:null,error:null}); return; }
    setLifecycle(function(prev){ return {loading:true, data:prev.data, error:null}; });
    apiFetch('orders/'+selectedId+'/lifecycle', {fresh:true})
      .then(function(res){ setLifecycle({loading:false, data:res, error:null}); })
      .catch(function(e){ setLifecycle({loading:false, data:null, error:(e && e.message) || 'Error'}); });
  }, [selectedId]);

  useEffect(function(){
    setEmpReport(function(prev){ return {loading:true, rows:prev.rows||[], error:null}; });
    apiFetch('reports/employee-performance?from='+encodeURIComponent(repFrom)+'&to='+encodeURIComponent(repTo), {fresh:true})
      .then(function(res){ setEmpReport({loading:false, rows:asArr(res && res.rows), error:null}); })
      .catch(function(e){ setEmpReport({loading:false, rows:[], error:(e && e.message) || 'Error'}); });
  }, [repFrom, repTo]);

  var totalOrders = filtered.length;
  var activeOrders = filtered.filter(function(o){ return !isDone(o); }).length;
  var pausedOrders = filtered.filter(function(o){ return orderIsPaused(o); }).length;
  var lateOrders = filtered.filter(function(o){
    var s = orderActualStats(o);
    var exp = Math.round((parseFloat(o.expected_hours_total)||0) * 60);
    return exp > 0 && s.mins > exp;
  }).length;

  function calcOrderExpectedMins(o) {
    if (!o) return 0;
    if (typeof cspsrOrderExpectedMins === 'function') return cspsrOrderExpectedMins(o, bs.product_steps);
    return 0;
  }

  useTopbar((lang==='en'?'ERP Reports':'تقارير ERP')+' - '+totalOrders, null);

  var data = lifecycle.data || {};
  var order = data.order || null;
  var orderForStats = order || filtered.filter(function(o){ return String(o.id)===String(selectedId); })[0] || null;
  var stats = orderForStats ? orderActualStats(orderForStats) : {mins:0,secs:0,hasActual:false};
  var expectedMins = orderForStats ? calcOrderExpectedMins(orderForStats) : 0;
  var actualMins = stats.mins;
  var diffMins = actualMins - expectedMins;
  var currentStep = null;
  if (orderForStats) {
    asArr(orderForStats.items).forEach(function(item){
      asArr(item.steps).forEach(function(step){ if (!currentStep && stepStatusSlug(step)==='in_progress') currentStep = step; });
    });
  }
  var stepRows = order ? asArr(order.items).reduce(function(arr, item){
    return arr.concat(asArr(item.steps).map(function(step){ return Object.assign({__item:item}, step); }));
  }, []) : [];
  var reportOpsTasks = order ? asArr(order.ops_tasks) : [];
  function parseReportEmpIds(raw) {
    if (Array.isArray(raw)) return raw.map(function(v){ return String(v); }).filter(Boolean);
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.map(function(v){ return String(v); }).filter(Boolean) : [];
      } catch(_e) { return []; }
    }
    return [];
  }
  function reportEmpNameById(id) {
    var emp = findBy(asArr(bs.employees), 'id', parseInt(id, 10));
    if (!emp) return '';
    return (lang === 'en' && emp.name_en) ? emp.name_en : (emp.name || emp.name_en || '');
  }
  function reportTaskAssignees(task) {
    if (!task) return [];
    var names = [];
    if (Array.isArray(task.assigned_employees) && task.assigned_employees.length) {
      names = task.assigned_employees.map(function(e){
        return (lang === 'en' && e.name_en) ? e.name_en : (e.name || e.name_en || '');
      }).filter(Boolean);
    }
    if (!names.length) {
      var ids = parseReportEmpIds(task.assigned_employee_ids);
      if (!ids.length && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
      names = ids.map(reportEmpNameById).filter(Boolean);
    }
    if (!names.length && (task.assigned_employee_name || task.assigned_employee_name_en)) {
      names = [ (lang==='en' && task.assigned_employee_name_en) ? task.assigned_employee_name_en : (task.assigned_employee_name || task.assigned_employee_name_en) ];
    }
    return names;
  }
  var mergedEvents = [];
  asArr(data.events).forEach(function(e){ mergedEvents.push({kind:'order', at:e.event_time||e.created_at||'', label:e.event_type||e.title||'event'}); });
  asArr(data.step_events).forEach(function(e){ mergedEvents.push({kind:'step', at:e.event_time||e.created_at||'', label:e.event_type||e.title||'step_event'}); });
  mergedEvents.sort(function(a,b){ return String(b.at||'').localeCompare(String(a.at||'')); });

  return h('div',{style:{display:'flex',flexDirection:'column',gap:18}},
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14}},
      statCard(lang==='en'?'Orders in View':'الطلبات المعروضة', String(totalOrders), lang==='en'?'Current filtered portfolio':'الطلبات الظاهرة حسب الفلترة الحالية', 'blue'),
      statCard(lang==='en'?'Active Orders':'الطلبات النشطة', String(activeOrders), lang==='en'?'Still moving in production':'طلبات ما زالت قيد التنفيذ', 'green'),
      statCard(lang==='en'?'Paused Orders':'الطلبات المتوقفة', String(pausedOrders), lang==='en'?'Need intervention':'تحتاج متابعة أو تدخل', 'amber'),
      statCard(lang==='en'?'Late Orders':'الطلبات المتأخرة', String(lateOrders), lang==='en'?'Actual higher than expected':'الوقت الفعلي أعلى من المتوقع', lateOrders>0?'red':'gray')
    ),
    h(Card,{style:{padding:'18px 20px'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}},
        h('div',null,
          h('div',{style:{fontWeight:900,fontSize:17,color:T.text}},lang==='en'?'Employee Performance':'أداء الموظفين'),
          h('div',{style:{fontSize:12,color:T.textMute,marginTop:4}},lang==='en'?'Completed tasks, on-time/late, and points by period.':'عدد المهام المنجزة وضمن الوقت والمتأخرة ومجموع النقاط حسب الفترة.')
        ),
        h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
          h('label',{style:{fontSize:12,color:T.textMute}},lang==='en'?'From':'من'),
          h('input',{type:'date',value:repFrom,onChange:function(e){ setRepFrom(e.target.value || monthStartYmd); },style:{padding:'8px 10px',border:'1px solid '+T.border,borderRadius:10,background:T.bg,color:T.text}}),
          h('label',{style:{fontSize:12,color:T.textMute}},lang==='en'?'To':'إلى'),
          h('input',{type:'date',value:repTo,onChange:function(e){ setRepTo(e.target.value || todayYmd); },style:{padding:'8px 10px',border:'1px solid '+T.border,borderRadius:10,background:T.bg,color:T.text}})
        )
      ),
      empReport.error
        ? h('div',{style:{fontSize:13,color:T.red,padding:'8px 0'}},empReport.error)
        : h('div',{style:{border:'1px solid '+T.border,borderRadius:14,overflow:'hidden'}},
            h('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:13}},
              h('thead',null,
                h('tr',{style:{background:T.bgSub,color:T.textMute,textAlign:'left'}},
                  h('th',{style:{padding:'10px 12px'}},lang==='en'?'Employee':'الموظف'),
                  h('th',{style:{padding:'10px 12px',textAlign:'center'}},lang==='en'?'Done Tasks':'المهام المنجزة'),
                  h('th',{style:{padding:'10px 12px',textAlign:'center'}},lang==='en'?'On Time':'ضمن الوقت'),
                  h('th',{style:{padding:'10px 12px',textAlign:'center'}},lang==='en'?'Late':'متأخرة'),
                  h('th',{style:{padding:'10px 12px',textAlign:'center'}},lang==='en'?'Points':'النقاط')
                )
              ),
              h('tbody',null,
                empReport.loading
                  ? h('tr',null,h('td',{colSpan:5,style:{padding:'16px',textAlign:'center',color:T.textMute}},lang==='en'?'Loading...':'جار التحميل...'))
                  : (!empReport.rows || !empReport.rows.length)
                    ? h('tr',null,h('td',{colSpan:5,style:{padding:'16px',textAlign:'center',color:T.textMute}},lang==='en'?'No data in this period':'لا توجد بيانات في هذه الفترة'))
                    : empReport.rows.map(function(r){
                        var nm = (lang==='en' && r.employee_name_en) ? r.employee_name_en : (r.employee_name || r.employee_name_en || ('#'+r.employee_id));
                        return h('tr',{key:'emp-'+r.employee_id,style:{borderTop:'1px solid '+T.border}},
                          h('td',{style:{padding:'10px 12px',fontWeight:700,color:T.text}},nm),
                          h('td',{style:{padding:'10px 12px',textAlign:'center',color:T.text}},String(r.tasks_total||0)),
                          h('td',{style:{padding:'10px 12px',textAlign:'center',color:T.green,fontWeight:700}},String(r.tasks_on_time||0)),
                          h('td',{style:{padding:'10px 12px',textAlign:'center',color:T.red,fontWeight:700}},String(r.tasks_late||0)),
                          h('td',{style:{padding:'10px 12px',textAlign:'center',color:T.text,fontWeight:800}},String(r.points_total||0))
                        );
                      })
              )
            )
          )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'330px minmax(0,1fr)',gap:18,alignItems:'start',minWidth:0}},
      h(Card,{style:{padding:0,overflow:'hidden',position:'sticky',top:84}},
        h('div',{style:{padding:'18px',borderBottom:'1px solid '+T.border,background:'linear-gradient(180deg, rgba(99,91,255,.07), transparent)'}},
          h('div',{style:{fontSize:18,fontWeight:900,color:T.text}},lang==='en'?'Orders Ledger':'سجل الطلبات'),
          h('div',{style:{fontSize:12,color:T.textMute,marginTop:4}},lang==='en'?'Choose an order to inspect lifecycle, timing, and operational health.':'اختر طلباً لمراجعة دورة حياته والأوقات والحالة التشغيلية.')
        ),
        h('div',{style:{maxHeight:'calc(100vh - 170px)',overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:10}},
          filtered.length===0
            ? h('div',{style:{padding:24,textAlign:'center',color:T.textMute,fontSize:13}},lang==='en'?'No matching orders':'لا توجد طلبات مطابقة')
            : filtered.map(function(o){
                var active = String(o.id)===String(selectedId);
                var paused = orderIsPaused(o);
                var oStats = orderActualStats(o);
                var oExp = calcOrderExpectedMins(o);
                return h('button',{
                  key:o.id,
                  onClick:function(){ setSelectedId(String(o.id)); },
                  style:{textAlign:'start',padding:'14px',borderRadius:16,border:'1px solid '+(active?T.accent:T.border),background:active?'rgba(99,91,255,.08)':T.bg,cursor:'pointer',boxShadow:active?'0 12px 28px rgba(99,91,255,.12)':'none'}
                },
                  h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}},
                    h('div',null,
                      h('div',{style:{fontFamily:'monospace',fontWeight:900,fontSize:16,color:T.text}},'#'+o.order_number),
                      h('div',{style:{fontSize:13,fontWeight:700,color:T.text,marginTop:5}},getCust(o,lang))
                    ),
                    h('div',{style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}},
                      paused && h(Badge,{label:'Paused',color:'amber'}),
                      statusBadge(paused?'paused':o.status_slug, asArr(bs.statuses), lang)
                    )
                  ),
                  h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11,color:T.textMute,marginTop:10}},
                    h('div',null,(lang==='en'?'Expected: ':'المتوقع: ')+(oExp>0?fmtMin(oExp):'?')),
                    h('div',{style:{textAlign:'end'}},(lang==='en'?'Actual: ':'الفعلي: ')+(oStats.hasActual?fmtMin(oStats.mins):'?')),
                    h('div',null,(lang==='en'?'Delivery: ':'التسليم: ')+fmtDate(o.delivery_date||o.deadline,lang)),
                    h('div',{style:{textAlign:'end'}},(lang==='en'?'Progress: ':'التقدم: ')+progOf(o)+'%')
                  ),
                  h('div',{style:{marginTop:10,height:6,borderRadius:99,background:T.bgSub,overflow:'hidden'}},
                    h('div',{style:{width:progOf(o)+'%',height:'100%',background:paused?'#f59e0b':'linear-gradient(90deg, #635bff, #22c55e)',borderRadius:99}})
                  )
                );
              })
        )
      ),
      h('div',{style:{display:'flex',flexDirection:'column',gap:18,minWidth:0}},
        !selectedId
          ? h(Card,null,h('div',{style:{color:T.textMute,fontSize:14}},lang==='en'?'Select an order to begin.':'اختر طلباً للبدء.'))
          : lifecycle.loading && !lifecycle.data
            ? h(Card,null,h('div',{style:{display:'flex',alignItems:'center',gap:10,color:T.textMute}},h(Spinner),lang==='en'?'Loading lifecycle...':'جار تحميل دورة الحياة...'))
            : lifecycle.error
              ? h(Card,null,h('div',{style:{color:T.red,fontWeight:700}},lifecycle.error))
              : h(React.Fragment,null,
                  h(Card,{style:{padding:'22px 24px',background:'linear-gradient(180deg, rgba(99,91,255,.08), transparent 45%)'}},
                    h('div',{style:{display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start',flexWrap:'wrap'}},
                      h('div',null,
                        h('div',{style:{fontSize:28,fontWeight:900,color:T.text,fontFamily:'monospace'}},'#'+(orderForStats?orderForStats.order_number:'')),
                        h('div',{style:{fontSize:14,color:T.textMute,marginTop:8}},getCust(orderForStats||{},lang)),
                        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}},
                          statusBadge(orderIsPaused(orderForStats||{})?'paused':((orderForStats&&orderForStats.status_slug)||'pending'), asArr(bs.statuses), lang),
                          currentStep && h(Badge,{label:(lang==='en'?'Current: ':'الحالية: ')+lnStep(currentStep,lang),color:'blue'}),
                          (orderForStats && (orderForStats.delivery_date || orderForStats.deadline)) && h(Badge,{label:(lang==='en'?'Delivery: ':'التسليم: ')+fmtDate(orderForStats.delivery_date||orderForStats.deadline,lang),color:'gray'})
                        )
                      ),
                      h('div',{style:{minWidth:280,flex:'1 1 340px'}},
                        h('div',{style:{display:'flex',justifyContent:'space-between',fontSize:12,color:T.textMute,marginBottom:8}},
                          h('span',null,lang==='en'?'Progress':'التقدم'),
                          h('span',{style:{fontWeight:800,color:T.text}},progOf(orderForStats||{})+'%')
                        ),
                        h('div',{style:{height:10,borderRadius:99,background:T.bgSub,overflow:'hidden'}},
                          h('div',{style:{width:progOf(orderForStats||{})+'%',height:'100%',background:'linear-gradient(90deg, #635bff, #22c55e)',borderRadius:99}})
                        ),
                        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginTop:18}},
                          statCard(lang==='en'?'Expected':'المتوقع', expectedMins>0?fmtMin(expectedMins):'?', lang==='en'?'Planned production time':'وقت الإنتاج المخطط', 'gray'),
                          statCard(lang==='en'?'Actual':'الفعلي', actualMins>0?fmtMin(actualMins):'?', lang==='en'?'Real consumed time':'الوقت الفعلي المستهلك', diffMins>0?'red':(actualMins>0?'green':'gray')),
                          statCard(lang==='en'?'Variance':'الفرق', expectedMins>0?(diffMins>0?'+':'')+fmtMin(Math.abs(diffMins)):'?', lang==='en'?'Against plan':'مقارنة بالخطة', diffMins>0?'red':(diffMins<0?'green':'blue'))
                        )
                      )
                    )
                  ),
                    h('div',{style:{display:'grid',gridTemplateColumns:'minmax(0,1fr) 320px',gap:18,alignItems:'start',minWidth:0}},
                      h('div',{style:{display:'flex',flexDirection:'column',gap:18,minWidth:0}},
                      h(Card,{style:{padding:'20px 22px'}},
                        h('div',{style:{fontWeight:900,fontSize:17,color:T.text,marginBottom:6}},lang==='en'?'Operations Linked to Order':'مهام التشغيل المرتبطة بالطلب'),
                        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:14}},lang==='en'?'Department/stage transitions, responsible employee(s), movement time, and task deadline.':'انتقالات الأقسام والمراحل مع الموظفين المسؤولين وتوقيت الحركة والموعد النهائي.'),
                        reportOpsTasks.length===0
                          ? h('div',{style:{color:T.textMute,fontSize:13}},lang==='en'?'No linked operations tasks':'لا توجد مهام تشغيل مرتبطة')
                          : h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
                              reportOpsTasks.map(function(task){
                                var events = asArr(task.timeline).filter(function(evt){
                                  return evt && (evt.event_type === 'task_moved' || evt.event_type === 'task_completed');
                                }).slice().sort(function(a, b){
                                  return String(a.event_time || a.created_at || '').localeCompare(String(b.event_time || b.created_at || ''));
                                });
                                var assignees = reportTaskAssignees(task);
                                return h('div',{key:'report-ops-task-'+task.id,style:{border:'1px solid '+T.border,borderRadius:14,padding:'12px 14px',background:T.bgSub}},
                                  h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}},
                                    h('div',{style:{fontFamily:'monospace',fontWeight:900,fontSize:14,color:T.accent}},task.task_no || ('OT-' + task.id)),
                                    h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
                                      task.deadline && h(Badge,{label:(lang==='en'?'Deadline: ':'الموعد النهائي: ')+fmtDateTime(task.deadline, lang), color:'gray'}),
                                      h(Badge,{label:(lang==='en'?'Done: ':'الإنجاز: ')+(task.completed_at ? fmtDateTime(task.completed_at, lang) : '—'), color:'green'})
                                    )
                                  ),
                                  h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:8}},
                                    h('span',{style:{fontSize:11,color:T.textMute,fontWeight:700}},lang==='en'?'Assigned:':'المكلف:'),
                                    assignees.length
                                      ? assignees.map(function(n, i){ return h(Badge,{key:'report-ops-task-assignee-'+task.id+'-'+i,label:n,color:'blue'}); })
                                      : h('span',{style:{fontSize:11,color:T.textMute}},'—')
                                  ),
                                  events.length===0
                                    ? h('div',{style:{fontSize:11,color:T.textMute}},lang==='en'?'No movement log yet':'لا يوجد سجل تنقّل بعد')
                                    : h('div',{style:{display:'flex',flexDirection:'column',gap:6}},
                                        events.map(function(evt, idx){
                                          var pld = evt.payload || {};
                                          var fromTxt = [pld.from_department_name, pld.from_stage_name].filter(Boolean).join(' / ');
                                          var toTxt = [pld.to_department_name, pld.to_stage_name].filter(Boolean).join(' / ');
                                          var prev = idx > 0 ? events[idx - 1] : null;
                                          var gapTxt = '';
                                          if (prev) {
                                            var a = parseServerDate(evt.event_time || evt.created_at || '');
                                            var b = parseServerDate(prev.event_time || prev.created_at || '');
                                            if (!isNaN(a) && !isNaN(b)) {
                                              var mins = Math.max(0, Math.round((a - b) / 60000));
                                              gapTxt = ' • ' + (lang==='en' ? 'Gap: ' : 'الفاصل: ') + fmtMin(mins);
                                            }
                                          }
                                          return h('div',{key:'report-ops-evt-'+(evt.id||idx),style:{fontSize:11,color:T.textMid,lineHeight:1.5,border:'1px solid '+T.border,borderRadius:10,padding:'8px 10px',background:T.bg}},
                                            h('div',{style:{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}},
                                              h('span',{style:{fontWeight:700,color:T.text}},
                                                evt.event_type === 'task_completed'
                                                  ? (lang==='en' ? 'Completed' : 'مكتملة')
                                                  : (lang==='en' ? 'Moved' : 'انتقال')
                                              ),
                                              h('span',{style:{color:T.textMute}},fmtDateTime(evt.event_time || evt.created_at, lang) + gapTxt)
                                            ),
                                            h('div',{style:{marginTop:4}},
                                              evt.event_type === 'task_completed'
                                                ? ((lang==='en' ? 'Completed at ' : 'اكتملت عند ') + ((toTxt || fromTxt || '—')))
                                                : ((lang==='en' ? 'Moved ' : 'انتقلت ') + (fromTxt || '—') + ' → ' + (toTxt || '—'))
                                            )
                                          );
                                        })
                                      )
                                );
                              })
                            )
                      ),
                      h(Card,{style:{padding:'20px 22px'}},
                        h('div',{style:{fontWeight:900,fontSize:17,color:T.text,marginBottom:6}},lang==='en'?'Step Performance Matrix':'مصفوفة أداء الخطوات'),
                        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:14}},lang==='en'?'Expected vs actual for each step, with operational state and product linkage.':'مقارنة المتوقع والفعلي لكل خطوة مع الحالة التشغيلية وربطها بالمنتج.'),
                        stepRows.length===0
                          ? h('div',{style:{color:T.textMute,fontSize:13}},lang==='en'?'No steps available':'لا توجد خطوات')
                          : h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
                              stepRows.map(function(step){
                                var st = orderActualStats({items:[{steps:[step]}]});
                                var stepActual = st.mins;
                                var stepSlug = stepStatusSlug(step);
                                var hasStepActual = (
                                  stepActual > 0 ||
                                  !!(step.actual_started_at || step.started_at || step.actual_completed_at || step.completed_at) ||
                                  ((stepSlug === 'done' || stepSlug === 'completed') && parseInt(step.actual_duration_minutes,10) >= 0) ||
                                  stepSlug === 'in_progress'
                                );
                                var stepExpected = stepExpectedStepMins(step, step.__item || null, bs.product_steps);
                                var stepDiff = hasStepActual && stepExpected>0 ? (stepActual - stepExpected) : null;
                                return h('div',{key:step.id,style:{border:'1px solid '+T.border,borderRadius:16,padding:'14px 16px',background:stepSlug==='in_progress'?'rgba(34,197,94,.05)':((stepSlug==='done'||stepSlug==='completed')?'rgba(59,130,246,.04)':T.bg),overflow:'hidden'}},
                                  h('div',{style:{display:'grid',gridTemplateColumns:'minmax(150px,1.4fr) repeat(3,minmax(72px,90px)) minmax(110px,130px)',gap:12,alignItems:'center',minWidth:0}},
                                    h('div',null,
                                      h('div',{style:{fontWeight:800,color:T.text,fontSize:14}},lnStep(step,lang)),
                                      h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},(lang==='en'&&step.__item&&step.__item.product_name_en)?step.__item.product_name_en:((step.__item&&step.__item.product_name)||''))
                                    ),
                                    h('div',null,h('div',{style:{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase'}},lang==='en'?'Expected':'المتوقع'),h('div',{style:{fontSize:14,fontWeight:800,color:T.text,marginTop:4}},stepExpected>0?fmtMin(stepExpected):'?')),
                                    h('div',null,h('div',{style:{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase'}},lang==='en'?'Actual':'الفعلي'),h('div',{style:{fontSize:14,fontWeight:800,color:T.text,marginTop:4}},hasStepActual?fmtMin(stepActual):'?')),
                                    h('div',null,h('div',{style:{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase'}},lang==='en'?'Variance':'الفرق'),h('div',{style:{fontSize:14,fontWeight:800,color:stepDiff===null?T.textMute:(stepDiff>0?T.red:(stepDiff<0?T.green:T.text)),marginTop:4}},stepDiff===null?'?':(stepDiff>0?'+':'')+fmtMin(Math.abs(stepDiff)))),
                                    h('div',{style:{display:'flex',justifyContent:'flex-end'}},statusBadge(parseInt(step.is_paused,10)===1?'paused':step.status_slug, asArr(bs.statuses), lang))
                                  )
                                );
                              })
                            )
                      ),
                      h(Card,{style:{padding:'20px 22px'}},
                        h('div',{style:{fontWeight:900,fontSize:17,color:T.text,marginBottom:6}},lang==='en'?'Lifecycle Activity Feed':'سجل دورة الحياة'),
                        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:14}},lang==='en'?'A chronological audit trail for order and step transitions.':'سجل زمني لحركات الطلب وانتقالات الخطوات.'),
                        mergedEvents.length===0
                          ? h('div',{style:{color:T.textMute,fontSize:13}},lang==='en'?'No events yet':'لا توجد أحداث بعد')
                          : h('div',{style:{display:'flex',flexDirection:'column'}},
                              mergedEvents.slice(0,80).map(function(ev, idx){
                                return h('div',{key:(ev.kind||'e')+'-'+idx,style:{display:'grid',gridTemplateColumns:'24px minmax(0,1fr)',gap:14,padding:'12px 0',borderTop:idx===0?'none':'1px solid '+T.border}},
                                  h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center'}},
                                    h('div',{style:{width:10,height:10,borderRadius:99,background:ev.kind==='step'?T.accent:T.green,marginTop:4}}),
                                    idx < Math.min(mergedEvents.length,80)-1 && h('div',{style:{width:2,flex:1,background:T.border,marginTop:6}})
                                  ),
                                  h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}},
                                    h('div',null,
                                      h('div',{style:{fontSize:14,fontWeight:800,color:T.text}},String(ev.label||'?').replace(/_/g,' ')),
                                      h('div',{style:{fontSize:12,color:T.textMute,marginTop:4}},ev.kind==='step'?(lang==='en'?'Step event':'حدث خطوة'):(lang==='en'?'Order event':'حدث طلب'))
                                    ),
                                    h('div',{style:{textAlign:'end'}},
                                      h('div',{style:{fontSize:12,fontWeight:700,color:T.textMute}},ev.at?fmtDateTime(ev.at, lang):'?'),
                                      h('div',{style:{marginTop:6}},h(Badge,{label:ev.kind==='step'?(lang==='en'?'STEP':'خطوة'):(lang==='en'?'ORDER':'طلب'),color:ev.kind==='step'?'blue':'gray'}))
                                    )
                                  )
                                );
                              })
                            )
                      )
                    ),
                    h('div',{style:{display:'flex',flexDirection:'column',gap:18,position:'sticky',top:84,minWidth:0,width:'100%',alignSelf:'start'}},
                      h(Card,{style:{padding:'20px 22px'}},
                        h('div',{style:{fontWeight:900,fontSize:17,color:T.text,marginBottom:6}},lang==='en'?'Operational Snapshot':'ملخص تشغيلي'),
                        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:14}},lang==='en'?'Fast ERP-style readout for the selected order.':'ملخص سريع بأسلوب ERP للطلب المحدد.'),
                        h('div',{style:{display:'grid',gridTemplateColumns:'1fr',gap:12}},
                          statCard(lang==='en'?'Current Step':'الخطوة الحالية', currentStep?lnStep(currentStep,lang):'?', lang==='en'?'Live production position':'الموقع الحالي داخل مسار الإنتاج', 'blue'),
                          statCard(lang==='en'?'Timing Status':'حالة الوقت', expectedMins>0?(diffMins>0?(lang==='en'?'Behind plan':'متأخر عن الخطة'):(diffMins<0?(lang==='en'?'Ahead of plan':'أسرع من الخطة'):(lang==='en'?'On plan':'ضمن الخطة'))):'?', lang==='en'?'Expected vs actual':'مقارنة المتوقع بالفعلي', diffMins>0?'red':(diffMins<0?'green':'gray')),
                          statCard(lang==='en'?'Delivery Target':'موعد التسليم', (orderForStats && (orderForStats.delivery_date || orderForStats.deadline)) ? fmtDate(orderForStats.delivery_date||orderForStats.deadline,lang) : '?', lang==='en'?'Customer-facing deadline':'الموعد النهائي للعميل', 'gray')
                        )
                      ),
                      h(Card,{style:{padding:'20px 22px'}},
                        h('div',{style:{fontWeight:900,fontSize:17,color:T.text,marginBottom:6}},lang==='en'?'Items in Order':'عناصر الطلب'),
                        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:14}},lang==='en'?'Commercial items attached to this order.':'العناصر التجارية المرتبطة بهذا الطلب.'),
                        !order || asArr(order.items).length===0
                          ? h('div',{style:{color:T.textMute,fontSize:13}},lang==='en'?'No items':'لا توجد عناصر')
                          : h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
                              asArr(order.items).map(function(item){
                                return h('div',{key:item.id,style:{padding:'12px 14px',border:'1px solid '+T.border,borderRadius:14,background:T.bgSub}},
                                  h('div',{style:{display:'flex',justifyContent:'space-between',gap:10}},
                                    h('div',{style:{fontWeight:800,color:T.text}},(lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name),
                                    h('div',{style:{fontSize:12,color:T.textMute,fontWeight:700}},'×'+(item.quantity||1))
                                  ),
                                  item.specifications && h('div',{style:{fontSize:11,color:T.textMute,marginTop:6,lineHeight:1.5}},item.specifications)
                                );
                              })
                            )
                      )
                    )
                  )
                )
      )
    )
  );
}

function AppInner(props) {
  var bs = props.bs;
  var i18n = useI18n(); var t = i18n.t;
  var authUser = props.authUser || {};
  var defaultTab = 'dashboard';
  var isDeliveryOnly = authUser.role !== 'admin' && (function(){
    var perms = (bs.data && bs.data.user_permissions) || [];
    var hasDelivery = perms.indexOf('delivery_orders.view') >= 0;
    var hasOther = ['orders.view','customers.view','products.view','kds.view','reports.view'].some(function(p){ return perms.indexOf(p) >= 0; });
    return hasDelivery && !hasOther;
  })();
  if (isDeliveryOnly) defaultTab = 'delivery-orders';
  var _tab = useState(function(){ return readPersistedTab(defaultTab); }); var tab = _tab[0], setTab = _tab[1];
  var _showAvatar = useState(false); var showAvatar = _showAvatar[0], setShowAvatar = _showAvatar[1];
  var _q = useState(''); var searchQ = _q[0], setSearchQ = _q[1];
  var _meta = useState({subtitle:'',action:null}); var topbarMeta = _meta[0], setTopbarMeta = _meta[1];

  function setMeta(m) { setTopbarMeta(function(prev){ return Object.assign({},prev,m); }); }

  /* clear search when tab changes */
  useEffect(function(){ setSearchQ(''); }, [tab]);

  /* Page meta: title + search placeholder per tab */
  var PAGE_META = {
    'dashboard':       { title: t('dashboard'),        search: false },
    'orders':          { title: t('orders'),            placeholder: t('search')+'...' },
    'completed-orders':{ title: t('completed_orders'),  placeholder: t('search')+'...' },
    'customers':       { title: t('customers'),         placeholder: t('search')+'...' },
    'products':        { title: t('products'),          placeholder: t('search')+'...' },
    'suppliers':       { title: t('suppliers'),         placeholder: t('search')+'...' },
    'product-steps':   { title: t('product_steps'),     placeholder: t('search')+'...' },
    'steps':           { title: t('steps'),             placeholder: t('search')+'...' },
    'my-tasks':        { title: t('my_tasks'),          placeholder: t('search')+'...' },
    'external-tasks':  { title: t('external_tasks'),    placeholder: t('search')+'...' },
    'delivery-orders': { title: t('delivery_orders'),   search: false },
    'reports':         { title: t('perm_reports'),      placeholder: t('search')+'...' },
    'notifications':   { title: t('notifications'),     placeholder: t('search')+'...' },
    'roles':           { title: t('roles'),             placeholder: t('search')+'...' },
    'departments':     { title: t('departments'),        placeholder: t('search')+'...' },
    'teams':           { title: t('teams'),             placeholder: t('search')+'...' },
    'employees':       { title: t('employees'),         placeholder: t('search')+'...' },
    'statuses':        { title: t('statuses'),          placeholder: t('search')+'...' },
    'users':           { title: t('users_mgmt'),         placeholder: t('search')+'...' },
    'kds':             { title: t('kds'),               search: false },
    'settings':        { title: i18n.lang==='en' ? 'Settings' : 'الإعدادات', search: false },
    'ops-tasks':       { title: t('operations_tasks'),   search: false },
  };
  useEffect(function(){
    var normalizedTab = normalizeTabId(tab, defaultTab);
    if (normalizedTab !== tab) {
      setTab(normalizedTab);
      return;
    }
    if (isDeliveryOnly && normalizedTab !== 'delivery-orders') {
      setTab('delivery-orders');
      return;
    }
    if (!PAGE_META[normalizedTab]) {
      setTab(defaultTab);
    }
  }, [tab, defaultTab, isDeliveryOnly]);
  useEffect(function(){
    if (!tab) return;
    persistActiveTab(tab);
  }, [tab]);
  useEffect(function(){
    if (typeof window === 'undefined' || !window.addEventListener) return;
    function onHashChange() {
      var nextTab = readPersistedTab(defaultTab);
      if (nextTab && nextTab !== tab) setTab(nextTab);
    }
    window.addEventListener('hashchange', onHashChange);
    return function(){ window.removeEventListener('hashchange', onHashChange); };
  }, [tab, defaultTab]);
  var effectiveTab = normalizeTabId(tab, defaultTab);
  var meta = PAGE_META[effectiveTab] || { title: effectiveTab };
  var showTopSearch = meta.search !== false;

  /* show full loading screen only on first load (no data yet) */
  if (bs.loading && !bs.data) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner),t('loading_data'));
  if (bs.error && !bs.data)   return h('div',{style:{padding:40,color:T.red,textAlign:'center',fontSize:14}},'⚠️ '+bs.error);

  var vp = { bootstrap:bs.data, onReload:bs.reload, onSilentReload:bs.silentReload, onOrderUpdate:bs.patchOrder, authUser:props.authUser };
  var viewMap = {
    'dashboard':      function(){ return h(DashboardView,      vp); },
    'orders':         function(){ return h(OrdersView, Object.assign({},vp,{pauseReasons:(props.branding&&props.branding.pause_reasons)||[], branding:props.branding})); },
    'completed-orders':function(){ return h(ArchivedOrdersView,vp); },
    'kds':            function(){ return h(KDSView, Object.assign({},vp,{pauseReasons:(props.branding&&props.branding.pause_reasons)||[], carouselInterval:(props.branding&&props.branding.kds_carousel_interval)||8, whatsappNotify:(props.branding&&props.branding.whatsapp_notify)||'', branding:props.branding})); },
    'customers':      function(){ return h(CustomersView,      vp); },
    'products':       function(){ return h(ProductsView,       vp); },
    'product-steps':  function(){ return h(ProductStepsView,   vp); },
    'steps':          function(){ return h(StepsDirectoryView, vp); },
    'suppliers':      function(){ return h(SuppliersView,      vp); },
    'my-tasks':       function(){ return h(TasksView, Object.assign({},vp,{externalOnly:false, authUser:props.authUser})); },
    'external-tasks': function(){ return h(ExternalTasksView, Object.assign({},vp,{authUser:props.authUser})); },
    'delivery-orders':function(){ return h(DeliveryOrdersView, Object.assign({},vp,{authUser:props.authUser, whatsappNotify:(props.branding&&props.branding.whatsapp_notify)||''})); },
    'notifications':  function(){ return h(NotificationsView,  vp); },
    'roles':          function(){ return h(RolesView,          vp); },
    'departments':    function(){ return h(DepartmentsView,    vp); },
    'teams':          function(){ return h(TeamsView,          vp); },
    'employees':      function(){ return h(EmployeesView,      vp); },
    'statuses':       function(){ return h(StatusesView,       vp); },
    'users':          function(){ return h(UsersView,          vp); },
    'settings':       function(){ return h(SettingsView, Object.assign({},vp,{branding:props.branding, onBrandingUpdate:function(b){ if(props.onBrandingUpdate) props.onBrandingUpdate(b); }})); },
    'reports':        function(){ return h(ReportsView, vp); },
    'ops-tasks':      function(){ return h(OperationsTasksView, vp); },
  };

  if (isDeliveryOnly) {
    return h('div', { style:{ minHeight:'100vh', background:T.bgSub, direction:i18n.isRtl?'rtl':'ltr', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" } },
      h('div', { style:{ maxWidth:640, margin:'0 auto', padding:'16px 12px' } },
        h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } },
          h('div', { style:{ fontWeight:700, fontSize:16, color:T.text } }, '🚚 '+t('delivery_orders')),
          h('button', { onClick:props.onLogout, style:{ background:'none', border:'1px solid '+T.border, borderRadius:T.radius, padding:'5px 12px', cursor:'pointer', fontSize:12, color:T.textMute } }, 'Logout')
        ),
        h(DeliveryOrdersView, { bootstrap:bs.data, onReload:bs.reload, onSilentReload:bs.silentReload, authUser:props.authUser, whatsappNotify:(props.branding&&props.branding.whatsapp_notify)||'' })
      )
    );
  }

  return h(TopbarCtx.Provider, { value:{ setMeta:setMeta } },
    h(SearchCtx.Provider, { value:{ q:searchQ, setQ:setSearchQ, placeholder: meta.placeholder||'' } },
    h(AppLayout, null,
    h(Sidebar, { tab:effectiveTab, setTab:setTab, branding:props.branding, authUser:props.authUser, onLogout:props.onLogout }),
    h('main', { dir: i18n.isRtl ? 'rtl' : 'ltr', style:{ flex:1, overflowY:'auto', height:'100vh', display:'flex', flexDirection:'column', paddingTop:56, marginLeft:i18n.isRtl?0:'var(--cspsr-sidebar-width)', marginRight:i18n.isRtl?'var(--cspsr-sidebar-width)':0 } },
      /* â”€â”€ Topbar: 3-column grid â€” title | search | actions â”€â”€ */
      h('div', { dir: i18n.isRtl?'rtl':'ltr', style:{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:0, padding:'0 20px', borderBottom:'1px solid '+T.border, background:T.bg, height:56, flexShrink:0, position:'fixed', top:0, left:i18n.isRtl?'auto':'var(--cspsr-sidebar-width)', right:i18n.isRtl?'var(--cspsr-sidebar-width)':0, width:'calc(100% - var(--cspsr-sidebar-width))', zIndex:300, boxSizing:'border-box' } },
        /* Col 1: Page title â€” always at logical start */
        h('div', { style:{ minWidth:0 } },
          h('div', { style:{ fontWeight:700, fontSize:15, color:T.text, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, meta.title),
          topbarMeta.subtitle && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:1 } }, topbarMeta.subtitle)
        ),
        /* Col 2: Search â€” always centered, fixed width */
        h('div', { style:{ width: showTopSearch ? 440 : 0, position:'relative', overflow:'hidden' } },
          showTopSearch && h('span', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'right':'left']:'12px', color:T.textMute, fontSize:13, pointerEvents:'none', zIndex:1 } }, '🔍'),
          showTopSearch && h('input', {
            value: searchQ,
            onChange: function(e){ setSearchQ(e.target.value); },
            placeholder: meta.placeholder || t('search')+'...',
            style:{ width:'100%', padding: i18n.isRtl ? '8px 36px 8px 30px' : '8px 30px 8px 36px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, outline:'none', background:T.bgSub, color:T.text, fontFamily:'inherit' },
            onFocus:function(e){ e.target.style.borderColor=T.accent; },
            onBlur:function(e){ e.target.style.borderColor=T.border; },
          }),
          showTopSearch && searchQ && h('button', { onClick:function(){ setSearchQ(''); }, style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'left':'right']:'10px', background:'none', border:'none', cursor:'pointer', color:T.textMute, fontSize:14, padding:2 } }, '✕')
        ),
        /* Col 3: Action + User + Lang + Logout â€” always at logical end */
        h('div', { style:{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' } },
          topbarMeta.action && topbarMeta.action,
          topbarMeta.action && h('div', { style:{ width:1, height:28, background:T.border } }),
          props.authUser && h('div', { style:{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'4px 8px', borderRadius:T.radius, flexShrink:0 }, onClick:function(){ setShowAvatar(true); },
            onMouseEnter:function(e){ e.currentTarget.style.background=T.bgSub; },
            onMouseLeave:function(e){ e.currentTarget.style.background='transparent'; }
          },
            h(UserAvatar, { user:props.authUser, size:32 }),
            h('div', null,
              h('div', { style:{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.2 } }, props.authUser.name),
              h('div', { style:{ fontSize:10, color:T.textMute } }, props.authUser.role==='admin'?t('role_admin_short'):t('role_user_short') )
            )
          ),
          h('button', { onClick:function(){ i18n.setLang(i18n.lang==='ar'?'en':'ar'); }, style:{ padding:'5px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0 } },
            h('span',null,'Lang'), h('span',null, i18n.lang==='ar'?'EN':'عربي')
          ),
          props.onLogout && h('button', { onClick:props.onLogout, title:'Sign out', style:{ padding:'7px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', flexShrink:0, lineHeight:1 } },
            h('svg',{xmlns:'http://www.w3.org/2000/svg',width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},
              h('path',{d:'M18.36 6.64a9 9 0 1 1-12.73 0'}),
              h('line',{x1:12,y1:2,x2:12,y2:12})
            )
          )
        )
      ),
      h('div', { style:{ padding: effectiveTab==='kds' ? '20px 20px' : '28px 32px', maxWidth: effectiveTab==='kds' ? '100%' : 1100, margin:'0 auto', width:'100%' } },
        h(ErrorBoundary, null, (viewMap[effectiveTab] || viewMap['dashboard'])())
      ),
      showAvatar && props.authUser && h(AvatarModal, {
        user: props.authUser,
        onClose: function(){ setShowAvatar(false); },
        onSaved: function(avatar){
          props.onAvatarUpdate && props.onAvatarUpdate(avatar);
        }
      })
    )
  )));
}

function App() {
  var rootEl = document.getElementById('cspsr-root');
  var mode = (rootEl && rootEl.dataset && rootEl.dataset.mode) ? rootEl.dataset.mode : 'app';
  /* —— Auth state —— */
  var _stored = getStoredAuth();
  try { if (_stored && _stored.token) setAuthCookie(_stored.token); } catch(_e0) {}
  var _au = useState(_stored ? _stored.user : null); var authUser = _au[0], setAuthUser = _au[1];
  var _ap = useState(_stored ? _stored.permissions : []); var authPerms = _ap[0], setAuthPerms = _ap[1];
  var _np = useState(false); var notifPromptOpen = _np[0], setNotifPromptOpen = _np[1];
  var _br  = useState(null); var branding = _br[0], setBranding = _br[1];
  var _sc  = useState(false); var setupChecked = _sc[0], setSetupChecked = _sc[1];
  var _sd  = useState(false); var setupDone = _sd[0], setSetupDone = _sd[1];
  var bs   = useBootstrap(!!authUser);
  var notifyRef = useRef({ initialized:false, notifIds:{} });
  var taskNotifyRef = useRef({ initialized:false, seenKeys:{} });

  useEffect(function(){
    apiFetch('setup').then(function(s){ setBranding(s); setSetupDone(!!s.is_setup_done); setSetupChecked(true); }).catch(function(){ setSetupChecked(true); });
  }, []);

  // If we have a stored token, re-sync the server HttpOnly cookie (helps QR pages opened in a new tab).
  useEffect(function(){
    if (!_stored || !_stored.token) return;
    apiFetch('auth/sync-cookie', { method:'POST' }).catch(function(){});
  }, []);

  useEffect(function(){
    if (!authUser) return;
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        setNotifPromptOpen(true);
      } else {
        setNotifPromptOpen(false);
      }
    } catch(_e0) {}
  }, [authUser]);

  useEffect(function(){
    if (!authUser || mode === 'kds') return;
    var data = bs && bs.data ? bs.data : null;
    if (!data) return;
    var notifs = asArr(data.notifications);
    var prev = notifyRef.current || { initialized:false, notifIds:{} };
    var nextIds = {};
    var newNotifs = [];

    notifs.forEach(function(n){
      var id = String(n && n.id ? n.id : '');
      if (!id) return;
      nextIds[id] = true;
      if (prev.initialized && !prev.notifIds[id] && String(n.is_read || 0) !== '1') {
        newNotifs.push(n);
      }
    });

    notifyRef.current = { initialized:true, notifIds: nextIds };
    if (!prev.initialized) return;

    newNotifs.reverse().forEach(function(n){
      var kind = (n && n.type) ? String(n.type) : 'info';
      var title = String(n.title || '');
      var body = String(n.body || '');
      if (!title && !body) return;
      notifyMandatoryEvent(kind, title || 'Notification', body, { sound: n.sound || '', sound_url: n.sound_url || '' });
    });
  }, [authUser, mode, bs && bs.data]);

  /* Per-user Windows notifications for newly assigned tasks (no sound, no alert) */
  useEffect(function(){
    if (!authUser || mode === 'kds') return;
    var data = bs && bs.data ? bs.data : null;
    if (!data) return;
    var empId = parseInt(authUser.employee_id, 10) || 0;
    if (!empId) return;

    function parseIds(raw) {
      if (raw == null) return [];
      if (Array.isArray(raw)) return raw.map(function(v){ return String(v); });
      if (typeof raw === 'string') {
        try {
          var arr = JSON.parse(raw);
          return Array.isArray(arr) ? arr.map(function(v){ return String(v); }) : [];
        } catch (_e0) {
          return raw ? [String(raw)] : [];
        }
      }
      return [String(raw)];
    }

    var relevant = [];
    var empKey = String(empId);
    asArr(data.orders).forEach(function(order){
      asArr(order.items).forEach(function(item){
        asArr(item.steps).forEach(function(step){
          var status = String(step && step.status_slug || '');
          if (status === 'done' || status === 'completed' || status === 'cancelled') return;
          var ids = parseIds(step.assigned_employee_ids);
          if (!ids.length && step.assigned_employee_id) ids = [String(step.assigned_employee_id)];
          if (ids.indexOf(empKey) < 0) return;
          relevant.push({
            key: 'step-' + String(step.id || (order.id+'-'+item.id+'-'+(step.step_name||''))),
            type: 'step',
            orderNo: String(order.order_number || order.id || ''),
            name: String(step.step_name || step.step_name_en || 'Task'),
            status: status || 'pending'
          });
        });
      });
    });

    asArr(data['ops-tasks']).forEach(function(task){
      if (!task || isOpsTaskCompleted(task)) return;
      var ids = parseIds(task.assigned_employee_ids);
      if (!ids.length && task.assigned_employee_id) ids = [String(task.assigned_employee_id)];
      if (ids.indexOf(empKey) < 0) return;
      relevant.push({
        key: 'ops-' + String(task.id || task.task_no || ''),
        type: 'ops',
        orderNo: String(task.order_number || ''),
        name: String(task.task_no || ('OT-' + task.id)),
        status: String(task.status_slug || 'open')
      });
    });

    var prev = taskNotifyRef.current || { initialized:false, seenKeys:{} };
    var nextSeen = {};
    relevant.forEach(function(r){
      var k = r.key + '|' + r.status;
      nextSeen[k] = true;
      if (!prev.initialized || prev.seenKeys[k]) return;
      var isAr = getPreferredLang('ar') === 'ar';
      var title = isAr ? '🔔 مهمة جديدة لك' : '🔔 New Task Assigned';
      var body;
      if (r.type === 'ops') {
        body = isAr
          ? ('مهمة إدارية: ' + r.name + (r.orderNo ? (' | طلب #' + r.orderNo) : ''))
          : ('Operations task: ' + r.name + (r.orderNo ? (' | Order #' + r.orderNo) : ''));
      } else {
        body = isAr
          ? ('خطوة إنتاج: ' + r.name + (r.orderNo ? (' | طلب #' + r.orderNo) : ''))
          : ('Production step: ' + r.name + (r.orderNo ? (' | Order #' + r.orderNo) : ''));
      }
      notifyWindowsOnly(title, body, 'cspsr-task-' + r.key);
    });

    taskNotifyRef.current = { initialized:true, seenKeys:nextSeen };
  }, [authUser, mode, bs && bs.data]);

  var lang = getPreferredLang('ar');

  if (!setupChecked) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner));

  if (!setupDone) return h(I18nProvider, {initialLang:lang}, h(LangRemount, null, h(SetupWizard, {onComplete:function(b){ setBranding(b); setSetupDone(true); }})));

  /* â”€â”€ Not logged in â†’ show login screen â”€â”€ */
  if (!authUser) return h(I18nProvider,{initialLang:lang},
    h(LangRemount,null,h(LoginScreen, { onLogin:function(user, perms){ setAuthUser(user); setAuthPerms(perms||[]); } }))
  );

  if (mode==='kds') return h(I18nProvider,{initialLang:lang},h(LangRemount,null,h(ErrorBoundary,null,h(KDSView,{bootstrap:bs.data,onReload:bs.reload,onSilentReload:bs.silentReload,pauseReasons:(branding&&branding.pause_reasons)||[],carouselInterval:(branding&&branding.kds_carousel_interval)||8}))));

  function doLogout() {
    apiFetch('auth/logout', { method:'POST' }).catch(function(){});
    clearStoredAuth();
    setAuthUser(null);
    setAuthPerms([]);
  }

  function onAvatarUpdate(avatar) {
    var updated = Object.assign({}, authUser, { avatar: avatar });
    setAuthUser(updated);
    setStoredAuth(localStorage.getItem('cspsr_token')||'', updated, authPerms);
  }

  function requestSystemNotifications() {
    try {
      if (typeof Notification === 'undefined') {
        alert('Notifications are not supported in this browser.');
        return;
      }
      Notification.requestPermission().then(function(p){
        if (p === 'granted') {
          setNotifPromptOpen(false);
          try { new Notification('CSP Notifications Enabled', { body:'You will receive task and order alerts.', silent:false }); } catch(_e1) {}
        } else {
          setNotifPromptOpen(true);
          alert('Please allow notifications from browser settings to receive alerts.');
        }
      });
    } catch(_e2) {
      alert('Could not request notification permission.');
    }
  }

  return h(I18nProvider, { initialLang:lang },
    h(LangRemount, null,
      h(ErrorBoundary, null,
        ((branding && branding.debug_bar_enabled !== false) ? h(DebugBar, { cfgLang: lang }) : null),
        h(AppInner, { bs:bs, branding:branding, authUser:authUser, onLogout:doLogout, onAvatarUpdate:onAvatarUpdate, onBrandingUpdate:function(b){ setBranding(b); } }),
        notifPromptOpen && h('div', { style:{
          position:'fixed', inset:0, zIndex:100000,
          background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center'
        }},
          h('div', { style:{
            width:'min(92vw,460px)', background:'#fff', border:'1px solid '+T.border, borderRadius:12,
            boxShadow:'0 20px 60px rgba(0,0,0,.25)', padding:20
          }},
            h('div', { style:{ fontSize:20, fontWeight:800, marginBottom:8, color:T.text } }, 'Enable Notifications'),
            h('div', { style:{ fontSize:13, color:T.textMid, lineHeight:1.6, marginBottom:14 } },
              'Allow browser notifications to receive mandatory task and order alerts.'
            ),
            h('div', { style:{ display:'flex', justifyContent:'flex-end', gap:8 } },
              h(Btn, { variant:'secondary', onClick:function(){ setNotifPromptOpen(false); } }, 'Later'),
              h(Btn, { onClick:requestSystemNotifications }, 'Enable Notifications')
            )
          )
        )
      )
    )
  );
}

/* â•â•â• DEBUG BAR â•â•â• */
function cspsrApplyConsoleMute(muted) {
  try {
    if (typeof window === 'undefined' || !window.console) return;
    if (!window.__CSPSR_CONSOLE_ORIG__) {
      window.__CSPSR_CONSOLE_ORIG__ = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        group: console.group,
        groupCollapsed: console.groupCollapsed,
        groupEnd: console.groupEnd,
        time: console.time,
        timeEnd: console.timeEnd
      };
    }
    var noop = function(){};
    if (muted) {
      console.log = noop;
      console.info = noop;
      console.debug = noop;
      console.group = noop;
      console.groupCollapsed = noop;
      console.groupEnd = noop;
      console.time = noop;
      console.timeEnd = noop;
    } else {
      var o = window.__CSPSR_CONSOLE_ORIG__ || {};
      if (o.log) console.log = o.log;
      if (o.info) console.info = o.info;
      if (o.debug) console.debug = o.debug;
      if (o.group) console.group = o.group;
      if (o.groupCollapsed) console.groupCollapsed = o.groupCollapsed;
      if (o.groupEnd) console.groupEnd = o.groupEnd;
      if (o.time) console.time = o.time;
      if (o.timeEnd) console.timeEnd = o.timeEnd;
    }
    window.__CSPSR_CONSOLE_MUTED__ = !!muted;
    try { localStorage.setItem('cspsr_console_muted', muted ? '1' : '0'); } catch(_e0) {}
  } catch(_e1) {}
}

function cspsrIsConsoleMuted() {
  try { return (localStorage.getItem('cspsr_console_muted') || '') === '1'; } catch(_e) { return false; }
}

function DebugBar(props) {
  var i18n = useI18n();
  var lsLang = '?';
  try { lsLang = localStorage.getItem('cspsr_lang') || '(null)'; } catch(e) { lsLang = 'ERROR'; }
  var cfgLang = props.cfgLang || '?';
  var contextLang = i18n.lang;
  var _v = useState(false); var visible = _v[0], setVisible = _v[1];
  var _cm = useState(cspsrIsConsoleMuted()); var consoleMuted = _cm[0], setConsoleMuted = _cm[1];

  return h('div', { style:{ position:'fixed', bottom:0, left:0, right:0, zIndex:99999, fontFamily:'monospace', fontSize:12 } },
    h('div', { onClick:function(){ setVisible(!visible); }, style:{ background:'#1e1e2e', color:'#cdd6f4', padding:'4px 12px', cursor:'pointer', display:'flex', gap:16, alignItems:'center', borderTop:'2px solid #89b4fa' } },
      h('span', { style:{ color:'#89b4fa', fontWeight:700 } }, 'DEBUG'),
      h('span', null, 'context lang: ', h('b', { style:{ color: contextLang==='en' ? '#a6e3a1' : '#f38ba8' } }, contextLang)),
      h('span', null, 'localStorage: ', h('b', { style:{ color: lsLang==='en' ? '#a6e3a1' : '#f38ba8' } }, lsLang)),
      h('span', null, 'cfg().lang: ', h('b', { style:{ color: cfgLang==='en' ? '#a6e3a1' : '#f38ba8' } }, cfgLang)),
      h('span', null, '_currentLang: ', h('b', { style:{ color: getLang()==='en' ? '#a6e3a1' : '#f38ba8' } }, getLang())),
      h('span', null, 'console: ', h('b', { style:{ color: consoleMuted ? '#f38ba8' : '#a6e3a1' } }, consoleMuted ? 'OFF' : 'ON')),
      h('span', { style:{ color:'#6c7086', marginLeft:'auto' } }, visible ? 'hide' : 'details')
    ),
    visible && h('div', { style:{ background:'#11111b', color:'#cdd6f4', padding:'10px 16px', borderTop:'1px solid #313244', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 } },
      h('div', null,
        h('div', { style:{ color:'#89b4fa', fontWeight:700, marginBottom:6 } }, 'window.CSPSR_CONFIG'),
        h('pre', { style:{ background:'#1e1e2e', padding:8, borderRadius:4, fontSize:11, overflow:'auto', maxHeight:150 } },
          JSON.stringify(window.CSPSR_CONFIG || {}, null, 2)
        )
      ),
      h('div', null,
        h('div', { style:{ color:'#89b4fa', fontWeight:700, marginBottom:6 } }, 'Actions'),
        h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          h('button', { onClick:function(e){
            e && e.stopPropagation && e.stopPropagation();
            var next = !cspsrIsConsoleMuted();
            cspsrApplyConsoleMute(next);
            setConsoleMuted(next);
          }, style:{ padding:'4px 10px', background: consoleMuted ? '#a6e3a1' : '#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, consoleMuted ? 'Enable Console' : 'Disable Console'),
          h('button', { onClick:function(){
            if (!confirm('Delete ALL completed orders? This cannot be undone.')) return;
            apiFetch('admin/delete-completed-orders', {method:'POST'})
              .then(function(r){ alert('Deleted: ' + r.deleted + ' orders'); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Delete Completed'),
          h('button', { onClick:function(){ i18n.setLang('ar'); }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Force AR'),
          h('button', { onClick:function(){ try { localStorage.removeItem('cspsr_lang'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#fab387', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Clear LS + Reload'),
          h('button', { onClick:function(){ try { localStorage.setItem('cspsr_lang','en'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#89b4fa', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Set EN + Reload'),
          h('button', { onClick:function(){
            if (!confirm('Sync expected_hours from product steps to all orders?\n\nThis will update any step with 0 hours.')) return;
            apiFetch('admin/fix-expected-hours', {method:'POST'})
              .then(function(r){ alert('Done!\nUpdated steps: '+r.updated_steps+'\nChecked: '+r.total_checked+'\n\nReloading...'); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#f9e2af', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Fix Expected Hours'),
          h('button', { onClick:function(){
            if (!confirm('Delete status with sort_order=5 and migrate orders to sort_order=3?')) return;
            apiFetch('admin/fix-status-5', {method:'POST'})
              .then(function(r){ alert('Done!\nDeleted: '+r.deleted_slug+'\nMigrated to: '+r.migrated_to+'\nOrders updated: '+r.orders_updated); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#cba6f7', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Fix Status 5')
        ),
        h('div', { style:{ marginTop:10, color:'#6c7086', fontSize:11 } },
          'After clicking lang toggle, do the values above update?'
        ),
        h('button', { onClick:function(){
          try {
            var orders = (window.__CSPSR_BS__ && window.__CSPSR_BS__.orders) || [];
            var out = orders.slice(0,3).map(function(o){
              var expMins = 0;
              var stepLines = [];
              (o.items||[]).forEach(function(i){
                (i.steps||[]).forEach(function(s){
                  var h = parseFloat(s.expected_hours)||0;
                  if (s.is_delivery != 1) expMins += h*60;
                  stepLines.push(s.step_name+'='+s.expected_hours+'h(del:'+s.is_delivery+')');
                });
              });
              return '#'+o.order_number+' started:'+o.started_at+' expMins:'+Math.round(expMins)+'\n  '+stepLines.join(', ');
            }).join('\n\n');
            alert('Steps:\n\n'+out);
          } catch(e){ alert('Error: '+e.message); }
        }, style:{ marginTop:6, padding:'4px 10px', background:'#cba6f7', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Inspect Steps'),
        h('button', { onClick: function(){
          var pid = prompt('Product ID? (check URL in Product Workflow)');
          if (!pid) return;
          apiFetch('products/'+pid+'/steps').then(function(steps){
            var out = (steps||[]).map(function(s){
              return s.step_name+' â†’ ids:'+JSON.stringify(s.assigned_employee_ids);
            }).join('\n');
            alert('Product Steps:\n\n'+out);
          }).catch(function(e){ alert('Error: '+e); });
        }, style:{ marginTop:6, padding:'4px 10px', background:'#89dceb', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Debug Step IDs'),
        h('button', { onClick: function(){
          /* Debug: show what global Save would send */
          var orders = window.__CSPSR_ORDERS__ || [];
          var msg = 'window.__CSPSR_ORDERS__ not set\n\nTo debug:\n1. Open an order with external steps\n2. The save button will log to console';
          alert(msg);
          /* Also log extDatesRef if accessible */
          console.log('[DEBUG SAVE] Check console after pressing Save in an order');
        }, style:{ marginTop:6, padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Debug Save')
      )
    )
  );
}

/* â•â•â• APP ROOT â•â•â• */
(function() {
  // Apply console mute as early as possible (persisted in localStorage).
  try { cspsrApplyConsoleMute(cspsrIsConsoleMuted()); } catch(_e0) {}

  function isArabicUiMode() {
    try {
      return getPreferredLang('ar') === 'ar';
    } catch (e) {
      return true;
    }
  }
  function translateKnownUiText(v) {
    if (v == null) return v;
    var s = String(v);
    // Normalize whitespace for robust matching (React/table headers can include NBSP/newlines).
    s = s.replace(/\u00A0/g, ' ');
    var arabicMode = isArabicUiMode();
    var exact = {
      'Dashboard':'لوحة التحكم',
      'Overview of production status':'نظرة عامة على حالة الإنتاج',
      'Production System':'نظام الإنتاج',
      'Production Display':'شاشة الإنتاج',
      'Orders':'الطلبات',
      'Completed Orders':'الطلبات المكتملة',
      'COMPLETED AT':'اكتمل في',
      'Completed At':'اكتمل في',
      'ACTUAL':'الفعلي',
      'EXPECTED':'المتوقع',
      'CUSTOMER':'العميل',
      'Customer':'العميل',
      'ORDER #':'رقم الطلب',
      '# ORDER':'رقم الطلب',
      'DIFF':'الفرق',
      'Diff':'الفرق',
      'Ø§Ù„ÙØ±Ù‚':'الفرق',
      'Customers':'العملاء',
      'Products':'المنتجات',
      'Dept':'القسم',
      'DEPT':'القسم',
      'Department':'القسم',
      'Role':'الدور',
      'ROLE':'الدور',
      'Color':'اللون',
      'COLOR':'اللون',
      'Username':'اسم المستخدم',
      'USERNAME':'اسم المستخدم',
      'Slug':'المعرف',
      'SLUG':'المعرف',
      'Sort Order':'الترتيب',
      'SORT ORDER':'الترتيب',
      'Final Status':'الحالة النهائية',
      'FINAL STATUS':'الحالة النهائية',
      'Product Workflow':'سير عمل المنتجات',
      'Assigned Employees':'الموظفون المعينون',
      'Departments':'الأقسام',
      'Teams':'الفرق',
      'Roles':'الأدوار',
      'My Tasks':'مهامي',
      'Operations Tasks':'مهام العمليات',
      'Tasks':'المهام',
      'TASKS':'المهام',
      'Search...':'بحث...',
      'Search':'بحث',
      'Production Display Carousel Interval (seconds)':'فترة تقليب شاشة الإنتاج (ثوانٍ)',
      'How many seconds between each page rotation on the TV display':'كم ثانية بين كل تبديل صفحة على شاشة العرض',
      'Send':'إرسال',
      'Type':'النوع',
      'Title':'العنوان',
      'Info':'معلومات',
      'Success':'نجاح',
      'Warning':'تحذير',
      'Error':'خطأ',
      'Browser Notifications':'إشعارات المتصفح',
      'Permissions':'صلاحيات',
      'New User':'مستخدم جديد',
      'Active':'نشط',
      'Inactive':'موقوف',
      'Status':'الحالة',
      'Name':'الاسم',
      'Phone':'الهاتف',
      'Address':'العنوان',
      'Map':'الخريطة',
      'Notes':'ملاحظات',
      'Working Days':'أيام العمل',
      'Working Hours':'ساعات الدوام',
      'Holidays':'العطل',
      'Company Calendar':'تقويم الشركة',
      'External Tasks':'المهام الخارجية',
      'Delivery Orders':'طلبات التوصيل',
      'Reports':'التقارير',
      'Users':'المستخدمون',
      'Suppliers':'المجهزون',
      'Workflow':'سير العمل',
      'Contact Persons':'جهات الاتصال',
      'Temp Recipients':'المستلمون المؤقتون',
      'User (by permissions)':'مستخدم (حسب الصلاحيات)',
      'Admin (full access)':'مدير (وصول كامل)',
      'No results found':'لا توجد نتائج',
      'No results':'لا توجد نتائج',
      'No data':'لا توجد بيانات',
      'No data found':'لا توجد بيانات',
      'No contacts yet':'لا توجد جهات اتصال بعد',
      'No holidays added yet.':'لا توجد عطل مضافة بعد.',
      'No contact info':'لا توجد معلومات اتصال',
      'No contact info available':'لا تتوفر معلومات اتصال',
      'No nearby receipts':'لا توجد استلامات قريبة',
      'No events yet':'لا توجد أحداث بعد',
      'No external tasks in this view':'لا توجد مهام خارجية في هذه العرض',
      'No external tasks in this view':'لا توجد مهام خارجية في هذا العرض',
      'No tasks in this stage':'لا توجد مهام في هذه المرحلة',
      'No departments yet':'لا توجد أقسام بعد',
      'No nearby receipts':'لا توجد استلامات قريبة',
      'No employees linked to this team yet.':'لا يوجد موظفون مرتبطون بهذا الفريق بعد.',
      'No events yet':'لا توجد أحداث بعد',
      'No leaves recorded yet.':'لا توجد إجازات مسجلة بعد.',
      'No reasons added yet':'لا توجد أسباب مضافة بعد',
      'No replacement employees available in this scope.':'لا توجد بدائل متاحة ضمن هذا النطاق.',
      'No items':'لا توجد عناصر',
      'No items ready for delivery yet':'لا توجد عناصر جاهزة للتسليم بعد',
      'No machines found':'لا توجد ماكينات',
      'No matching orders':'لا توجد طلبات مطابقة',
      'No orders':'لا توجد طلبات',
      'No overdue external tasks':'لا توجد مهام خارجية متأخرة',
      'No reasons found':'لا توجد أسباب',
      'No recipient info':'لا توجد معلومات مستلم',
      'No steps available':'لا توجد خطوات متاحة',
      'No active orders':'لا توجد طلبات نشطة',
      'No active orders at the moment':'لا توجد طلبات نشطة حالياً',
      'No completed orders yet':'لا توجد طلبات مكتملة بعد',
      'Loading...':'جاري التحميل...',
      'Loading data...':'جاري تحميل البيانات...',
      'Save & Continue':'حفظ ومتابعة',
      'Enter System':'دخول النظام',
      'You\'re all set!':'اكتمل الإعداد!',
      'System configured successfully:':'تم إعداد النظام بنجاح:',
      'Company Logo':'شعار الشركة',
      'Drag logo here or click to upload':'اسحب الشعار هنا أو انقر للرفع',
      'English':'الإنكليزية',
      'In Arabic':'بالعربية',
      'A chronological audit trail for order and step transitions.':'سجل زمني لتغييرات الطلب والخطوات.',
      'Commercial items attached to this order.':'العناصر التجارية المرتبطة بهذا الطلب.',
      'Add new reason:':'إضافة سبب جديد:',
      'Select customer':'اختر الزبون',
      'Select Supplier':'اختر المجهز',
      'Select replacement':'اختر البديل',
      '— None —':'— لا يوجد —',
      '— Unassigned —':'— غير مسند —',
      'â€” Select customer â€”':'— اختر الزبون —',
      'â€” Select Supplier â€”':'— اختر المجهز —',
      'â€” Select replacement â€”':'— اختر البديل —',
      'â€” No linked order â€”':'— لا يوجد طلب مرتبط —',
      'â€” No contact person â€”':'— لا يوجد شخص اتصال —',
      'â€” No product â€”':'— لا يوجد منتج —',
      'â€” Unassigned â€”':'— غير مسند —',
      'No contact person':'لا يوجد شخص اتصال',
      'No linked order':'لا يوجد طلب مرتبط',
      'No product':'لا يوجد منتج',
      'Load Preset Reasons':'تحميل الأسباب الجاهزة',
      'Board':'لوحة',
      'Add Supplier':'إضافة مجهز',
      'Affected work during leave':'العمل المتأثر أثناء الإجازة',
      'Against plan':'مقابل الخطة',
      'Ahead of plan':'أسرع من الخطة',
      'All active supplier tasks':'كل مهام المجهزين النشطة',
      'Arabic':'العربية',
      'Assigned Employee':'الموظف المعين',
      'Behind plan':'أبطأ من الخطة',
      'Choose leave dates first.':'اختر تواريخ الإجازة أولاً.',
      'Choose leave dates to load the reassignment options.':'اختر تواريخ الإجازة لتحميل خيارات الإحلال.',
      'Choose valid leave dates first.':'اختر تواريخ إجازة صحيحة أولاً.',
      'Current filtered portfolio':'المحفظة المفلترة الحالية',
      'Customer-facing deadline':'موعد التسليم للزبون',
      'Delay & Pause Reasons':'أسباب التأخير والإيقاف',
      'Delete this leave?':'حذف هذه الإجازة؟',
      'Department Calendar':'تقويم القسم',
      'Employee Calendar':'تقويم الموظف',
      'Leave end':'نهاية الإجازة',
      'Leave start':'بداية الإجازة',
      'Leaves':'الإجازات',
      'Linked Order (optional)':'الطلب المرتبط (اختياري)',
      'Live production position':'وضع الإنتاج المباشر',
      'Not sent':'غير مرسل',
      'On plan':'وفق الخطة',
      'Planned production time':'وقت الإنتاج المخطط',
      'Queued':'في الانتظار',
      'Real consumed time':'الوقت المستهلك فعلياً',
      'Reopen this task?':'إعادة فتح هذه المهمة؟',
      'Saved leaves':'الإجازات المحفوظة',
      'Stage name:':'اسم المرحلة:',
      'Step (optional)':'الخطوة (اختياري)',
      'Step Performance Matrix':'مصفوفة أداء الخطوات',
      'Still moving in production':'لا يزال قيد الإنتاج',
      'Tasks anchored today':'المهام المربوطة اليوم',
      'Team Calendar':'تقويم الفريق',
      'This month pipeline':'مسار هذا الشهر',
      'This week pipeline':'مسار هذا الأسبوع',
      'What should be received soon':'ما يفترض استلامه قريباً',
      'With country code, no + (e.g. 9647701234567)':'مع رمز الدولة، بدون + (مثال: 9647701234567)',
      'Your account is not linked to an employee profile.':'حسابك غير مرتبط بملف موظف.',
      'All employees':'كل الموظفين',
      'All steps added':'تمت إضافة كل الخطوات',
      'All Statuses':'كل الحالات',
      'All items':'كل العناصر',
      'Choose an order to inspect lifecycle, timing, and operational health.':'اختر طلباً لمراجعة دورة حياته والأوقات والحالة التشغيلية.',
      'Delete?':'حذف؟',
      'Delivery:':'التسليم:',
      'Due:':'الاستحقاق:',
      'Sent:':'تم الإرسال:',
      'Received:':'تم الاستلام:',
      'Current:':'الحالي:',
      'Expected:':'المتوقع:',
      'Tracking': 'التتبع',
      'Operational Snapshot':'ملخص تشغيلي',
      'ERP Reports':'تقارير ERP',
      'Live':'مباشر',
      'Near Receipts':'الاستلامات القريبة',
      'Lifecycle Activity Feed':'سجل النشاط الزمني',
      'Step Performance Matrix':'مصفوفة أداء الخطوات',
      'Fast ERP-style readout for the selected order.':'عرض سريع بأسلوب ERP للطلب المحدد.',
      'Send/receive times are captured later on each order item, not here in the product workflow.':'تُسجَّل أوقات الإرسال/الاستلام لاحقاً داخل كل عنصر طلب، وليس هنا في سير المنتجات.',
      'This step is tracked by supplier send/promise/receive times instead of internal production staffing.':'تُتابَع هذه الخطوة عبر أوقات الإرسال/الوعد/الاستلام للمجهز بدلاً من التوزيع الداخلي للموظفين.',
      'Expected delivery timing is entered later per order item.':'يُدخل وقت التسليم المتوقع لاحقاً لكل عنصر من الطلب.',
      'Supplier promised and actual times are filled later on the order item.':'تُملأ أوقات المجهز المتوقعة والفعلية لاحقاً على عنصر الطلب.',
      'Expected vs actual for each step, with operational state and product linkage.':'المقارنة بين المتوقع والفعلي لكل خطوة مع حالة التشغيل وربط المنتج.',
      'Send/receive times are captured later on each order item, not here in the product workflow.':'تُسجَّل أوقات الإرسال/الاستلام لاحقاً على عنصر الطلب وليس هنا في سير المنتجات.',
      'External step timing will be entered on the order itself based on supplier load and promised return date.':'سيُدخل توقيت الخطوة الخارجية على الطلب نفسه وفقاً لحمل المجهز وتاريخ العودة الموعود.',
      'Delivery timing will be entered on the order itself based on customer deadline and delivery scheduling.':'سيُدخل توقيت التوصيل على الطلب نفسه وفقاً لموعد العميل وجدولة التوصيل.',
      'Tracked by delivery window/deadline':'يُحسب حسب نافذة التوصيل/الموعد النهائي',
      'Tracked by supplier promise/actual times':'يُحسب حسب وقت المجهز الموعود/الفعلي',
      'Deliverable':'قابل للتسليم',
      'Delivery Order':'طلب توصيل',
      'Delivery Orders':'طلبات التوصيل',
      'Delivery Target':'وجهة التوصيل',
      'Delivery Team':'فريق التوصيل',
      'Delivery timing':'توقيت التوصيل',
      'Filter by employee:':'تصفية حسب الموظف:',
      'Delivery Agent':'مندوب التوصيل',
      'External Supplier':'المجهز الخارجي',
      'External Supplier (optional)':'المجهز الخارجي (اختياري)',
      'External Supplier Details':'تفاصيل المجهز الخارجي',
      'External Supplier Timing':'وقت المجهز الخارجي',
      'External Tasks':'المهام الخارجية',
      'Internal Production':'إنتاج داخلي',
      'Items':'العناصر',
      'Items in Order':'عناصر الطلب',
      'Full Name':'الاسم الكامل',
      'Product Number':'رقم المنتج',
      'Step Library':'مكتبة الخطوات',
      'This month':'هذا الشهر',
      'Late Orders':'الطلبات المتأخرة',
      'Late':'متأخر',
      'Month':'الشهر',
      'Week':'الأسبوع',
      'Today':'اليوم',
      'Time':'الوقت',
      'LIST':'قائمة',
      'GRID':'شبكة',
      'FULLSCREEN':'ملء الشاشة',
      'STEP':'خطوة',
      'Variance':'الفرق',
      'Now':'الآن',
      'Preview impact':'معاينة التأثير',
      'Print delivery slip':'طباعة وصل التوصيل',
      'Open Map':'فتح الخريطة',
      'Open in Google Maps':'فتح في خرائط Google',
      'Yes, Load':'نعم، تحميل',
      'Unread':'غير مقروء',
      'Select an order to begin.':'اختر طلباً للبدء.',
      'Details':'التفاصيل',
      'At supplier':'عند المجهز',
      'Call Recipient':'اتصال بالمستلم',
      'Delivery Target':'وجهة التوصيل',
      'Apply':'تطبيق',
      'Close':'إغلاق',
      'Update':'تحديث',
      'Add':'إضافة',
      'Edit':'تعديل',
      'Delete':'حذف',
      'Save':'حفظ',
      'Cancel':'إلغاء',
      'Grid':'شبكة',
      'List':'قائمة',
      'Fullscreen':'ملء الشاشة',
      'Delivery':'التسليم',
      'Select supplier':'اختر المجهز',
      'Select Category':'اختر الفئة',
      'Select Machine':'اختر الماكينة',
      'Select Reason':'اختر السبب',
      'Other...':'أخرى...',
      'Enter reason...':'اكتب السبب...',
      'Pause Step':'إيقاف مؤقت للخطوة',
      'Pause':'إيقاف',
      'Resume':'استئناف',
      'Back':'رجوع',
      'Step:':'الخطوة:',
      'Step event':'حدث الخطوة',
      'Step Type':'نوع الخطوة',
      'Supplier-linked step':'خطوة مرتبطة بالمجهز',
      'Supplier':'المجهز',
      'Map':'الخريطة',
      'Search by Product Number / Name':'البحث برقم المنتج / الاسم',
      'Type product number or name...':'اكتب رقم المنتج أو الاسم...',
      'Calculating:':'الحساب:',
      'Promised Work Time:':'وقت الوعد للمجهز:',
      'Actual:':'الفعلي:',
      'Exp:':'المتوقع:',
      'Act:':'الفعلي:',
      'Current step':'الخطوة الحالية',
      'Next step':'الخطوة التالية',
      'Delay Reason Required':'سبب التأخير مطلوب',
      'Ready to Deliver':'جاهز للتوصيل',
      'Partial Delivery':'توصيل جزئي',
      'In Progress':'قيد الإنتاج',
      'On time':'في الوقت',
      'late':'تأخير',
      'Behind':'متأخر',
      'Ahead':'أسرع',
      'On Track':'في الوقت',
      'Active Orders':'الطلبات النشطة',
      'Production Time - Active Orders':'وقت الإنتاج - الطلبات النشطة',
      'Orders in View':'الطلبات المعروضة',
      'Orders Ledger':'سجل الطلبات',
      'Orders This Year':'الطلبات هذا العام',
      'Clients Share (Year)':'حصة الزبائن (السنة)',
      'Top Clients':'أفضل الزبائن',
      'Active Clients':'عملاء نشطون',
      'Inactive Clients':'عملاء غير نشطين',
      'Tasks This Month':'مهام الشهر',
      'OF THE MONTH':'موظف الشهر',
      'No data yet':'لا توجد بيانات بعد',
      'No data found':'لا توجد بيانات',
      'Loading lifecycle...':'جاري تحميل السجل الزمني...',
      'Select an order to inspect lifecycle, timing, and operational health.':'اختر طلباً لمراجعة دورة حياته والأوقات والحالة التشغيلية.',
      'Step Performance Matrix':'مصفوفة أداء الخطوات',
      'Step event':'حدث الخطوة',
      'Order number is required':'رقم الطلب مطلوب',
      'Add Task':'إضافة مهمة',
      'Pause Reasons':'أسباب الإيقاف',
      'Loading lifecycle...':'جاري تحميل السجل الزمني...',
      'Preview impact':'معاينة التأثير',
      'Confirm Delivery':'تأكيد التوصيل',
      'OK - Mark as Delivered':'OK - تأكيد التسليم',
      'Are you sure you want to mark this product as delivered?':'هل تريد تأكيد تسليم هذا المنتج؟',
      'Who completed this step?':'من نفّذ هذه الخطوة؟',
      'Pause Step':'إيقاف مؤقت للخطوة',
      'Reopen this task?':'إعادة فتح هذه المهمة؟',
      'Step:':'الخطوة:',
      'Delivery Order':'طلب توصيل',
      'Delivery Team':'فريق التوصيل',
      'Delivery timing':'توقيت التوصيل',
      'Company Working Calendar':'تقويم عمل الشركة',
      'Days considered business days for this calendar.':'الأيام التي تعتبر أيام عمل.',
      'Working Schedule':'جدول العمل',
      'Apply company holidays to suppliers':'تطبيق عطل الشركة على المجهزين',
      'Select one or more suppliers, then apply the current company holiday list to all of them at once.':'اختر مجهزاً واحداً أو أكثر ثم طبق قائمة عطل الشركة عليهم دفعة واحدة.',
      'Select all suppliers':'تحديد كل المجهزين',
      'Clear selection':'مسح التحديد',
      'Apply holidays to selected suppliers':'تطبيق العطل على المجهزين المحددين',
      'All employees':'كل الموظفين',
      'All steps added':'تمت إضافة كل الخطوات',
      'All Statuses':'كل الحالات',
      'All items':'كل العناصر',
      'No holidays added yet.':'لا توجد عطل مضافة بعد.',
      'Workday Start':'بداية الدوام',
      'Workday End':'نهاية الدوام',
      'Holiday Date':'تاريخ العطلة',
      'Working Schedule':'جدول العمل',
      'Duration':'المدة',
      'Duration:':'المدة:',
      'Yes, Load':'نعم، تحميل',
      'Unread':'غير مقروء',
      'Yes':'نعم',
      'No':'لا',
      'Exit':'خروج',
      'Open':'فتح',
      'Apply':'تطبيق',
      'Add':'إضافة',
      'Edit':'تعديل',
      'Delete':'حذف',
      'Save':'حفظ',
      'Cancel':'إلغاء',
      'Close':'إغلاق',
      'Back':'رجوع',
      'Update':'تحديث',
      'Settings':'الإعدادات',
      'Company':'الشركة',
      'Company Name':'اسم الشركة',
      'Recipient':'المستلم',
      'Contact Person':'جهة الاتصال',
      'Order Contact':'جهة اتصال الطلب',
      'Job Title':'المسمى الوظيفي',
      'Email':'البريد الإلكتروني',
      'Map Link':'رابط الخريطة',
      'Company Name':'اسم الشركة',
      'Product Number':'رقم المنتج',
      'Quantity':'الكمية',
      'Employee':'الموظف',
      'Team':'الفريق',
      'Department':'القسم',
      'Priority':'الأولوية',
      'Progress':'التقدم',
      'Current Step':'الخطوة الحالية',
      'Steps':'الخطوات',
      'Status':'الحالة',
      'Unread':'غير مقروء',
      'Reopen this task?':'إعادة فتح هذه المهمة؟',
      'Load':'تحميل',
      'Yes, Load':'نعم، تحميل',
      'KDS':'شاشة الإنتاج',
      'Grid':'شبكة',
      'List':'قائمة',
      'Fullscreen':'ملء الشاشة',
      'Working Schedule':'جدول العمل',
      'Working Days':'أيام العمل',
      'Working Hours':'ساعات الدوام',
      'Company Calendar':'تقويم الشركة',
      'Company Working Calendar':'تقويم عمل الشركة',
      'Holiday Date':'تاريخ العطلة',
      'Actions':'الإجراءات',
      'Refreshes every':'يُحدّث كل',
      'active':'نشط',
      'inactive':'غير نشط',
      'clients':'عملاء',
      'orders':'طلبات',
      'products':'منتجات',
      'suppliers':'مجهزون',
      'seconds':'ثوانٍ',
      'second':'ثانية',
      'minutes':'دقائق',
      'minute':'دقيقة',
      'Name (AR)':'الاسم (عربي)',
      'Name (EN)':'الاسم (إنكليزي)',
      'Job Title (AR)':'المسمى الوظيفي (عربي)',
      'Job Title (EN)':'المسمى الوظيفي (إنكليزي)',
      'In English':'بالإنكليزية',
      'https://maps.google.com/...':'رابط الخريطة',
      'Map URL':'رابط الخريطة',
      'Select':'اختر',
      'Choose':'اختر',
      'Dashboard':'لوحة التحكم',
      'Production Display':'شاشة الإنتاج',
      'KDS':'شاشة الإنتاج'
      ,'Working Schedule':'جدول العمل'
      ,'Holiday Date':'تاريخ العطلة'
      ,'Update':'تحديث'
      ,'Actions':'الإجراءات'
      ,'No holidays added yet.':'لا توجد عطل مضافة بعد.'
      ,'Workday Start':'بداية الدوام'
      ,'Workday End':'نهاية الدوام'
      ,'Days considered business days for this calendar.':'الأيام التي تعتبر أيام عمل.'
      ,'Click to view':'اضغط للعرض'
      ,'In Progress':'قيد الإنتاج'
      ,'Ready to Deliver':'جاهز للتوصيل'
      ,'Partial Delivery':'توصيل جزئي'
      ,'Production Time - Active Orders':'وقت الإنتاج - الطلبات النشطة'
      ,'Total Expected':'المتوقع الإجمالي'
      ,'Total Actual':'الفعلي الإجمالي'
      ,'Behind':'متأخر'
      ,'Ahead':'أسرع'
      ,'On Track':'في الوقت'
      ,'Active Clients':'عملاء نشطون'
      ,'Inactive Clients':'عملاء غير نشطين'
      ,'Tasks This Month':'مهام الشهر'
      ,'OF THE MONTH':'موظف الشهر'
      ,'No data yet':'لا توجد بيانات بعد'
      ,'Top Clients':'أفضل الزبائن'
      ,'No data':'لا توجد بيانات'
      ,'Orders This Year':'الطلبات هذا العام'
      ,'Clients Share (Year)':'حصة الزبائن (السنة)'
      ,'Unknown':'غير معروف'
      ,'Others':'أخرى'
      ,'Partial Delivery Orders':'طلبات التوصيل الجزئي'
      ,'Partial':'جزئي'
      ,'Urgent':'عاجل'
      ,'Ready items:':'العناصر الجاهزة:'
      ,'Qty:':'الكمية:'
      ,'Ready':'جاهز'
      ,'Back':'رجوع'
      ,'Select Category':'اختر الفئة'
      ,'Select Machine':'اختر الماكينة'
      ,'Select Reason':'اختر السبب'
      ,'Pause Step':'إيقاف مؤقت للخطوة'
      ,'Category':'الفئة'
      ,'Machine':'الماكينة'
      ,'Reason':'السبب'
      ,'No machines found':'لا توجد ماكينات'
      ,'No reasons found':'لا توجد أسباب'
      ,'Other...':'أخرى...'
      ,'Enter reason...':'اكتب السبب...'
      ,'Pause':'إيقاف'
      ,'Order number is required':'رقم الطلب مطلوب'
      ,'Delivery Agent':'مندوب التوصيل'
      ,'Customer Delivery Deadline':'موعد تسليم الزبون'
      ,'Search by Product Number / Name':'البحث برقم المنتج / الاسم'
      ,'Type product number or name...':'اكتب رقم المنتج أو الاسم...'
      ,'External Supplier Timing':'وقت المجهز الخارجي'
      ,'Supplier':'المجهز'
      ,'Select supplier':'اختر المجهز'
      ,'Send Date/Time':'تاريخ ووقت الإرسال'
      ,'Promised Return':'موعد العودة المتوقع'
      ,'Calculating:':'الحساب:'
      ,'Delivery':'التسليم'
      ,'late':'تأخير'
      ,'On time':'في الوقت'
      ,'External Step':'خطوة خارجية'
      ,'Map':'الخريطة'
      ,'Sent to Supplier':'أُرسل للمجهز'
      ,'Expected Receive':'استلام متوقع'
      ,'Now':'الآن'
      ,'Saving...':'جاري الحفظ...'
      ,'Save':'حفظ'
      ,'Promised Work Time:':'وقت الوعد للمجهز:'
      ,'Actual:':'الفعلي:'
      ,'Current step':'الخطوة الحالية'
      ,'Next step':'الخطوة التالية'
      ,'Exp:':'المتوقع:'
      ,'Act:':'الفعلي:'
      ,'Resume':'استئناف'
      ,'Move to Delivery':'تحويل للتوصيل'
      ,'No items ready for delivery yet':'لا توجد منتجات جاهزة للتسليم بعد'
      ,'These products are ready. Select which to move to delivery:':'المنتجات الجاهزة، اختر ما تريد تحويله إلى التوصيل:'
      ,'Confirm Delivery':'تأكيد التوصيل'
      ,'OK - Mark as Delivered':'OK - تأكيد التسليم'
      ,'Are you sure you want to mark this product as delivered?':'هل تريد تأكيد تسليم هذا المنتج؟'
      ,'Who completed this step?':'من نفّذ هذه الخطوة؟'
      ,'Confirm':'تأكيد'
      ,'Step:':'الخطوة:'
      ,'Per page:':'لكل صفحة:'
      ,'Diff':'الفرق'
      ,'Faster by':'أسرع بـ'
      ,'Slower by':'أبطأ بـ'
      ,'Next':'التالي'
      ,'Prev':'السابق'
      ,'Saved!':'تم الحفظ!'
      ,'Company Working Calendar':'تقويم عمل الشركة'
      ,'Default working hours, days, and holidays used when no team or employee override exists.':'الدوام الافتراضي للشركة ويُستخدم عند عدم وجود إعداد خاص للفريق أو الموظف.'
      ,'Apply company holidays to suppliers':'تطبيق عطل الشركة على المجهزين'
      ,'Select one or more suppliers, then apply the current company holiday list to all of them at once.':'اختر مجهزًا واحدًا أو أكثر ثم طبق قائمة عطل الشركة الحالية عليهم دفعة واحدة.'
      ,'Suppliers':'المجهزون'
      ,'Select all suppliers':'تحديد كل المجهزين'
      ,'Clear selection':'مسح التحديد'
      ,'Apply holidays to selected suppliers':'تطبيق العطل على المجهزين المحددين'
      ,'Orders in View':'الطلبات المعروضة'
      ,'Active Orders':'الطلبات النشطة'
      ,'Paused Orders':'الطلبات المتوقفة'
      ,'Late Orders':'الطلبات المتأخرة'
      ,'Orders Ledger':'سجل الطلبات'
      ,'Choose an order to inspect lifecycle, timing, and operational health.':'اختر طلباً لمراجعة دورة حياته والأوقات والحالة التشغيلية.'
    };
    var exactReverse = {};
    Object.keys(exact).forEach(function(key){
      var val = exact[key];
      if (val != null && exactReverse[val] == null) exactReverse[val] = key;
    });
    var exactLower = {};
    Object.keys(exact).forEach(function(key){
      var lk = key.toLowerCase();
      if (exactLower[lk] == null) exactLower[lk] = exact[key];
    });
    var autoExact = {};
    var autoReverse = {};
    try {
      if (typeof I18N !== 'undefined' && I18N && I18N.en && I18N.ar) {
        Object.keys(I18N.en).forEach(function(k){
          var ev = I18N.en[k];
          var av = I18N.ar[k];
          if (typeof ev === 'string' && typeof av === 'string') {
            var et = ev.trim();
            var at = av.trim();
            if (et && autoExact[et] == null) autoExact[et] = av;
            if (at && autoReverse[at] == null) autoReverse[at] = ev;
            if (et && autoExact[et.toLowerCase()] == null) autoExact[et.toLowerCase()] = av;
            if (at && autoReverse[at.toLowerCase()] == null) autoReverse[at.toLowerCase()] = ev;
          }
        });
      }
    } catch (e) {}
    var trimmed = s.trim();
    if (arabicMode) {
      var direct = exact[trimmed] || exactLower[trimmed.toLowerCase()] || autoExact[trimmed] || autoExact[trimmed.toLowerCase()];
      if (direct) {
        return s.replace(trimmed, direct);
      }
      return s
        .replace(/Browser Notifications/g, 'إشعارات المتصفح')
        .replace(/Mark as Done/g, 'تم ✓')
        .replace(/New Task\s*\+/g, 'مهمة جديدة +')
        .replace(/New Task/g, 'مهمة جديدة')
        .replace(/Completed Tasks/g, 'المهام المكتملة')
        .replace(/Add Stage\s*\+/g, 'إضافة مرحلة +')
        .replace(/Add Stage/g, 'إضافة مرحلة')
        .replace(/No tasks in this stage/g, 'لا توجد مهام في هذه المرحلة')
        .replace(/\bRFQ\b/g, 'طلب تسعير')
        .replace(/\bProposal\b/g, 'عرض سعر')
        .replace(/\bLead\b/g, 'عميل محتمل')
        .replace(/\bComplete\b/g, 'مكتمل')
        .replace(/\bStop\b/g, 'إيقاف')
        .replace(/\bLate\b/g, 'متأخر')
        .replace(/COMPLETED\s+AT/gi, 'تاريخ الإكمال')
        .replace(/\bEXPECTED\b/gi, 'المتوقع')
        .replace(/\bACTUAL\b/gi, 'الفعلي')
        .replace(/\bUSERNAME\b/gi, 'اسم الدخول')
        .replace(/\bROLE\b/gi, 'الدور')
        .replace(/\bCUSTOMER\b/gi, 'الزبون')
        // Handle "Customer" sometimes appended without spaces (e.g. "نسيم الظلالCustomer")
        .replace(/([\u0600-\u06FF])Customer/gi, '$1 الزبون')
        .replace(/Customer/gi, 'الزبون')
        .replace(/User \(by permissions\)/g, 'مستخدم (حسب الصلاحيات)')
        .replace(/Admin \(full access\)/g, 'مدير (وصول كامل)')
        .replace(/Contact Persons/g, 'جهات الاتصال')
        .replace(/Temp Recipients/g, 'المستلمون المؤقتون')
        .replace(/Production System/g, 'نظام الإنتاج')
        .replace(/Production Display/g, 'شاشة الإنتاج')
        .replace(/Completed Orders/g, 'الطلبات المكتملة')
        .replace(/Product Workflow/g, 'سير عمل المنتجات')
        .replace(/Assigned Employees/g, 'الموظفون المعينون')
        .replace(/Operations Tasks/g, 'مهام العمليات')
        .replace(/My Tasks/g, 'مهامي')
        .replace(/Customers/g, 'العملاء')
        .replace(/Products/g, 'المنتجات')
        .replace(/\bOrders\b/g, 'الطلبات')
        .replace(/Departments/g, 'الأقسام')
        .replace(/Teams/g, 'الفرق')
        .replace(/Roles/g, 'الأدوار')
        .replace(/Search\.\.\./g, 'بحث...')
        .replace(/\bSearch\b/g, 'بحث')
      .replace(/Overview of production status/g, 'نظرة عامة على حالة الإنتاج')
      .replace(/Dashboard/g, 'لوحة التحكم')
      .replace(/No active orders at the moment/g, 'لا توجد طلبات نشطة حالياً')
      .replace(/No active orders/g, 'لا توجد طلبات نشطة')
      .replace(/No completed orders yet/g, 'لا توجد طلبات مكتملة بعد')
      .replace(/⚠️ This will replace all current reasons with the preset list \(/g, '⚠️ هذا سيستبدل كل الأسباب الحالية بالقائمة الجاهزة (')
      .replace(/Continue\?/g, 'متابعة؟')
      .replace(/⚡ Load Preset Reasons/g, '⚡ تحميل الأسباب الجاهزة')
      .replace(/⚙ Board/g, '⚙ لوحة')
      .replace(/Exit Fullscreen/g, 'خروج من ملء الشاشة')
      .replace(/No data found/g, 'لا توجد بيانات')
      .replace(/No contacts yet/g, 'لا توجد جهات اتصال بعد')
      .replace(/No holidays added yet\./g, 'لا توجد عطل مضافة بعد.')
      .replace(/Loading data\.\.\./g, 'جاري تحميل البيانات...')
      .replace(/Loading\.\.\./g, 'جاري التحميل...')
      .replace(/Save & Continue/g, 'حفظ ومتابعة')
      .replace(/Enter System/g, 'دخول النظام')
      .replace(/You're all set!/g, "اكتمل الإعداد!")
      .replace(/System configured successfully:/g, 'تم إعداد النظام بنجاح:')
      .replace(/Company Logo/g, 'شعار الشركة')
      .replace(/Drag logo here or click to upload/g, 'اسحب الشعار هنا أو انقر للرفع')
      .replace(/\bExit\b/g, 'خروج')
      .replace(/\bOpen\b/g, 'فتح')
      .replace(/\bApply\b/g, 'تطبيق')
      .replace(/Company Working Calendar/g, 'تقويم عمل الشركة')
      .replace(/Company Calendar/g, 'تقويم الشركة')
        .replace(/Working Schedule/g, 'جدول العمل')
        .replace(/Holiday Date/g, 'تاريخ العطلة')
        .replace(/Working Hours/g, 'ساعات الدوام')
        .replace(/Working Days/g, 'أيام العمل')
        .replace(/Refreshes every/g, 'يُحدّث كل')
        .replace(/\binactive\b/g, 'غير نشط')
        .replace(/\bactive\b/g, 'نشط')
        .replace(/\bseconds\b/g, 'ثوانٍ')
        .replace(/\bsecond\b/g, 'ثانية')
        .replace(/\bminutes\b/g, 'دقائق')
        .replace(/\bminute\b/g, 'دقيقة')
        .replace(/Name \(AR\)/g, 'الاسم (عربي)')
        .replace(/Name \(EN\)/g, 'الاسم (إنكليزي)')
        .replace(/Job Title \(AR\)/g, 'المسمى الوظيفي (عربي)')
        .replace(/Job Title \(EN\)/g, 'المسمى الوظيفي (إنكليزي)')
        .replace(/In English/g, 'بالإنكليزية')
        .replace(/New User\b/g, 'مستخدم جديد')
        .replace(/\bPermissions\b/g, 'صلاحيات')
        .replace(/\bSend\b/g, 'إرسال')
        .replace(/\bType\b/g, 'النوع')
        .replace(/\bTitle\b/g, 'العنوان')
        .replace(/\bInfo\b/g, 'معلومات')
        .replace(/\bSuccess\b/g, 'نجاح')
        .replace(/\bWarning\b/g, 'تحذير')
        .replace(/\bError\b/g, 'خطأ');
    }
    var reverse = trimmed && (exactReverse[trimmed] || autoReverse[trimmed] || autoReverse[trimmed.toLowerCase()]);
    if (reverse) {
      return s.replace(trimmed, reverse);
    }
    return s
      .replace(/إشعارات المتصفح/g, 'Browser Notifications')
      .replace(/مستخدم \(حسب الصلاحيات\)/g, 'User (by permissions)')
      .replace(/مدير \(وصول كامل\)/g, 'Admin (full access)')
      .replace(/جهات الاتصال/g, 'Contact Persons')
      .replace(/المستلمون المؤقتون/g, 'Temp Recipients')
      .replace(/نظام الإنتاج/g, 'Production System')
      .replace(/شاشة الإنتاج/g, 'Production Display')
      .replace(/الطلبات المكتملة/g, 'Completed Orders')
      .replace(/سير عمل المنتجات/g, 'Product Workflow')
      .replace(/الموظفون المعينون/g, 'Assigned Employees')
      .replace(/مهام العمليات/g, 'Operations Tasks')
      .replace(/مهامي/g, 'My Tasks')
      .replace(/العملاء/g, 'Customers')
      .replace(/المنتجات/g, 'Products')
      .replace(/الطلبات/g, 'Orders')
      .replace(/الأقسام/g, 'Departments')
      .replace(/الفرق/g, 'Teams')
      .replace(/الأدوار/g, 'Roles')
      .replace(/بحث\.\.\./g, 'Search...')
      .replace(/بحث/g, 'Search')
      .replace(/نظرة عامة على حالة الإنتاج/g, 'Overview of production status')
      .replace(/لوحة التحكم/g, 'Dashboard')
      .replace(/لا توجد طلبات نشطة حالياً/g, 'No active orders at the moment')
      .replace(/لا توجد طلبات نشطة/g, 'No active orders')
      .replace(/لا توجد طلبات مكتملة بعد/g, 'No completed orders yet')
      .replace(/⚠️ هذا سيستبدل كل الأسباب الحالية بالقائمة الجاهزة \(/g, '⚠️ This will replace all current reasons with the preset list (')
      .replace(/متابعة\?/g, 'Continue?')
      .replace(/⚡ تحميل الأسباب الجاهزة/g, '⚡ Load Preset Reasons')
      .replace(/⚙ لوحة/g, '⚙ Board')
      .replace(/خروج من ملء الشاشة/g, 'Exit Fullscreen')
      .replace(/لا توجد بيانات/g, 'No data found')
      .replace(/لا توجد جهات اتصال بعد/g, 'No contacts yet')
      .replace(/لا توجد عطل مضافة بعد\./g, 'No holidays added yet.')
      .replace(/جاري تحميل البيانات\.\.\./g, 'Loading data...')
      .replace(/جاري التحميل\.\.\./g, 'Loading...')
      .replace(/حفظ ومتابعة/g, 'Save & Continue')
      .replace(/دخول النظام/g, 'Enter System')
      .replace(/اكتمل الإعداد!/g, "You're all set!")
      .replace(/تم إعداد النظام بنجاح:/g, 'System configured successfully:')
      .replace(/شعار الشركة/g, 'Company Logo')
      .replace(/اسحب الشعار هنا أو انقر للرفع/g, 'Drag logo here or click to upload')
      .replace(/خروج/g, 'Exit')
      .replace(/فتح/g, 'Open')
      .replace(/تطبيق/g, 'Apply')
      .replace(/تقويم عمل الشركة/g, 'Company Working Calendar')
      .replace(/تقويم الشركة/g, 'Company Calendar')
      .replace(/جدول العمل/g, 'Working Schedule')
      .replace(/تاريخ العطلة/g, 'Holiday Date')
      .replace(/ساعات الدوام/g, 'Working Hours')
      .replace(/أيام العمل/g, 'Working Days')
      .replace(/يُحدّث كل/g, 'Refreshes every')
      .replace(/غير نشط/g, 'inactive')
      .replace(/نشط/g, 'active')
      .replace(/ثوانٍ/g, 'seconds')
      .replace(/ثانية/g, 'second')
      .replace(/دقائق/g, 'minutes')
      .replace(/دقيقة/g, 'minute')
      .replace(/الاسم \(عربي\)/g, 'Name (AR)')
      .replace(/الاسم \(إنكليزي\)/g, 'Name (EN)')
      .replace(/المسمى الوظيفي \(عربي\)/g, 'Job Title (AR)')
      .replace(/المسمى الوظيفي \(إنكليزي\)/g, 'Job Title (EN)')
      .replace(/بالإنكليزية/g, 'In English')
      .replace(/مستخدم جديد/g, 'New User')
      .replace(/صلاحيات/g, 'Permissions')
      .replace(/إرسال/g, 'Send')
      .replace(/النوع/g, 'Type')
      .replace(/العنوان/g, 'Title')
      .replace(/معلومات/g, 'Info')
      .replace(/نجاح/g, 'Success')
      .replace(/تحذير/g, 'Warning')
      .replace(/خطأ/g, 'Error');
  }
  function sanitizeElementAttrs(root) {
    if (!root || !root.querySelectorAll) return;
    var attrs = ['placeholder', 'title', 'aria-label'];
    var nodes = root.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      for (var j = 0; j < attrs.length; j++) {
        var attr = attrs[j];
        var raw = el.getAttribute && el.getAttribute(attr);
        if (!raw) continue;
        var fixed = translateKnownUiText(repairText(raw));
        if (fixed !== raw) el.setAttribute(attr, fixed);
      }
      if (el.tagName === 'INPUT') {
        var type = (el.getAttribute('type') || '').toLowerCase();
        if (type === 'button' || type === 'submit' || type === 'reset') {
          var value = el.value;
          var fixedValue = translateKnownUiText(repairText(value));
          if (fixedValue !== value) el.value = fixedValue;
        }
      }
    }
  }
  function sanitizeDomText(root) {
    if (!root || !root.querySelectorAll) return;
    try {
      var showText = (typeof NodeFilter !== 'undefined' && NodeFilter && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
      var walker = document.createTreeWalker(root, showText, null);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue) continue;
        var cleaned = translateKnownUiText(repairText(node.nodeValue));
        if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
      }
      sanitizeElementAttrs(root);
      try { window.__CSPSR_SANITIZE_RUNS__ = (window.__CSPSR_SANITIZE_RUNS__ || 0) + 1; } catch(_e0){}
    } catch (_e_sanitize) {}
  }
  try { window.cspsrTranslateKnownUiText = translateKnownUiText; } catch (e) {}
  var s = document.createElement('style');
  s.textContent = "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');"
    + "*{box-sizing:border-box;margin:0;padding:0}"
    + "@keyframes csSpin{to{transform:rotate(360deg)}}"
    + "@keyframes spin{to{transform:rotate(360deg)}}"
    + "@keyframes csBounce{0%{transform:scale(.3);opacity:0}50%{transform:scale(1.15)}70%{transform:scale(.9)}100%{transform:scale(1);opacity:1}}"
    + "#cspsr-root{font-family:'Plus Jakarta Sans',system-ui,sans-serif;direction:rtl}"
    + "#cspsr-root *{box-sizing:border-box}"
    + "#cspsr-root[dir='ltr']{direction:ltr}"
    + "#cspsr-root[dir='rtl']{direction:rtl}"
    + "#cspsr-root{font-variant-numeric:normal;-webkit-font-feature-settings:'lnum';font-feature-settings:'lnum'}"
    + "#cspsr-root ::-webkit-scrollbar{width:5px;height:5px}"
    + "#cspsr-root ::-webkit-scrollbar-thumb{background:#e3e8ef;border-radius:99px}"
    + "#cspsr-root input,#cspsr-root textarea{text-align:inherit}"
    + "#cspsr-root select{-webkit-appearance:none;-moz-appearance:none;appearance:none;min-height:38px;line-height:normal;vertical-align:middle;text-align:start}"
    + "#cspsr-root[dir='rtl'] select{background-position:left 10px center !important}"
    + "#cspsr-root[dir='ltr'] select{background-position:right 10px center !important;padding-left:12px !important;padding-right:32px !important}"
    + "#cspsr-root select option{padding:6px 12px;font-size:13px;color:#0d1117;background:#fff}"
    + "#cspsr-root th,#cspsr-root td{text-align:start}";
  document.head.appendChild(s);
  var root = document.getElementById('cspsr-root');
  if (root) {
    ReactDOM.render(h(App), root);
    sanitizeDomText(root);
    try {
      var mo = new MutationObserver(function(){ sanitizeDomText(root); });
      mo.observe(root, { childList:true, subtree:true, characterData:true });
    } catch (e) {}
    // Safety net: re-sanitize for a few seconds after boot (covers late-rendered table headers).
    try {
      var started = Date.now();
      var iv = setInterval(function(){
        if (!document.body || Date.now() - started > 8000) { clearInterval(iv); return; }
        sanitizeDomText(root);
      }, 300);
    } catch(_e_iv) {}
  }
})();

