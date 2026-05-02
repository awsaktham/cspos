function getStoredAuth() {
  try {
    var t = localStorage.getItem('cspsr_token');
    var u = localStorage.getItem('cspsr_user');
    var p = localStorage.getItem('cspsr_perms');
    if (t && u) return { token:t, user:JSON.parse(u), permissions:JSON.parse(p||'[]') };
  } catch(e) {}
  return null;
}
function setStoredAuth(token, user, permissions) {
  try {
    localStorage.setItem('cspsr_token', token);
    localStorage.setItem('cspsr_user', JSON.stringify(user));
    localStorage.setItem('cspsr_perms', JSON.stringify(permissions||[]));
  } catch(e) {}
}
function clearStoredAuth() {
  try { localStorage.removeItem('cspsr_token'); localStorage.removeItem('cspsr_user'); localStorage.removeItem('cspsr_perms'); } catch(e) {}
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
        props.onLogin(res.user, res.permissions);
      })
      .catch(function(e) { setError(e.message || t('login_error')); setLoading(false); });
  }

  function onKey(e) { if (e.key === 'Enter') doLogin(); }

  return h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bgSub } },
    h('div', { style:{ background:T.bg, borderRadius:T.radiusLg, padding:'40px 48px', boxShadow:T.shadowLg, width:'100%', maxWidth:400, textAlign:'center' } },
      h('div', { style:{ fontSize:36, marginBottom:8 } }, 'ðŸŽ¨'),
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
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){ setPermUser(r); }}, lang==='en'?'ðŸ” Permissions':'ðŸ” ØµÙ„Ø§Ø­ÙŠØ§Øª'),
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
  var _confirmPreset = useState(false); var confirmPreset = _confirmPreset[0], setConfirmPreset = _confirmPreset[1];

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

  useTopbar(lang==='en'?'Settings':'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª');

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
    apiFetch('setup', {method:'POST', body:JSON.stringify({pause_reasons: clean, kds_carousel_interval: interval, whatsapp_notify: waNotify.trim()})})
      .then(function(){
        setSaving(false); setSaved(true);
        setTimeout(function(){ setSaved(false); }, 2000);
        if (props.onBrandingUpdate) props.onBrandingUpdate(Object.assign({},branding,{pause_reasons:clean, kds_carousel_interval:interval, whatsapp_notify:waNotify.trim()}));
      })
      .catch(function(){ setSaving(false); });
  }

  var inSt = {width:'100%',padding:'7px 9px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bgSub,color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'};

  var _stab = useState('reasons'); var stab = _stab[0], setStab = _stab[1];
  var STABS = [
    {key:'reasons', icon:'â¸', ar:'Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„ØªÙˆÙ‚Ù', en:'Pause Reasons'},
    {key:'kds',     icon:'ðŸ“º', ar:'Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬', en:'Production Display'},
  ];

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
          h('div', { style:{ fontWeight:700, fontSize:15 } }, lang==='en' ? 'Delay & Pause Reasons' : 'Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ± ÙˆØ§Ù„Ø¥ÙŠÙ‚Ø§Ù'),
          h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } },
            lang==='en' ? 'Appear when pausing a step or recording a delivery delay.' : 'ØªØ¸Ù‡Ø± Ø¹Ù†Ø¯ Ø¥ÙŠÙ‚Ø§Ù Ø®Ø·ÙˆØ© Ø£Ùˆ ØªØ³Ø¬ÙŠÙ„ Ø³Ø¨Ø¨ ØªØ£Ø®ÙŠØ±.'
          )
        ),
        h('button', {
          onClick: function(){ setConfirmPreset(true); },
          style:{ padding:'6px 14px', borderRadius:T.radius, border:'1px solid '+T.accent, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }
        }, lang==='en' ? 'âš¡ Load Preset Reasons' : 'âš¡ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„Ø¬Ø§Ù‡Ø²Ø©')
      ),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:12 } },
        lang==='en'
          ? 'These reasons appear when pausing a step or recording a delivery delay. Optionally specify the machine and step for each reason.'
          : 'Ù‡Ø°Ù‡ Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨ ØªØ¸Ù‡Ø± Ø¹Ù†Ø¯ Ø¥ÙŠÙ‚Ø§Ù Ø®Ø·ÙˆØ© Ø£Ùˆ ØªØ³Ø¬ÙŠÙ„ Ø³Ø¨Ø¨ ØªØ£Ø®ÙŠØ±. ÙŠÙ…ÙƒÙ† ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø§ÙƒÙ†Ø© ÙˆØ§Ù„Ø®Ø·ÙˆØ© Ù„ÙƒÙ„ Ø³Ø¨Ø¨.'
      ),
      confirmPreset && h('div', { style:{ background:'rgba(245,158,11,.08)', border:'1px solid #f59e0b', borderRadius:T.radius, padding:'12px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' } },
        h('span', { style:{ fontSize:13, color:T.text, flex:1 } },
          lang==='en'
            ? 'âš ï¸ This will replace all current reasons with the preset list ('+PRESET_REASONS.length+' reasons). Continue?'
            : 'âš ï¸ Ø³ÙŠØªÙ… Ø§Ø³ØªØ¨Ø¯Ø§Ù„ ÙƒÙ„ Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø¨Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¬Ø§Ù‡Ø²Ø© ('+PRESET_REASONS.length+' Ø³Ø¨Ø¨). ØªØ£ÙƒÙŠØ¯ØŸ'
        ),
        h('div', { style:{ display:'flex', gap:8 } },
          h('button', { onClick:function(){ setConfirmPreset(false); }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bgCard, color:T.text, cursor:'pointer', fontSize:12 } }, lang==='en'?'Cancel':'Ø¥Ù„ØºØ§Ø¡'),
          h('button', { onClick:function(){
            setReasons(PRESET_REASONS.map(function(r,i){ return Object.assign({},r,{_id:Date.now()+i}); }));
            setConfirmPreset(false);
          }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 } }, lang==='en'?'Yes, Load':'Ù†Ø¹Ù…ØŒ Ø­Ù…Ù‘Ù„')
        )
      ),
      /* Column headers */
      reasons.length > 0 && h('div', {style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,marginBottom:6,paddingBottom:6,borderBottom:'1px solid '+T.border}},
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Arabic':'Ø§Ù„Ø¹Ø±Ø¨ÙŠ'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'English':'Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Machine':'Ø§Ù„Ù…Ø§ÙƒÙ†Ø©'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Step':'Ø§Ù„Ø®Ø·ÙˆØ©'),
        h('span',null)
      ),
      /* Existing reasons */
      reasons.length === 0
        ? h('div', { style:{ color:T.textMute, fontSize:13, marginBottom:16, padding:'16px', background:T.bgSub, borderRadius:T.radius, textAlign:'center' } },
            lang==='en' ? 'No reasons added yet' : 'Ù„Ù… ØªÙØ¶Ù Ø£Ø³Ø¨Ø§Ø¨ Ø¨Ø¹Ø¯'
          )
        : h('div', { style:{ marginBottom:16 } },
            reasons.map(function(r) {
              return h('div', { key:r._id, style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center' } },
                h('input', { value:r.ar||'', onChange:function(e){ updateReason(r._id,'ar',e.target.value); }, style:Object.assign({},inSt,{direction:'rtl'}), placeholder:'Ø³Ø¨Ø¨ Ø§Ù„Ø¥ÙŠÙ‚Ø§Ù...' }),
                h('input', { value:r.en||'', onChange:function(e){ updateReason(r._id,'en',e.target.value); }, style:inSt, placeholder:'Pause reason...' }),
                h('input', { value:r.machine||'', onChange:function(e){ updateReason(r._id,'machine',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Press A':'Ù…Ø«Ø§Ù„: Ù…ÙƒØ¨Ø³ A' }),
                h('input', { value:r.step||'', onChange:function(e){ updateReason(r._id,'step',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Printing':'Ù…Ø«Ø§Ù„: Ø·Ø¨Ø§Ø¹Ø©' }),
                h('button', { onClick:function(){ removeReason(r._id); }, style:{ padding:'6px 11px', borderRadius:T.radius, border:'none', background:'#fee2e2', color:T.red, cursor:'pointer', fontWeight:700, fontSize:13 } }, 'Ã—')
              );
            })
          ),
      /* Add new reason */
      h('div', { style:{ borderTop:'1px solid '+T.border, paddingTop:16 } },
        h('div',{style:{fontSize:12,fontWeight:600,color:T.textMute,marginBottom:8}}, lang==='en'?'Add new reason:':'Ø¥Ø¶Ø§ÙØ© Ø³Ø¨Ø¨ Ø¬Ø¯ÙŠØ¯:'),
        h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'flex-end' } },
          h(Input, { label:lang==='en'?'Arabic':'Ø§Ù„Ø¹Ø±Ø¨ÙŠ', value:newAr, onChange:setNewAr, placeholder:'Ø³Ø¨Ø¨ Ø§Ù„Ø¥ÙŠÙ‚Ø§Ù...' }),
          h(Input, { label:lang==='en'?'English':'Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ', value:newEn, onChange:setNewEn, placeholder:'Pause reason...' }),
          h(Input, { label:lang==='en'?'Machine (optional)':'Ø§Ù„Ù…Ø§ÙƒÙ†Ø© (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)', value:newMachine, onChange:setNewMachine }),
          h(Input, { label:lang==='en'?'Step (optional)':'Ø§Ù„Ø®Ø·ÙˆØ© (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)', value:newStep, onChange:setNewStep }),
          h(Btn, { variant:'primary', onClick:addReason, style:{marginBottom:2} }, '+ '+(lang==='en'?'Add':'Ø¥Ø¶Ø§ÙØ©'))
        )
      ),
      /* Save */
      h('div', { style:{ marginTop:20, display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'Ø­ÙØ¸')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, 'âœ… '+(lang==='en'?'Saved!':'ØªÙ… Ø§Ù„Ø­ÙØ¸!'))
      )
    ),

    /* â•â• Tab: Production Display â•â• */
    stab==='kds' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } },
        lang==='en' ? 'ðŸ“º Production Display (TV)' : 'ðŸ“º Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬ (TV)'
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
        h('span', { style:{ fontSize:12, color:T.textMute } }, lang==='en'?'seconds':'Ø«Ø§Ù†ÙŠØ©')
      ),
      /* WhatsApp */
      h('div', { style:{ fontWeight:600, fontSize:13, marginBottom:8, color:T.text } },
        'ðŸ“± '+(lang==='en' ? 'WhatsApp Notify Number' : 'Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª')
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
        lang==='en' ? 'With country code, no + (e.g. 9647701234567)' : 'Ù…Ø¹ Ø±Ù…Ø² Ø§Ù„Ø¯ÙˆÙ„Ø©ØŒ Ø¨Ø¯ÙˆÙ† + (Ù…Ø«Ø§Ù„: 9647701234567)'
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'Ø­ÙØ¸')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, 'âœ… '+(lang==='en'?'Saved!':'ØªÙ… Ø§Ù„Ø­ÙØ¸!'))
      )
    )
  );
}


function AppInner(props) {
  var bs = props.bs;
  var i18n = useI18n(); var t = i18n.t;
  var authUser = props.authUser || {};
  var isDeliveryOnly = authUser.role !== 'admin' && (function(){
    var perms = (bs.data && bs.data.user_permissions) || [];
    var hasDelivery = perms.indexOf('delivery_orders.view') >= 0;
    var hasOther = ['orders.view','customers.view','products.view','kds.view','reports.view'].some(function(p){ return perms.indexOf(p) >= 0; });
    return hasDelivery && !hasOther;
  })();
  var _tab = useState(isDeliveryOnly ? 'delivery-orders' : 'dashboard'); var tab = _tab[0], setTab = _tab[1];
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
    'product-steps':   { title: t('product_steps'),     placeholder: t('search')+'...' },
    'steps':           { title: t('steps'),             placeholder: t('search')+'...' },
    'my-tasks':        { title: t('my_tasks'),          placeholder: t('search')+'...' },
    'external-tasks':  { title: t('external_tasks'),    placeholder: t('search')+'...' },
    'delivery-orders': { title: t('delivery_orders'),   search: false },
    'notifications':   { title: t('notifications'),     placeholder: t('search')+'...' },
    'roles':           { title: t('roles'),             placeholder: t('search')+'...' },
    'departments':     { title: t('departments'),        placeholder: t('search')+'...' },
    'teams':           { title: t('teams'),             placeholder: t('search')+'...' },
    'employees':       { title: t('employees'),         placeholder: t('search')+'...' },
    'statuses':        { title: t('statuses'),          placeholder: t('search')+'...' },
    'users':           { title: t('users_mgmt'),         placeholder: t('search')+'...' },
    'kds':             { title: t('kds'),               search: false },
    'settings':        { title: i18n.lang==='en'?'Settings':'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª', search: false },
    'ops-tasks':       { title: t('operations_tasks'),   search: false },
  };
  var meta = PAGE_META[tab] || { title: tab };
  var showTopSearch = meta.search !== false;

  /* show full loading screen only on first load (no data yet) */
  if (bs.loading && !bs.data) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner),t('loading_data'));
  if (bs.error && !bs.data)   return h('div',{style:{padding:40,color:T.red,textAlign:'center',fontSize:14}},'âš ï¸ '+bs.error);

  var vp = { bootstrap:bs.data, onReload:bs.reload, onSilentReload:bs.silentReload };
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
    'ops-tasks':      function(){ return h(OperationsTasksView, vp); },
  };

  if (isDeliveryOnly) {
    return h('div', { style:{ minHeight:'100vh', background:T.bgSub, direction:i18n.isRtl?'rtl':'ltr', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" } },
      h('div', { style:{ maxWidth:640, margin:'0 auto', padding:'16px 12px' } },
        h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } },
          h('div', { style:{ fontWeight:700, fontSize:16, color:T.text } }, 'ðŸšš '+t('delivery_orders')),
          h('button', { onClick:props.onLogout, style:{ background:'none', border:'1px solid '+T.border, borderRadius:T.radius, padding:'5px 12px', cursor:'pointer', fontSize:12, color:T.textMute } }, 'Logout')
        ),
        h(DeliveryOrdersView, { bootstrap:bs.data, onReload:bs.reload, onSilentReload:bs.silentReload, authUser:props.authUser, whatsappNotify:(props.branding&&props.branding.whatsapp_notify)||'' })
      )
    );
  }

  return h(TopbarCtx.Provider, { value:{ setMeta:setMeta } },
    h(SearchCtx.Provider, { value:{ q:searchQ, setQ:setSearchQ, placeholder: meta.placeholder||'' } },
    h(AppLayout, null,
    h(Sidebar, { tab:tab, setTab:setTab, branding:props.branding, authUser:props.authUser, onLogout:props.onLogout }),
    h('main', { dir: i18n.isRtl ? 'rtl' : 'ltr', style:{ flex:1, overflowY:'auto', height:'100vh', display:'flex', flexDirection:'column' } },
      /* â”€â”€ Topbar: 3-column grid â€” title | search | actions â”€â”€ */
      h('div', { dir: i18n.isRtl?'rtl':'ltr', style:{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:0, padding:'0 20px', borderBottom:'1px solid '+T.border, background:T.bg, height:56, flexShrink:0, position:'sticky', top:0, zIndex:100 } },
        /* Col 1: Page title â€” always at logical start */
        h('div', { style:{ minWidth:0 } },
          h('div', { style:{ fontWeight:700, fontSize:15, color:T.text, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, meta.title),
          topbarMeta.subtitle && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:1 } }, topbarMeta.subtitle)
        ),
        /* Col 2: Search â€” always centered, fixed width */
        h('div', { style:{ width: showTopSearch ? 440 : 0, position:'relative', overflow:'hidden' } },
          showTopSearch && h('span', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'right':'left']:'12px', color:T.textMute, fontSize:13, pointerEvents:'none', zIndex:1 } }, 'ðŸ”'),
          showTopSearch && h('input', {
            value: searchQ,
            onChange: function(e){ setSearchQ(e.target.value); },
            placeholder: meta.placeholder || t('search')+'...',
            style:{ width:'100%', padding: i18n.isRtl ? '8px 36px 8px 30px' : '8px 30px 8px 36px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, outline:'none', background:T.bgSub, color:T.text, fontFamily:'inherit' },
            onFocus:function(e){ e.target.style.borderColor=T.accent; },
            onBlur:function(e){ e.target.style.borderColor=T.border; },
          }),
          showTopSearch && searchQ && h('button', { onClick:function(){ setSearchQ(''); }, style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'left':'right']:'10px', background:'none', border:'none', cursor:'pointer', color:T.textMute, fontSize:14, padding:2 } }, 'âœ•')
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
            h('span',null,'ðŸŒ'), h('span',null, i18n.lang==='ar'?'EN':'Ø¹Ø±Ø¨ÙŠ')
          ),
          props.onLogout && h('button', { onClick:props.onLogout, title:'Sign out', style:{ padding:'7px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', flexShrink:0, lineHeight:1 } },
            h('svg',{xmlns:'http://www.w3.org/2000/svg',width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'},
              h('path',{d:'M18.36 6.64a9 9 0 1 1-12.73 0'}),
              h('line',{x1:12,y1:2,x2:12,y2:12})
            )
          )
        )
      ),
      h('div', { style:{ padding: tab==='kds' ? '20px 20px' : '28px 32px', maxWidth: tab==='kds' ? '100%' : 1100, margin:'0 auto', width:'100%' } },
        h(ErrorBoundary, null, (viewMap[tab] || viewMap['dashboard'])())
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
  var _br  = useState(null); var branding = _br[0], setBranding = _br[1];
  var _sc  = useState(false); var setupChecked = _sc[0], setSetupChecked = _sc[1];
  var _sd  = useState(false); var setupDone = _sd[0], setSetupDone = _sd[1];
  var bs   = useBootstrap();

  /* â”€â”€ Auth state â”€â”€ */
  var _stored = getStoredAuth();
  var _au = useState(_stored ? _stored.user : null); var authUser = _au[0], setAuthUser = _au[1];
  var _ap = useState(_stored ? _stored.permissions : []); var authPerms = _ap[0], setAuthPerms = _ap[1];

  useEffect(function(){
    apiFetch('setup').then(function(s){ setBranding(s); setSetupDone(!!s.is_setup_done); setSetupChecked(true); }).catch(function(){ setSetupChecked(true); });
  }, []);

  var lang = cfg().lang || 'ar';

  if (!setupChecked) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner));

  if (!setupDone) return h(I18nProvider, {initialLang:lang}, h(SetupWizard, {onComplete:function(b){ setBranding(b); setSetupDone(true); }}));

  if (mode==='kds') return h(I18nProvider,{initialLang:lang},h(ErrorBoundary,null,h(KDSView,{bootstrap:bs.data,onReload:bs.reload,onSilentReload:bs.silentReload,pauseReasons:(branding&&branding.pause_reasons)||[],carouselInterval:(branding&&branding.kds_carousel_interval)||8})));

  /* â”€â”€ Not logged in â†’ show login screen â”€â”€ */
  if (!authUser) return h(I18nProvider,{initialLang:lang},
    h(LoginScreen, { onLogin:function(user, perms){ setAuthUser(user); setAuthPerms(perms||[]); } })
  );

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

  return h(I18nProvider, { initialLang:lang },
    h(ErrorBoundary, null,
      h(DebugBar, { cfgLang: lang }),
      h(AppInner, { bs:bs, branding:branding, authUser:authUser, onLogout:doLogout, onAvatarUpdate:onAvatarUpdate, onBrandingUpdate:function(b){ setBranding(b); } })
    )
  );
}

/* â•â•â• DEBUG BAR â•â•â• */
function DebugBar(props) {
  var i18n = useI18n();
  var lsLang = '?';
  try { lsLang = localStorage.getItem('cspsr_lang') || '(null)'; } catch(e) { lsLang = 'ERROR'; }
  var cfgLang = props.cfgLang || '?';
  var contextLang = i18n.lang;
  var _v = useState(false); var visible = _v[0], setVisible = _v[1];

  return h('div', { style:{ position:'fixed', bottom:0, left:0, right:0, zIndex:99999, fontFamily:'monospace', fontSize:12 } },
    h('div', { onClick:function(){ setVisible(!visible); }, style:{ background:'#1e1e2e', color:'#cdd6f4', padding:'4px 12px', cursor:'pointer', display:'flex', gap:16, alignItems:'center', borderTop:'2px solid #89b4fa' } },
      h('span', { style:{ color:'#89b4fa', fontWeight:700 } }, 'ðŸ› DEBUG'),
      h('span', null, 'context lang: ', h('b', { style:{ color: contextLang==='en' ? '#a6e3a1' : '#f38ba8' } }, contextLang)),
      h('span', null, 'localStorage: ', h('b', { style:{ color: lsLang==='en' ? '#a6e3a1' : '#f38ba8' } }, lsLang)),
      h('span', null, 'cfg().lang: ', h('b', { style:{ color: cfgLang==='en' ? '#a6e3a1' : '#f38ba8' } }, cfgLang)),
      h('span', null, '_currentLang: ', h('b', { style:{ color: getLang()==='en' ? '#a6e3a1' : '#f38ba8' } }, getLang())),
      h('span', { style:{ color:'#6c7086', marginLeft:'auto' } }, visible ? 'â–² hide' : 'â–¼ details')
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
          h('button', { onClick:function(){
            if (!confirm('Delete ALL completed orders? This cannot be undone.')) return;
            apiFetch('admin/delete-completed-orders', {method:'POST'})
              .then(function(r){ alert('Deleted: ' + r.deleted + ' orders'); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'ðŸ—‘ Delete Completed'),
          h('button', { onClick:function(){ i18n.setLang('ar'); }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Force AR'),
          h('button', { onClick:function(){ try { localStorage.removeItem('cspsr_lang'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#fab387', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Clear LS + Reload'),
          h('button', { onClick:function(){ try { localStorage.setItem('cspsr_lang','en'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#89b4fa', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Set EN + Reload'),
          h('button', { onClick:function(){
            if (!confirm('Sync expected_hours from product steps to all orders?\n\nThis will update any step with 0 hours.')) return;
            apiFetch('admin/fix-expected-hours', {method:'POST'})
              .then(function(r){ alert('âœ… Done!\nUpdated steps: '+r.updated_steps+'\nChecked: '+r.total_checked+'\n\nReloading...'); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#f9e2af', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'ðŸ”§ Fix Expected Hours'),
          h('button', { onClick:function(){
            if (!confirm('Delete status with sort_order=5 and migrate orders to sort_order=3?')) return;
            apiFetch('admin/fix-status-5', {method:'POST'})
              .then(function(r){ alert('âœ… Done!\nDeleted: '+r.deleted_slug+'\nMigrated to: '+r.migrated_to+'\nOrders updated: '+r.orders_updated); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#cba6f7', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'ðŸ”§ Fix Status 5')
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
  if (root) ReactDOM.render(h(App), root);
})();
