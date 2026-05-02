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
              return h('th', {
                key:i,
                onClick: sortable && c.key ? function(){ toggleSort(c.key); } : undefined,
                style:{ padding:'10px 16px', textAlign:'start', borderBottom:'1px solid '+T.border, color: isSorted ? T.accent : T.textMute, fontWeight:600, fontSize:11, letterSpacing:.5, textTransform:'uppercase', whiteSpace:'nowrap', cursor: sortable && c.key ? 'pointer' : 'default', userSelect:'none', transition:'color .15s' }
              },
                h('span', { style:{ display:'inline-flex', alignItems:'center', gap:5 } },
                  c.label,
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

