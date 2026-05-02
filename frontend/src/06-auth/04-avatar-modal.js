function AvatarModal(props) {
  var i18n = useI18n(); var t = i18n.t;
  var _prev = useState(props.user.avatar||null); var preview = _prev[0], setPreview = _prev[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];
  var _err = useState(''); var err = _err[0], setErr = _err[1];

  function onFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { setErr(t('avatar_too_large')); return; }
    var reader = new FileReader();
    reader.onload = function(ev){ setPreview(ev.target.result); setErr(''); };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!preview || preview === props.user.avatar) { props.onClose(); return; }
    setSaving(true);
    apiFetch('app-users/'+props.user.id+'/avatar', { method:'POST', body:JSON.stringify({ avatar:preview }) })
      .then(function(res){
        setSaving(false);
        props.onSaved(res.avatar);
        props.onClose();
      })
      .catch(function(e){ setSaving(false); setErr(e.message||t('avatar_error')); });
  }

  return h(Modal, { title:t('avatar_title'), onClose:props.onClose, width:380,
    footer:h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
      h(Btn,{onClick:save},saving?h(Spinner):t('save'))
    )},
    h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'8px 0'}},
      h(UserAvatar,{user:Object.assign({},props.user,{avatar:preview}),size:90}),
      h('label',{style:{cursor:'pointer',padding:'8px 20px',border:'1px dashed '+T.border,borderRadius:T.radius,color:T.textMute,fontSize:13,textAlign:'center',width:'100%'}},
        '📷 اختر صورة',
        h('input',{type:'file',accept:'image/*',onChange:onFile,style:{display:'none'}})
      ),
      preview && h('button',{onClick:function(){setPreview(null);},style:{fontSize:12,color:T.red,background:'transparent',border:'none',cursor:'pointer'}},'✕ حذف الصورة'),
      err && h('div',{style:{color:T.red,fontSize:12}},err)
    )
  );
}

function SettingsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var branding = props.branding || {};
  var initReasons = (branding.pause_reasons || []).map(function(r,i){ return Object.assign({},r,{_id:i}); });
  var _rs = useState(initReasons); var reasons = _rs[0], setReasons = _rs[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];
  var _saved = useState(false); var saved = _saved[0], setSaved = _saved[1];
  var _newAr = useState(''); var newAr = _newAr[0], setNewAr = _newAr[1];
  var _newEn = useState(''); var newEn = _newEn[0], setNewEn = _newEn[1];
  var _newMachine = useState(''); var newMachine = _newMachine[0], setNewMachine = _newMachine[1];
  var _newStep = useState(''); var newStep = _newStep[0], setNewStep = _newStep[1];
  var _kdsInterval = useState(branding.kds_carousel_interval || 8); var kdsInterval = _kdsInterval[0], setKdsInterval = _kdsInterval[1];
  var _waNotify = useState(branding.whatsapp_notify || ''); var waNotify = _waNotify[0], setWaNotify = _waNotify[1];
  var _confirmPreset = useState(false); var confirmPreset = _confirmPreset[0], setConfirmPreset = _confirmPreset[1];

  // â”€â”€ PRESET REASONS â€” ÙƒÙ„ Ø£Ø³Ø¨Ø§Ø¨ Ø§Ù„ØªÙˆÙ‚Ù Ù„Ù…Ø¹Ø¯Ø§Øª Ø§Ù„Ù…Ø·Ø¨Ø¹Ø© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var PRESET_REASONS = [
    // â”€â”€ XEROX VERSANT 180 â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØªÙˆÙ†Ø±',en:'Toner Empty',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªØ­Ø°ÙŠØ± ØªÙˆÙ†Ø± Ù…Ù†Ø®ÙØ¶',en:'Low Toner Warning',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù†Ù‚Ù„ IBT',en:'IBT Belt Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ØªØºØ°ÙŠØ© Ø§Ù„ÙˆØ±Ù‚',en:'Paper Feed Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ø±ØªÙØ§Ø¹ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Overheat Shutdown',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„ ÙÙŠ Ø§Ù„Ø´Ø§Ø´Ø©',en:'Error Code on Screen',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ© Ù…Ø¬Ø¯ÙˆÙ„Ø©',en:'Scheduled Maintenance',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ø³ØªØ¨Ø¯Ø§Ù„ ÙˆØ­Ø¯Ø© Ø§Ù„ØµÙˆØ± Drum',en:'Drum Unit Replacement',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ø£Ù„ÙˆØ§Ù† ÙƒØ§Ù„ÙŠØ¨Ø±ÙŠØ´Ù†',en:'Color Calibration',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©',en:'Internal Path Cleaning',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø³ØªÙŠØ¨Ù„Ø± Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ',en:'Internal Stapler Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Finisher',en:'Finisher Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø«Ù†ÙŠ',en:'Fold Unit Error',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Xerox Versant 180',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ CANON C650i â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± CMYK',en:'Ink Cartridge Empty (CMYK)',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø­Ø¨Ø± Waste Toner',en:'Waste Toner Box Full',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¯Ø±Ø¬',en:'Tray Feed Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø·Ø¨Ù„ Drum',en:'Drum Unit Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„',en:'Error Code',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ©',en:'Periodic Maintenance',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· ÙƒØ«Ø§ÙØ© Ø§Ù„Ø£Ù„ÙˆØ§Ù†',en:'Color Density Calibration',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Finisher',en:'Finisher Unit Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Print Head Cleaning',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù€ Stapler Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ',en:'External Stapler Error',machine:'Canon C650i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ CANON 5550i â”€â”€
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø©',en:'Paper Jam',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ù€ Fuser',en:'Fuser Error',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± CMYK',en:'Ink Empty (CMYK)',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø­Ø¨Ø± Waste Toner',en:'Waste Toner Full',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¯Ø±Ø¬',en:'Tray Feed Error',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø±Ù…Ø² Ø¹Ø·Ù„',en:'Error Code',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ©',en:'Periodic Maintenance',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙˆÙ‚Ù Ù…ÙØ§Ø¬Ø¦ Ø¨Ø¯ÙˆÙ† Ø±Ù…Ø²',en:'Unexpected Shutdown',machine:'Canon 5550i',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ EVLOIS / EPSON L805 â”€â”€
    {ar:'Ø§Ù†Ø³Ø¯Ø§Ø¯ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Printhead Clog',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø­Ø¨Ø± - Ø£ÙŠ Ù„ÙˆÙ†',en:'Ink Empty (any color)',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚Ø© Ù…Ø³Ø­ÙˆØ¨Ø© Ø£Ùˆ Ù…Ù†Ø­Ø±ÙØ©',en:'Paper Jam / Skew',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªØ³Ø±Ø¨ Ø­Ø¨Ø± Ø¯Ø§Ø®Ù„ÙŠ',en:'Ink Leak',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Encoder Strip',en:'Encoder Strip Error',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ù†ØªÙ‡Ø§Ø¡ Ø¹Ù…Ø± Waste Ink Pad',en:'Waste Ink Pad Full',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù…Ø­Ø±Ùƒ Ø§Ù„ÙƒØ§Ø±ØªØ±ÙŠØ¯Ø¬',en:'Cartridge Motor Error',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ù…Ø­Ø§Ø°Ø§Ø©',en:'Alignment Calibration',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ØªÙ†Ø¸ÙŠÙ Ø±Ø£Ø³ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©',en:'Head Cleaning Cycle',machine:'Epson L805',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    // â”€â”€ FLAT HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Temperature Fluctuation',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Pressure Issue',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø§Ù„Ø³ÙŠÙ„ÙŠÙƒÙˆÙ† Ø§Ù„ÙˆØ§Ù‚ÙŠ',en:'Silicone Pad Damaged',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªÙÙ„ÙˆÙ†',en:'Teflon Sheet Worn Out',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Timer',en:'Timer Error',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ù…Ù†ØªØ¬ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¶ØºØ·',en:'Product Misalignment During Press',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Transfer Paper',en:'Transfer Paper Out of Stock',machine:'Flat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ 3D HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ù‚Ø§Ù„Ø¨ Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ',en:'Outer Mold Issue',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©',en:'Temperature Fluctuation',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªØ³Ø¨Ù„ÙŠÙ…ÙŠØ´Ù†',en:'Sublimation Blanks Empty',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„',en:'Transfer Paper Out of Stock',machine:'3D Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ HAT HEATING PRESS FREESUB â”€â”€
    {ar:'Ø¹Ø¯Ù… ÙˆØµÙˆÙ„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ù„Ù„Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Not Reaching Target Temp',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¹Ù†ØµØ± Ø§Ù„ØªØ³Ø®ÙŠÙ†',en:'Heating Element Damaged',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù‚Ø§Ù„Ø¨ Ø§Ù„ÙƒØ§Ø¨',en:'Hat Mold Issue',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙƒØ§Ø¨',en:'Print Misalignment on Hat',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„',en:'Transfer Paper Out of Stock',machine:'Hat Heat Press Freesub',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ BOOKLET STAPLE YALE â”€â”€
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø¯Ø¨Ø§Ø³Ø© Ø³ØªÙŠØ¨Ù„',en:'Staples Empty',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ÙˆØ±Ù‚ Ù…Ø³Ø­ÙˆØ¨ Ø¬Ø§Ù…',en:'Paper Jam',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø¹Ø¯Ù… Ù…Ø­Ø§Ø°Ø§Ø© Ø§Ù„ÙˆØ±Ù‚',en:'Paper Misalignment',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ÙˆØ­Ø¯Ø© Ø§Ù„Ø·ÙŠ',en:'Folding Unit Error',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø¶Ø¨Ø· Ù…Ù‚Ø§Ø³ Ø§Ù„ÙƒØªÙŠØ¨',en:'Booklet Size Adjustment',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø¥Ø¨Ø±Ø© Ø§Ù„Ø¯Ø¨Ø§Ø³Ø©',en:'Staple Needle Damaged',machine:'Booklet Stapler Yale',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ TRIMMING MACHINE â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø§Ù„Ø´ÙØ±Ø©',en:'Blade Worn Out',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù‚Ø§Ø³',en:'Size Drift',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'ÙˆØ±Ù‚ Ø¹Ø§Ù„Ù‚ ÙÙŠ Ø§Ù„Ø´ÙØ±Ø©',en:'Paper Stuck in Blade',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø¶Ø¨Ø· Ø§Ù„Ù€ Back Gauge',en:'Back Gauge Adjustment',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'ØªØºÙŠÙŠØ± Ø§Ù„Ø´ÙØ±Ø©',en:'Blade Replacement',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶Ø§ØºØ· Ø§Ù„Ù‡ÙˆØ§Ø¦ÙŠ',en:'Air Clamp Issue',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ù‚Ø·Ø¹ Ø¹Ù† Ø§Ù„Ù…Ù‚Ø§Ø³',en:'Cut Size Off',machine:'Trimming Machine',step:'Ù‚Ø·Ø¹'},
    // â”€â”€ BINDING MACHINE â”€â”€
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„ØºØ±Ø§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Hot Glue Issue',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø§Ù„ØºØ±Ø§Ø¡ Ù„Ù… ÙŠØµÙ„ Ù„Ù„Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©',en:'Glue Not Heated',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØºØ±Ø§Ø¡',en:'Glue Empty',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„ÙˆØ±Ù‚ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¬Ù„ÙŠØ¯',en:'Paper Shift During Binding',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'ØªÙ„Ù ÙÙŠ Ø­Ø§Ù…Ù„ Ø§Ù„ÙƒØªØ§Ø¨',en:'Book Clamp Damaged',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø¹Ø¯Ù… Ø§Ù„ØªØµØ§Ù‚ Ø§Ù„ØºÙ„Ø§Ù',en:'Cover Not Adhering',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ù…Ø­Ø§Ø°Ø§Ø© Ø§Ù„ÙƒØªØ§Ø¨',en:'Book Misalignment',machine:'Binding Machine',step:'ØªØ¬Ù„ÙŠØ¯'},
    // â”€â”€ SPIRAL PUNCHING / MANUAL â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø³ÙƒØ§ÙƒÙŠÙ† Ø§Ù„Ø«Ù‚Ø¨',en:'Punch Dies Worn Out',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø­Ø±Ø§Ù Ø§Ù„Ø«Ù‚ÙˆØ¨ Ø¹Ù† Ø§Ù„Ù…Ø­Ø§Ø°Ø§Ø©',en:'Hole Misalignment',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØ¹Ø·Ù„ Ù…Ø­Ø±Ùƒ Ø§Ù„Ø«Ù‚Ø¨',en:'Punch Motor Error',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Out of Stock',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Insertion Issue',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ÙˆØ±Ù‚ Ø¹Ø§Ù„Ù‚ ÙÙŠ Ø§Ù„Ø«Ø§Ù‚Ø¨Ø©',en:'Paper Stuck in Puncher',machine:'Spiral Punching Machine',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ ROUNDED CORNER PRESS â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ø²Ø§ÙˆÙŠØ©',en:'Corner Die Worn Out',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù†ØªØ¬',en:'Product Misalignment',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Press Pressure Issue',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØºÙŠÙŠØ± Ù‚Ø§Ù„Ø¨ Ø§Ù„Ù‚Øµ',en:'Die Change Required',machine:'Rounded Corner Press',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ CIRCLE PRESS 5x5 â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ø¯Ø§Ø¦Ø±Ø©',en:'Circle Die Worn Out',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ù†ØªØ¬',en:'Product Misalignment',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø¶ØºØ·',en:'Press Pressure Issue',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'ØªØºÙŠÙŠØ± Ù‚Ø§Ù„Ø¨ Ø§Ù„Ù‚Øµ',en:'Die Change Required',machine:'Circle Press 5x5',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ UV / CAMEO 3 â”€â”€
    {ar:'ØªØ¨Ù„Ø¯ Ø´ÙØ±Ø© Ø§Ù„Ù‚Ø·Ø¹',en:'Cutting Blade Worn',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†Ø²ÙŠØ§Ø­ Ø§Ù„Ù…Ø³Ø¬Ù„ Registration',en:'Registration Offset',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ØªØºØ°ÙŠØ© Ø§Ù„ÙˆØ±Ù‚ Ø£Ùˆ Ø§Ù„ÙÙŠÙ†ÙŠÙ„',en:'Media Feed Error',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù€ Mat',en:'Mat Worn / Dirty',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'ØªÙ„Ù Ø±Ø£Ø³ Ø§Ù„Ù‚Ø·Ø¹',en:'Cutting Head Damaged',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ USB',en:'USB Connection Error',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø¶Ø¨Ø· Ù‚ÙˆØ© Ø§Ù„Ù‚Ø·Ø¹',en:'Cut Force Calibration',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù„Ù…Ù„Ù Ù„Ø§ ÙŠÙÙ‚Ø±Ø£ ÙÙŠ Silhouette Studio',en:'File Read Error in Studio',machine:'Cameo 3',step:'Ù‚Ø·Ø¹'},
    // â”€â”€ UPS â”€â”€
    {ar:'Ø§Ù†Ù‚Ø·Ø§Ø¹ Ø§Ù„ØªÙŠØ§Ø± Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠ',en:'Power Outage',machine:'UPS',step:''},
    {ar:'ØªØ­Ø°ÙŠØ± Ø¨Ø·Ø§Ø±ÙŠØ© UPS Ù…Ù†Ø®ÙØ¶Ø©',en:'UPS Battery Low',machine:'UPS',step:''},
    {ar:'ØªÙ„Ù Ø¨Ø·Ø§Ø±ÙŠØ© UPS',en:'UPS Battery Failure',machine:'UPS',step:''},
    {ar:'ØªØ°Ø¨Ø°Ø¨ ÙÙŠ Ø§Ù„Ø¬Ù‡Ø¯ Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠ',en:'Voltage Fluctuation',machine:'UPS',step:''},
    {ar:'ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ù…Ù„ Ø¹Ù„Ù‰ UPS',en:'UPS Overload',machine:'UPS',step:''},
    // â”€â”€ SERVER / NETWORK â”€â”€
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ RIP Server',en:'RIP Server Error',machine:'Server Dell',step:''},
    {ar:'Ø§Ù„Ø´Ø¨ÙƒØ© Ù…Ù†Ù‚Ø·Ø¹Ø©',en:'Network Down',machine:'Server Dell',step:''},
    {ar:'Ø§Ù„Ø¬Ù‡Ø§Ø² ÙŠØ¹ÙŠØ¯ Ø§Ù„ØªØ´ØºÙŠÙ„',en:'System Restart',machine:'Server Dell',step:''},
    {ar:'Ù…Ø³Ø§Ø­Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ù…Ù…ØªÙ„Ø¦Ø©',en:'Storage Full',machine:'Server Dell',step:''},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ù…Ù„ÙØ§Øª',en:'File Receiving Error',machine:'Server Dell',step:''},
    // â”€â”€ Ù…ÙˆØ§Ø¯ Ø£ÙˆÙ„ÙŠØ© â”€â”€
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ÙˆØ±Ù‚',en:'Paper Out of Stock',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚ ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ù…ÙˆØ§ØµÙØ§Øª',en:'Wrong Paper Spec',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'ÙˆØ±Ù‚ Ø±Ø·Ø¨ Ø£Ùˆ ØªØ§Ù„Ù',en:'Wet / Damaged Paper',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± ØªÙˆØ±ÙŠØ¯ Ø§Ù„ÙˆØ±Ù‚',en:'Waiting for Paper Delivery',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ù†ÙØ§Ø¯ ÙÙŠÙ„Ù… Ø§Ù„Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†',en:'Lamination Film Empty',machine:'',step:'Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†'},
    {ar:'ÙÙŠÙ„Ù… Ù„Ø§ ÙŠÙ„ØªØµÙ‚ Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­',en:'Film Not Adhering',machine:'',step:'Ù„Ø§Ù…ÙŠÙ†ÙŠØ´Ù†'},
    {ar:'Ù†ÙØ§Ø¯ ÙˆØ±Ù‚ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Transfer Paper Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªØ³Ø¨Ù„ÙŠÙ…ÙŠØ´Ù†',en:'Sublimation Blanks Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„ØºØ±Ø§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø±ÙŠ',en:'Hot Glue Empty',machine:'',step:'ØªØ¬Ù„ÙŠØ¯'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø³Ø¨ÙŠØ±Ø§Ù„',en:'Spiral Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    {ar:'Ù†ÙØ§Ø¯ Ø§Ù„Ø¯Ø¨Ø§Ø³Ø©',en:'Staples Empty',machine:'',step:'ØªØ´Ø·ÙŠØ¨'},
    // â”€â”€ Ø£Ø³Ø¨Ø§Ø¨ ØªØ´ØºÙŠÙ„ÙŠØ© â”€â”€
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± Ù…ÙˆØ§ÙÙ‚Ø© Ø¨Ø±ÙˆÙ Ù…Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„',en:'Waiting for Client Proof Approval',machine:'',step:''},
    {ar:'Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ù…Ù„Ù Ø§Ù„ØªØµÙ…ÙŠÙ…',en:'Design File Issue',machine:'',step:''},
    {ar:'Ø¥Ø¹Ø§Ø¯Ø© Ø·Ø¨Ø§Ø¹Ø© Ø¨Ø³Ø¨Ø¨ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù„ÙˆÙ†',en:'Reprint â€” Color Error',machine:'',step:'Ø·Ø¨Ø§Ø¹Ø©'},
    {ar:'Ø¥Ø¹Ø§Ø¯Ø© Ø·Ø¨Ø§Ø¹Ø© Ø¨Ø³Ø¨Ø¨ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù‚Øµ',en:'Reprint â€” Cutting Error',machine:'',step:'Ù‚Ø·Ø¹'},
    {ar:'Ø§Ù†ØªØ¸Ø§Ø± Ù‚Ø³Ù… Ø¢Ø®Ø±',en:'Waiting for Another Department',machine:'',step:''},
    {ar:'ØºÙŠØ§Ø¨ Ù…ÙˆØ¸Ù Ù…Ø³Ø¤ÙˆÙ„',en:'Staff Absence',machine:'',step:''},
    {ar:'ØªÙˆÙ‚Ù ØºÙŠØ± Ù…Ø¨Ø±Ø±',en:'Unexplained Stoppage',machine:'',step:''},
  ];

  useTopbar(lang==='en' ? 'Settings' : 'الإعدادات');

  function addReason() {
    if (!newAr.trim() && !newEn.trim()) return;
    setReasons(function(prev){ return prev.concat([{ar:newAr.trim(), en:newEn.trim(), machine:newMachine.trim(), step:newStep.trim(), _id:Date.now()}]); });
    setNewAr(''); setNewEn(''); setNewMachine(''); setNewStep('');
  }
  function removeReason(id) { setReasons(function(prev){ return prev.filter(function(r){ return r._id !== id; }); }); }
  function updateReason(id, field, val) {
    setReasons(function(prev){ return prev.map(function(r){ if (r._id!==id) return r; var u={}; u[field]=val; return Object.assign({},r,u); }); });
  }
  function save() {
    setSaving(true);
    var clean = reasons.map(function(r){ return {ar:r.ar||'', en:r.en||'', machine:r.machine||'', step:r.step||''}; });
    var interval = Math.max(3, Math.min(120, parseInt(kdsInterval,10)||8));
    apiFetch('setup', {method:'POST', body:JSON.stringify({pause_reasons: clean, kds_carousel_interval: interval, whatsapp_notify: waNotify.trim()})})
      .then(function(){
        setSaving(false); setSaved(true);
        setTimeout(function(){ setSaved(false); }, 2000);
        if (props.onBrandingUpdate) props.onBrandingUpdate(Object.assign({},branding,{pause_reasons:clean, kds_carousel_interval:interval, whatsapp_notify:waNotify.trim()}));
      })
      .catch(function(){ setSaving(false); });
  }

  var inSt = {width:'100%',padding:'7px 9px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bgSub,color:T.text,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'};

  var _stab = useState('reasons'); var stab = _stab[0], setStab = _stab[1];
  var STABS = [
    {key:'reasons', icon:'⏸', ar:'أسباب التوقف', en:'Pause Reasons'},
    {key:'kds',     icon:'📺', ar:'شاشة الإنتاج', en:'Production Display'},
  ];

  return h('div', { style:{ maxWidth:960, padding:'0 4px' } },
    /* â”€â”€ Tab bar â”€â”€ */
    h('div', { style:{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid '+T.border, paddingBottom:0 } },
      STABS.map(function(tb){
        var active = stab === tb.key;
        return h('button', { key:tb.key, onClick:function(){ setStab(tb.key); }, style:{
          padding:'9px 18px', background:'transparent', border:'none', borderBottom: active?'2px solid '+T.accent:'2px solid transparent',
          marginBottom:'-2px', color: active?T.accent:T.textMute, fontWeight: active?700:400,
          fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .15s'
        }},
          h('span',null, tb.icon), h('span',null, lang==='en'?tb.en:tb.ar)
        );
      })
    ),

    /* â•â• Tab: Pause Reasons â•â• */
    stab==='reasons' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:8 } },
        h('div', null,
          h('div', { style:{ fontWeight:700, fontSize:15 } }, lang==='en' ? 'Delay & Pause Reasons' : 'أسباب التأخير والإيقاف'),
          h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } },
            lang==='en' ? 'Appear when pausing a step or recording a delivery delay.' : 'تظهر عند إيقاف خطوة أو تسجيل سبب تأخير.'
          )
        ),
        h('button', {
          onClick: function(){ setConfirmPreset(true); },
          style:{ padding:'6px 14px', borderRadius:T.radius, border:'1px solid '+T.accent, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }
        }, lang==='en' ? '⚡ Load Preset Reasons' : '⚡ تحميل الأسباب الجاهزة')
      ),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:12 } },
        lang==='en'
          ? 'These reasons appear when pausing a step or recording a delivery delay. Optionally specify the machine and step for each reason.'
          : 'هذه الأسباب تظهر عند إيقاف خطوة أو تسجيل سبب تأخير. يمكن تحديد الماكينة والخطوة لكل سبب.'
      ),
      confirmPreset && h('div', { style:{ background:'rgba(245,158,11,.08)', border:'1px solid #f59e0b', borderRadius:T.radius, padding:'12px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' } },
        h('span', { style:{ fontSize:13, color:T.text, flex:1 } },
          lang==='en'
            ? '⚠️ This will replace all current reasons with the preset list ('+PRESET_REASONS.length+' reasons). Continue?'
            : '⚠️ سيتم استبدال كل الأسباب الحالية بالقائمة الجاهزة ('+PRESET_REASONS.length+' سبب). تأكيد؟'
        ),
        h('div', { style:{ display:'flex', gap:8 } },
          h('button', { onClick:function(){ setConfirmPreset(false); }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bgCard, color:T.text, cursor:'pointer', fontSize:12 } }, lang==='en'?'Cancel':'إلغاء'),
          h('button', { onClick:function(){
            setReasons(PRESET_REASONS.map(function(r,i){ return Object.assign({},r,{_id:Date.now()+i}); }));
            setConfirmPreset(false);
          }, style:{ padding:'6px 12px', borderRadius:T.radius, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 } }, lang==='en'?'Yes, Load':'نعم، حمّل')
        )
      ),
      /* Column headers */
      reasons.length > 0 && h('div', {style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,marginBottom:6,paddingBottom:6,borderBottom:'1px solid '+T.border}},
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Arabic':'العربي'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'English':'الإنجليزي'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Machine':'الماكينة'),
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Step':'الخطوة'),
        h('span',null)
      ),
      /* Existing reasons */
      reasons.length === 0
        ? h('div', { style:{ color:T.textMute, fontSize:13, marginBottom:16, padding:'16px', background:T.bgSub, borderRadius:T.radius, textAlign:'center' } },
            lang==='en' ? 'No reasons added yet' : 'لم تُضف أسباب بعد'
          )
        : h('div', { style:{ marginBottom:16 } },
            reasons.map(function(r) {
              return h('div', { key:r._id, style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center' } },
                h('input', { value:r.ar||'', onChange:function(e){ updateReason(r._id,'ar',e.target.value); }, style:Object.assign({},inSt,{direction:'rtl'}), placeholder:'سبب الإيقاف...' }),
                h('input', { value:r.en||'', onChange:function(e){ updateReason(r._id,'en',e.target.value); }, style:inSt, placeholder:'Pause reason...' }),
                h('input', { value:r.machine||'', onChange:function(e){ updateReason(r._id,'machine',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Press A':'مثال: مكبس A' }),
                h('input', { value:r.step||'', onChange:function(e){ updateReason(r._id,'step',e.target.value); }, style:inSt, placeholder:lang==='en'?'e.g. Printing':'مثال: طباعة' }),
                h('button', { onClick:function(){ removeReason(r._id); }, style:{ padding:'6px 11px', borderRadius:T.radius, border:'none', background:'#fee2e2', color:T.red, cursor:'pointer', fontWeight:700, fontSize:13 } }, 'Ã—')
              );
            })
          ),
      /* Add new reason */
      h('div', { style:{ borderTop:'1px solid '+T.border, paddingTop:16 } },
        h('div',{style:{fontSize:12,fontWeight:600,color:T.textMute,marginBottom:8}}, lang==='en'?'Add new reason:':'إضافة سبب جديد:'),
        h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'flex-end' } },
          h(Input, { label:lang==='en'?'Arabic':'العربي', value:newAr, onChange:setNewAr, placeholder:'سبب الإيقاف...' }),
          h(Input, { label:lang==='en'?'English':'الإنجليزي', value:newEn, onChange:setNewEn, placeholder:'Pause reason...' }),
          h(Input, { label:lang==='en'?'Machine (optional)':'الماكينة (اختياري)', value:newMachine, onChange:setNewMachine }),
          h(Input, { label:lang==='en'?'Step (optional)':'الخطوة (اختياري)', value:newStep, onChange:setNewStep }),
          h(Btn, { variant:'primary', onClick:addReason, style:{marginBottom:2} }, '+ '+(lang==='en'?'Add':'إضافة'))
        )
      ),
      /* Save */
      h('div', { style:{ marginTop:20, display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
      )
    ),

    /* â•â• Tab: Production Display â•â• */
    stab==='kds' && h(Card, { style:{ padding:'20px 24px', marginBottom:16 } },
      h('div', { style:{ fontWeight:700, fontSize:15, marginBottom:4 } },
        lang==='en' ? '📺 Production Display (TV)' : '📺 شاشة الإنتاج (TV)'
      ),
      h('div', { style:{ color:T.textMute, fontSize:12, marginBottom:20 } }, t('kds_interval_hint')),
      /* Carousel interval */
      h('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:20, maxWidth:400, background:T.bgSub, borderRadius:T.radius, padding:'14px 16px' } },
        h('label', { style:{ fontSize:13, fontWeight:600, color:T.text, flex:1 } }, t('kds_interval_lbl')),
        h('input', {
          type:'number', min:3, max:120, step:1,
          value: kdsInterval,
          onChange: function(e){ setKdsInterval(parseInt(e.target.value,10)||8); },
          style:{ width:72, padding:'7px 10px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:15, fontWeight:700, outline:'none', textAlign:'center' }
        }),
        h('span', { style:{ fontSize:12, color:T.textMute } }, lang==='en'?'seconds':'ثانية')
      ),
      /* WhatsApp */
      h('div', { style:{ fontWeight:600, fontSize:13, marginBottom:8, color:T.text } },
        '📱 '+(lang==='en' ? 'WhatsApp Notify Number' : 'رقم واتساب للإشعارات')
      ),
      h('div', { style:{ display:'flex', alignItems:'center', gap:10, maxWidth:400, marginBottom:6 } },
        h('input', {
          type:'text',
          placeholder: '9647701234567',
          value: waNotify,
          onChange: function(e){ setWaNotify(e.target.value); },
          style:{ flex:1, padding:'9px 12px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bgSub, color:T.text, fontSize:13, outline:'none' }
        })
      ),
      h('div',{style:{fontSize:11,color:T.textMute,marginBottom:20}},
        lang==='en' ? 'With country code, no + (e.g. 9647701234567)' : 'مع رمز الدولة، بدون + (مثال: 9647701234567)'
      ),
      h('div', { style:{ display:'flex', gap:10, alignItems:'center' } },
        h(Btn, { variant:'primary', onClick:save, disabled:saving }, saving ? '...' : (lang==='en'?'Save':'حفظ')),
        saved && h('span', { style:{ color:T.green, fontSize:13, fontWeight:600 } }, '✅ '+(lang==='en'?'Saved!':'تم الحفظ!'))
      )
    )
  );
}


