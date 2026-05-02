var I18nCtx = createContext({ t: function(k){ return k; }, lang:'ar', setLang: function(){}, isRtl:true });
function I18nProvider(props) {
  var saved = 'ar';
  var browserLang = 'ar';
  try {
    browserLang = ((navigator.language || navigator.userLanguage || 'ar') + '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
  } catch(e) { browserLang = 'ar'; }
  try {
    var ls = localStorage.getItem('cspsr_lang');
    saved = ls || props.initialLang || browserLang || 'ar';
  } catch(e) { saved = props.initialLang || browserLang || 'ar'; }
  if (saved !== 'ar' && saved !== 'en') saved = 'ar';
  var _s = useState(saved);
  var lang = _s[0], setLangRaw = _s[1];
  function setLang(l) {
    setLangRaw(l);
    try {
      localStorage.setItem('cspsr_lang', l);
    } catch(e) { console.error('[I18n] localStorage error:', e); }
  }
  // Also persist on every lang change via effect
  useEffect(function() {
    try { localStorage.setItem('cspsr_lang', lang); } catch(e) {}
  }, [lang]);
  var isRtl = lang === 'ar';
  var t = useCallback(function(k, arg) {
    var dict = I18N[lang] || I18N.ar;
    var val = dict[k] != null ? dict[k] : (I18N.ar[k] != null ? I18N.ar[k] : k);
    return typeof val === 'function' ? val(arg) : val;
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
  if (!val) return 'â€”';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric' });
  } catch(e) { return val; }
}
function fmtDateTime(val, lang) {
  if (!val) return 'â€”';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e) { return val; }
}

function openPrint(order) { openPrintWithLang(order, "ar"); }

/* â”€â”€ Safe i18n getter (for render functions outside React tree) â”€â”€ */
var _currentLang = 'ar';
function getLang() { return _currentLang; }
function getT() { return function(k, arg) {
  var dict = I18N[_currentLang] || I18N.ar;
  var val = dict[k] != null ? dict[k] : (I18N.ar[k] != null ? I18N.ar[k] : k);
  return typeof val === 'function' ? val(arg) : val;
}; }

/* â”€â”€ API â”€â”€ */
function cfg() { return window.CSPSR_CONFIG || { root:'/wp-json/cspsr/v1/', nonce:'' }; }
function apiFetch(path, opts) {
  opts = opts || {};
  var c = cfg();
  var url = c.root.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  var token = '';
  try { token = localStorage.getItem('cspsr_token') || ''; } catch(e){}
  var method = opts.method || 'GET';
  return fetch(url, {
    headers: Object.assign({ 'Content-Type':'application/json', 'X-WP-Nonce': c.nonce, 'X-CSPSR-Token': token }, opts.headers || {}),
    method: method,
    body: opts.body || undefined,
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) {
        var msg = (data && (data.message || data.code)) || res.status;
        throw new Error(msg);
      }
      return data;
    });
  }).catch(function(err){
    throw err;
  });
}

/* â”€â”€ Print slip â”€â”€ */
function openPrintWithLang(order, lang) {
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
