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
  return h(Fld, { label:props.label, hint:props.hint },
    h('textarea', { value:props.value != null ? props.value : '', rows:props.rows||3, placeholder:props.placeholder||'', onChange:function(e){ props.onChange(e.target.value); }, style:Object.assign({}, iSt, {resize:'vertical'}), onFocus:onFocus, onBlur:onBlur })
  );
}
function Select(props) {
  var opts = props.options || [];
  return h(Fld, { label:props.label, hint:props.hint },
    h('select', { value:props.value != null ? props.value : '', onChange:function(e){ props.onChange(e.target.value); }, style:selSt, onFocus:onFocus, onBlur:onBlur },
      h('option', { value:'' }, props.placeholder || (getLang()==='en' ? 'â€” Select â€”' : 'â€” Ø§Ø®ØªØ± â€”')),
      opts.map(function(o){ return h('option', { key:o.value, value:o.value }, o.label); })
    )
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
        h('span', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'right':'left']:12, color:T.textMute, fontSize:14, pointerEvents:'none' } }, 'ðŸ”'),
        h('input', {
          value:q, onChange:function(e){ setQ(e.target.value); },
          placeholder: props.searchPlaceholder || t('search')+'...',
          style:{ width:'100%', padding: i18n.isRtl ? '8px 36px 8px 12px' : '8px 12px 8px 36px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, outline:'none', background:T.bg, color:T.text, fontFamily:'inherit' },
          onFocus:function(e){ e.target.style.borderColor=T.accent; },
          onBlur:function(e){ e.target.style.borderColor=T.border; },
        })
      ),
      q && h('button', { onClick:function(){ setQ(''); }, style:{ padding:'7px 12px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:12, fontFamily:'inherit' } }, 'âœ•'),
      q && h('span', { style:{ fontSize:12, color:T.textMute } }, sorted.length + ' / ' + rows.length)
    ),
    h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radiusLg, overflow:'hidden' } },
      h('table', { style:{ width:'100%', borderCollapse:'collapse', fontSize:13 } },
        h('thead', null,
          h('tr', { style:{ background:T.bgSub } },
            cols.map(function(c, i){
              var isSorted = sort.key === c.key;
              var sortable = !c.noSort;
              return h('th', {
                key:i,
                onClick: sortable && c.key ? function(){ toggleSort(c.key); } : undefined,
                style:{ padding:'10px 16px', textAlign:'start', borderBottom:'1px solid '+T.border, color: isSorted ? T.accent : T.textMute, fontWeight:600, fontSize:11, letterSpacing:.5, textTransform:'uppercase', whiteSpace:'nowrap', cursor: sortable && c.key ? 'pointer' : 'default', userSelect:'none', transition:'color .15s' }
              },
                h('span', { style:{ display:'inline-flex', alignItems:'center', gap:5 } },
                  c.label,
                  sortable && c.key && h('span', { style:{ fontSize:10, opacity: isSorted ? 1 : 0.35, color: isSorted ? T.accent : 'inherit' } },
                    isSorted ? (sort.dir === 'asc' ? ' â†‘' : ' â†“') : ' â†•'
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
                  cols.map(function(c, ci){ return h('td', { key:ci, style:{ padding:'11px 16px', color:T.text } }, c.render ? c.render(row) : (row[c.key] != null ? row[c.key] : 'â€”')); }),
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
