'use strict';
/* ColorSource Production Suite v6.0.2 â€” ES5 compatible, no optional chaining */

var _React    = React;
var useState  = _React.useState;
var useEffect = _React.useEffect;
var useRef    = _React.useRef;
var useCallback = _React.useCallback;
var createContext = _React.createContext;
var useContext = _React.useContext;
var h = React.createElement;

/* â”€â”€ Helpers â”€â”€ */
function g(obj, key) { return obj && obj[key] != null ? obj[key] : undefined; }
function gd(obj, key, def) { var v = g(obj, key); return v != null ? v : def; }
function asArr(v) { return Array.isArray(v) ? v : []; }
function getCust(o, lang) {
  if (!o) return 'â€”';
  if (lang === 'en') {
    return (o.customer_company_name_en || o.company_name_en || o.customer_name_en || o.customer_company_name || o.company_name || o.customer_name) || 'â€”';
  }
  return (o.customer_company_name || o.company_name || o.customer_name) || 'â€”';
}
function getRec(o)  { return (o && (o.recipient_name || o.delivery_address)) || 'â€”'; }
function toH(v) { return parseFloat(v) || 0; }
function fmtMin(m) {
  m = Math.round(m || 0);
  if (m <= 0) return '0 min';
  if (m < 60) return m + ' min';
  var h = Math.floor(m/60), rem = m%60;
  return rem > 0 ? h+'h '+rem+'m' : h+'h';
}
function fmtH(v) {
  var h2 = toH(v); if (!h2) return '0h';
  var abs = Math.abs(h2);
  var hrs = Math.floor(abs), mins = Math.round((abs - hrs) * 60);
  var str = hrs ? (hrs + 'h' + (mins ? ' ' + mins + 'm' : '')) : (mins + 'm');
  return h2 < 0 ? '-' + str : str;
}
function progOf(o) {
  var all = asArr(o.items).reduce(function(a,i){ return a.concat(asArr(i.steps)); }, []);
  if (!all.length) return 0;
  var done = all.filter(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; }).length;
  return Math.round(done / all.length * 100);
}
function isDone(o) { return o && (o.is_done == 1 || ['done','completed','cancelled'].indexOf(o.status_slug) >= 0); }
function isDeliveryStep(s) {
  if (s.is_delivery == 1) return true;
  var n = (s.step_name||'').toLowerCase();
  return n.indexOf('deliver') >= 0 || n.indexOf('\u062a\u0648\u0635\u064a\u0644') >= 0 || n.indexOf('\u062a\u0633\u0644\u064a\u0645') >= 0;
}
function itemProductionDone(item) {
  var steps = asArr(item.steps);
  var prodSteps = steps.filter(function(s){ return !isDeliveryStep(s); });
  if (prodSteps.length === 0) return true;
  return prodSteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
}
function itemDelivered(item) {
  /* Truly delivered = delivery step completed OR explicitly marked delivered */
  if (item.is_delivered == 1) return true;
  var steps = asArr(item.steps);
  var deliverySteps = steps.filter(isDeliveryStep);
  if (deliverySteps.length === 0) return false;
  return deliverySteps.every(function(s){ return s.status_slug === 'done' || s.status_slug === 'completed'; });
}
function itemReadyForDelivery(item) {
  /* Ready = production done OR flagged as ready */
  return item.is_ready_for_delivery == 1 || itemProductionDone(item);
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
function findBy(arr, key, val) {
  var r = asArr(arr).filter(function(x){ return x[key] == val; });
  return r.length ? r[0] : null;
}

/* â”€â”€ Design tokens â”€â”€ */
var T = {
  bg:'#ffffff', bgSub:'#f6f8fa', border:'#e3e8ef', borderDark:'#c8d0da',
  text:'#0d1117', textMid:'#424d57', textMute:'#7a8694',
  accent:'#635bff', accentDim:'#ede9ff', accentBg:'#ede9ff',
  green:'#09825d', greenBg:'#d3f5e9',
  red:'#c0123c', redBg:'#ffe0e8',
  amber:'#b54708', amberBg:'#fef3c7',
  blue:'#0055d4', blueBg:'#dbeafe',
  sidebar:'#0d1117', sidebarHov:'#161b22',
  sidebarTxt:'#c9d1d9', sidebarMut:'#484f58',
  radius:'8px', radiusLg:'12px',
  shadow:'0 1px 3px rgba(0,0,0,.08)',
  shadowLg:'0 12px 40px rgba(0,0,0,.15)',
};

/* â”€â”€ Layout helpers â”€â”€ */
function startOf(isRtl) { return isRtl ? 'right' : 'left'; }
function endOf(isRtl)   { return isRtl ? 'left' : 'right'; }


var I18N = {
  ar:{
    dashboard:'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…',orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª',completed_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©',
    customers:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',products:'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',suppliers:'Ø§Ù„Ù…Ø¬Ù‡Ø²ÙˆÙ†',product_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…Ù†ØªØ¬',product_workflow:'Ø³ÙŠØ± Ø¹Ù…Ù„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',workflow:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',workflow_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬',step_library:'Ù…ÙƒØªØ¨Ø© Ø§Ù„Ø®Ø·ÙˆØ§Øª',step_library_hint:'Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ© Ø¨ÙŠÙ† Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',pick_from_library:'Ø§Ø®ØªØ± Ù…Ù† Ø§Ù„Ù…ÙƒØªØ¨Ø©',default_minutes:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ (Ø¯Ù‚ÙŠÙ‚Ø©)',expected_min:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ (Ø¯Ù‚ÙŠÙ‚Ø©)',expected_total:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ',est_completion:'Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…ØªÙˆÙ‚Ø¹',queue_pos:'Ø§Ù„ØªØ±ØªÙŠØ¨',actual_time:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ',time_diff:'Ø§Ù„ÙØ±Ù‚',on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ahead:'Ø£Ø³Ø±Ø¹',late:'Ù…ØªØ£Ø®Ø±',delay_reason_title:'ØªØ£Ø®ÙŠØ± ÙÙŠ Ø§Ù„ØªØ³Ù„ÙŠÙ…',order_recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†',add_recipient:'Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù…',no_recipient_warn:'ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù… ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„',no_deadline_warn:'ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¯ÙŠØ¯ Ù„Ø§ÙŠÙ†',recipient_added:'ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø³ØªÙ„Ù…',select_recipient:'Ø§Ø®ØªØ± Ù…Ø³ØªÙ„Ù…Ø§Ù‹',delay_reason_prompt:'Ø§Ù„Ø·Ù„Ø¨ ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø¯ÙŠØ¯ Ù„Ø§ÙŠÙ†. ÙŠØ±Ø¬Ù‰ Ø°ÙƒØ± Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ±:',delay_reason_placeholder:'Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø§Ù„ØªØ£Ø®ÙŠØ±...',delay_submit:'ØªØ£ÙƒÙŠØ¯',delay_skip:'ØªØ®Ø·ÙŠ',expected_time:'Ø§Ù„ÙˆÙ‚Øª Ù„ÙƒÙ„ ÙˆØ­Ø¯Ø©',actual_min:'Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ',time_unit:'Ø§Ù„ÙˆØ­Ø¯Ø©',minutes:'Ø¯Ù‚ÙŠÙ‚Ø©',hours_unit:'Ø³Ø§Ø¹Ø©',time_diff:'Ø§Ù„ÙØ±Ù‚',on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ahead:'Ø£Ø³Ø±Ø¹',late:'Ù…ØªØ£Ø®Ø±',contact_person:'Ø´Ø®Øµ Ø§Ù„ØªÙˆØ§ØµÙ„',contact_name:'Ø§Ù„Ø§Ø³Ù…',contact_phone:'Ø§Ù„Ù‡Ø§ØªÙ',contact_email:'Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„',contact_map:'Ø±Ø§Ø¨Ø· Ø§Ù„Ø®Ø±ÙŠØ·Ø©',contact_address:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',temp_contact:'Ù…Ø³ØªÙ„Ù… Ù…Ø¤Ù‚Øª',temp_recipient_lbl:'Ù…Ø³ØªÙ„Ù… Ù…Ø¤Ù‚Øª',
    steps:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',my_tasks:'Ù…Ù‡Ø§Ù…ÙŠ',external_tasks:'Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ©',
    roles:'Ø§Ù„Ø£Ø¯ÙˆØ§Ø±',departments:'Ø§Ù„Ø£Ù‚Ø³Ø§Ù…',teams:'Ø§Ù„ÙØ±Ù‚',
    employees:'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†',statuses:'Ø§Ù„Ø­Ø§Ù„Ø§Øª',notifications:'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª',kds:'Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',users_mgmt:'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†',
    add:'Ø¥Ø¶Ø§ÙØ©',edit:'ØªØ¹Ø¯ÙŠÙ„',delete:'Ø­Ø°Ù',save:'Ø­ÙØ¸',cancel:'Ø¥Ù„ØºØ§Ø¡',
    confirm_delete:'Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ø­Ø°ÙØŸ',
    name:'Ø§Ù„Ø§Ø³Ù…',phone:'Ø§Ù„Ù‡Ø§ØªÙ',address:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',notes:'Ù…Ù„Ø§Ø­Ø¸Ø§Øª',color:'Ø§Ù„Ù„ÙˆÙ†',
    order_number:'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨',customer:'Ø§Ù„Ø¹Ù…ÙŠÙ„',recipient:'Ø§Ù„Ù…Ø³ØªÙ„Ù…',
    deadline:'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙˆØµÙŠÙ„',priority:'Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©',status:'Ø§Ù„Ø­Ø§Ù„Ø©',
    expected_hours:'Ø³Ø§Ø¹Ø§Øª Ù…ØªÙˆÙ‚Ø¹Ø©',actual_hours:'Ø³Ø§Ø¹Ø§Øª ÙØ¹Ù„ÙŠØ©',
    in_progress:'Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°',pending:'Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',done:'Ù…ÙƒØªÙ…Ù„',ready:'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªØ³Ù„ÙŠÙ…',
    no_data:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª',search:'Ø¨Ø­Ø«',company:'Ø§Ù„Ø´Ø±ÙƒØ©',map:'Ø§Ù„Ø®Ø±ÙŠØ·Ø©',print:'Ø·Ø¨Ø§Ø¹Ø©',
    quantity:'Ø§Ù„ÙƒÙ…ÙŠØ©',product:'Ø§Ù„Ù…Ù†ØªØ¬',employee:'Ø§Ù„Ù…ÙˆØ¸Ù',team:'Ø§Ù„ÙØ±ÙŠÙ‚',role:'Ø§Ù„Ø¯ÙˆØ±',department:'Ø§Ù„Ù‚Ø³Ù…',
    new_order:'Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯',add_item:'Ø¥Ø¶Ø§ÙØ© Ø¹Ù†ØµØ±',
    delivery_address:'Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªØ³Ù„ÙŠÙ…',delivery_notes:'Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…',
    recipient_name:'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªÙ„Ù…',company_name:'Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©',
    active:'Ù†Ø´Ø·',inactive:'ØºÙŠØ± Ù†Ø´Ø·',sku:'Ø±Ù…Ø² Ø§Ù„Ù…Ù†ØªØ¬',
    step_name:'Ø§Ø³Ù… Ø§Ù„Ø®Ø·ÙˆØ©',step_order:'Ø§Ù„ØªØ±ØªÙŠØ¨',
    recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†',temp_recipients:'Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ† Ø§Ù„Ù…Ø¤Ù‚ØªÙˆÙ†',add_recipient:'Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ„Ù…',
    slug:'Ø§Ù„Ù…Ø¹Ø±Ù',sort_order:'Ø§Ù„ØªØ±ØªÙŠØ¨',is_done:'Ø­Ø§Ù„Ø© Ù…Ù†ØªÙ‡ÙŠØ©',
    description:'Ø§Ù„ÙˆØµÙ',estimated_hours:'Ø³Ø§Ø¹Ø§Øª ØªÙ‚Ø¯ÙŠØ±ÙŠØ©',
    phone_alt:'Ù‡Ø§ØªÙ Ø¨Ø¯ÙŠÙ„',map_url:'Ø±Ø§Ø¨Ø· Ø§Ù„Ø®Ø±ÙŠØ·Ø©',title:'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†',type:'Ø§Ù„Ù†ÙˆØ¹',
    send_notification:'Ø¥Ø±Ø³Ø§Ù„',browser_notifications:'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­',
    show_in_prds:'Ø¹Ø±Ø¶ ÙÙŠ KDS',is_external:'Ù…Ù‡Ù…Ø© Ø®Ø§Ø±Ø¬ÙŠØ©',
    /* extra */
    active_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø§Ø±ÙŠØ©',total_orders:'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø·Ù„Ø¨Ø§Øª',completed:'Ù…ÙƒØªÙ…Ù„Ø©',
    urgent:'Ø¹Ø§Ø¬Ù„',clients:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',progress:'Ø§Ù„ØªÙ‚Ø¯Ù…',date:'Ø§Ù„ØªØ§Ø±ÙŠØ®',
    completed_at:'Ø§ÙƒØªÙ…Ù„ ÙÙŠ',leader:'Ù‚Ø§Ø¦Ø¯',
    customer_lbl:'Ø§Ù„Ø¹Ù…ÙŠÙ„:',recipient_lbl:'Ø§Ù„Ù…Ø³ØªÙ„Ù…:',
    choose_recipient:'â€” Ø§Ø®ØªØ± Ø§Ù„Ù…Ø³ØªÙ„Ù… â€”',choose_customer_first:'â€” Ø§Ø®ØªØ± Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø£ÙˆÙ„Ø§Ù‹ â€”',
    select_product:'â€” Ø§Ø®ØªØ± Ø§Ù„Ù…Ù†ØªØ¬ â€”',
    normal:'Ø¹Ø§Ø¯ÙŠ',high:'Ø¹Ø§Ù„ÙŠ ðŸ”¥',low:'Ù…Ù†Ø®ÙØ¶',
    yes:'Ù†Ø¹Ù…',no:'Ù„Ø§',active_status:'Ù†Ø´Ø·',stopped:'Ù…ØªÙˆÙ‚Ù',
    all_statuses:'ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª',all_steps_added:'ÙƒÙ„ Ø§Ù„Ø®Ø·ÙˆØ§Øª Ù…Ø¶Ø§ÙØ©',
    production_system:'Ù†Ø¸Ø§Ù… Ø§Ù„Ø¥Ù†ØªØ§Ø¬',
    setup_system:'Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù†Ø¸Ø§Ù…',
    system_name_title:'Ø§Ø³Ù… Ù†Ø¸Ø§Ù…Ùƒ',system_name_hint:'Ù‡Ø°Ø§ Ø§Ù„Ø§Ø³Ù… Ø³ÙŠØ¸Ù‡Ø± ÙÙŠ Ø¬Ù…ÙŠØ¹ Ø£Ø¬Ø²Ø§Ø¡ Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±.',
    logo_title:'Ø´Ø¹Ø§Ø± Ø§Ù„Ø´Ø±ÙƒØ©',logo_hint:'Ø§Ø±ÙØ¹ Ø´Ø¹Ø§Ø± Ø´Ø±ÙƒØªÙƒ â€” PNG Ø´ÙØ§Ù Ø£Ùˆ SVG Ø§Ù„Ø£Ù†Ø³Ø¨.',
    drag_logo:'Ø§Ø³Ø­Ø¨ Ø§Ù„Ø´Ø¹Ø§Ø± Ù‡Ù†Ø§ Ø£Ùˆ Ø§Ø¶ØºØ· Ù„Ù„Ø±ÙØ¹',logo_formats:'PNG Â· SVG Â· JPG Â· WEBP',
    setup_done:'Ø£Ù†Øª Ø¬Ø§Ù‡Ø² ØªÙ…Ø§Ù…Ø§Ù‹!',setup_success:'ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ù†Ø¬Ø§Ø­:',
    enter_system:'Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù… â†',next:'Ø§Ù„ØªØ§Ù„ÙŠ â†’',skip:'ØªØ®Ø·ÙŠ',
    saving:'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...',save_continue:'Ø­ÙØ¸ ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø© â†’',
    name_required:'Ø§Ø³Ù… Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø·Ù„ÙˆØ¨',system_name_placeholder:'Ù…Ø«Ø§Ù„: Ù…Ø·Ø¨Ø¹Ø© Ø§Ù„Ù†Ø¬Ù… Ø§Ù„Ø±Ù‚Ù…ÙŠØ©',
    no_active_orders:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø¬Ø§Ø±ÙŠØ©',full_name:'Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„',order_number_lbl:'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨',order_items_lbl:'Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø·Ù„Ø¨',steps_lbl:'Ø§Ù„Ø®Ø·ÙˆØ§Øª',high_priority:'Ø£ÙˆÙ„ÙˆÙŠØ© Ø¹Ø§Ù„ÙŠØ©',completed_lbl:'Ù…ÙƒØªÙ…Ù„',sort_order_lbl:'Ø§Ù„ØªØ±ØªÙŠØ¨',is_final_lbl:'Ù…Ù†ØªÙ‡ÙŠØ©',expected_lbl:'Ù…ØªÙˆÙ‚Ø¹',actual_lbl:'ÙØ¹Ù„ÙŠ',login_username:'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…',login_password:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',login_subtitle:'Ù†Ø¸Ø§Ù… Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',login_required:'Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',login_error:'Ø®Ø·Ø£ ÙÙŠ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„',link_emp_label:'Ø±Ø¨Ø· Ø¨Ù…ÙˆØ¸Ù Ù…ÙˆØ¬ÙˆØ¯ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)',link_emp_placeholder:'Ø¥Ù†Ø´Ø§Ø¡ Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯',avatar_title:'ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø´Ø®ØµÙŠØ©',avatar_too_large:'Ø§Ù„ØµÙˆØ±Ø© ÙƒØ¨ÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹ØŒ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 2MB',avatar_error:'Ø®Ø·Ø£ ÙÙŠ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©',users_count:'Ù…Ø³ØªØ®Ø¯Ù…',role_admin_short:'Ù…Ø¯ÙŠØ±',role_user_short:'Ù…Ø³ØªØ®Ø¯Ù…',no_results_q:'Ù„Ø§ Ù†ØªØ§Ø¦Ø¬ Ù„Ù€',customer_lbl:'Ø§Ù„Ø¹Ù…ÙŠÙ„',recipient_lbl:'Ø§Ù„Ù…Ø³ØªÙ„Ù…',contact_persons:'Ø¬Ù‡Ø§Øª Ø§Ù„Ø§ØªØµØ§Ù„',contact_person_lbl:'Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø¹Ù† Ø§Ù„Ø·Ù„Ø¨',job_title:'Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ',add_contact:'Ø¥Ø¶Ø§ÙØ© Ø¬Ù‡Ø© Ø§ØªØµØ§Ù„',no_contacts:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù‡Ø§Øª Ø§ØªØµØ§Ù„',current_step_lbl:'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©',progress_lbl:'Ø§Ù„ØªÙ‚Ø¯Ù…',yes:'Ù†Ø¹Ù…',no:'Ù„Ø§',show_in_kds:'Ø¹Ø±Ø¶ ÙÙŠ KDS',external_task:'Ù…Ù‡Ù…Ø© Ø®Ø§Ø±Ø¬ÙŠØ©',is_delivery:'Ø®Ø·ÙˆØ© ØªÙˆØµÙŠÙ„',scales_with_qty:'ÙŠØªØ£Ø«Ø± Ø¨Ø§Ù„ÙƒÙ…ÙŠØ©',qty_per_unit:'Ù„ÙƒÙ„',unit_lbl:'ÙˆØ­Ø¯Ø©',inactive_lbl:'ØºÙŠØ± Ù†Ø´Ø·',login_btn:'Ø¯Ø®ÙˆÙ„',edit_order:'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨',order_preview_title:'Ø·Ù„Ø¨',notif_info:'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',notif_success:'Ù†Ø¬Ø§Ø­',notif_warning:'ØªØ­Ø°ÙŠØ±',notif_error:'Ø®Ø·Ø£',is_done_lbl:'Ù…Ù†ØªÙ‡ÙŠØ©',perm_sections:'Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„ØµÙØ­Ø§Øª',perm_steps:'Ø®Ø·ÙˆØ§Øª Ø§Ù„Ø¥Ù†ØªØ§Ø¬',perm_save:'Ø­ÙØ¸ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª',perm_admin_full:'Ø§Ù„Ù…Ø¯ÙŠØ± ÙŠÙ…Ù„Ùƒ ÙˆØµÙˆÙ„Ø§Ù‹ ÙƒØ§Ù…Ù„Ø§Ù‹ Ø¨Ø¯ÙˆÙ† Ù‚ÙŠÙˆØ¯',perm_title:'ØµÙ„Ø§Ø­ÙŠØ§Øª',perm_view:'Ø¹Ø±Ø¶',perm_create:'Ø¥Ø¶Ø§ÙØ©',perm_edit:'ØªØ¹Ø¯ÙŠÙ„',perm_delete:'Ø­Ø°Ù',perm_orders:'Ø§Ù„Ø·Ù„Ø¨Ø§Øª',perm_customers:'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',perm_products:'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª',perm_employees:'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†',perm_kds:'Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',perm_delivery_orders:'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„',perm_reports:'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±',perm_settings:'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',settings:'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',perm_users:'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†',username_lbl:'Ø§Ø³Ù… Ø§Ù„Ø¯Ø®ÙˆÙ„ (username)',password_lbl:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±',password_new:'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© (Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ Ù„Ø¹Ø¯Ù… Ø§Ù„ØªØºÙŠÙŠØ±)',role_lbl:'Ø§Ù„Ø¯ÙˆØ±',role_admin:'Ù…Ø¯ÙŠØ± (ÙˆØµÙˆÙ„ ÙƒØ§Ù…Ù„)',role_user:'Ù…Ø³ØªØ®Ø¯Ù… (Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª)',dept_lbl:'Ø§Ù„Ù‚Ø³Ù…',no_dept:'-- Ø¨Ø¯ÙˆÙ† Ù‚Ø³Ù… --',status_lbl:'Ø§Ù„Ø­Ø§Ù„Ø©',active_lbl:'Ù†Ø´Ø·',stopped_lbl:'Ù…ÙˆÙ‚ÙˆÙ',new_user:'Ù…Ø³ØªØ®Ø¯Ù… Ø¬Ø¯ÙŠØ¯',edit_user:'ØªØ¹Ø¯ÙŠÙ„ Ù…Ø³ØªØ®Ø¯Ù…',no_results:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬',no_orders_done:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…ÙƒØªÙ…Ù„Ø© Ø¨Ø¹Ø¯',error:'Ø®Ø·Ø£',
    start:'â–¶ Ø¨Ø¯Ø¡',complete_step:'âœ“ Ø¥ÙƒÙ…Ø§Ù„',view:'ðŸ‘ Ø¹Ø±Ø¶',return_to_order:'â†© Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø·Ù„Ø¨',current_step:'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©',stop_order:'â¹ Ø¥ÙŠÙ‚Ø§Ù',force_complete:'âš¡ Ø¥Ù†Ù‡Ø§Ø¡ Ø¥Ø¬Ø¨Ø§Ø±ÙŠ',confirm_stop:'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø¥ÙŠÙ‚Ø§Ù Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ØŸ Ø³ÙŠØªÙ… ÙˆØ¶Ø¹Ù‡ ÙƒÙ…Ù„ØºÙŠ.',confirm_force:'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø¥Ù†Ù‡Ø§Ø¡ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ø¥Ø¬Ø¨Ø§Ø±ÙŠØ§Ù‹ØŸ Ø³ÙŠÙØ¹Ù„ÙŽÙ‘Ù… ÙƒÙ…ÙƒØªÙ…Ù„ ÙÙˆØ±Ø§Ù‹.',delete_blocked:'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ø·Ù„Ø¨ Ø¨Ø¯Ø£ ØªÙ†ÙÙŠØ°Ù‡',
    start_btn:'â–¶',complete_btn:'âœ“',
    kds_subtitle:'ØªØ­Ø¯ÙŠØ« ÙƒÙ„ 30 Ø«Ø§Ù†ÙŠØ©',no_active_kds:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù†Ø´Ø·Ø© Ø­Ø§Ù„ÙŠØ§Ù‹',
    waiting:'Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',
    n_orders:function(n){ return n+' Ø·Ù„Ø¨'; },
    n_active:function(n){ return n+' Ø·Ù„Ø¨ Ù†Ø´Ø·'; },
    n_done:function(n){ return n+' Ø·Ù„Ø¨ Ù…ÙƒØªÙ…Ù„'; },
    n_tasks:function(n){ return n+' Ù…Ù‡Ù…Ø©'; },
    n_items:function(n){ return n+' Ø¹Ù†Ø§ØµØ±'; },
    n_clients:function(n){ return n+' Ø¹Ù…ÙŠÙ„'; },
    overview:'Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø­Ø§Ù„Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬',
    workflow_hint:'ØªØ­Ø¯ÙŠØ¯ workflow Ù„ÙƒÙ„ Ù…Ù†ØªØ¬',
    send_notif_title:'Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø±',
    unread:function(n){ return n+' ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡'; },
    retry:'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©',ui_error:'Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©',
    loading:'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...',loading_data:'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...',
    switch_lang:'Switch to English',
    /* â”€â”€ Tasks group label â”€â”€ */
    tasks_label:'Ø§Ù„Ù…Ù‡Ø§Ù…',
    kds_interval_lbl:'ÙˆÙ‚Øª Ø§Ù„ØªØ¨Ø¯ÙŠÙ„ ÙÙŠ Ø´Ø§Ø´Ø© Ø§Ù„Ø¥Ù†ØªØ§Ø¬ (Ø«Ø§Ù†ÙŠØ©)',
    kds_interval_hint:'Ø¹Ø¯Ø¯ Ø§Ù„Ø«ÙˆØ§Ù†ÙŠ Ø¨ÙŠÙ† ÙƒÙ„ ØµÙØ­Ø© ÙÙŠ Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¯ÙˆØ±ÙŠ Ø¹Ù„Ù‰ Ø§Ù„ØªÙ„ÙØ²ÙŠÙˆÙ†',
    delivery_orders:'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„',
    delivery_agent:'Ù…Ù†Ø¯ÙˆØ¨ Ø§Ù„ØªÙˆØµÙŠÙ„',
    no_delivery_orders:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª ØªÙˆØµÙŠÙ„ Ù…Ø³Ù†Ø¯Ø© Ø¥Ù„ÙŠÙƒ',
    /* â”€â”€ Operations Tasks â”€â”€ */
    operations_tasks:'Ù…Ù‡Ø§Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',operations_label:'Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',
    ops_task_no:'Ø±Ù‚Ù… Ø§Ù„Ù…Ù‡Ù…Ø©',ops_new_task:'Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©',ops_edit_task:'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù…Ø©',
    ops_stages:'Ø§Ù„Ù…Ø±Ø§Ø­Ù„',ops_add_stage:'Ø¥Ø¶Ø§ÙØ© Ù…Ø±Ø­Ù„Ø©',ops_rename_stage:'ØªØ³Ù…ÙŠØ© Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_delete_stage:'Ø­Ø°Ù Ø§Ù„Ù…Ø±Ø­Ù„Ø©',ops_stage_name:'Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_move_next_dept:'Ù†Ù‚Ù„ Ù„Ù„Ù‚Ø³Ù… Ø§Ù„ØªØ§Ù„ÙŠ',ops_finish_task:'Ø¥Ù†Ù‡Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù…Ø©',
    ops_completed_tasks:'Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©',ops_reopen:'Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­',
    ops_no_stages:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø±Ø§Ø­Ù„ â€” Ø£Ø¶Ù Ù…Ø±Ø­Ù„Ø© Ù„Ù„Ø¨Ø¯Ø¡',
    ops_no_tasks:'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø±Ø­Ù„Ø©',
    ops_final_stage_title:'Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©',
    ops_final_stage_msg:'ÙˆØµÙ„Øª Ø§Ù„Ù…Ù‡Ù…Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø© ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù….',
    ops_stage_has_tasks:'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ù…Ø±Ø­Ù„Ø© ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ù…Ù‡Ø§Ù…',
    ops_time:'Ø§Ù„ÙˆÙ‚Øª',ops_completed_at:'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²',ops_on_time:'ÙÙŠ Ø§Ù„ÙˆÙ‚Øª',ops_delayed:'Ù…ØªØ£Ø®Ø±',
  },
  en:{
    dashboard:'Dashboard',orders:'Orders',completed_orders:'Completed Orders',
    customers:'Customers',products:'Products',suppliers:'Suppliers',product_steps:'Product Steps',product_workflow:'Product Workflow',workflow:'Workflow',workflow_steps:'Production Steps',step_library:'Step Library',step_library_hint:'Shared steps across products',pick_from_library:'Pick from Library',default_minutes:'Default Time (min)',expected_min:'Expected Time (min)',expected_total:'Expected Time',est_completion:'Est. Completion',queue_pos:'Queue',actual_time:'Actual Time',time_diff:'Difference',on_time:'On Time',ahead:'Ahead',late:'Late',delay_reason_title:'Delivery Delayed',order_recipients:'Recipients',add_recipient:'Add Recipient',no_recipient_warn:'At least one recipient is required',no_deadline_warn:'Deadline is required',recipient_added:'Recipient added',select_recipient:'Select recipient',delay_reason_prompt:'This order has passed its deadline. Please provide a reason for the delay:',delay_reason_placeholder:'Enter delay reason...',delay_submit:'Submit',delay_skip:'Skip',expected_time:'Time per Unit',actual_min:'Actual Time',time_unit:'Unit',minutes:'Minutes',hours_unit:'Hours',time_diff:'Difference',on_time:'On Time',ahead:'Ahead',late:'Late',contact_person:'Contact Person',contact_name:'Name',contact_phone:'Phone',contact_email:'Email',contact_map:'Map Link',contact_address:'Address',temp_contact:'Temp Recipient',temp_recipient_lbl:'Temp Recipient',
    steps:'Steps',my_tasks:'My Tasks',external_tasks:'External Tasks',
    roles:'Roles',departments:'Departments',teams:'Teams',
    employees:'Employees',statuses:'Statuses',notifications:'Notifications',kds:'Production Display',users_mgmt:'Users',
    add:'Add',edit:'Edit',delete:'Delete',save:'Save',cancel:'Cancel',
    confirm_delete:'Are you sure you want to delete?',
    name:'Name',phone:'Phone',address:'Address',notes:'Notes',color:'Color',
    order_number:'Order #',customer:'Customer',recipient:'Recipient',
    deadline:'Delivery Date & Time',priority:'Priority',status:'Status',
    expected_hours:'Exp. Hrs',actual_hours:'Act. Hrs',
    in_progress:'In Progress',pending:'Pending',done:'Done',ready:'Ready for Delivery',
    no_data:'No data found',search:'Search',company:'Company',map:'Map',print:'Print',
    quantity:'Qty',product:'Product',employee:'Employee',employees:'Assigned Employees',team:'Team',role:'Role',department:'Dept',
    new_order:'New Order',add_item:'Add Item',
    delivery_address:'Delivery Address',delivery_notes:'Delivery Notes',
    recipient_name:'Recipient Name',company_name:'Company Name',
    active:'Active',inactive:'Inactive',sku:'SKU',
    step_name:'Step Name',step_order:'Order',
    recipients:'Recipients',temp_recipients:'Temp Recipients',add_recipient:'Add Recipient',
    slug:'Slug',sort_order:'Sort Order',is_done:'Is Final',
    description:'Description',estimated_hours:'Est. Hours',
    phone_alt:'Alt. Phone',map_url:'Map URL',title:'Title',type:'Type',
    send_notification:'Send',browser_notifications:'Browser Notifications',
    show_in_prds:'Show in KDS',is_external:'External Task',
    /* extra */
    active_orders:'Active Orders',total_orders:'Total Orders',completed:'Completed',
    urgent:'Urgent',clients:'Clients',progress:'Progress',date:'Date',
    completed_at:'Completed At',leader:'Leader',members:'Team Members',
    customer_lbl:'Customer:',recipient_lbl:'Recipient:',
    choose_recipient:'â€” Select Recipient â€”',choose_customer_first:'â€” Select Customer First â€”',
    select_product:'â€” Select Product â€”',
    choose:'Select',
    normal:'Normal',high:'High ðŸ”¥',low:'Low',
    yes:'Yes',no:'No',active_status:'Active',stopped:'Stopped',
    all_statuses:'All Statuses',all_steps_added:'All steps added',
    production_system:'Production System',
    setup_system:'System Setup',
    system_name_title:'System Name',system_name_hint:'This name will appear throughout the system, reports and invoices.',
    logo_title:'Company Logo',logo_hint:'Upload your company logo â€” transparent PNG or SVG is best.',
    drag_logo:'Drag logo here or click to upload',logo_formats:'PNG Â· SVG Â· JPG Â· WEBP',
    setup_done:'You\'re all set!',setup_success:'System configured successfully:',
    enter_system:'Enter System â†’',next:'Next â†’',skip:'Skip',
    saving:'Saving...',save_continue:'Save & Continue â†’',
    name_required:'System name is required',system_name_placeholder:'e.g. Bright Star Print Shop',
    no_active_orders:'No active orders',full_name:'Full Name',order_number_lbl:'Order #',order_items_lbl:'Order Items',steps_lbl:'Steps',high_priority:'High Priority',completed_lbl:'Completed',sort_order_lbl:'Sort Order',is_final_lbl:'Final Status',expected_lbl:'Expected',actual_lbl:'Actual',login_username:'Username',login_password:'Password',login_subtitle:'Production Management System',login_required:'Please enter username and password',login_error:'Login error',link_emp_label:'Link to existing employee (optional)',link_emp_placeholder:'â€” Create new employee â€”',avatar_title:'Change Profile Picture',avatar_too_large:'Image too large, max 2MB',avatar_error:'Upload error',users_count:'users',role_admin_short:'Admin',role_user_short:'User',no_results_q:'No results for',customer_lbl:'Customer',recipient_lbl:'Recipient',contact_persons:'Contact Persons',contact_person_lbl:'Order Contact',job_title:'Job Title',add_contact:'Add Contact',no_contacts:'No contacts yet',current_step_lbl:'Current Step',progress_lbl:'Progress',yes:'Yes',no:'No',show_in_kds:'Show in KDS',external_task:'External Task',is_delivery:'Delivery Step',scales_with_qty:'Scales with Qty',qty_per_unit:'Per',unit_lbl:'unit',inactive_lbl:'Inactive',login_btn:'Login',edit_order:'Edit Order',order_preview_title:'Order',notif_info:'Info',notif_success:'Success',notif_warning:'Warning',notif_error:'Error',is_done_lbl:'Final Status',perm_sections:'Sections & Pages',perm_steps:'Production Steps',perm_save:'Save Permissions',perm_admin_full:'Admin has full access with no restrictions',perm_title:'Permissions',perm_view:'View',perm_create:'Add',perm_edit:'Edit',perm_delete:'Delete',perm_orders:'Orders',perm_customers:'Customers',perm_products:'Products',perm_employees:'Employees',perm_kds:'Production Display',perm_delivery_orders:'Delivery Orders',perm_reports:'Reports',perm_settings:'Settings',settings:'Settings',perm_users:'Users',username_lbl:'Username',password_lbl:'Password',password_new:'New Password (leave blank to keep current)',role_lbl:'Role',role_admin:'Admin (full access)',role_user:'User (by permissions)',dept_lbl:'Department',no_dept:'-- No Department --',status_lbl:'Status',active_lbl:'Active',stopped_lbl:'Stopped',new_user:'New User',edit_user:'Edit User',no_results:'No results found',no_orders_done:'No completed orders yet',error:'Error',
    start:'â–¶ Start',complete_step:'âœ“ Complete',view:'ðŸ‘ View',return_to_order:'â†© Return to Order',current_step:'Current Step',stop_order:'â¹ Stop',force_complete:'âš¡ Force Complete',confirm_stop:'Stop this order? It will be marked as cancelled.',confirm_force:'Force-complete this order? All steps will be marked done immediately.',delete_blocked:'Cannot delete an order that has already started',
    start_btn:'â–¶',complete_btn:'âœ“',
    kds_subtitle:'Refreshes every 30 seconds',no_active_kds:'No active orders at the moment',
    waiting:'Waiting',
    n_orders:function(n){ return n+' orders'; },
    n_active:function(n){ return n+' active'; },
    n_done:function(n){ return n+' completed'; },
    n_tasks:function(n){ return n+' tasks'; },
    n_items:function(n){ return n+' items'; },
    n_clients:function(n){ return n+' clients'; },
    overview:'Overview of production status',
    workflow_hint:'Define workflow for each product',
    send_notif_title:'Send Notification',
    unread:function(n){ return n+' unread'; },
    retry:'Retry',ui_error:'UI Error',
    loading:'Loading...',loading_data:'Loading data...',
    switch_lang:'Ø§Ù„ØªØ¨Ø¯ÙŠÙ„ Ù„Ù„Ø¹Ø±Ø¨ÙŠØ©',
    /* â”€â”€ Tasks group label â”€â”€ */
    tasks_label:'Tasks',
    kds_interval_lbl:'Production Display Carousel Interval (seconds)',
    kds_interval_hint:'How many seconds between each page rotation on the TV display',
    delivery_orders:'Delivery Orders',
    delivery_agent:'Delivery Agent',
    no_delivery_orders:'No delivery orders assigned to you',
    /* â”€â”€ Operations Tasks â”€â”€ */
    operations_tasks:'Operations Tasks',operations_label:'Operations',
    ops_task_no:'Task #',ops_new_task:'New Task',ops_edit_task:'Edit Task',
    ops_stages:'Stages',ops_add_stage:'Add Stage',ops_rename_stage:'Rename Stage',
    ops_delete_stage:'Delete Stage',ops_stage_name:'Stage Name',
    ops_move_next_dept:'Move to Next Department',ops_finish_task:'Finish Task',
    ops_completed_tasks:'Completed Tasks',ops_reopen:'Reopen',
    ops_no_stages:'No stages â€” add a stage to get started',
    ops_no_tasks:'No tasks in this stage',
    ops_final_stage_title:'Final Stage',
    ops_final_stage_msg:'This task has reached the final stage of this department.',
    ops_stage_has_tasks:'Cannot delete a stage that contains tasks',
    ops_time:'Time',ops_completed_at:'Completed At',ops_on_time:'On Time',ops_delayed:'Delayed',
  }
};
var I18nCtx = createContext({ t: function(k){ return k; }, lang:'ar', setLang: function(){}, isRtl:true });
function I18nProvider(props) {
  var saved = 'ar';
  try {
    var ls = localStorage.getItem('cspsr_lang');
    saved = ls || props.initialLang || 'ar';
  } catch(e) { saved = props.initialLang || 'ar'; }
  var _s = useState(saved);
  var lang = _s[0], setLangRaw = _s[1];
  function setLang(l) {
    setLangRaw(l);
    try {
      localStorage.setItem('cspsr_lang', l);
    } catch(e) { console.error('[I18n] localStorage error:', e); }
  }
  // Also persist on every lang change via effect
  useEffect(function() {
    try { localStorage.setItem('cspsr_lang', lang); } catch(e) {}
  }, [lang]);
  var isRtl = lang === 'ar';
  var t = useCallback(function(k, arg) {
    var dict = I18N[lang] || I18N.ar;
    var val = dict[k] != null ? dict[k] : (I18N.ar[k] != null ? I18N.ar[k] : k);
    return typeof val === 'function' ? val(arg) : val;
  }, [lang]);
  useEffect(function() {
    _currentLang = lang;
    var root = document.getElementById('cspsr-root');
    if (root) {
      root.style.direction = isRtl ? 'rtl' : 'ltr';
      root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      root.setAttribute('lang', lang);
    }
  }, [lang, isRtl]);
  return h(I18nCtx.Provider, { value: { t:t, lang:lang, setLang:setLang, isRtl:isRtl } }, props.children);
}
function useI18n() { return useContext(I18nCtx); }

/* â”€â”€ Search Context (global topbar search) â”€â”€ */
var SearchCtx = createContext({ q:'', setQ:function(){}, placeholder:'' });
function useSearch() { return useContext(SearchCtx); }

/* â”€â”€ Topbar Context â€” views register subtitle + action â”€â”€ */
var TopbarCtx = createContext({ setMeta:function(){} });
function useTopbar(subtitle, action) {
  var ctx = useContext(TopbarCtx);
  useEffect(function(){
    ctx.setMeta({ subtitle: subtitle, action: action });
    return function(){ ctx.setMeta({ subtitle:'', action:null }); };
  }, [subtitle, action]);
}

/* â”€â”€ Date formatter â”€â”€ */
function fmtDate(val, lang) {
  if (!val) return 'â€”';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric' });
  } catch(e) { return val; }
}
function fmtDateTime(val, lang) {
  if (!val) return 'â€”';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e) { return val; }
}

function openPrint(order) { openPrintWithLang(order, "ar"); }

/* â”€â”€ Safe i18n getter (for render functions outside React tree) â”€â”€ */
var _currentLang = 'ar';
function getLang() { return _currentLang; }
function getT() { return function(k, arg) {
  var dict = I18N[_currentLang] || I18N.ar;
  var val = dict[k] != null ? dict[k] : (I18N.ar[k] != null ? I18N.ar[k] : k);
  return typeof val === 'function' ? val(arg) : val;
}; }

/* â”€â”€ API â”€â”€ */
function cfg() { return window.CSPSR_CONFIG || { root:'/wp-json/cspsr/v1/', nonce:'' }; }
function apiFetch(path, opts) {
  opts = opts || {};
  var c = cfg();
  var url = c.root.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  var token = '';
  try { token = localStorage.getItem('cspsr_token') || ''; } catch(e){}
  var method = opts.method || 'GET';
  return fetch(url, {
    headers: Object.assign({ 'Content-Type':'application/json', 'X-WP-Nonce': c.nonce, 'X-CSPSR-Token': token }, opts.headers || {}),
    method: method,
    body: opts.body || undefined,
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) {
        var msg = (data && (data.message || data.code)) || res.status;
        throw new Error(msg);
      }
      return data;
    });
  }).catch(function(err){
    throw err;
  });
}

/* â”€â”€ Print slip â”€â”€ */
function openPrintWithLang(order, lang) {
  var items = asArr(order.items);
  var itemsHtml = items.length ? '<br><b>Ø§Ù„Ø¹Ù†Ø§ØµØ±:</b><ul>' + items.map(function(i){ return '<li>'+i.product_name+' Ã— '+i.quantity+'</li>'; }).join('') + '</ul>' : '';
  var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Ø·Ù„Ø¨ #'+order.order_number+'</title>'
    + '<style>body{font-family:system-ui;padding:1.5rem;font-size:13px}table{width:100%;border-collapse:collapse}td{padding:.35rem .6rem;border:1px solid #e3e8ef}.lbl{color:#7a8694;width:35%}</style></head><body>'
    + '<h2>ðŸ“¦ Ø·Ù„Ø¨ #'+order.order_number+'</h2><table>'
    + '<tr><td class="lbl">Ø§Ù„Ø¹Ù…ÙŠÙ„</td><td>'+getCust(order)+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„Ù…Ø³ØªÙ„Ù…</td><td>'+getRec(order)+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„Ø­Ø§Ù„Ø©</td><td>'+order.status_slug+'</td></tr>'
    + '<tr><td class="lbl">Ø§Ù„ØªÙ‚Ø¯Ù…</td><td>'+progOf(order)+'%</td></tr>'
    + (order.deadline ? '<tr><td class="lbl">Ø§Ù„Ù…ÙˆØ¹Ø¯</td><td>'+fmtDateTime(order.deadline, lang)+'</td></tr>' : '')
    + (order.delivery_address ? '<tr><td class="lbl">Ø§Ù„Ø¹Ù†ÙˆØ§Ù†</td><td>'+order.delivery_address+'</td></tr>' : '')
    + '</table>' + itemsHtml + '</body></html>';
  var w = window.open('', '_blank', 'width=600,height=700');
  w.document.write(html);
  w.document.close();
  setTimeout(function(){ w.print(); }, 500);
}

/* â”€â”€ Hooks â”€â”€ */
function useBootstrap() {
  var _s = useState({data:null, loading:true, error:null});
  var state = _s[0], setState = _s[1];

  var load = useCallback(function() {
    /* only show spinner on first load */
    setState(function(prev){ return Object.assign({},prev,{loading:true}); });
    apiFetch('bootstrap')
      .then(function(d){ setState({data:d, loading:false, error:null}); try{window.__CSPSR_BS__=d;}catch(e){} })
      .catch(function(e){ setState(function(prev){ return Object.assign({},prev,{loading:false,error:e.message}); }); });
  }, []);

  var silentReload = useCallback(function() {
    apiFetch('bootstrap')
      .then(function(d){ setState(function(prev){ return Object.assign({},prev,{data:d}); }); })
      .catch(function(){});
  }, []);

  useEffect(function(){ load(); }, [load]);
  return { data:state.data, loading:state.loading, error:state.error, reload:load, silentReload:silentReload };
}
function useCRUD(resource) {
  var _s = useState([]); var items = _s[0], setItems = _s[1];
  var _l = useState(false); var loading = _l[0], setLoading = _l[1];
  var load = useCallback(function() {
    setLoading(true);
    apiFetch(resource).then(function(d){ setItems(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }, [resource]);
  useEffect(function(){ load(); }, [load]);
  function create(d) { return apiFetch(resource, {method:'POST',body:JSON.stringify(d)}).then(load); }
  function update(id,d) { return apiFetch(resource+'/'+id, {method:'PUT',body:JSON.stringify(d)}).then(load); }
  function remove(id) { return apiFetch(resource+'/'+id, {method:'DELETE'}).then(load); }
  return { items:items, loading:loading, create:create, update:update, remove:remove, load:load };
}

/* â•â•â• UI COMPONENTS â•â•â• */

