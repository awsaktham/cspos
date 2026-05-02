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

function CheckboxGroup(props) {
  return h(MultiSelect, {
    label: props.label,
    hint: props.hint,
    values: props.value || props.values || [],
    options: props.options || [],
    onChange: props.onChange
  });
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

