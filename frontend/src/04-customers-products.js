function CustomersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('customers');
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var _r = useState(null); var recView = _r[0], setRecView = _r[1];
  var _c = useState(null); var contactsView = _c[0], setContactsView = _c[1];
  var blank = {name:'',name_en:'',phone:'',phone_alt:'',address:'',address_en:'',map_url:''};
  function save() { var p = form.id ? crud.update(form.id,form) : crud.create(form); p.then(function(){setForm(null);}); }
  useTopbar(t('n_clients',crud.items.length), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
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
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('name'),ar:form.name||'',en:form.name_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});}); }}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('phone'),value:form.phone||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});});}}),
        h(Input,{label:t('phone_alt'),value:form.phone_alt||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone_alt:v});});}})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Textarea,{label:t('address')+' (Ø¹Ø±Ø¨ÙŠ)',value:form.address||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address:v});});}}),
        h(Textarea,{label:t('address')+' (EN)',value:form.address_en||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address_en:v});});}})
      ),
      h(Input,{label:t('map_url'),value:form.map_url||'',placeholder:i18n.lang==='en' ? 'https://maps.google.com/...' : 'رابط الخريطة',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}})
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
    title:'ðŸ‘¤ '+t('contact_persons')+' â€” '+((lang==='en'&&customer.company_name_en)?customer.company_name_en:(customer.company_name||customer.name)),
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
              c.phone && h('span',null,'ðŸ“ž '+c.phone),
              c.phone_alt && h('span',null,'ðŸ“ž '+c.phone_alt),
              c.email && h('span',null,'âœ‰ '+c.email)
            ),
            c.map_url && h('a',{href:c.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},t('map_url'))
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
        h(Input,{label:t('map_url'),value:form.map_url||'',placeholder:i18n.lang==='en' ? 'https://maps.google.com/...' : 'رابط الخريطة',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});})}},)
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
  return h(Modal, { title:t('recipients')+' â€” '+(customer.company_name||customer.name), onClose:props.onClose, width:520, footer:h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add_recipient')) },
    items.map(function(r){
      return h(Card, { key:r.id, style:{ padding:'12px 16px', marginBottom:8 } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('div',null,h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{fontWeight:700}},r.name),r.is_active==0&&h(Badge,{label:t('inactive_lbl'),color:'gray'})),h('div',{style:{fontSize:12,color:T.textMute}},r.phone||'â€”'),r.address&&h('div',{style:{fontSize:12,color:T.textMute,marginTop:1}},r.address),r.map_url&&h('a',{href:r.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},'ðŸ—º '+t('map_url'))),
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
      h(Input,{label:t('map_url'),value:form.map_url,placeholder:i18n.lang==='en' ? 'https://maps.google.com/...' : 'رابط الخريطة',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}}),
      h('div',{style:{display:'flex',gap:8,marginTop:4}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    )
  );
}

/* â•â•â• SIMPLE CRUD FACTORY â•â•â• */
function SimpleCRUD(props) {
  var t = useI18n().t;
  var crud = useCRUD(props.resource);
  var _f = useState(null); var form = _f[0], setForm = _f[1];
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
  useTopbar(t('n_items',crud.items.length), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},props.blankForm));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, { columns:props.columns, rows:crud.items, onEdit:function(r){openEdit(r);}, onDelete:function(r){doRemove(r.id);}, extraActions:props.extraActions }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);},
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    }, props.FormContent({ form:form, setForm:setForm }))
  );
}

function colorDot(c) { return h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{width:12,height:12,borderRadius:'50%',background:c,border:'1px solid '+T.border}}),h('code',{style:{fontSize:11,color:T.textMute}},c)); }
/* ln(obj, lang) â€” picks name_en if lang=en and available, else name */
function ln(obj, lang) {
  if (!obj) return 'â€”';
  if (lang === 'en' && obj.name_en && obj.name_en !== '') return obj.name_en;
  return obj.name || obj.step_name || 'â€”';
}
function lnStep(obj, lang) {
  if (!obj) return 'â€”';
  if (lang === 'en' && obj.step_name_en) return obj.step_name_en;
  return obj.step_name || 'â€”';
}
function nameOf(arr, id, lang) { var x = findBy(arr,'id',id); return x ? ln(x, lang||'ar') : 'â€”'; }
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
  var blank = {name:'',name_en:'',color:'#0055d4',sort_order:0};

  useTopbar(t('departments'), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));

  function save() {
    var p = form.id ? crud.update(form.id,form) : crud.create(form);
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
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Name':'Ø§Ù„Ø§Ø³Ù…'),
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Color':'Ø§Ù„Ù„ÙˆÙ†'),
        h('span',null)
      ),
      crud.items.length === 0
        ? h('div',{style:{padding:32,textAlign:'center',color:T.textMute,fontSize:13}}, lang==='en'?'No departments yet':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù‚Ø³Ø§Ù… Ø¨Ø¹Ø¯')
        : crud.items.map(function(dept, idx){
          return h('div',{key:dept.id,style:{display:'grid',gridTemplateColumns:'32px 1fr 140px auto',gap:8,padding:'10px 16px',borderBottom:'1px solid '+T.border,alignItems:'center',background:T.bg}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1,alignItems:'center'}},
              h('button',{onClick:function(){move(idx,-1);},disabled:idx===0,
                style:{background:'transparent',border:'none',cursor:idx===0?'default':'pointer',color:idx===0?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'â–²'),
              h('button',{onClick:function(){move(idx,1);},disabled:idx===crud.items.length-1,
                style:{background:'transparent',border:'none',cursor:idx===crud.items.length-1?'default':'pointer',color:idx===crud.items.length-1?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'â–¼')
            ),
            h('div',null,
              h('span',{style:{fontWeight:600,fontSize:13,color:T.text}}, ln(dept,lang)),
              dept.name_en && lang==='ar' && h('div',{style:{fontSize:11,color:T.textMute}}, dept.name_en)
            ),
            h('div',{style:{display:'flex',alignItems:'center',gap:6}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:dept.color||'#0ea5e9',flexShrink:0}}),
              h('span',{style:{fontSize:12,color:T.textMute}}, dept.color||'â€”')
            ),
            h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end'}},
              h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},blank,dept));}}, t('edit')),
              h(Btn,{size:'sm',variant:'danger',onClick:function(){ if(confirm(lang==='en'?'Delete?':'Ø­Ø°ÙØŸ')) crud.remove(dept.id).then(function(){ if(props.onReload) props.onReload(); }); }}, t('delete'))
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
      )
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
    blankForm:{name:'',name_en:'',department_id:'',lead_employee_id:'',member_ids:[]},
    onBeforeSave:function(form) {
      /* member_ids is handled server-side via extra endpoint */
      return form;
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
  return h(SimpleCRUD, { title:t('employees'), resource:'employees', onReload:props.onReload,
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
    blankForm:{name:'',name_en:'',role_id:'',department_id:'',team_id:'',phone:'',is_active:1},
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
      )); }
  });
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
  function stepTypeOf(step) {
    if (parseInt(step && step.is_delivery, 10) === 1) return 'delivery';
    if (parseInt(step && step.is_external, 10) === 1) return 'external';
    return 'internal';
  }
  function applyStepType(form, type) {
    var next = Object.assign({}, form || {});
    next.step_type = type;
    if (type === 'delivery') {
      next.is_delivery = 1;
      next.is_external = 0;
      next.scales_with_qty = 0;
      next.qty_per_unit = 1;
      next.show_in_prds = 1;
    } else if (type === 'external') {
      next.is_delivery = 0;
      next.is_external = 1;
      next.scales_with_qty = 0;
      next.qty_per_unit = 1;
      next.show_in_prds = 0;
    } else {
      next.is_delivery = 0;
      next.is_external = 0;
      next.show_in_prds = next.show_in_prds != null ? next.show_in_prds : 1;
      next.qty_per_unit = next.qty_per_unit || 1;
    }
    return next;
  }

  function load() {
    setLoading(true);
    apiFetch('products/'+product.id+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setLoading(false); });
  }
  useEffect(function(){ load(); }, [product.id]);

  function fmtMin(m) {
    if (!m || m==0) return 'â€”';
    var mins = parseInt(m);
    if (mins < 60) return mins+' '+t('minutes');
    var hh = Math.floor(mins/60); var rem = mins%60;
    return hh+'h'+(rem?(' '+rem+'m'):'');
  }

  /* Add step from library */
  function addFromLib(libId) {
    var lib = findBy(stepLib,'id',libId);
    if (!lib) return;
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
      is_delivery: lib.is_delivery || 0
    };
    if ((!data.assigned_employee_ids || !data.assigned_employee_ids.length) && data.assigned_team_id) {
      data.assigned_employee_ids = getTeamEmployeeIds(data.assigned_team_id);
    }
    apiFetch('products/'+product.id+'/steps',{method:'POST',body:JSON.stringify(data)}).then(function(){ setSelLibId(''); load(); });
  }

  /* Edit: only allow changing employee/team and step_order */
  function saveEdit() {
    var data = Object.assign({},form);
    var mins = data.time_unit==='hr' ? (parseFloat(data.expected_time_val)||0)*60 : (parseFloat(data.expected_time_val)||0);
    data.expected_hours = mins/60;
    data.expected_minutes = mins;
    data.expected_time_val = data.expected_time_val==='' ? '' : String(data.expected_time_val);
    data.qty_per_unit = Math.max(1, parseInt(data.qty_per_unit,10)||1);
    data.assigned_employee_ids = Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [];
    apiFetch('product-steps/'+form.id,{method:'PUT',body:JSON.stringify(data)}).then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('product-steps/'+id,{method:'DELETE'}).then(load); }

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
                    h('span',null,'⏱ '+(s.expected_time_val||fmtMin(Math.round((parseFloat(s.expected_hours)||0)*60)))+' / '+(s.qty_per_unit||1)+' '+t('unit_lbl')),

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
                    setForm({id:fresh.id,step_order:fresh.step_order,expected_minutes:rawMins,expected_time_val:String(timeVal),time_unit:timeUnit,assigned_employee_ids:eids.map(String),assigned_team_id:fresh.assigned_team_id?String(fresh.assigned_team_id):'',step_name:fresh.step_name,step_name_en:fresh.step_name_en||'',scales_with_qty:fresh.scales_with_qty||0,qty_per_unit:String(fresh.qty_per_unit||1),show_in_prds:fresh.show_in_prds!=null?parseInt(fresh.show_in_prds):1,is_external:parseInt(fresh.is_external)||0,is_delivery:parseInt(fresh.is_delivery)||0});
                  }},t('edit')),
                  h(Btn,{size:'sm',variant:'danger',onClick:function(){del(s.id);}},t('delete'))
                )
              );
            })
          ),

      /* â”€â”€ Edit form â”€â”€ */
      form && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:14,marginTop:8}},
        h('div',{style:{fontWeight:600,fontSize:13,marginBottom:10,color:T.accent}},t('edit')+': '+(lang==='en'&&form.step_name_en?form.step_name_en:form.step_name)),
        h(Select,{label:(lang==='en'?'Step Type':'نوع الخطوة'),value:form.step_type||stepTypeOf(form),onChange:function(v){setForm(function(f){return applyStepType(f,v);});},options:[
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
        ((form.step_type||stepTypeOf(form))==='internal') && h('div',{style:{fontSize:11,color:T.textMute,marginBottom:10,padding:'4px 6px',background:T.bgSub,borderRadius:T.radius}},
          '📐 '+(lang==='ar'?'مثال':'Example')+': '+( form.expected_time_val!=='' && form.expected_time_val!=null ? form.expected_time_val : 0 )+' '+(form.time_unit==='hr'?t('hours_unit'):t('minutes'))+' '+(lang==='ar'?'لكل':'per')+' '+(form.qty_per_unit!=='' && form.qty_per_unit!=null ? form.qty_per_unit : 1)+' '+(lang==='ar'?'وحدة':'unit')
        ),
        ((form.step_type||stepTypeOf(form))!=='external') && h(Select,{label:(form.step_type||stepTypeOf(form))==='delivery'?(lang==='en'?'Delivery Team':'فريق التوصيل'):t('team'),value:String(form.assigned_team_id||''),onChange:function(v){
          setForm(function(f){
            var teamIds = getTeamEmployeeIds(v);
            return Object.assign({},f,{assigned_team_id:v,assigned_employee_ids:teamIds.length?teamIds:(v?f.assigned_employee_ids:[])});
          });
        },options:[{value:'',label:'â€”'}].concat(teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
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
    wfProduct && h(ProductWorkflowModal,{product:wfProduct,bootstrap:props.bootstrap,onClose:function(){setWfProduct(null);}})
  );
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
  var blank = {step_name:'',step_name_en:'',step_order:0,assigned_employee_id:'',assigned_team_id:'',assigned_role_id:'',status_slug:'pending',expected_hours:0,show_in_prds:0,is_external:0,supplier_id:'',ext_send_at:'',ext_receive_expected:''};

  function loadSteps(p) {
    setLoading(true);
    apiFetch('products/'+p+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setSteps([]); setLoading(false); });
  }
  useEffect(function(){ if(pid) loadSteps(pid); }, [pid]);

  function save() {
    var data = Object.assign({}, form);
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
        setForm(Object.assign({},r,{assigned_employee_ids:eids.map(String)}));
      }, onDelete:function(r){del(r.id);}
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('step_name'),ar:form.step_name,en:form.step_name_en,onAr:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{step_name_en:v});});}}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
        h(Input,{label:t('expected_hours'),type:'number',value:form.expected_hours,onChange:function(v){setForm(function(f){return Object.assign({},f,{expected_hours:parseFloat(v)||0});})}})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Select,{label:t('team'),value:String(form.assigned_team_id||''),onChange:function(v){setForm(function(f){ var teamIds = getTeamEmployeeIds(v); return Object.assign({},f,{assigned_team_id:v,assigned_employee_ids:teamIds.length?teamIds:(v?f.assigned_employee_ids:[])}); });},options:[{value:'',label:'â€”'}].concat(teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        h(Select,{label:t('role'),value:String(form.assigned_role_id||''),onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_role_id:v});});},options:[{value:'',label:'â€”'}].concat(roles.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        form.assigned_team_id
          ? h('div',{style:{gridColumn:'1 / -1'}},
              h(Fld,{label:t('employees')},
                h('div',{style:{border:'1px solid '+T.border,borderRadius:T.radius,padding:'10px 12px',background:T.bgSub,fontSize:12,color:T.textMid,lineHeight:1.8}},
                  getTeamEmployeeIds(form.assigned_team_id).length
                    ? getTeamEmployeeIds(form.assigned_team_id).map(function(id){ return nameOf(employees,id,lang); }).join(', ')
                    : (lang==='en' ? 'No employees linked to this team yet.' : 'لا يوجد موظفون مربوطون بهذا الفريق حالياً.')
                ),
                h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},
                  lang==='en' ? 'Employees are assigned automatically from the selected team.' : 'يتم تعيين الموظفين تلقائياً من الفريق المختار.'
                )
              )
            )
          : h('div',{style:{gridColumn:'1 / -1'}},
              h(MultiSelect,{label:t('employees'),
                values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
                onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
                options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
              })
            ),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_external==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_external:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('external_task')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_delivery==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_delivery:e.target.checked?1:0});});},style:{accentColor:T.accent}}),'ðŸšš '+t('is_delivery'))
      ),
      /* External supplier fields â€” only shown when is_external */
      form.is_external==1 && h('div',{style:{marginTop:12,padding:'12px 14px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
        h('div',{style:{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10}},'ðŸ­ '+(lang==='en'?'External Supplier Details':'ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø¬Ù‡Ø² Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ')),
        h(Select,{label:lang==='en'?'Supplier':'Ø§Ù„Ù…Ø¬Ù‡Ø²',value:String(form.supplier_id||''),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
          options:[{value:'',label:lang==='en'?'â€” Select Supplier â€”':'â€” Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¬Ù‡Ø² â€”'}].concat(
            suppliers.map(function(s){ return {value:String(s.id),label:ln(s,lang)+(s.phone?' Â· '+s.phone:'')};})
          )
        }),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:10}},
          h(Input,{label:lang==='en'?'Expected Send Date/Time':'ÙˆÙ‚Øª Ø¥Ø±Ø³Ø§Ù„ Ù…ØªÙˆÙ‚Ø¹',type:'datetime-local',value:form.ext_send_at||'',
            onChange:function(v){setForm(function(f){return Object.assign({},f,{ext_send_at:v});});}}),
          h(Input,{label:lang==='en'?'Expected Receive Date/Time':'ÙˆÙ‚Øª Ø§Ø³ØªÙ„Ø§Ù… Ù…ØªÙˆÙ‚Ø¹',type:'datetime-local',value:form.ext_receive_expected||'',
            onChange:function(v){setForm(function(f){return Object.assign({},f,{ext_receive_expected:v});});}})
        )
      ),
      h(MultiSelect,{label:t('employees'),
        values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
        onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
        options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
      })
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

  /* Group steps by supplier_id */
  var supplierMap = {};
  if(allSteps.length>0) console.log('[EXT] first step supplier_id:',allSteps[0].supplier_id,'suppliers count:',suppliers.length, 'suppliers:',suppliers.map(function(x){return x.id+':'+x.name;}));
  allSteps.forEach(function(s){
    var sid = String(s.supplier_id||'none');
    if (!supplierMap[sid]) supplierMap[sid] = [];
    supplierMap[sid].push(s);
  });

  /* Build supplier rows â€” sort by late count desc */
  var rows = Object.keys(supplierMap).map(function(sid){
    var steps = supplierMap[sid];
    var sup = sid!=='none' ? suppliers.filter(function(x){ return String(x.id)===sid; })[0] : null;
    var lateCount = steps.filter(function(s){
      if (!s.ext_receive_expected) return false;
      var expected = new Date(s.ext_receive_expected);
      var actual = s.ext_receive_actual ? new Date(s.ext_receive_actual) : new Date();
      return actual > expected;
    }).length;
    return {sid:sid, sup:sup, steps:steps, lateCount:lateCount};
  });
  rows.sort(function(a,b){ return b.lateCount - a.lateCount; });

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
    if (!s.ext_receive_expected) return null;
    var expected = new Date(s.ext_receive_expected);
    var cmp = s.ext_receive_actual ? new Date(s.ext_receive_actual) : new Date();
    var diffH = Math.round((cmp - expected) / 36e5);
    if (s.ext_receive_actual) {
      return diffH > 0
        ? h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}}, '⚠️ تأخير '+diffH+' س')
        : h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}}, '✅ في الوقت');
    }
    if (s.status_slug==='in_progress' && diffH > 0) {
      return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}}, '⚠️ تأخير '+diffH+' س');
    }
    return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}}, '✅ في الوقت');
  }

  function fmtDT(str){
    if (!str) return null;
    var d = new Date(str);
    var days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    var months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    if (lang==='en') {
      return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    }
    var p = function(n){ return String(n).padStart(2,'0'); };
    return p(d.getDate())+' '+months[d.getMonth()]+' '+p(d.getHours())+':'+p(d.getMinutes());
  }

  var CARD_W = 220;

  useTopbar(lang==='en'?'External Tasks':'المهام الخارجية', null);

  if (rows.length === 0) {
    return h('div',{style:{padding:40,textAlign:'center'}},
      h('div',{style:{fontSize:32,marginBottom:10}},'🏭'),
      h('div',{style:{color:T.textMute,fontSize:14}},lang==='en'?'No external tasks':'لا توجد مهام خارجية')
    );
  }

  return h('div',{style:{display:'flex',flexDirection:'column',gap:10}},

    /* Total summary */
    h('div',{style:{fontSize:13,color:T.textMute,marginBottom:4}},
      rows.length+' '+(lang==='en'?'suppliers':'مجهز')+' · '+allSteps.length+' '+(lang==='en'?'tasks':'مهمة')
    ),

    rows.map(function(row){
      var sup = row.sup;
      var steps = row.steps;
      var cur = getPos(row.sid);
      var total = steps.length;

      /* Avatar initials */
      var name = sup ? ln(sup,lang) : (lang==='en'?'Unknown':'غير محدد');
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
              total+' '+(lang==='en'?'tasks':'Ù…Ù‡Ù…Ø©')
            ),
            row.lateCount > 0 && h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}},
              row.lateCount+' '+(lang==='en'?'late':'Ù…ØªØ£Ø®Ø±Ø©')
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
                      'ðŸ“¤ '+(lang==='en'?'Sent:':'Ø£ÙØ±Ø³Ù„: ')+(s.ext_send_at ? fmtDT(s.ext_send_at) : (lang==='en'?'Not sent':'Ù„Ù… ÙŠÙØ±Ø³Ù„'))
                    ),
                    h('div',{style:{fontSize:11,color:T.textMute}},
                      'ðŸ“… '+(lang==='en'?'Expected:':'Ù…ØªÙˆÙ‚Ø¹: ')+(s.ext_receive_expected ? fmtDT(s.ext_receive_expected) : 'â€”')
                    ),
                    s.ext_receive_actual && h('div',{style:{fontSize:11,color:T.green}},
                      'ðŸ“¥ '+(lang==='en'?'Received:':'Ø§Ø³ØªÙÙ„Ù…: ')+fmtDT(s.ext_receive_actual)
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

  var _dp2 = useState(null); var delayPrompt2 = _dp2[0], setDelayPrompt2 = _dp2[1];
  function startStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/start',{method:'POST'}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }
  function completeStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/advance',{method:'POST'}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }

  /* Time performance badge */
  function timeBadge(r) {
    if (r.status_slug !== 'in_progress' && r.status_slug !== 'done') return h('span',{style:{color:T.textMute}},'â€”');
    if (!r.started_at) return h('span',{style:{color:T.textMute}},'â€”');
    var exp = (parseFloat(r.expected_hours)||0) * 60;
    if (exp <= 0) return h('span',{style:{color:T.textMute}},'â€”');
    var endMs = r.completed_at ? new Date(r.completed_at) : new Date();
    var actual = (endMs - new Date(r.started_at)) / 60000;
    var diff = actual - exp;
    if (diff < -2)  return h(Badge,{label:'âœ… '+(lang==='en'?'Ahead':t('ahead'))+' '+Math.abs(Math.round(diff))+'m', color:'green'});
    if (diff < 5)   return h(Badge,{label:'âœ… '+(lang==='en'?'On Time':t('on_time')), color:'green'});
    return h(Badge,{label:'âš ï¸ '+(lang==='en'?'Late':t('late'))+' +'+Math.round(diff)+'m', color:'red'});
  }

  var filterBar = isAdmin && h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 16px', background:T.bgSub, borderRadius:T.radius, border:'1px solid '+T.border } },
    h('span',{style:{fontSize:13,color:T.textMute,fontWeight:600}}, lang==='en'?'Filter by employee:':'ÙÙ„ØªØ± Ø­Ø³Ø¨ Ø§Ù„Ù…ÙˆØ¸Ù:'),
    h('select', { value:selEmpId, onChange:function(e){ setSelEmpId(e.target.value); },
      style:{ padding:'6px 10px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13, minWidth:160 }
    },
      h('option',{value:''}, lang==='en'?'All employees':'ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†'),
      employees.map(function(e){ return h('option',{key:e.id, value:String(e.id)}, ln(e,lang)); })
    ),
    selEmpId && h('button',{onClick:function(){setSelEmpId('');}, style:{padding:'5px 10px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.textMute,cursor:'pointer',fontSize:12}},'âœ•')
  );

  useTopbar(t('n_tasks',steps.length), null);
  return h('div', null,
    filterBar,
    steps.length === 0
      ? h(Card,{style:{padding:40,textAlign:'center'}},h('div',{style:{fontSize:32,marginBottom:10}},props.externalOnly?'ðŸšš':'âœ‹'),h('div',{style:{color:T.textMute}},t('no_data')))
      : h(DataTable, {
          columns:[
            {key:'step_name',label:t('step_name'),render:function(r){
              return h('div',null,
                h('span',{style:{fontWeight:600}},lnStep(r,lang)),
                r.is_paused==1 && h('span',{style:{marginRight:6,fontSize:11,background:'#fef3c7',color:'#b45309',borderRadius:4,padding:'1px 5px'}},'â¸')
              );
            }},
            {key:'order',label:t('order_number_lbl'),render:function(r){return h('code',{style:{fontSize:12,color:T.accent}},'#'+r.order.order_number);}},
            {key:'item',label:t('product'),render:function(r){return (lang==='en'&&r.item.product_name_en)?r.item.product_name_en:r.item.product_name;}},
            {key:'customer',label:t('customer'),render:function(r){return getCust(r.order, lang);}},
            {key:'status_slug',label:t('status'),render:function(r){return statusBadge(r.status_slug,statuses,lang);}},
            {key:'expected_hours',label:t('exp_hrs'),render:function(r){return fmtH(r.expected_hours);}},
            {key:'time_perf',label:lang==='en'?'Time':'Ø§Ù„ÙˆÙ‚Øª',noSort:true,render:timeBadge},
          ],
          rows:steps,
          actions:function(r){ return h('div',{style:{display:'flex',gap:6}},
            r.status_slug==='pending' && h(Btn,{size:'sm',variant:'primary',onClick:function(){startStep(r.id, r.order.id);}}, 'â–¶ '+t('start')),
            r.status_slug==='in_progress' && h(Btn,{size:'sm',variant:'success',onClick:function(){completeStep(r.id, r.order.id);}}, 'âœ“ '+t('complete_step'))
          ); }
        }),
    delayPrompt2 && h(Modal,{
      title:'âš ï¸ '+(lang==='en'?'Delay Reason Required':'Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ± Ù…Ø·Ù„ÙˆØ¨'), onClose:function(){setDelayPrompt2(null);}, width:460,
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
