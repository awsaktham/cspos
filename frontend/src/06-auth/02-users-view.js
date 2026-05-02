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
