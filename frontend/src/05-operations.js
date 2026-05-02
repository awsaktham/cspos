function SuppliersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('suppliers');
  var blank = {name:'',name_en:'',phone:'',phone_alt:'',map_url:'',notes:'',is_active:1};
  var _form = useState(null); var form = _form[0], setForm = _form[1];

  useTopbar(lang==='en'?'Suppliers':'المجهزون', h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+(lang==='en'?'Add':'إضافة')));

  function save() {
    var p = form.id ? crud.update(form.id, form) : crud.create(form);
    p.then(function(){ setForm(null); });
  }

  function setField(field) {
    return function(v){ setForm(function(f){ var u={}; u[field]=v; return Object.assign({},f,u); }); };
  }

  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'name', label:lang==='en'?'Name':'الاسم', render:function(r){
          return h('div',null,
            h('div',{style:{fontWeight:600}}, lang==='en'&&r.name_en ? r.name_en : r.name),
            r.name_en && lang==='ar' && h('div',{style:{fontSize:11,color:T.textMute}}, r.name_en)
          );
        }},
        {key:'phone', label:lang==='en'?'Phone':'الهاتف', render:function(r){
          return h('div',null,
            r.phone && h('a',{href:'tel:'+r.phone,style:{color:T.accent,fontSize:13,textDecoration:'none',display:'block'}}, '📞 '+r.phone),
            r.phone_alt && h('a',{href:'tel:'+r.phone_alt,style:{color:T.textMid,fontSize:12,textDecoration:'none',display:'block',marginTop:2}}, r.phone_alt)
          );
        }},
        {key:'map_url', label:lang==='en'?'Map':'الخريطة', render:function(r){
          return r.map_url
            ? h('a',{href:r.map_url,target:'_blank',rel:'noopener noreferrer',style:{color:T.accent,fontSize:12,textDecoration:'none'}}, '📍 '+(lang==='en'?'Open Map':'فتح الخريطة'))
            : h('span',{style:{color:T.border}}, '—');
        }},
        {key:'notes', label:lang==='en'?'Notes':'ملاحظات', render:function(r){
          return r.notes ? h('span',{style:{fontSize:12,color:T.textMid}}, r.notes) : '—';
        }},
        {key:'is_active', label:lang==='en'?'Status':'الحالة', render:function(r){
          return h(Badge,{label:r.is_active==1?(lang==='en'?'Active':'نشط'):(lang==='en'?'Inactive':'موقوف'),color:r.is_active==1?'green':'gray'});
        }},
      ],
      rows: crud.items,
      onEdit: function(r){ setForm(Object.assign({},blank,r)); },
      onDelete: function(r){ crud.remove(r.id); }
    }),
    form && h(Modal, {
      title: form.id ? (lang==='en'?'Edit Supplier':'تعديل مجهز') : (lang==='en'?'Add Supplier':'إضافة مجهز'),
      onClose: function(){ setForm(null); }, width:560,
      footer: h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}}, t('cancel')),
        h(Btn,{onClick:save}, t('save'))
      )
    },
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}},
        h(Input,{label:(lang==='en'?'Name':'الاسم')+' (AR)',value:form.name,onChange:setField('name')}),
        h(Input,{label:(lang==='en'?'Name':'الاسم')+' (EN)',value:form.name_en,onChange:setField('name_en')})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}},
        h(Input,{label:lang==='en'?'Phone':'الهاتف الرئيسي',value:form.phone,onChange:setField('phone')}),
        h(Input,{label:lang==='en'?'Alt Phone':'هاتف بديل',value:form.phone_alt,onChange:setField('phone_alt')})
      ),
      h(Input,{label:lang==='en'?'Google Maps URL':'رابط Google Maps',value:form.map_url,onChange:setField('map_url')}),
      h('div',{style:{marginTop:12,marginBottom:12}},
        h('textarea',{
          placeholder:lang==='en'?'Notes...':'ملاحظات...',
          value:form.notes||'',
          onChange:function(e){setField('notes')(e.target.value);},
          rows:3,
          style:{width:'100%',padding:'9px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bgSub,color:T.text,fontSize:13,resize:'vertical',outline:'none',boxSizing:'border-box'}
        })
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}},
        h('input',{type:'checkbox',checked:form.is_active==1,
          onChange:function(e){setField('is_active')(e.target.checked?1:0);},
          style:{accentColor:T.accent}
        }),
        lang==='en'?'Active':'نشط'
      )
    )
  );
}

function StepsDirectoryView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var suppliers = asArr(bs.suppliers);
  var crud = useCRUD('step-library');
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var blank = {step_name:'',step_name_en:'',default_employee_ids:[],default_team_id:'',show_in_prds:1,is_external:0,is_delivery:0,sort_order:0,supplier_id:''};

  function fmtMin(m) {
    if (!m || m==0) return '—';
    var mins = parseInt(m);
    if (mins < 60) return mins+' '+t('minutes');
    var h = Math.floor(mins/60); var rem = mins%60;
    return h+'h'+(rem?(' '+rem+'m'):'');
  }

  function save() {
    var payload = Object.assign({},form);
    // âœ… FIX: robust unwrap of employee IDs regardless of nesting level
    function unwrapEmpIds(raw) {
      if (!raw) return [];
      var decoded = raw;
      for (var i = 0; i < 10; i++) {
        if (typeof decoded !== 'string') break;
        try { decoded = JSON.parse(decoded); } catch(e) { break; }
      }
      if (!Array.isArray(decoded)) return [];
      var flat = [];
      function extract(v) {
        if (Array.isArray(v)) { v.forEach(extract); }
        else if (typeof v === 'string') {
          try { extract(JSON.parse(v)); } catch(e) { if (v && v !== 'null') flat.push(v); }
        } else if (v !== null && v !== undefined) { flat.push(String(v)); }
      }
      decoded.forEach(extract);
      return flat;
    }
    payload.default_employee_ids = unwrapEmpIds(payload.default_employee_ids);
    var p = payload.id ? crud.update(payload.id, payload) : crud.create(payload);
    p.then(function(){ setForm(null); if(props.onReload) props.onReload(); });
  }

  useTopbar(t('step_library'), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'step_name',label:t('step_name'),render:function(r){ return h('div',null,h('div',{style:{fontWeight:600}},lnStep(r,lang)),r.step_name_en&&lang==='ar'&&h('div',{style:{fontSize:11,color:T.textMute}},r.step_name_en)); }},
        {key:'default_employee_ids',label:t('employee'),render:function(r){ var ids=Array.isArray(r.default_employee_ids)?r.default_employee_ids:(r.default_employee_ids?JSON.parse(r.default_employee_ids||'[]'):[]); if(!ids.length) return '—'; return h('div',{style:{display:'flex',flexWrap:'wrap',gap:4}},ids.map(function(id){ var e=findBy(employees,'id',id); return e?h('span',{key:id,style:{fontSize:11,background:T.accentDim,color:T.accent,borderRadius:4,padding:'1px 6px'}},ln(e,lang)):null; })); }},
        {key:'show_in_prds',label:'KDS',render:function(r){ return h(Badge,{label:r.show_in_prds==1?t('yes'):t('no'),color:r.show_in_prds==1?'green':'gray'}); }},
        {key:'is_external',label:t('external_task'),render:function(r){ return r.is_external==1?h(Badge,{label:t('yes'),color:'amber'}):'—'; }},
        {key:'is_delivery',label:t('is_delivery'),render:function(r){ return r.is_delivery==1?h(Badge,{label:'🚚',color:'blue'}):'—'; }},
      ],
      rows:crud.items,
      onEdit:function(r){
        function unwrapEmpIds(raw) {
          if (!raw) return [];
          var decoded = raw;
          for (var i = 0; i < 10; i++) {
            if (typeof decoded !== 'string') break;
            try { decoded = JSON.parse(decoded); } catch(e) { break; }
          }
          if (!Array.isArray(decoded)) return [];
          var flat = [];
          function extract(v) {
            if (Array.isArray(v)) { v.forEach(extract); }
            else if (typeof v === 'string') {
              try { extract(JSON.parse(v)); } catch(e) { if (v && v !== 'null') flat.push(v); }
            } else if (v !== null && v !== undefined) { flat.push(String(v)); }
          }
          decoded.forEach(extract);
          return flat;
        }
        var empIds = unwrapEmpIds(r.default_employee_ids);
        setForm(Object.assign({},blank,r,{default_employee_ids:empIds}));
      },
      onDelete:function(r){ crud.remove(r.id).then(function(){ if(props.onReload) props.onReload(); }); }
    }),
    form && h(Modal,{title:form.id?t('edit'):t('add')+' '+t('step'),onClose:function(){setForm(null);},width:660,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      /* Row 1: bilingual name */
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('step_name')+' (AR)',value:form.step_name,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});}}),
        h(Input,{label:t('step_name')+' (EN)',value:form.step_name_en,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_name_en:v});})}})
      ),
      /* Row 2: team + multiselect side by side */
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12,marginTop:10}},
        h(Select,{label:t('team'),value:String(form.default_team_id||''),
          onChange:function(v){
            setForm(function(f){
              var teamEmps = v ? employees.filter(function(e){ return String(e.team_id)===String(v); }).map(function(e){ return String(e.id); }) : f.default_employee_ids;
              return Object.assign({},f,{default_team_id:v, default_employee_ids: v && teamEmps.length ? teamEmps : f.default_employee_ids});
            });
          },
          options:teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
        }),
        h(MultiSelect,{label:t('employees'),
          values:Array.isArray(form.default_employee_ids)?form.default_employee_ids:(form.default_employee_ids?[String(form.default_employee_ids)]:[]),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{default_employee_ids:v});});},
          options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
        })
      ),
      /* Row 3: checkboxes */
      h('div',{style:{display:'flex',gap:24,marginTop:14,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_external==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_external:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('external_task')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_delivery==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_delivery:e.target.checked?1:0});});},style:{accentColor:'#f59e0b'}}),h('span',{style:{color:'#f59e0b',fontWeight:600}},'🚚 '+t('is_delivery')))
      ),
      /* Row 4: supplier (only when is_external) */
      form.is_external==1 && suppliers.length > 0 && h('div',{style:{marginTop:12}},
        h(Select,{
          label:'🏭 '+(lang==='en'?'External Supplier (optional)':'المجهز الخارجي (اختياري)'),
          value:String(form.supplier_id||''),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
          options:[{value:'',label:lang==='en'?'— None —':'— بدون مجهز —'}].concat(
            suppliers.map(function(s){ return {value:String(s.id), label:ln(s,lang)+(s.phone?' · '+s.phone:'') }; })
          )
        })
      )
    )
  );
}

function NotificationsView() {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('notifications');
  var _f = useState({title:'',body:'',type:'info'}); var form = _f[0], setForm = _f[1];
  var unread = asArr(crud.items).filter(function(n){return !n.is_read;}).length;
  useTopbar(unread+' '+(lang==='en'?'Unread':'غير مقروء'), null);
  function send() {
    if (!form.title) return;
    crud.create(form).then(function(){ setForm({title:'',body:'',type:'info'}); });
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(form.title, {body:form.body});
  }
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(Card, { style:{ padding:'20px 24px', marginBottom:20 } },
      h('div', { style:{ fontWeight:700, color:T.text, marginBottom:14 } }, t('send_notification')),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Input, { label:t('title'), value:form.title, onChange:function(v){ setForm(function(f){return Object.assign({},f,{title:v});}); } }),
        h(Select, { label:t('type'), value:form.type, onChange:function(v){ setForm(function(f){return Object.assign({},f,{type:v});}); }, options:[{value:'info',label:t('notif_info')},{value:'success',label:t('notif_success')},{value:'warning',label:t('notif_warning')},{value:'error',label:t('notif_error')}] })
      ),
      h(Textarea, { label:t('notes'), value:form.body, onChange:function(v){ setForm(function(f){return Object.assign({},f,{body:v});}); } }),
      h('div', { style:{ display:'flex', gap:8 } },
        h(Btn, { onClick:send }, t('send_notification')),
        h(Btn, { variant:'secondary', onClick:function(){ if(typeof Notification!=='undefined') Notification.requestPermission(); } }, t('browser_notifications'))
      )
    ),
    h(DataTable, {
      columns:[
        {key:'title',label:t('title'),render:function(n){return h('div',null,h('div',{style:{fontWeight:600}},n.title),n.body&&h('div',{style:{fontSize:12,color:T.textMute}},n.body));}},
        {key:'type',label:t('type'),render:function(n){var c={info:'blue',success:'green',warning:'amber',error:'red'};return h(Badge,{label:n.type,color:c[n.type]||'gray'});}},
        {key:'created_at',label:t('date'),render:function(n){return n.created_at?fmtDateTime(n.created_at, getLang()):'—';}},
      ],
      rows:asArr(crud.items), onDelete:function(n){crud.remove(n.id);}
    })
  );
}

/* â•â•â• KDS â•â•â• */
function KDSView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang; var isRtl = i18n.isRtl;
  var bs = props.bootstrap || {};
  var pauseReasons = (props.branding && props.branding.pause_reasons && props.branding.pause_reasons.length) ? props.branding.pause_reasons : (props.pauseReasons || []);
  var carouselInterval = Math.max(3, parseInt(props.carouselInterval||8, 10));
  var CARDS_PER_PAGE = 5;
  var orders   = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var statuses = asArr(bs.statuses);
  var _v = useState('grid'); var view = _v[0], setView = _v[1];
  var _fs = useState(false); var fullKDS = _fs[0], setFullKDS = _fs[1];
  var _pp = useState(null); var pausePrompt = _pp[0]; var setPausePrompt = _pp[1];
  /* carousel page per section â€” advances automatically on standalone */
  var _pages = useState({ip:0,rd:0,pd:0}); var carouselPages = _pages[0], setCarouselPages = _pages[1];
  var kdsSubtitle = lang==='en'
    ? ('Refreshes every ' + carouselInterval + ' seconds')
    : ('تحديث كل ' + carouselInterval + ' ثانية');
  useEffect(function(){
    var id = setInterval(props.onReload, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [props.onReload, carouselInterval]);

  /* detect standalone KDS mode */
  var rootEl = document.getElementById('cspsr-root');
  var isStandalone = rootEl && rootEl.dataset && rootEl.dataset.mode === 'kds';

  /* carousel auto-advance â€” only in standalone mode */
  useEffect(function(){
    if (!isStandalone || view !== 'grid') return;
    var id = setInterval(function(){
      setCarouselPages(function(prev){
        var next = {};
        ['ip','rd','pd'].forEach(function(k){ next[k] = prev[k]; });
        return next; /* will be updated below with real counts */
      });
    }, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [isStandalone, view, carouselInterval]);

  /* -- Classify orders into 3 sections --
     IN PROGRESS   : has items still in production
     READY TO DELIVER : ALL production steps done, delivery step pending/in-progress
     PARTIAL DELIVERY : some items delivered, others still in progress
  -- */
  /* Detect delivery step by flag OR by name */
  function isDeliveryStep(s) {
    if (s.is_delivery == 1) return true;
    var n = (s.step_name||'').toLowerCase();
    return n.indexOf('deliver') >= 0 || n.indexOf('ØªÙˆØµÙŠÙ„') >= 0 || n.indexOf('ØªØ³Ù„ÙŠÙ…') >= 0;
  }
  function itemProductionDone(item) {
    var steps = asArr(item.steps);
    var prodSteps = steps.filter(function(s){ return !isDeliveryStep(s); });
    if (prodSteps.length === 0) return true;
    return prodSteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
  }
  function itemDelivered(item) {
    if (item.is_delivered == 1) return true;
    var steps = asArr(item.steps);
    var deliverySteps = steps.filter(isDeliveryStep);
    if (deliverySteps.length === 0) return false;
    return deliverySteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
  }
  function orderAtDelivery(o) {
    var allSteps = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
    if (allSteps.length === 0) return false;
    var prodSteps = allSteps.filter(function(s){ return !isDeliveryStep(s); });
    var deliverySteps = allSteps.filter(isDeliveryStep);
    var prodAllDone = prodSteps.length === 0 || prodSteps.every(function(s){
      return s.status_slug === 'done' || s.status_slug === 'completed';
    });
    if (!prodAllDone) return false;
    if (deliverySteps.length > 0) {
      var deliveryAllDone = deliverySteps.every(function(s){
        return s.status_slug === 'done' || s.status_slug === 'completed';
      });
      return !deliveryAllDone;
    }
    return true;
  }

  function itemQueuedForPartial(item) {
    return !itemDelivered(item) && !!item.delivery_batch_id;
  }

  function orderHasExplicitPartial(o) {
    var items = asArr(o.items);
    return items.length > 1 && items.some(itemQueuedForPartial);
  }

  var inProg = [], readyDeliver = [], partialDeliver = [];
  orders.forEach(function(o) {
    var items = asArr(o.items);
    var partialItems = items.filter(itemQueuedForPartial);
    /* Items ready for delivery but not explicitly moved as partial */
    var readyItems = items.filter(function(item){
      return !itemQueuedForPartial(item) && (item.is_ready_for_delivery == 1 || itemProductionDone(item)) && !itemDelivered(item);
    });
    /* Items whose production is NOT done yet and not already queued for explicit partial delivery */
    var pendingItems = items.filter(function(item){
      return !itemDelivered(item) && !itemQueuedForPartial(item) && !itemProductionDone(item) && item.is_ready_for_delivery != 1;
    });

    var hasPending = pendingItems.length > 0;
    var hasReady   = readyItems.length > 0;
    var hasPartial = partialItems.length > 0 && items.length > 1;

    if (hasPartial) {
      if (hasPending) inProg.push(o);
      partialDeliver.push(o);
    } else if (!hasPending && hasReady) {
      /* All production done â†’ Ready to Deliver */
      readyDeliver.push(o);
    } else {
      /* All still in progress */
      inProg.push(o);
    }
  });

  /* QR modal state */
  var _qr = useState(null); var qrOrder = _qr[0], setQrOrder = _qr[1];
  /* Recipient contact modal state */
  var _rc = useState(null); var rcOrder = _rc[0], setRcOrder = _rc[1];

  function startStep(stepId) { apiFetch('steps/'+stepId+'/start',{method:'POST'}).then(props.onSilentReload||props.onReload); }
  function completeStep(stepId) { apiFetch('steps/'+stepId+'/advance',{method:'POST'}).then(props.onSilentReload||props.onReload); }
  function pauseStep(stepId, orderId, stepLabel, stepNameAr, stepNameEn) { setPausePrompt({stepId:stepId, orderId:orderId, reason:'', machine:'', stepLabel:stepLabel||'', stepNameAr:stepNameAr||'', stepNameEn:stepNameEn||''}); }
  function resumeStep(stepId) { apiFetch('steps/'+stepId+'/resume',{method:'POST'}).then(props.onSilentReload||props.onReload); }

  /* get contact info from order */
  function getContact(order) {
    return {
      name:  order.contact_person_name_linked || order.contact_person_name || order.contact_name || '',
      phone: order.contact_person_phone_linked || order.contact_person_phone || order.contact_phone || order.customer_phone || '',
      email: order.contact_person_email_linked || order.contact_email || '',
      map:   order.contact_person_map_linked || order.contact_map || order.delivery_map_url || order.recipient_map_url || ''
    };
  }

  /* â”€â”€ Dark card for standalone, light card for embedded â”€â”€ */
  /* â”€â”€ Partial Delivery card: shows only ready items with "Delivered" button per item â”€â”€ */
  function renderPartialCard(order) {
    var isStandaloneCard = isStandalone;
    var bg   = isStandaloneCard ? '#161b22' : T.bg;
    var text = isStandaloneCard ? '#e6edf3' : T.text;
    var mid  = isStandaloneCard ? '#8b949e' : T.textMute;
    var bord = isStandaloneCard ? '#30363d' : T.border;
    var subBg= isStandaloneCard ? '#21262d' : T.bgSub;

    /* Items that are production-done but not yet delivered */
    var readyItems = asArr(order.items).filter(function(item){
      return itemQueuedForPartial(item);
    });

    /* Items still in production */
    var inProductionItems = asArr(order.items).filter(function(item){
      return !itemProductionDone(item) && !itemDelivered(item);
    });

    function markDelivered(itemId) {
      apiFetch('orders/'+order.id+'/partial-deliver', {
        method:'POST',
        body: JSON.stringify({item_ids:[itemId]})
      }).then(props.onSilentReload||props.onReload);
    }

    var urgBorder = order.is_urgent==1
      ? (isStandaloneCard ? '2px solid #f85149' : '2px solid '+T.red)
      : '1px solid #d97706';

    var readyItemIds = readyItems.map(function(item){ return item.id; });
    var readyBatchId = readyItems.length && readyItems[0].delivery_batch_id ? readyItems[0].delivery_batch_id : '';
    var qrPartialUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent((cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + order.id + '&partial=1' + (readyBatchId ? '&batch_id=' + readyBatchId : '') + '&item_ids=' + readyItemIds.join(',')));

    return h('div', { style:{ background:bg, border:urgBorder, borderRadius:12, padding:'14px', marginBottom:8 } },
      /* Header */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}},
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:'#d97706'}},'#'+order.order_number),
          h('div',{style:{fontSize:12,fontWeight:600,color:text,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
          order.deadline && h('div',{style:{fontSize:11,color:'#d97706',fontWeight:600,marginTop:2}},'ðŸ—“ '+fmtDate(order.deadline,getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer',marginInlineStart:8},onClick:function(){setQrOrder(order);}},
          h('img',{src:qrPartialUrl,width:120,height:120,style:{display:'block',borderRadius:6,border:'1px solid #d97706',background:'#fff',padding:2},alt:'QR'})
        )
      ),
      /* Ready items list */
      h('div',{style:{borderTop:'1px solid '+bord,paddingTop:8}},
        h('div',{style:{fontSize:11,color:'#d97706',fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:.5}},
          lang==='en'?'Ready for Delivery':'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙˆØµÙŠÙ„'
        ),
        readyItems.length === 0
          ? h('div',{style:{color:mid,fontSize:12,textAlign:'center',padding:'8px 0'}},lang==='en'?'No ready items':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø¬Ø§Ù‡Ø²Ø©')
          : readyItems.map(function(item){
              var itemName = (lang==='en' && item.product_name_en) ? item.product_name_en : (item.product_name||'â€”');
              return h('div',{key:item.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid '+subBg}},
                h('div',{style:{flex:1,minWidth:0}},
                  h('div',{style:{fontSize:12,fontWeight:600,color:text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},itemName),
                  h('div',{style:{fontSize:11,color:mid}},'Ã— '+item.quantity)
                ),
                h('button',{
                  onClick:function(){ markDelivered(item.id); },
                  style:{
                    padding:'5px 12px',borderRadius:6,border:'none',
                    background:isStandaloneCard?'rgba(59,190,80,.25)':'#dcfce7',
                    color:isStandaloneCard?'#3fb950':'#166534',
                    cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0,marginRight:4
                  }
                }, lang==='en'?'âœ“ Delivered':'âœ“ ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„')
              );
            })
      ),
      /* In-production items */
      inProductionItems.length > 0 && h('div',{style:{borderTop:'1px solid '+bord,paddingTop:8,marginTop:8}},
        h('div',{style:{fontSize:11,color:mid,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:.5}},
          lang==='en'?'Still in Production':'Ù„Ø§ ØªØ²Ø§Ù„ ÙÙŠ Ø§Ù„Ø¥Ù†ØªØ§Ø¬'
        ),
        inProductionItems.map(function(item){
          var itemName = (lang==='en' && item.product_name_en) ? item.product_name_en : (item.product_name||'â€”');
          return h('div',{key:item.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid '+subBg}},
            h('div',{style:{flex:1,minWidth:0}},
              h('div',{style:{fontSize:12,color:mid,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},itemName),
              h('div',{style:{fontSize:11,color:mid}},'Ã— '+item.quantity)
            ),
            h('span',{style:{fontSize:11,padding:'2px 8px',borderRadius:99,background:subBg,color:mid,flexShrink:0}},
              lang==='en'?'âš™ In Production':'âš™ Ù‚ÙŠØ¯ Ø§Ù„Ø¥Ù†ØªØ§Ø¬'
            )
          );
        })
      ),
      /* Print button â€” prints only the ready items */
      readyItems.length > 0 && h('div',{style:{marginTop:10,paddingTop:8,borderTop:'1px solid '+bord}},
        h('button',{
          onClick:function(){
            var orderCopy = Object.assign({},order,{items:readyItems});
            openPrintWithLang(orderCopy, getLang());
          },
          style:{width:'100%',padding:'8px',borderRadius:6,border:'1px solid '+bord,background:'transparent',color:mid,cursor:'pointer',fontSize:12,fontFamily:'inherit'}
        }, 'ðŸ–¨ '+(lang==='en'?'Print delivery slip':'Ø·Ø¨Ø§Ø¹Ø© ÙˆØµÙ„ Ø§Ù„ØªÙˆØµÙŠÙ„'))
      )
    );
  }

  function renderKCard(order) {
    var p = progOf(order);
    var prds = asArr(order.items).reduce(function(a,i){ return a.concat(asArr(i.steps).filter(function(s){ return s.show_in_prds==1; })); }, []);
    var allS = asArr(order.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
    var next          = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
    var firstPending  = allS.filter(function(s){ return s.status_slug==='pending'; })[0];
    var showStart     = firstPending && !next;

    if (isStandalone) {
      var urgentBorder = order.is_urgent==1 ? '#f85149' : '#30363d';
      var qrPageUrl = (cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + order.id);
      var qrApiUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=' + encodeURIComponent(qrPageUrl);
      var activeStep = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
      var stepLabel  = activeStep ? lnStep(activeStep, getLang()) : (order.current_step_label || t('waiting'));
      return h('div', { style:{ background:'#161b22', border:'1px solid '+urgentBorder, borderRadius:10, padding:'10px 12px' } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:7}},
          h('div',{style:{flex:1,minWidth:0}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6}},
              h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:order.is_urgent==1?'#f85149':'#58a6ff'}},'#'+order.order_number),
              order.is_urgent==1 && h('span',{style:{fontSize:9,background:'#f85149',color:'#fff',borderRadius:3,padding:'1px 4px',fontWeight:700}},lang==='en'?'URGENT':'Ø¹Ø§Ø¬Ù„')
            ),
            h('div',{style:{fontSize:12,fontWeight:600,color:'#e6edf3',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
            order.deadline && h('div',{style:{fontSize:10,color:'#d29922',marginTop:2}},'ðŸ—“ '+fmtDate(order.deadline,getLang()))
          ),
          h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(order);}},
            h('img',{src:qrApiUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid #30363d',background:'#fff',padding:2},alt:'QR'})
          )
        ),
        h('div',{style:{background:'#21262d',borderRadius:99,height:4,overflow:'hidden',marginBottom:4}},
          h('div',{style:{width:p+'%',background:p>=100?'#3fb950':p>=50?'#58a6ff':'#d29922',height:'100%',borderRadius:99}})
        ),
        h('div',{style:{fontSize:10,color:'#8b949e',marginBottom:7}},p+'% â€” '+stepLabel),
        asArr(order.items).length > 0 && h('div',{style:{borderTop:'1px solid #21262d',paddingTop:6}},
          asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
            var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
            return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
              h('span',{style:{fontSize:11,color:'#c9d1d9',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
              h('span',{style:{fontSize:11,color:'#6e7681',flexShrink:0}},'Ã—'+item.quantity)
            );
          })
        )
      );
    }
    /* â”€â”€ Light card for embedded (inside app) â”€â”€ */
    var urgentBorderLight = order.is_urgent==1 ? '2px solid '+T.red : '1px solid '+T.border;
    var qrEmbUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=' + encodeURIComponent((cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + order.id));
    var activeStepEmb = allS.filter(function(s){ return s.status_slug==='in_progress'; })[0];
    var stepLabelEmb  = activeStepEmb ? lnStep(activeStepEmb, getLang()) : (order.current_step_label||t('waiting'));
    return h('div', { style:{ background:T.bg, border:urgentBorderLight, borderRadius:T.radiusLg, padding:'10px 12px', boxShadow:T.shadow } },
      /* Row 1: order info + QR */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:7}},
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:6}},
            h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:T.accent}},'#'+order.order_number),
            order.is_urgent==1 && h(Badge,{label:t('urgent'),color:'red',dot:true})
          ),
          h('div',{style:{fontSize:12,fontWeight:600,color:T.text,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
          order.deadline && h('div',{style:{fontSize:11,color:T.amber,fontWeight:600,marginTop:2}},'ðŸ—“ '+fmtDate(order.deadline,getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(order);}},
          h('img',{src:qrEmbUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
        )
      ),
      /* Row 2: progress */
      h(ProgressBar,{value:p}),
      h('div',{style:{fontSize:10,color:T.textMute,marginTop:3,marginBottom:7}},p+'% â€” '+stepLabelEmb),
      /* Row 3: in-production products only */
      asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).length > 0 && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:6,marginBottom:7}},
        asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
          var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
          return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
            h('span',{style:{fontSize:11,color:T.textMid,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
            h('span',{style:{fontSize:11,color:T.textMute,flexShrink:0}},'Ã—'+item.quantity)
          );
        })
      ),
      /* Row 4: action buttons â€” hidden in KDS display */
    );
  }
  var gridSt = view==='grid'
    ? {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:isStandalone?14:16}
    : {display:'flex',flexDirection:'column',gap:10};

  var sections = [
    {key:'ip',  label:lang==='en'?'In Progress':'Ù‚ÙŠØ¯ Ø§Ù„Ø¥Ù†ØªØ§Ø¬',         count:inProg.length,        items:inProg,        color:isStandalone?'#58a6ff':T.blue,   icon:'âš™ï¸', renderFn: renderKCard},
    {key:'rd',  label:lang==='en'?'Ready to Deliver':'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙˆØµÙŠÙ„',   count:readyDeliver.length,  items:readyDeliver,  color:isStandalone?'#3fb950':T.green,  icon:'ðŸšš', renderFn: renderKCard},
    {key:'pd',  label:lang==='en'?'Partial Delivery':'ØªÙˆØµÙŠÙ„ Ø¬Ø²Ø¦ÙŠ',     count:partialDeliver.length,items:partialDeliver,color:isStandalone?'#d29922':'#d97706', icon:'ðŸ“¦', renderFn: renderPartialCard},
  ];

  /* carousel: advance each column's page every N seconds â€” always active */
  useEffect(function(){
    var sectionLengths = {ip:inProg.length, rd:readyDeliver.length, pd:partialDeliver.length};
    var id = setInterval(function(){
      setCarouselPages(function(prev){
        var next = {};
        Object.keys(sectionLengths).forEach(function(k){
          var total = sectionLengths[k];
          var pages = Math.ceil(total / CARDS_PER_PAGE) || 1;
          next[k] = pages > 1 ? (prev[k] + 1) % pages : 0;
        });
        return next;
      });
    }, carouselInterval * 1000);
    return function(){ clearInterval(id); };
  }, [carouselInterval, inProg.length, readyDeliver.length, partialDeliver.length]);

  /* get visible slice for a section in carousel mode */
  function getPageItems(key, items) {
    if (items.length <= CARDS_PER_PAGE) return items;
    var page = carouselPages[key] || 0;
    return items.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
  }

  /* -- Standalone dark fullscreen layout (TV) -- */
  if (isStandalone) {
    return h('div', { style:{ minHeight:'100vh', background:'#0d1117', color:'#e6edf3', padding:'16px 20px', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", direction:isRtl?'rtl':'ltr', overflow:'hidden' } },
      /* Header */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,paddingBottom:10,borderBottom:'1px solid #21262d'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}},
          h('div',{style:{width:10,height:10,borderRadius:'50%',background:'#3fb950',boxShadow:'0 0 10px #3fb950',flexShrink:0}}),
          h('h1',{style:{margin:0,fontSize:20,fontWeight:700,color:'#e6edf3'}},t('kds')),
          h('div',{style:{fontSize:12,color:'#484f58',marginTop:2}},t('n_active',orders.length)+' | '+carouselInterval+'s')
        ),
        h('div',{style:{display:'flex',gap:6,alignItems:'center'}},
          ['grid','list'].map(function(m){
            return h('button',{key:m,onClick:function(){setView(m);},style:{padding:'5px 12px',borderRadius:6,border:'1px solid #30363d',cursor:'pointer',fontSize:11,fontWeight:600,background:view===m?'#21262d':'transparent',color:view===m?'#e6edf3':'#6e7681'}},
              m==='grid'?'Grid':'List'
            );
          })
        )
      ),
      orders.length===0 && h('div',{style:{textAlign:'center',padding:'80px 20px',color:'#484f58'}},
        h('div',{style:{fontSize:16,fontWeight:600}},t('no_active_kds'))
      ),
      /* GRID VIEW: 3 columns with carousel (5 cards per page) */
      view==='grid' && orders.length > 0 && h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,alignItems:'start'}},
        sections.map(function(sec){
          var pageItems = getPageItems(sec.key, sec.items);
          var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
          var curPage = carouselPages[sec.key] || 0;
          return h('div',{key:sec.key,style:{background:'#161b22',border:'1px solid #21262d',borderRadius:12,overflow:'hidden'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid #21262d',background:'#0d1117'}},
              h('span',{style:{fontSize:14}},sec.icon),
              h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:1,flex:1}},sec.label),
              totalPages > 1 && h('span',{style:{color:'#484f58',fontSize:10,marginLeft:4}},(curPage+1)+'/'+totalPages),
              h('span',{style:{background:'#21262d',color:'#8b949e',borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700,marginLeft:4}},sec.count)
            ),
            h('div',{style:{padding:'10px',display:'flex',flexDirection:'column',gap:8,minHeight:100}},
              pageItems.length===0
                ? h('div',{style:{textAlign:'center',padding:'20px 0',color:'#484f58',fontSize:12}},lang==='en'?'No orders':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª')
                : pageItems.map(function(o){ return h('div',{key:o.id},(sec.renderFn||renderKCard)(o)); })
            )
          );
        })
      ),
      /* LIST VIEW: compact horizontal rows */
      view==='list' && orders.length > 0 && h('div',{style:{display:'flex',flexDirection:'column',gap:0}},
        sections.map(function(sec){
          if (sec.items.length===0) return null;
          return h('div',{key:sec.key,style:{marginBottom:16}},
            h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#0d1117',borderRadius:8,marginBottom:6}},
              h('span',{style:{fontSize:13}},sec.icon),
              h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:1,flex:1}},sec.label),
              h('span',{style:{background:'#21262d',color:'#8b949e',borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700}},sec.count)
            ),
            h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
              sec.items.map(function(o){
                var p = progOf(o);
                var allSteps = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); },[]);
                var activeStep = allSteps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
                var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=60x60&data='+encodeURIComponent(cfg().root.replace(/\/+$/,'')+'/qr-contact?order_id='+o.id);
                return h('div',{key:o.id,style:{display:'grid',gridTemplateColumns:'160px 1fr auto 70px',gap:10,alignItems:'center',background:'#161b22',border:'1px solid #21262d',borderRadius:8,padding:'8px 12px'}},
                  h('div',null,
                    h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:sec.color}},'#'+o.order_number),
                    h('div',{style:{fontSize:12,color:'#c9d1d9',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(o,getLang())),
                    o.is_urgent==1 && h('span',{style:{fontSize:10,background:'#f85149',color:'#fff',borderRadius:4,padding:'1px 5px',marginTop:2,display:'inline-block'}},lang==='en'?'Urgent':'Ø¹Ø§Ø¬Ù„')
                  ),
                  h('div',null,
                    h('div',{style:{background:'#21262d',borderRadius:4,height:6,overflow:'hidden',marginBottom:4}},
                      h('div',{style:{background:p===100?'#3fb950':'#58a6ff',height:'100%',width:p+'%',transition:'width .3s'}})
                    ),
                    h('div',{style:{fontSize:11,color:'#8b949e'}},p+'% | '+(activeStep?lnStep(activeStep,lang):(o.current_step_label||'â€”')))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:3}},
                    asArr(o.items).slice(0,2).map(function(item){
                      var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'');
                      return h('span',{key:item.id,style:{fontSize:10,background:'#21262d',color:'#8b949e',borderRadius:4,padding:'2px 6px',whiteSpace:'nowrap',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',display:'inline-block'}},iName+' Ã—'+item.quantity);
                    }),
                    asArr(o.items).length>2 && h('span',{style:{fontSize:10,color:'#484f58'}},'+' +(asArr(o.items).length-2))
                  ),
                  h('img',{src:qrUrl,width:56,height:56,style:{display:'block',borderRadius:4,border:'1px solid #30363d',background:'#fff'},alt:'QR'})
                );
              })
            )
          );
        })
      ),
      pausePrompt && h(PauseModal, {
        pauseReasons: pauseReasons,
        stepLabel: pausePrompt.stepLabel || '',
        onClose: function(){ setPausePrompt(null); },
        onConfirm: function(reason, machine){
          apiFetch('steps/'+pausePrompt.stepId+'/pause',{method:'POST',body:JSON.stringify({reason:reason,machine:machine||''})})
            .then(function(){ setPausePrompt(null); (props.onSilentReload||props.onReload)(); });
        }
      }),
      /* â”€â”€ QR Contact Modal standalone â”€â”€ */
      qrOrder && renderQRModal(qrOrder, true),
      rcOrder && renderRecipientModal(rcOrder, true)
    );
  }

  /* â”€â”€ Embedded light layout (inside app sidebar) â”€â”€ */
  useTopbar(t('n_active',orders.length)+' â€” '+kdsSubtitle,
    h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:view==='grid'?'primary':'secondary',size:'sm',onClick:function(){setView('grid');}}, 'âŠž Grid'),
      h(Btn,{variant:view==='list'?'primary':'secondary',size:'sm',onClick:function(){setView('list');}}, 'â˜° List'),
      h(Btn,{variant:fullKDS?'primary':'secondary',size:'sm',
        onClick:function(){
          var next = !fullKDS;
          setFullKDS(next);
          if (next) {
            var el = document.documentElement;
            var req = el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
            if (req) req.call(el);
          } else {
            var ex = document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen||document.msExitFullscreen;
            if (ex) ex.call(document);
          }
        }
      }, fullKDS ? 'âœ• '+(lang==='en'?'Exit':'Ø®Ø±ÙˆØ¬') : 'â›¶ '+(lang==='en'?'Fullscreen':'Ù…Ù„Ø¡ Ø§Ù„Ø´Ø§Ø´Ø©'))
    )
  );

  /* Fullscreen overlay â€” covers entire viewport, no sidebar or header */
  var kdsWrapStyle = fullKDS ? {
    position:'fixed', inset:0, zIndex:9999,
    background:T.bg, overflow:'auto',
    padding:'16px 20px'
  } : {};

  /* Grid: 3 columns with carousel | List: horizontal slider */
  if (view === 'list') {
    var sectionCount = sections.filter(function(s){ return s.items.length > 0; }).length || 1;
    return h('div', { style: Object.assign({ display:'flex', flexDirection:'column', gap:8, height:'calc(100vh - 80px)', overflow:'hidden' }, kdsWrapStyle) },
      fullKDS && h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:6}},
        h('button',{
          onClick:function(){ setFullKDS(false); },
          style:{padding:'5px 12px',borderRadius:8,border:'1px solid '+T.border,background:T.bgSub,color:T.textMid,cursor:'pointer',fontSize:12,fontWeight:600}
        }, lang==='en'?'Exit Fullscreen':'Ø®Ø±ÙˆØ¬ Ù…Ù† Ù…Ù„Ø¡ Ø§Ù„Ø´Ø§Ø´Ø©')
      ),
      sections.map(function(sec){
        if (sec.items.length === 0) return null;
        var pageItems = getPageItems(sec.key, sec.items);
        var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
        var curPage = carouselPages[sec.key] || 0;
        return h('div',{key:sec.key, style:{flex:1, display:'flex', flexDirection:'column', minHeight:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
            h('span',{style:{fontSize:13}},sec.icon),
            h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:.8,flex:1}},sec.label),
            totalPages > 1 && h('span',{style:{fontSize:11,color:T.textMute}},(curPage+1)+'/'+totalPages),
            h('span',{style:{background:T.bgSub,color:T.textMute,borderRadius:99,padding:'1px 8px',fontSize:11,fontWeight:700}},sec.count)
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+CARDS_PER_PAGE+', 1fr)',gap:10,flex:1,minHeight:0}},
            Array.from({length:CARDS_PER_PAGE}).map(function(_,i){
              var o = pageItems[i];
              if (!o) return h('div',{key:'empty-'+i, style:{background:T.bgSub,borderRadius:T.radiusLg,border:'1px dashed '+T.border,opacity:.3}});
              var p = progOf(o);
              var allStps = asArr(o.items).reduce(function(a,it){ return a.concat(asArr(it.steps)); },[]);
              var activeStep = allStps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
              var stepLbl = activeStep ? lnStep(activeStep,getLang()) : (o.current_step_label||t('waiting'));
              var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='+encodeURIComponent(cfg().root.replace(/\/+$/,'')+'/qr-contact?order_id='+o.id);
              var urgBorder = o.is_urgent==1 ? '2px solid '+T.red : '1px solid '+T.border;
              /* for partial delivery, show only production-done items */
              var displayItems = sec.key==='pd'
                ? asArr(o.items).filter(itemQueuedForPartial)
                : sec.key==='ip'
                ? asArr(o.items).filter(function(item){ return !itemProductionDone(item); })
                : asArr(o.items);
              return h('div',{key:o.id, style:{
                background:T.bg, border:urgBorder,
                borderTop:'3px solid '+sec.color,
                borderRadius:T.radiusLg, padding:'10px 12px',
                display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0
              }},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}},
                  h('div',{style:{flex:1,minWidth:0}},
                    h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:12,color:sec.color}},'#'+o.order_number),
                    h('div',{style:{fontSize:11,fontWeight:600,color:T.text,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(o,getLang())),
                    o.deadline && h('div',{style:{fontSize:10,color:T.amber,marginTop:1}},'ðŸ—“ '+fmtDate(o.deadline,getLang()))
                  ),
                  h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(o);}},
                    h('img',{src:qrUrl,width:120,height:120,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
                  )
                ),
                h('div',{style:{background:T.bgSub,borderRadius:99,height:4,overflow:'hidden',marginBottom:3}},
                  h('div',{style:{width:p+'%',background:p>=100?'#22c55e':T.accent,height:'100%',borderRadius:99}})
                ),
                h('div',{style:{fontSize:10,color:T.textMute,marginBottom:4}},p+'% â€” '+stepLbl),
                h('div',{style:{flex:1,overflow:'hidden'}},
                  displayItems.map(function(item){
                    var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'â€”');
                    return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',fontSize:10,padding:'1px 0',borderBottom:'1px solid '+T.bgSub}},
                      h('span',{style:{color:T.textMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
                      h('span',{style:{color:T.textMute,flexShrink:0}},'Ã—'+item.quantity)
                    );
                  })
                )
              );
            })
          )
        );
      }),
      qrOrder && renderQRModal(qrOrder, false),
      rcOrder && renderRecipientModal(rcOrder, false)
    );
  }



  var embColStyle = {display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,alignItems:'start'};

  return h('div', { style: kdsWrapStyle || {} },
    fullKDS && h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:10}},
      h('button',{
        onClick:function(){ setFullKDS(false); },
        style:{padding:'6px 14px',borderRadius:8,border:'1px solid '+T.border,background:T.bgSub,color:T.textMid,cursor:'pointer',fontSize:12,fontWeight:600}
      }, 'âœ• '+(lang==='en'?'Exit Fullscreen':'Ø®Ø±ÙˆØ¬ Ù…Ù† Ù…Ù„Ø¡ Ø§Ù„Ø´Ø§Ø´Ø©'))
    ),
    orders.length===0 && h(Card,{style:{padding:40,textAlign:'center'}},
      h('div',{style:{fontSize:48,marginBottom:12}},'ðŸ“‹'),
      h('div',{style:{color:T.textMute,fontSize:14}},t('no_active_kds'))
    ),
    orders.length > 0 && h('div',{style:embColStyle},
      sections.map(function(sec){
        var pageItems = getPageItems(sec.key, sec.items);
        var totalPages = Math.ceil(sec.items.length / CARDS_PER_PAGE) || 1;
        var curPage = carouselPages[sec.key] || 0;
        return h('div',{key:sec.key,style:{background:T.bg,border:'1px solid '+T.border,borderRadius:T.radiusLg,overflow:'hidden'}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid '+T.border,background:T.bgSub}},
            h('span',{style:{fontSize:15}},sec.icon),
            h('span',{style:{fontWeight:700,fontSize:12,color:sec.color,textTransform:'uppercase',letterSpacing:.5,flex:1}},sec.label),
            totalPages > 1 && h('span',{style:{fontSize:11,color:T.textMute,marginRight:4}},(curPage+1)+'/'+totalPages),
            h(Badge,{label:String(sec.count),color:'gray'})
          ),
          h('div',{style:{padding:'12px',display:'flex',flexDirection:'column',gap:10,minHeight:100}},
            sec.items.length===0
              ? h('div',{style:{textAlign:'center',padding:'20px 0',color:T.textMute,fontSize:12,width:'100%'}},lang==='en'?'No orders':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª')
              : pageItems.map(function(o){ return h('div',{key:o.id},(sec.renderFn||renderKCard)(o)); })
          )
        );
      })
    ),
    /* â”€â”€ Pause Modal embedded â€” linked to Settings reasons â”€â”€ */
    pausePrompt && h(PauseModal, {
      pauseReasons: pauseReasons,
      stepLabel: pausePrompt.stepLabel || '',
      onClose: function(){ setPausePrompt(null); },
      onConfirm: function(reason, machine){
        apiFetch('steps/'+pausePrompt.stepId+'/pause',{method:'POST',body:JSON.stringify({reason:reason,machine:machine||''})})
          .then(function(){ setPausePrompt(null); (props.onSilentReload||props.onReload)(); });
      }
    }),
    /* â”€â”€ QR Contact Modal embedded â”€â”€ */
    qrOrder && renderQRModal(qrOrder, false),
    rcOrder && renderRecipientModal(rcOrder, false)
  );

  /* â”€â”€ QR Contact Modal builder â”€â”€ */
  function renderQRModal(order, dark) {
    var ct = getContact(order);
    var qrPageUrl = (cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + order.id);
    var qrApiUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(qrPageUrl);
    var bg    = dark ? '#161b22' : T.bg;
    var text  = dark ? '#e6edf3' : T.text;
    var mid   = dark ? '#c9d1d9' : T.textMid;
    var mute  = dark ? '#8b949e' : T.textMute;
    var bord  = dark ? '#30363d' : T.border;
    var subBg = dark ? '#21262d' : T.bgSub;
    var isRtlDir = i18n.isRtl ? 'rtl' : 'ltr';

    /* Collect all phones: customer + contact + recipient */
    var phones = [];
    if (ct.phone) phones.push(ct.phone);
    if (order.customer_phone && phones.indexOf(order.customer_phone)<0) phones.push(order.customer_phone);
    if (order.recipient_phone && phones.indexOf(order.recipient_phone)<0) phones.push(order.recipient_phone);

    /* Map link */
    var mapUrl = ct.map || order.delivery_map_url || order.recipient_map_url || '';

    /* Products */
    var items = asArr(order.items);

    return h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:99000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, onClick:function(e){ if(e.target===e.currentTarget) setQrOrder(null); } },
      h('div', { style:{ background:bg, border:'1px solid '+bord, borderRadius:16, width:'100%', maxWidth:400, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,.6)', direction:isRtlDir } },
        /* Header */
        h('div',{style:{padding:'16px 20px',borderBottom:'1px solid '+bord,display:'flex',alignItems:'center',justifyContent:'space-between'}},
          h('div',null,
            h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:14,color:dark?'#58a6ff':T.accent}},'#'+order.order_number),
            h('div',{style:{fontWeight:700,fontSize:15,color:text,marginTop:2}},getCust(order,lang))
          ),
          h('button',{onClick:function(){setQrOrder(null);},style:{border:'none',background:'transparent',cursor:'pointer',color:mute,fontSize:20,lineHeight:1,padding:4}},'Ã—')
        ),
        /* Body */
        h('div',{style:{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}},
          /* QR code */
          h('div',{style:{display:'flex',justifyContent:'center'}},
            h('div',{style:{background:'#fff',padding:8,borderRadius:10,display:'inline-block',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}},
              h('img',{src:qrApiUrl,width:120,height:120,style:{display:'block',borderRadius:4},alt:'QR'})
            )
          ),
          h('div',{style:{fontSize:11,color:mute,textAlign:'center'}}, lang==='en'?'Scan to open contact page':'Ø§Ù…Ø³Ø­ Ù„Ù„ÙˆØµÙˆÙ„ Ù„ØµÙØ­Ø© Ø§Ù„ØªÙˆØ§ØµÙ„'),
          /* Recipient */
          (order.recipient_name||ct.name) && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:4}},lang==='en'?'Recipient':'Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
            h('div',{style:{fontWeight:600,fontSize:13,color:text}},order.recipient_name||ct.name||'â€”'),
            ct.name && order.recipient_name && ct.name!==order.recipient_name && h('div',{style:{fontSize:12,color:mid,marginTop:2}},ct.name)
          ),
          /* Phones */
          phones.length > 0 && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            phones.map(function(ph,i){
              var waNum = ph.replace(/[^0-9]/g,'');
              return h('div',{key:i,style:{display:'flex',gap:8}},
                h('a',{href:'tel:'+ph,style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'ðŸ“ž'), ph
                ),
                h('a',{href:'https://wa.me/'+waNum,target:'_blank',style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#d1fae5',color:'#065f46',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'ðŸ’¬'), 'WhatsApp'
                )
              );
            })
          ),
          /* Maps */
          mapUrl && h('a',{href:mapUrl,target:'_blank',style:{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderRadius:9,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:13}},
            h('span',{style:{fontSize:18}},'ðŸ“'),
            lang==='en'?'Open in Google Maps':'ÙØªØ­ ÙÙŠ Ø®Ø±Ø§Ø¦Ø· ÙƒÙˆÙƒÙ„'
          ),
          /* Products */
          items.length > 0 && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:8}},lang==='en'?'Products in this order':'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ÙÙŠ Ø§Ù„Ø·Ù„Ø¨'),
            items.map(function(item,i){
              return h('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<items.length-1?'1px solid '+bord:'none'}},
                h('span',{style:{fontSize:13,color:text,fontWeight:500}},(lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name||'â€”'),
                h('span',{style:{fontSize:12,color:mute,background:dark?'#161b22':T.bg,borderRadius:99,padding:'1px 8px'}},
                  'Ã—'+item.quantity
                )
              );
            })
          ),
          !ct.phone && !mapUrl && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:subBg,borderRadius:8,textAlign:'center'}},lang==='en'?'No contact info available':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ØªÙˆØ§ØµÙ„')
        )
      )
    );
  }

  /* â”€â”€ Recipient Contact Modal builder â”€â”€ */
  function renderRecipientModal(order, dark) {
    var bg   = dark ? '#161b22' : T.bg;
    var text = dark ? '#e6edf3' : T.text;
    var mute = dark ? '#8b949e' : T.textMute;
    var bord = dark ? '#30363d' : T.border;
    var cardBg = dark ? '#21262d' : T.bgSub;

    /* Pick recipient fields */
    var name    = order.rec_name || order.recipient_name || '';
    var phone   = order.rec_phone || order.recipient_phone || '';
    var address = order.rec_address || order.recipient_address || order.delivery_address || '';
    var map     = order.rec_map || order.recipient_map_url || order.delivery_map_url || '';
    var customer = getCust(order, lang);

    return h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:99000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, onClick:function(e){ if(e.target===e.currentTarget) setRcOrder(null); } },
      h('div', { style:{ background:bg, border:'1px solid '+bord, borderRadius:16, padding:'24px 20px', width:'100%', maxWidth:360, boxShadow:'0 24px 48px rgba(0,0,0,.5)', direction:'rtl' } },
        /* Header */
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:16}},
          h('div',{style:{width:40,height:40,borderRadius:10,background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}},'ðŸ“¦'),
          h('div',null,
            h('div',{style:{fontWeight:700,fontSize:14,color:text}}, lang==='en'?'Recipient':'Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
            h('div',{style:{fontSize:12,color:mute}},'#'+order.order_number+' â€” '+customer)
          )
        ),
        /* Recipient info card */
        h('div',{style:{background:cardBg,borderRadius:10,padding:'14px 16px',marginBottom:16}},
          name && h('div',{style:{fontWeight:700,fontSize:15,color:text,marginBottom:6}},name),
          address && h('div',{style:{fontSize:12,color:mute,marginBottom:4}},'ðŸ“ '+address),
          !name && !address && h('div',{style:{color:mute,fontSize:13}}, lang==='en'?'No recipient info':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø³ØªÙ„Ù…')
        ),
        /* Contact buttons */
        h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          phone && h('a',{href:'tel:'+phone, style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ“ž'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Call Recipient':'Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ù…Ø³ØªÙ„Ù…'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          phone && h('a',{href:'https://wa.me/'+phone.replace(/[^0-9]/g,''), target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ’¬'),
            h('div',{style:{textAlign:'right'}},
              h('div',null,'WhatsApp'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          map && h('a',{href:map, target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'ðŸ“'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Open Map':'ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©')
            )
          ),
          !phone && !map && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:cardBg,borderRadius:8}}, lang==='en'?'No contact info':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ØªÙˆØ§ØµÙ„')
        ),
        h('button',{onClick:function(){setRcOrder(null);}, style:{marginTop:16,padding:'8px 24px',borderRadius:8,border:'1px solid '+bord,background:'transparent',color:mute,cursor:'pointer',fontSize:13,width:'100%'}}, lang==='en'?'Close':'Ø¥ØºÙ„Ø§Ù‚')
      )
    );
  }
}

function AppLayout(props) {
  var i18n = useI18n(); var isRtl = i18n.isRtl;
  var dir = isRtl ? 'rtl' : 'ltr';
  return h('div', { style:{ display:'flex', height:'100vh', background:T.bgSub, direction:dir, overflow:'hidden' } },
    props.children
  );
}
var ErrorBoundary = (function() {
  function EB(p) { React.Component.call(this,p); this.state = {err:false,msg:''}; }
  EB.prototype = Object.create(React.Component.prototype);
  EB.getDerivedStateFromError = function(e) { return {err:true,msg:e.message}; };
  EB.prototype.render = function() {
    if (this.state.err) return h(Card,{style:{margin:20,padding:24,borderColor:'#fda4af'}},
      h('div',{style:{fontWeight:700,color:T.red,marginBottom:8}},'âš ï¸ UI Error'),
      h('code',{style:{fontSize:12,color:T.textMute,display:'block',marginBottom:14}},this.state.msg),
      h(Btn,{variant:'secondary',onClick:function(){ this.setState({err:false,msg:''}); }.bind(this)},'â†º Retry')
    );
    return this.props.children;
  };
  return EB;
})();

/* â•â•â• OPERATIONS TASKS â•â•â• */

/* â”€â”€ OpsTaskForm: create/edit a task â”€â”€ */
function OpsTaskForm(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var customers     = asArr(bs.customers);
  var products      = asArr(bs.products);
  var orders        = asArr(bs.orders).filter(function(o){ return !isDone(o); });

  var blank = { linked_order_id:'', customer_id:'', contact_person_id:'', product_id:'', description:'', deadline:'', time:'' };
  var _f = useState(Object.assign({}, blank, props.task || {}));
  var form = _f[0]; var setForm = _f[1];
  var _contacts = useState([]); var contacts = _contacts[0]; var setContacts = _contacts[1];
  var _loading = useState(false); var saving = _loading[0]; var setSaving = _loading[1];

  /* When customer changes load their contacts */
  useEffect(function() {
    if (!form.customer_id) { setContacts([]); return; }
    apiFetch('customers/' + form.customer_id + '/contacts')
      .then(function(d){ setContacts(Array.isArray(d) ? d : []); })
      .catch(function(){ setContacts([]); });
  }, [form.customer_id]);

  /* When order changes, pre-fill customer */
  useEffect(function() {
    if (!form.linked_order_id) return;
    var ord = findBy(orders, 'id', parseInt(form.linked_order_id));
    if (ord && ord.customer_id) {
      setForm(function(f){ return Object.assign({}, f, { customer_id: String(ord.customer_id) }); });
    }
  }, [form.linked_order_id]);

  function set(k, v) { setForm(function(f){ return Object.assign({}, f, { [k]: v }); }); }

  function save() {
    if (!form.customer_id) { alert(lang === 'en' ? 'Customer is required' : 'Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù…Ø·Ù„ÙˆØ¨'); return; }
    setSaving(true);
    var body = Object.assign({}, form, {
      linked_order_id:   form.linked_order_id   ? parseInt(form.linked_order_id)   : null,
      customer_id:       parseInt(form.customer_id),
      contact_person_id: form.contact_person_id ? parseInt(form.contact_person_id) : null,
      product_id:        form.product_id        ? parseInt(form.product_id)        : null,
    });
    var prom = form.id
      ? apiFetch('ops-tasks/' + form.id, { method:'PUT', body:JSON.stringify(body) })
      : apiFetch('ops-tasks', { method:'POST', body:JSON.stringify(body) });
    prom
      .then(function(res){ setSaving(false); props.onSaved(res && res.id ? res.id : null); })
      .catch(function(e){ setSaving(false); alert(e.message || 'Error'); });
  }

  var orderOpts = [{ value:'', label: lang==='en' ? 'â€” No linked order â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ø·Ù„Ø¨ Ù…Ø±ØªØ¨Ø· â€”' }]
    .concat(orders.map(function(o){ return { value:String(o.id), label:'#'+o.order_number+' â€” '+getCust(o,lang) }; }));

  var custOpts = [{ value:'', label: lang==='en' ? 'â€” Select customer â€”' : 'â€” Ø§Ø®ØªØ± Ø§Ù„Ø¹Ù…ÙŠÙ„ â€”' }]
    .concat(customers.map(function(c){ return { value:String(c.id), label:ln(c,lang) }; }));

  var contactOpts = [{ value:'', label: lang==='en' ? 'â€” No contact person â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ø´Ø®Øµ ØªÙˆØ§ØµÙ„ â€”' }]
    .concat(contacts.map(function(c){ return { value:String(c.id), label:c.name+(c.phone?' ('+c.phone+')':'') }; }));

  var productOpts = [{ value:'', label: lang==='en' ? 'â€” No product â€”' : 'â€” Ø¨Ø¯ÙˆÙ† Ù…Ù†ØªØ¬ â€”' }]
    .concat(products.map(function(p){ return { value:String(p.id), label:ln(p,lang) }; }));

  return h(Modal, {
    title: form.id ? t('ops_edit_task') : t('ops_new_task'),
    onClose: props.onClose,
    width: 540,
    footer: h('div', { style:{ display:'flex', gap:8 } },
      h(Btn, { variant:'secondary', onClick:props.onClose }, t('cancel')),
      h(Btn, { variant:'primary', onClick:save }, saving ? h(Spinner) : t('save'))
    )
  },
    h('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
      h(Fld, { label: lang==='en' ? 'Linked Order (optional)' : 'Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ø±ØªØ¨Ø· (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)' },
        h(Select, { value:form.linked_order_id||'', options:orderOpts, onChange:function(v){ set('linked_order_id',v); } })
      ),
      h(Fld, { label: t('customer')+' *' },
        h(Select, { value:form.customer_id||'', options:custOpts, onChange:function(v){ set('customer_id',v); } })
      ),
      form.customer_id && h(Fld, { label: t('contact_person') },
        h(Select, { value:form.contact_person_id||'', options:contactOpts, onChange:function(v){ set('contact_person_id',v); } })
      ),
      h(Fld, { label: t('product')+' ('+t('optional')+')' },
        h(Select, { value:form.product_id||'', options:productOpts, onChange:function(v){ set('product_id',v); } })
      ),
      h(Fld, { label: t('description') },
        h(Textarea, { value:form.description, rows:3, onChange:function(v){ set('description',v); } })
      ),
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Fld, { label: t('deadline') },
          h(Input, { type:'datetime-local', value:form.deadline||'', onChange:function(v){ set('deadline',v); } })
        ),
        h(Fld, { label: t('ops_time') },
          h(Input, { value:form.time, placeholder: lang==='en'?'e.g. 2h':'Ù…Ø«Ø§Ù„: 2 Ø³Ø§Ø¹Ø©', onChange:function(v){ set('time',v); } })
        )
      )
    )
  );
}

/* â”€â”€ OpsTaskCard: a single task card in the kanban â”€â”€ */
function OpsTaskCard(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var task = props.task;
  var isOverdue = task.deadline && !task.completed_at && new Date(task.deadline) < new Date();

  return h('div', {
    draggable: true,
    onDragStart: function(e){ e.dataTransfer.setData('text/plain', String(task.id)); },
    style:{
      background: props.draggingId === task.id ? T.accentDim : T.bg,
      border: '1px solid ' + (isOverdue ? T.red : T.border),
      borderRadius: T.radius,
      padding: '10px 12px',
      marginBottom: 8,
      cursor: 'grab',
      boxShadow: T.shadow,
      opacity: props.draggingId === task.id ? 0.5 : 1,
      transition: 'box-shadow .15s',
    },
    onMouseEnter: function(e){ e.currentTarget.style.boxShadow = T.shadowLg; },
    onMouseLeave: function(e){ e.currentTarget.style.boxShadow = T.shadow; },
  },
    /* Task number + actions */
    h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 } },
      h('code', { style:{ fontSize:11, color:T.accent, fontWeight:700 } }, task.task_no),
      h('div', { style:{ display:'flex', gap:4 } },
        /* Arrow left (prev stage) */
        props.canMovePrev && h('button', {
          title: lang==='en' ? 'Move to previous stage' : 'Ù†Ù‚Ù„ Ù„Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©',
          onClick: function(e){ e.stopPropagation(); props.onMovePrev(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:14, padding:2, lineHeight:1 }
        }, 'â†'),
        /* Arrow right (next stage) */
        props.canMoveNext && h('button', {
          title: lang==='en' ? 'Move to next stage' : 'Ù†Ù‚Ù„ Ù„Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©',
          onClick: function(e){ e.stopPropagation(); props.onMoveNext(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.accent, fontSize:14, padding:2, lineHeight:1 }
        }, 'â†’'),
        h('button', {
          title: t('edit'),
          onClick: function(e){ e.stopPropagation(); props.onEdit(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:13, padding:2, lineHeight:1 }
        }, 'âœŽ'),
        h('button', {
          title: t('delete'),
          onClick: function(e){ e.stopPropagation(); if(confirm(t('confirm_delete'))) props.onDelete(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:13, padding:2, lineHeight:1 }
        }, 'âœ•')
      )
    ),
    /* Customer */
    h('div', { style:{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 } },
      task.customer_company || task.customer_name || 'â€”'
    ),
    /* Description */
    task.description && h('div', { style:{ fontSize:12, color:T.textMid, marginBottom:5, lineHeight:1.4 } }, task.description),
    /* Footer: deadline + time */
    h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 } },
      task.deadline && h(Badge, {
        label: 'ðŸ“… ' + fmtDate(task.deadline, lang),
        color: isOverdue ? 'red' : 'blue',
      }),
      task.time && h(Badge, { label:'â± '+task.time, color:'gray' }),
      task.contact_person_name && h(Badge, { label:'ðŸ‘¤ '+task.contact_person_name, color:'purple' })
    )
  );
}

/* â”€â”€ OpsKanbanColumn: one stage column â”€â”€ */
function OpsKanbanColumn(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var stage = props.stage;
  var tasks = props.tasks;
  var _over = useState(false); var isOver = _over[0]; var setOver = _over[1];
  var _rename = useState(false); var renaming = _rename[0]; var setRenaming = _rename[1];
  var _rname = useState(stage.name); var rname = _rname[0]; var setRname = _rname[1];

  function submitRename() {
    if (!rname.trim()) { setRenaming(false); return; }
    apiFetch('ops-stages/' + stage.id, { method:'PUT', body:JSON.stringify({ name:rname.trim() }) })
      .then(function(){ setRenaming(false); props.onReload(); });
  }

  function deleteStage() {
    if (!confirm(t('ops_delete_stage') + '?')) return;
    apiFetch('ops-stages/' + stage.id, { method:'DELETE' })
      .then(function(){ props.onReload(); })
      .catch(function(e){ alert(e.message || t('ops_stage_has_tasks')); });
  }

  return h('div', {
    style:{
      width: 260,
      flexShrink: 0,
      background: isOver ? T.accentDim : T.bgSub,
      border: '1px solid ' + (isOver ? T.accent : T.border),
      borderRadius: T.radiusLg,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 200px)',
      transition: 'border-color .15s, background .15s',
    },
    onDragOver: function(e){ e.preventDefault(); setOver(true); },
    onDragLeave: function(){ setOver(false); },
    onDrop: function(e){
      e.preventDefault(); setOver(false);
      var taskId = parseInt(e.dataTransfer.getData('text/plain'));
      if (taskId) props.onDropTask(taskId, stage);
    },
  },
    /* Column header */
    h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:10, flexShrink:0 } },
      renaming
        ? h('input', {
            autoFocus: true,
            value: rname,
            onChange: function(e){ setRname(e.target.value); },
            onKeyDown: function(e){ if(e.key==='Enter') submitRename(); if(e.key==='Escape') setRenaming(false); },
            onBlur: submitRename,
            style:{ flex:1, padding:'3px 8px', border:'1px solid '+T.accent, borderRadius:T.radius, fontSize:13, fontFamily:'inherit', background:T.bg, color:T.text }
          })
        : h('div', { style:{ fontWeight:700, fontSize:13, color:T.text, flex:1 } }, stage.name),
      h('span', { style:{ fontSize:11, color:T.textMute, background:T.border, borderRadius:99, padding:'1px 7px' } }, tasks.length),
      /* Rename button */
      h('button', {
        title: t('ops_rename_stage'), onClick:function(){ setRenaming(true); setRname(stage.name); },
        style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:12, padding:2 }
      }, 'âœŽ'),
      /* Delete button */
      h('button', {
        title: t('ops_delete_stage'), onClick: deleteStage,
        style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:12, padding:2 }
      }, 'ðŸ—‘')
    ),
    /* Task cards */
    h('div', { style:{ flex:1, overflowY:'auto', paddingBottom:4 } },
      tasks.length === 0
        ? h('div', { style:{ color:T.textMute, fontSize:12, textAlign:'center', padding:'20px 0' } }, t('ops_no_tasks'))
        : tasks.map(function(task){
            return h(OpsTaskCard, {
              key: task.id,
              task: task,
              draggingId: props.draggingId,
              canMovePrev: props.stageIndex > 0,
              canMoveNext: props.stageIndex < props.totalStages - 1,
              onMovePrev: props.onMovePrev,
              onMoveNext: props.onMoveNext,
              onEdit: props.onEdit,
              onDelete: props.onDelete,
            });
          })
    ),
    /* + Add Task button at bottom of column */
    props.onAddTask && h('button', {
      onClick: function(){ props.onAddTask(stage); },
      style:{ width:'100%', padding:'8px', border:'1px dashed '+T.border, borderRadius:T.radius,
        background:'transparent', color:T.textMute, cursor:'pointer', fontSize:12, fontFamily:'inherit',
        marginTop:8, transition:'all .15s' },
      onMouseEnter: function(e){ e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.color=T.accent; },
      onMouseLeave: function(e){ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMute; }
    }, '+ '+(lang==='en'?'Add Task':'Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø©'))
  );
}


/* -- DeliveryOrdersView: mobile-friendly page for delivery agent -- */
function DeliveryOrdersView(props) {
  var bs = props.bootstrap || {};
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang; var isRtl = i18n.isRtl;
  var authUser = props.authUser || {};
  var employees = asArr(bs.employees);
  var notifyWa  = props.whatsappNotify || '';

  useTopbar(t('delivery_orders'));

  /* Find employee linked to current user */
  var myEmp = employees.filter(function(e){ return String(e.user_id) === String(authUser.id); })[0];
  var isAdmin = !authUser.role || authUser.role === 'admin' || authUser.role_slug === 'admin' || authUser.is_admin == 1;

  function deliveryItemQueuedForPartial(item) {
    return !itemDelivered(item) && !!item.delivery_batch_id;
  }

  function deliveryOrderHasExplicitPartial(o) {
    var items = asArr(o.items);
    return items.length > 1 && items.some(deliveryItemQueuedForPartial);
  }

  /* Filter orders: ready to deliver or partial, assigned to me (admin sees all) */
  var orders = asArr(bs.orders).filter(function(o){
    if (isDone(o)) return false;
    if (!isAdmin && String(o.delivery_employee_id) !== String(myEmp && myEmp.id)) return false;
    return orderAtDelivery(o) || deliveryOrderHasExplicitPartial(o);
  });

  function buildWaMsg(o) {
    var cust = getCust(o, lang);
    var items = asArr(o.items).map(function(i){ return (lang==='en'&&i.product_name_en?i.product_name_en:i.product_name||'')+'x'+i.quantity; }).join(', ');
    var addr = o.rec_address || o.recipient_address || o.delivery_address || '';
    var map  = o.rec_map || o.recipient_map_url || o.delivery_map_url || '';
    var phone = o.rec_phone || o.recipient_phone || '';
    var qrLink = cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + o.id;
    return encodeURIComponent(
      (lang==='en'?'Delivery Order':'طلب توصيل') + ': #' + o.order_number + '\n' +
      (lang==='en'?'Customer':'الزبون') + ': ' + cust + '\n' +
      (phone ? (lang==='en'?'Phone':'الهاتف') + ': ' + phone + '\n' : '') +
      (addr  ? (lang==='en'?'Address':'العنوان') + ': ' + addr + '\n' : '') +
      (items ? (lang==='en'?'Items':'المنتجات') + ': ' + items + '\n' : '') +
      (map   ? (lang==='en'?'Map':'الخريطة') + ': ' + map + '\n' : '') +
      (lang==='en'?'Details':'التفاصيل') + ': ' + qrLink
    );
  }

  if (!myEmp && !isAdmin) {
    return h('div', { style:{ padding:32, textAlign:'center', color:T.textMute } },
      h('div', { style:{ fontSize:40, marginBottom:12 } }, '🚚'),
      h('div', { style:{ fontSize:14, fontWeight:600 } },
        lang==='en' ? 'Your account is not linked to an employee profile.' : 'حسابك غير مرتبط بموظف في النظام.'
      )
    );
  }

  return h('div', { style:{ padding:'0 4px' } },
    orders.length === 0 && h(Card, { style:{ padding:40, textAlign:'center' } },
      h('div', { style:{ fontSize:48, marginBottom:12 } }, '🚚'),
      h('div', { style:{ color:T.textMute, fontSize:14 } }, t('no_delivery_orders'))
    ),
    orders.length > 0 && h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,alignItems:'start'}},
    orders.map(function(o) {
      var p = progOf(o);
      var cust = getCust(o, lang);
      var phone = o.rec_phone || o.recipient_phone || '';
      var addr  = o.rec_address || o.recipient_address || o.delivery_address || '';
      var map   = o.rec_map || o.recipient_map_url || o.delivery_map_url || '';
      var waPhone = phone.replace(/[^0-9]/g,'');
      var isPartial = deliveryOrderHasExplicitPartial(o);
      var readyItems = asArr(o.items).filter(function(item){ return deliveryItemQueuedForPartial(item); });
      var displayItems = isPartial ? readyItems : asArr(o.items);
      var secColor = isPartial ? '#d97706' : T.green;
      var secLabel = isPartial ? (lang==='en'?'Partial Delivery':'توصيل جزئي') : (lang==='en'?'Ready to Deliver':'جاهز للتوصيل');

      return h('div', { key:o.id },
      h(Card, { style:{ borderTop:'3px solid '+secColor, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 } },
                        /* Badge + order number */
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between'}},
          h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:12,color:secColor}},'#'+o.order_number),
          h('span',{style:{fontSize:10,fontWeight:600,color:secColor,background:isPartial?'#fef3c7':'#dcfce7',borderRadius:99,padding:'1px 7px'}},secLabel)
        ),
        h('div',{style:{fontSize:12,fontWeight:700,color:T.text}},cust),
        h('div',{style:{background:T.bgSub,borderRadius:99,height:4,overflow:'hidden',marginTop:4}},
          h('div',{style:{width:p+'%',background:p>=100?T.green:T.accent,height:'100%',borderRadius:99}})
        ),
        h('div',{style:{fontSize:10,color:T.textMute}},p+'%'),
        h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:8}},
          displayItems.map(function(item){
            var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'—');
            return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0'}},
              h('span',{style:{color:T.textMid,fontWeight:500}},iName),
              h('span',{style:{color:T.textMute,flexShrink:0}},'×'+item.quantity)
            );
          })
        ),
        h('div',{style:{display:'flex',gap:8,marginTop:8}},
          h('button',{
            onClick:function(){window.open(cfg().root.replace(/\/+$/,'')+'/qr-contact?order_id='+o.id+'&print=1','_blank');},
            style:{flex:1,padding:'9px 6px',background:T.bgSub,color:T.textMid,border:'1px solid '+T.border,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}
          },'🖨 '+(lang==='en'?'Print':'اطبع')),
          h('button',{
            onClick:function(){
              var itemIds=displayItems.map(function(item){return item.id;});
              apiFetch('orders/'+o.id+'/partial-deliver',{method:'POST',body:JSON.stringify({item_ids:itemIds})})
                .then(props.onSilentReload||props.onReload);
            },
            style:{flex:1,padding:'9px 6px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}
          },'✅ '+(lang==='en'?'Delivered':'تم التوصيل'))
        )
      ));
    })),


    /* External Tasks section */
    (function(){
      var myTasks = asArr(bs['ops-tasks']).filter(function(task){
        return task.is_external == 1 && task.status !== 'done' &&
          (myEmp ? String(task.assigned_employee_id) === String(myEmp.id) : false);
      });
      if (!myTasks.length) return null;
      return h('div', { style:{ marginTop:24 } },
        h('div',{style:{fontWeight:700,fontSize:14,color:T.text,marginBottom:10,display:'flex',alignItems:'center',gap:6}},
          '📋 '+(lang==='en'?'External Tasks':'المهام الخارجية'),
          h('span',{style:{background:T.accent,color:'#fff',borderRadius:99,padding:'1px 8px',fontSize:11}},myTasks.length)
        ),
        myTasks.map(function(task){
          return h(Card, { key:task.id, style:{ marginBottom:10, padding:'12px 14px' } },
            h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}},
              h('div',{style:{flex:1}},
                h('div',{style:{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}},task.title||task.description||'—'),
                task.description && task.title && h('div',{style:{fontSize:11,color:T.textMute,marginBottom:4}},task.description),
                task.deadline && h('div',{style:{fontSize:11,color:T.amber}},'🗓 '+fmtDate(task.deadline,getLang()))
              ),
              h('button',{
                onClick:function(){
                  apiFetch('ops-tasks/'+task.id,{method:'PUT',body:JSON.stringify(Object.assign({},task,{status:'done'}))})
                    .then(props.onSilentReload||props.onReload);
                },
                style:{padding:'6px 12px',background:'#dcfce7',color:'#16a34a',border:'1px solid #bbf7d0',borderRadius:T.radius,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}
              },'✅ '+(lang==='en'?'Done':'تم'))
            )
          );
        })
      );
    })()
  );
}

/* â”€â”€ OperationsTasksView: main page â”€â”€ */
function OperationsTasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var departments = asArr(bs.departments);

  /* State */
  var _tab      = useState(departments.length ? String(departments[0].id) : '');
  var activeTab = _tab[0]; var setActiveTab = _tab[1];

  var _view     = useState('kanban'); /* 'kanban' | 'completed' */
  var view      = _view[0]; var setView = _view[1];

  var _stages   = useState([]); var stages = _stages[0]; var setStages = _stages[1];
  var _tasks    = useState([]); var tasks  = _tasks[0];  var setTasks  = _tasks[1];
  var _completed = useState([]); var completedTasks = _completed[0]; var setCompleted = _completed[1];

  var _loading  = useState(true); var loading = _loading[0]; var setLoading = _loading[1];
  var _dragging = useState(null); var draggingId = _dragging[0]; var setDraggingId = _dragging[1];

  var _form     = useState(null); var form = _form[0]; var setForm = _form[1];
  var _finalModal = useState(null); var finalModal = _finalModal[0]; var setFinalModal = _finalModal[1];
  /* { task, currentDeptId, nextDeptId } */

  /* Load stages for active department */
  function loadStages(deptId) {
    if (!deptId) return;
    setLoading(true);
    apiFetch('departments/' + deptId + '/ops-stages')
      .then(function(d){ setStages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }

  /* Load all active tasks */
  function loadTasks() {
    apiFetch('ops-tasks')
      .then(function(d){ setTasks(Array.isArray(d) ? d : []); })
      .catch(function(){});
  }

  /* Load completed tasks */
  function loadCompleted() {
    apiFetch('ops-tasks/completed')
      .then(function(d){ setCompleted(Array.isArray(d) ? d : []); })
      .catch(function(){});
  }

  function reload() { loadStages(activeTab); loadTasks(); }

  useEffect(function(){
    if (activeTab) loadStages(activeTab);
  }, [activeTab]);

  useEffect(function(){
    loadTasks();
  }, []);

  useEffect(function(){
    if (view === 'completed') loadCompleted();
  }, [view]);

  /* Stats for topbar */
  var totalTasks  = tasks.length;
  var totalStagesCount = stages.length;

  useTopbar(t('operations_tasks'), h('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
    h(Btn, { variant: view==='kanban'    ? 'primary' : 'secondary', size:'sm', onClick:function(){ setView('kanban'); } },
      lang==='en' ? 'âŠž Board' : 'âŠž Ø§Ù„Ù„ÙˆØ­Ø©'),
    h(Btn, { variant: view==='completed' ? 'primary' : 'secondary', size:'sm', onClick:function(){ setView('completed'); } },
      t('ops_completed_tasks')),
    h(Btn, { variant:'primary', onClick:function(){ setForm({}); } }, '+ '+t('ops_new_task'))
  ));

  /* â”€â”€ Completed Tasks view â”€â”€ */
  if (view === 'completed') {
    var completedCols = [
      { key:'task_no', label:t('ops_task_no'), render:function(r){ return h('code',{style:{color:T.accent,fontWeight:700}},r.task_no); } },
      { key:'customer', label:t('customer'), render:function(r){ return r.customer_company||r.customer_name||'â€”'; } },
      { key:'deadline', label:t('deadline'), render:function(r){
        if (!r.deadline) return 'â€”';
        return fmtDate(r.deadline, lang);
      }},
      { key:'time', label:t('ops_time'), render:function(r){ return r.time||'â€”'; } },
      { key:'completed_at', label:t('ops_completed_at'), render:function(r){ return r.completed_at ? fmtDateTime(r.completed_at, lang) : 'â€”'; } },
      { key:'status', label:t('status'), render:function(r){
        if (!r.deadline || !r.completed_at) return 'â€”';
        var onTime = new Date(r.completed_at) <= new Date(r.deadline);
        return h(Badge, { label: onTime ? t('ops_on_time') : t('ops_delayed'), color: onTime ? 'green' : 'red' });
      }},
    ];
    return h('div', null,
      h(DataTable, {
        columns: completedCols,
        rows: completedTasks,
        actions: function(r){ return h(Btn, { size:'sm', variant:'secondary',
          onClick:function(){
            if (!confirm(lang==='en'?'Reopen this task?':'Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ù‡Ù…Ø©ØŸ')) return;
            apiFetch('ops-tasks/'+r.id+'/reopen',{method:'POST'}).then(function(){ loadCompleted(); loadTasks(); });
          }
        }, t('ops_reopen')); }
      })
    );
  }

  /* â”€â”€ Kanban view â”€â”€ */
  var activeDept = findBy(departments, 'id', parseInt(activeTab));

  /* Get tasks positioned in this specific stage */
  function tasksInStage(stageId, isFirst) {
    var positioned = tasks.filter(function(task){
      var pos = asArr(task.positions).find(function(p){ return String(p.department_id) === String(activeTab); });
      return pos && String(pos.stage_id) === String(stageId);
    }).sort(function(a,b){
      var pa = asArr(a.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
      var pb = asArr(b.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
      return (pa?parseInt(pa.sort_order):0) - (pb?parseInt(pb.sort_order):0);
    });
    /* If this is the first stage, also show tasks with no position record yet */
    if (isFirst) {
      var unpositioned = tasks.filter(function(task){
        var pos = asArr(task.positions).find(function(p){ return String(p.department_id) === String(activeTab); });
        return !pos;
      });
      /* avoid duplicates */
      var positionedIds = positioned.map(function(t){ return t.id; });
      unpositioned = unpositioned.filter(function(t){ return positionedIds.indexOf(t.id) < 0; });
      return positioned.concat(unpositioned);
    }
    return positioned;
  }

  /* Find previous/next department in sequence */
  function getNextDept(currentDeptId) {
    var idx = departments.findIndex(function(d){ return String(d.id)===String(currentDeptId); });
    if (idx < 0 || idx >= departments.length - 1) return null;

    /* Department flow rule: skip next dept if task has no linked_order_id AND next dept name contains 'Ø·Ø¨Ø§Ø¹' or 'print' */
    /* Note: The rule checks by name heuristic â€” exact dept marked as Production in app context */
    return departments[idx + 1] || null;
  }

  /* Drop a task into a stage */
  function handleDropTask(taskId, stage) {
    setDraggingId(null);
    var stageList = stages;
    var isLastStage = stageList.length > 0 && stage.id === stageList[stageList.length - 1].id;

    if (isLastStage) {
      /* Show final-stage modal */
      var task = findBy(tasks, 'id', taskId);
      if (!task) return;
      var nextDept = getNextDept(activeTab);
      setFinalModal({ task:task, currentDeptId:activeTab, nextDeptId: nextDept ? String(nextDept.id) : null });
      return;
    }

    apiFetch('ops-tasks/' + taskId + '/move', {
      method: 'POST',
      body: JSON.stringify({ stage_id: stage.id, department_id: parseInt(activeTab), sort_order: 0 })
    }).then(function(){ loadTasks(); });
  }

  /* Move task to previous stage via arrow */
  function handleMovePrev(task) {
    var pos = asArr(task.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
    var currentIdx = stages.findIndex(function(s){ return pos && String(s.id)===String(pos.stage_id); });
    if (currentIdx <= 0) return;
    var prevStage = stages[currentIdx - 1];
    apiFetch('ops-tasks/'+task.id+'/move', { method:'POST', body:JSON.stringify({ stage_id:prevStage.id, department_id:parseInt(activeTab), sort_order:0 }) })
      .then(function(){ loadTasks(); });
  }

  /* Move task to next stage via arrow (triggers final-stage modal if applicable) */
  function handleMoveNext(task) {
    var pos = asArr(task.positions).find(function(p){ return String(p.department_id)===String(activeTab); });
    var currentIdx = stages.findIndex(function(s){ return pos && String(s.id)===String(pos.stage_id); });
    if (currentIdx < 0 || currentIdx >= stages.length - 1) {
      /* Already at last stage â€” show modal */
      var nextDept = getNextDept(activeTab);
      setFinalModal({ task:task, currentDeptId:activeTab, nextDeptId: nextDept ? String(nextDept.id) : null });
      return;
    }
    var nextStage = stages[currentIdx + 1];
    apiFetch('ops-tasks/'+task.id+'/move', { method:'POST', body:JSON.stringify({ stage_id:nextStage.id, department_id:parseInt(activeTab), sort_order:0 }) })
      .then(function(){ loadTasks(); });
  }

  /* Add a stage */
  function addStage() {
    var name = prompt(lang==='en' ? 'Stage name:' : 'Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø­Ù„Ø©:');
    if (!name || !name.trim()) return;
    apiFetch('departments/' + activeTab + '/ops-stages', { method:'POST', body:JSON.stringify({ name:name.trim() }) })
      .then(function(){ loadStages(activeTab); });
  }

  /* Delete a task */
  function deleteTask(task) {
    apiFetch('ops-tasks/' + task.id, { method:'DELETE' }).then(function(){ loadTasks(); });
  }

  return h('div', null,
    /* Department tabs */
    h('div', { style:{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center' } },
      departments.map(function(dept){
        var active = String(dept.id) === String(activeTab);
        return h('button', {
          key: dept.id,
          onClick: function(){ setActiveTab(String(dept.id)); },
          style:{
            padding:'6px 16px', borderRadius:T.radius, border:'1px solid '+(active?T.accent:T.border),
            background: active ? T.accent : T.bg,
            color: active ? '#fff' : T.textMid,
            fontWeight: active ? 700 : 400,
            cursor:'pointer', fontSize:13, fontFamily:'inherit',
            transition:'all .15s',
          }
        }, h('span', { style:{ display:'flex', alignItems:'center', gap:6 } },
          dept.color && h('span', { style:{ width:8, height:8, borderRadius:'50%', background:dept.color, display:'inline-block' } }),
          ln(dept, lang)
        ));
      }),
      h(Btn, { size:'sm', variant:'secondary', onClick:addStage }, '+ '+t('ops_add_stage'))
    ),

    /* Kanban board */
    loading
      ? h(PageLoader)
      : stages.length === 0
        ? h(Card, { style:{ padding:40, textAlign:'center' } },
            h('div', { style:{ fontSize:32, marginBottom:10 } }, 'ðŸ“‹'),
            h('div', { style:{ color:T.textMute } }, t('ops_no_stages'))
          )
        : h('div', {
            style:{ display:'flex', gap:14, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' },
            onDragStart: function(e){ setDraggingId(parseInt(e.dataTransfer.getData('text/plain'))||null); },
            onDragEnd:   function(){ setDraggingId(null); },
          },
            stages.map(function(stage, si){
              return h(OpsKanbanColumn, {
                key: stage.id,
                stage: stage,
                tasks: tasksInStage(stage.id, si === 0),
                draggingId: draggingId,
                stageIndex: si,
                totalStages: stages.length,
                onDropTask: handleDropTask,
                onMovePrev: handleMovePrev,
                onMoveNext: handleMoveNext,
                onEdit: function(task){ setForm(Object.assign({}, task)); },
                onDelete: deleteTask,
                onReload: function(){ loadStages(activeTab); loadTasks(); },
                onAddTask: function(){ setForm({ _targetStageId: stage.id, _targetDeptId: activeTab }); },
              });
            })
          ),

    /* Create/Edit task form */
    form !== null && h(OpsTaskForm, {
      task: form.id ? form : null,
      bootstrap: props.bootstrap,
      onClose: function(){ setForm(null); },
      onSaved: function(newTaskId){
        /* If created from a specific stage button, move the task there */
        if (!form.id && form._targetStageId && newTaskId) {
          apiFetch('ops-tasks/'+newTaskId+'/move', {
            method:'POST',
            body: JSON.stringify({ stage_id: parseInt(form._targetStageId), department_id: parseInt(form._targetDeptId||activeTab), sort_order:0 })
          }).then(function(){ setForm(null); reload(); });
        } else {
          setForm(null); reload();
        }
      },
    }),

    /* Final stage modal */
    finalModal && h(Modal, {
      title: t('ops_final_stage_title'),
      onClose: function(){ setFinalModal(null); },
      width: 420,
      footer: h('div', { style:{ display:'flex', gap:8, justifyContent:'center' } },
        h(Btn, { variant:'secondary', onClick:function(){ setFinalModal(null); } }, t('cancel')),
        h(Btn, { variant:'primary', onClick:function(){
          /* Finish task */
          apiFetch('ops-tasks/'+finalModal.task.id+'/complete', { method:'POST' })
            .then(function(){ setFinalModal(null); loadTasks(); });
        }}, t('ops_finish_task')),
        finalModal.nextDeptId && h(Btn, { variant:'success', onClick:function(){
          /* Move task to first stage of next department */
          apiFetch('departments/'+finalModal.nextDeptId+'/ops-stages')
            .then(function(nextStages){
              var firstStage = Array.isArray(nextStages) && nextStages[0] ? nextStages[0] : null;
              return apiFetch('ops-tasks/'+finalModal.task.id+'/move', {
                method:'POST',
                body: JSON.stringify({
                  stage_id:       firstStage ? firstStage.id : null,
                  department_id:  parseInt(finalModal.nextDeptId),
                  sort_order:     0,
                })
              });
            })
            .then(function(){
              setFinalModal(null);
              setActiveTab(finalModal.nextDeptId);
              loadStages(finalModal.nextDeptId);
              loadTasks();
            })
            .catch(function(e){ alert(e.message); setFinalModal(null); });
        }}, t('ops_move_next_dept'))
      )
    },
      h('div', { style:{ textAlign:'center', padding:'10px 0' } },
        h('div', { style:{ fontSize:36, marginBottom:12 } }, 'ðŸ'),
        h('p', { style:{ color:T.textMid, lineHeight:1.6 } }, t('ops_final_stage_msg'))
      )
    )
  );
}

/* â•â•â• ROOT APP â•â•â• */
/* â•â•â• AUTH HELPERS â•â•â• */
