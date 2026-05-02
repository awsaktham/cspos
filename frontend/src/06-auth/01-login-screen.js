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
