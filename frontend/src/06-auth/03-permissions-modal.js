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
