function OrdersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var pauseReasons = (props.branding && props.branding.pause_reasons && props.branding.pause_reasons.length) ? props.branding.pause_reasons : (props.pauseReasons || []);
  var orders    = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var customers = asArr(bs.customers);
  var products  = asArr(bs.products);
  var statuses  = asArr(bs.statuses);
  var employees = asArr(bs.employees);
  var suppliers = asArr(bs.suppliers);
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var _p = useState(null); var preview = _p[0], setPreview = _p[1];
  var _ct = useState([]); var contacts = _ct[0], setContacts = _ct[1];
  var _dp = useState(null); var delayPrompt = _dp[0], setDelayPrompt = _dp[1]; /* {orderId, reason} */
  var _pp = useState(null); var pausePrompt = _pp[0], setPausePrompt = _pp[1]; /* {orderId, reason} */
  var _or = useState([]); var orderRecipients = _or[0], setOrderRecipients = _or[1];
  var _selRec = useState(''); var selRecId = _selRec[0], setSelRecId = _selRec[1];
  var _custRecs = useState([]); var custRecs = _custRecs[0], setCustRecs = _custRecs[1];
  var search = useSearch().q;
  var _q = useState(orders.map(function(o){ return o.id; })); var queueIds = _q[0], setQueueIds = _q[1];

  /* compute expected minutes for one order â€” production steps only (no delivery) */
  function orderExpectedMins(order) {
    var total = 0;
    asArr(order.items).forEach(function(item) {
      asArr(item.steps).forEach(function(step) {
        if (isDeliveryStep(step)) return;
        var hrs = parseFloat(step.expected_hours) || 0;
        var stepNameNorm = (step.step_name||'').toLowerCase().trim();
        if (!hrs && item.product_id) {
          var ps = asArr(bs.product_steps||[]).filter(function(p){
            return p.product_id == item.product_id &&
              (p.step_name||'').toLowerCase().trim() === stepNameNorm;
          })[0];
          if (ps) {
            var qty = parseFloat(item.quantity)||1;
            var qpu = Math.max(1, parseInt(ps.qty_per_unit)||1);
            hrs = (parseFloat(ps.expected_hours)||0) * (ps.scales_with_qty ? qty/qpu : 1);
          }
        }
        if (hrs > 0) total += hrs * 60;
      });
    });
    return Math.round(total);
  }
  function orderDeliveryMins(order) {
    var total = 0;
    asArr(order.items).forEach(function(item) {
      asArr(item.steps).forEach(function(step) {
        if (step.is_delivery != 1) return;
        var hrs = parseFloat(step.expected_hours) || 0;
        total += hrs * 60;
      });
    });
    return Math.round(total);
  }

  function stepActualStats(step) {
    if (!step || step.is_delivery == 1) return { mins:0, secs:0, hasActual:false };
    var storedActualMins = parseInt(step.actual_duration_minutes, 10);
    if (storedActualMins > 0 && step.status_slug !== 'in_progress') {
      return { mins:storedActualMins, secs:storedActualMins * 60, hasActual:true };
    }
    var startedAt = step.actual_started_at || step.started_at;
    if (!startedAt) return { mins:0, secs:0, hasActual:false };
    var nowMs = Date.now();
    var endAt = step.actual_completed_at || step.completed_at;
    var startMs = new Date(String(startedAt).replace(' ','T')).getTime();
    var endMs = endAt ? new Date(String(endAt).replace(' ','T')).getTime() : nowMs;
    if (!isFinite(startMs) || !isFinite(endMs) || endMs < startMs) return { mins:0, secs:0, hasActual:false };
    var pausedSecs = (parseInt(step.paused_seconds, 10) || 0);
    var totalActiveMs = Math.max(0, (endMs - startMs) - (pausedSecs * 1000));
    return { mins:Math.round(totalActiveMs / 60000), secs:Math.round(totalActiveMs / 1000), hasActual:totalActiveMs > 0 };
  }

  /* build sorted queue â€” pending + in_progress, sorted by queue_order */
  function getQueue() {
    return orders.slice().sort(function(a,b){
      return (parseInt(a.queue_order)||9999) - (parseInt(b.queue_order)||9999);
    });
  }

  /* compute estimated completion for each order in queue */
  function getEstCompletions() {
    var queue = getQueue();
    var now = Date.now();
    var cursor = now;
    var map = {};
    queue.forEach(function(o) {
      var mins = orderExpectedMins(o);
      cursor += mins * 60 * 1000;
      map[o.id] = cursor;
    });
    return map;
  }

  function moveOrder(orderId, dir) {
    var queue = getQueue();
    var idx = queue.findIndex(function(o){ return String(o.id)===String(orderId); });
    if (idx < 0) return;
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= queue.length) return;
    var arr = queue.slice();
    var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
    var ids = arr.map(function(o){ return o.id; });
    apiFetch('orders/requeue', {method:'POST', body:JSON.stringify({ids:ids})})
      .then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }

  var blank = { order_number:'', customer_id:'', contact_person_id:'', contact_person_name:'', contact_person_phone:'', delivery_address:'', delivery_map_url:'', delivery_notes:'', priority:'normal', is_urgent:0, deadline:'', delivery_date:'', items:[], contact_name:'', contact_phone:'', contact_email:'', contact_map:'', contact_address:'', is_temp_contact:0, delivery_employee_id:'' };

  /* open new order form â€” pre-fill order_number with CS-0 prefix for user to complete */
  function openNewOrder() {
    setForm(Object.assign({}, blank, { order_number: 'CS-0' }));
  }

  function onCustChange(cid) {
    setForm(function(f){ return Object.assign({}, f, { customer_id:cid, contact_person_id:'', contact_person_name:'', contact_person_phone:'' }); });
    setContacts([]);
    if (!cid) return;
    apiFetch('customers/'+cid+'/contacts').then(function(r){ setContacts(Array.isArray(r)?r:[]); }).catch(function(){});
    apiFetch('customers/'+cid+'/recipients').catch(function(){ return []; })
      .then(function(r){
        setCustRecs(Array.isArray(r) ? r.filter(function(rec){ return rec.is_active!=0; }) : []);
      });
    var c = findBy(customers, 'id', cid);
    if (c) setForm(function(f){ return Object.assign({}, f, {
      customer_id: cid,
      delivery_address: c.address||f.delivery_address,
      delivery_map_url: c.map_url||f.delivery_map_url
    }); });
  }
  function addItem() { setForm(function(f){ return Object.assign({}, f, { items: f.items.concat([{product_id:'',product_name:'',product_name_en:'',quantity:1,notes:''}]) }); }); }
  function removeItem(idx) { setForm(function(f){ return Object.assign({}, f, { items: f.items.filter(function(_,i){ return i!==idx; }) }); }); }
  function updateItem(idx, k, v) {
    setForm(function(f){
      return Object.assign({}, f, { items: f.items.map(function(it, i){
        if (i !== idx) return it;
        var patch = {}; patch[k] = v;
        if (k === 'product_id') { var p = findBy(products,'id',v); patch.product_name = p ? p.name : ''; patch.product_name_en = p ? (p.name_en||'') : ''; }
        return Object.assign({}, it, patch);
      })});
    });
  }
  function save() {
    if (!form.deadline) { alert(t('no_deadline_warn')); return; }
    var payload = Object.assign({}, form);
    if (!payload.order_number) payload.order_number = 'ORD-' + Date.now().toString(36).toUpperCase();
    payload.recipients = orderRecipients;
    var prom = form.id
      ? apiFetch('orders/'+form.id, {method:'PUT', body:JSON.stringify(payload)})
      : apiFetch('orders', {method:'POST', body:JSON.stringify(payload)}).then(function(res){ if(res && res.id) setTimeout(function(){ openPrintWithLang(res, lang); }, 300); });
    prom.then(function(){ setForm(null); if(props.onSilentReload) props.onSilentReload(); else props.onReload(); }).catch(function(){ setForm(null); });
  }
  function del(id) {
    if (!confirm(t('confirm_delete'))) return;
    apiFetch('orders/'+id, {method:'DELETE'})
      .then(function(res){
        if (res && res.code === 'error') { alert(t('delete_blocked')); return; }
        props.onReload();
      })
      .catch(function(){ alert(t('delete_blocked')); });
  }
  function cancelOrder(id) {
    if (!confirm(t('confirm_stop'))) return;
    apiFetch('orders/'+id+'/cancel', {method:'POST'}).then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }
  function forceComplete(id) {
    if (!confirm(t('confirm_force'))) return;
    apiFetch('orders/'+id+'/force-complete', {method:'POST'}).then(function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); });
  }
  /* startStep: starts a pending step â€” checks deadline after */
  function startStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/start', {method:'POST'})
      .then(function(res){
        apiFetch('orders/'+orderId).then(function(updated){
          if (updated && updated.id) {
            setPreview(null);
            setTimeout(function(){ setPreview(updated); }, 50);
          }
          if (props.onSilentReload) props.onSilentReload();
        });
        if (res && res.needs_delay_reason) {
          setDelayPrompt({orderId: res.order_id || orderId, reason:''});
        }
      })
      .catch(function(e){ alert(e.message||t('error')); });
  }

  /* completeStep: completes an in_progress step â€” checks deadline after */
  function completeStep(stepId, orderId, completedByIds) {
    var body = completedByIds && completedByIds.length ? JSON.stringify({completed_by_ids: completedByIds}) : undefined;
    apiFetch('steps/'+stepId+'/advance', {method:'POST', body: body})
      .then(function(res){
        // Prompt delay reason if server says deadline passed
        if (res && res.needs_delay_reason) {
          setDelayPrompt({orderId: res.order_id || orderId, reason:''});
        }
        apiFetch('orders/'+orderId).then(function(updated){
          if (!updated || !updated.id) return;
          if (updated.is_done == 1 || updated.is_done === '1' || updated.is_done === true) {
            setPreview(null);
            props.onReload();
            setTimeout(function(){ if (props.onSilentReload) props.onSilentReload(); }, 800);
          } else {
            if (props.onSilentReload) props.onSilentReload();
            setPreview(null);
            setTimeout(function(){ setPreview(updated); }, 50);
          }
        });
      });
  }

  /* pauseStep: opens pause prompt for a specific step */
  function pauseStep(stepId, orderId, stepLabel, stepNameAr, stepNameEn) {
    setPausePrompt({stepId:stepId, orderId:orderId, reason:'', machine:'', stepLabel:stepLabel||'', stepNameAr:stepNameAr||'', stepNameEn:stepNameEn||''});
  }
  /* resumeStep: resumes a paused step */
  function resumeStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/resume', {method:'POST'})
      .then(function(){
        apiFetch('orders/'+orderId).then(function(updated){
          if (updated && updated.id) setPreview(updated);
          if (props.onSilentReload) props.onSilentReload();
        });
      });
  }

  /* pauseOrder (order-level, kept for resume button on row) */
  function pauseOrder(orderId) { setPausePrompt({orderId:orderId, reason:''}); }
  function resumeOrder(orderId) {
    apiFetch('orders/'+orderId+'/resume', {method:'POST'})
      .then(function(){ if (props.onSilentReload) props.onSilentReload(); });
  }

  var filtered = orders.filter(function(o){
    if (!search) return true;
    return (o.order_number + getCust(o) + getRec(o)).toLowerCase().indexOf(search.toLowerCase()) >= 0;
  });
  useTopbar(t('n_active',orders.length), h(Btn, { variant:'primary', onClick:openNewOrder }, '+ '+t('new_order')));

  return h('div', null,
    filtered.length === 0
      ? h(Card, { style:{ padding:40, textAlign:'center' } }, h('div', { style:{ fontSize:40, marginBottom:12 } }, 'ðŸ“‹'), h('div', { style:{ color:T.textMute } }, search?t('no_results'):t('no_active_orders')))
      : (function(){
          var queue = getQueue();
          var estMap = getEstCompletions();
          var queueIds = queue.map(function(o){ return o.id; });
          return filtered.map(function(order){
            var qpos = queueIds.indexOf(order.id);
            return h(OrderRow, { key:order.id, order:order, statuses:statuses,
              queuePos: qpos,
              queueLen: queue.length,
              expectedMins: orderExpectedMins(order),
              deliveryMins: orderDeliveryMins(order),
              estCompletion: estMap[order.id],
              onMoveUp:   function(){ moveOrder(order.id, -1); },
              onMoveDown: function(){ moveOrder(order.id,  1); },
              onPreview:function(){
                apiFetch('orders/'+order.id).then(function(fresh){
                  setPreview(fresh && fresh.id ? fresh : order);
                  if(props.onSilentReload) props.onSilentReload();
                }).catch(function(){ setPreview(order); });
              },
              onEdit:function(){
        var normalizedItems = asArr(order.items).map(function(item){
          /* Auto-fill notes from product description if notes are empty */
          var prod = products.find(function(p){ return String(p.id)===String(item.product_id); });
          var autoNotes = (item.notes && item.notes.trim()) ? item.notes : (prod ? (lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'')) : '');
          return {
            id:              item.id || null,
            product_id:      String(item.product_id||''),
            product_name:    item.product_name||'',
            product_name_en: item.product_name_en||(prod?prod.name_en||'':''),
            quantity:        parseInt(item.quantity)||1,
            notes:           autoNotes,
            steps:           item.steps||[]
          };
        });
        setForm(Object.assign({},order,{items:normalizedItems}));
        setOrderRecipients(asArr(order.recipients));
        setSelRecId('');
        setCustRecs([]);
        setContacts([]);
        if (order.customer_id) {
          Promise.all([
            apiFetch('customers/'+order.customer_id+'/recipients').catch(function(){ return []; }),
            apiFetch('customers/'+order.customer_id+'/contacts').catch(function(){ return []; })
          ]).then(function(results){
            setCustRecs(Array.isArray(results[0]) ? results[0].filter(function(r){ return r.is_active!=0; }) : []);
            setContacts(Array.isArray(results[1]) ? results[1] : []);
          });
        }
      },
              onDelete:function(){ del(order.id); },
              onPrint:function(){ openPrintWithLang(order, lang); },
              onStart:function(stepId, orderId){ startStep(stepId, orderId); },
              onAdvance:function(stepId, completedByIds){ completeStep(stepId, order.id, completedByIds); },
              onCancel:function(){ cancelOrder(order.id); },
              onForceComplete:function(){ forceComplete(order.id); },
              onPause:function(){ pauseOrder(order.id); },
              onResume:function(){ resumeOrder(order.id); },
            });
          });
        })(),
    /* Delay reason prompt â€” linked to Settings pause reasons */
    delayPrompt && h(Modal, {
      title:'âš ï¸ '+t('delay_reason_title'), onClose:function(){setDelayPrompt(null);}, width:460,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setDelayPrompt(null);}},t('delay_skip')),
        h(Btn,{variant:'primary',disabled:!delayPrompt.reason.trim(),onClick:function(){
          if (!delayPrompt.reason.trim()) return;
          apiFetch('orders/'+delayPrompt.orderId+'/delay-reason',{method:'POST',body:JSON.stringify({reason:delayPrompt.reason})})
            .then(function(){ setDelayPrompt(null); if(props.onSilentReload) props.onSilentReload(); });
        }},t('delay_submit'))
      )
    },
      h('p',{style:{color:T.textMid,marginBottom:12,fontSize:13}},t('delay_reason_prompt')),
      pauseReasons.length > 0
        ? h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginBottom:12}},
            pauseReasons.map(function(r,i){
              var label = (lang==='en' && r.en) ? r.en : r.ar;
              var isSel = delayPrompt.reason === label;
              return h('button',{key:i,onClick:function(){ setDelayPrompt(function(d){ return Object.assign({},d,{reason:label,isOther:false}); }); },
                style:{padding:'9px 14px',borderRadius:T.radius,border:'2px solid '+(isSel?T.accent:T.border),
                  background:isSel?T.accentBg:T.bgSub,color:isSel?T.accent:T.text,
                  cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:isSel?600:400,transition:'all .15s'}
              },label);
            }),
            h('button',{onClick:function(){ setDelayPrompt(function(d){ return Object.assign({},d,{reason:'',isOther:true}); }); },
              style:{padding:'9px 14px',borderRadius:T.radius,border:'2px solid '+(delayPrompt.isOther?T.accent:T.border),
                background:delayPrompt.isOther?T.accentBg:T.bgSub,color:delayPrompt.isOther?T.accent:T.textMute,
                cursor:'pointer',fontSize:13,fontFamily:'inherit',transition:'all .15s'}
            },lang==='en'?'Other...':'Ø£Ø®Ø±Ù‰...')
          )
        : null,
      (delayPrompt.isOther || pauseReasons.length === 0) && h('textarea',{
        autoFocus: pauseReasons.length === 0,
        value:delayPrompt.reason,
        onChange:function(e){setDelayPrompt(function(d){return Object.assign({},d,{reason:e.target.value});});},
        placeholder:t('delay_reason_placeholder'),
        rows:3,
        style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,boxSizing:'border-box',marginTop:8}
      })
    ),
    /* Pause prompt */
    pausePrompt && h(PauseModal, {
      pauseReasons: pauseReasons,
      stepLabel: pausePrompt.stepLabel || '',
      onClose: function(){ setPausePrompt(null); },
      onConfirm: function(reason, machine){
        var url = pausePrompt.stepId
          ? 'steps/'+pausePrompt.stepId+'/pause'
          : 'orders/'+pausePrompt.orderId+'/pause';
        apiFetch(url,{method:'POST',body:JSON.stringify({reason:reason, machine:machine||''})})
          .then(function(){
            setPausePrompt(null);
            if (pausePrompt.orderId) {
              apiFetch('orders/'+pausePrompt.orderId).then(function(updated){
                if (updated && updated.id) setPreview(updated);
              });
            }
            if(props.onSilentReload) props.onSilentReload();
          });
      }
    }),
    /* Form modal */
    form && h(Modal, {
      title:form.id?t('edit_order'):t('new_order'), subtitle:form.id?'#'+form.order_number:null,
      onClose:function(){ setForm(null); }, width:620,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);setOrderRecipients([]);setSelRecId('');}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    },
      h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
        h(Input, { label:t('order_number'), value:form.order_number, placeholder:'ORD-...', onChange:function(v){ setForm(function(f){return Object.assign({},f,{order_number:v});}); } }),
        h(Select, { label:t('priority'), value:form.priority, onChange:function(v){ setForm(function(f){return Object.assign({},f,{priority:v});}); }, options:[{value:'normal',label:t('normal')},{value:'high',label:t('high')},{value:'low',label:t('low')}] }),
        h(Select, { label:t('customer'), value:form.customer_id, onChange:onCustChange, options:customers.map(function(c){ return {value:c.id, label:(lang==='en'&&(c.company_name_en||c.name_en)) ? (c.company_name_en||c.name_en) : (c.company_name||c.name)}; }) }),
        h(Select, { label:'ðŸ‘¤ '+t('contact_person_lbl'), value:String(form.contact_person_id||''),
          onChange:function(v){
            var cp = findBy(contacts,'id',v);
            setForm(function(f){ return Object.assign({},f,{
              contact_person_id: v,
              contact_person_name: cp ? cp.name : '',
              contact_person_phone: cp ? cp.phone : ''
            }); });
          },
          options:contacts.map(function(c){ var nm=(lang==='en'&&c.name_en)?c.name_en:c.name; var jt=(lang==='en'&&c.job_title_en)?c.job_title_en:c.job_title; return {value:String(c.id),label:nm+(jt?' ('+jt+')':'')}; }),
          placeholder: contacts.length>0 ? 'â€” '+t('choose')+' â€”' : 'â€” '+t('no_contacts')+' â€”'
        }),
        h(Select, { label:'ðŸšš '+(lang==='en'?'Delivery Agent':'Ù…Ù†Ø¯ÙˆØ¨ Ø§Ù„ØªÙˆØµÙŠÙ„'),
          value:String(form.delivery_employee_id||''),
          onChange:function(v){ setForm(function(f){ return Object.assign({},f,{delivery_employee_id:v}); }); },
          options: (function(){
            var deliveryEmpIds = {};
            /* From product_steps templates (assigned_employee_id / assigned_employee_ids) */
            asArr(bs.product_steps||[]).filter(function(ps){ return ps.is_delivery==1; }).forEach(function(ps){
              var eids = [];
              try { eids = typeof ps.assigned_employee_ids==='string' ? JSON.parse(ps.assigned_employee_ids||'[]') : asArr(ps.assigned_employee_ids); } catch(x){}
              if (ps.assigned_employee_id) eids = eids.concat([String(ps.assigned_employee_id)]);
              eids.forEach(function(id){ if(id) deliveryEmpIds[String(id)]=1; });
            });
            /* From actual item_steps in existing orders */
            asArr(orders).forEach(function(o){
              asArr(o.items).forEach(function(item){
                asArr(item.steps).forEach(function(step){
                  if (step.is_delivery != 1) return;
                  var eids = [];
                  try { eids = typeof step.assigned_employee_ids==='string' ? JSON.parse(step.assigned_employee_ids||'[]') : asArr(step.assigned_employee_ids); } catch(x){}
                  if (step.assigned_employee_id) eids = eids.concat([String(step.assigned_employee_id)]);
                  eids.forEach(function(id){ if(id) deliveryEmpIds[String(id)]=1; });
                });
              });
            });
            var filtered = asArr(bs.employees).filter(function(e){ return deliveryEmpIds[String(e.id)]; });
            return filtered.map(function(e){
                var nm=(lang==='en'&&e.name_en)?e.name_en:e.name;
                return {value:String(e.id), label:nm};
              });
          })()
        }),
        h(Input, { label:lang==='en'?'ðŸ—“ Delivery Date & Time':'ðŸ—“ ØªØ§Ø±ÙŠØ® ÙˆÙˆÙ‚Øª Ø§Ù„ØªÙˆØµÙŠÙ„', type:'datetime-local', value:form.delivery_date||form.deadline||'', onChange:function(v){ setForm(function(f){return Object.assign({},f,{delivery_date:v, deadline:v});});} }),
        h('div', { style:{ display:'flex', alignItems:'center', paddingTop:20 } },
          h('label', { style:{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:T.textMid, fontWeight:600 } },
            h('input', { type:'checkbox', checked:form.is_urgent==1, onChange:function(e){ setForm(function(f){return Object.assign({},f,{is_urgent:e.target.checked?1:0});}); }, style:{ accentColor:T.red } }),
            'ðŸ”´ '+(lang==='en'?'Urgent':'Ø¹Ø§Ø¬Ù„')
          )
        )
      ),
      /* â”€â”€ Recipients section â”€â”€ */
      h('div', null,
        h(Divider, { label:t('order_recipients') }),
        h('div',{style:{display:'flex',gap:8,marginBottom:10,alignItems:'flex-end'}},
          h('div',{style:{flex:1}},
            h(Select,{
              label:t('select_recipient'),
              value:selRecId,
              onChange:setSelRecId,
              options: custRecs
                .filter(function(r){ return !orderRecipients.some(function(or){ return String(or.recipient_id)===String(r.id); }); })
                .map(function(r){ var nm=(lang==='en'&&r.name_en)?r.name_en:r.name; return {value:String(r.id), label:nm+(r.phone?' â€” '+r.phone:'')}; }),
              placeholder:custRecs.length>0?'â€” '+t('select_recipient')+' â€”':'â€” '+t('no_contacts')+' â€”'
            })
          ),
          h(Btn,{size:'sm',variant:'primary',disabled:!selRecId,onClick:function(){
            var rec = custRecs.find(function(r){ return String(r.id)===String(selRecId); });
            if (!rec) return;
            setOrderRecipients(function(prev){ return prev.concat([{recipient_id:rec.id,name:rec.name,phone:rec.phone||'',address:rec.address||''}]); });
            setSelRecId('');
          }},'+ '+t('add_recipient'))
        ),
        orderRecipients.length === 0
          ? null
          : orderRecipients.map(function(rec,idx){
              return h('div',{key:idx,style:{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border,marginBottom:6}},
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13}},rec.name||rec.rec_name||'â€”'),
                  rec.phone||rec.rec_phone ? h('div',{style:{fontSize:11,color:T.textMute}},rec.phone||rec.rec_phone) : null
                ),
                h(Btn,{size:'sm',variant:'danger',onClick:function(){ setOrderRecipients(function(prev){ return prev.filter(function(_,i){ return i!==idx; }); }); }},'Ã—')
              );
            })
      ),
      (function(){
        /* Order Items: always visible.
           - If editing and a specific item has started steps â†’ qty only (no delete, no product change, no notes)
           - If editing and item has no started steps â†’ full edit (add/delete/change product/qty/notes)
           - New order â†’ full edit always */
        var globalStarted = false;
        if (form.id) {
          var allSteps = [];
          asArr(form.items).forEach(function(item){ asArr(item.steps).forEach(function(s){ allSteps.push(s); }); });
          globalStarted = allSteps.some(function(s){ return s.status_slug==='in_progress'||s.status_slug==='done'; });
        }
        return h('div', null,
          h(Divider, { label:t('order_items_lbl') }),
          /* Always show "+ Add Item" button */
          h('div', { style:{ display:'flex', justifyContent:'flex-end', marginBottom:10 } },
            h(Btn, { size:'sm', variant:'secondary', onClick:addItem }, '+ '+t('add_item'))
          ),
          asArr(form.items).length === 0
            ? h('div',{style:{textAlign:'center',padding:'16px 0',color:T.textMute,fontSize:13}},'â€” '+t('add_item')+' â€”')
            : asArr(form.items).map(function(item, idx){
              var captureIdx = idx;
              /* Check if THIS specific item has started steps */
              var itemStarted = form.id && asArr(item.steps).some(function(s){ return s.status_slug==='in_progress'||s.status_slug==='done'; });
              return h('div', { key:idx, style:{ background:T.cardBg, border:'1px solid '+(itemStarted ? T.blue||'#6c63ff' : T.border), borderRadius:T.radius, padding:'12px', marginBottom:10 } },
                /* Row 1: product + qty + delete â€” all same height */
                h('div', { style:{ display:'flex', gap:8, alignItems:'flex-end' } },
                  /* Product dropdown â€” grows â€” disabled if item started */
                  h('div', { style:{ flex:'1 1 auto' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('product')),
                    itemStarted
                      ? h('div', {
                          style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box', display:'flex', alignItems:'center' }
                        }, ln(products.find(function(p){ return String(p.id)===String(item.product_id); })||{name_ar:item.product_name,name_en:item.product_name}, lang) || item.product_name || 'â€”')
                      : h('select', {
                          value: String(item.product_id||''),
                          onChange: function(e){
                            var pid = e.target.value;
                            var prod = products.find(function(p){ return String(p.id)===String(pid); });
                            var autoNotes = prod ? (lang==='en' ? (prod.description_en||prod.description||'') : (prod.description||'')) : '';
                            setForm(function(f){
                              var newItems = f.items.slice();
                              var existingNotes = newItems[captureIdx].notes;
                              newItems[captureIdx] = Object.assign({}, newItems[captureIdx], {
                                product_id: pid,
                                notes: (existingNotes && existingNotes.trim()) ? existingNotes : autoNotes
                              });
                              return Object.assign({}, f, {items: newItems});
                            });
                          },
                          style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                        },
                          h('option',{value:''},'â€” '+t('choose')+' â€”'),
                          products.map(function(p){ return h('option',{key:p.id,value:String(p.id)},ln(p,lang)); })
                        )
                  ),
                  /* Qty input â€” always editable */
                  h('div', { style:{ flex:'0 0 80px' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('quantity')),
                    h('input', {
                      type:'number', min:1,
                      value: item.quantity,
                      onChange: function(e){ updateItem(captureIdx,'quantity',parseInt(e.target.value)||1); },
                      style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                    })
                  ),
                  /* Delete button â€” hidden if item started */
                  !itemStarted && h('button', {
                    onClick: function(){ removeItem(captureIdx); },
                    style:{ flex:'0 0 38px', height:38, background:'#c0123c', color:'#fff', border:'none', borderRadius:T.radius, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:0 }
                  }, 'Ã—')
                ),
                /* Row 2: notes/specs â€” always visible */
                h('div', { style:{ marginTop:8 } },
                  h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } },
                    lang==='ar' ? 'Ø§Ù„Ù…ÙˆØ§ØµÙØ§Øª' : 'Specifications'
                  ),
                  itemStarted
                    ? h('div', {
                        style:{ width:'100%', minHeight:38, padding:'8px 10px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box' }
                      }, item.notes || 'â€”')
                    : h('input', {
                        type:'text',
                        value: item.notes||'',
                        placeholder: lang==='ar' ? 'Ù…ÙˆØ§ØµÙØ§Øª / Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø®Ø§ØµØ© Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨...' : 'Specs / notes for this order item...',
                        onChange: function(e){ updateItem(captureIdx,'notes',e.target.value); },
                        style:{ width:'100%', height:38, padding:'0 10px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                      })
                )
              );
            })
        );
      })()
    ),
    /* Preview modal */
    preview && h(OrderPreviewModal, { order:preview, statuses:statuses, employees:employees, suppliers:suppliers, onClose:function(){ setPreview(null); },
      onOrderUpdate: function(updatedOrder){ 
        if(updatedOrder&&updatedOrder.id){ 
          setPreview(null); 
          setTimeout(function(){ setPreview(updatedOrder); }, 50);
        } 
      },
      onSilentReload: props.onSilentReload,
      onReload: function(){ if(props.onSilentReload) props.onSilentReload(); else props.onReload(); },
      onStart:function(stepId){ startStep(stepId, preview.id); },
      onAdvance:function(stepId, completedByIds){ completeStep(stepId, preview.id, completedByIds); },
      onAdvanceWithExecutors:function(stepId, completedByIds){ completeStep(stepId, preview.id, completedByIds); },
      onPauseStep:function(stepId, stepLabel, stepNameAr, stepNameEn){ pauseStep(stepId, preview.id, stepLabel, stepNameAr, stepNameEn); },
      onResumeStep:function(stepId){ resumeStep(stepId, preview.id); } })
  );
}

function OrderRow(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var order = props.order, statuses = props.statuses;
  var expectedMins  = props.expectedMins  || 0;
  var deliveryMins  = props.deliveryMins  || 0;
  var estCompletion = props.estCompletion || 0;
  var queuePos      = props.queuePos != null ? props.queuePos : -1;
  var queueLen      = props.queueLen || 0;
  var p = progOf(order);

  /* actual elapsed time â€” sum of COMPLETED production steps only (no delivery, no in-progress) */
  var actualMins = 0;
  var timeDiffMins = 0;
  var timeStatus = null; /* 'on_time' | 'ahead' | 'late' */
  var nowMs = Date.now();
  if (order.started_at) {
    var totalActiveMs = 0;
    asArr(order.items).forEach(function(item) {
      asArr(item.steps).forEach(function(step) {
        if (step.is_delivery == 1) return; // skip delivery
        if (step.status_slug !== 'done' && step.status_slug !== 'completed') return; // completed only
        if (!step.started_at || !step.completed_at) return;
        var stepStart = new Date(step.started_at.replace(' ','T')).getTime();
        var stepEnd   = new Date(step.completed_at.replace(' ','T')).getTime();
        var stepMs    = Math.max(0, stepEnd - stepStart);
        var pausedMs  = (parseInt(step.paused_seconds) || 0) * 1000;
        totalActiveMs += Math.max(0, stepMs - pausedMs);
      });
    });
    actualMins = Math.round(totalActiveMs / 60000);
    var actualSecs = Math.round(totalActiveMs / 1000);
    if (expectedMins > 0) {
      timeDiffMins = actualMins - expectedMins;
      timeStatus = timeDiffMins <= 0 ? (timeDiffMins < -2 ? 'ahead' : 'on_time') : 'late';
    }
  }
  var hasActual = actualMins > 0 || (order.started_at && asArr(order.items).some(function(item){
    return asArr(item.steps).some(function(s){
      return (s.status_slug==='done'||s.status_slug==='completed') && s.is_delivery!=1 && s.started_at && s.completed_at;
    });
  }));
  var actualDisplay = actualMins > 0 ? fmtMin(actualMins) : (actualSecs > 0 ? actualSecs+'s' : null);

  /* deadline check: est finish of production + delivery vs deadline */
  var deadlineStatus = null; /* 'ok' | 'tight' | 'overdue' */
  var minsUntilDeadline = null;
  if (order.deadline && (expectedMins > 0 || deliveryMins > 0)) {
    var deadlineMs = new Date(order.deadline.replace(' ','T')).getTime();
    // remaining production time = expected - actual (floor 0)
    var remainingProdMs = Math.max(0, (expectedMins - actualMins) * 60000);
    var deliveryMs = deliveryMins * 60000;
    var estFinishMs = nowMs + remainingProdMs + deliveryMs;
    var diffMs = deadlineMs - estFinishMs;
    minsUntilDeadline = Math.round(diffMs / 60000);
    if (diffMs < 0) deadlineStatus = 'overdue';
    else if (diffMs < 60 * 60 * 1000) deadlineStatus = 'tight'; // less than 1h buffer
    else deadlineStatus = 'ok';
  }
  var allSteps = asArr(order.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
  var firstPending  = allSteps.filter(function(s){ return s.status_slug==='pending'; })[0];
  var hasInProgress = allSteps.some(function(s){ return s.status_slug==='in_progress'; });
  var hasDone       = allSteps.some(function(s){ return s.status_slug==='done'; });
  /* orderStarted = any step was ever touched (in_progress or done) */
  var orderStarted  = hasInProgress || hasDone;
  /* show Start only when NO step is in_progress yet (order hasn't begun) */
  var showStart  = firstPending && !hasInProgress;
  var next = allSteps.filter(function(s){ return s.status_slug==='in_progress'; })[0];
  var isCancelled = order.status_slug === 'cancelled';

  /* â”€â”€ status badge helpers â”€â”€ */
  var _activeStep = null;
  asArr(order.items).forEach(function(item){ asArr(item.steps).forEach(function(s){ if (!_activeStep && s.status_slug==='in_progress') _activeStep = s; }); });
  var _stepLabel = _activeStep ? lnStep(_activeStep, lang) : null;
  var _sfallEn = { pending:'Pending', in_progress:'In Progress', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var _sfallAr = { pending:'Ø§Ù†ØªØ¸Ø§Ø±', in_progress:'Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°', review:'Ù…Ø±Ø§Ø¬Ø¹Ø©', ready:'Ø¬Ø§Ù‡Ø²', done:'Ù…ÙƒØªÙ…Ù„', completed:'Ù…ÙƒØªÙ…Ù„', cancelled:'Ù…Ù„ØºÙŠ' };
  var _sobj = asArr(statuses).find(function(x){ return x.slug===order.status_slug; });
  if (!_sobj) _sobj = asArr(statuses).find(function(x){ return (x.slug||'').toLowerCase().replace(/[^a-z]/g,'') === (order.status_slug||'').toLowerCase().replace(/[^a-z]/g,''); });
  var _normalSlug = (order.status_slug||'').toLowerCase().replace(/[^a-z_]/g,'').replace(/^in_progress.*/,'in_progress').replace(/^done.*/,'done').replace(/^complet.*/,'completed').replace(/^cancel.*/,'cancelled').replace(/^pend.*/,'pending');
  var _sLabel = _sobj ? ln(_sobj,lang) : ((lang==='en'?_sfallEn:_sfallAr)[_normalSlug]||(order.status_slug||'').replace(/_/g,' ').replace(/I$/,''));
  var _scolor = ({pending:'gray',in_progress:'blue',review:'amber',ready:'green',done:'green',completed:'green',cancelled:'red'})[_normalSlug]||'gray';
  var _sc = ({blue:{bg:'#dbeafe',text:'#1d4ed8'},green:{bg:'#dcfce7',text:'#15803d'},amber:{bg:'#fef3c7',text:'#b45309'},red:{bg:'#fee2e2',text:'#dc2626'},gray:{bg:T.bgSub,text:T.textMid}})[_scolor]||{bg:T.bgSub,text:T.textMid};
  var _badgeLabel = _stepLabel && !isDone(order) ? _sLabel+' â€” '+_stepLabel : _sLabel;
  var _dd = order.delivery_date||order.deadline;
  var _ddColor = _dd && new Date(_dd.replace(' ','T')) < new Date() ? T.red : T.green;

  return h(Card, { style:{ marginBottom:10, padding:0, overflow:'hidden' } },
    h('div', { style:{ display:'flex' } },
      h('div', { style:{ width:4, background:order.is_urgent==1?T.red:T.accent, flexShrink:0 } }),
      h('div', { style:{ flex:1, padding:'12px 16px', minWidth:0 } },

        /* ROW 1: badges + buttons */
        h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8 } },
          h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' } },
            order.is_urgent==1 && h(Badge,{label:t('urgent'),color:'red',dot:true}),
            h('span',{style:{fontFamily:'monospace',fontWeight:700,fontSize:14,color:T.text,whiteSpace:'nowrap'}},'#'+order.order_number),
            h('span',{style:{fontSize:11,padding:'2px 10px',borderRadius:99,background:_sc.bg,color:_sc.text,fontWeight:600,whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:4}},
              h('span',{style:{width:6,height:6,borderRadius:'50%',background:_sc.text,flexShrink:0}}),
              _badgeLabel
            ),
            order.is_paused==1 && h(Badge,{label:'â¸ '+(lang==='en'?'Paused':'Ù…ÙˆÙ‚ÙˆÙ'),color:'amber'}),
            order.priority==='high' && h(Badge,{label:t('high_priority'),color:'amber'})
          ),
          h('div',{style:{display:'flex',alignItems:'center',gap:6,flexShrink:0}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1,alignItems:'center'}},
              h('button',{onClick:props.onMoveUp,disabled:queuePos<=0,style:{background:'transparent',border:'none',cursor:queuePos>0?'pointer':'default',color:queuePos>0?T.accent:T.border,fontSize:11,padding:'2px',lineHeight:1}},'▲'),
              h('button',{onClick:props.onMoveDown,disabled:queuePos>=queueLen-1,style:{background:'transparent',border:'none',cursor:queuePos<queueLen-1?'pointer':'default',color:queuePos<queueLen-1?T.accent:T.border,fontSize:11,padding:'2px',lineHeight:1}},'▼')
            ),
            !showStart && h(Btn,{size:'sm',variant:'secondary',onClick:props.onPreview},next?t('return_to_order'):t('view')),
            showStart && h(Btn,{size:'sm',variant:'primary',onClick:function(){props.onStart(firstPending.id,order.id);}},t('start')),
            !isCancelled && h(Btn,{size:'sm',variant:'secondary',onClick:props.onEdit},t('edit')),
            h(Btn,{size:'sm',variant:'secondary',onClick:props.onPrint},'ðŸ–¨ '+t('print')),
            orderStarted && !isCancelled
              ? h('div',{style:{display:'flex',gap:6}},
                  order.is_paused==1
                    ? h(Btn,{size:'sm',style:{background:'#22c55e',color:'#fff',border:'none'},onClick:props.onResume},'â–¶ '+(lang==='en'?'Resume':'Ø§Ø³ØªØ¦Ù†Ø§Ù'))
                    : h(Btn,{size:'sm',style:{background:'#f59e0b',color:'#fff',border:'none'},onClick:props.onPause},'â¸ '+(lang==='en'?'Pause':'Ø¥ÙŠÙ‚Ø§Ù')),
                  h(Btn,{size:'sm',variant:'danger',onClick:props.onCancel},t('stop_order')),
                  h(Btn,{size:'sm',style:{background:'#6366f1',color:'#fff',border:'none'},onClick:props.onForceComplete},t('force_complete'))
                )
              : !isCancelled && h(Btn,{size:'sm',variant:'danger',onClick:props.onDelete},t('delete'))
          )
        ),

        /* ROW 2: progress */
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:8}},
          h('div',{style:{flex:1}},h(ProgressBar,{value:p})),
          h('span',{style:{fontSize:11,color:T.textMute,whiteSpace:'nowrap'}},p+'%')
        ),

        /* ROW 3: customer + time | delivery date */
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8}},
            h('span',{style:{fontSize:12,whiteSpace:'nowrap'}},
              h('span',{style:{color:T.textMute}},t('customer_lbl')+' '),
              h('b',{style:{color:T.text,fontWeight:600}},getCust(order,lang))
            ),
            isDone(order) && expectedMins>0 && actualMins>0
              ? h('span',{style:{fontSize:11,fontWeight:600,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',color:actualMins<=expectedMins?T.green:T.red,background:actualMins<=expectedMins?'#dcfce7':'#fee2e2'}},
                  actualMins<=expectedMins?'ðŸŸ¢ Faster by '+fmtMin(expectedMins-actualMins):'ðŸ”´ Slower by '+fmtMin(actualMins-expectedMins)
                )
              : h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                  expectedMins>0 && h('span',{style:{fontSize:11,color:T.textMute,background:T.bgSub,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap'}},'â± Exp: '+fmtMin(expectedMins)),
                  order.started_at && hasActual && actualDisplay && h('span',{style:{fontSize:11,fontWeight:600,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',color:timeStatus==='late'?T.red:timeStatus==='ahead'?T.green:T.textMid,background:timeStatus==='late'?'#fee2e2':timeStatus==='ahead'?'#dcfce7':T.bgSub}},
                    (lang==='en'?'Calculating: ':'الحساب: ')+actualDisplay
                  )
                ),
            order.delay_reason && h('span',{style:{background:'#fee2e2',color:T.red,borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},title:order.delay_reason},'âš ï¸ '+order.delay_reason.slice(0,20)+(order.delay_reason.length>20?'â€¦':'')),
            order.pause_reason && h('span',{style:{background:'#fef3c7',color:'#b45309',borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}},'â¸ '+order.pause_reason.slice(0,20)+(order.pause_reason.length>20?'â€¦':''))
          ),
          _dd && h('div',{style:{display:'flex',alignItems:'center',gap:4,flexShrink:0}},
            h('span',{style:{fontSize:10,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}},lang==='en'?'Delivery':'Ø§Ù„ØªÙˆØµÙŠÙ„'),
            h('span',{style:{fontSize:12,fontWeight:600,whiteSpace:'nowrap',color:_ddColor}},'ðŸ—“ '+fmtDate(_dd,lang))
          )
        )

      )
    )
  );
}


/* â•â•â• EXTERNAL STEP DATE PICKER â•â•â•
 * Props: step, orderId, suppliers, lang, onSaved(updatedOrder)
 * Clean component â€” no IIFE, no dead state, no closure issues
 * Uses controlled inputs with local state initialized once from props
 * After save: fetches fresh order and calls onSaved
 */
function ExtStepDatePicker(props) {
  var step      = props.step;
  var lang      = props.lang;
  var suppliers = props.suppliers || [];
  var sup       = step.supplier_id ? suppliers.filter(function(s){ return String(s.id)===String(step.supplier_id); })[0] : null;

  /* Local state â€” initialized once from DB values */
  var _send = useState(step.ext_send_at ? step.ext_send_at.slice(0,16) : '');
  var sendVal = _send[0], setSendVal = _send[1];
  var _recv = useState(step.ext_receive_expected ? step.ext_receive_expected.slice(0,16) : '');
  var recvVal = _recv[0], setRecvVal = _recv[1];
  var _saving = useState(false);
  var saving = _saving[0], setSaving = _saving[1];

  /* Local datetime string in browser timezone */
  function localNow() {
    var d = new Date();
    var p = function(n){ return String(n).padStart(2,'0'); };
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
  }

  function save() {
    setSaving(true);
    apiFetch('steps/'+step.id+'/ext-supplier', {
      method: 'POST',
      body: JSON.stringify({ ext_send_at: sendVal||null, ext_receive_expected: recvVal||null })
    }).then(function() {
      apiFetch('orders/'+props.orderId).then(function(u) {
        setSaving(false);
        if (u && u.id && props.onSaved) props.onSaved(u);
      }).catch(function(){ setSaving(false); });
    }).catch(function(){ setSaving(false); });
  }

  /* Delay indicator */
  var delay = null;
  if (step.ext_receive_expected && step.ext_receive_actual) {
    var diffH = Math.round((new Date(step.ext_receive_actual) - new Date(step.ext_receive_expected)) / 36e5);
    delay = diffH > 0
      ? h('span',{style:{fontSize:11,fontWeight:700,color:T.red}}, 'âš ï¸ '+diffH+'h '+(lang==='en'?'late':'ØªØ£Ø®ÙŠØ±'))
      : h('span',{style:{fontSize:11,fontWeight:700,color:T.green}}, 'âœ… '+(lang==='en'?'On time':'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª'));
  }

  var inpSt = {fontSize:12,padding:'5px 8px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,outline:'none'};
  var nowSt = {fontSize:11,padding:'4px 8px',borderRadius:T.radius,border:'1px solid '+T.accent,background:T.accentDim,color:T.accent,cursor:'pointer',whiteSpace:'nowrap'};

  return h('div',{style:{padding:'10px 12px',borderTop:'1px dashed rgba(99,91,255,.2)',background:'rgba(99,91,255,.03)'}},
    /* Header: supplier info */
    h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
      h('span',{style:{fontSize:11,fontWeight:700,color:T.accent}},'ðŸ­ '+(lang==='en'?'External Step':'Ø®Ø·ÙˆØ© Ø®Ø§Ø±Ø¬ÙŠØ©')),
      sup && h('span',{style:{fontSize:11,color:T.text,fontWeight:600}}, ln(sup,lang)),
      sup && sup.phone && h('a',{href:'tel:'+sup.phone,style:{fontSize:11,color:T.textMid,textDecoration:'none'}},'ðŸ“ž '+sup.phone),
      sup && sup.map_url && h('a',{href:sup.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:11,color:T.accent,textDecoration:'none'}},'ðŸ“')
    ),
    /* Date fields */
    h('div',{style:{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}},
      /* Sent */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'SENT TO SUPPLIER':'Ø£ÙØ±Ø³Ù„ Ù„Ù„Ù…Ø¬Ù‡Ø²'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:sendVal,
            onChange:function(e){ setSendVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setSendVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'Ø§Ù„Ø¢Ù†')
        )
      ),
      /* Expected receive */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'EXPECTED RECEIVE':'Ø§Ø³ØªÙ„Ø§Ù… Ù…ØªÙˆÙ‚Ø¹'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:recvVal,
            onChange:function(e){ setRecvVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setRecvVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'Ø§Ù„Ø¢Ù†')
        )
      ),
      /* Save button */
      h('button',{
        onClick: save,
        disabled: saving,
        style:{alignSelf:'flex-end',padding:'6px 16px',background:saving?T.border:T.accent,color:'#fff',border:'none',borderRadius:T.radius,fontWeight:700,fontSize:12,cursor:saving?'default':'pointer',marginBottom:1}
      }, saving ? (lang==='en'?'Saving...':'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...') : (lang==='en'?'ðŸ’¾ Save':'ðŸ’¾ Ø­ÙØ¸')),
      /* Delay indicator */
      delay
    )
  );
}

function OrderPreviewModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  /* Use local order state so we can update steps without full remount */
  var _ord = useState(props.order); var order = _ord[0], setOrder = _ord[1];
  var statuses = props.statuses;




  var employees = asArr(props.employees);
  var suppliers = asArr(props.suppliers);
  var p = progOf(order);

  /* Partial delivery state */
  var _pd = useState(false); var showPartial = _pd[0]; var setShowPartial = _pd[1];
  var _selItems = useState({}); var selItems = _selItems[0]; var setSelItems = _selItems[1];
  var _pdSaving = useState(false); var pdSaving = _pdSaving[0]; var setPdSaving = _pdSaving[1];

  /* Delivery step confirm state */
  var _dc = useState(null); var deliveryConfirm = _dc[0]; var setDeliveryConfirm = _dc[1];
  var _ex = useState(null); var executorPrompt = _ex[0]; var setExecutorPrompt = _ex[1]; /* {stepId, teamId, employees} */
  var _sel = useState([]); var selectedExecutors = _sel[0]; var setSelectedExecutors = _sel[1];

  var items = asArr(order.items);
  /* Items that are production-done but not yet marked as delivered
     Detection: delivery step by flag OR by name containing deliver/ØªÙˆØµÙŠÙ„/ØªØ³Ù„ÙŠÙ… */
  function _isDelivStep(s) {
    if (s.is_delivery == 1) return true;
    var n = (s.step_name||'').toLowerCase();
    return n.indexOf('deliver') >= 0 || n.indexOf('ØªÙˆØµÙŠÙ„') >= 0 || n.indexOf('ØªØ³Ù„ÙŠÙ…') >= 0;
  }
  var deliverableItems = items.filter(function(item){
    var steps = asArr(item.steps);
    var prodSteps = steps.filter(function(s){ return !_isDelivStep(s); });
    var prodDone = prodSteps.length === 0 || prodSteps.every(function(s){ return s.status_slug==='done'||s.status_slug==='completed'; });
    var deliverySteps = steps.filter(_isDelivStep);
    var alreadyDelivered = deliverySteps.length > 0 && deliverySteps.every(function(s){ return s.status_slug==='done'||s.status_slug==='completed'; });
    return prodDone && !alreadyDelivered;
  });
  function toggleItem(id) {
    setSelItems(function(prev){ var n=Object.assign({},prev); n[id]=!n[id]; return n; });
  }
  function submitPartial() {
    var ids = Object.keys(selItems).filter(function(k){ return selItems[k]; }).map(Number);
    if (!ids.length) return;
    setPdSaving(true);
    apiFetch('orders/'+order.id+'/partial-deliver', {method:'POST', body:JSON.stringify({item_ids:ids})})
      .then(function(res){
        setPdSaving(false);
        setShowPartial(false);
        setSelItems({});
        if (props.onReload) props.onReload();
        /* Update preview with fresh order data */
        if (res && res.order) {
          /* keep modal open so user sees updated state */
        }
      })
      .catch(function(e){ setPdSaving(false); alert(e.message||'Error'); });
  }

  return h(Modal, {
    title:t('order_preview_title')+' #'+order.order_number, subtitle:getCust(order, lang),
    onClose:props.onClose, width:780,
    footer:h('div',{style:{display:'flex',gap:8,flex:1,alignItems:'center'}},
      h(Btn,{variant:"secondary",onClick:function(){openPrintWithLang(order,lang);}}, 'ðŸ–¨ '+t('print')),
      order.delivery_map_url && h('a',{href:order.delivery_map_url,target:'_blank',style:{display:'inline-flex',alignItems:'center',padding:'8px 14px',background:T.blueBg,color:T.blue,borderRadius:T.radius,fontSize:13,textDecoration:'none',fontWeight:600}},'ðŸ“ '+t('map')),
      deliverableItems.length > 0 && items.length > 1 && h(Btn,{style:{background:'#d97706',color:'#fff',border:'none'},onClick:function(){
        var autoSel = {};
        deliverableItems.forEach(function(item){ autoSel[item.id] = true; });
        setSelItems(autoSel);
        setShowPartial(true);
      }},
        'ðŸ“¦ '+(lang==='en'?'Partial Delivery':'ØªØ³Ù„ÙŠÙ… Ø¬Ø²Ø¦ÙŠ')
      ),
      h('div',{style:{flex:1}}),
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
null
    )
  },
    h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 } },
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('customer_lbl')),h('div',{style:{fontWeight:700,color:T.text}},getCust(order, lang)),
        order.contact_person_name && h('div',{style:{fontSize:12,color:T.accent,marginTop:4}}, 'ðŸ‘¤ '+order.contact_person_name+(order.contact_person_phone?' Â· '+order.contact_person_phone:''))
      ),
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('current_step_lbl')),
        (function(){
          var activeStep = null;
          asArr(order.items).forEach(function(item){
            asArr(item.steps).forEach(function(step){
              if (!activeStep && step.status_slug==='in_progress') activeStep = step;
            });
          });
          if (activeStep) return h('div',{style:{display:'flex',alignItems:'center',gap:6}},
            h('div',{style:{width:7,height:7,borderRadius:'50%',background:T.accent,flexShrink:0}}),
            h('span',{style:{fontWeight:700,color:T.text,fontSize:13}},lnStep(activeStep,lang))
          );
          if (p>=100) return h(Badge,{label:t('completed_lbl'),color:'green'});
          return statusBadge(order.status_slug, statuses, lang);
        })()
      ),
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('progress_lbl')),
        h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{flex:1}},h(ProgressBar,{value:p})),h('span',{style:{fontSize:12,fontWeight:700}},p+'%')),
        actualDisplay && h('div',{style:{marginTop:8,display:'inline-flex',fontSize:11,fontWeight:700,borderRadius:99,padding:'2px 8px',background:T.bg,color:T.text}},(lang==='en'?'Calculating: ':'الحساب: ')+actualDisplay)
      )
    ),
    h(Divider, { label:t('steps_lbl') }),
    asArr(order.items).map(function(item){
      return h('div', { key:item.id, style:{ marginBottom:14 } },
        h('div', { style:{ fontWeight:700, fontSize:13, marginBottom: item.notes ? 4 : 8, display:'flex', alignItems:'center', gap:8 } },
          h('span', { style:{ background:T.bgSub, padding:'2px 10px', borderRadius:99, fontSize:12 } }, (lang==='en' && item.product_name_en) ? item.product_name_en : item.product_name),
          h('span', { style:{ color:T.textMute, fontWeight:400 } }, 'Ã— '+item.quantity)
        ),
        item.notes && h('div', { style:{ fontSize:12, color:T.textMute, marginBottom:8, padding:'4px 10px', background:T.bgSub, borderRadius:T.radius, borderLeft:'3px solid '+T.accent } },
          item.notes
        ),
        (function(){
          var hasAnyInProgress = asArr(item.steps).some(function(s){ return s.status_slug==='in_progress'; });
          return asArr(item.steps).map(function(step, stepIdx){
            var isDoneStep  = step.status_slug==='done'||step.status_slug==='completed';
            var isActive    = step.status_slug==='in_progress';
            var isPaused    = step.is_paused == 1;
            var isFirstPend = step.status_slug==='pending' && stepIdx===0 && !hasAnyInProgress;
            var emp = step.assigned_employee_id ? findBy(employees, 'id', step.assigned_employee_id) : null;
            // completed_by_ids = who actually did it (set at confirm time)
            var completedByIds = [];
            try { completedByIds = typeof step.completed_by_ids==='string' ? JSON.parse(step.completed_by_ids||'[]') : (step.completed_by_ids||[]); } catch(e){}
            var completedEmps = completedByIds.map(function(id){ return findBy(employees,'id',id); }).filter(Boolean);
            // fallback to assigned if completed_by_ids empty
            var assignedEmpIds = [];
            try { assignedEmpIds = typeof step.assigned_employee_ids==='string' ? JSON.parse(step.assigned_employee_ids||'[]') : (step.assigned_employee_ids||[]); } catch(e){}
            var assignedEmps = completedEmps.length > 0 ? completedEmps :
              assignedEmpIds.map(function(id){ return findBy(employees,'id',id); }).filter(Boolean);
            if (!assignedEmps.length && emp) assignedEmps = [emp];
            var isExt = step.is_external == 1 && !isDoneStep;
            var stepActual = stepActualStats(step);
            var stepActualDisplay = stepActual.mins > 0 ? fmtMin(stepActual.mins) : (stepActual.secs > 0 ? stepActual.secs+'s' : '0m');
            return h('div', { key:step.id, style:{ display:'flex', flexDirection:'column', gap:0, background: isPaused ? 'rgba(251,191,36,.07)' : isFirstPend ? 'rgba(99,91,255,.06)' : T.bgSub, borderRadius:T.radius, marginBottom:5, border: isPaused ? '1px solid rgba(251,191,36,.3)' : isFirstPend ? '1px dashed '+T.accent : step.is_external==1 ? '1px solid rgba(99,91,255,.3)' : '1px solid transparent' } },
              h('div',{style:{display:'grid', gridTemplateColumns:'16px 1fr 160px 44px 130px auto', alignItems:'center', gap:8, padding:'10px 12px'}},
              h('div', { style:{ width:7, height:7, borderRadius:'50%', background: isDoneStep?'#22c55e': isPaused?'#f59e0b': isActive?T.accent : isFirstPend ? T.accent : T.border, justifySelf:'center', opacity: isFirstPend ? .4 : 1 } }),
              h('div',{style:{display:'flex',flexDirection:'column',gap:2}},
                h('span', { style:{ fontSize:13, fontWeight: isActive||isFirstPend?600:400, color: isFirstPend?T.accent:T.text } }, lnStep(step,lang)),
                isPaused && step.pause_reason && h('span',{style:{fontSize:11,color:'#b45309'}},'â¸ '+step.pause_reason+(step.paused_machine?' Â· ðŸ”§ '+step.paused_machine:'')),
null
              ),
              h('div', { style:{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', flexWrap:'wrap' } },
                isDoneStep && assignedEmps.length > 0
                  ? assignedEmps.map(function(e){ return h('div',{key:e.id,style:{display:'flex',alignItems:'center',gap:4,background:T.bg,borderRadius:99,padding:'3px 8px',border:'1px solid '+T.border}},
                      h('span',{style:{fontSize:11,color:T.textMid,whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}},ln(e,lang))
                    ); })
                  : null
              ),
              h('div', { style:{ fontSize:11, color:T.textMute, textAlign:'center', display:'flex', flexDirection:'column', gap:2 } },
                h('span', null, (lang==='en'?'Exp: ':'المتوقع: ')+fmtH(step.expected_hours)),
                h('span', { style:{ color:T.textMid, fontWeight:600 } }, (lang==='en'?'Act: ':'الفعلي: ')+stepActualDisplay)
              ),
              h('div', { style:{ display:'flex', justifyContent:'center' } }, statusBadge(isPaused?'paused':step.status_slug, statuses, lang)),
              h('div', { style:{ display:'flex', justifyContent:'flex-end', gap:4 } },
                isFirstPend && !isPaused
                  ? h(Btn,{size:'sm',variant:'primary',onClick:function(){props.onStart(step.id);}}, 'â–¶ '+t('start'))
                  : isActive && !isPaused
                    ? h('div',{style:{display:'flex',gap:4}},
                        step.is_delivery == 1
                          ? h(Btn,{size:'sm',variant:'success',onClick:function(){ setDeliveryConfirm({stepId:step.id, itemName: item.product_name||item.product_name_en||'â€”', qty: item.quantity}); }}, 'âœ“')
                          : h(Btn,{size:'sm',variant:'success',onClick:function(){
                              /* show who-did-it prompt if step has assigned employees or team */
                              var assignedIds = [];
                              try {
                                var raw = step.assigned_employee_ids;
                                if (Array.isArray(raw)) { assignedIds = raw; }
                                else { assignedIds = JSON.parse(raw||'[]'); }
                              } catch(e){ assignedIds = []; }
                              var teamId = step.assigned_team_id;
                              var teamEmps = [];
                              if (assignedIds.length > 0) {
                                teamEmps = employees.filter(function(e){ return assignedIds.indexOf(parseInt(e.id)) >= 0 || assignedIds.indexOf(String(e.id)) >= 0; });
                              }
                              if (!teamEmps.length && teamId) {
                                teamEmps = employees.filter(function(e){ return String(e.team_id) === String(teamId); });
                              }
                              if (teamEmps.length > 0) {
                                setSelectedExecutors([]); // âœ… reset selections for new step
                                setExecutorPrompt({stepId: step.id, employees: teamEmps, stepName: lnStep(step, lang)});
                              } else {
                                props.onAdvance(step.id);
                              }
                            }}, '✓'),
                        step.is_delivery != 1 && props.onPauseStep && h('button',{onClick:function(){props.onPauseStep(step.id, lnStep(step,lang), step.step_name, step.step_name_en);},style:{padding:'4px 8px',borderRadius:T.radius,border:'1px solid #f59e0b',background:'rgba(245,158,11,.1)',color:'#b45309',cursor:'pointer',fontSize:12,fontWeight:600}},'â¸')
                      )
                    : isPaused
                      ? props.onResumeStep && h(Btn,{size:'sm',style:{background:'#22c55e',color:'#fff',border:'none'},onClick:function(){props.onResumeStep(step.id);}},lang==='en'?'Resume':'Ø§Ø³ØªØ¦Ù†Ø§Ù')
                      : isDoneStep
                        ? h('div',{style:{width:28,height:28,borderRadius:6,background:'rgba(34,197,94,.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22c55e',fontSize:14}},'âœ“')
                        : null
              )
              ), /* end inner grid row */
              /* â”€â”€ External Supplier Panel â”€â”€ */
              step.is_external==1 && h(ExtStepDatePicker,{
                key: 'ext-'+step.id,
                step: step,
                orderId: order.id,
                suppliers: suppliers,
                lang: lang,
                onSaved: function(updatedOrder){
                  if(props.onSilentReload) props.onSilentReload();
                  if(props.onOrderUpdate) props.onOrderUpdate(updatedOrder);
                }
              })
            );
          });
        })()
      );
    }),
    /* â”€â”€ Partial Delivery modal â”€â”€ */
    showPartial && h(Modal, {
      title: lang==='en' ? 'ðŸ“¦ Partial Delivery' : 'ðŸ“¦ ØªØ³Ù„ÙŠÙ… Ø¬Ø²Ø¦ÙŠ',
      onClose: function(){ setShowPartial(false); setSelItems({}); },
      width: 460,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setShowPartial(false); setSelItems({}); }},t('cancel')),
        h(Btn,{variant:'primary',disabled:pdSaving||!Object.values(selItems).some(Boolean),onClick:submitPartial},
          pdSaving ? (lang==='en'?'Saving...':'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...') : (lang==='en'?'OK â€” Confirm Delivery':'OK â€” ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªØ³Ù„ÙŠÙ…')
        )
      )
    },
      deliverableItems.length === 0
        ? h('div',{style:{color:T.textMute,textAlign:'center',padding:'20px 0'}},
            lang==='en'?'No items ready for delivery yet':'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„ØªØ³Ù„ÙŠÙ…'
          )
        : h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            h('p',{style:{color:T.textMid,fontSize:13,margin:'0 0 8px'}},
              lang==='en'?'These products are ready. Select which to deliver:':'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ø¬Ø§Ù‡Ø²Ø© â€” Ø§Ø®ØªØ± Ù…Ø§ ØªØ±ÙŠØ¯ ØªÙˆØµÙŠÙ„Ù‡:'
            ),
            deliverableItems.map(function(item){
              var checked = !!selItems[item.id];
              var itemName = (lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name;
              return h('div',{key:item.id,
                onClick:function(){ toggleItem(item.id); },
                style:{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:T.radius,
                  border:'2px solid '+(checked?T.accent:T.border),
                  background:checked?T.accentDim:T.bgSub,
                  cursor:'pointer',transition:'all .15s'}
              },
                h('div',{style:{width:22,height:22,borderRadius:4,border:'2px solid '+(checked?T.accent:T.border),
                  background:checked?T.accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}},
                  checked && h('span',{style:{color:'#fff',fontSize:13,fontWeight:700}},'âœ“')
                ),
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13,color:T.text}},itemName),
                  h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'Ã— '+item.quantity)
                ),
                h('span',{style:{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#dcfce7',color:'#15803d',fontWeight:600,flexShrink:0}},
                  lang==='en'?'Ready':'Ø¬Ø§Ù‡Ø²'
                )
              );
            })
          )
    ),

    /* â”€â”€ Delivery Confirm Modal â”€â”€ */
    deliveryConfirm && h(Modal, {
      title: 'ðŸ“¦ '+(lang==='en'?'Confirm Delivery':'ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªÙˆØµÙŠÙ„'),
      onClose: function(){ setDeliveryConfirm(null); },
      width: 420,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setDeliveryConfirm(null); }}, t('cancel')),
        h(Btn,{variant:'primary',onClick:function(){
          props.onAdvance(deliveryConfirm.stepId);
          setDeliveryConfirm(null);
        }}, lang==='en'?'OK â€” Mark as Delivered':'OK â€” ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªØ³Ù„ÙŠÙ…')
      )
    },
      h('div',{style:{padding:'4px 0'}},
        h('p',{style:{fontSize:13,color:T.textMid,marginBottom:14}},
          lang==='en'?'Are you sure you want to mark this product as delivered?':'Ù‡Ù„ ØªØ±ÙŠØ¯ ØªØ£ÙƒÙŠØ¯ ØªØ³Ù„ÙŠÙ… Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ØŸ'
        ),
        h('div',{style:{border:'1.5px solid '+T.accent,borderRadius:T.radius,padding:'12px 16px',background:T.accentDim,display:'flex',alignItems:'center',gap:10}},
          h('div',{style:{width:20,height:20,borderRadius:4,background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},
            h('span',{style:{color:'#fff',fontSize:12,fontWeight:700}},'âœ“')
          ),
          h('div',null,
            h('div',{style:{fontWeight:600,fontSize:13,color:T.text}}, deliveryConfirm.itemName),
            h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'Ã— '+deliveryConfirm.qty)
          )
        )
      )
    ),

    /* â”€â”€ Who did it? Modal â”€â”€ */
    executorPrompt && h(Modal, {
      title: 'ðŸ‘¤ '+(lang==='en'?'Who completed this step?':'Ù…Ù† Ù†ÙÙ‘Ø° Ù‡Ø°Ù‡ Ø§Ù„Ø®Ø·ÙˆØ©ØŸ'),
      onClose: function(){ setExecutorPrompt(null); setSelectedExecutors([]); },
      width: 420,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'primary',onClick:function(){
          var stepId = executorPrompt.stepId;
          var ids = selectedExecutors.slice();
          setExecutorPrompt(null); setSelectedExecutors([]);
          // use onAdvanceWithExecutors if available, else fallback to onAdvance
          if (props.onAdvanceWithExecutors) {
            props.onAdvanceWithExecutors(stepId, ids);
          } else {
            props.onAdvance(stepId, ids);
          }
        }}, lang==='en'?'Confirm':'ØªØ£ÙƒÙŠØ¯')
      )
    },
      h('div',{style:{marginBottom:8,fontSize:13,color:T.textMid}},
        lang==='en'?'Step: ':'Ø§Ù„Ø®Ø·ÙˆØ©: ',
        h('b',null, executorPrompt.stepName)
      ),
      h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
        executorPrompt.employees.map(function(emp){
          var isSelected = selectedExecutors.indexOf(String(emp.id)) !== -1;
          return h('div',{
            key:emp.id,
            onClick:function(){
              var sid = String(emp.id);
              setSelectedExecutors(function(prev){
                return isSelected ? prev.filter(function(x){ return x!==sid; }) : prev.concat([sid]);
              });
            },
            style:{
              display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
              borderRadius:T.radius,cursor:'pointer',transition:'background .15s, border .15s',
              border:'2px solid '+(isSelected ? T.accent : T.border),
              background: isSelected ? T.accentDim : T.bgSub
            }
          },
            h('div',{style:{
              width:20,height:20,borderRadius:4,flexShrink:0,
              border:'2px solid '+(isSelected?T.accent:T.border),
              background:isSelected?T.accent:'transparent',
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'
            }},
              isSelected && h('span',{style:{color:'#fff',fontSize:12,fontWeight:700,lineHeight:1}},'âœ“')
            ),
            h('span',{style:{fontWeight:600,fontSize:13,color:T.text}},ln(emp,lang))
          );
        })
      )
    )
  );
}

/* â•â•â• ARCHIVED ORDERS â•â•â• */
function ArchivedOrdersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders   = asArr(bs.orders).filter(isDone);
  var statuses = asArr(bs.statuses);
  var _p = useState(null); var preview = _p[0], setPreview = _p[1];
  var _page = useState(1); var page = _page[0], setPage = _page[1];
  var _perPage = useState(25); var perPage = _perPage[0], setPerPage = _perPage[1];
  var search = useSearch().q;

  var filtered = search.trim()
    ? orders.filter(function(o){
        var q = search.toLowerCase();
        return (o.order_number||'').toLowerCase().indexOf(q)>=0
          || getCust(o, lang).toLowerCase().indexOf(q)>=0
          || (o.completed_at||'').indexOf(q)>=0;
      })
    : orders;

  var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  var safePage   = Math.min(page, totalPages);
  var pageOrders = filtered.slice((safePage-1)*perPage, safePage*perPage);

  /* reset to page 1 when filter/perPage changes */
  useEffect(function(){ setPage(1); }, [search, perPage]);

  var perPageOpts = [
    {value:25, label:'25'},
    {value:50, label:'50'},
    {value:100, label:'100'},
    {value:500, label:'500'},
  ];

  useTopbar(t('n_done', filtered.length),
    h('div', {style:{display:'flex',gap:8,alignItems:'center'}},
      h('span',{style:{fontSize:12,color:T.textMute}}, lang==='en'?'Per page:':'Ù„ÙƒÙ„ ØµÙØ­Ø©:'),
      h('select',{
        value:perPage,
        onChange:function(e){ setPerPage(parseInt(e.target.value)); },
        style:{padding:'5px 28px 5px 10px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:T.bg,color:T.text,fontSize:13,fontFamily:'inherit',cursor:'pointer'}
      }, perPageOpts.map(function(o){ return h('option',{key:o.value,value:o.value},o.label); }))
    )
  );

  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'order_number',label:t('order_number_lbl'),render:function(o){return h('span',{style:{fontFamily:'monospace',fontWeight:700}},'#'+o.order_number);}},
        {key:'customer_name',label:t('customer'),render:function(o){return getCust(o,lang);}},
        {key:'status_slug',label:t('status_lbl'),render:function(o){return statusBadge(o.status_slug, statuses, lang);},noSort:true},
        {key:'expected_hours_total',label:t('expected_lbl'),render:function(o){return fmtH(o.expected_hours_total);}},
        {key:'actual_hours_total',label:t('actual_lbl'),render:function(o){return fmtH(o.actual_hours_total);}},
        {key:'time_diff',label:lang==='en'?'Diff':'Ø§Ù„ÙØ±Ù‚',noSort:true,render:function(o){
          var exp = (parseFloat(o.expected_hours_total)||0)*60;
          var act = (parseFloat(o.actual_hours_total)||0)*60;
          if (!exp || !act) return 'â€”';
          var diff = act - exp;
          var faster = diff <= 0;
          return h('span',{style:{
            fontWeight:700,fontSize:12,borderRadius:99,padding:'2px 8px',
            color: faster ? T.green : T.red,
            background: faster ? '#dcfce7' : '#fee2e2'
          }}, faster
            ? 'ðŸŸ¢ '+(lang==='en'?'Faster by ':'Ø£Ø³Ø±Ø¹ Ø¨Ù€ ')+fmtMin(Math.abs(diff))
            : 'ðŸ”´ '+(lang==='en'?'Slower by ':'Ø£Ø¨Ø·Ø£ Ø¨Ù€ ')+fmtMin(diff)
          );
        }},
        {key:'completed_at',label:t('completed_at'),render:function(o){return o.completed_at?fmtDate(o.completed_at, getLang()):'â€”';}},
      ],
      rows:pageOrders,
      actions:function(o){ return h(Btn,{size:'sm',variant:'secondary',onClick:function(){setPreview(o);}}, 'ðŸ‘'); },
      empty:t('no_orders_done')
    }),
    /* Pagination controls */
    totalPages > 1 && h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:16,flexWrap:'wrap'}},
      h('button',{
        disabled:safePage<=1,
        onClick:function(){setPage(function(p){return Math.max(1,p-1);});},
        style:{padding:'6px 14px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:safePage>1?T.bg:'transparent',color:safePage>1?T.text:T.textMute,
          cursor:safePage>1?'pointer':'default',fontSize:13,fontFamily:'inherit'}
      }, lang==='en'?'â† Prev':'Ø§Ù„Ø³Ø§Ø¨Ù‚ â†'),
      /* page numbers â€” show up to 7 */
      (function(){
        var pages=[]; var start=Math.max(1,safePage-3); var end=Math.min(totalPages,start+6);
        if (start>1) pages.push(h('button',{key:'s1',onClick:function(){setPage(1);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},'1'));
        if (start>2) pages.push(h('span',{key:'e1',style:{color:T.textMute,fontSize:13}},'â€¦'));
        for (var i=start;i<=end;i++) {
          var pg=i;
          pages.push(h('button',{key:pg,onClick:function(){setPage(pg);},
            style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+(pg===safePage?T.accent:T.border),
              background:pg===safePage?T.accent:'transparent',color:pg===safePage?'#fff':T.text,
              cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:pg===safePage?700:400}
          },pg));
        }
        if (end<totalPages-1) pages.push(h('span',{key:'e2',style:{color:T.textMute,fontSize:13}},'â€¦'));
        if (end<totalPages) pages.push(h('button',{key:'sl',onClick:function(){setPage(totalPages);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},totalPages));
        return pages;
      })(),
      h('button',{
        disabled:safePage>=totalPages,
        onClick:function(){setPage(function(p){return Math.min(totalPages,p+1);});},
        style:{padding:'6px 14px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:safePage<totalPages?T.bg:'transparent',color:safePage<totalPages?T.text:T.textMute,
          cursor:safePage<totalPages?'pointer':'default',fontSize:13,fontFamily:'inherit'}
      }, lang==='en'?'Next â†’':'â†’ Ø§Ù„ØªØ§Ù„ÙŠ')
    ),
    preview && h(OrderPreviewModal,{order:preview,statuses:statuses,onClose:function(){setPreview(null);},onAdvance:function(stepId,completedByIds){ apiFetch('steps/'+stepId+'/advance',{method:'POST',body:completedByIds&&completedByIds.length?JSON.stringify({completed_by_ids:completedByIds}):undefined}).catch(function(){}); }})
  );
}

/* â•â•â• CUSTOMERS â•â•â• */
