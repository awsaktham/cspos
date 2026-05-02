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

