function AppInner(props) {
  var bs = props.bs;
  var i18n = useI18n(); var t = i18n.t;
  var authUser = props.authUser || {};
  var authPerms = props.authPerms || (bs.data && bs.data.user_permissions) || [];
  var isDeliveryOnly = authUser.role !== 'admin' && (function(){
    var perms = authPerms || [];
    var hasDelivery = perms.indexOf('delivery_orders.view') >= 0;
    var hasOther = ['orders.view','customers.view','products.view','kds.view','reports.view'].some(function(p){ return perms.indexOf(p) >= 0; });
    return hasDelivery && !hasOther;
  })();
  var _tab = useState(isDeliveryOnly ? 'delivery-orders' : 'dashboard'); var tab = _tab[0], setTab = _tab[1];
  var _showAvatar = useState(false); var showAvatar = _showAvatar[0], setShowAvatar = _showAvatar[1];
  var _q = useState(''); var searchQ = _q[0], setSearchQ = _q[1];
  var _meta = useState({subtitle:'',action:null}); var topbarMeta = _meta[0], setTopbarMeta = _meta[1];

  function setMeta(m) { setTopbarMeta(function(prev){ return Object.assign({},prev,m); }); }

  /* Page meta: title + search placeholder per tab */
  var PAGE_META = {
    'dashboard':       { title: t('dashboard'),        search: false },
    'orders':          { title: t('orders'),            placeholder: t('search')+'...' },
    'completed-orders':{ title: t('completed_orders'),  placeholder: t('search')+'...' },
    'customers':       { title: t('customers'),         placeholder: t('search')+'...' },
    'suppliers':       { title: t('suppliers'),         placeholder: t('search')+'...' },
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
    'settings':        { title: i18n.lang==='en' ? 'Settings' : 'الإعدادات', search: false },
    'ops-tasks':       { title: t('operations_tasks'),   search: false },
  };
  var meta = PAGE_META[tab] || { title: tab };
  var showTopSearch = meta.search !== false;
  var searchCtxValue = { q:searchQ, setQ:setSearchQ, placeholder: meta.placeholder||'' };

  /* clear search when tab changes */
  useEffect(function(){ setSearchQ(''); }, [tab]);

  /* show full loading screen only on first load (no data yet) */
  if (bs.loading && !bs.data) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner),t('loading_data'));
  if (bs.error && !bs.data)   return h('div',{style:{padding:40,color:T.red,textAlign:'center',fontSize:14}},'⚠️ '+bs.error);

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
          h('div', { style:{ fontWeight:700, fontSize:16, color:T.text } }, '🚚 '+t('delivery_orders')),
          h('button', { onClick:props.onLogout, style:{ background:'none', border:'1px solid '+T.border, borderRadius:T.radius, padding:'5px 12px', cursor:'pointer', fontSize:12, color:T.textMute } }, 'Logout')
        ),
        h(DeliveryOrdersView, { bootstrap:bs.data, onReload:bs.reload, onSilentReload:bs.silentReload, authUser:props.authUser, whatsappNotify:(props.branding&&props.branding.whatsapp_notify)||'' })
      )
    );
  }

  return h(TopbarCtx.Provider, { value:{ setMeta:setMeta } },
     h(SearchCtx.Provider, { value:searchCtxValue },
    h(AppLayout, null,
    h(Sidebar, { tab:tab, setTab:setTab, branding:props.branding, authUser:props.authUser, authPerms:authPerms, onLogout:props.onLogout }),
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
          h('button', { onClick:function(){ i18n.setLang(i18n.lang==='ar'?'en':'ar'); }, title:t('switch_lang'), style:{ padding:'5px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0 } },
            h('span',null,'\u25CC'), h('span',null, i18n.lang==='ar'?'EN':'AR')
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

