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
