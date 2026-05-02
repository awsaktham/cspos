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

  useEffect(function(){
    if (!_stored || !_stored.token) return;
    apiFetch('auth/me')
      .then(function(res){
        if (!res || !res.user) return;
        setAuthUser(res.user);
        setAuthPerms(res.permissions || []);
        setStoredAuth(_stored.token, res.user, res.permissions || []);
      })
      .catch(function(){
        clearStoredAuth();
        setAuthUser(null);
        setAuthPerms([]);
      });
  }, []);

  var lang = (function(){ try { return localStorage.getItem('cspsr_lang') || cfg().lang || 'ar'; } catch(e) { return cfg().lang || 'ar'; } })();

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
      h(AppInner, { bs:bs, branding:branding, authUser:authUser, authPerms:authPerms, onLogout:doLogout, onAvatarUpdate:onAvatarUpdate, onBrandingUpdate:function(b){ setBranding(b); } })
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
