function SetupWizard(props) {
  var _step = useState(1); var step = _step[0], setStep = _step[1];
  var _name = useState(''); var sysName = _name[0], setSysName = _name[1];
  var _logo = useState(''); var logoB64 = _logo[0], setLogoB64 = _logo[1];
  var _prev = useState(''); var logoPrev = _prev[0], setLogoPrev = _prev[1];
  var _err  = useState(''); var nameErr = _err[0], setNameErr = _err[1];
  var _sav  = useState(false); var saving = _sav[0], setSaving = _sav[1];
  var fileRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    var r = new FileReader();
    r.onload = function(e) { setLogoB64(e.target.result); setLogoPrev(e.target.result); };
    r.readAsDataURL(f);
  }
  function next() {
    if (step === 1) {
      if (!sysName.trim()) { setNameErr(t('name_required')); return; }
      apiFetch('setup', { method:'POST', body:JSON.stringify({ system_name:sysName }) }).then(function(){ setStep(2); }).catch(function(){ setStep(2); });
    } else if (step === 2) {
      setSaving(true);
      apiFetch('setup', { method:'POST', body:JSON.stringify({ logo_base64:logoB64, mark_done:true }) }).then(function(){ setSaving(false); setStep(3); }).catch(function(){ setSaving(false); setStep(3); });
    } else {
      props.onComplete({ system_name:sysName, logo_base64:logoB64 });
    }
  }
  function skip() {
    apiFetch('setup', { method:'POST', body:JSON.stringify({ mark_done:true }) }).then(function(){
      props.onComplete({ system_name:sysName, logo_base64:'' });
    }).catch(function(){ props.onComplete({ system_name:sysName, logo_base64:'' }); });
  }

  var btnSt = { width:'100%', padding:'13px', borderRadius:10, border:'none', background:T.accent, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', marginTop:4 };

  var i18n_sw = useI18n(); var t = i18n_sw.t; var isRtl = i18n_sw.isRtl; var dir = isRtl ? 'rtl' : 'ltr';
  return h('div', { style:{ minHeight:'100vh', background:T.bgSub, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", direction:dir, padding:20 } },
    h('div', { style:{ position:'fixed', top:0, right:isRtl?0:undefined, left:isRtl?undefined:0, bottom:0, width:3, background:'linear-gradient(to bottom,#635bff,#0055d4,#09825d)' } }),
    h('div', { style:{ width:'100%', maxWidth:460 } },
      h('div', { style:{ textAlign:'center', marginBottom:28 } },
        h('div', { style:{ display:'inline-flex', width:48, height:48, borderRadius:12, background:T.accent, alignItems:'center', justifyContent:'center', marginBottom:10 } },
          h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none' },
            h('path', { d:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', stroke:'#fff', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' })
          )
        ),
        h('div', { style:{ fontSize:12, color:T.textMute, fontWeight:500 } }, t('setup_system'))
      ),
      h('div', { style:{ background:T.bg, border:'1px solid '+T.border, borderRadius:16, padding:'36px 40px', boxShadow:'0 4px 24px rgba(0,0,0,.06)' } },
        /* Progress steps */
        h('div', { style:{ display:'flex', marginBottom:32 } },
          [1,2,3].map(function(i, idx) {
            return h('div', { key:i, style:{ flex:1, display:'flex', alignItems:'center' } },
              h('div', { style:{ width:28, height:28, borderRadius:'50%', flexShrink:0, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', background:step >= i ? T.accent : T.bgSub, color:step >= i ? '#fff' : T.textMute, border:'2px solid '+(step >= i ? T.accent : T.border), transition:'all .3s' } }, step > i ? t('complete_btn') : i),
              idx < 2 && h('div', { style:{ flex:1, height:2, background:step > i ? T.accent : T.border, transition:'background .3s' } })
            );
          })
        ),
        /* Step 1 */
        step === 1 && h('div', null,
          h('h2', { style:{ margin:'0 0 6px', fontSize:22, fontWeight:700, color:T.text } }, t('system_name_title')),
          h('p', { style:{ margin:'0 0 24px', fontSize:14, color:T.textMute, lineHeight:1.7 } }, t('system_name_hint')),
          h('input', { value:sysName, autoFocus:true, onChange:function(e){ setSysName(e.target.value); setNameErr(''); }, onKeyDown:function(e){ if(e.key==='Enter') next(); }, placeholder:t('system_name_placeholder'), style:{ width:'100%', padding:'13px 16px', fontSize:15, color:T.text, border:'1.5px solid '+(nameErr?T.red:T.border), borderRadius:10, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fafbfc', marginBottom:4 } }),
          nameErr && h('div', { style:{ color:T.red, fontSize:12, marginBottom:8 } }, nameErr),
          h('button', { onClick:next, style:btnSt }, t('next'))
        ),
        /* Step 2 */
        step === 2 && h('div', null,
          h('h2', { style:{ margin:'0 0 6px', fontSize:22, fontWeight:700, color:T.text } }, t('logo_title')),
          h('p', { style:{ margin:'0 0 20px', fontSize:14, color:T.textMute, lineHeight:1.7 } }, t('logo_hint')),
          h('div', {
            onClick:function(){ if(fileRef.current) fileRef.current.click(); },
            onDrop:function(e){ e.preventDefault(); handleFile(e.dataTransfer.files[0]); },
            onDragOver:function(e){ e.preventDefault(); },
            style:{ border:'2px dashed '+T.borderDark, borderRadius:12, padding:'32px 20px', textAlign:'center', cursor:'pointer', marginBottom:16, background:logoPrev?'#fafbfc':T.bgSub }
          },
            logoPrev
              ? h('img', { src:logoPrev, style:{ maxHeight:90, maxWidth:'70%', objectFit:'contain', borderRadius:8 } })
              : h('div', null, h('div', { style:{ fontSize:36, marginBottom:8 } }, 'ðŸ–¼ï¸'), h('div', { style:{ color:T.textMid, fontSize:14, fontWeight:500 } }, t('drag_logo')), h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } }, t('logo_formats'))),
            h('input', { ref:fileRef, type:'file', accept:'image/*', style:{ display:'none' }, onChange:function(e){ handleFile(e.target.files[0]); } })
          ),
          h('div', { style:{ display:'flex', gap:10 } },
            h('button', { onClick:skip, style:{ flex:1, padding:'12px', borderRadius:10, border:'1px solid '+T.border, background:T.bg, color:T.textMute, fontSize:14, cursor:'pointer', fontFamily:'inherit' } }, t('skip')),
            h('button', { onClick:next, disabled:saving, style:Object.assign({}, btnSt, { flex:2, margin:0, opacity:saving?0.7:1 }) }, saving ? t('saving') : t('save_continue'))
          )
        ),
        /* Step 3 */
        step === 3 && h('div', { style:{ textAlign:'center', padding:'8px 0' } },
          h('div', { style:{ fontSize:56, marginBottom:16, animation:'csBounce .6s' } }, 'ðŸŽ‰'),
          h('h2', { style:{ margin:'0 0 8px', fontSize:22, fontWeight:700, color:T.text } }, t('setup_done')),
          h('p', { style:{ color:T.textMute, fontSize:14, margin:'0 0 4px' } }, t('setup_success')),
          h('p', { style:{ color:T.accent, fontSize:18, fontWeight:700, margin:'0 0 20px' } }, sysName),
          logoPrev && h('img', { src:logoPrev, style:{ maxHeight:52, maxWidth:160, objectFit:'contain', margin:'0 auto 20px', display:'block', borderRadius:6 } }),
          h('button', { onClick:next, style:btnSt }, t('enter_system'))
        )
      )
    )
  );
}

/* â•â•â• SIDEBAR â•â•â• */
var NAV = [
  {id:'dashboard',icon:'\u25A6',key:'dashboard'},
  {id:'orders',icon:'\u2630',key:'orders'},
  {id:'completed-orders',icon:'\u2713',key:'completed_orders'},
  {id:'kds',icon:'\u25A7',key:'kds'},
  null,
  {id:'customers',icon:'\u263A',key:'customers'},
  {id:'suppliers',icon:'\u2302',key:'suppliers'},
  {id:'products',icon:'\u25A3',key:'products'},
  {id:'steps',icon:'\u2699',key:'product_workflow'},
  null,
  /* â”€â”€ Tasks group â”€â”€ */
  {id:'_label_tasks',type:'label',key:'tasks_label'},
  {id:'ops-tasks',icon:'\u2692',key:'operations_tasks',indent:true},
  {id:'my-tasks',icon:'\u2690',key:'my_tasks',indent:true},
  {id:'external-tasks',icon:'\u21E2',key:'external_tasks',indent:true},
  {id:'delivery-orders',icon:'\u25B7',key:'delivery_orders',indent:true},
  {id:'notifications',icon:'\u25CE',key:'notifications'},
  null,
  {id:'employees',icon:'\u263B',key:'employees'},
  {id:'departments',icon:'\u25A4',key:'departments'},
  {id:'teams',icon:'\u25C8',key:'teams'},
  {id:'roles',icon:'\u25C6',key:'roles'},
  {id:'statuses',icon:'\u25CF',key:'statuses'},
  null,
  {id:'users',icon:'\u263C',key:'users_mgmt',role:'admin'},
  {id:'settings',icon:'\u2699',key:'settings',role:'admin'},
];

var NAV_PERMISSIONS = {
  orders: 'orders.view',
  'completed-orders': 'orders.view',
  kds: 'kds.view',
  customers: 'customers.view',
  suppliers: 'products.view',
  products: 'products.view',
  steps: 'products.view',
  'ops-tasks': 'reports.view',
  'my-tasks': 'orders.view',
  'external-tasks': 'orders.view',
  'delivery-orders': 'delivery_orders.view',
  notifications: 'reports.view',
  employees: 'employees.view',
  departments: 'employees.view',
  teams: 'employees.view',
  roles: 'employees.view',
  statuses: 'orders.view'
};

function Sidebar(props) {
  var _c = useState(false); var col = _c[0], setCol = _c[1];
  var i18n = useI18n(); var t = i18n.t, lang = i18n.lang, setLang = i18n.setLang, isRtl = i18n.isRtl;
  var name = (props.branding && props.branding.system_name) || 'Production';
  var logo = props.branding && (props.branding.logo_base64 || props.branding.logo_url);
  var authUser = props.authUser || {};
  var authPerms = props.authPerms || [];

  function canAccess(item) {
    if (!item || item.type === 'label') return true;
    if (authUser.role === 'admin') return true;
    if (item.role) {
      return String(authUser.role || '').replace(/['"]/g,'').trim().toLowerCase() === item.role.toLowerCase();
    }
    var needed = NAV_PERMISSIONS[item.id];
    if (!needed) return true;
    return authPerms.indexOf(needed) >= 0;
  }

  return h('nav', { style:{ width:col?56:220, background:T.sidebar, height:'100vh', position:'sticky', top:0, display:'flex', flexDirection:'column', flexShrink:0, transition:'width .2s', borderLeft:isRtl?'1px solid rgba(255,255,255,.06)':'none', borderRight:isRtl?'none':'1px solid rgba(255,255,255,.06)', overflowX:'hidden', overflowY:'hidden' } },
    h('div', { onClick:function(){ setCol(function(c){ return !c; }); }, style:{ padding:col?'14px 0':'14px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.06)', justifyContent:col?'center':'flex-start', minHeight:56, flexShrink:0 } },
      logo
        ? h('img', { src:logo, style:{ width:28, height:28, objectFit:'contain', borderRadius:5, flexShrink:0 } })
        : h('div', { style:{ width:28, height:28, borderRadius:7, background:T.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13, flexShrink:0 } }, name[0] ? name[0].toUpperCase() : 'P'),
      !col && h('div', { style:{ overflow:'hidden', flex:1 } },
        h('div', { style:{ color:'#f0f6fc', fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, name),
        h('div', { style:{ color:T.sidebarMut, fontSize:10, marginTop:1 } }, t('production_system'))
      )
    ),
    h('div', { style:{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0', display:'flex', flexDirection:'column' } },
      NAV.map(function(item, i) {
        if (!item) return h('div', { key:'d'+i, style:{ height:1, background:'rgba(255,255,255,.04)', margin:'5px 0' } });
        if (item.type === 'label') {
          if (col) return null;
          return h('div', { key:item.id, style:{ padding:'8px 16px 2px', fontSize:10, fontWeight:700, color:T.sidebarMut, textTransform:'uppercase', letterSpacing:1 } }, t(item.key));
        }
        if (!canAccess(item)) {
          return null;
        }
        var active = props.tab === item.id;
        var indentPad = item.indent && !col ? '8px 16px 8px 28px' : (col ? '9px 0' : '9px 16px');
        return h('button', {
          key:item.id, onClick:function(){ props.setTab(item.id); }, title:col?t(item.key):undefined,
          style:{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:indentPad, justifyContent:col?'center':'flex-start', border:'none', cursor:'pointer', position:'relative', background:active?'rgba(99,91,255,.25)':'transparent', color:active?'#ffffff':T.sidebarTxt, fontSize:item.indent?12:13, fontWeight:active?700:400, fontFamily:'inherit', transition:'color .15s,background .15s', borderLeft: isRtl&&active ? '3px solid '+T.accent : '3px solid transparent', borderRight: !isRtl&&active ? '3px solid '+T.accent : '3px solid transparent' },
          onMouseEnter:function(e){ if(!active){ e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='#f0f6fc'; } },
          onMouseLeave:function(e){ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.sidebarTxt; } },
        },
          h('span', { style:{ fontSize:item.indent?13:15, flexShrink:0, fontFamily:'monospace', opacity:active?1:0.7 } }, item.icon),
          !col && h('span', { style:{ whiteSpace:'nowrap' } }, t(item.key))
        );
      }),
      h('div', { style:{ flex:1 } })
    ),
    h('div', { style:{ flexShrink:0, height:4 } })
  );
}

/* â•â•â• DASHBOARD â•â•â• */
function DashboardView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders    = asArr(bs.orders);
  var customers = asArr(bs.customers);
  var employees = asArr(bs.employees);
  var allTasks  = asArr(bs['ops-tasks']);
  useTopbar(t('overview'), null);
  var _cmp = useState(false); var showCompare = _cmp[0], setShowCompare = _cmp[1];
  var _cmpPie = useState(false); var showComparePie = _cmpPie[0], setShowComparePie = _cmpPie[1];
  var _pdModal = useState(false); var showPartialModal = _pdModal[0]; var setShowPartialModal = _pdModal[1];

  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0);

  /* â”€â”€ Active orders classification â”€â”€ */
  var active         = orders.filter(function(o){ return !isDone(o); });
  var inProg         = active.filter(function(o){ return !orderAtDelivery(o) && !asArr(o.items).some(function(i){ return itemProductionDone(i)&&!itemDelivered(i); }); });
  var readyDel       = active.filter(function(o){ return orderAtDelivery(o); });
  function hasExplicitPartialDelivery(o){
    var items = asArr(o.items);
    if (items.length <= 1 || orderAtDelivery(o)) return false;
    return items.some(function(i){
      return !itemDelivered(i) && !!i.delivery_batch_id;
    });
  }
  var partialDel = active.filter(hasExplicitPartialDelivery);
  var urgentOrders   = active.filter(function(o){ return o.is_urgent==1; });

  /* â”€â”€ Time totals for active orders â”€â”€ */
  var nowMs = Date.now();
  var totalExpectedMins = 0;
  var totalActualMins   = 0;
  active.forEach(function(o){
    /* Expected: sum of expected_hours for non-delivery steps */
    asArr(o.items).forEach(function(item){
      asArr(item.steps).forEach(function(step){
        if (step.is_delivery == 1) return;
        totalExpectedMins += (parseFloat(step.expected_hours)||0) * 60;
      });
    });
    /* Actual: elapsed time on COMPLETED non-delivery steps only */
    if (!o.started_at) return;
    asArr(o.items).forEach(function(item){
      asArr(item.steps).forEach(function(step){
        if (step.is_delivery == 1) return;
        if (step.status_slug !== 'done' && step.status_slug !== 'completed') return;
        if (!step.started_at || !step.completed_at) return;
        var stepStart = new Date(step.started_at.replace(' ','T')).getTime();
        var stepEnd   = new Date(step.completed_at.replace(' ','T')).getTime();
        var activeMs  = Math.max(0, stepEnd - stepStart);
        var pausedMs  = (parseInt(step.paused_seconds)||0) * 1000;
        totalActualMins += Math.max(0, activeMs - pausedMs) / 60000;
      });
    });
  });
  totalExpectedMins = Math.round(totalExpectedMins);
  totalActualMins   = Math.round(totalActualMins);
  var totalDiffMins = totalActualMins - totalExpectedMins;
  var totalTimeStatus = totalExpectedMins > 0
    ? (totalDiffMins <= 0 ? (totalDiffMins < -5 ? 'ahead' : 'on_time') : 'late')
    : null;
  var monthOrders = orders.filter(function(o){
    var d = new Date((o.started_at||o.created_at||'').replace(' ','T'));
    return d >= monthStart && d <= monthEnd;
  });

  /* â”€â”€ Active / Inactive clients this month â”€â”€ */
  var activeClientIds = {};
  monthOrders.forEach(function(o){ if(o.customer_id) activeClientIds[o.customer_id]=1; });
  var activeClients   = customers.filter(function(c){ return activeClientIds[c.id]; });
  var inactiveClients = customers.filter(function(c){ return !activeClientIds[c.id]; });

  /* â”€â”€ Tasks this month â”€â”€ */
  var monthTasks = allTasks.filter(function(task){
    var d = new Date((task.created_at||'').replace(' ','T'));
    return d >= monthStart;
  });

  /* â”€â”€ Top 3 clients by order count THIS MONTH â”€â”€ */
  var custOrderCount = {};
  monthOrders.forEach(function(o){ if(o.customer_id) custOrderCount[String(o.customer_id)]=(custOrderCount[String(o.customer_id)]||0)+1; });
  var topClients = customers.filter(function(c){ return custOrderCount[String(c.id)]; }).sort(function(a,b){
    return (custOrderCount[String(b.id)]||0)-(custOrderCount[String(a.id)]||0);
  }).slice(0,3);
  var maxCount = topClients.length ? (custOrderCount[String(topClients[0].id)]||1) : 1;

  /* â”€â”€ Monthly orders for year chart â”€â”€ */
  var monthlyOrders = [];
  var monthlyOrdersPrev = [];
  for(var m=0;m<12;m++){
    var ms = new Date(now.getFullYear(),m,1);
    var me = new Date(now.getFullYear(),m+1,0);
    var msPrev = new Date(now.getFullYear()-1,m,1);
    var mePrev = new Date(now.getFullYear()-1,m+1,0);
    var cnt = orders.filter(function(o){
      var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
      return d>=ms&&d<=me;
    }).length;
    var cntPrev = orders.filter(function(o){
      var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
      return d>=msPrev&&d<=mePrev;
    }).length;
    var arMonths=['ÙƒØ§Ù†ÙˆÙ†Ø«','Ø´Ø¨Ø§Ø·','Ø¢Ø°Ø§Ø±','Ù†ÙŠØ³Ø§Ù†','Ø¢ÙŠØ§Ø±','Ø­Ø²ÙŠØ±Ø§Ù†','ØªÙ…ÙˆØ²','Ø¢Ø¨','Ø£ÙŠÙ„ÙˆÙ„','ØªØ´Ø±ÙŠÙ†Ø£','ØªØ´Ø±ÙŠÙ†Ø«','ÙƒØ§Ù†ÙˆÙ†Ø£'];
    var enMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var monthLabel = lang==='en' ? enMonths[m] : arMonths[m];
    monthlyOrders.push({month:monthLabel, count:cnt});
    monthlyOrdersPrev.push({month:monthLabel, count:cntPrev});
  }
  var maxMonthly = Math.max.apply(null,
    monthlyOrders.map(function(m){return m.count;}).concat(monthlyOrdersPrev.map(function(m){return m.count;}))
  ) || 1;

  /* â”€â”€ Employee of Month â€” points system â”€â”€ */
  var empPoints = {};
  var empOnTime = {};
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if ((s.status_slug==='done'||s.status_slug==='completed') && s.completed_at) {
          var compDate = new Date(s.completed_at.replace(' ','T'));
          if (compDate < monthStart) return;
          var ids = [];
          try { ids = typeof s.assigned_employee_ids==='string'?JSON.parse(s.assigned_employee_ids||'[]'):(s.assigned_employee_ids||[]); } catch(e){}
          if (s.assigned_employee_id) ids = ids.concat([s.assigned_employee_id]);
          ids.forEach(function(eid){
            var key=String(eid);
            if(!empPoints[key]) empPoints[key]=0;
            if(!empOnTime[key]) empOnTime[key]=0;
            /* Points logic */
            var points = 10; // on time default
            var isLate = false;
            if (s.expected_end && s.completed_at) {
              var exp = new Date(s.expected_end.replace(' ','T'));
              var comp = new Date(s.completed_at.replace(' ','T'));
              if (comp > exp) { points = -5; isLate = true; }
              else if (exp - comp > 3600000) points = 15;
            }
            empPoints[key] += points;
            if (!isLate) empOnTime[key]++;
          });
        }
      });
    });
  });
  var eomId = null, eomPts = -9999, eomOnTime = -1;
  Object.keys(empPoints).forEach(function(id){
    var pts = empPoints[id];
    var onTime = empOnTime[id] || 0;
    if (pts > eomPts || (pts === eomPts && onTime > eomOnTime)) {
      eomPts = pts; eomId = id; eomOnTime = onTime;
    }
  });
  var eomEmp = eomId ? findBy(employees,'id',parseInt(eomId)) : null;
  var arMonthsFull=['\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u062b\u0627\u0646\u064a','\u0634\u0628\u0627\u0637','\u0622\u0630\u0627\u0631','\u0646\u064a\u0633\u0627\u0646','\u0622\u064a\u0627\u0631','\u062d\u0632\u064a\u0631\u0627\u0646','\u062a\u0645\u0648\u0632','\u0622\u0628','\u0623\u064a\u0644\u0648\u0644','\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u0623\u0648\u0644','\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u062b\u0627\u0646\u064a','\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u0623\u0648\u0644'];
  var monthName = lang==='en'
    ? now.toLocaleString('en-US',{month:'long',year:'numeric'})
    : arMonthsFull[now.getMonth()] + ' ' + now.getFullYear();

  /* â”€â”€ Stat card component â”€â”€ */
  function BigStat(p){
    var colors = {blue:{bg:'#eff6ff',text:'#1d4ed8',border:'#bfdbfe'},green:{bg:'#f0fdf4',text:'#15803d',border:'#bbf7d0'},red:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},amber:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},purple:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'}};
    var c = colors[p.color]||colors.blue;
    var clickable = !!p.onClick;
    return h('div',{
      onClick: p.onClick || undefined,
      style:{
        background:c.bg,border:'1px solid '+c.border,borderRadius:T.radiusLg,
        padding:'16px 18px',display:'flex',flexDirection:'column',gap:4,
        cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'transform .12s,box-shadow .12s' : undefined,
        boxShadow: clickable ? T.shadow : undefined
      },
      onMouseEnter: clickable ? function(e){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'; } : undefined,
      onMouseLeave: clickable ? function(e){ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=T.shadow; } : undefined
    },
      h('div',{style:{fontSize:20}},p.icon),
      h('div',{style:{fontSize:28,fontWeight:800,color:c.text,lineHeight:1}},p.value),
      h('div',{style:{fontSize:12,fontWeight:600,color:c.text,opacity:.8}},p.label),
      clickable && h('div',{style:{fontSize:10,color:c.text,opacity:.5,marginTop:2}},lang==='en'?'Click to view':'Ø§Ø¶ØºØ· Ù„Ù„Ø¹Ø±Ø¶')
    );
  }

  return h('div',{style:{padding:'0 2px'}},

    /* ROW 1 â€” 4 status cards */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(BigStat,{icon:'âš™ï¸',label:lang==='en'?'In Progress':'Ù‚ÙŠØ¯ Ø§Ù„Ø¥Ù†ØªØ§Ø¬',value:inProg.length,color:'blue'}),
      h(BigStat,{icon:'ðŸšš',label:lang==='en'?'Ready to Deliver':'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙˆØµÙŠÙ„',value:readyDel.length,color:'green'}),
      h(BigStat,{icon:'ðŸ“¦',label:lang==='en'?'Partial Delivery':'ØªÙˆØµÙŠÙ„ Ø¬Ø²Ø¦ÙŠ',value:partialDel.length,color:'amber',onClick:partialDel.length>0?function(){ setShowPartialModal(true); }:undefined}),
      h(BigStat,{icon:'ðŸ”´',label:lang==='en'?'Urgent':'Ø¹Ø§Ø¬Ù„',value:urgentOrders.length,color:'red'})
    ),

    /* TIME SUMMARY â€” active orders production time */
    h(Card,{style:{padding:'14px 18px',marginBottom:14}},
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
          'â± '+(lang==='en'?'Production Time â€” Active Orders':'ÙˆÙ‚Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬ â€” Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©')
        ),
        active.length > 0 && h('span',{style:{fontSize:11,color:T.textMute}},
          active.length+(lang==='en'?' active orders':' Ø·Ù„Ø¨ Ù†Ø´Ø·')
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},
        /* Expected */
        h('div',{style:{background:'#eff6ff',borderRadius:T.radius,padding:'10px 14px',border:'1px solid #bfdbfe'}},
          h('div',{style:{fontSize:11,color:'#1d4ed8',fontWeight:600,marginBottom:4}},
            lang==='en'?'â± Total Expected':'â± Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,color:'#1d4ed8'}},
            totalExpectedMins > 0 ? fmtMin(totalExpectedMins) : 'â€”'
          )
        ),
        /* Actual */
        h('div',{style:{
          background: totalTimeStatus==='late'?'#fef2f2': totalTimeStatus==='ahead'?'#f0fdf4':'#f8fafc',
          borderRadius:T.radius,padding:'10px 14px',
          border:'1px solid '+(totalTimeStatus==='late'?'#fecaca':totalTimeStatus==='ahead'?'#bbf7d0':'#e2e8f0')
        }},
          h('div',{style:{fontSize:11,fontWeight:600,marginBottom:4,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            lang==='en'?'â³ Total Actual':'â³ Ø§Ù„ÙØ¹Ù„ÙŠ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalActualMins > 0 ? fmtMin(totalActualMins) : 'â€”'
          )
        ),
        /* Diff */
        h('div',{style:{
          background: totalTimeStatus==='late'?'#fef2f2': totalTimeStatus==='ahead'?'#f0fdf4':'#f8fafc',
          borderRadius:T.radius,padding:'10px 14px',
          border:'1px solid '+(totalTimeStatus==='late'?'#fecaca':totalTimeStatus==='ahead'?'#bbf7d0':'#e2e8f0')
        }},
          h('div',{style:{fontSize:11,fontWeight:600,marginBottom:4,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalTimeStatus==='late'
              ? (lang==='en'?'ðŸ”´ Behind':'ðŸ”´ Ù…ØªØ£Ø®Ø±')
              : totalTimeStatus==='ahead'
              ? (lang==='en'?'ðŸŸ¢ Ahead':'ðŸŸ¢ Ø£Ø³Ø±Ø¹')
              : (lang==='en'?'âšª On Track':'âšª ÙÙŠ Ø§Ù„ÙˆÙ‚Øª')
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalExpectedMins > 0 && totalActualMins > 0
              ? (totalDiffMins > 0 ? '+' : '') + fmtMin(Math.abs(totalDiffMins))
              : 'â€”'
          )
        )
      )
    ),

    /* ROW 2 â€” 4 month stats */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Active Clients':'Ø¹Ù…Ù„Ø§Ø¡ Ù†Ø´Ø·ÙˆÙ†'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.green}},activeClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Inactive Clients':'Ø¹Ù…Ù„Ø§Ø¡ ØºÙŠØ± Ù†Ø´Ø·ÙŠÙ†'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.red}},inactiveClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Tasks This Month':'Ù…Ù‡Ø§Ù… Ø§Ù„Ø´Ù‡Ø±'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.accent}},monthTasks.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},monthName)
      ),
      /* Employee of Month â€” square full bleed avatar */
      h('div',{style:{
        borderRadius:T.radiusLg,
        overflow:'hidden',
        position:'relative',
        aspectRatio:'1/1',
        background: eomEmp && (eomEmp.avatar_url||eomEmp.avatar)
          ? 'url('+(eomEmp.avatar_url||eomEmp.avatar)+') center/cover no-repeat'
          : 'linear-gradient(135deg,#f59e0b,#d97706)',
        boxShadow:'0 2px 8px rgba(0,0,0,.15)'
      }},
        /* dark overlay */
        h('div',{style:{
          position:'absolute',inset:0,
          background:'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.2) 60%, transparent 100%)'
        }}),
        /* badge top */
        h('div',{style:{
          position:'absolute',top:10,right:10,
          background:'#f59e0b',color:'#fff',
          borderRadius:99,padding:'3px 10px',
          fontSize:10,fontWeight:800,
          letterSpacing:.5,
          boxShadow:'0 2px 6px rgba(245,158,11,.5)'
        }},lang==='en'?'ðŸ† OF THE MONTH':'ðŸ† Ù…ÙˆØ¸Ù Ø§Ù„Ø´Ù‡Ø±'),
        /* content bottom */
        h('div',{style:{
          position:'relative',
          padding:'64px 14px 14px',
          display:'flex',flexDirection:'column'
        }},
          eomEmp
            ? h('div',null,
                /* If no avatar show initials big */
                !(eomEmp.avatar_url||eomEmp.avatar) && h('div',{style:{
                  fontSize:40,fontWeight:800,color:'rgba(255,255,255,.3)',
                  position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
                  fontFamily:'system-ui'
                }},((eomEmp.name||'?')[0]||'?').toUpperCase()),
                h('div',{style:{fontWeight:800,fontSize:15,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.5)'}},(lang==='en'&&eomEmp.name_en)?eomEmp.name_en:eomEmp.name),
                h('div',{style:{
                  display:'inline-flex',alignItems:'center',gap:4,
                  background:'rgba(255,255,255,.2)',
                  backdropFilter:'blur(4px)',
                  color:'#fef9c3',borderRadius:99,
                  padding:'2px 10px',fontSize:11,fontWeight:700,marginTop:4
                }},'â­ '+eomPts+' '+(lang==='en'?'pts':'Ù†Ù‚Ø·Ø©'))
              )
            : h('div',{style:{fontSize:12,color:'rgba(255,255,255,.7)',paddingTop:20}},
                lang==='en'?'No data yet':'Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯')
        )
      )
    ),

    /* ROW 3 â€” Top clients + Annual chart + Pie chart */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},

      /* Top 3 clients */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text,marginBottom:2}},lang==='en'?'ðŸ… Top Clients':'ðŸ… Ø£ÙØ¶Ù„ Ø§Ù„Ø²Ø¨Ø§Ø¦Ù†'),
        h('div',{style:{fontSize:11,color:T.textMute,marginBottom:12}},monthName),
        topClients.length===0
          ? h('div',{style:{color:T.textMute,fontSize:12}},lang==='en'?'No data':'Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª')
          : topClients.map(function(c,i){
              var cnt = custOrderCount[String(c.id)]||0;
              var pct = Math.round((cnt/maxCount)*100);
              var medals = ['ðŸ¥‡','ðŸ¥ˆ','ðŸ¥‰'];
              var name = c.company_name_en||c.company_name||c.name_en||c.name||'â€”';
              return h('div',{key:c.id,style:{marginBottom:i<topClients.length-1?12:0}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                    h('span',{style:{fontSize:14}},medals[i]),
                    h('span',{style:{fontSize:13,fontWeight:600,color:T.text}},name)
                  ),
                  h('span',{style:{fontSize:12,color:T.textMute,fontWeight:600}},cnt+' '+(lang==='en'?'orders':'Ø·Ù„Ø¨'))
                ),
                h('div',{style:{background:T.bgSub,borderRadius:99,height:6,overflow:'hidden'}},
                  h('div',{style:{width:pct+'%',height:'100%',borderRadius:99,background:i===0?'#f59e0b':i===1?'#9ca3af':'#cd7c32',transition:'width .5s'}})
                )
              );
            })
      ),

      /* Annual orders chart */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
            lang==='en'?'ðŸ“Š Orders This Year':'ðŸ“Š Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ø¹Ø§Ù…'
          ),
          h('button',{
            onClick:function(){ setShowCompare(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showCompare?T.accent:T.border),background:showCompare?T.accentDim:'transparent',color:showCompare?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'Ù…Ù‚Ø§Ø±Ù†Ø© '+(now.getFullYear()-1))
        ),
        /* Legend if compare */
        showCompare && h('div',{style:{display:'flex',gap:12,marginBottom:8}},
          h('div',{style:{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.textMute}},
            h('div',{style:{width:10,height:10,borderRadius:2,background:T.accent}}),
            String(now.getFullYear())
          ),
          h('div',{style:{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.textMute}},
            h('div',{style:{width:10,height:10,borderRadius:2,background:'#d1d5db'}}),
            String(now.getFullYear()-1)
          )
        ),
        h('div',{style:{display:'flex',alignItems:'flex-end',gap:showCompare?2:4,height:100}},
          monthlyOrders.map(function(m,i){
            var pct     = Math.round((m.count/maxMonthly)*100);
            var pctPrev = Math.round((monthlyOrdersPrev[i].count/maxMonthly)*100);
            var isNow   = i===now.getMonth();
            return h('div',{key:i,style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}},
              h('div',{style:{width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:1,height:80}},
                /* Current year bar */
                h('div',{style:{
                  flex:1, height:Math.max(pct||1,2)+'%', minHeight:2,
                  background:isNow?T.accent:'#bfdbfe',
                  borderRadius:'3px 3px 0 0',
                  position:'relative',
                  display:'flex',alignItems:'flex-start',justifyContent:'center'
                }},
                  m.count>0 && h('span',{style:{
                    fontSize:8,fontWeight:700,
                    color:isNow?T.accent:'#6b7280',
                    position:'absolute',top:-13,
                    whiteSpace:'nowrap'
                  }},m.count)
                ),
                /* Previous year bar (if compare on) */
                showCompare && h('div',{style:{
                  flex:1, height:Math.max(pctPrev||1,2)+'%', minHeight:2,
                  background:'#d1d5db',
                  borderRadius:'3px 3px 0 0',
                  position:'relative'
                }})
              ),
              h('div',{style:{fontSize:8,color:isNow?T.accent:T.textMute,fontWeight:isNow?700:400,whiteSpace:'nowrap'}},m.month)
            );
          })
        )
      ),

      /* Pie chart â€” top clients this year */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
            lang==='en'?'ðŸ¥§ Clients Share (Year)':'ðŸ¥§ Ø­ØµØ© Ø§Ù„Ø²Ø¨Ø§Ø¦Ù† (Ø§Ù„Ø³Ù†Ø©)'
          ),
          h('button',{
            onClick:function(){ setShowComparePie(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showComparePie?T.accent:T.border),background:showComparePie?T.accentDim:'transparent',color:showComparePie?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'Ù…Ù‚Ø§Ø±Ù†Ø© '+(now.getFullYear()-1))
        ),
        (function(){
          /* Build year orders per customer â€” current or previous year */
          var yr = showComparePie ? now.getFullYear()-1 : now.getFullYear();
          var yearStart = new Date(yr,0,1);
          var yearEnd   = new Date(yr,11,31);
          var custYear = {};
          orders.forEach(function(o){
            var d=new Date((o.started_at||o.created_at||'').replace(' ','T'));
            if(d < yearStart || d > yearEnd) return;
            var key = String(o.customer_id||'unknown');
            custYear[key] = (custYear[key]||0)+1;
          });
          var total = Object.values(custYear).reduce(function(a,b){return a+b;},0);
          if(!total) return h('div',{style:{color:T.textMute,fontSize:12,textAlign:'center',padding:'20px 0'}},lang==='en'?'No data':'Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª');

          /* Sort and take top 5 + others */
          var sorted = Object.keys(custYear).sort(function(a,b){return custYear[b]-custYear[a];});
          var pieColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#6b7280'];
          var slices = sorted.slice(0,5).map(function(id,i){
            var c = findBy(customers,'id',parseInt(id));
            var name = c ? (c.company_name_en||c.company_name||c.name_en||c.name||'â€”') : (lang==='en'?'Unknown':'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ');
            return {name:name, count:custYear[id], color:pieColors[i]};
          });
          if(sorted.length > 5){
            var otherCount = sorted.slice(5).reduce(function(a,id){return a+custYear[id];},0);
            slices.push({name:lang==='en'?'Others':'Ø£Ø®Ø±Ù‰', count:otherCount, color:pieColors[5]});
          }

          /* Draw SVG pie */
          var cx=70,cy=70,r=60;
          var paths=[];
          var angle=0;
          slices.forEach(function(s,i){
            var pct = s.count/total;
            var sweep = pct*2*Math.PI;
            var x1=cx+r*Math.sin(angle), y1=cy-r*Math.cos(angle);
            var x2=cx+r*Math.sin(angle+sweep), y2=cy-r*Math.cos(angle+sweep);
            var large = sweep>Math.PI?1:0;
            paths.push(h('path',{key:i,
              d:'M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+large+',1 '+x2+','+y2+' Z',
              fill:s.color,stroke:'#fff',strokeWidth:2
            }));
            angle += sweep;
          });

          return h('div',null,
            h('div',{style:{display:'flex',justifyContent:'center',marginBottom:10}},
              h('svg',{width:140,height:140,viewBox:'0 0 140 140',xmlns:'http://www.w3.org/2000/svg'},paths)
            ),
            h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
              slices.map(function(s,i){
                var pct = Math.round((s.count/total)*100);
                return h('div',{key:i,style:{display:'flex',alignItems:'center',gap:6}},
                  h('div',{style:{width:10,height:10,borderRadius:2,background:s.color,flexShrink:0}}),
                  h('div',{style:{fontSize:11,color:T.textMid,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},s.name),
                  h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,flexShrink:0}},pct+'%')
                );
              })
            )
          );
        })()
      )
    ),

  /* â”€â”€ Partial Delivery Modal â”€â”€ */
  showPartialModal && h(Modal,{
    title: lang==='en' ? 'ðŸ“¦ Partial Delivery Orders' : 'ðŸ“¦ Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„ Ø§Ù„Ø¬Ø²Ø¦ÙŠ',
    onClose: function(){ setShowPartialModal(false); },
    footer: h(Btn,{variant:'secondary',onClick:function(){ setShowPartialModal(false); }},t('cancel'))
  },
    partialDel.length === 0
      ? h('div',{style:{color:'#7a8694',textAlign:'center',padding:'20px 0',fontSize:13}},t('no_data'))
      : h('div',{style:{display:'flex',flexDirection:'column',gap:10,maxHeight:480,overflowY:'auto',paddingRight:2}},
          partialDel.map(function(order){
            var readyItems = asArr(order.items).filter(function(i){ return !!i.delivery_batch_id && !itemDelivered(i); });
            var totalItems = asArr(order.items).length;
            var custName = getCust(order, lang);
            var recip = getRec(order);
            return h('div',{key:order.id,style:{
              border:'1px solid #fde68a',
              borderRadius:'12px',
              padding:'12px 14px',
              background:'#fffbeb'
            }},
              h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
                h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                  h('span',{style:{fontWeight:700,fontSize:13,color:'#0d1117'}},'#'+(order.order_number||order.id)),
                  h('span',{style:{fontSize:11,background:'#fef3c7',color:'#b45309',borderRadius:99,padding:'2px 8px',fontWeight:600}},
                    lang==='en'?'Partial':'Ø¬Ø²Ø¦ÙŠ'
                  )
                ),
                order.is_urgent==1 && h('span',{style:{fontSize:11,background:'#fee2e2',color:'#b91c1c',borderRadius:99,padding:'2px 8px',fontWeight:600}},'ðŸ”´ '+(lang==='en'?'Urgent':'Ø¹Ø§Ø¬Ù„'))
              ),
              h('div',{style:{fontSize:12,color:'#424d57',marginBottom:8,display:'flex',gap:16,flexWrap:'wrap'}},
                custName!=='â€”' && h('span',null,'ðŸ‘¤ '+custName),
                recip!=='â€”'   && h('span',null,'ðŸ“ '+recip)
              ),
              h('div',{style:{fontSize:11,color:'#92400e',marginBottom:6,fontWeight:600}},
                (lang==='en'?'Ready items: ':'Ø§Ù„Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø¬Ø§Ù‡Ø²Ø©: ')+readyItems.length+' / '+totalItems
              ),
              h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
                readyItems.map(function(item){
                  return h('div',{key:item.id,style:{
                    display:'flex',alignItems:'center',gap:8,
                    background:'#fff',borderRadius:6,
                    padding:'6px 10px',
                    border:'1px solid #fde68a'
                  }},
                    h('span',{style:{fontSize:12,flex:1,color:'#0d1117',fontWeight:500}},
                      (lang==='en'&&item.product_name_en ? item.product_name_en : item.product_name)||'â€”'
                    ),
                    item.quantity && h('span',{style:{fontSize:11,color:'#7a8694'}},
                      (lang==='en'?'Qty: ':'Ø§Ù„ÙƒÙ…ÙŠØ©: ')+item.quantity
                    ),
                    h('span',{style:{fontSize:11,background:'#d1fae5',color:'#065f46',borderRadius:99,padding:'2px 7px',fontWeight:600}},
                      'âœ“ '+(lang==='en'?'Ready':'Ø¬Ø§Ù‡Ø²')
                    )
                  );
                })
              )
            );
          })
        )
  )

  );
}


/* â•â•â• PAUSE MODAL â€” 3 Ù…Ø±Ø§Ø­Ù„: ÙØ¦Ø© â† Ù…Ø§ÙƒÙŠÙ†Ø© â† Ø³Ø¨Ø¨ â•â•â• */
function PauseModal(props) {
  /* props: pauseReasons[], stepLabel, onConfirm(reason,machine), onClose */
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var reasons = props.pauseReasons || [];

  var _phase = useState('category'); var phase = _phase[0], setPhase = _phase[1];
  var _cat   = useState(null);      var selCat = _cat[0],  setSelCat = _cat[1];
  var _mach  = useState(null);      var selMach = _mach[0], setSelMach = _mach[1];
  var _other = useState(false);     var isOther = _other[0], setIsOther = _other[1];
  var _otherTxt = useState('');     var otherTxt = _otherTxt[0], setOtherTxt = _otherTxt[1];

  /* â”€â”€ ÙØ¦Ø§Øª Ø«Ø§Ø¨ØªØ© â”€â”€ */
  var CATEGORIES = [
    {key:'print',   icon:'ðŸ–¨ï¸', ar:'Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',    en:'Printing Machines'},
    {key:'finish',  icon:'âœ‚ï¸', ar:'Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„ØªØ´Ø·ÙŠØ¨',    en:'Finishing Machines'},
    {key:'material',icon:'ðŸ“¦', ar:'Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ©',          en:'Raw Materials'},
    {key:'power',   icon:'âš¡', ar:'ÙƒÙ‡Ø±Ø¨Ø§Ø¡ / Ø´Ø¨ÙƒØ©',      en:'Power / Network'},
    {key:'ops',     icon:'ðŸ§‘', ar:'Ø£Ø³Ø¨Ø§Ø¨ ØªØ´ØºÙŠÙ„ÙŠØ©',      en:'Operational'},
    {key:'other',   icon:'ðŸ’¬', ar:'Ø£Ø®Ø±Ù‰',               en:'Other'},
  ];

  /* ØªØµÙ†ÙŠÙ Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø­Ø³Ø¨ Ø§Ù„ÙØ¦Ø© */
  var CAT_MACHINES = {
    print:   ['Xerox Versant 180','Canon C650i','Canon 5550i','Epson L805'],
    finish:  ['Flat Heat Press Freesub','3D Heat Press Freesub','Hat Heat Press Freesub',
               'Booklet Stapler Yale','Trimming Machine','Binding Machine',
               'Spiral Punching Machine','Rounded Corner Press','Circle Press 5x5','Cameo 3'],
    material:[],
    power:   ['UPS','Server Dell'],
    ops:     [],
  };

  /* ÙÙ„ØªØ±Ø© Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨ */
  function getReasonsForMachine(machine) {
    return reasons.filter(function(r){ return r.machine === machine; });
  }
  function getReasonsForCat(cat) {
    /* Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© ÙˆØªØ´ØºÙŠÙ„ÙŠØ© â€” Ø¨Ø¯ÙˆÙ† Ù…Ø§ÙƒÙŠÙ†Ø© */
    return reasons.filter(function(r){ return !r.machine || r.machine.trim()===''; });
  }

  /* Ù…Ø§ÙƒÙŠÙ†Ø§Øª Ø§Ù„ÙØ¦Ø© Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© Ø§Ù„Ù„ÙŠ Ø¹Ù†Ø¯Ù‡Ø§ Ø£Ø³Ø¨Ø§Ø¨ */
  var machines = selCat ? (CAT_MACHINES[selCat.key] || []).filter(function(m){
    return reasons.some(function(r){ return r.machine === m; });
  }) : [];

  /* Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø© */
  var filteredReasons = selMach
    ? getReasonsForMachine(selMach)
    : (selCat && (selCat.key==='material'||selCat.key==='ops'))
      ? getReasonsForCat(selCat.key)
      : [];

  var btnStyle = function(sel){ return {
    display:'flex', alignItems:'center', gap:10, width:'100%',
    padding:'11px 14px', borderRadius:T.radius, cursor:'pointer', textAlign:'right',
    border:'2px solid '+(sel?T.accent:T.border),
    background: sel?T.accentDim:T.bgSub,
    color: sel?T.accent:T.text,
    fontSize:13, fontWeight: sel?600:400, transition:'all .15s'
  }; };

  var backBtn = function(onClick){ return h('button',{onClick:onClick,style:{
    background:'transparent',border:'none',color:T.textMute,cursor:'pointer',
    fontSize:12,padding:'0 0 12px 0',display:'flex',alignItems:'center',gap:4
  }},'â† '+(lang==='en'?'Back':'Ø±Ø¬ÙˆØ¹')); };

  var title = phase==='category'
    ? (lang==='en'?'Select Category':'Ø§Ø®ØªØ± Ø§Ù„ÙØ¦Ø©')
    : phase==='machine'
      ? (lang==='en'?'Select Machine':'Ø§Ø®ØªØ± Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø©')
      : (lang==='en'?'Select Reason':'Ø§Ø®ØªØ± Ø§Ù„Ø³Ø¨Ø¨');

  return h('div', { style:{ position:'fixed', inset:0, background:'rgba(13,17,23,.65)', zIndex:99000,
    display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    onClick:function(e){ if(e.target===e.currentTarget) props.onClose(); }
  },
    h('div', { style:{ background:T.bg, border:'1px solid '+T.border, borderRadius:T.radiusLg,
      padding:24, width:'100%', maxWidth:460, boxShadow:'0 24px 48px rgba(0,0,0,.3)',
      maxHeight:'85vh', display:'flex', flexDirection:'column' }
    },
      /* Header */
      h('div', {style:{marginBottom:16}},
        h('div', {style:{fontWeight:700, fontSize:15, marginBottom:4}}, 'â¸ '+(lang==='en'?'Pause Step':'Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª Ù„Ù„Ø®Ø·ÙˆØ©')),
        props.stepLabel && h('div',{style:{fontSize:12,color:T.accent,fontWeight:600,padding:'3px 10px',
          background:T.accentDim,borderRadius:T.radius,display:'inline-block',marginBottom:6}}, props.stepLabel),
        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:8}},

          /* breadcrumb */
          h('span',{style:{color: phase==='category'?T.accent:T.textMute, fontWeight:600}}, lang==='en'?'Category':'Ø§Ù„ÙØ¦Ø©'),
          h('span',{style:{margin:'0 6px'}}, 'â€º'),
          h('span',{style:{color: phase==='machine'?T.accent:selMach?T.text:T.border, fontWeight: phase==='machine'?600:400}},
            selCat ? (lang==='en'?selCat.en:selCat.ar) : (lang==='en'?'Machine':'Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø©')
          ),
          h('span',{style:{margin:'0 6px'}}, 'â€º'),
          h('span',{style:{color: phase==='reason'?T.accent:T.border, fontWeight: phase==='reason'?600:400}},
            selMach || (lang==='en'?'Reason':'Ø§Ù„Ø³Ø¨Ø¨')
          )
        )
      ),

      /* Scrollable content */
      h('div', {style:{overflowY:'auto', flex:1}},

        /* â”€â”€ Phase 1: Category â”€â”€ */
        phase==='category' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          CATEGORIES.map(function(cat){
            /* Ø£Ø®Ø±Ù‰ Ø¯Ø§Ø¦Ù…Ø§Ù‹ ØªØ¸Ù‡Ø±ØŒ Ø¨Ù‚ÙŠØ© Ø§Ù„ÙØ¦Ø§Øª Ø¨Ø³ Ø¥Ø°Ø§ Ø¹Ù†Ø¯Ù‡Ø§ Ø£Ø³Ø¨Ø§Ø¨ */
            var hasReasons = cat.key==='other' ? true :
              cat.key==='material'||cat.key==='ops'
                ? reasons.some(function(r){ return !r.machine||r.machine.trim()===''; })
                : (CAT_MACHINES[cat.key]||[]).some(function(m){
                    return reasons.some(function(r){ return r.machine===m; });
                  });
            if (!hasReasons) return null;
            return h('button',{key:cat.key, onClick:function(){
              if (cat.key==='other') { setIsOther(true); setPhase('reason'); setSelCat(cat); return; }
              setSelCat(cat);
              /* Ø¥Ø°Ø§ Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© Ø£Ùˆ ØªØ´ØºÙŠÙ„ÙŠØ© â†’ ØªØ®Ø·Ù‰ Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ù…Ø§ÙƒÙŠÙ†Ø© */
              if (cat.key==='material'||cat.key==='ops') { setPhase('reason'); }
              else { setPhase('machine'); }
            }, style:btnStyle(false)},
              h('span',{style:{fontSize:18}}, cat.icon),
              h('span',null, lang==='en'?cat.en:cat.ar)
            );
          })
        ),

        /* â”€â”€ Phase 2: Machine â”€â”€ */
        phase==='machine' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){ setPhase('category'); setSelCat(null); }),
          machines.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No machines found':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø§ÙƒÙŠÙ†Ø§Øª')
            : machines.map(function(m){
                return h('button',{key:m, onClick:function(){ setSelMach(m); setPhase('reason'); },
                  style:btnStyle(false)},
                  h('span',{style:{fontSize:16}},'ðŸ”§'),
                  h('span',null, m)
                );
              })
        ),

        /* â”€â”€ Phase 3: Reason â”€â”€ */
        phase==='reason' && !isOther && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){
            if (selCat&&(selCat.key==='material'||selCat.key==='ops')){ setPhase('category'); setSelCat(null); }
            else { setPhase('machine'); setSelMach(null); }
          }),
          filteredReasons.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No reasons found':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø³Ø¨Ø§Ø¨ â€” Ø£Ø¶ÙÙ‡Ø§ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª')
            : filteredReasons.map(function(r,i){
                var label = (lang==='en'&&r.en)?r.en:r.ar;
                return h('button',{key:i, onClick:function(){
                  props.onConfirm(label, selMach||r.machine||'');
                }, style:btnStyle(false)},
                  h('span',null, label)
                );
              }),
          /* Ø£Ø®Ø±Ù‰ */
          h('button',{onClick:function(){ setIsOther(true); },style:btnStyle(false)},
            h('span',{style:{fontSize:16}},'ðŸ’¬'),
            h('span',{style:{color:T.textMute}}, lang==='en'?'Other...':'Ø£Ø®Ø±Ù‰...')
          )
        ),

        /* Other â€” free text */
        isOther && h('div',null,
          backBtn(function(){ setIsOther(false); setOtherTxt(''); }),
          h('textarea',{
            autoFocus:true, rows:4,
            style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,
              fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,
              boxSizing:'border-box',outline:'none'},
            placeholder: lang==='en'?'Enter reason...':'Ø§ÙƒØªØ¨ Ø§Ù„Ø³Ø¨Ø¨...',
            value: otherTxt,
            onChange:function(e){ setOtherTxt(e.target.value); }
          }),
          h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}},
            h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel')),
            h(Btn,{variant:'primary',disabled:!otherTxt.trim(),onClick:function(){
              props.onConfirm(otherTxt.trim(), selMach||'');
            }}, lang==='en'?'Pause':'Ø¥ÙŠÙ‚Ø§Ù')
          )
        )
      ),

      /* Footer â€” cancel only (confirm happens by clicking reason) */
      !isOther && h('div',{style:{marginTop:16,display:'flex',justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel'))
      )
    )
  );
}

/* â•â•â• ORDERS â•â•â• */
