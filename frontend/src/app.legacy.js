'use strict';
/* ColorSource Production Suite v6.0.2 — ES5 compatible, no optional chaining */

var _React    = React;
var useState  = _React.useState;
var useEffect = _React.useEffect;
var useRef    = _React.useRef;
var useCallback = _React.useCallback;
var createContext = _React.createContext;
var useContext = _React.useContext;
var h = React.createElement;

/* ── Helpers ── */
function g(obj, key) { return obj && obj[key] != null ? obj[key] : undefined; }
function gd(obj, key, def) { var v = g(obj, key); return v != null ? v : def; }
function asArr(v) { return Array.isArray(v) ? v : []; }
function getCust(o, lang) {
  if (!o) return '—';
  if (lang === 'en') {
    return (o.customer_company_name_en || o.company_name_en || o.customer_name_en || o.customer_company_name || o.company_name || o.customer_name) || '—';
  }
  return (o.customer_company_name || o.company_name || o.customer_name) || '—';
}
function getRec(o)  { return (o && (o.recipient_name || o.delivery_address)) || '—'; }
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

/* ── Design tokens ── */
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

/* ── Layout helpers ── */
function startOf(isRtl) { return isRtl ? 'right' : 'left'; }
function endOf(isRtl)   { return isRtl ? 'left' : 'right'; }


var I18N = {
  ar:{
    dashboard:'لوحة التحكم',orders:'الطلبات',completed_orders:'الطلبات المكتملة',
    customers:'العملاء',products:'المنتجات',suppliers:'المجهزون',product_steps:'خطوات المنتج',product_workflow:'سير عمل المنتجات',workflow:'الخطوات',workflow_steps:'خطوات الإنتاج',step_library:'مكتبة الخطوات',step_library_hint:'الخطوات المشتركة بين المنتجات',pick_from_library:'اختر من المكتبة',default_minutes:'الوقت الافتراضي (دقيقة)',expected_min:'الوقت المتوقع (دقيقة)',expected_total:'الوقت الإجمالي',est_completion:'موعد الإنجاز المتوقع',queue_pos:'الترتيب',actual_time:'الوقت الفعلي',time_diff:'الفرق',on_time:'في الوقت',ahead:'أسرع',late:'متأخر',delay_reason_title:'تأخير في التسليم',order_recipients:'المستلمون',add_recipient:'إضافة مستلم',no_recipient_warn:'يجب إضافة مستلم واحد على الأقل',no_deadline_warn:'يجب تحديد الديد لاين',recipient_added:'تم إضافة المستلم',select_recipient:'اختر مستلماً',delay_reason_prompt:'الطلب تجاوز الديد لاين. يرجى ذكر سبب التأخير:',delay_reason_placeholder:'اكتب سبب التأخير...',delay_submit:'تأكيد',delay_skip:'تخطي',expected_time:'الوقت لكل وحدة',actual_min:'الوقت الفعلي',time_unit:'الوحدة',minutes:'دقيقة',hours_unit:'ساعة',time_diff:'الفرق',on_time:'في الوقت',ahead:'أسرع',late:'متأخر',contact_person:'شخص التواصل',contact_name:'الاسم',contact_phone:'الهاتف',contact_email:'الإيميل',contact_map:'رابط الخريطة',contact_address:'العنوان',temp_contact:'مستلم مؤقت',temp_recipient_lbl:'مستلم مؤقت',
    steps:'الخطوات',my_tasks:'مهامي',external_tasks:'المهام الخارجية',
    roles:'الأدوار',departments:'الأقسام',teams:'الفرق',
    employees:'الموظفون',statuses:'الحالات',notifications:'الإشعارات',kds:'شاشة الإنتاج',users_mgmt:'المستخدمون',
    add:'إضافة',edit:'تعديل',delete:'حذف',save:'حفظ',cancel:'إلغاء',
    confirm_delete:'هل أنت متأكد من الحذف؟',
    name:'الاسم',phone:'الهاتف',address:'العنوان',notes:'ملاحظات',color:'اللون',
    order_number:'رقم الطلب',customer:'العميل',recipient:'المستلم',
    deadline:'تاريخ التوصيل',priority:'الأولوية',status:'الحالة',
    expected_hours:'ساعات متوقعة',actual_hours:'ساعات فعلية',
    in_progress:'قيد التنفيذ',pending:'قيد الانتظار',done:'مكتمل',ready:'جاهز للتسليم',
    no_data:'لا توجد بيانات',search:'بحث',company:'الشركة',map:'الخريطة',print:'طباعة',
    quantity:'الكمية',product:'المنتج',employee:'الموظف',team:'الفريق',role:'الدور',department:'القسم',
    new_order:'طلب جديد',add_item:'إضافة عنصر',
    delivery_address:'عنوان التسليم',delivery_notes:'ملاحظات التسليم',
    recipient_name:'اسم المستلم',company_name:'اسم الشركة',
    active:'نشط',inactive:'غير نشط',sku:'رمز المنتج',
    step_name:'اسم الخطوة',step_order:'الترتيب',
    recipients:'المستلمون',temp_recipients:'المستلمون المؤقتون',add_recipient:'إضافة مستلم',
    slug:'المعرف',sort_order:'الترتيب',is_done:'حالة منتهية',
    description:'الوصف',estimated_hours:'ساعات تقديرية',
    phone_alt:'هاتف بديل',map_url:'رابط الخريطة',title:'العنوان',type:'النوع',
    send_notification:'إرسال',browser_notifications:'إشعارات المتصفح',
    show_in_prds:'عرض في KDS',is_external:'مهمة خارجية',
    /* extra */
    active_orders:'الطلبات الجارية',total_orders:'إجمالي الطلبات',completed:'مكتملة',
    urgent:'عاجل',clients:'العملاء',progress:'التقدم',date:'التاريخ',
    completed_at:'اكتمل في',leader:'قائد',
    customer_lbl:'العميل:',recipient_lbl:'المستلم:',
    choose_recipient:'— اختر المستلم —',choose_customer_first:'— اختر العميل أولاً —',
    select_product:'— اختر المنتج —',
    normal:'عادي',high:'عالي 🔥',low:'منخفض',
    yes:'نعم',no:'لا',active_status:'نشط',stopped:'متوقف',
    all_statuses:'كل الحالات',all_steps_added:'كل الخطوات مضافة',
    production_system:'نظام الإنتاج',
    setup_system:'إعداد النظام',
    system_name_title:'اسم نظامك',system_name_hint:'هذا الاسم سيظهر في جميع أجزاء النظام والتقارير.',
    logo_title:'شعار الشركة',logo_hint:'ارفع شعار شركتك — PNG شفاف أو SVG الأنسب.',
    drag_logo:'اسحب الشعار هنا أو اضغط للرفع',logo_formats:'PNG · SVG · JPG · WEBP',
    setup_done:'أنت جاهز تماماً!',setup_success:'تم إعداد النظام بنجاح:',
    enter_system:'الدخول إلى النظام ←',next:'التالي →',skip:'تخطي',
    saving:'جاري الحفظ...',save_continue:'حفظ والمتابعة →',
    name_required:'اسم النظام مطلوب',system_name_placeholder:'مثال: مطبعة النجم الرقمية',
    no_active_orders:'لا توجد طلبات جارية',full_name:'الاسم الكامل',order_number_lbl:'رقم الطلب',order_items_lbl:'عناصر الطلب',steps_lbl:'الخطوات',high_priority:'أولوية عالية',completed_lbl:'مكتمل',sort_order_lbl:'الترتيب',is_final_lbl:'منتهية',expected_lbl:'متوقع',actual_lbl:'فعلي',login_username:'اسم المستخدم',login_password:'كلمة المرور',login_subtitle:'نظام إدارة الإنتاج',login_required:'أدخل اسم المستخدم وكلمة المرور',login_error:'خطأ في تسجيل الدخول',link_emp_label:'ربط بموظف موجود (اختياري)',link_emp_placeholder:'إنشاء موظف جديد',avatar_title:'تغيير الصورة الشخصية',avatar_too_large:'الصورة كبيرة جداً، الحد الأقصى 2MB',avatar_error:'خطأ في رفع الصورة',users_count:'مستخدم',role_admin_short:'مدير',role_user_short:'مستخدم',no_results_q:'لا نتائج لـ',customer_lbl:'العميل',recipient_lbl:'المستلم',contact_persons:'جهات الاتصال',contact_person_lbl:'المسؤول عن الطلب',job_title:'المسمى الوظيفي',add_contact:'إضافة جهة اتصال',no_contacts:'لا توجد جهات اتصال',current_step_lbl:'الخطوة الحالية',progress_lbl:'التقدم',yes:'نعم',no:'لا',show_in_kds:'عرض في KDS',external_task:'مهمة خارجية',is_delivery:'خطوة توصيل',scales_with_qty:'يتأثر بالكمية',qty_per_unit:'لكل',unit_lbl:'وحدة',inactive_lbl:'غير نشط',login_btn:'دخول',edit_order:'تعديل الطلب',order_preview_title:'طلب',notif_info:'معلومات',notif_success:'نجاح',notif_warning:'تحذير',notif_error:'خطأ',is_done_lbl:'منتهية',perm_sections:'الأقسام والصفحات',perm_steps:'خطوات الإنتاج',perm_save:'حفظ الصلاحيات',perm_admin_full:'المدير يملك وصولاً كاملاً بدون قيود',perm_title:'صلاحيات',perm_view:'عرض',perm_create:'إضافة',perm_edit:'تعديل',perm_delete:'حذف',perm_orders:'الطلبات',perm_customers:'العملاء',perm_products:'المنتجات',perm_employees:'الموظفون',perm_kds:'شاشة الإنتاج',perm_delivery_orders:'طلبات التوصيل',perm_reports:'التقارير',perm_settings:'الإعدادات',settings:'الإعدادات',perm_users:'المستخدمون',username_lbl:'اسم الدخول (username)',password_lbl:'كلمة المرور',password_new:'كلمة المرور الجديدة (اتركه فارغاً لعدم التغيير)',role_lbl:'الدور',role_admin:'مدير (وصول كامل)',role_user:'مستخدم (حسب الصلاحيات)',dept_lbl:'القسم',no_dept:'-- بدون قسم --',status_lbl:'الحالة',active_lbl:'نشط',stopped_lbl:'موقوف',new_user:'مستخدم جديد',edit_user:'تعديل مستخدم',no_results:'لا توجد نتائج',no_orders_done:'لا توجد طلبات مكتملة بعد',error:'خطأ',
    start:'▶ بدء',complete_step:'✓ إكمال',view:'👁 عرض',return_to_order:'↩ العودة للطلب',current_step:'الخطوة الحالية',stop_order:'⏹ إيقاف',force_complete:'⚡ إنهاء إجباري',confirm_stop:'هل تريد إيقاف هذا الطلب؟ سيتم وضعه كملغي.',confirm_force:'هل تريد إنهاء هذا الطلب إجبارياً؟ سيُعلَّم كمكتمل فوراً.',delete_blocked:'لا يمكن حذف طلب بدأ تنفيذه',
    start_btn:'▶',complete_btn:'✓',
    kds_subtitle:'تحديث كل 30 ثانية',no_active_kds:'لا توجد طلبات نشطة حالياً',
    waiting:'قيد الانتظار',
    n_orders:function(n){ return n+' طلب'; },
    n_active:function(n){ return n+' طلب نشط'; },
    n_done:function(n){ return n+' طلب مكتمل'; },
    n_tasks:function(n){ return n+' مهمة'; },
    n_items:function(n){ return n+' عناصر'; },
    n_clients:function(n){ return n+' عميل'; },
    overview:'نظرة عامة على حالة الإنتاج',
    workflow_hint:'تحديد workflow لكل منتج',
    send_notif_title:'إرسال إشعار',
    unread:function(n){ return n+' غير مقروء'; },
    retry:'إعادة المحاولة',ui_error:'حدث خطأ في الواجهة',
    loading:'جاري التحميل...',loading_data:'جاري تحميل البيانات...',
    switch_lang:'Switch to English',
    /* ── Tasks group label ── */
    tasks_label:'المهام',
    kds_interval_lbl:'وقت التبديل في شاشة الإنتاج (ثانية)',
    kds_interval_hint:'عدد الثواني بين كل صفحة في العرض الدوري على التلفزيون',
    delivery_orders:'طلبات التوصيل',
    delivery_agent:'مندوب التوصيل',
    no_delivery_orders:'لا توجد طلبات توصيل مسندة إليك',
    /* ── Operations Tasks ── */
    operations_tasks:'مهام العمليات',operations_label:'العمليات',
    ops_task_no:'رقم المهمة',ops_new_task:'مهمة جديدة',ops_edit_task:'تعديل المهمة',
    ops_stages:'المراحل',ops_add_stage:'إضافة مرحلة',ops_rename_stage:'تسمية المرحلة',
    ops_delete_stage:'حذف المرحلة',ops_stage_name:'اسم المرحلة',
    ops_move_next_dept:'نقل للقسم التالي',ops_finish_task:'إنهاء المهمة',
    ops_completed_tasks:'المهام المكتملة',ops_reopen:'إعادة فتح',
    ops_no_stages:'لا توجد مراحل — أضف مرحلة للبدء',
    ops_no_tasks:'لا توجد مهام في هذه المرحلة',
    ops_final_stage_title:'المرحلة الأخيرة',
    ops_final_stage_msg:'وصلت المهمة إلى المرحلة الأخيرة في هذا القسم.',
    ops_stage_has_tasks:'لا يمكن حذف مرحلة تحتوي على مهام',
    ops_time:'الوقت',ops_completed_at:'تاريخ الإنجاز',ops_on_time:'في الوقت',ops_delayed:'متأخر',
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
    choose_recipient:'— Select Recipient —',choose_customer_first:'— Select Customer First —',
    select_product:'— Select Product —',
    choose:'Select',
    normal:'Normal',high:'High 🔥',low:'Low',
    yes:'Yes',no:'No',active_status:'Active',stopped:'Stopped',
    all_statuses:'All Statuses',all_steps_added:'All steps added',
    production_system:'Production System',
    setup_system:'System Setup',
    system_name_title:'System Name',system_name_hint:'This name will appear throughout the system, reports and invoices.',
    logo_title:'Company Logo',logo_hint:'Upload your company logo — transparent PNG or SVG is best.',
    drag_logo:'Drag logo here or click to upload',logo_formats:'PNG · SVG · JPG · WEBP',
    setup_done:'You\'re all set!',setup_success:'System configured successfully:',
    enter_system:'Enter System →',next:'Next →',skip:'Skip',
    saving:'Saving...',save_continue:'Save & Continue →',
    name_required:'System name is required',system_name_placeholder:'e.g. Bright Star Print Shop',
    no_active_orders:'No active orders',full_name:'Full Name',order_number_lbl:'Order #',order_items_lbl:'Order Items',steps_lbl:'Steps',high_priority:'High Priority',completed_lbl:'Completed',sort_order_lbl:'Sort Order',is_final_lbl:'Final Status',expected_lbl:'Expected',actual_lbl:'Actual',login_username:'Username',login_password:'Password',login_subtitle:'Production Management System',login_required:'Please enter username and password',login_error:'Login error',link_emp_label:'Link to existing employee (optional)',link_emp_placeholder:'— Create new employee —',avatar_title:'Change Profile Picture',avatar_too_large:'Image too large, max 2MB',avatar_error:'Upload error',users_count:'users',role_admin_short:'Admin',role_user_short:'User',no_results_q:'No results for',customer_lbl:'Customer',recipient_lbl:'Recipient',contact_persons:'Contact Persons',contact_person_lbl:'Order Contact',job_title:'Job Title',add_contact:'Add Contact',no_contacts:'No contacts yet',current_step_lbl:'Current Step',progress_lbl:'Progress',yes:'Yes',no:'No',show_in_kds:'Show in KDS',external_task:'External Task',is_delivery:'Delivery Step',scales_with_qty:'Scales with Qty',qty_per_unit:'Per',unit_lbl:'unit',inactive_lbl:'Inactive',login_btn:'Login',edit_order:'Edit Order',order_preview_title:'Order',notif_info:'Info',notif_success:'Success',notif_warning:'Warning',notif_error:'Error',is_done_lbl:'Final Status',perm_sections:'Sections & Pages',perm_steps:'Production Steps',perm_save:'Save Permissions',perm_admin_full:'Admin has full access with no restrictions',perm_title:'Permissions',perm_view:'View',perm_create:'Add',perm_edit:'Edit',perm_delete:'Delete',perm_orders:'Orders',perm_customers:'Customers',perm_products:'Products',perm_employees:'Employees',perm_kds:'Production Display',perm_delivery_orders:'Delivery Orders',perm_reports:'Reports',perm_settings:'Settings',settings:'Settings',perm_users:'Users',username_lbl:'Username',password_lbl:'Password',password_new:'New Password (leave blank to keep current)',role_lbl:'Role',role_admin:'Admin (full access)',role_user:'User (by permissions)',dept_lbl:'Department',no_dept:'-- No Department --',status_lbl:'Status',active_lbl:'Active',stopped_lbl:'Stopped',new_user:'New User',edit_user:'Edit User',no_results:'No results found',no_orders_done:'No completed orders yet',error:'Error',
    start:'▶ Start',complete_step:'✓ Complete',view:'👁 View',return_to_order:'↩ Return to Order',current_step:'Current Step',stop_order:'⏹ Stop',force_complete:'⚡ Force Complete',confirm_stop:'Stop this order? It will be marked as cancelled.',confirm_force:'Force-complete this order? All steps will be marked done immediately.',delete_blocked:'Cannot delete an order that has already started',
    start_btn:'▶',complete_btn:'✓',
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
    switch_lang:'التبديل للعربية',
    /* ── Tasks group label ── */
    tasks_label:'Tasks',
    kds_interval_lbl:'Production Display Carousel Interval (seconds)',
    kds_interval_hint:'How many seconds between each page rotation on the TV display',
    delivery_orders:'Delivery Orders',
    delivery_agent:'Delivery Agent',
    no_delivery_orders:'No delivery orders assigned to you',
    /* ── Operations Tasks ── */
    operations_tasks:'Operations Tasks',operations_label:'Operations',
    ops_task_no:'Task #',ops_new_task:'New Task',ops_edit_task:'Edit Task',
    ops_stages:'Stages',ops_add_stage:'Add Stage',ops_rename_stage:'Rename Stage',
    ops_delete_stage:'Delete Stage',ops_stage_name:'Stage Name',
    ops_move_next_dept:'Move to Next Department',ops_finish_task:'Finish Task',
    ops_completed_tasks:'Completed Tasks',ops_reopen:'Reopen',
    ops_no_stages:'No stages — add a stage to get started',
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

function LangRemount(props) {
  var i18n = useI18n();
  return h('div', { key:i18n.lang, style:{ display:'contents' } }, props.children);
}

/* ── Search Context (global topbar search) ── */
var SearchCtx = createContext({ q:'', setQ:function(){}, placeholder:'' });
function useSearch() { return useContext(SearchCtx); }

/* ── Topbar Context — views register subtitle + action ── */
var TopbarCtx = createContext({ setMeta:function(){} });
function useTopbar(subtitle, action) {
  var ctx = useContext(TopbarCtx);
  useEffect(function(){
    ctx.setMeta({ subtitle: subtitle, action: action });
    return function(){ ctx.setMeta({ subtitle:'', action:null }); };
  }, [subtitle, action]);
}

/* ── Date formatter ── */
function fmtDate(val, lang) {
  if (!val) return '—';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric' });
  } catch(e) { return val; }
}
function fmtDateTime(val, lang) {
  if (!val) return '—';
  var l = lang || 'ar';
  try {
    var d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleString(l === 'ar' ? 'ar-IQ' : 'en-GB', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e) { return val; }
}

function openPrint(order) { openPrintWithLang(order, "ar"); }

/* ── Safe i18n getter (for render functions outside React tree) ── */
var _currentLang = 'ar';
function getLang() { return _currentLang; }
function getT() { return function(k, arg) {
  var dict = I18N[_currentLang] || I18N.ar;
  var val = dict[k] != null ? dict[k] : (I18N.ar[k] != null ? I18N.ar[k] : k);
  return typeof val === 'function' ? val(arg) : val;
}; }

/* ── API ── */
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

/* ── Print slip ── */
function openPrintWithLang(order, lang) {
  var items = asArr(order.items);
  var itemsHtml = items.length ? '<br><b>العناصر:</b><ul>' + items.map(function(i){ return '<li>'+i.product_name+' × '+i.quantity+'</li>'; }).join('') + '</ul>' : '';
  var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>طلب #'+order.order_number+'</title>'
    + '<style>body{font-family:system-ui;padding:1.5rem;font-size:13px}table{width:100%;border-collapse:collapse}td{padding:.35rem .6rem;border:1px solid #e3e8ef}.lbl{color:#7a8694;width:35%}</style></head><body>'
    + '<h2>📦 طلب #'+order.order_number+'</h2><table>'
    + '<tr><td class="lbl">العميل</td><td>'+getCust(order)+'</td></tr>'
    + '<tr><td class="lbl">المستلم</td><td>'+getRec(order)+'</td></tr>'
    + '<tr><td class="lbl">الحالة</td><td>'+order.status_slug+'</td></tr>'
    + '<tr><td class="lbl">التقدم</td><td>'+progOf(order)+'%</td></tr>'
    + (order.deadline ? '<tr><td class="lbl">الموعد</td><td>'+fmtDateTime(order.deadline, lang)+'</td></tr>' : '')
    + (order.delivery_address ? '<tr><td class="lbl">العنوان</td><td>'+order.delivery_address+'</td></tr>' : '')
    + '</table>' + itemsHtml + '</body></html>';
  var w = window.open('', '_blank', 'width=600,height=700');
  w.document.write(html);
  w.document.close();
  setTimeout(function(){ w.print(); }, 500);
}

/* ── Hooks ── */
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

/* ═══ UI COMPONENTS ═══ */

function Spinner(props) {
  var size = props.size || 20;
  return h('div', { style:{ width:size, height:size, border:'2px solid '+T.border, borderTopColor:T.accent, borderRadius:'50%', animation:'csSpin .7s linear infinite', flexShrink:0 } });
}
function PageLoader() {
  var t = useI18n().t;
  return h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, color:T.textMute, fontSize:14 } }, h(Spinner), t('loading'));
}

function Badge(props) {
  var label = props.label, color = props.color || 'gray', dot = props.dot;
  var m = {
    gray:   [T.bgSub,    T.textMid,  T.border],
    purple: [T.accentDim, T.accent,  '#c4b8ff'],
    green:  [T.greenBg,  T.green,    '#a7f3d0'],
    red:    [T.redBg,    T.red,      '#fda4af'],
    amber:  [T.amberBg,  T.amber,    '#fcd34d'],
    blue:   [T.blueBg,   T.blue,     '#93c5fd'],
  };
  var c = m[color] || m.gray;
  return h('span', { style:{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', background:c[0], color:c[1], border:'1px solid '+c[2], borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:'nowrap' } },
    dot && h('span', { style:{ width:5, height:5, borderRadius:'50%', background:c[1], flexShrink:0 } }),
    label
  );
}
function statusBadge(slug, statuses, lang) {
  var s = asArr(statuses).find(function(x){ return x.slug === slug; });
  if (!s) s = asArr(statuses).find(function(x){ return x.slug && x.slug.toLowerCase().replace(/\s+/g,'_') === (slug||'').toLowerCase().replace(/\s+/g,'_'); });
  var map = { pending:'gray', in_progress:'blue', review:'amber', ready:'green', done:'green', completed:'green', cancelled:'red' };
  var fallbackAr = { pending:'على الانتظار', in_progress:'قيد التنفيذ', review:'مراجعة', ready:'جاهز', done:'مكتمل', completed:'مكتمل', cancelled:'ملغي' };
  var fallbackEn = { pending:'Pending', in_progress:'In Progress', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var label = s ? ln(s, lang||'ar') : ((lang==='en' ? fallbackEn[slug] : fallbackAr[slug]) || slug || '—');
  var color = map[slug] || (s && s.is_done==1 ? 'green' : 'gray');
  return h(Badge, { label:label, color:color, dot:true });
}

function Btn(props) {
  var variant = props.variant || 'primary', size = props.size || 'md';
  var sz = { sm:{padding:'5px 12px',fontSize:12}, md:{padding:'8px 16px',fontSize:13}, lg:{padding:'11px 20px',fontSize:14} };
  var vr = {
    primary:   { background:T.accent, color:'#fff' },
    secondary: { background:T.bg, color:T.text, border:'1px solid '+T.border, boxShadow:T.shadow },
    danger:    { background:T.redBg, color:T.red, border:'1px solid #fda4af' },
    success:   { background:T.greenBg, color:T.green, border:'1px solid #a7f3d0' },
    ghost:     { background:'transparent', color:T.accent },
  };
  var style = Object.assign({
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
    border:'none', borderRadius:T.radius, cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontWeight:600, fontFamily:'inherit', transition:'all .12s',
    opacity: props.disabled ? 0.55 : 1,
  }, sz[size], vr[variant] || vr.primary, props.style || {});
  return h('button', { type: props.type || 'button', onClick: props.onClick, disabled: props.disabled, style: style }, props.children);
}

var iSt = { width:'100%', padding:'8px 12px', fontSize:13, color:T.text, background:T.bg, border:'1px solid '+T.border, borderRadius:T.radius, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border .12s', lineHeight:'1.5', textAlign:'start' };
var selSt = Object.assign({}, iSt, { cursor:'pointer', height:38, padding:'0 12px 0 32px', appearance:'none', WebkitAppearance:'none', MozAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%237a8694' d='M5 6L0 0h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'left 10px center', textAlign:'start' });

function onFocus(e) { e.target.style.borderColor = T.accent; e.target.style.boxShadow = '0 0 0 3px ' + T.accentDim; }
function onBlur(e)  { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }

function Fld(props) {
  return h('div', { style:{ marginBottom:14 } },
    props.label && h('label', { style:{ display:'block', fontSize:12, fontWeight:600, color:T.textMid, marginBottom:5 } }, props.label),
    props.children,
    props.hint && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:3 } }, props.hint)
  );
}
function Input(props) {
  return h(Fld, { label:props.label, hint:props.hint },
    h('input', { type:props.type||'text', value:props.value != null ? props.value : '', placeholder:props.placeholder||'', onChange:function(e){ props.onChange(e.target.value); }, style:Object.assign({}, iSt, props.style||{}), onFocus:onFocus, onBlur:onBlur })
  );
}
function Textarea(props) {
  return h(Fld, { label:props.label, hint:props.hint },
    h('textarea', { value:props.value != null ? props.value : '', rows:props.rows||3, placeholder:props.placeholder||'', onChange:function(e){ props.onChange(e.target.value); }, style:Object.assign({}, iSt, {resize:'vertical'}), onFocus:onFocus, onBlur:onBlur })
  );
}
function Select(props) {
  var opts = props.options || [];
  return h(Fld, { label:props.label, hint:props.hint },
    h('select', { value:props.value != null ? props.value : '', onChange:function(e){ props.onChange(e.target.value); }, style:selSt, onFocus:onFocus, onBlur:onBlur },
      h('option', { value:'' }, props.placeholder || (getLang()==='en' ? '— Select —' : '— اختر —')),
      opts.map(function(o){ return h('option', { key:o.value, value:o.value }, o.label); })
    )
  );
}


function MultiSelect(props) {
  /* Inline checkbox grid */
  var values = props.values || [];
  var options = props.options || [];
  function toggle(val) {
    var v = String(val);
    var next = values.indexOf(v) >= 0
      ? values.filter(function(x){ return x !== v; })
      : values.concat([v]);
    props.onChange(next);
  }
  return h(Fld, { label:props.label },
    h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radius, padding:'8px 10px', background:T.bgSub, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'6px 12px' } },
      options.length === 0
        ? h('span', { style:{ fontSize:12, color:T.textMute } }, '—')
        : options.map(function(o){
            var checked = values.indexOf(String(o.value)) >= 0;
            return h('label', { key:o.value, style:{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'3px 0' } },
              h('input', { type:'checkbox', checked:checked, onChange:function(){ toggle(o.value); }, style:{ accentColor:T.accent, flexShrink:0, width:14, height:14 } }),
              h('span', { style:{ fontSize:12, color: checked ? T.text : T.textMute, fontWeight: checked ? 600 : 400 } }, o.label)
            );
          })
    )
  );
}

function Modal(props) {
  return h('div', { style:{ position:'fixed', inset:0, background:'rgba(13,17,23,.45)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(3px)' }, onClick:function(e){ if(e.target===e.currentTarget) props.onClose(); } },
    h('div', { style:{ background:T.bg, borderRadius:T.radiusLg, width:'100%', maxWidth:props.width||560, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:T.shadowLg, border:'1px solid '+T.border } },
      /* sticky header */
      h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 24px', borderBottom:'1px solid '+T.border, flexShrink:0 } },
        h('div', null,
          h('div', { style:{ fontWeight:700, fontSize:15, color:T.text } }, props.title),
          props.subtitle && h('div', { style:{ fontSize:12, color:T.textMute, marginTop:2 } }, props.subtitle)
        ),
        h('button', { onClick:props.onClose, style:{ border:'none', background:'none', cursor:'pointer', color:T.textMute, fontSize:22, lineHeight:1, padding:'0 4px' } }, '×')
      ),
      /* scrollable body */
      h('div', { style:{ padding:24, overflowY:'auto', flex:1 } }, props.children),
      /* sticky footer */
      props.footer && h('div', { style:{ padding:'14px 24px', borderTop:'1px solid '+T.border, display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 } }, props.footer)
    )
  );
}

function Card(props) {
  return h('div', { style: Object.assign({ background:T.bg, border:'1px solid '+T.border, borderRadius:T.radiusLg, boxShadow:T.shadow }, props.style || {}) }, props.children);
}

function StatCard(props) {
  var colors = { accent:T.accent, green:T.green, red:T.red, amber:T.amber, blue:T.blue };
  var bgs    = { accent:T.accentDim, green:T.greenBg, red:T.redBg, amber:T.amberBg, blue:T.blueBg };
  var c = props.color || 'accent';
  return h(Card, { style:{ padding:'18px 22px' } },
    h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' } },
      h('div', null,
        h('div', { style:{ fontSize:11, fontWeight:600, color:T.textMute, letterSpacing:.5, textTransform:'uppercase', marginBottom:8 } }, props.label),
        h('div', { style:{ fontSize:28, fontWeight:700, color:T.text, lineHeight:1 } }, props.value),
        props.sub && h('div', { style:{ fontSize:12, color:T.textMute, marginTop:6 } }, props.sub)
      ),
      props.icon && h('div', { style:{ width:40, height:40, borderRadius:10, background:bgs[c]||T.accentDim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 } }, props.icon)
    )
  );
}

function UserAvatar(props) {
  /* props: user {name,avatar}, size (default 32), style */
  var user = props.user || {};
  var size = props.size || 32;
  var fontSize = Math.round(size * 0.4);
  var base = { width:size, height:size, borderRadius:'50%', flexShrink:0, objectFit:'cover', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' };
  if (user.avatar) {
    return h('img', { src:user.avatar, style:Object.assign({}, base, props.style||{}), alt:user.name||'' });
  }
  var initials = (user.name||'?').trim().split(' ').map(function(w){ return w[0]||''; }).slice(0,2).join('').toUpperCase();
  return h('div', { style:Object.assign({}, base, { background:T.accent, color:'#fff', fontWeight:700, fontSize:fontSize }, props.style||{}) }, initials);
}

function ProgressBar(props) {
  var p = Math.min(100, Math.max(0, props.value || 0));
  var c = props.color || (p >= 100 ? T.green : p >= 60 ? T.accent : T.amber);
  return h('div', { style:{ background:T.bgSub, borderRadius:99, height:5, overflow:'hidden' } },
    h('div', { style:{ width:p+'%', background:c, height:'100%', borderRadius:99, transition:'width .4s' } })
  );
}

function DataTable(props) {
  var i18n = useI18n(); var t = i18n.t;
  var cols = props.columns || [], rows = props.rows || [];
  var globalSearch = useSearch();

  /* Use global search if available, else local */
  var _q = useState(''); var localQ = _q[0], setLocalQ = _q[1];
  var q = props.useGlobalSearch !== false ? globalSearch.q : localQ;
  var setQ = props.useGlobalSearch !== false ? globalSearch.setQ : setLocalQ;

  var _sort = useState({key:null,dir:'asc'}); var sort = _sort[0], setSort = _sort[1];

  /* searchable columns = those without custom render, or explicitly marked searchable */
  var searchCols = cols.filter(function(c){ return !c.noSearch; });

  /* filter */
  var filtered = q.trim() === '' ? rows : rows.filter(function(row){
    var text = q.trim().toLowerCase();
    /* always search name_en if present */
    if (row.name_en && String(row.name_en).toLowerCase().indexOf(text) >= 0) return true;
    if (row.step_name_en && String(row.step_name_en).toLowerCase().indexOf(text) >= 0) return true;
    return searchCols.some(function(c){
      var val = c.render ? '' : (row[c.key] != null ? String(row[c.key]) : '');
      var raw = row[c.key] != null ? String(row[c.key]) : '';
      return val.toLowerCase().indexOf(text) >= 0 || raw.toLowerCase().indexOf(text) >= 0;
    });
  });

  /* sort */
  var sorted = filtered.slice();
  if (sort.key) {
    sorted.sort(function(a, b){
      var av = a[sort.key] != null ? a[sort.key] : '';
      var bv = b[sort.key] != null ? b[sort.key] : '';
      var aStr = String(av).toLowerCase();
      var bStr = String(bv).toLowerCase();
      var aNum = parseFloat(av);
      var bNum = parseFloat(bv);
      var cmp = (!isNaN(aNum) && !isNaN(bNum)) ? (aNum - bNum) : (aStr < bStr ? -1 : aStr > bStr ? 1 : 0);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  function toggleSort(key) {
    setSort(function(prev){
      if (prev.key === key) return { key:key, dir:prev.dir==='asc'?'desc':'asc' };
      return { key:key, dir:'asc' };
    });
  }

  var showSearch = props.search !== false && rows.length > 0 && props.useGlobalSearch === false;

  return h('div', null,
    /* Search bar — only shown if NOT using global topbar search */
    showSearch && h('div', { style:{ marginBottom:12, display:'flex', alignItems:'center', gap:8 } },
      h('div', { style:{ position:'relative', flex:1, maxWidth:360 } },
        h('span', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', [i18n.isRtl?'right':'left']:12, color:T.textMute, fontSize:14, pointerEvents:'none' } }, '🔍'),
        h('input', {
          value:q, onChange:function(e){ setQ(e.target.value); },
          placeholder: props.searchPlaceholder || t('search')+'...',
          style:{ width:'100%', padding: i18n.isRtl ? '8px 36px 8px 12px' : '8px 12px 8px 36px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, outline:'none', background:T.bg, color:T.text, fontFamily:'inherit' },
          onFocus:function(e){ e.target.style.borderColor=T.accent; },
          onBlur:function(e){ e.target.style.borderColor=T.border; },
        })
      ),
      q && h('button', { onClick:function(){ setQ(''); }, style:{ padding:'7px 12px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:12, fontFamily:'inherit' } }, '✕'),
      q && h('span', { style:{ fontSize:12, color:T.textMute } }, sorted.length + ' / ' + rows.length)
    ),
    h('div', { style:{ border:'1px solid '+T.border, borderRadius:T.radiusLg, overflow:'hidden' } },
      h('table', { style:{ width:'100%', borderCollapse:'collapse', fontSize:13 } },
        h('thead', null,
          h('tr', { style:{ background:T.bgSub } },
            cols.map(function(c, i){
              var isSorted = sort.key === c.key;
              var sortable = !c.noSort;
              return h('th', {
                key:i,
                onClick: sortable && c.key ? function(){ toggleSort(c.key); } : undefined,
                style:{ padding:'10px 16px', textAlign:'start', borderBottom:'1px solid '+T.border, color: isSorted ? T.accent : T.textMute, fontWeight:600, fontSize:11, letterSpacing:.5, textTransform:'uppercase', whiteSpace:'nowrap', cursor: sortable && c.key ? 'pointer' : 'default', userSelect:'none', transition:'color .15s' }
              },
                h('span', { style:{ display:'inline-flex', alignItems:'center', gap:5 } },
                  c.label,
                  sortable && c.key && h('span', { style:{ fontSize:10, opacity: isSorted ? 1 : 0.35, color: isSorted ? T.accent : 'inherit' } },
                    isSorted ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'
                  )
                )
              );
            }),
            (props.onEdit || props.onDelete || props.actions || props.extraActions) && h('th', { style:{ padding:'10px 16px', background:T.bgSub, borderBottom:'1px solid '+T.border, width:220 } })
          )
        ),
        h('tbody', null,
          !sorted.length
            ? h('tr', null, h('td', { colSpan:99, style:{ padding:'40px 20px', textAlign:'center', color:T.textMute, fontSize:13 } }, q ? (t('no_results_q')+' "'+q+'"') : (props.empty || t('no_data'))))
            : sorted.map(function(row, ri) {
                return h('tr', { key:ri, style:{ borderBottom:'1px solid '+T.border }, onMouseEnter:function(e){ e.currentTarget.style.background=T.bgSub; }, onMouseLeave:function(e){ e.currentTarget.style.background=''; } },
                  cols.map(function(c, ci){ return h('td', { key:ci, style:{ padding:'11px 16px', color:T.text } }, c.render ? c.render(row) : (row[c.key] != null ? row[c.key] : '—')); }),
                  (props.onEdit || props.onDelete || props.actions || props.extraActions) && h('td', { style:{ padding:'8px 16px' } },
                    h('div', { style:{ display:'flex', gap:4, justifyContent:'flex-end', flexWrap:'nowrap', whiteSpace:'nowrap' } },
                      props.extraActions && props.extraActions(row),
                      props.actions && props.actions(row),
                      props.onEdit && h(Btn, { size:'sm', variant:'secondary', onClick:function(){ props.onEdit(row); } }, t('edit')),
                      props.onDelete && h(Btn, { size:'sm', variant:'danger', onClick:function(){ if(confirm(t('confirm_delete'))) props.onDelete(row); } }, t('delete'))
                    )
                  )
                );
              })
        )
      )
    )
  );
}

function PageHeader(props) {
  return h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 } },
    h('div', null,
      h('h1', { style:{ margin:0, fontSize:20, fontWeight:700, color:T.text } }, props.title),
      props.subtitle && h('p', { style:{ margin:'4px 0 0', fontSize:13, color:T.textMute } }, props.subtitle)
    ),
    props.action
  );
}

function Divider(props) {
  return h('div', { style:{ display:'flex', alignItems:'center', gap:10, margin:'18px 0' } },
    h('div', { style:{ flex:1, height:1, background:T.border } }),
    props.label && h('span', { style:{ fontSize:11, color:T.textMute, fontWeight:600, letterSpacing:.5, textTransform:'uppercase' } }, props.label),
    h('div', { style:{ flex:1, height:1, background:T.border } })
  );
}

/* ═══ SETUP WIZARD ═══ */
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
              : h('div', null, h('div', { style:{ fontSize:36, marginBottom:8 } }, '🖼️'), h('div', { style:{ color:T.textMid, fontSize:14, fontWeight:500 } }, t('drag_logo')), h('div', { style:{ color:T.textMute, fontSize:12, marginTop:3 } }, t('logo_formats'))),
            h('input', { ref:fileRef, type:'file', accept:'image/*', style:{ display:'none' }, onChange:function(e){ handleFile(e.target.files[0]); } })
          ),
          h('div', { style:{ display:'flex', gap:10 } },
            h('button', { onClick:skip, style:{ flex:1, padding:'12px', borderRadius:10, border:'1px solid '+T.border, background:T.bg, color:T.textMute, fontSize:14, cursor:'pointer', fontFamily:'inherit' } }, t('skip')),
            h('button', { onClick:next, disabled:saving, style:Object.assign({}, btnSt, { flex:2, margin:0, opacity:saving?0.7:1 }) }, saving ? t('saving') : t('save_continue'))
          )
        ),
        /* Step 3 */
        step === 3 && h('div', { style:{ textAlign:'center', padding:'8px 0' } },
          h('div', { style:{ fontSize:56, marginBottom:16, animation:'csBounce .6s' } }, '🎉'),
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

/* ═══ SIDEBAR ═══ */
var NAV = [
  {id:'dashboard',icon:'⊞',key:'dashboard'},
  {id:'orders',icon:'≡',key:'orders'},
  {id:'completed-orders',icon:'✓',key:'completed_orders'},
  {id:'kds',icon:'⊟',key:'kds'},
  null,
  {id:'customers',icon:'○',key:'customers'},
  {id:'suppliers',icon:'◉',key:'suppliers'},
  {id:'products',icon:'◈',key:'products'},
  {id:'steps',icon:'◳',key:'product_workflow'},
  null,
  /* ── Tasks group ── */
  {id:'_label_tasks',type:'label',key:'tasks_label'},
  {id:'ops-tasks',icon:'⊟',key:'operations_tasks',indent:true},
  {id:'my-tasks',icon:'⚐',key:'my_tasks',indent:true},
  {id:'external-tasks',icon:'⇢',key:'external_tasks',indent:true},
  {id:'delivery-orders',icon:'🚚',key:'delivery_orders',indent:true},
  {id:'notifications',icon:'◎',key:'notifications'},
  null,
  {id:'employees',icon:'○',key:'employees'},
  {id:'departments',icon:'▦',key:'departments'},
  {id:'teams',icon:'◈',key:'teams'},
  {id:'roles',icon:'◆',key:'roles'},
  {id:'statuses',icon:'●',key:'statuses'},
  null,
  {id:'users',icon:'👥',key:'users_mgmt',role:'admin'},
  {id:'settings',icon:'⚙',key:'settings',role:'admin'},
];

function Sidebar(props) {
  var _c = useState(false); var col = _c[0], setCol = _c[1];
  var i18n = useI18n(); var t = i18n.t, lang = i18n.lang, setLang = i18n.setLang, isRtl = i18n.isRtl;
  var name = (props.branding && props.branding.system_name) || 'Production';
  var logo = props.branding && (props.branding.logo_base64 || props.branding.logo_url);

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
        /* hide role-restricted items */
        if (item.role) {
          var au = props.authUser;
          var userRole = au ? String(au.role||'').replace(/['"]/g,'').trim().toLowerCase() : '';
          var requiredRole = item.role.toLowerCase();
          if (userRole !== requiredRole) return null;
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

/* ═══ DASHBOARD ═══ */
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

  /* ── Active orders classification ── */
  var active         = orders.filter(function(o){ return !isDone(o); });
  var inProg         = active.filter(function(o){ return !orderAtDelivery(o) && !asArr(o.items).some(function(i){ return itemProductionDone(i)&&!itemDelivered(i); }); });
  var readyDel       = active.filter(function(o){ return orderAtDelivery(o); });
  var partialDel = active.filter(function(o){
    return asArr(o.items).length > 1 && !orderAtDelivery(o) && asArr(o.items).some(function(i){
      return i.is_ready_for_delivery == 1 || (itemProductionDone(i) && !itemDelivered(i));
    });
  });
  var urgentOrders   = active.filter(function(o){ return o.is_urgent==1; });

  /* ── Time totals for active orders ── */
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

  /* ── Active / Inactive clients this month ── */
  var activeClientIds = {};
  monthOrders.forEach(function(o){ if(o.customer_id) activeClientIds[o.customer_id]=1; });
  var activeClients   = customers.filter(function(c){ return activeClientIds[c.id]; });
  var inactiveClients = customers.filter(function(c){ return !activeClientIds[c.id]; });

  /* ── Tasks this month ── */
  var monthTasks = allTasks.filter(function(task){
    var d = new Date((task.created_at||'').replace(' ','T'));
    return d >= monthStart;
  });

  /* ── Top 3 clients by order count THIS MONTH ── */
  var custOrderCount = {};
  monthOrders.forEach(function(o){ if(o.customer_id) custOrderCount[String(o.customer_id)]=(custOrderCount[String(o.customer_id)]||0)+1; });
  var topClients = customers.filter(function(c){ return custOrderCount[String(c.id)]; }).sort(function(a,b){
    return (custOrderCount[String(b.id)]||0)-(custOrderCount[String(a.id)]||0);
  }).slice(0,3);
  var maxCount = topClients.length ? (custOrderCount[String(topClients[0].id)]||1) : 1;

  /* ── Monthly orders for year chart ── */
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
    var arMonths=['كانونث','شباط','آذار','نيسان','آيار','حزيران','تموز','آب','أيلول','تشرينأ','تشرينث','كانونأ'];
    var enMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var monthLabel = lang==='en' ? enMonths[m] : arMonths[m];
    monthlyOrders.push({month:monthLabel, count:cnt});
    monthlyOrdersPrev.push({month:monthLabel, count:cntPrev});
  }
  var maxMonthly = Math.max.apply(null,
    monthlyOrders.map(function(m){return m.count;}).concat(monthlyOrdersPrev.map(function(m){return m.count;}))
  ) || 1;

  /* ── Employee of Month — points system ── */
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

  /* ── Stat card component ── */
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
      clickable && h('div',{style:{fontSize:10,color:c.text,opacity:.5,marginTop:2}},lang==='en'?'Click to view':'اضغط للعرض')
    );
  }

  return h('div',{style:{padding:'0 2px'}},

    /* ROW 1 — 4 status cards */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(BigStat,{icon:'⚙️',label:lang==='en'?'In Progress':'قيد الإنتاج',value:inProg.length,color:'blue'}),
      h(BigStat,{icon:'🚚',label:lang==='en'?'Ready to Deliver':'جاهز للتوصيل',value:readyDel.length,color:'green'}),
      h(BigStat,{icon:'📦',label:lang==='en'?'Partial Delivery':'توصيل جزئي',value:partialDel.length,color:'amber',onClick:partialDel.length>0?function(){ setShowPartialModal(true); }:undefined}),
      h(BigStat,{icon:'🔴',label:lang==='en'?'Urgent':'عاجل',value:urgentOrders.length,color:'red'})
    ),

    /* TIME SUMMARY — active orders production time */
    h(Card,{style:{padding:'14px 18px',marginBottom:14}},
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
          '⏱ '+(lang==='en'?'Production Time — Active Orders':'وقت الإنتاج — الطلبات النشطة')
        ),
        active.length > 0 && h('span',{style:{fontSize:11,color:T.textMute}},
          active.length+(lang==='en'?' active orders':' طلب نشط')
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},
        /* Expected */
        h('div',{style:{background:'#eff6ff',borderRadius:T.radius,padding:'10px 14px',border:'1px solid #bfdbfe'}},
          h('div',{style:{fontSize:11,color:'#1d4ed8',fontWeight:600,marginBottom:4}},
            lang==='en'?'⏱ Total Expected':'⏱ المتوقع الإجمالي'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,color:'#1d4ed8'}},
            totalExpectedMins > 0 ? fmtMin(totalExpectedMins) : '—'
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
            lang==='en'?'⏳ Total Actual':'⏳ الفعلي الإجمالي'
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalActualMins > 0 ? fmtMin(totalActualMins) : '—'
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
              ? (lang==='en'?'🔴 Behind':'🔴 متأخر')
              : totalTimeStatus==='ahead'
              ? (lang==='en'?'🟢 Ahead':'🟢 أسرع')
              : (lang==='en'?'⚪ On Track':'⚪ في الوقت')
          ),
          h('div',{style:{fontSize:22,fontWeight:800,
            color:totalTimeStatus==='late'?T.red:totalTimeStatus==='ahead'?T.green:T.textMid}},
            totalExpectedMins > 0 && totalActualMins > 0
              ? (totalDiffMins > 0 ? '+' : '') + fmtMin(Math.abs(totalDiffMins))
              : '—'
          )
        )
      )
    ),

    /* ROW 2 — 4 month stats */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}},
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Active Clients':'عملاء نشطون'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.green}},activeClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'هذا الشهر')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Inactive Clients':'عملاء غير نشطين'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.red}},inactiveClients.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},lang==='en'?'This month':'هذا الشهر')
      ),
      h(Card,{style:{padding:'14px 16px'}},
        h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}},lang==='en'?'Tasks This Month':'مهام الشهر'),
        h('div',{style:{fontSize:26,fontWeight:800,color:T.accent}},monthTasks.length),
        h('div',{style:{fontSize:11,color:T.textMute,marginTop:4}},monthName)
      ),
      /* Employee of Month — square full bleed avatar */
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
        }},lang==='en'?'🏆 OF THE MONTH':'🏆 موظف الشهر'),
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
                }},'⭐ '+eomPts+' '+(lang==='en'?'pts':'نقطة'))
              )
            : h('div',{style:{fontSize:12,color:'rgba(255,255,255,.7)',paddingTop:20}},
                lang==='en'?'No data yet':'لا بيانات بعد')
        )
      )
    ),

    /* ROW 3 — Top clients + Annual chart + Pie chart */
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},

      /* Top 3 clients */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{fontWeight:700,fontSize:13,color:T.text,marginBottom:2}},lang==='en'?'🏅 Top Clients':'🏅 أفضل الزبائن'),
        h('div',{style:{fontSize:11,color:T.textMute,marginBottom:12}},monthName),
        topClients.length===0
          ? h('div',{style:{color:T.textMute,fontSize:12}},lang==='en'?'No data':'لا بيانات')
          : topClients.map(function(c,i){
              var cnt = custOrderCount[String(c.id)]||0;
              var pct = Math.round((cnt/maxCount)*100);
              var medals = ['🥇','🥈','🥉'];
              var name = c.company_name_en||c.company_name||c.name_en||c.name||'—';
              return h('div',{key:c.id,style:{marginBottom:i<topClients.length-1?12:0}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                    h('span',{style:{fontSize:14}},medals[i]),
                    h('span',{style:{fontSize:13,fontWeight:600,color:T.text}},name)
                  ),
                  h('span',{style:{fontSize:12,color:T.textMute,fontWeight:600}},cnt+' '+(lang==='en'?'orders':'طلب'))
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
            lang==='en'?'📊 Orders This Year':'📊 الطلبات هذا العام'
          ),
          h('button',{
            onClick:function(){ setShowCompare(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showCompare?T.accent:T.border),background:showCompare?T.accentDim:'transparent',color:showCompare?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'مقارنة '+(now.getFullYear()-1))
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

      /* Pie chart — top clients this year */
      h(Card,{style:{padding:'16px 18px'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{fontWeight:700,fontSize:13,color:T.text}},
            lang==='en'?'🥧 Clients Share (Year)':'🥧 حصة الزبائن (السنة)'
          ),
          h('button',{
            onClick:function(){ setShowComparePie(function(v){return !v;}); },
            style:{fontSize:11,padding:'4px 10px',borderRadius:99,border:'1px solid '+(showComparePie?T.accent:T.border),background:showComparePie?T.accentDim:'transparent',color:showComparePie?T.accent:T.textMute,cursor:'pointer',fontWeight:600}
          },lang==='en'?'vs '+(now.getFullYear()-1):'مقارنة '+(now.getFullYear()-1))
        ),
        (function(){
          /* Build year orders per customer — current or previous year */
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
          if(!total) return h('div',{style:{color:T.textMute,fontSize:12,textAlign:'center',padding:'20px 0'}},lang==='en'?'No data':'لا بيانات');

          /* Sort and take top 5 + others */
          var sorted = Object.keys(custYear).sort(function(a,b){return custYear[b]-custYear[a];});
          var pieColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#6b7280'];
          var slices = sorted.slice(0,5).map(function(id,i){
            var c = findBy(customers,'id',parseInt(id));
            var name = c ? (c.company_name_en||c.company_name||c.name_en||c.name||'—') : (lang==='en'?'Unknown':'غير معروف');
            return {name:name, count:custYear[id], color:pieColors[i]};
          });
          if(sorted.length > 5){
            var otherCount = sorted.slice(5).reduce(function(a,id){return a+custYear[id];},0);
            slices.push({name:lang==='en'?'Others':'أخرى', count:otherCount, color:pieColors[5]});
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

  /* ── Partial Delivery Modal ── */
  showPartialModal && h(Modal,{
    title: lang==='en' ? '📦 Partial Delivery Orders' : '📦 طلبات التوصيل الجزئي',
    onClose: function(){ setShowPartialModal(false); },
    footer: h(Btn,{variant:'secondary',onClick:function(){ setShowPartialModal(false); }},t('cancel'))
  },
    partialDel.length === 0
      ? h('div',{style:{color:'#7a8694',textAlign:'center',padding:'20px 0',fontSize:13}},t('no_data'))
      : h('div',{style:{display:'flex',flexDirection:'column',gap:10,maxHeight:480,overflowY:'auto',paddingRight:2}},
          partialDel.map(function(order){
            var readyItems = asArr(order.items).filter(function(i){ return itemProductionDone(i) && !itemDelivered(i); });
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
                    lang==='en'?'Partial':'جزئي'
                  )
                ),
                order.is_urgent==1 && h('span',{style:{fontSize:11,background:'#fee2e2',color:'#b91c1c',borderRadius:99,padding:'2px 8px',fontWeight:600}},'🔴 '+(lang==='en'?'Urgent':'عاجل'))
              ),
              h('div',{style:{fontSize:12,color:'#424d57',marginBottom:8,display:'flex',gap:16,flexWrap:'wrap'}},
                custName!=='—' && h('span',null,'👤 '+custName),
                recip!=='—'   && h('span',null,'📍 '+recip)
              ),
              h('div',{style:{fontSize:11,color:'#92400e',marginBottom:6,fontWeight:600}},
                (lang==='en'?'Ready items: ':'العناصر الجاهزة: ')+readyItems.length+' / '+totalItems
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
                      (lang==='en'&&item.product_name_en ? item.product_name_en : item.product_name)||'—'
                    ),
                    item.quantity && h('span',{style:{fontSize:11,color:'#7a8694'}},
                      (lang==='en'?'Qty: ':'الكمية: ')+item.quantity
                    ),
                    h('span',{style:{fontSize:11,background:'#d1fae5',color:'#065f46',borderRadius:99,padding:'2px 7px',fontWeight:600}},
                      '✓ '+(lang==='en'?'Ready':'جاهز')
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


/* ═══ PAUSE MODAL — 3 مراحل: فئة ← ماكينة ← سبب ═══ */
function PauseModal(props) {
  /* props: pauseReasons[], stepLabel, onConfirm(reason,machine), onClose */
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var reasons = props.pauseReasons || [];

  var _phase = useState('category'); var phase = _phase[0], setPhase = _phase[1];
  var _cat   = useState(null);      var selCat = _cat[0],  setSelCat = _cat[1];
  var _mach  = useState(null);      var selMach = _mach[0], setSelMach = _mach[1];
  var _other = useState(false);     var isOther = _other[0], setIsOther = _other[1];
  var _otherTxt = useState('');     var otherTxt = _otherTxt[0], setOtherTxt = _otherTxt[1];

  /* ── فئات ثابتة ── */
  var CATEGORIES = [
    {key:'print',   icon:'🖨️', ar:'ماكينات الطباعة',    en:'Printing Machines'},
    {key:'finish',  icon:'✂️', ar:'ماكينات التشطيب',    en:'Finishing Machines'},
    {key:'material',icon:'📦', ar:'مواد أولية',          en:'Raw Materials'},
    {key:'power',   icon:'⚡', ar:'كهرباء / شبكة',      en:'Power / Network'},
    {key:'ops',     icon:'🧑', ar:'أسباب تشغيلية',      en:'Operational'},
    {key:'other',   icon:'💬', ar:'أخرى',               en:'Other'},
  ];

  /* تصنيف الماكينات حسب الفئة */
  var CAT_MACHINES = {
    print:   ['Xerox Versant 180','Canon C650i','Canon 5550i','Epson L805'],
    finish:  ['Flat Heat Press Freesub','3D Heat Press Freesub','Hat Heat Press Freesub',
               'Booklet Stapler Yale','Trimming Machine','Binding Machine',
               'Spiral Punching Machine','Rounded Corner Press','Circle Press 5x5','Cameo 3'],
    material:[],
    power:   ['UPS','Server Dell'],
    ops:     [],
  };

  /* فلترة الأسباب */
  function getReasonsForMachine(machine) {
    return reasons.filter(function(r){ return r.machine === machine; });
  }
  function getReasonsForCat(cat) {
    /* مواد أولية وتشغيلية — بدون ماكينة */
    return reasons.filter(function(r){ return !r.machine || r.machine.trim()===''; });
  }

  /* ماكينات الفئة المختارة اللي عندها أسباب */
  var machines = selCat ? (CAT_MACHINES[selCat.key] || []).filter(function(m){
    return reasons.some(function(r){ return r.machine === m; });
  }) : [];

  /* أسباب المرحلة الأخيرة */
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
  }},'← '+(lang==='en'?'Back':'رجوع')); };

  var title = phase==='category'
    ? (lang==='en'?'Select Category':'اختر الفئة')
    : phase==='machine'
      ? (lang==='en'?'Select Machine':'اختر الماكينة')
      : (lang==='en'?'Select Reason':'اختر السبب');

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
        h('div', {style:{fontWeight:700, fontSize:15, marginBottom:4}}, '⏸ '+(lang==='en'?'Pause Step':'إيقاف مؤقت للخطوة')),
        props.stepLabel && h('div',{style:{fontSize:12,color:T.accent,fontWeight:600,padding:'3px 10px',
          background:T.accentDim,borderRadius:T.radius,display:'inline-block',marginBottom:6}}, props.stepLabel),
        h('div',{style:{fontSize:12,color:T.textMute,marginBottom:8}},

          /* breadcrumb */
          h('span',{style:{color: phase==='category'?T.accent:T.textMute, fontWeight:600}}, lang==='en'?'Category':'الفئة'),
          h('span',{style:{margin:'0 6px'}}, '›'),
          h('span',{style:{color: phase==='machine'?T.accent:selMach?T.text:T.border, fontWeight: phase==='machine'?600:400}},
            selCat ? (lang==='en'?selCat.en:selCat.ar) : (lang==='en'?'Machine':'الماكينة')
          ),
          h('span',{style:{margin:'0 6px'}}, '›'),
          h('span',{style:{color: phase==='reason'?T.accent:T.border, fontWeight: phase==='reason'?600:400}},
            selMach || (lang==='en'?'Reason':'السبب')
          )
        )
      ),

      /* Scrollable content */
      h('div', {style:{overflowY:'auto', flex:1}},

        /* ── Phase 1: Category ── */
        phase==='category' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          CATEGORIES.map(function(cat){
            /* أخرى دائماً تظهر، بقية الفئات بس إذا عندها أسباب */
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
              /* إذا مواد أولية أو تشغيلية → تخطى مرحلة الماكينة */
              if (cat.key==='material'||cat.key==='ops') { setPhase('reason'); }
              else { setPhase('machine'); }
            }, style:btnStyle(false)},
              h('span',{style:{fontSize:18}}, cat.icon),
              h('span',null, lang==='en'?cat.en:cat.ar)
            );
          })
        ),

        /* ── Phase 2: Machine ── */
        phase==='machine' && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){ setPhase('category'); setSelCat(null); }),
          machines.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No machines found':'لا توجد ماكينات')
            : machines.map(function(m){
                return h('button',{key:m, onClick:function(){ setSelMach(m); setPhase('reason'); },
                  style:btnStyle(false)},
                  h('span',{style:{fontSize:16}},'🔧'),
                  h('span',null, m)
                );
              })
        ),

        /* ── Phase 3: Reason ── */
        phase==='reason' && !isOther && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          backBtn(function(){
            if (selCat&&(selCat.key==='material'||selCat.key==='ops')){ setPhase('category'); setSelCat(null); }
            else { setPhase('machine'); setSelMach(null); }
          }),
          filteredReasons.length===0
            ? h('div',{style:{color:T.textMute,fontSize:13,textAlign:'center',padding:16}},
                lang==='en'?'No reasons found':'لا توجد أسباب — أضفها من الإعدادات')
            : filteredReasons.map(function(r,i){
                var label = (lang==='en'&&r.en)?r.en:r.ar;
                return h('button',{key:i, onClick:function(){
                  props.onConfirm(label, selMach||r.machine||'');
                }, style:btnStyle(false)},
                  h('span',null, label)
                );
              }),
          /* أخرى */
          h('button',{onClick:function(){ setIsOther(true); },style:btnStyle(false)},
            h('span',{style:{fontSize:16}},'💬'),
            h('span',{style:{color:T.textMute}}, lang==='en'?'Other...':'أخرى...')
          )
        ),

        /* Other — free text */
        isOther && h('div',null,
          backBtn(function(){ setIsOther(false); setOtherTxt(''); }),
          h('textarea',{
            autoFocus:true, rows:4,
            style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,
              fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,
              boxSizing:'border-box',outline:'none'},
            placeholder: lang==='en'?'Enter reason...':'اكتب السبب...',
            value: otherTxt,
            onChange:function(e){ setOtherTxt(e.target.value); }
          }),
          h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}},
            h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel')),
            h(Btn,{variant:'primary',disabled:!otherTxt.trim(),onClick:function(){
              props.onConfirm(otherTxt.trim(), selMach||'');
            }}, lang==='en'?'Pause':'إيقاف')
          )
        )
      ),

      /* Footer — cancel only (confirm happens by clicking reason) */
      !isOther && h('div',{style:{marginTop:16,display:'flex',justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:props.onClose}, t('cancel'))
      )
    )
  );
}

/* ═══ ORDERS ═══ */
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

  /* compute expected minutes for one order — production steps only (no delivery) */
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

  /* build sorted queue — pending + in_progress, sorted by queue_order */
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

  /* open new order form — pre-fill order_number with CS-0 prefix for user to complete */
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
  /* startStep: starts a pending step — checks deadline after */
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

  /* completeStep: completes an in_progress step — checks deadline after */
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
      ? h(Card, { style:{ padding:40, textAlign:'center' } }, h('div', { style:{ fontSize:40, marginBottom:12 } }, '📋'), h('div', { style:{ color:T.textMute } }, search?t('no_results'):t('no_active_orders')))
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
    /* Delay reason prompt — linked to Settings pause reasons */
    delayPrompt && h(Modal, {
      title:'⚠️ '+t('delay_reason_title'), onClose:function(){setDelayPrompt(null);}, width:460,
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
            },lang==='en'?'Other...':'أخرى...')
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
        h(Select, { label:'👤 '+t('contact_person_lbl'), value:String(form.contact_person_id||''),
          onChange:function(v){
            var cp = findBy(contacts,'id',v);
            setForm(function(f){ return Object.assign({},f,{
              contact_person_id: v,
              contact_person_name: cp ? cp.name : '',
              contact_person_phone: cp ? cp.phone : ''
            }); });
          },
          options:contacts.map(function(c){ var nm=(lang==='en'&&c.name_en)?c.name_en:c.name; var jt=(lang==='en'&&c.job_title_en)?c.job_title_en:c.job_title; return {value:String(c.id),label:nm+(jt?' ('+jt+')':'')}; }),
          placeholder: contacts.length>0 ? '— '+t('choose')+' —' : '— '+t('no_contacts')+' —'
        }),
        h(Select, { label:'🚚 '+(lang==='en'?'Delivery Agent':'مندوب التوصيل'),
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
        h(Input, { label:lang==='en'?'🗓 Delivery Date & Time':'🗓 تاريخ ووقت التوصيل', type:'datetime-local', value:form.delivery_date||form.deadline||'', onChange:function(v){ setForm(function(f){return Object.assign({},f,{delivery_date:v, deadline:v});});} }),
        h('div', { style:{ display:'flex', alignItems:'center', paddingTop:20 } },
          h('label', { style:{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:T.textMid, fontWeight:600 } },
            h('input', { type:'checkbox', checked:form.is_urgent==1, onChange:function(e){ setForm(function(f){return Object.assign({},f,{is_urgent:e.target.checked?1:0});}); }, style:{ accentColor:T.red } }),
            '🔴 '+(lang==='en'?'Urgent':'عاجل')
          )
        )
      ),
      /* ── Recipients section ── */
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
                .map(function(r){ var nm=(lang==='en'&&r.name_en)?r.name_en:r.name; return {value:String(r.id), label:nm+(r.phone?' — '+r.phone:'')}; }),
              placeholder:custRecs.length>0?'— '+t('select_recipient')+' —':'— '+t('no_contacts')+' —'
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
                  h('div',{style:{fontWeight:600,fontSize:13}},rec.name||rec.rec_name||'—'),
                  rec.phone||rec.rec_phone ? h('div',{style:{fontSize:11,color:T.textMute}},rec.phone||rec.rec_phone) : null
                ),
                h(Btn,{size:'sm',variant:'danger',onClick:function(){ setOrderRecipients(function(prev){ return prev.filter(function(_,i){ return i!==idx; }); }); }},'×')
              );
            })
      ),
      (function(){
        /* Order Items: always visible.
           - If editing and a specific item has started steps → qty only (no delete, no product change, no notes)
           - If editing and item has no started steps → full edit (add/delete/change product/qty/notes)
           - New order → full edit always */
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
            ? h('div',{style:{textAlign:'center',padding:'16px 0',color:T.textMute,fontSize:13}},'— '+t('add_item')+' —')
            : asArr(form.items).map(function(item, idx){
              var captureIdx = idx;
              /* Check if THIS specific item has started steps */
              var itemStarted = form.id && asArr(item.steps).some(function(s){ return s.status_slug==='in_progress'||s.status_slug==='done'; });
              return h('div', { key:idx, style:{ background:T.cardBg, border:'1px solid '+(itemStarted ? T.blue||'#6c63ff' : T.border), borderRadius:T.radius, padding:'12px', marginBottom:10 } },
                /* Row 1: product + qty + delete — all same height */
                h('div', { style:{ display:'flex', gap:8, alignItems:'flex-end' } },
                  /* Product dropdown — grows — disabled if item started */
                  h('div', { style:{ flex:'1 1 auto' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('product')),
                    itemStarted
                      ? h('div', {
                          style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box', display:'flex', alignItems:'center' }
                        }, ln(products.find(function(p){ return String(p.id)===String(item.product_id); })||{name_ar:item.product_name,name_en:item.product_name}, lang) || item.product_name || '—')
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
                          h('option',{value:''},'— '+t('choose')+' —'),
                          products.map(function(p){ return h('option',{key:p.id,value:String(p.id)},ln(p,lang)); })
                        )
                  ),
                  /* Qty input — always editable */
                  h('div', { style:{ flex:'0 0 80px' } },
                    h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } }, t('quantity')),
                    h('input', {
                      type:'number', min:1,
                      value: item.quantity,
                      onChange: function(e){ updateItem(captureIdx,'quantity',parseInt(e.target.value)||1); },
                      style:{ width:'100%', height:38, padding:'0 8px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.inputBg, color:T.text, boxSizing:'border-box' }
                    })
                  ),
                  /* Delete button — hidden if item started */
                  !itemStarted && h('button', {
                    onClick: function(){ removeItem(captureIdx); },
                    style:{ flex:'0 0 38px', height:38, background:'#c0123c', color:'#fff', border:'none', borderRadius:T.radius, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:0 }
                  }, '×')
                ),
                /* Row 2: notes/specs — always visible */
                h('div', { style:{ marginTop:8 } },
                  h('label', { style:{ fontSize:11, fontWeight:600, color:T.textMute, display:'block', marginBottom:4 } },
                    lang==='ar' ? 'المواصفات' : 'Specifications'
                  ),
                  itemStarted
                    ? h('div', {
                        style:{ width:'100%', minHeight:38, padding:'8px 10px', border:'1px solid '+T.border, borderRadius:T.radius, fontSize:13, background:T.bgSub, color:T.text, boxSizing:'border-box' }
                      }, item.notes || '—')
                    : h('input', {
                        type:'text',
                        value: item.notes||'',
                        placeholder: lang==='ar' ? 'مواصفات / ملاحظات خاصة بهذا الطلب...' : 'Specs / notes for this order item...',
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

  /* actual elapsed time — sum of COMPLETED production steps only (no delivery, no in-progress) */
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

  /* ── status badge helpers ── */
  var _activeStep = null;
  asArr(order.items).forEach(function(item){ asArr(item.steps).forEach(function(s){ if (!_activeStep && s.status_slug==='in_progress') _activeStep = s; }); });
  var _stepLabel = _activeStep ? lnStep(_activeStep, lang) : null;
  var _sfallEn = { pending:'Pending', in_progress:'In Progress', review:'Review', ready:'Ready', done:'Done', completed:'Completed', cancelled:'Cancelled' };
  var _sfallAr = { pending:'انتظار', in_progress:'قيد التنفيذ', review:'مراجعة', ready:'جاهز', done:'مكتمل', completed:'مكتمل', cancelled:'ملغي' };
  var _sobj = asArr(statuses).find(function(x){ return x.slug===order.status_slug; });
  if (!_sobj) _sobj = asArr(statuses).find(function(x){ return (x.slug||'').toLowerCase().replace(/[^a-z]/g,'') === (order.status_slug||'').toLowerCase().replace(/[^a-z]/g,''); });
  var _normalSlug = (order.status_slug||'').toLowerCase().replace(/[^a-z_]/g,'').replace(/^in_progress.*/,'in_progress').replace(/^done.*/,'done').replace(/^complet.*/,'completed').replace(/^cancel.*/,'cancelled').replace(/^pend.*/,'pending');
  var _sLabel = _sobj ? ln(_sobj,lang) : ((lang==='en'?_sfallEn:_sfallAr)[_normalSlug]||(order.status_slug||'').replace(/_/g,' ').replace(/I$/,''));
  var _scolor = ({pending:'gray',in_progress:'blue',review:'amber',ready:'green',done:'green',completed:'green',cancelled:'red'})[_normalSlug]||'gray';
  var _sc = ({blue:{bg:'#dbeafe',text:'#1d4ed8'},green:{bg:'#dcfce7',text:'#15803d'},amber:{bg:'#fef3c7',text:'#b45309'},red:{bg:'#fee2e2',text:'#dc2626'},gray:{bg:T.bgSub,text:T.textMid}})[_scolor]||{bg:T.bgSub,text:T.textMid};
  var _badgeLabel = _stepLabel && !isDone(order) ? _sLabel+' — '+_stepLabel : _sLabel;
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
            order.is_paused==1 && h(Badge,{label:'⏸ '+(lang==='en'?'Paused':'موقوف'),color:'amber'}),
            order.priority==='high' && h(Badge,{label:t('high_priority'),color:'amber'})
          ),
          h('div',{style:{display:'flex',alignItems:'center',gap:6,flexShrink:0}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1}},
              h('button',{onClick:props.onMoveUp,disabled:queuePos<=0,style:{background:'none',border:'none',cursor:queuePos>0?'pointer':'default',color:queuePos>0?T.accent:T.textMute,fontSize:13,padding:'0 4px',lineHeight:1}},'▲'),
              h('button',{onClick:props.onMoveDown,disabled:queuePos>=queueLen-1,style:{background:'none',border:'none',cursor:queuePos<queueLen-1?'pointer':'default',color:queuePos<queueLen-1?T.accent:T.textMute,fontSize:13,padding:'0 4px',lineHeight:1}},'▼')
            ),
            !showStart && h(Btn,{size:'sm',variant:'secondary',onClick:props.onPreview},next?t('return_to_order'):t('view')),
            showStart && h(Btn,{size:'sm',variant:'primary',onClick:function(){props.onStart(firstPending.id,order.id);}},t('start')),
            !isCancelled && h(Btn,{size:'sm',variant:'secondary',onClick:props.onEdit},t('edit')),
            h(Btn,{size:'sm',variant:'secondary',onClick:props.onPrint},'🖨 '+t('print')),
            orderStarted && !isCancelled
              ? h('div',{style:{display:'flex',gap:6}},
                  order.is_paused==1
                    ? h(Btn,{size:'sm',style:{background:'#22c55e',color:'#fff',border:'none'},onClick:props.onResume},'▶ '+(lang==='en'?'Resume':'استئناف'))
                    : h(Btn,{size:'sm',style:{background:'#f59e0b',color:'#fff',border:'none'},onClick:props.onPause},'⏸ '+(lang==='en'?'Pause':'إيقاف')),
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
                  actualMins<=expectedMins?'🟢 Faster by '+fmtMin(expectedMins-actualMins):'🔴 Slower by '+fmtMin(actualMins-expectedMins)
                )
              : h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                  expectedMins>0 && h('span',{style:{fontSize:11,color:T.textMute,background:T.bgSub,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap'}},'⏱ Exp: '+fmtMin(expectedMins)),
                  order.started_at && hasActual && actualDisplay && h('span',{style:{fontSize:11,fontWeight:600,borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',color:timeStatus==='late'?T.red:timeStatus==='ahead'?T.green:T.textMid,background:timeStatus==='late'?'#fee2e2':timeStatus==='ahead'?'#dcfce7':T.bgSub}},
                    (timeStatus==='late'?'🔴 ':timeStatus==='ahead'?'🟢 ':'⚪ ')+'Act: '+actualDisplay
                  )
                ),
            order.delay_reason && h('span',{style:{background:'#fee2e2',color:T.red,borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},title:order.delay_reason},'⚠️ '+order.delay_reason.slice(0,20)+(order.delay_reason.length>20?'…':'')),
            order.pause_reason && h('span',{style:{background:'#fef3c7',color:'#b45309',borderRadius:99,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}},'⏸ '+order.pause_reason.slice(0,20)+(order.pause_reason.length>20?'…':''))
          ),
          _dd && h('div',{style:{display:'flex',alignItems:'center',gap:4,flexShrink:0}},
            h('span',{style:{fontSize:10,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}},lang==='en'?'Delivery':'التوصيل'),
            h('span',{style:{fontSize:12,fontWeight:600,whiteSpace:'nowrap',color:_ddColor}},'🗓 '+fmtDate(_dd,lang))
          )
        )

      )
    )
  );
}


/* ═══ EXTERNAL STEP DATE PICKER ═══
 * Props: step, orderId, suppliers, lang, onSaved(updatedOrder)
 * Clean component — no IIFE, no dead state, no closure issues
 * Uses controlled inputs with local state initialized once from props
 * After save: fetches fresh order and calls onSaved
 */
function ExtStepDatePicker(props) {
  var step      = props.step;
  var lang      = props.lang;
  var suppliers = props.suppliers || [];
  var sup       = step.supplier_id ? suppliers.filter(function(s){ return String(s.id)===String(step.supplier_id); })[0] : null;

  /* Local state — initialized once from DB values */
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
      ? h('span',{style:{fontSize:11,fontWeight:700,color:T.red}}, '⚠️ '+diffH+'h '+(lang==='en'?'late':'تأخير'))
      : h('span',{style:{fontSize:11,fontWeight:700,color:T.green}}, '✅ '+(lang==='en'?'On time':'في الوقت'));
  }

  var inpSt = {fontSize:12,padding:'5px 8px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,outline:'none'};
  var nowSt = {fontSize:11,padding:'4px 8px',borderRadius:T.radius,border:'1px solid '+T.accent,background:T.accentDim,color:T.accent,cursor:'pointer',whiteSpace:'nowrap'};

  return h('div',{style:{padding:'10px 12px',borderTop:'1px dashed rgba(99,91,255,.2)',background:'rgba(99,91,255,.03)'}},
    /* Header: supplier info */
    h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
      h('span',{style:{fontSize:11,fontWeight:700,color:T.accent}},'🏭 '+(lang==='en'?'External Step':'خطوة خارجية')),
      sup && h('span',{style:{fontSize:11,color:T.text,fontWeight:600}}, ln(sup,lang)),
      sup && sup.phone && h('a',{href:'tel:'+sup.phone,style:{fontSize:11,color:T.textMid,textDecoration:'none'}},'📞 '+sup.phone),
      sup && sup.map_url && h('a',{href:sup.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:11,color:T.accent,textDecoration:'none'}},'📍')
    ),
    /* Date fields */
    h('div',{style:{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}},
      /* Sent */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'SENT TO SUPPLIER':'أُرسل للمجهز'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:sendVal,
            onChange:function(e){ setSendVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setSendVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'الآن')
        )
      ),
      /* Expected receive */
      h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
        h('label',{style:{fontSize:10,color:T.textMute,fontWeight:600}}, lang==='en'?'EXPECTED RECEIVE':'استلام متوقع'),
        h('div',{style:{display:'flex',gap:4}},
          h('input',{type:'datetime-local', value:recvVal,
            onChange:function(e){ setRecvVal(e.target.value); },
            style:inpSt}),
          h('button',{onClick:function(){ setRecvVal(localNow()); }, style:nowSt}, lang==='en'?'Now':'الآن')
        )
      ),
      /* Save button */
      h('button',{
        onClick: save,
        disabled: saving,
        style:{alignSelf:'flex-end',padding:'6px 16px',background:saving?T.border:T.accent,color:'#fff',border:'none',borderRadius:T.radius,fontWeight:700,fontSize:12,cursor:saving?'default':'pointer',marginBottom:1}
      }, saving ? (lang==='en'?'Saving...':'جاري الحفظ...') : (lang==='en'?'💾 Save':'💾 حفظ')),
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
     Detection: delivery step by flag OR by name containing deliver/توصيل/تسليم */
  function _isDelivStep(s) {
    if (s.is_delivery == 1) return true;
    var n = (s.step_name||'').toLowerCase();
    return n.indexOf('deliver') >= 0 || n.indexOf('توصيل') >= 0 || n.indexOf('تسليم') >= 0;
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
      h(Btn,{variant:"secondary",onClick:function(){openPrintWithLang(order,lang);}}, '🖨 '+t('print')),
      order.delivery_map_url && h('a',{href:order.delivery_map_url,target:'_blank',style:{display:'inline-flex',alignItems:'center',padding:'8px 14px',background:T.blueBg,color:T.blue,borderRadius:T.radius,fontSize:13,textDecoration:'none',fontWeight:600}},'📍 '+t('map')),
      deliverableItems.length > 0 && items.length > 1 && h(Btn,{style:{background:'#d97706',color:'#fff',border:'none'},onClick:function(){
        var autoSel = {};
        deliverableItems.forEach(function(item){ autoSel[item.id] = true; });
        setSelItems(autoSel);
        setShowPartial(true);
      }},
        '📦 '+(lang==='en'?'Partial Delivery':'تسليم جزئي')
      ),
      h('div',{style:{flex:1}}),
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
null
    )
  },
    h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 } },
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('customer_lbl')),h('div',{style:{fontWeight:700,color:T.text}},getCust(order, lang)),
        order.contact_person_name && h('div',{style:{fontSize:12,color:T.accent,marginTop:4}}, '👤 '+order.contact_person_name+(order.contact_person_phone?' · '+order.contact_person_phone:''))
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
      h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 14px'}},h('div',{style:{fontSize:11,color:T.textMute,fontWeight:600,marginBottom:3}},t('progress_lbl')),h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{flex:1}},h(ProgressBar,{value:p})),h('span',{style:{fontSize:12,fontWeight:700}},p+'%')))
    ),
    h(Divider, { label:t('steps_lbl') }),
    asArr(order.items).map(function(item){
      return h('div', { key:item.id, style:{ marginBottom:14 } },
        h('div', { style:{ fontWeight:700, fontSize:13, marginBottom: item.notes ? 4 : 8, display:'flex', alignItems:'center', gap:8 } },
          h('span', { style:{ background:T.bgSub, padding:'2px 10px', borderRadius:99, fontSize:12 } }, (lang==='en' && item.product_name_en) ? item.product_name_en : item.product_name),
          h('span', { style:{ color:T.textMute, fontWeight:400 } }, '× '+item.quantity)
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
            return h('div', { key:step.id, style:{ display:'flex', flexDirection:'column', gap:0, background: isPaused ? 'rgba(251,191,36,.07)' : isFirstPend ? 'rgba(99,91,255,.06)' : T.bgSub, borderRadius:T.radius, marginBottom:5, border: isPaused ? '1px solid rgba(251,191,36,.3)' : isFirstPend ? '1px dashed '+T.accent : step.is_external==1 ? '1px solid rgba(99,91,255,.3)' : '1px solid transparent' } },
              h('div',{style:{display:'grid', gridTemplateColumns:'16px 1fr 160px 44px 130px auto', alignItems:'center', gap:8, padding:'10px 12px'}},
              h('div', { style:{ width:7, height:7, borderRadius:'50%', background: isDoneStep?'#22c55e': isPaused?'#f59e0b': isActive?T.accent : isFirstPend ? T.accent : T.border, justifySelf:'center', opacity: isFirstPend ? .4 : 1 } }),
              h('div',{style:{display:'flex',flexDirection:'column',gap:2}},
                h('span', { style:{ fontSize:13, fontWeight: isActive||isFirstPend?600:400, color: isFirstPend?T.accent:T.text } }, lnStep(step,lang)),
                isPaused && step.pause_reason && h('span',{style:{fontSize:11,color:'#b45309'}},'⏸ '+step.pause_reason+(step.paused_machine?' · 🔧 '+step.paused_machine:'')),
null
              ),
              h('div', { style:{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', flexWrap:'wrap' } },
                isDoneStep && assignedEmps.length > 0
                  ? assignedEmps.map(function(e){ return h('div',{key:e.id,style:{display:'flex',alignItems:'center',gap:4,background:T.bg,borderRadius:99,padding:'3px 8px',border:'1px solid '+T.border}},
                      h('span',{style:{fontSize:11,color:T.textMid,whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}},ln(e,lang))
                    ); })
                  : null
              ),
              h('span', { style:{ fontSize:11, color:T.textMute, textAlign:'center' } }, fmtH(step.expected_hours)),
              h('div', { style:{ display:'flex', justifyContent:'center' } }, statusBadge(isPaused?'paused':step.status_slug, statuses, lang)),
              h('div', { style:{ display:'flex', justifyContent:'flex-end', gap:4 } },
                isFirstPend && !isPaused
                  ? h(Btn,{size:'sm',variant:'primary',onClick:function(){props.onStart(step.id);}}, '▶ '+t('start'))
                  : isActive && !isPaused
                    ? h('div',{style:{display:'flex',gap:4}},
                        step.is_delivery == 1
                          ? h(Btn,{size:'sm',variant:'success',onClick:function(){ setDeliveryConfirm({stepId:step.id, itemName: item.product_name||item.product_name_en||'—', qty: item.quantity}); }}, '✓')
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
                                setSelectedExecutors([]); // ✅ reset selections for new step
                                setExecutorPrompt({stepId: step.id, employees: teamEmps, stepName: lnStep(step, lang)});
                              } else {
                                props.onAdvance(step.id);
                              }
                            }}, t('complete_btn')),
                        step.is_delivery != 1 && props.onPauseStep && h('button',{onClick:function(){props.onPauseStep(step.id, lnStep(step,lang), step.step_name, step.step_name_en);},style:{padding:'4px 8px',borderRadius:T.radius,border:'1px solid #f59e0b',background:'rgba(245,158,11,.1)',color:'#b45309',cursor:'pointer',fontSize:12,fontWeight:600}},'⏸')
                      )
                    : isPaused
                      ? props.onResumeStep && h(Btn,{size:'sm',style:{background:'#22c55e',color:'#fff',border:'none'},onClick:function(){props.onResumeStep(step.id);}},lang==='en'?'Resume':'استئناف')
                      : isDoneStep
                        ? h('div',{style:{width:28,height:28,borderRadius:6,background:'rgba(34,197,94,.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22c55e',fontSize:14}},'✓')
                        : null
              )
              ), /* end inner grid row */
              /* ── External Supplier Panel ── */
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
    /* ── Partial Delivery modal ── */
    showPartial && h(Modal, {
      title: lang==='en' ? '📦 Partial Delivery' : '📦 تسليم جزئي',
      onClose: function(){ setShowPartial(false); setSelItems({}); },
      width: 460,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setShowPartial(false); setSelItems({}); }},t('cancel')),
        h(Btn,{variant:'primary',disabled:pdSaving||!Object.values(selItems).some(Boolean),onClick:submitPartial},
          pdSaving ? (lang==='en'?'Saving...':'جاري الحفظ...') : (lang==='en'?'OK — Confirm Delivery':'OK — تأكيد التسليم')
        )
      )
    },
      deliverableItems.length === 0
        ? h('div',{style:{color:T.textMute,textAlign:'center',padding:'20px 0'}},
            lang==='en'?'No items ready for delivery yet':'لا توجد منتجات جاهزة للتسليم'
          )
        : h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            h('p',{style:{color:T.textMid,fontSize:13,margin:'0 0 8px'}},
              lang==='en'?'These products are ready. Select which to deliver:':'المنتجات الجاهزة — اختر ما تريد توصيله:'
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
                  checked && h('span',{style:{color:'#fff',fontSize:13,fontWeight:700}},'✓')
                ),
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13,color:T.text}},itemName),
                  h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'× '+item.quantity)
                ),
                h('span',{style:{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#dcfce7',color:'#15803d',fontWeight:600,flexShrink:0}},
                  lang==='en'?'Ready':'جاهز'
                )
              );
            })
          )
    ),

    /* ── Delivery Confirm Modal ── */
    deliveryConfirm && h(Modal, {
      title: '📦 '+(lang==='en'?'Confirm Delivery':'تأكيد التوصيل'),
      onClose: function(){ setDeliveryConfirm(null); },
      width: 420,
      footer: h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end'}},
        h(Btn,{variant:'secondary',onClick:function(){ setDeliveryConfirm(null); }}, t('cancel')),
        h(Btn,{variant:'primary',onClick:function(){
          props.onAdvance(deliveryConfirm.stepId);
          setDeliveryConfirm(null);
        }}, lang==='en'?'OK — Mark as Delivered':'OK — تأكيد التسليم')
      )
    },
      h('div',{style:{padding:'4px 0'}},
        h('p',{style:{fontSize:13,color:T.textMid,marginBottom:14}},
          lang==='en'?'Are you sure you want to mark this product as delivered?':'هل تريد تأكيد تسليم هذا المنتج؟'
        ),
        h('div',{style:{border:'1.5px solid '+T.accent,borderRadius:T.radius,padding:'12px 16px',background:T.accentDim,display:'flex',alignItems:'center',gap:10}},
          h('div',{style:{width:20,height:20,borderRadius:4,background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},
            h('span',{style:{color:'#fff',fontSize:12,fontWeight:700}},'✓')
          ),
          h('div',null,
            h('div',{style:{fontWeight:600,fontSize:13,color:T.text}}, deliveryConfirm.itemName),
            h('div',{style:{fontSize:11,color:T.textMute,marginTop:2}},'× '+deliveryConfirm.qty)
          )
        )
      )
    ),

    /* ── Who did it? Modal ── */
    executorPrompt && h(Modal, {
      title: '👤 '+(lang==='en'?'Who completed this step?':'من نفّذ هذه الخطوة؟'),
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
        }}, lang==='en'?'Confirm':'تأكيد')
      )
    },
      h('div',{style:{marginBottom:8,fontSize:13,color:T.textMid}},
        lang==='en'?'Step: ':'الخطوة: ',
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
              isSelected && h('span',{style:{color:'#fff',fontSize:12,fontWeight:700,lineHeight:1}},'✓')
            ),
            h('span',{style:{fontWeight:600,fontSize:13,color:T.text}},ln(emp,lang))
          );
        })
      )
    )
  );
}

/* ═══ ARCHIVED ORDERS ═══ */
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
      h('span',{style:{fontSize:12,color:T.textMute}}, lang==='en'?'Per page:':'لكل صفحة:'),
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
        {key:'time_diff',label:lang==='en'?'Diff':'الفرق',noSort:true,render:function(o){
          var exp = (parseFloat(o.expected_hours_total)||0)*60;
          var act = (parseFloat(o.actual_hours_total)||0)*60;
          if (!exp || !act) return '—';
          var diff = act - exp;
          var faster = diff <= 0;
          return h('span',{style:{
            fontWeight:700,fontSize:12,borderRadius:99,padding:'2px 8px',
            color: faster ? T.green : T.red,
            background: faster ? '#dcfce7' : '#fee2e2'
          }}, faster
            ? '🟢 '+(lang==='en'?'Faster by ':'أسرع بـ ')+fmtMin(Math.abs(diff))
            : '🔴 '+(lang==='en'?'Slower by ':'أبطأ بـ ')+fmtMin(diff)
          );
        }},
        {key:'completed_at',label:t('completed_at'),render:function(o){return o.completed_at?fmtDate(o.completed_at, getLang()):'—';}},
      ],
      rows:pageOrders,
      actions:function(o){ return h(Btn,{size:'sm',variant:'secondary',onClick:function(){setPreview(o);}}, '👁'); },
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
      }, lang==='en'?'← Prev':'السابق ←'),
      /* page numbers — show up to 7 */
      (function(){
        var pages=[]; var start=Math.max(1,safePage-3); var end=Math.min(totalPages,start+6);
        if (start>1) pages.push(h('button',{key:'s1',onClick:function(){setPage(1);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},'1'));
        if (start>2) pages.push(h('span',{key:'e1',style:{color:T.textMute,fontSize:13}},'…'));
        for (var i=start;i<=end;i++) {
          var pg=i;
          pages.push(h('button',{key:pg,onClick:function(){setPage(pg);},
            style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+(pg===safePage?T.accent:T.border),
              background:pg===safePage?T.accent:'transparent',color:pg===safePage?'#fff':T.text,
              cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:pg===safePage?700:400}
          },pg));
        }
        if (end<totalPages-1) pages.push(h('span',{key:'e2',style:{color:T.textMute,fontSize:13}},'…'));
        if (end<totalPages) pages.push(h('button',{key:'sl',onClick:function(){setPage(totalPages);},style:{padding:'6px 12px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.text,cursor:'pointer',fontSize:13,fontFamily:'inherit'}},totalPages));
        return pages;
      })(),
      h('button',{
        disabled:safePage>=totalPages,
        onClick:function(){setPage(function(p){return Math.min(totalPages,p+1);});},
        style:{padding:'6px 14px',borderRadius:T.radius,border:'1px solid '+T.border,
          background:safePage<totalPages?T.bg:'transparent',color:safePage<totalPages?T.text:T.textMute,
          cursor:safePage<totalPages?'pointer':'default',fontSize:13,fontFamily:'inherit'}
      }, lang==='en'?'Next →':'→ التالي')
    ),
    preview && h(OrderPreviewModal,{order:preview,statuses:statuses,onClose:function(){setPreview(null);},onAdvance:function(stepId,completedByIds){ apiFetch('steps/'+stepId+'/advance',{method:'POST',body:completedByIds&&completedByIds.length?JSON.stringify({completed_by_ids:completedByIds}):undefined}).catch(function(){}); }})
  );
}

/* ═══ CUSTOMERS ═══ */
function CustomersView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('customers');
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var _r = useState(null); var recView = _r[0], setRecView = _r[1];
  var _c = useState(null); var contactsView = _c[0], setContactsView = _c[1];
  var blank = {name:'',name_en:'',phone:'',phone_alt:'',address:'',address_en:'',map_url:''};
  function save() { var p = form.id ? crud.update(form.id,form) : crud.create(form); p.then(function(){setForm(null);}); }
  useTopbar(t('n_clients',crud.items.length), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, {
      columns:[
        {key:'company_name',label:t('company'),render:function(r){
          var hasEn = lang==='en' && (r.company_name_en || r.name_en);
          var cname = (lang==='en' && r.company_name_en) ? r.company_name_en : (lang==='en' && r.name_en) ? r.name_en : (r.company_name||r.name);
          var sub   = (lang==='en' && r.name_en) ? r.name_en : r.name;
          var isFallback = lang==='en' && !hasEn;
          return h('div',null,
            h('div',{style:{fontWeight:600, color: isFallback?T.textMute:T.text, fontStyle: isFallback?'italic':'normal'}}, cname),
            (r.company_name||r.company_name_en) && r.name && h('div',{style:{fontSize:11,color:T.textMute}},sub)
          );
        }},
        {key:'phone',label:t('phone')},
        {key:'address',label:t('address'),render:function(r){ var addr = (lang==='en' && r.address_en) ? r.address_en : (r.address||''); return addr?addr.slice(0,40)+(addr.length>40?'…':''):'—'; }},
      ],
      rows:crud.items, onEdit:function(r){setForm(Object.assign({},blank,r));}, onDelete:function(r){crud.remove(r.id);},
      actions:function(r){ return h('div',{style:{display:'flex',gap:6}},
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){setRecView(r);}}, t('temp_recipients')),
        h(Btn,{size:'sm',variant:'secondary',onClick:function(){setContactsView(r);}}, '👤 '+t('contact_persons'))
      ); }
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('name'),ar:form.name||'',en:form.name_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});}); }}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('phone'),value:form.phone||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});});}}),
        h(Input,{label:t('phone_alt'),value:form.phone_alt||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone_alt:v});});}})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Textarea,{label:t('address')+' (عربي)',value:form.address||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address:v});});}}),
        h(Textarea,{label:t('address')+' (EN)',value:form.address_en||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{address_en:v});});}})
      ),
      h(Input,{label:'🗺 '+t('map_url'),value:form.map_url||'',placeholder:'https://maps.google.com/...',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}})
    ),
    recView && h(RecipientsModal,{customer:recView,onClose:function(){setRecView(null);}}),
    contactsView && h(ContactsModal,{customer:contactsView,onClose:function(){setContactsView(null);}})
  );
}


function ContactsModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var customer = props.customer;
  var _i = useState([]); var items = _i[0], setItems = _i[1];
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var blank = {name:'',name_en:'',job_title:'',job_title_en:'',phone:'',phone_alt:'',email:'',map_url:'',is_temp_recipient:0};
  function load() { apiFetch('customers/'+customer.id+'/contacts').then(function(r){ setItems(Array.isArray(r)?r:[]); }).catch(function(){ setItems([]); }); }
  useEffect(function(){ load(); }, [customer.id]);
  function save() {
    var prom = form.id ? apiFetch('contacts/'+form.id,{method:'PUT',body:JSON.stringify(form)}) : apiFetch('customers/'+customer.id+'/contacts',{method:'POST',body:JSON.stringify(form)});
    prom.then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('contacts/'+id,{method:'DELETE'}).then(load); }
  return h(Modal, {
    title:'👤 '+t('contact_persons')+' — '+((lang==='en'&&customer.company_name_en)?customer.company_name_en:(customer.company_name||customer.name)),
    onClose:props.onClose, width:480,
    footer: form
      ? h('div',{style:{display:'flex',gap:8}},
          h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
          h(Btn,{onClick:save},t('save'))
        )
      : h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add_contact'))
  },
    items.length===0 && !form ? h('div',{style:{textAlign:'center',padding:'24px 0',color:T.textMute}},t('no_contacts')) : null,
    items.map(function(c){
      return h(Card,{key:c.id,style:{padding:'12px 16px',marginBottom:8}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}},
          h('div',null,
            h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{fontWeight:700,fontSize:14}},c.name),c.is_temp_recipient==1&&h(Badge,{label:t('temp_recipient_lbl'),color:'amber'})),
            (c.job_title||c.job_title_en) && h('div',{style:{fontSize:12,color:T.accent,marginTop:1}},(lang==='en'&&c.job_title_en)?c.job_title_en:c.job_title),
            h('div',{style:{fontSize:12,color:T.textMute,marginTop:3,display:'flex',gap:12}},
              c.phone && h('span',null,'📞 '+c.phone),
              c.phone_alt && h('span',null,'📞 '+c.phone_alt),
              c.email && h('span',null,'✉ '+c.email)
            ),
            c.map_url && h('a',{href:c.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},'🗺 Map')
          ),
          h('div',{style:{display:'flex',gap:6}},
            h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},c));}},t('edit')),
            h(Btn,{size:'sm',variant:'danger',onClick:function(){del(c.id);}},t('delete'))
          )
        )
      );
    }),
    form && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:14,marginTop:8}},
      h(BiInput,{label:t('name'),ar:form.name||'',en:form.name_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});});}}),
      h(BiInput,{label:t('job_title'),ar:form.job_title||'',en:form.job_title_en||'',onAr:function(v){setForm(function(f){return Object.assign({},f,{job_title:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{job_title_en:v});});}}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}},
        h(Input,{label:t('phone'),value:form.phone||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});})}},),
        h(Input,{label:t('phone_alt'),value:form.phone_alt||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{phone_alt:v});})}},)
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}},
        h(Input,{label:t('email'),type:'email',value:form.email||'',onChange:function(v){setForm(function(f){return Object.assign({},f,{email:v});})}},),
        h(Input,{label:'🗺 '+t('map_url'),value:form.map_url||'',placeholder:'https://maps.google.com/...',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});})}},)
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,marginTop:8}},
        h('input',{type:'checkbox',checked:form.is_temp_recipient==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_temp_recipient:e.target.checked?1:0});});},style:{accentColor:T.accent}}),
        h('span',null,t('temp_recipient_lbl'))
      ),
      h('div',{style:{display:'flex',gap:8,marginTop:10}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    )
  );
}

function RecipientsModal(props) {
  var t = useI18n().t;
  var customer = props.customer;
  var _i = useState([]); var items = _i[0], setItems = _i[1];
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  var blank = {name:'',phone:'',address:'',map_url:''};
  function load() { apiFetch('customers/'+customer.id+'/recipients').then(function(r){ setItems(Array.isArray(r)?r:[]); }).catch(function(){ setItems([]); }); }
  useEffect(function(){ load(); }, [customer.id]);
  function save() {
    var prom = form.id ? apiFetch('recipients/'+form.id,{method:'PUT',body:JSON.stringify(form)}) : apiFetch('customers/'+customer.id+'/recipients',{method:'POST',body:JSON.stringify(form)});
    prom.then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('recipients/'+id,{method:'DELETE'}).then(load); }
  return h(Modal, { title:t('recipients')+' — '+(customer.company_name||customer.name), onClose:props.onClose, width:520, footer:h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add_recipient')) },
    items.map(function(r){
      return h(Card, { key:r.id, style:{ padding:'12px 16px', marginBottom:8 } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('div',null,h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{fontWeight:700}},r.name),r.is_active==0&&h(Badge,{label:t('inactive_lbl'),color:'gray'})),h('div',{style:{fontSize:12,color:T.textMute}},r.phone||'—'),r.address&&h('div',{style:{fontSize:12,color:T.textMute,marginTop:1}},r.address),r.map_url&&h('a',{href:r.map_url,target:'_blank',rel:'noopener noreferrer',style:{fontSize:12,color:T.accent,marginTop:2,display:'block'}},'🗺 '+t('map_url'))),
          h('div',{style:{display:'flex',gap:6}},h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},r));}},t('edit')),h(Btn,{size:'sm',variant:'danger',onClick:function(){del(r.id);}},t('delete')))
        )
      );
    }),
    form && h('div',{style:{marginTop:16,borderTop:'1px solid '+T.border,paddingTop:16}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('recipient_name'),value:form.name,onChange:function(v){setForm(function(f){return Object.assign({},f,{name:v});});}}),
        h(Input,{label:t('phone'),value:form.phone,onChange:function(v){setForm(function(f){return Object.assign({},f,{phone:v});})}})
      ),
      h(Textarea,{label:t('address'),value:form.address,onChange:function(v){setForm(function(f){return Object.assign({},f,{address:v});});}}),
      h(Input,{label:'🗺 '+t('map_url'),value:form.map_url,placeholder:'https://maps.google.com/...',onChange:function(v){setForm(function(f){return Object.assign({},f,{map_url:v});});}}),
      h('div',{style:{display:'flex',gap:8,marginTop:4}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    )
  );
}

/* ═══ SIMPLE CRUD FACTORY ═══ */
function SimpleCRUD(props) {
  var t = useI18n().t;
  var crud = useCRUD(props.resource);
  var _f = useState(null); var form = _f[0], setForm = _f[1];
  function afterMutation() { setForm(null); if (props.onReload) props.onReload(); }
  function save() {
    var p = form.id ? crud.update(form.id,form) : crud.create(form);
    p.then(function(res){
      var savedId = form.id || (res && res.id);
      if (props.onAfterSave) props.onAfterSave(savedId, form);
      afterMutation();
    });
  }
  function doRemove(id) { crud.remove(id).then(function(){ if (props.onReload) props.onReload(); }).catch(function(e){ alert(e.message); }); }
  function openEdit(r) {
    /* merge blankForm first so all fields exist, then overlay DB values, converting null→'' */
    var base = Object.assign({}, props.blankForm || {});
    Object.keys(r).forEach(function(k){ base[k] = r[k] != null ? r[k] : (base[k] != null ? base[k] : ''); });
    setForm(base);
  }
  useTopbar(t('n_items',crud.items.length), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},props.blankForm));}}, '+ '+t('add')));
  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h(DataTable, { columns:props.columns, rows:crud.items, onEdit:function(r){openEdit(r);}, onDelete:function(r){doRemove(r.id);}, extraActions:props.extraActions }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);},
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    }, props.FormContent({ form:form, setForm:setForm }))
  );
}

function colorDot(c) { return h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{width:12,height:12,borderRadius:'50%',background:c,border:'1px solid '+T.border}}),h('code',{style:{fontSize:11,color:T.textMute}},c)); }
/* ln(obj, lang) — picks name_en if lang=en and available, else name */
function ln(obj, lang) {
  if (!obj) return '—';
  if (lang === 'en' && obj.name_en && obj.name_en !== '') return obj.name_en;
  return obj.name || obj.step_name || '—';
}
function lnStep(obj, lang) {
  if (!obj) return '—';
  if (lang === 'en' && obj.step_name_en) return obj.step_name_en;
  return obj.step_name || '—';
}
function nameOf(arr, id, lang) { var x = findBy(arr,'id',id); return x ? ln(x, lang||'ar') : '—'; }
var SLUG_LABELS_AR = { pending:'قيد الانتظار', in_progress:'جاري', done:'مكتمل', completed:'مكتمل', cancelled:'ملغي' };
var SLUG_LABELS_EN = { pending:'Pending', in_progress:'In Progress', done:'Done', completed:'Completed', cancelled:'Cancelled' };
function slugLabel(slug, statuses, lang) {
  if (!slug) return '—';
  var st = findBy(statuses, 'slug', slug);
  if (st) return ln(st, lang);
  /* fallback: try case-insensitive match */
  var stLow = asArr(statuses).find(function(s){ return s.slug && s.slug.toLowerCase().replace(/\s+/g,'_') === slug.toLowerCase().replace(/\s+/g,'_'); });
  if (stLow) return ln(stLow, lang);
  /* hardcoded fallback */
  return lang === 'en' ? (SLUG_LABELS_EN[slug] || slug) : (SLUG_LABELS_AR[slug] || slug);
}

/* BilingualInputs: two side-by-side inputs for ar/en */
function BiInput(props) {
  var t = useI18n().t;
  return h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 } },
    h(Input, { label:(props.label||t('name'))+' (عربي)', value:props.ar, onChange:props.onAr, placeholder:'بالعربي' }),
    h(Input, { label:(props.label||t('name'))+' (EN)', value:props.en, onChange:props.onEn, placeholder:'In English' })
  );
}
function RolesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  return h(SimpleCRUD, { title:t('roles'), resource:'roles', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){return h('span',{style:{fontWeight:600}},ln(r,lang));}},
      {key:'color',label:t('color'),render:function(r){return colorDot(r.color);}}
    ],
    blankForm:{name:'',name_en:'',color:'#635bff'},
    FormContent:function(p){ return h('div',null,
      h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
      h(Input,{label:t('color'),type:'color',value:p.form.color,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{color:v});});}})
    ); }
  });
}
function DepartmentsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var crud = useCRUD('departments');
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var blank = {name:'',name_en:'',color:'#0055d4',sort_order:0};

  useTopbar(t('departments'), h(Btn,{variant:'primary',onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add')));

  function save() {
    var p = form.id ? crud.update(form.id,form) : crud.create(form);
    p.then(function(){ setForm(null); if(props.onReload) props.onReload(); });
  }

  function move(idx, dir) {
    var items = crud.items.slice();
    var target = idx + dir;
    if (target < 0 || target >= items.length) return;
    var tmp = items[idx]; items[idx] = items[target]; items[target] = tmp;
    var ids = items.map(function(d){ return d.id; });
    apiFetch('departments/reorder', {method:'POST', body:JSON.stringify({ids:ids})})
      .then(function(){ crud.load(); if(props.onReload) props.onReload(); });
  }

  if (crud.loading) return h(PageLoader);
  return h('div', null,
    h('div', {style:{background:T.bgCard,borderRadius:T.radiusLg,border:'1px solid '+T.border,overflow:'hidden'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'32px 1fr 140px auto',gap:8,padding:'10px 16px',borderBottom:'1px solid '+T.border,background:T.bgSub}},
        h('span',null),
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Name':'الاسم'),
        h('span',{style:{fontSize:11,fontWeight:700,color:T.textMute,textTransform:'uppercase',letterSpacing:.8}}, lang==='en'?'Color':'اللون'),
        h('span',null)
      ),
      crud.items.length === 0
        ? h('div',{style:{padding:32,textAlign:'center',color:T.textMute,fontSize:13}}, lang==='en'?'No departments yet':'لا توجد أقسام بعد')
        : crud.items.map(function(dept, idx){
          return h('div',{key:dept.id,style:{display:'grid',gridTemplateColumns:'32px 1fr 140px auto',gap:8,padding:'10px 16px',borderBottom:'1px solid '+T.border,alignItems:'center',background:T.bg}},
            h('div',{style:{display:'flex',flexDirection:'column',gap:1,alignItems:'center'}},
              h('button',{onClick:function(){move(idx,-1);},disabled:idx===0,
                style:{background:'transparent',border:'none',cursor:idx===0?'default':'pointer',color:idx===0?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'▲'),
              h('button',{onClick:function(){move(idx,1);},disabled:idx===crud.items.length-1,
                style:{background:'transparent',border:'none',cursor:idx===crud.items.length-1?'default':'pointer',color:idx===crud.items.length-1?T.border:T.textMid,fontSize:11,padding:'2px',lineHeight:1}},'▼')
            ),
            h('div',null,
              h('span',{style:{fontWeight:600,fontSize:13,color:T.text}}, ln(dept,lang)),
              dept.name_en && lang==='ar' && h('div',{style:{fontSize:11,color:T.textMute}}, dept.name_en)
            ),
            h('div',{style:{display:'flex',alignItems:'center',gap:6}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:dept.color||'#0ea5e9',flexShrink:0}}),
              h('span',{style:{fontSize:12,color:T.textMute}}, dept.color||'—')
            ),
            h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end'}},
              h(Btn,{size:'sm',variant:'secondary',onClick:function(){setForm(Object.assign({},blank,dept));}}, t('edit')),
              h(Btn,{size:'sm',variant:'danger',onClick:function(){ if(confirm(lang==='en'?'Delete?':'حذف؟')) crud.remove(dept.id).then(function(){ if(props.onReload) props.onReload(); }); }}, t('delete'))
            )
          );
        })
    ),
    form && h(Modal,{
      title:form.id?t('edit'):t('add')+' '+t('department'),
      onClose:function(){setForm(null);}, width:440,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
        h(Btn,{onClick:save},t('save'))
      )
    },
      h(BiInput,{label:t('name'),ar:form.name,en:form.name_en,
        onAr:function(v){setForm(function(f){return Object.assign({},f,{name:v});});},
        onEn:function(v){setForm(function(f){return Object.assign({},f,{name_en:v});});}
      }),
      h('div',{style:{marginTop:12}},
        h(Input,{label:t('color'),type:'color',value:form.color,onChange:function(v){setForm(function(f){return Object.assign({},f,{color:v});})}})
      )
    )
  );
}
function TeamsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var depts = asArr(props.bootstrap && props.bootstrap.departments);
  var emps  = asArr(props.bootstrap && props.bootstrap.employees);

  /* member_ids: employees whose team_id matches */
  function getMemberIds(teamId) {
    if (!teamId) return [];
    return emps.filter(function(e){ return String(e.team_id)===String(teamId); }).map(function(e){ return String(e.id); });
  }

  return h(SimpleCRUD, { title:t('teams'), resource:'teams', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){
        var members = emps.filter(function(e){ return String(e.team_id)===String(r.id); });
        return h('div',null,
          h('span',{style:{fontWeight:600}},ln(r,lang)),
          members.length>0 && h('div',{style:{display:'flex',flexWrap:'wrap',gap:3,marginTop:3}},
            members.map(function(e){ return h('span',{key:e.id,style:{fontSize:10,background:T.accentDim,color:T.accent,borderRadius:3,padding:'1px 5px'}},ln(e,lang)); })
          )
        );
      }},
      {key:'department_id',label:t('department'),render:function(r){return nameOf(depts,r.department_id,lang);}},
    ],
    blankForm:{name:'',name_en:'',department_id:'',lead_employee_id:'',member_ids:[]},
    onBeforeSave:function(form) {
      /* member_ids is handled server-side via extra endpoint */
      return form;
    },
    FormContent:function(p){
      /* init member_ids from current employees if editing */
      var memberIds = Array.isArray(p.form.member_ids) ? p.form.member_ids : getMemberIds(p.form.id);
      if (!Array.isArray(p.form.member_ids) && p.form.id) {
        /* first render of edit form — populate */
        setTimeout(function(){ p.setForm(function(f){ return Object.assign({},f,{member_ids: getMemberIds(f.id)}); }); }, 0);
      }
      return h('div',null,
        h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
        h('div',{style:{marginTop:8}},
          h(Select,{label:t('department'),value:p.form.department_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{department_id:v});});},options:depts.map(function(d){return {value:d.id,label:ln(d,lang)};})})
        ),
        h(MultiSelect,{label:t('members'),
          values:memberIds,
          onChange:function(v){ p.setForm(function(f){ return Object.assign({},f,{member_ids:v}); }); },
          options:emps.map(function(e){ return {value:String(e.id),label:ln(e,lang)}; })
        })
      );
    }
  });
}
function EmployeesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var roles = asArr(props.bootstrap && props.bootstrap.roles);
  var depts = asArr(props.bootstrap && props.bootstrap.departments);
  var teams = asArr(props.bootstrap && props.bootstrap.teams);
  return h(SimpleCRUD, { title:t('employees'), resource:'employees', onReload:props.onReload,
    columns:[
      {key:'avatar',label:'',noSort:true,render:function(r){return h(UserAvatar,{user:r,size:32});}},
      {key:'name',label:t('name'),render:function(r){
        var displayName = (lang==='en' && r.name_en && r.name_en !== '') ? r.name_en : r.name;
        var isFallback  = (lang==='en' && (!r.name_en || r.name_en === ''));
        return h('div',null,
          h('div',{style:{fontWeight:700,color:isFallback?T.textMute:T.text,fontStyle:isFallback?'italic':'normal'}},displayName),
          h('div',{style:{fontSize:11,color:T.textMute}},r.phone||'')
        );
      }},
      {key:'role_id',label:t('role'),render:function(r){return nameOf(roles,r.role_id,lang);}},
      {key:'department_id',label:t('department'),render:function(r){return nameOf(depts,r.department_id,lang);}},
      {key:'is_active',label:t('status_lbl'),render:function(r){return h(Badge,{label:r.is_active==1?t('active_status'):t('stopped'),color:r.is_active==1?'green':'gray'});}},
    ],
    blankForm:{name:'',name_en:'',role_id:'',department_id:'',team_id:'',phone:'',is_active:1},
    FormContent:function(p){ return h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
      h(BiInput,{label:t('name'),ar:p.form.name,en:p.form.name_en,
        onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},
        onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});});}}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('phone'),value:p.form.phone,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{phone:v});});}}),
        h(Select,{label:t('role'),value:p.form.role_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{role_id:v});});},options:roles.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
        h(Select,{label:t('department'),value:p.form.department_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{department_id:v});});},options:depts.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
        h(Select,{label:t('team'),value:p.form.team_id,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{team_id:v});});},options:teams.map(function(x){return {value:x.id,label:ln(x,lang)};})}),
        h(Select,{label:t('status_lbl'),value:String(p.form.is_active),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_active:parseInt(v)});});},options:[{value:'1',label:t('active_status')},{value:'0',label:t('stopped')}]})
      )); }
  });
}
function StatusesView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  return h(SimpleCRUD, { title:t('statuses'), resource:'statuses', onReload:props.onReload,
    columns:[
      {key:'name',label:t('name'),render:function(r){return h('div',{style:{display:'flex',alignItems:'center',gap:8}},h('div',{style:{width:10,height:10,borderRadius:'50%',background:r.color}}),ln(r,lang));}},
      {key:'slug',label:t('slug'),render:function(r){return h('code',{style:{fontSize:12,background:T.bgSub,padding:'2px 6px',borderRadius:4}},r.slug);}},
      {key:'sort_order',label:t('sort_order_lbl')},
      {key:'is_done',label:t('is_final_lbl'),render:function(r){return h(Badge,{label:r.is_done==1?t('yes'):t('no'),color:r.is_done==1?'green':'gray'});}},
    ],
    blankForm:{name:'',name_en:'',slug:'',color:'#6b7280',sort_order:0,is_done:0},
    FormContent:function(p){ return h('div',null,
      h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('slug'),value:p.form.slug,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{slug:v});});}}),
        h(Input,{label:t('color'),type:'color',value:p.form.color,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{color:v});});}}),
        h(Input,{label:t('sort_order'),type:'number',value:p.form.sort_order,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{sort_order:parseInt(v)||0});});}}),
        h(Select,{label:t('is_done'),value:String(p.form.is_done),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_done:parseInt(v)});});},options:[{value:'0',label:t('no')},{value:'1',label:t('yes')}]})
      )
    ); }
  });
}
function ProductWorkflowModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var product = props.product;
  var bs = props.bootstrap || {};
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var stepLib   = asArr(bs.step_library);
  var _steps = useState([]); var steps = _steps[0], setSteps = _steps[1];
  var _form  = useState(null); var form = _form[0], setForm = _form[1];
  var _loading = useState(false); var loading = _loading[0], setLoading = _loading[1];
  /* selLibId tracks which library step is selected for adding */
  var _sel = useState(''); var selLibId = _sel[0], setSelLibId = _sel[1];

  function load() {
    setLoading(true);
    apiFetch('products/'+product.id+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setLoading(false); });
  }
  useEffect(function(){ load(); }, [product.id]);

  function fmtMin(m) {
    if (!m || m==0) return '—';
    var mins = parseInt(m);
    if (mins < 60) return mins+' '+t('minutes');
    var hh = Math.floor(mins/60); var rem = mins%60;
    return hh+'h'+(rem?(' '+rem+'m'):'');
  }

  /* Add step from library */
  function addFromLib(libId) {
    var lib = findBy(stepLib,'id',libId);
    if (!lib) return;
    var data = {
      step_name: lib.step_name,
      step_name_en: lib.step_name_en||'',
      step_order: steps.length+1,
      assigned_employee_ids: lib.default_employee_ids ? (typeof lib.default_employee_ids==='string' ? JSON.parse(lib.default_employee_ids||'[]') : lib.default_employee_ids) : [],
      assigned_team_id: lib.default_team_id||'',
      assigned_role_id: '',
      expected_hours: 0,
      show_in_prds: lib.show_in_prds,
      is_external: lib.is_external,
      is_delivery: lib.is_delivery || 0
    };
    apiFetch('products/'+product.id+'/steps',{method:'POST',body:JSON.stringify(data)}).then(function(){ setSelLibId(''); load(); });
  }

  /* Edit: only allow changing employee/team and step_order */
  function saveEdit() {
    var data = Object.assign({},form);
    var mins = data.time_unit==='hr' ? (parseFloat(data.expected_time_val)||0)*60 : (parseFloat(data.expected_time_val)||0);
    data.expected_hours = mins/60;
    data.expected_minutes = mins;
    data.assigned_employee_ids = Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [];
    apiFetch('product-steps/'+form.id,{method:'PUT',body:JSON.stringify(data)}).then(function(){ setForm(null); load(); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('product-steps/'+id,{method:'DELETE'}).then(load); }

  /* Steps already added (to filter library) */
  var addedNames = steps.map(function(s){ return s.step_name; });
  var availableLib = stepLib.filter(function(s){ return addedNames.indexOf(s.step_name)<0; });

  return h(Modal, {
    title: '⚙ '+t('product_workflow')+' — '+ln(product,lang),
    onClose: props.onClose, width: 680
  },
    loading ? h(PageLoader) : h('div',null,

      /* ── Add from library ── */
      h('div',{style:{marginBottom:16,display:'flex',gap:8,alignItems:'flex-end'}},
        h('div',{style:{flex:1}},
          h(Select,{
            label:'📚 '+t('pick_from_library'),
            value:selLibId,
            onChange:setSelLibId,
            options:availableLib.map(function(s){ return {value:String(s.id),label:lnStep(s,lang)}; }),
            placeholder: availableLib.length>0 ? '— '+t('pick_from_library')+' —' : '— '+t('all_steps_added')+' —'
          })
        ),
        h(Btn,{variant:'primary',onClick:function(){ if(selLibId) addFromLib(selLibId); },disabled:!selLibId},'+ '+t('add'))
      ),

      /* ── Steps list ── */
      steps.length === 0
        ? h('div',{style:{textAlign:'center',padding:'24px 0',color:T.textMute}},t('no_data'))
        : h('div',{style:{display:'flex',flexDirection:'column',gap:6,marginBottom:form?12:0}},
            steps.map(function(s){
              return h('div',{key:s.id,style:{display:'flex',alignItems:'center',gap:10,background:T.bgSub,borderRadius:T.radius,padding:'10px 14px',border:'1px solid '+T.border}},
                h('div',{style:{width:26,height:26,borderRadius:'50%',background:T.accentDim,color:T.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0}},s.step_order),
                h('div',{style:{flex:1}},
                  h('div',{style:{fontWeight:600,fontSize:13}},lnStep(s,lang)),
                  h('div',{style:{fontSize:11,color:T.textMute,marginTop:2,display:'flex',gap:10}},
                    (function(){
                      var ids = Array.isArray(s.assigned_employee_ids) ? s.assigned_employee_ids : (s.assigned_employee_ids ? JSON.parse(s.assigned_employee_ids||'[]') : (s.assigned_employee_id ? [String(s.assigned_employee_id)] : []));
                      return ids.length ? h('span',null,'👤 '+ids.map(function(id){ return nameOf(employees,id,lang); }).join(', ')) : null;
                    })(),
                    s.assigned_team_id ? h('span',null,'👥 '+nameOf(teams,s.assigned_team_id,lang)) : null,
                    h('span',null,'⏱ '+(s.expected_time_val||fmtMin(Math.round((parseFloat(s.expected_hours)||0)*60)))+' / '+(s.qty_per_unit||1)+' '+t('unit_lbl')),

                  )
                ),
                h('div',{style:{display:'flex',gap:6}},
                  h(Btn,{size:'sm',variant:'secondary',onClick:function(){
                    /* Read fresh from steps state to avoid stale closure */
                    var fresh = steps.filter(function(x){ return String(x.id) === String(s.id); })[0] || s;
                    var eids = Array.isArray(fresh.assigned_employee_ids) ? fresh.assigned_employee_ids : (fresh.assigned_employee_ids ? (function(){ try{ return JSON.parse(fresh.assigned_employee_ids); }catch(e){ return []; } })() : (fresh.assigned_employee_id ? [String(fresh.assigned_employee_id)] : []));
                    var rawMins = Math.round((parseFloat(fresh.expected_hours)||0)*60);
                    var timeUnit = (rawMins > 0 && rawMins % 60 === 0) ? 'hr' : 'min';
                    var timeVal  = timeUnit === 'hr' ? rawMins/60 : rawMins;
                    setForm({id:fresh.id,step_order:fresh.step_order,expected_minutes:rawMins,expected_time_val:timeVal,time_unit:timeUnit,assigned_employee_ids:eids.map(String),assigned_team_id:fresh.assigned_team_id?String(fresh.assigned_team_id):'',step_name:fresh.step_name,step_name_en:fresh.step_name_en||'',scales_with_qty:fresh.scales_with_qty||0,qty_per_unit:fresh.qty_per_unit||1,show_in_prds:fresh.show_in_prds!=null?parseInt(fresh.show_in_prds):1,is_external:parseInt(fresh.is_external)||0,is_delivery:parseInt(fresh.is_delivery)||0});
                  }},t('edit')),
                  h(Btn,{size:'sm',variant:'danger',onClick:function(){del(s.id);}},t('delete'))
                )
              );
            })
          ),

      /* ── Edit form ── */
      form && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:14,marginTop:8}},
        h('div',{style:{fontWeight:600,fontSize:13,marginBottom:10,color:T.accent}},t('edit')+': '+(lang==='en'&&form.step_name_en?form.step_name_en:form.step_name)),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:4}},
          h(Input,{label:'# '+t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
          h(Input,{label:t('expected_time'),type:'number',value:form.expected_time_val||0,onChange:function(v){setForm(function(f){return Object.assign({},f,{expected_time_val:parseFloat(v)||0});});}}),
          h(Select,{label:t('time_unit'),value:form.time_unit||'min',onChange:function(v){setForm(function(f){return Object.assign({},f,{time_unit:v});});},options:[{value:'min',label:t('minutes')},{value:'hr',label:t('hours_unit')}]}),
          h(Input,{label:(lang==='ar'?'لكل':'Per')+' ('+( lang==='ar'?'وحدة':'unit')+')',type:'number',value:form.qty_per_unit||1,onChange:function(v){setForm(function(f){return Object.assign({},f,{qty_per_unit:Math.max(1,parseInt(v)||1)});});}})
        ),
        h('div',{style:{fontSize:11,color:T.textMute,marginBottom:10,padding:'4px 6px',background:T.bgSub,borderRadius:T.radius}},
          '📐 '+(lang==='ar'?'مثال':'Example')+': '+( form.expected_time_val||0 )+' '+(form.time_unit==='hr'?t('hours_unit'):t('minutes'))+' '+(lang==='ar'?'لكل':'per')+' '+(form.qty_per_unit||1)+' '+(lang==='ar'?'وحدة':'unit')
        ),
        h(MultiSelect,{label:t('employees'),
          values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
          onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
          options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
        }),
        h('div',{style:{fontSize:10,color:'#888',marginTop:4,padding:'4px 6px',background:'#f5f5f5',borderRadius:4}},
          'DEBUG — saved IDs: '+JSON.stringify(form.assigned_employee_ids)+' | employee IDs: '+employees.slice(0,3).map(function(e){return e.id+':'+e.name;}).join(', ')
        ),

        h('div',{style:{display:'flex',gap:8,marginTop:10}},
          h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),
          h(Btn,{onClick:saveEdit},t('save'))
        )
      )
    )
  );
}

function ProductsView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var _wf = useState(null); var wfProduct = _wf[0], setWfProduct = _wf[1];
  return h('div',null,
    h(SimpleCRUD, { title:t('products'), resource:'products', onReload:props.onReload,
      columns:[
        {key:'name',label:t('name'),render:function(r){return h('div',null,h('div',{style:{fontWeight:700}},ln(r,lang)),h('div',{style:{fontSize:11,color:T.textMute}},r.sku||''));}},
        {key:'is_active',label:t('status_lbl'),render:function(r){return h(Badge,{label:r.is_active==1?t('active_status'):t('stopped'),color:r.is_active==1?'green':'gray'});}},
      ],
      blankForm:{name:'',name_en:'',sku:'',description:'',description_en:'',is_active:1},
      extraActions:function(r){ return h(Btn,{size:'sm',variant:'secondary',onClick:function(){setWfProduct(r);}}, '⚙ '+t('workflow')); },
      FormContent:function(p){ return h('div',null,
        h(BiInput,{ar:p.form.name,en:p.form.name_en,onAr:function(v){p.setForm(function(f){return Object.assign({},f,{name:v});});},onEn:function(v){p.setForm(function(f){return Object.assign({},f,{name_en:v});})}},),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
          h(Input,{label:t('sku'),value:p.form.sku,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{sku:v});});}}),
          h(Select,{label:t('status_lbl'),value:String(p.form.is_active),onChange:function(v){p.setForm(function(f){return Object.assign({},f,{is_active:parseInt(v)});});},options:[{value:'1',label:t('active_status')},{value:'0',label:t('stopped')}]})
        ),
        h(Textarea,{label:t('description')+' (عربي)',value:p.form.description,onChange:function(v){p.setForm(function(f){return Object.assign({},f,{description:v});});}}),
        h(Textarea,{label:t('description')+' (EN)',value:p.form.description_en||'',onChange:function(v){p.setForm(function(f){return Object.assign({},f,{description_en:v});});}})
      ); }
    }),
    wfProduct && h(ProductWorkflowModal,{product:wfProduct,bootstrap:props.bootstrap,onClose:function(){setWfProduct(null);}})
  );
}

/* ═══ PRODUCT STEPS ═══ */
function ProductStepsView(props) {
  var t = useI18n().t;
  var bs = props.bootstrap || {};
  var products  = asArr(bs.products);
  var employees = asArr(bs.employees);
  var teams     = asArr(bs.teams);
  var roles     = asArr(bs.roles);
  var suppliers = asArr(bs.suppliers);
  var _pid = useState(''); var pid = _pid[0], setPid = _pid[1];
  var _steps = useState([]); var steps = _steps[0], setSteps = _steps[1];
  var _loading = useState(false); var loading = _loading[0], setLoading = _loading[1];
  var _form = useState(null); var form = _form[0], setForm = _form[1];
  var lang = useI18n().lang;
  var blank = {step_name:'',step_name_en:'',step_order:0,assigned_employee_id:'',assigned_team_id:'',assigned_role_id:'',status_slug:'pending',expected_hours:0,show_in_prds:0,is_external:0,supplier_id:'',ext_send_at:'',ext_receive_expected:''};

  function loadSteps(p) {
    setLoading(true);
    apiFetch('products/'+p+'/steps').then(function(r){ setSteps(Array.isArray(r)?r:[]); setLoading(false); }).catch(function(){ setSteps([]); setLoading(false); });
  }
  useEffect(function(){ if(pid) loadSteps(pid); }, [pid]);

  function save() {
    var data = Object.assign({}, form);
    data.assigned_employee_ids = Array.isArray(form.assigned_employee_ids) ? form.assigned_employee_ids.map(String) : [];
    var prom = form.id ? apiFetch('product-steps/'+form.id,{method:'PUT',body:JSON.stringify(data)}) : apiFetch('products/'+pid+'/steps',{method:'POST',body:JSON.stringify(data)});
    prom.then(function(){ setForm(null); loadSteps(pid); });
  }
  function del(id) { if(!confirm(t('confirm_delete')))return; apiFetch('product-steps/'+id,{method:'DELETE'}).then(function(){ loadSteps(pid); }); }

  useTopbar(t('workflow_hint'), null);
  return h('div', null,
    h(Card,{style:{padding:'14px 20px',marginBottom:16}}, h(Select,{label:t('product'),value:pid,onChange:setPid,options:products.map(function(p){return {value:p.id,label:ln(p,lang)};})})),
    pid && h('div',{style:{marginBottom:12,display:'flex',justifyContent:'flex-end'}}, h(Btn,{onClick:function(){setForm(Object.assign({},blank));}}, '+ '+t('add'))),
    loading ? h(PageLoader) : h(DataTable, {
      columns:[
        {key:'step_order',label:'#',render:function(r){return h('span',{style:{fontFamily:'monospace',color:T.textMute}},r.step_order);}},
        {key:'step_name',label:t('step_name'),render:function(r){return h('span',{style:{fontWeight:600}},lnStep(r,lang));}},
        {key:'assigned_employee_id',label:t('employee'),render:function(r){return nameOf(employees,r.assigned_employee_id);}},
        {key:'assigned_team_id',label:t('team'),render:function(r){return nameOf(teams,r.assigned_team_id,lang);}},
        {key:'expected_hours',label:t('expected_hours'),render:function(r){return fmtH(r.expected_hours);}},
        {key:'show_in_prds',label:'KDS',render:function(r){return h(Badge,{label:r.show_in_prds==1?t('complete_btn'):'—',color:r.show_in_prds==1?'green':'gray'});}},
      ],
      rows:steps, onEdit:function(r){
        var eids = [];
        try { eids = typeof r.assigned_employee_ids==='string' ? JSON.parse(r.assigned_employee_ids||'[]') : (r.assigned_employee_ids||[]); } catch(e){}
        setForm(Object.assign({},r,{assigned_employee_ids:eids.map(String)}));
      }, onDelete:function(r){del(r.id);}
    }),
    form && h(Modal, { title:form.id?t('edit'):t('add'), onClose:function(){setForm(null);}, width:500,
      footer:h('div',{style:{display:'flex',gap:8}},h(Btn,{variant:'secondary',onClick:function(){setForm(null);}},t('cancel')),h(Btn,{onClick:save},t('save')))
    },
      h(BiInput,{label:t('step_name'),ar:form.step_name,en:form.step_name_en,onAr:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});},onEn:function(v){setForm(function(f){return Object.assign({},f,{step_name_en:v});});}}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Input,{label:t('step_order'),type:'number',value:form.step_order,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_order:parseInt(v)||0});});}}),
        h(Input,{label:t('expected_hours'),type:'number',value:form.expected_hours,onChange:function(v){setForm(function(f){return Object.assign({},f,{expected_hours:parseFloat(v)||0});})}})
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h(Select,{label:t('team'),value:String(form.assigned_team_id||''),onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_team_id:v});});},options:[{value:'',label:'—'}].concat(teams.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        h(Select,{label:t('role'),value:String(form.assigned_role_id||''),onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_role_id:v});});},options:[{value:'',label:'—'}].concat(roles.map(function(e){return {value:String(e.id),label:ln(e,lang)};}))}),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.show_in_prds==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{show_in_prds:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('show_in_kds')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_external==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_external:e.target.checked?1:0});});},style:{accentColor:T.accent}}),t('external_task')),
        h('label',{style:{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:13}},h('input',{type:'checkbox',checked:form.is_delivery==1,onChange:function(e){setForm(function(f){return Object.assign({},f,{is_delivery:e.target.checked?1:0});});},style:{accentColor:T.accent}}),'🚚 '+t('is_delivery'))
      ),
      /* External supplier fields — only shown when is_external */
      form.is_external==1 && h('div',{style:{marginTop:12,padding:'12px 14px',background:T.bgSub,borderRadius:T.radius,border:'1px solid '+T.border}},
        h('div',{style:{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10}},'🏭 '+(lang==='en'?'External Supplier Details':'تفاصيل المجهز الخارجي')),
        h(Select,{label:lang==='en'?'Supplier':'المجهز',value:String(form.supplier_id||''),
          onChange:function(v){setForm(function(f){return Object.assign({},f,{supplier_id:v?parseInt(v):null});});},
          options:[{value:'',label:lang==='en'?'— Select Supplier —':'— اختر المجهز —'}].concat(
            suppliers.map(function(s){ return {value:String(s.id),label:ln(s,lang)+(s.phone?' · '+s.phone:'')};})
          )
        }),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:10}},
          h(Input,{label:lang==='en'?'Expected Send Date/Time':'وقت إرسال متوقع',type:'datetime-local',value:form.ext_send_at||'',
            onChange:function(v){setForm(function(f){return Object.assign({},f,{ext_send_at:v});});}}),
          h(Input,{label:lang==='en'?'Expected Receive Date/Time':'وقت استلام متوقع',type:'datetime-local',value:form.ext_receive_expected||'',
            onChange:function(v){setForm(function(f){return Object.assign({},f,{ext_receive_expected:v});});}})
        )
      ),
      h(MultiSelect,{label:t('employees'),
        values:Array.isArray(form.assigned_employee_ids)?form.assigned_employee_ids:[],
        onChange:function(v){setForm(function(f){return Object.assign({},f,{assigned_employee_ids:v});});},
        options:employees.map(function(e){return {value:String(e.id),label:ln(e,lang)};})
      })
    )
  );
}

/* ═══ TASKS / STEPS / NOTIFICATIONS ═══ */
/* ═══ EXTERNAL TASKS VIEW ═══
 * Groups external steps by supplier — each supplier is a row with a carousel of order cards
 */
function ExternalTasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var orders    = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var suppliers = asArr(bs.suppliers);

  /* Collect all active external steps */
  var allSteps = [];
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if (['done','completed','cancelled'].indexOf(s.status_slug) >= 0) return;
        if (s.is_external != 1) return;
        allSteps.push(Object.assign({}, s, {order:order, item:item}));
      });
    });
  });

  /* Group steps by supplier_id */
  var supplierMap = {};
  if(allSteps.length>0) console.log('[EXT] first step supplier_id:',allSteps[0].supplier_id,'suppliers count:',suppliers.length, 'suppliers:',suppliers.map(function(x){return x.id+':'+x.name;}));
  allSteps.forEach(function(s){
    var sid = String(s.supplier_id||'none');
    if (!supplierMap[sid]) supplierMap[sid] = [];
    supplierMap[sid].push(s);
  });

  /* Build supplier rows — sort by late count desc */
  var rows = Object.keys(supplierMap).map(function(sid){
    var steps = supplierMap[sid];
    var sup = sid!=='none' ? suppliers.filter(function(x){ return String(x.id)===sid; })[0] : null;
    var lateCount = steps.filter(function(s){
      if (!s.ext_receive_expected) return false;
      var expected = new Date(s.ext_receive_expected);
      var actual = s.ext_receive_actual ? new Date(s.ext_receive_actual) : new Date();
      return actual > expected;
    }).length;
    return {sid:sid, sup:sup, steps:steps, lateCount:lateCount};
  });
  rows.sort(function(a,b){ return b.lateCount - a.lateCount; });

  /* Carousel state: {sid: currentIndex} */
  var _pos = useState({}); var positions = _pos[0], setPositions = _pos[1];

  function getPos(sid){ return positions[sid]||0; }
  function setPos(sid, idx){
    setPositions(function(prev){
      var n = Object.assign({},prev); n[sid]=idx; return n;
    });
  }

  /* Delay indicator */
  function delayBadge(s){
    if (!s.ext_receive_expected) return null;
    var expected = new Date(s.ext_receive_expected);
    var cmp = s.ext_receive_actual ? new Date(s.ext_receive_actual) : new Date();
    var diffH = Math.round((cmp - expected) / 36e5);
    if (s.ext_receive_actual) {
      return diffH > 0
        ? h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}}, '⚠️ تأخير '+diffH+' س')
        : h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}}, '✅ في الوقت');
    }
    if (s.status_slug==='in_progress' && diffH > 0) {
      return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}}, '⚠️ تأخير '+diffH+' س');
    }
    return h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(34,197,94,.1)',color:T.green}}, '✅ في الوقت');
  }

  function fmtDT(str){
    if (!str) return null;
    var d = new Date(str);
    var days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    var months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    if (lang==='en') {
      return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    }
    var p = function(n){ return String(n).padStart(2,'0'); };
    return p(d.getDate())+' '+months[d.getMonth()]+' '+p(d.getHours())+':'+p(d.getMinutes());
  }

  var CARD_W = 220;

  useTopbar(lang==='en'?'External Tasks':'المهام الخارجية', null);

  if (rows.length === 0) {
    return h('div',{style:{padding:40,textAlign:'center'}},
      h('div',{style:{fontSize:32,marginBottom:10}},'🏭'),
      h('div',{style:{color:T.textMute,fontSize:14}},lang==='en'?'No external tasks':'لا توجد مهام خارجية')
    );
  }

  return h('div',{style:{display:'flex',flexDirection:'column',gap:10}},

    /* Total summary */
    h('div',{style:{fontSize:13,color:T.textMute,marginBottom:4}},
      rows.length+' '+(lang==='en'?'suppliers':'مجهز')+' · '+allSteps.length+' '+(lang==='en'?'tasks':'مهمة')
    ),

    rows.map(function(row){
      var sup = row.sup;
      var steps = row.steps;
      var cur = getPos(row.sid);
      var total = steps.length;

      /* Avatar initials */
      var name = sup ? ln(sup,lang) : (lang==='en'?'Unknown':'غير محدد');
      var initials = name.slice(0,2);
      var avatarColors = ['#EEEDFE/#3C3489','#E1F5EE/#085041','#FAEEDA/#633806','#FAECE7/#993C1D','#E6F1FB/#185FA5'];
      var ci = parseInt(row.sid)%5||0;
      var aColors = avatarColors[ci].split('/');

      return h('div',{key:row.sid, style:{
        display:'grid',
        gridTemplateColumns:'150px 1fr',
        border:'1px solid '+T.border,
        borderRadius:T.radiusLg,
        overflow:'hidden',
        background:T.bg
      }},

        /* Supplier cell */
        h('div',{style:{
          background:T.bgSub,
          padding:'16px 14px',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center',
          gap:6,
          borderLeft:'1px solid '+T.border
        }},
          h('div',{style:{
            width:40,height:40,borderRadius:'50%',
            background:aColors[0],color:aColors[1],
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:700,marginBottom:4
          }}, initials),
          h('div',{style:{fontSize:13,fontWeight:600,color:T.text}}, name),
          sup && sup.phone && h('div',{style:{fontSize:11,color:T.textMute}}, sup.phone),
          h('div',{style:{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}},
            h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:T.bg,border:'1px solid '+T.border,color:T.textMid}},
              total+' '+(lang==='en'?'tasks':'مهمة')
            ),
            row.lateCount > 0 && h('span',{style:{padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600,background:'rgba(239,68,68,.1)',color:T.red}},
              row.lateCount+' '+(lang==='en'?'late':'متأخرة')
            )
          )
        ),

        /* Carousel */
        h('div',{style:{display:'flex',flexDirection:'column',minWidth:0}},

          /* Track */
          h('div',{style:{overflow:'hidden',flex:1}},
            h('div',{style:{
              display:'flex',
              transform:'translateX(-'+(cur*CARD_W)+'px)',
              transition:'transform 0.3s ease'
            }},
              steps.map(function(s,i){
                return h('div',{key:s.id, style:{
                  minWidth:CARD_W,maxWidth:CARD_W,
                  padding:'14px',
                  borderLeft: i===0?'none':'1px solid '+T.border,
                  display:'flex',flexDirection:'column',gap:7
                }},
                  /* Order number */
                  h('div',{style:{display:'flex',alignItems:'center',gap:6}},
                    h('span',{style:{fontSize:12,fontWeight:600,color:T.accent}},'#'+s.order.order_number),
                    statusBadge(s.status_slug, asArr(bs.statuses), lang)
                  ),
                  /* Product + customer */
                  h('div',null,
                    h('div',{style:{fontSize:13,fontWeight:600,color:T.text}},
                      (lang==='en'&&s.item.product_name_en) ? s.item.product_name_en : s.item.product_name
                    ),
                    h('div',{style:{fontSize:11,color:T.textMute}}, getCust(s.order,lang))
                  ),
                  /* Step name */
                  h('div',{style:{fontSize:11,color:T.accent,background:T.accentDim,borderRadius:4,padding:'2px 6px',width:'fit-content'}},
                    lnStep(s,lang)
                  ),
                  /* Dates */
                  h('div',{style:{display:'flex',flexDirection:'column',gap:3}},
                    h('div',{style:{fontSize:11,color:T.textMute}},
                      '📤 '+(lang==='en'?'Sent:':'أُرسل: ')+(s.ext_send_at ? fmtDT(s.ext_send_at) : (lang==='en'?'Not sent':'لم يُرسل'))
                    ),
                    h('div',{style:{fontSize:11,color:T.textMute}},
                      '📅 '+(lang==='en'?'Expected:':'متوقع: ')+(s.ext_receive_expected ? fmtDT(s.ext_receive_expected) : '—')
                    ),
                    s.ext_receive_actual && h('div',{style:{fontSize:11,color:T.green}},
                      '📥 '+(lang==='en'?'Received:':'استُلم: ')+fmtDT(s.ext_receive_actual)
                    )
                  ),
                  /* Delay badge */
                  delayBadge(s)
                );
              })
            )
          ),

          /* Footer: dots + nav */
          h('div',{style:{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'8px 12px',
            borderTop:'1px solid '+T.border,
            background:T.bgSub
          }},
            /* Dots */
            h('div',{style:{display:'flex',gap:4,alignItems:'center'}},
              Array.from({length:Math.min(total,8)}).map(function(_,i){
                var active = i===Math.min(cur,Math.min(total,8)-1);
                return h('div',{
                  key:i,
                  onClick:function(){ setPos(row.sid, i); },
                  style:{
                    width:active?18:6, height:6,
                    borderRadius:active?3:99,
                    background:active?T.accent:T.border,
                    cursor:'pointer',
                    transition:'all 0.2s'
                  }
                });
              })
            ),
            /* Page counter */
            h('span',{style:{fontSize:12,color:T.textMute}}, (cur+1)+' / '+total),
            /* Nav buttons */
            h('div',{style:{display:'flex',gap:4}},
              h('button',{
                onClick:function(){ setPos(row.sid, Math.max(0,cur-1)); },
                disabled:cur===0,
                style:{
                  width:28,height:28,borderRadius:6,
                  border:'1px solid '+T.border,
                  background:T.bg,color:T.text,
                  cursor:cur===0?'default':'pointer',
                  opacity:cur===0?0.3:1,
                  fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'
                }
              },'‹'),
              h('button',{
                onClick:function(){ setPos(row.sid, Math.min(total-1,cur+1)); },
                disabled:cur===total-1,
                style:{
                  width:28,height:28,borderRadius:6,
                  border:'1px solid '+T.border,
                  background:T.bg,color:T.text,
                  cursor:cur===total-1?'default':'pointer',
                  opacity:cur===total-1?0.3:1,
                  fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'
                }
              },'›')
            )
          )
        )
      );
    })
  );
}


function TasksView(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var bs = props.bootstrap || {};
  var authUser = props.authUser || {};
  var isAdmin = String(authUser.role||'').replace(/['"]/g,'').trim() === 'admin';
  var myEmpId = authUser.employee_id ? parseInt(authUser.employee_id) : null;
  var employees = asArr(bs.employees);
  var orders   = asArr(bs.orders).filter(function(o){ return !isDone(o); });
  var statuses = asArr(bs.statuses);

  /* Admin: employee filter dropdown */
  var _selEmp = useState(''); var selEmpId = _selEmp[0], setSelEmpId = _selEmp[1];

  /* Collect all steps */
  var allSteps = [];
  orders.forEach(function(order){
    asArr(order.items).forEach(function(item){
      asArr(item.steps).forEach(function(s){
        if (['done','completed','cancelled'].indexOf(s.status_slug) >= 0) return;
        if (props.externalOnly && s.is_external != 1) return;
        if (!props.externalOnly && s.is_external == 1) return;
        allSteps.push(Object.assign({}, s, { order:order, item:item }));
      });
    });
  });

  /* Filter by employee */
  function stepBelongsToEmp(s, empId) {
    if (!empId) return true;
    var id = parseInt(empId);
    /* assigned_employee_ids is JSON array */
    var ids = [];
    try { ids = typeof s.assigned_employee_ids === 'string' ? JSON.parse(s.assigned_employee_ids||'[]') : (s.assigned_employee_ids||[]); } catch(e){}
    ids = ids.map(function(x){ return parseInt(x); });
    if (ids.indexOf(id) >= 0) return true;
    if (parseInt(s.assigned_employee_id) === id) return true;
    return false;
  }

  var steps = allSteps.filter(function(s){
    if (isAdmin) {
      /* Admin: show all OR filtered by selected employee */
      return selEmpId ? stepBelongsToEmp(s, selEmpId) : true;
    } else {
      /* Non-admin: show only their own tasks */
      return myEmpId ? stepBelongsToEmp(s, myEmpId) : true;
    }
  });

  var _dp2 = useState(null); var delayPrompt2 = _dp2[0], setDelayPrompt2 = _dp2[1];
  function startStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/start',{method:'POST'}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }
  function completeStep(stepId, orderId) {
    apiFetch('steps/'+stepId+'/advance',{method:'POST'}).then(function(res){
      if (res && res.needs_delay_reason) setDelayPrompt2({orderId:res.order_id||orderId,reason:''});
      (props.onSilentReload||props.onReload)();
    });
  }

  /* Time performance badge */
  function timeBadge(r) {
    if (r.status_slug !== 'in_progress' && r.status_slug !== 'done') return h('span',{style:{color:T.textMute}},'—');
    if (!r.started_at) return h('span',{style:{color:T.textMute}},'—');
    var exp = (parseFloat(r.expected_hours)||0) * 60;
    if (exp <= 0) return h('span',{style:{color:T.textMute}},'—');
    var endMs = r.completed_at ? new Date(r.completed_at) : new Date();
    var actual = (endMs - new Date(r.started_at)) / 60000;
    var diff = actual - exp;
    if (diff < -2)  return h(Badge,{label:'✅ '+(lang==='en'?'Ahead':t('ahead'))+' '+Math.abs(Math.round(diff))+'m', color:'green'});
    if (diff < 5)   return h(Badge,{label:'✅ '+(lang==='en'?'On Time':t('on_time')), color:'green'});
    return h(Badge,{label:'⚠️ '+(lang==='en'?'Late':t('late'))+' +'+Math.round(diff)+'m', color:'red'});
  }

  var filterBar = isAdmin && h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 16px', background:T.bgSub, borderRadius:T.radius, border:'1px solid '+T.border } },
    h('span',{style:{fontSize:13,color:T.textMute,fontWeight:600}}, lang==='en'?'Filter by employee:':'فلتر حسب الموظف:'),
    h('select', { value:selEmpId, onChange:function(e){ setSelEmpId(e.target.value); },
      style:{ padding:'6px 10px', borderRadius:T.radius, border:'1px solid '+T.border, background:T.bg, color:T.text, fontSize:13, minWidth:160 }
    },
      h('option',{value:''}, lang==='en'?'All employees':'كل الموظفين'),
      employees.map(function(e){ return h('option',{key:e.id, value:String(e.id)}, ln(e,lang)); })
    ),
    selEmpId && h('button',{onClick:function(){setSelEmpId('');}, style:{padding:'5px 10px',borderRadius:T.radius,border:'1px solid '+T.border,background:T.bg,color:T.textMute,cursor:'pointer',fontSize:12}},'✕')
  );

  useTopbar(t('n_tasks',steps.length), null);
  return h('div', null,
    filterBar,
    steps.length === 0
      ? h(Card,{style:{padding:40,textAlign:'center'}},h('div',{style:{fontSize:32,marginBottom:10}},props.externalOnly?'🚚':'✋'),h('div',{style:{color:T.textMute}},t('no_data')))
      : h(DataTable, {
          columns:[
            {key:'step_name',label:t('step_name'),render:function(r){
              return h('div',null,
                h('span',{style:{fontWeight:600}},lnStep(r,lang)),
                r.is_paused==1 && h('span',{style:{marginRight:6,fontSize:11,background:'#fef3c7',color:'#b45309',borderRadius:4,padding:'1px 5px'}},'⏸')
              );
            }},
            {key:'order',label:t('order_number_lbl'),render:function(r){return h('code',{style:{fontSize:12,color:T.accent}},'#'+r.order.order_number);}},
            {key:'item',label:t('product'),render:function(r){return (lang==='en'&&r.item.product_name_en)?r.item.product_name_en:r.item.product_name;}},
            {key:'customer',label:t('customer'),render:function(r){return getCust(r.order, lang);}},
            {key:'status_slug',label:t('status'),render:function(r){return statusBadge(r.status_slug,statuses,lang);}},
            {key:'expected_hours',label:t('exp_hrs'),render:function(r){return fmtH(r.expected_hours);}},
            {key:'time_perf',label:lang==='en'?'Time':'الوقت',noSort:true,render:timeBadge},
          ],
          rows:steps,
          actions:function(r){ return h('div',{style:{display:'flex',gap:6}},
            r.status_slug==='pending' && h(Btn,{size:'sm',variant:'primary',onClick:function(){startStep(r.id, r.order.id);}}, '▶ '+t('start')),
            r.status_slug==='in_progress' && h(Btn,{size:'sm',variant:'success',onClick:function(){completeStep(r.id, r.order.id);}}, '✓ '+t('complete_step'))
          ); }
        }),
    delayPrompt2 && h(Modal,{
      title:'⚠️ '+(lang==='en'?'Delay Reason Required':'سبب التأخير مطلوب'), onClose:function(){setDelayPrompt2(null);}, width:460,
      footer:h('div',{style:{display:'flex',gap:8}},
        h(Btn,{variant:'secondary',onClick:function(){setDelayPrompt2(null);}},lang==='en'?'Skip':'تخطي'),
        h(Btn,{variant:'primary',onClick:function(){
          if(!delayPrompt2.reason.trim())return;
          apiFetch('orders/'+delayPrompt2.orderId+'/delay',{method:'POST',body:JSON.stringify({reason:delayPrompt2.reason})}).then(function(){setDelayPrompt2(null);(props.onSilentReload||props.onReload)();});
        }},lang==='en'?'Save':'حفظ'))
    },
      h('p',{style:{color:T.textMid,marginBottom:12}},lang==='en'?'The deadline has passed. Please enter a reason for the delay:':'فات الـ Deadline — يرجى كتابة سبب التأخير:'),
      h('textarea',{value:delayPrompt2.reason,onChange:function(e){setDelayPrompt2(function(d){return Object.assign({},d,{reason:e.target.value});});},rows:4,style:{width:'100%',padding:'10px 12px',borderRadius:T.radius,border:'1px solid '+T.border,fontSize:13,resize:'vertical',background:T.bgSub,color:T.text,boxSizing:'border-box'}})
    )
  );
}

/* ═══ SUPPLIERS — مجهزون خارجيون ═══ */
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
        h(Input,{label:(lang==='en'?'Name':'الاسم')+' (عربي)',value:form.name,onChange:setField('name')}),
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
    // ✅ FIX: robust unwrap of employee IDs regardless of nesting level
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
        h(Input,{label:t('step_name')+' (عربي)',value:form.step_name,onChange:function(v){setForm(function(f){return Object.assign({},f,{step_name:v});});}}),
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
  useTopbar(unread+' غير مقروء', null);
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

/* ═══ KDS ═══ */
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
  /* carousel page per section — advances automatically on standalone */
  var _pages = useState({ip:0,rd:0,pd:0}); var carouselPages = _pages[0], setCarouselPages = _pages[1];
  useEffect(function(){ var id = setInterval(props.onReload, 30000); return function(){ clearInterval(id); }; }, []);

  /* detect standalone KDS mode */
  var rootEl = document.getElementById('cspsr-root');
  var isStandalone = rootEl && rootEl.dataset && rootEl.dataset.mode === 'kds';

  /* carousel auto-advance — only in standalone mode */
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
    return n.indexOf('deliver') >= 0 || n.indexOf('توصيل') >= 0 || n.indexOf('تسليم') >= 0;
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

  var inProg = [], readyDeliver = [], partialDeliver = [];
  orders.forEach(function(o) {
    var items = asArr(o.items);
    /* Items ready for delivery (production done OR flagged) but not yet delivered */
    var readyItems = items.filter(function(item){
      return (item.is_ready_for_delivery == 1 || itemProductionDone(item)) && !itemDelivered(item);
    });
    /* Items whose production is NOT done yet and not flagged ready */
    var pendingItems = items.filter(function(item){
      return !itemProductionDone(item) && item.is_ready_for_delivery != 1;
    });

    var hasPending = pendingItems.length > 0;
    var hasReady   = readyItems.length > 0;

    if (hasPending && hasReady && items.length > 1) {
      /* Some done, some not, AND more than 1 item → show in BOTH columns */
      inProg.push(o);
      partialDeliver.push(o);
    } else if (!hasPending && hasReady) {
      /* All production done → Ready to Deliver */
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

  /* ── Dark card for standalone, light card for embedded ── */
  /* ── Partial Delivery card: shows only ready items with "Delivered" button per item ── */
  function renderPartialCard(order) {
    var isStandaloneCard = isStandalone;
    var bg   = isStandaloneCard ? '#161b22' : T.bg;
    var text = isStandaloneCard ? '#e6edf3' : T.text;
    var mid  = isStandaloneCard ? '#8b949e' : T.textMute;
    var bord = isStandaloneCard ? '#30363d' : T.border;
    var subBg= isStandaloneCard ? '#21262d' : T.bgSub;

    /* Items that are production-done but not yet delivered */
    var readyItems = asArr(order.items).filter(function(item){
      return itemProductionDone(item) && !itemDelivered(item);
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

    var qrPartialUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent((cfg().root.replace(/\/+$/, '') + '/qr-contact?order_id=' + order.id));

    return h('div', { style:{ background:bg, border:urgBorder, borderRadius:12, padding:'14px', marginBottom:8 } },
      /* Header */
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}},
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{fontFamily:'monospace',fontWeight:700,fontSize:13,color:'#d97706'}},'#'+order.order_number),
          h('div',{style:{fontSize:12,fontWeight:600,color:text,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
          order.deadline && h('div',{style:{fontSize:11,color:'#d97706',fontWeight:600,marginTop:2}},'🗓 '+fmtDate(order.deadline,getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer',marginInlineStart:8},onClick:function(){setQrOrder(order);}},
          h('img',{src:qrPartialUrl,width:120,height:120,style:{display:'block',borderRadius:6,border:'1px solid #d97706',background:'#fff',padding:2},alt:'QR'})
        )
      ),
      /* Ready items list */
      h('div',{style:{borderTop:'1px solid '+bord,paddingTop:8}},
        h('div',{style:{fontSize:11,color:'#d97706',fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:.5}},
          lang==='en'?'Ready for Delivery':'جاهز للتوصيل'
        ),
        readyItems.length === 0
          ? h('div',{style:{color:mid,fontSize:12,textAlign:'center',padding:'8px 0'}},lang==='en'?'No ready items':'لا توجد منتجات جاهزة')
          : readyItems.map(function(item){
              var itemName = (lang==='en' && item.product_name_en) ? item.product_name_en : (item.product_name||'—');
              return h('div',{key:item.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid '+subBg}},
                h('div',{style:{flex:1,minWidth:0}},
                  h('div',{style:{fontSize:12,fontWeight:600,color:text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},itemName),
                  h('div',{style:{fontSize:11,color:mid}},'× '+item.quantity)
                ),
                h('button',{
                  onClick:function(){ markDelivered(item.id); },
                  style:{
                    padding:'5px 12px',borderRadius:6,border:'none',
                    background:isStandaloneCard?'rgba(59,190,80,.25)':'#dcfce7',
                    color:isStandaloneCard?'#3fb950':'#166534',
                    cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0,marginRight:4
                  }
                }, lang==='en'?'✓ Delivered':'✓ تم التوصيل')
              );
            })
      ),
      /* In-production items */
      inProductionItems.length > 0 && h('div',{style:{borderTop:'1px solid '+bord,paddingTop:8,marginTop:8}},
        h('div',{style:{fontSize:11,color:mid,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:.5}},
          lang==='en'?'Still in Production':'لا تزال في الإنتاج'
        ),
        inProductionItems.map(function(item){
          var itemName = (lang==='en' && item.product_name_en) ? item.product_name_en : (item.product_name||'—');
          return h('div',{key:item.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid '+subBg}},
            h('div',{style:{flex:1,minWidth:0}},
              h('div',{style:{fontSize:12,color:mid,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},itemName),
              h('div',{style:{fontSize:11,color:mid}},'× '+item.quantity)
            ),
            h('span',{style:{fontSize:11,padding:'2px 8px',borderRadius:99,background:subBg,color:mid,flexShrink:0}},
              lang==='en'?'⚙ In Production':'⚙ قيد الإنتاج'
            )
          );
        })
      ),
      /* Print button — prints only the ready items */
      readyItems.length > 0 && h('div',{style:{marginTop:10,paddingTop:8,borderTop:'1px solid '+bord}},
        h('button',{
          onClick:function(){
            var orderCopy = Object.assign({},order,{items:readyItems});
            openPrintWithLang(orderCopy, getLang());
          },
          style:{width:'100%',padding:'8px',borderRadius:6,border:'1px solid '+bord,background:'transparent',color:mid,cursor:'pointer',fontSize:12,fontFamily:'inherit'}
        }, '🖨 '+(lang==='en'?'Print delivery slip':'طباعة وصل التوصيل'))
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
              order.is_urgent==1 && h('span',{style:{fontSize:9,background:'#f85149',color:'#fff',borderRadius:3,padding:'1px 4px',fontWeight:700}},lang==='en'?'URGENT':'عاجل')
            ),
            h('div',{style:{fontSize:12,fontWeight:600,color:'#e6edf3',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getCust(order,getLang())),
            order.deadline && h('div',{style:{fontSize:10,color:'#d29922',marginTop:2}},'🗓 '+fmtDate(order.deadline,getLang()))
          ),
          h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(order);}},
            h('img',{src:qrApiUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid #30363d',background:'#fff',padding:2},alt:'QR'})
          )
        ),
        h('div',{style:{background:'#21262d',borderRadius:99,height:4,overflow:'hidden',marginBottom:4}},
          h('div',{style:{width:p+'%',background:p>=100?'#3fb950':p>=50?'#58a6ff':'#d29922',height:'100%',borderRadius:99}})
        ),
        h('div',{style:{fontSize:10,color:'#8b949e',marginBottom:7}},p+'% — '+stepLabel),
        asArr(order.items).length > 0 && h('div',{style:{borderTop:'1px solid #21262d',paddingTop:6}},
          asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
            var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'—');
            return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
              h('span',{style:{fontSize:11,color:'#c9d1d9',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
              h('span',{style:{fontSize:11,color:'#6e7681',flexShrink:0}},'×'+item.quantity)
            );
          })
        )
      );
    }
    /* ── Light card for embedded (inside app) ── */
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
          order.deadline && h('div',{style:{fontSize:11,color:T.amber,fontWeight:600,marginTop:2}},'🗓 '+fmtDate(order.deadline,getLang()))
        ),
        h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(order);}},
          h('img',{src:qrEmbUrl,width:70,height:70,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
        )
      ),
      /* Row 2: progress */
      h(ProgressBar,{value:p}),
      h('div',{style:{fontSize:10,color:T.textMute,marginTop:3,marginBottom:7}},p+'% — '+stepLabelEmb),
      /* Row 3: in-production products only */
      asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).length > 0 && h('div',{style:{borderTop:'1px solid '+T.border,paddingTop:6,marginBottom:7}},
        asArr(order.items).filter(function(item){ return item.is_ready_for_delivery != 1; }).map(function(item){
          var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'—');
          return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}},
            h('span',{style:{fontSize:11,color:T.textMid,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
            h('span',{style:{fontSize:11,color:T.textMute,flexShrink:0}},'×'+item.quantity)
          );
        })
      ),
      /* Row 4: action buttons — hidden in KDS display */
    );
  }
  var gridSt = view==='grid'
    ? {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:isStandalone?14:16}
    : {display:'flex',flexDirection:'column',gap:10};

  var sections = [
    {key:'ip',  label:lang==='en'?'In Progress':'قيد الإنتاج',         count:inProg.length,        items:inProg,        color:isStandalone?'#58a6ff':T.blue,   icon:'⚙️', renderFn: renderKCard},
    {key:'rd',  label:lang==='en'?'Ready to Deliver':'جاهز للتوصيل',   count:readyDeliver.length,  items:readyDeliver,  color:isStandalone?'#3fb950':T.green,  icon:'🚚', renderFn: renderKCard},
    {key:'pd',  label:lang==='en'?'Partial Delivery':'توصيل جزئي',     count:partialDeliver.length,items:partialDeliver,color:isStandalone?'#d29922':'#d97706', icon:'📦', renderFn: renderPartialCard},
  ];

  /* carousel: advance each column's page every N seconds — always active */
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
                ? h('div',{style:{textAlign:'center',padding:'20px 0',color:'#484f58',fontSize:12}},lang==='en'?'No orders':'لا توجد طلبات')
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
                    o.is_urgent==1 && h('span',{style:{fontSize:10,background:'#f85149',color:'#fff',borderRadius:4,padding:'1px 5px',marginTop:2,display:'inline-block'}},lang==='en'?'Urgent':'عاجل')
                  ),
                  h('div',null,
                    h('div',{style:{background:'#21262d',borderRadius:4,height:6,overflow:'hidden',marginBottom:4}},
                      h('div',{style:{background:p===100?'#3fb950':'#58a6ff',height:'100%',width:p+'%',transition:'width .3s'}})
                    ),
                    h('div',{style:{fontSize:11,color:'#8b949e'}},p+'% | '+(activeStep?lnStep(activeStep,lang):(o.current_step_label||'—')))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:3}},
                    asArr(o.items).slice(0,2).map(function(item){
                      var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'');
                      return h('span',{key:item.id,style:{fontSize:10,background:'#21262d',color:'#8b949e',borderRadius:4,padding:'2px 6px',whiteSpace:'nowrap',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',display:'inline-block'}},iName+' ×'+item.quantity);
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
      /* ── QR Contact Modal standalone ── */
      qrOrder && renderQRModal(qrOrder, true),
      rcOrder && renderRecipientModal(rcOrder, true)
    );
  }

  /* ── Embedded light layout (inside app sidebar) ── */
  useTopbar(t('n_active',orders.length)+' — '+t('kds_subtitle'),
    h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:view==='grid'?'primary':'secondary',size:'sm',onClick:function(){setView('grid');}}, '⊞ Grid'),
      h(Btn,{variant:view==='list'?'primary':'secondary',size:'sm',onClick:function(){setView('list');}}, '☰ List'),
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
      }, fullKDS ? '✕ '+(lang==='en'?'Exit':'خروج') : '⛶ '+(lang==='en'?'Fullscreen':'ملء الشاشة'))
    )
  );

  /* Fullscreen overlay — covers entire viewport, no sidebar or header */
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
        }, lang==='en'?'Exit Fullscreen':'خروج من ملء الشاشة')
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
                ? asArr(o.items).filter(function(item){ return itemProductionDone(item)&&!itemDelivered(item); })
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
                    o.deadline && h('div',{style:{fontSize:10,color:T.amber,marginTop:1}},'🗓 '+fmtDate(o.deadline,getLang()))
                  ),
                  h('div',{style:{flexShrink:0,cursor:'pointer'},onClick:function(){setQrOrder(o);}},
                    h('img',{src:qrUrl,width:120,height:120,style:{display:'block',borderRadius:6,border:'1px solid '+T.border,background:'#fff',padding:2},alt:'QR'})
                  )
                ),
                h('div',{style:{background:T.bgSub,borderRadius:99,height:4,overflow:'hidden',marginBottom:3}},
                  h('div',{style:{width:p+'%',background:p>=100?'#22c55e':T.accent,height:'100%',borderRadius:99}})
                ),
                h('div',{style:{fontSize:10,color:T.textMute,marginBottom:4}},p+'% — '+stepLbl),
                h('div',{style:{flex:1,overflow:'hidden'}},
                  displayItems.map(function(item){
                    var iName=(lang==='en'&&item.product_name_en)?item.product_name_en:(item.product_name||'—');
                    return h('div',{key:item.id,style:{display:'flex',justifyContent:'space-between',fontSize:10,padding:'1px 0',borderBottom:'1px solid '+T.bgSub}},
                      h('span',{style:{color:T.textMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%'}},iName),
                      h('span',{style:{color:T.textMute,flexShrink:0}},'×'+item.quantity)
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
      }, '✕ '+(lang==='en'?'Exit Fullscreen':'خروج من ملء الشاشة'))
    ),
    orders.length===0 && h(Card,{style:{padding:40,textAlign:'center'}},
      h('div',{style:{fontSize:48,marginBottom:12}},'📋'),
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
              ? h('div',{style:{textAlign:'center',padding:'20px 0',color:T.textMute,fontSize:12,width:'100%'}},lang==='en'?'No orders':'لا توجد طلبات')
              : pageItems.map(function(o){ return h('div',{key:o.id},(sec.renderFn||renderKCard)(o)); })
          )
        );
      })
    ),
    /* ── Pause Modal embedded — linked to Settings reasons ── */
    pausePrompt && h(PauseModal, {
      pauseReasons: pauseReasons,
      stepLabel: pausePrompt.stepLabel || '',
      onClose: function(){ setPausePrompt(null); },
      onConfirm: function(reason, machine){
        apiFetch('steps/'+pausePrompt.stepId+'/pause',{method:'POST',body:JSON.stringify({reason:reason,machine:machine||''})})
          .then(function(){ setPausePrompt(null); (props.onSilentReload||props.onReload)(); });
      }
    }),
    /* ── QR Contact Modal embedded ── */
    qrOrder && renderQRModal(qrOrder, false),
    rcOrder && renderRecipientModal(rcOrder, false)
  );

  /* ── QR Contact Modal builder ── */
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
          h('button',{onClick:function(){setQrOrder(null);},style:{border:'none',background:'transparent',cursor:'pointer',color:mute,fontSize:20,lineHeight:1,padding:4}},'×')
        ),
        /* Body */
        h('div',{style:{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}},
          /* QR code */
          h('div',{style:{display:'flex',justifyContent:'center'}},
            h('div',{style:{background:'#fff',padding:8,borderRadius:10,display:'inline-block',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}},
              h('img',{src:qrApiUrl,width:120,height:120,style:{display:'block',borderRadius:4},alt:'QR'})
            )
          ),
          h('div',{style:{fontSize:11,color:mute,textAlign:'center'}}, lang==='en'?'Scan to open contact page':'امسح للوصول لصفحة التواصل'),
          /* Recipient */
          (order.recipient_name||ct.name) && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:4}},lang==='en'?'Recipient':'المستلم'),
            h('div',{style:{fontWeight:600,fontSize:13,color:text}},order.recipient_name||ct.name||'—'),
            ct.name && order.recipient_name && ct.name!==order.recipient_name && h('div',{style:{fontSize:12,color:mid,marginTop:2}},ct.name)
          ),
          /* Phones */
          phones.length > 0 && h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
            phones.map(function(ph,i){
              var waNum = ph.replace(/[^0-9]/g,'');
              return h('div',{key:i,style:{display:'flex',gap:8}},
                h('a',{href:'tel:'+ph,style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'📞'), ph
                ),
                h('a',{href:'https://wa.me/'+waNum,target:'_blank',style:{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'#d1fae5',color:'#065f46',textDecoration:'none',fontWeight:700,fontSize:13}},
                  h('span',null,'💬'), 'WhatsApp'
                )
              );
            })
          ),
          /* Maps */
          mapUrl && h('a',{href:mapUrl,target:'_blank',style:{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderRadius:9,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:13}},
            h('span',{style:{fontSize:18}},'📍'),
            lang==='en'?'Open in Google Maps':'فتح في خرائط كوكل'
          ),
          /* Products */
          items.length > 0 && h('div',{style:{background:subBg,borderRadius:10,padding:'12px 14px'}},
            h('div',{style:{fontSize:11,color:mute,fontWeight:600,marginBottom:8}},lang==='en'?'Products in this order':'المنتجات في الطلب'),
            items.map(function(item,i){
              return h('div',{key:i,style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<items.length-1?'1px solid '+bord:'none'}},
                h('span',{style:{fontSize:13,color:text,fontWeight:500}},(lang==='en'&&item.product_name_en)?item.product_name_en:item.product_name||'—'),
                h('span',{style:{fontSize:12,color:mute,background:dark?'#161b22':T.bg,borderRadius:99,padding:'1px 8px'}},
                  '×'+item.quantity
                )
              );
            })
          ),
          !ct.phone && !mapUrl && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:subBg,borderRadius:8,textAlign:'center'}},lang==='en'?'No contact info available':'لا توجد معلومات تواصل')
        )
      )
    );
  }

  /* ── Recipient Contact Modal builder ── */
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
          h('div',{style:{width:40,height:40,borderRadius:10,background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}},'📦'),
          h('div',null,
            h('div',{style:{fontWeight:700,fontSize:14,color:text}}, lang==='en'?'Recipient':'المستلم'),
            h('div',{style:{fontSize:12,color:mute}},'#'+order.order_number+' — '+customer)
          )
        ),
        /* Recipient info card */
        h('div',{style:{background:cardBg,borderRadius:10,padding:'14px 16px',marginBottom:16}},
          name && h('div',{style:{fontWeight:700,fontSize:15,color:text,marginBottom:6}},name),
          address && h('div',{style:{fontSize:12,color:mute,marginBottom:4}},'📍 '+address),
          !name && !address && h('div',{style:{color:mute,fontSize:13}}, lang==='en'?'No recipient info':'لا توجد بيانات مستلم')
        ),
        /* Contact buttons */
        h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          phone && h('a',{href:'tel:'+phone, style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'📞'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Call Recipient':'اتصال بالمستلم'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          phone && h('a',{href:'https://wa.me/'+phone.replace(/[^0-9]/g,''), target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dcfce7',color:'#15803d',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'💬'),
            h('div',{style:{textAlign:'right'}},
              h('div',null,'WhatsApp'),
              h('div',{style:{fontSize:11,fontWeight:400,opacity:.7}},phone)
            )
          ),
          map && h('a',{href:map, target:'_blank', style:{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:10,background:'#dbeafe',color:'#1d4ed8',textDecoration:'none',fontWeight:700,fontSize:14}},
            h('span',{style:{fontSize:20,lineHeight:1}},'📍'),
            h('div',{style:{textAlign:'right'}},
              h('div',null, lang==='en'?'Open Map':'فتح الخريطة')
            )
          ),
          !phone && !map && h('div',{style:{color:mute,fontSize:13,padding:'12px',background:cardBg,borderRadius:8}}, lang==='en'?'No contact info':'لا توجد معلومات تواصل')
        ),
        h('button',{onClick:function(){setRcOrder(null);}, style:{marginTop:16,padding:'8px 24px',borderRadius:8,border:'1px solid '+bord,background:'transparent',color:mute,cursor:'pointer',fontSize:13,width:'100%'}}, lang==='en'?'Close':'إغلاق')
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
      h('div',{style:{fontWeight:700,color:T.red,marginBottom:8}},'⚠️ UI Error'),
      h('code',{style:{fontSize:12,color:T.textMute,display:'block',marginBottom:14}},this.state.msg),
      h(Btn,{variant:'secondary',onClick:function(){ this.setState({err:false,msg:''}); }.bind(this)},'↺ Retry')
    );
    return this.props.children;
  };
  return EB;
})();

/* ═══ OPERATIONS TASKS ═══ */

/* ── OpsTaskForm: create/edit a task ── */
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
    if (!form.customer_id) { alert(lang === 'en' ? 'Customer is required' : 'العميل مطلوب'); return; }
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

  var orderOpts = [{ value:'', label: lang==='en' ? '— No linked order —' : '— بدون طلب مرتبط —' }]
    .concat(orders.map(function(o){ return { value:String(o.id), label:'#'+o.order_number+' — '+getCust(o,lang) }; }));

  var custOpts = [{ value:'', label: lang==='en' ? '— Select customer —' : '— اختر العميل —' }]
    .concat(customers.map(function(c){ return { value:String(c.id), label:ln(c,lang) }; }));

  var contactOpts = [{ value:'', label: lang==='en' ? '— No contact person —' : '— بدون شخص تواصل —' }]
    .concat(contacts.map(function(c){ return { value:String(c.id), label:c.name+(c.phone?' ('+c.phone+')':'') }; }));

  var productOpts = [{ value:'', label: lang==='en' ? '— No product —' : '— بدون منتج —' }]
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
      h(Fld, { label: lang==='en' ? 'Linked Order (optional)' : 'الطلب المرتبط (اختياري)' },
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
          h(Input, { value:form.time, placeholder: lang==='en'?'e.g. 2h':'مثال: 2 ساعة', onChange:function(v){ set('time',v); } })
        )
      )
    )
  );
}

/* ── OpsTaskCard: a single task card in the kanban ── */
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
          title: lang==='en' ? 'Move to previous stage' : 'نقل للمرحلة السابقة',
          onClick: function(e){ e.stopPropagation(); props.onMovePrev(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:14, padding:2, lineHeight:1 }
        }, '←'),
        /* Arrow right (next stage) */
        props.canMoveNext && h('button', {
          title: lang==='en' ? 'Move to next stage' : 'نقل للمرحلة التالية',
          onClick: function(e){ e.stopPropagation(); props.onMoveNext(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.accent, fontSize:14, padding:2, lineHeight:1 }
        }, '→'),
        h('button', {
          title: t('edit'),
          onClick: function(e){ e.stopPropagation(); props.onEdit(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.textMute, fontSize:13, padding:2, lineHeight:1 }
        }, '✎'),
        h('button', {
          title: t('delete'),
          onClick: function(e){ e.stopPropagation(); if(confirm(t('confirm_delete'))) props.onDelete(task); },
          style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:13, padding:2, lineHeight:1 }
        }, '✕')
      )
    ),
    /* Customer */
    h('div', { style:{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 } },
      task.customer_company || task.customer_name || '—'
    ),
    /* Description */
    task.description && h('div', { style:{ fontSize:12, color:T.textMid, marginBottom:5, lineHeight:1.4 } }, task.description),
    /* Footer: deadline + time */
    h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 } },
      task.deadline && h(Badge, {
        label: '📅 ' + fmtDate(task.deadline, lang),
        color: isOverdue ? 'red' : 'blue',
      }),
      task.time && h(Badge, { label:'⏱ '+task.time, color:'gray' }),
      task.contact_person_name && h(Badge, { label:'👤 '+task.contact_person_name, color:'purple' })
    )
  );
}

/* ── OpsKanbanColumn: one stage column ── */
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
      }, '✎'),
      /* Delete button */
      h('button', {
        title: t('ops_delete_stage'), onClick: deleteStage,
        style:{ border:'none', background:'transparent', cursor:'pointer', color:T.red, fontSize:12, padding:2 }
      }, '🗑')
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
    }, '+ '+(lang==='en'?'Add Task':'إضافة مهمة'))
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

  /* Filter orders: ready to deliver or partial, assigned to me (admin sees all) */
  var orders = asArr(bs.orders).filter(function(o){
    if (isDone(o)) return false;
    if (!isAdmin && String(o.delivery_employee_id) !== String(myEmp && myEmp.id)) return false;
    return orderAtDelivery(o) || asArr(o.items).some(function(item){
      return (item.is_ready_for_delivery == 1 || itemProductionDone(item)) && !itemDelivered(item);
    });
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
      var isPartial = !orderAtDelivery(o);
      var readyItems = asArr(o.items).filter(function(item){ return itemProductionDone(item) && !itemDelivered(item); });
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

/* ── OperationsTasksView: main page ── */
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
      lang==='en' ? '⊞ Board' : '⊞ اللوحة'),
    h(Btn, { variant: view==='completed' ? 'primary' : 'secondary', size:'sm', onClick:function(){ setView('completed'); } },
      t('ops_completed_tasks')),
    h(Btn, { variant:'primary', onClick:function(){ setForm({}); } }, '+ '+t('ops_new_task'))
  ));

  /* ── Completed Tasks view ── */
  if (view === 'completed') {
    var completedCols = [
      { key:'task_no', label:t('ops_task_no'), render:function(r){ return h('code',{style:{color:T.accent,fontWeight:700}},r.task_no); } },
      { key:'customer', label:t('customer'), render:function(r){ return r.customer_company||r.customer_name||'—'; } },
      { key:'deadline', label:t('deadline'), render:function(r){
        if (!r.deadline) return '—';
        return fmtDate(r.deadline, lang);
      }},
      { key:'time', label:t('ops_time'), render:function(r){ return r.time||'—'; } },
      { key:'completed_at', label:t('ops_completed_at'), render:function(r){ return r.completed_at ? fmtDateTime(r.completed_at, lang) : '—'; } },
      { key:'status', label:t('status'), render:function(r){
        if (!r.deadline || !r.completed_at) return '—';
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
            if (!confirm(lang==='en'?'Reopen this task?':'إعادة فتح هذه المهمة؟')) return;
            apiFetch('ops-tasks/'+r.id+'/reopen',{method:'POST'}).then(function(){ loadCompleted(); loadTasks(); });
          }
        }, t('ops_reopen')); }
      })
    );
  }

  /* ── Kanban view ── */
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

    /* Department flow rule: skip next dept if task has no linked_order_id AND next dept name contains 'طباع' or 'print' */
    /* Note: The rule checks by name heuristic — exact dept marked as Production in app context */
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
      /* Already at last stage — show modal */
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
    var name = prompt(lang==='en' ? 'Stage name:' : 'اسم المرحلة:');
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
            h('div', { style:{ fontSize:32, marginBottom:10 } }, '📋'),
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
        h('div', { style:{ fontSize:36, marginBottom:12 } }, '🏁'),
        h('p', { style:{ color:T.textMid, lineHeight:1.6 } }, t('ops_final_stage_msg'))
      )
    )
  );
}

/* ═══ ROOT APP ═══ */
/* ═══ AUTH HELPERS ═══ */
function getStoredAuth() {
  try {
    var t = localStorage.getItem('cspsr_token');
    var u = localStorage.getItem('cspsr_user');
    var p = localStorage.getItem('cspsr_perms');
    if (t && u) return { token:t, user:JSON.parse(u), permissions:JSON.parse(p||'[]') };
  } catch(e) {}
  return null;
}
function setStoredAuth(token, user, permissions) {
  try {
    localStorage.setItem('cspsr_token', token);
    localStorage.setItem('cspsr_user', JSON.stringify(user));
    localStorage.setItem('cspsr_perms', JSON.stringify(permissions||[]));
  } catch(e) {}
}
function clearStoredAuth() {
  try { localStorage.removeItem('cspsr_token'); localStorage.removeItem('cspsr_user'); localStorage.removeItem('cspsr_perms'); } catch(e) {}
}

/* ═══ LOGIN SCREEN ═══ */
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
      h('div', { style:{ fontSize:36, marginBottom:8 } }, '🎨'),
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

/* ═══ USERS VIEW ═══ */
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
        /* Link to existing employee — only when creating new user */
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

/* ═══ PERMISSIONS MODAL ═══ */
var PERM_SECTIONS = [
  { key:'orders',          perms:['view','create','edit','delete'] },
  { key:'customers',       perms:['view','create','edit','delete'] },
  { key:'products',        perms:['view','create','edit','delete'] },
  { key:'employees',       perms:['view','create','edit','delete'] },
  { key:'kds',             perms:['view'] },
  { key:'delivery_orders', perms:['view'] },
  { key:'reports',         perms:['view'] },
  { key:'settings',        perms:['view','edit'] },
  { key:'users',           perms:['view','create','edit','delete'] },
];

function PermissionsModal(props) {
  var i18n = useI18n(); var t = i18n.t; var lang = i18n.lang;
  var user = props.user;
  var _perms = useState(null); var perms = _perms[0], setPerms = _perms[1];
  var _saving = useState(false); var saving = _saving[0], setSaving = _saving[1];

  useEffect(function(){
    apiFetch('app-users/'+user.id+'/permissions')
      .then(function(d){ setPerms(Array.isArray(d)?d:[]); })
      .catch(function(){ setPerms([]); });
  }, [user.id]);

  function toggle(key) {
    setPerms(function(prev){
      if (!prev) return [key];
      var idx = prev.indexOf(key);
      if (idx >= 0) { var n=[].concat(prev); n.splice(idx,1); return n; }
      return prev.concat([key]);
    });
  }

  function toggleSection(sectionKey) {
    var sectionPerms = PERM_SECTIONS.find(function(s){return s.key===sectionKey;}).perms.map(function(p){return sectionKey+'.'+p;});
    var allOn = sectionPerms.every(function(k){ return perms && perms.indexOf(k)>=0; });
    setPerms(function(prev){
      var next = (prev||[]).filter(function(k){ return sectionPerms.indexOf(k)<0; });
      if (!allOn) next = next.concat(sectionPerms);
      return next;
    });
  }

  function toggleStep(stepName) {
    var key = 'steps.'+stepName;
    toggle(key);
  }

  function save() {
    setSaving(true);
    apiFetch('app-users/'+user.id+'/permissions', { method:'POST', body:JSON.stringify({ permissions: perms||[] }) })
      .then(function(){ setSaving(false); props.onClose(); })
      .catch(function(){ setSaving(false); });
  }

  var isAdmin = user.role === 'admin';

  return h(Modal, {
    title: '🔐 '+t('perm_title')+': '+user.name,
    onClose: props.onClose, width: 600,
    footer: h('div',{style:{display:'flex',gap:8}},
      h(Btn,{variant:'secondary',onClick:props.onClose},t('cancel')),
      h(Btn,{onClick:save},saving?h(Spinner):t('perm_save'))
    )
  },
    isAdmin
      ? h('div',{style:{padding:'20px',textAlign:'center',color:T.green,fontWeight:600}},'✅ '+t('perm_admin_full'))
      : !perms
        ? h('div',{style:{textAlign:'center',padding:20}},h(Spinner))
        : h('div',{style:{display:'flex',flexDirection:'column',gap:16}},

          /* Section permissions */
          h('div',null,
            h('div',{style:{fontWeight:700,fontSize:13,color:T.textMute,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}},t('perm_sections')),
            PERM_SECTIONS.map(function(sec){
              var sectionPerms = sec.perms.map(function(p){return sec.key+'.'+p;});
              var allOn = sectionPerms.every(function(k){ return perms.indexOf(k)>=0; });
              return h('div',{key:sec.key,style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 16px',marginBottom:6}},
                h('div',{style:{display:'flex',alignItems:'center',gap:12,marginBottom:sec.perms.length>1?8:0}},
                  h('input',{type:'checkbox',checked:allOn,onChange:function(){toggleSection(sec.key);},style:{width:16,height:16,cursor:'pointer',accentColor:T.accent}}),
                  h('span',{style:{fontWeight:600,fontSize:13,color:T.text}},t('perm_'+sec.key))
                ),
                sec.perms.length > 1 && h('div',{style:{display:'flex',gap:16,paddingRight:28}},
                  sec.perms.map(function(p){
                    var key = sec.key+'.'+p;
                    var on = perms.indexOf(key)>=0;
                    return h('label',{key:p,style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:T.textMid}},
                      h('input',{type:'checkbox',checked:on,onChange:function(){toggle(key);},style:{accentColor:T.accent}}),
                      t('perm_'+p)||p
                    );
                  })
                )
              );
            })
          ),

          /* Step permissions */
          props.allStepNames && props.allStepNames.length > 0 && h('div',null,
            h('div',{style:{fontWeight:700,fontSize:13,color:T.textMute,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}},t('perm_steps')),
            h('div',{style:{background:T.bgSub,borderRadius:T.radius,padding:'12px 16px'}},
              h('div',{style:{display:'flex',flexWrap:'wrap',gap:10}},
                props.allStepNames.map(function(name){
                  var key = 'steps.'+name;
                  var on = perms.indexOf(key)>=0;
                  return h('label',{key:name,style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,
                    background:on?'rgba(99,91,255,.12)':T.bg,
                    border:'1px solid '+(on?T.accent:T.border),
                    borderRadius:T.radius,padding:'6px 12px',color:on?T.accent:T.textMid,fontWeight:on?600:400,transition:'all .15s'}},
                    h('input',{type:'checkbox',checked:on,onChange:function(){toggleStep(name);},style:{display:'none'}}),
                    on?'✓ ':' ',name
                  );
                })
              )
            )
          )
        )
  );
}

/* ═══ AVATAR MODAL ═══ */
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

  // ── PRESET REASONS — كل أسباب التوقف لمعدات المطبعة ──────────────────────
  var PRESET_REASONS = [
    // ── XEROX VERSANT 180 ──
    {ar:'ورقة مسحوبة',en:'Paper Jam',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'خطأ في وحدة الـ Fuser',en:'Fuser Unit Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'نفاد التونر',en:'Toner Empty',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'تحذير تونر منخفض',en:'Low Toner Warning',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'خطأ في وحدة النقل IBT',en:'IBT Belt Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'مشكلة في تغذية الورق',en:'Paper Feed Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'ارتفاع درجة الحرارة',en:'Overheat Shutdown',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'رمز عطل في الشاشة',en:'Error Code on Screen',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'صيانة دورية مجدولة',en:'Scheduled Maintenance',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'استبدال وحدة الصور Drum',en:'Drum Unit Replacement',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'ضبط الألوان كاليبريشن',en:'Color Calibration',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'تنظيف المسارات الداخلية',en:'Internal Path Cleaning',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'مشكلة في الستيبلر الداخلي',en:'Internal Stapler Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'مشكلة في الـ Finisher',en:'Finisher Unit Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'خطأ في وحدة الثني',en:'Fold Unit Error',machine:'Xerox Versant 180',step:'طباعة'},
    {ar:'توقف مفاجئ بدون رمز',en:'Unexpected Shutdown',machine:'Xerox Versant 180',step:'طباعة'},
    // ── CANON C650i ──
    {ar:'ورقة مسحوبة',en:'Paper Jam',machine:'Canon C650i',step:'طباعة'},
    {ar:'خطأ في وحدة الـ Fuser',en:'Fuser Error',machine:'Canon C650i',step:'طباعة'},
    {ar:'نفاد الحبر CMYK',en:'Ink Cartridge Empty (CMYK)',machine:'Canon C650i',step:'طباعة'},
    {ar:'نفاد حبر Waste Toner',en:'Waste Toner Box Full',machine:'Canon C650i',step:'طباعة'},
    {ar:'مشكلة في الدرج',en:'Tray Feed Error',machine:'Canon C650i',step:'طباعة'},
    {ar:'خطأ في وحدة الطبل Drum',en:'Drum Unit Error',machine:'Canon C650i',step:'طباعة'},
    {ar:'رمز عطل',en:'Error Code',machine:'Canon C650i',step:'طباعة'},
    {ar:'صيانة دورية',en:'Periodic Maintenance',machine:'Canon C650i',step:'طباعة'},
    {ar:'ضبط كثافة الألوان',en:'Color Density Calibration',machine:'Canon C650i',step:'طباعة'},
    {ar:'مشكلة في الـ Finisher',en:'Finisher Unit Error',machine:'Canon C650i',step:'طباعة'},
    {ar:'تنظيف رأس الطباعة',en:'Print Head Cleaning',machine:'Canon C650i',step:'طباعة'},
    {ar:'توقف مفاجئ بدون رمز',en:'Unexpected Shutdown',machine:'Canon C650i',step:'طباعة'},
    {ar:'مشكلة في الـ Stapler الخارجي',en:'External Stapler Error',machine:'Canon C650i',step:'طباعة'},
    // ── CANON 5550i ──
    {ar:'ورقة مسحوبة',en:'Paper Jam',machine:'Canon 5550i',step:'طباعة'},
    {ar:'خطأ في وحدة الـ Fuser',en:'Fuser Error',machine:'Canon 5550i',step:'طباعة'},
    {ar:'نفاد الحبر CMYK',en:'Ink Empty (CMYK)',machine:'Canon 5550i',step:'طباعة'},
    {ar:'نفاد حبر Waste Toner',en:'Waste Toner Full',machine:'Canon 5550i',step:'طباعة'},
    {ar:'مشكلة في الدرج',en:'Tray Feed Error',machine:'Canon 5550i',step:'طباعة'},
    {ar:'رمز عطل',en:'Error Code',machine:'Canon 5550i',step:'طباعة'},
    {ar:'صيانة دورية',en:'Periodic Maintenance',machine:'Canon 5550i',step:'طباعة'},
    {ar:'توقف مفاجئ بدون رمز',en:'Unexpected Shutdown',machine:'Canon 5550i',step:'طباعة'},
    // ── EVLOIS / EPSON L805 ──
    {ar:'انسداد رأس الطباعة',en:'Printhead Clog',machine:'Epson L805',step:'طباعة'},
    {ar:'نفاد الحبر - أي لون',en:'Ink Empty (any color)',machine:'Epson L805',step:'طباعة'},
    {ar:'ورقة مسحوبة أو منحرفة',en:'Paper Jam / Skew',machine:'Epson L805',step:'طباعة'},
    {ar:'تسرب حبر داخلي',en:'Ink Leak',machine:'Epson L805',step:'طباعة'},
    {ar:'خطأ في الـ Encoder Strip',en:'Encoder Strip Error',machine:'Epson L805',step:'طباعة'},
    {ar:'انتهاء عمر Waste Ink Pad',en:'Waste Ink Pad Full',machine:'Epson L805',step:'طباعة'},
    {ar:'مشكلة في محرك الكارتريدج',en:'Cartridge Motor Error',machine:'Epson L805',step:'طباعة'},
    {ar:'ضبط المحاذاة',en:'Alignment Calibration',machine:'Epson L805',step:'طباعة'},
    {ar:'تنظيف رأس الطباعة',en:'Head Cleaning Cycle',machine:'Epson L805',step:'طباعة'},
    // ── FLAT HEATING PRESS FREESUB ──
    {ar:'عدم وصول الحرارة للدرجة المطلوبة',en:'Not Reaching Target Temp',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'تذبذب في درجة الحرارة',en:'Temperature Fluctuation',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'تلف في عنصر التسخين',en:'Heating Element Damaged',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'مشكلة في الضغط',en:'Pressure Issue',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'تلف في السيليكون الواقي',en:'Silicone Pad Damaged',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'نفاد ورق التفلون',en:'Teflon Sheet Worn Out',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'خطأ في الـ Timer',en:'Timer Error',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'انحراف المنتج أثناء الضغط',en:'Product Misalignment During Press',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    {ar:'نفاد ورق التحويل Transfer Paper',en:'Transfer Paper Out of Stock',machine:'Flat Heat Press Freesub',step:'تشطيب'},
    // ── 3D HEATING PRESS FREESUB ──
    {ar:'عدم وصول الحرارة للدرجة المطلوبة',en:'Not Reaching Target Temp',machine:'3D Heat Press Freesub',step:'تشطيب'},
    {ar:'تلف في عنصر التسخين',en:'Heating Element Damaged',machine:'3D Heat Press Freesub',step:'تشطيب'},
    {ar:'مشكلة في القالب الخارجي',en:'Outer Mold Issue',machine:'3D Heat Press Freesub',step:'تشطيب'},
    {ar:'تذبذب في درجة الحرارة',en:'Temperature Fluctuation',machine:'3D Heat Press Freesub',step:'تشطيب'},
    {ar:'نفاد منتجات التسبليميشن',en:'Sublimation Blanks Empty',machine:'3D Heat Press Freesub',step:'تشطيب'},
    {ar:'نفاد ورق التحويل',en:'Transfer Paper Out of Stock',machine:'3D Heat Press Freesub',step:'تشطيب'},
    // ── HAT HEATING PRESS FREESUB ──
    {ar:'عدم وصول الحرارة للدرجة المطلوبة',en:'Not Reaching Target Temp',machine:'Hat Heat Press Freesub',step:'تشطيب'},
    {ar:'تلف في عنصر التسخين',en:'Heating Element Damaged',machine:'Hat Heat Press Freesub',step:'تشطيب'},
    {ar:'مشكلة في قالب الكاب',en:'Hat Mold Issue',machine:'Hat Heat Press Freesub',step:'تشطيب'},
    {ar:'انحراف الطباعة على الكاب',en:'Print Misalignment on Hat',machine:'Hat Heat Press Freesub',step:'تشطيب'},
    {ar:'نفاد ورق التحويل',en:'Transfer Paper Out of Stock',machine:'Hat Heat Press Freesub',step:'تشطيب'},
    // ── BOOKLET STAPLE YALE ──
    {ar:'نفاد الدباسة ستيبل',en:'Staples Empty',machine:'Booklet Stapler Yale',step:'تشطيب'},
    {ar:'ورق مسحوب جام',en:'Paper Jam',machine:'Booklet Stapler Yale',step:'تشطيب'},
    {ar:'عدم محاذاة الورق',en:'Paper Misalignment',machine:'Booklet Stapler Yale',step:'تشطيب'},
    {ar:'مشكلة في وحدة الطي',en:'Folding Unit Error',machine:'Booklet Stapler Yale',step:'تشطيب'},
    {ar:'ضبط مقاس الكتيب',en:'Booklet Size Adjustment',machine:'Booklet Stapler Yale',step:'تشطيب'},
    {ar:'تلف في إبرة الدباسة',en:'Staple Needle Damaged',machine:'Booklet Stapler Yale',step:'تشطيب'},
    // ── TRIMMING MACHINE ──
    {ar:'تبلد الشفرة',en:'Blade Worn Out',machine:'Trimming Machine',step:'قطع'},
    {ar:'انزياح المقاس',en:'Size Drift',machine:'Trimming Machine',step:'قطع'},
    {ar:'ورق عالق في الشفرة',en:'Paper Stuck in Blade',machine:'Trimming Machine',step:'قطع'},
    {ar:'ضبط الـ Back Gauge',en:'Back Gauge Adjustment',machine:'Trimming Machine',step:'قطع'},
    {ar:'تغيير الشفرة',en:'Blade Replacement',machine:'Trimming Machine',step:'قطع'},
    {ar:'مشكلة في الضاغط الهوائي',en:'Air Clamp Issue',machine:'Trimming Machine',step:'قطع'},
    {ar:'انحراف القطع عن المقاس',en:'Cut Size Off',machine:'Trimming Machine',step:'قطع'},
    // ── BINDING MACHINE ──
    {ar:'مشكلة في الغراء الحراري',en:'Hot Glue Issue',machine:'Binding Machine',step:'تجليد'},
    {ar:'الغراء لم يصل للحرارة المطلوبة',en:'Glue Not Heated',machine:'Binding Machine',step:'تجليد'},
    {ar:'نفاد الغراء',en:'Glue Empty',machine:'Binding Machine',step:'تجليد'},
    {ar:'انزياح الورق عند التجليد',en:'Paper Shift During Binding',machine:'Binding Machine',step:'تجليد'},
    {ar:'تلف في حامل الكتاب',en:'Book Clamp Damaged',machine:'Binding Machine',step:'تجليد'},
    {ar:'عدم التصاق الغلاف',en:'Cover Not Adhering',machine:'Binding Machine',step:'تجليد'},
    {ar:'خطأ في محاذاة الكتاب',en:'Book Misalignment',machine:'Binding Machine',step:'تجليد'},
    // ── SPIRAL PUNCHING / MANUAL ──
    {ar:'تبلد سكاكين الثقب',en:'Punch Dies Worn Out',machine:'Spiral Punching Machine',step:'تشطيب'},
    {ar:'انحراف الثقوب عن المحاذاة',en:'Hole Misalignment',machine:'Spiral Punching Machine',step:'تشطيب'},
    {ar:'تعطل محرك الثقب',en:'Punch Motor Error',machine:'Spiral Punching Machine',step:'تشطيب'},
    {ar:'نفاد السبيرال',en:'Spiral Out of Stock',machine:'Spiral Punching Machine',step:'تشطيب'},
    {ar:'مشكلة في إدخال السبيرال',en:'Spiral Insertion Issue',machine:'Spiral Punching Machine',step:'تشطيب'},
    {ar:'ورق عالق في الثاقبة',en:'Paper Stuck in Puncher',machine:'Spiral Punching Machine',step:'تشطيب'},
    // ── ROUNDED CORNER PRESS ──
    {ar:'تبلد شفرة الزاوية',en:'Corner Die Worn Out',machine:'Rounded Corner Press',step:'تشطيب'},
    {ar:'انزياح المنتج',en:'Product Misalignment',machine:'Rounded Corner Press',step:'تشطيب'},
    {ar:'مشكلة في الضغط',en:'Press Pressure Issue',machine:'Rounded Corner Press',step:'تشطيب'},
    {ar:'تغيير قالب القص',en:'Die Change Required',machine:'Rounded Corner Press',step:'تشطيب'},
    // ── CIRCLE PRESS 5x5 ──
    {ar:'تبلد شفرة الدائرة',en:'Circle Die Worn Out',machine:'Circle Press 5x5',step:'تشطيب'},
    {ar:'انزياح المنتج',en:'Product Misalignment',machine:'Circle Press 5x5',step:'تشطيب'},
    {ar:'مشكلة في الضغط',en:'Press Pressure Issue',machine:'Circle Press 5x5',step:'تشطيب'},
    {ar:'تغيير قالب القص',en:'Die Change Required',machine:'Circle Press 5x5',step:'تشطيب'},
    // ── UV / CAMEO 3 ──
    {ar:'تبلد شفرة القطع',en:'Cutting Blade Worn',machine:'Cameo 3',step:'قطع'},
    {ar:'انزياح المسجل Registration',en:'Registration Offset',machine:'Cameo 3',step:'قطع'},
    {ar:'مشكلة في تغذية الورق أو الفينيل',en:'Media Feed Error',machine:'Cameo 3',step:'قطع'},
    {ar:'خطأ في الـ Mat',en:'Mat Worn / Dirty',machine:'Cameo 3',step:'قطع'},
    {ar:'تلف رأس القطع',en:'Cutting Head Damaged',machine:'Cameo 3',step:'قطع'},
    {ar:'مشكلة في الاتصال USB',en:'USB Connection Error',machine:'Cameo 3',step:'قطع'},
    {ar:'ضبط قوة القطع',en:'Cut Force Calibration',machine:'Cameo 3',step:'قطع'},
    {ar:'الملف لا يُقرأ في Silhouette Studio',en:'File Read Error in Studio',machine:'Cameo 3',step:'قطع'},
    // ── UPS ──
    {ar:'انقطاع التيار الكهربائي',en:'Power Outage',machine:'UPS',step:''},
    {ar:'تحذير بطارية UPS منخفضة',en:'UPS Battery Low',machine:'UPS',step:''},
    {ar:'تلف بطارية UPS',en:'UPS Battery Failure',machine:'UPS',step:''},
    {ar:'تذبذب في الجهد الكهربائي',en:'Voltage Fluctuation',machine:'UPS',step:''},
    {ar:'تجاوز الحمل على UPS',en:'UPS Overload',machine:'UPS',step:''},
    // ── SERVER / NETWORK ──
    {ar:'مشكلة في RIP Server',en:'RIP Server Error',machine:'Server Dell',step:''},
    {ar:'الشبكة منقطعة',en:'Network Down',machine:'Server Dell',step:''},
    {ar:'الجهاز يعيد التشغيل',en:'System Restart',machine:'Server Dell',step:''},
    {ar:'مساحة التخزين ممتلئة',en:'Storage Full',machine:'Server Dell',step:''},
    {ar:'مشكلة في استقبال الملفات',en:'File Receiving Error',machine:'Server Dell',step:''},
    // ── مواد أولية ──
    {ar:'نفاد الورق',en:'Paper Out of Stock',machine:'',step:'طباعة'},
    {ar:'ورق غير مطابق للمواصفات',en:'Wrong Paper Spec',machine:'',step:'طباعة'},
    {ar:'ورق رطب أو تالف',en:'Wet / Damaged Paper',machine:'',step:'طباعة'},
    {ar:'انتظار توريد الورق',en:'Waiting for Paper Delivery',machine:'',step:'طباعة'},
    {ar:'نفاد فيلم اللامينيشن',en:'Lamination Film Empty',machine:'',step:'لامينيشن'},
    {ar:'فيلم لا يلتصق بشكل صحيح',en:'Film Not Adhering',machine:'',step:'لامينيشن'},
    {ar:'نفاد ورق التحويل الحراري',en:'Transfer Paper Empty',machine:'',step:'تشطيب'},
    {ar:'نفاد منتجات التسبليميشن',en:'Sublimation Blanks Empty',machine:'',step:'تشطيب'},
    {ar:'نفاد الغراء الحراري',en:'Hot Glue Empty',machine:'',step:'تجليد'},
    {ar:'نفاد السبيرال',en:'Spiral Empty',machine:'',step:'تشطيب'},
    {ar:'نفاد الدباسة',en:'Staples Empty',machine:'',step:'تشطيب'},
    // ── أسباب تشغيلية ──
    {ar:'انتظار موافقة بروف من العميل',en:'Waiting for Client Proof Approval',machine:'',step:''},
    {ar:'مشكلة في ملف التصميم',en:'Design File Issue',machine:'',step:''},
    {ar:'إعادة طباعة بسبب خطأ في اللون',en:'Reprint — Color Error',machine:'',step:'طباعة'},
    {ar:'إعادة طباعة بسبب خطأ في القص',en:'Reprint — Cutting Error',machine:'',step:'قطع'},
    {ar:'انتظار قسم آخر',en:'Waiting for Another Department',machine:'',step:''},
    {ar:'غياب موظف مسؤول',en:'Staff Absence',machine:'',step:''},
    {ar:'توقف غير مبرر',en:'Unexplained Stoppage',machine:'',step:''},
  ];

  useTopbar(lang==='en'?'Settings':'الإعدادات');

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
    /* ── Tab bar ── */
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

    /* ══ Tab: Pause Reasons ══ */
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
          : 'هذه الأسباب تظهر عند إيقاف خطوة أو تسجيل سبب تأخير. يمكن تحديد الماكنة والخطوة لكل سبب.'
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
        h('span',{style:{fontSize:11,color:T.textMute,fontWeight:600}}, lang==='en'?'Machine':'الماكنة'),
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
                h('button', { onClick:function(){ removeReason(r._id); }, style:{ padding:'6px 11px', borderRadius:T.radius, border:'none', background:'#fee2e2', color:T.red, cursor:'pointer', fontWeight:700, fontSize:13 } }, '×')
              );
            })
          ),
      /* Add new reason */
      h('div', { style:{ borderTop:'1px solid '+T.border, paddingTop:16 } },
        h('div',{style:{fontSize:12,fontWeight:600,color:T.textMute,marginBottom:8}}, lang==='en'?'Add new reason:':'إضافة سبب جديد:'),
        h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, alignItems:'flex-end' } },
          h(Input, { label:lang==='en'?'Arabic':'العربي', value:newAr, onChange:setNewAr, placeholder:'سبب الإيقاف...' }),
          h(Input, { label:lang==='en'?'English':'الإنجليزي', value:newEn, onChange:setNewEn, placeholder:'Pause reason...' }),
          h(Input, { label:lang==='en'?'Machine (optional)':'الماكنة (اختياري)', value:newMachine, onChange:setNewMachine }),
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

    /* ══ Tab: Production Display ══ */
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


function AppInner(props) {
  var bs = props.bs;
  var i18n = useI18n(); var t = i18n.t;
  var authUser = props.authUser || {};
  var isDeliveryOnly = authUser.role !== 'admin' && (function(){
    var perms = (bs.data && bs.data.user_permissions) || [];
    var hasDelivery = perms.indexOf('delivery_orders.view') >= 0;
    var hasOther = ['orders.view','customers.view','products.view','kds.view','reports.view'].some(function(p){ return perms.indexOf(p) >= 0; });
    return hasDelivery && !hasOther;
  })();
  var _tab = useState(isDeliveryOnly ? 'delivery-orders' : 'dashboard'); var tab = _tab[0], setTab = _tab[1];
  var _showAvatar = useState(false); var showAvatar = _showAvatar[0], setShowAvatar = _showAvatar[1];
  var _q = useState(''); var searchQ = _q[0], setSearchQ = _q[1];
  var _meta = useState({subtitle:'',action:null}); var topbarMeta = _meta[0], setTopbarMeta = _meta[1];

  function setMeta(m) { setTopbarMeta(function(prev){ return Object.assign({},prev,m); }); }

  /* clear search when tab changes */
  useEffect(function(){ setSearchQ(''); }, [tab]);

  /* Page meta: title + search placeholder per tab */
  var PAGE_META = {
    'dashboard':       { title: t('dashboard'),        search: false },
    'orders':          { title: t('orders'),            placeholder: t('search')+'...' },
    'completed-orders':{ title: t('completed_orders'),  placeholder: t('search')+'...' },
    'customers':       { title: t('customers'),         placeholder: t('search')+'...' },
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
    'settings':        { title: i18n.lang==='en'?'Settings':'الإعدادات', search: false },
    'ops-tasks':       { title: t('operations_tasks'),   search: false },
  };
  var meta = PAGE_META[tab] || { title: tab };
  var showTopSearch = meta.search !== false;

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
    h(SearchCtx.Provider, { value:{ q:searchQ, setQ:setSearchQ, placeholder: meta.placeholder||'' } },
    h(AppLayout, null,
    h(Sidebar, { tab:tab, setTab:setTab, branding:props.branding, authUser:props.authUser, onLogout:props.onLogout }),
    h('main', { dir: i18n.isRtl ? 'rtl' : 'ltr', style:{ flex:1, overflowY:'auto', height:'100vh', display:'flex', flexDirection:'column' } },
      /* ── Topbar: 3-column grid — title | search | actions ── */
      h('div', { dir: i18n.isRtl?'rtl':'ltr', style:{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:0, padding:'0 20px', borderBottom:'1px solid '+T.border, background:T.bg, height:56, flexShrink:0, position:'sticky', top:0, zIndex:100 } },
        /* Col 1: Page title — always at logical start */
        h('div', { style:{ minWidth:0 } },
          h('div', { style:{ fontWeight:700, fontSize:15, color:T.text, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, meta.title),
          topbarMeta.subtitle && h('div', { style:{ fontSize:11, color:T.textMute, marginTop:1 } }, topbarMeta.subtitle)
        ),
        /* Col 2: Search — always centered, fixed width */
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
        /* Col 3: Action + User + Lang + Logout — always at logical end */
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
          h('button', { onClick:function(){ i18n.setLang(i18n.lang==='ar'?'en':'ar'); }, style:{ padding:'5px 10px', border:'1px solid '+T.border, borderRadius:T.radius, background:'transparent', color:T.textMute, cursor:'pointer', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0 } },
            h('span',null,'🌐'), h('span',null, i18n.lang==='ar'?'EN':'عربي')
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

function App() {
  var rootEl = document.getElementById('cspsr-root');
  var mode = (rootEl && rootEl.dataset && rootEl.dataset.mode) ? rootEl.dataset.mode : 'app';
  var _br  = useState(null); var branding = _br[0], setBranding = _br[1];
  var _sc  = useState(false); var setupChecked = _sc[0], setSetupChecked = _sc[1];
  var _sd  = useState(false); var setupDone = _sd[0], setSetupDone = _sd[1];
  var bs   = useBootstrap();

  /* ── Auth state ── */
  var _stored = getStoredAuth();
  var _au = useState(_stored ? _stored.user : null); var authUser = _au[0], setAuthUser = _au[1];
  var _ap = useState(_stored ? _stored.permissions : []); var authPerms = _ap[0], setAuthPerms = _ap[1];

  useEffect(function(){
    apiFetch('setup').then(function(s){ setBranding(s); setSetupDone(!!s.is_setup_done); setSetupChecked(true); }).catch(function(){ setSetupChecked(true); });
  }, []);

  var lang = cfg().lang || 'ar';

  if (!setupChecked) return h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bgSub,gap:12,color:T.textMute,fontSize:14}},h(Spinner));

  if (!setupDone) return h(I18nProvider, {initialLang:lang}, h(LangRemount, null, h(SetupWizard, {onComplete:function(b){ setBranding(b); setSetupDone(true); }})));

  if (mode==='kds') return h(I18nProvider,{initialLang:lang},h(LangRemount,null,h(ErrorBoundary,null,h(KDSView,{bootstrap:bs.data,onReload:bs.reload,onSilentReload:bs.silentReload,pauseReasons:(branding&&branding.pause_reasons)||[],carouselInterval:(branding&&branding.kds_carousel_interval)||8}))));

  /* ── Not logged in → show login screen ── */
  if (!authUser) return h(I18nProvider,{initialLang:lang},
    h(LangRemount,null,h(LoginScreen, { onLogin:function(user, perms){ setAuthUser(user); setAuthPerms(perms||[]); } }))
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
    h(LangRemount, null,
      h(ErrorBoundary, null,
        h(DebugBar, { cfgLang: lang }),
        h(AppInner, { bs:bs, branding:branding, authUser:authUser, onLogout:doLogout, onAvatarUpdate:onAvatarUpdate, onBrandingUpdate:function(b){ setBranding(b); } })
      )
    )
  );
}

/* ═══ DEBUG BAR ═══ */
function DebugBar(props) {
  var i18n = useI18n();
  var lsLang = '?';
  try { lsLang = localStorage.getItem('cspsr_lang') || '(null)'; } catch(e) { lsLang = 'ERROR'; }
  var cfgLang = props.cfgLang || '?';
  var contextLang = i18n.lang;
  var _v = useState(false); var visible = _v[0], setVisible = _v[1];

  return h('div', { style:{ position:'fixed', bottom:0, left:0, right:0, zIndex:99999, fontFamily:'monospace', fontSize:12 } },
    h('div', { onClick:function(){ setVisible(!visible); }, style:{ background:'#1e1e2e', color:'#cdd6f4', padding:'4px 12px', cursor:'pointer', display:'flex', gap:16, alignItems:'center', borderTop:'2px solid #89b4fa' } },
      h('span', { style:{ color:'#89b4fa', fontWeight:700 } }, '🐛 DEBUG'),
      h('span', null, 'context lang: ', h('b', { style:{ color: contextLang==='en' ? '#a6e3a1' : '#f38ba8' } }, contextLang)),
      h('span', null, 'localStorage: ', h('b', { style:{ color: lsLang==='en' ? '#a6e3a1' : '#f38ba8' } }, lsLang)),
      h('span', null, 'cfg().lang: ', h('b', { style:{ color: cfgLang==='en' ? '#a6e3a1' : '#f38ba8' } }, cfgLang)),
      h('span', null, '_currentLang: ', h('b', { style:{ color: getLang()==='en' ? '#a6e3a1' : '#f38ba8' } }, getLang())),
      h('span', { style:{ color:'#6c7086', marginLeft:'auto' } }, visible ? '▲ hide' : '▼ details')
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
          }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, '🗑 Delete Completed'),
          h('button', { onClick:function(){ i18n.setLang('ar'); }, style:{ padding:'4px 10px', background:'#f38ba8', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Force AR'),
          h('button', { onClick:function(){ try { localStorage.removeItem('cspsr_lang'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#fab387', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Clear LS + Reload'),
          h('button', { onClick:function(){ try { localStorage.setItem('cspsr_lang','en'); } catch(e){} window.location.reload(); }, style:{ padding:'4px 10px', background:'#89b4fa', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, 'Set EN + Reload'),
          h('button', { onClick:function(){
            if (!confirm('Sync expected_hours from product steps to all orders?\n\nThis will update any step with 0 hours.')) return;
            apiFetch('admin/fix-expected-hours', {method:'POST'})
              .then(function(r){ alert('✅ Done!\nUpdated steps: '+r.updated_steps+'\nChecked: '+r.total_checked+'\n\nReloading...'); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#f9e2af', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, '🔧 Fix Expected Hours'),
          h('button', { onClick:function(){
            if (!confirm('Delete status with sort_order=5 and migrate orders to sort_order=3?')) return;
            apiFetch('admin/fix-status-5', {method:'POST'})
              .then(function(r){ alert('✅ Done!\nDeleted: '+r.deleted_slug+'\nMigrated to: '+r.migrated_to+'\nOrders updated: '+r.orders_updated); window.location.reload(); })
              .catch(function(e){ alert('Error: '+e.message); });
          }, style:{ padding:'4px 10px', background:'#cba6f7', color:'#1e1e2e', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 } }, '🔧 Fix Status 5')
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
              return s.step_name+' → ids:'+JSON.stringify(s.assigned_employee_ids);
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

/* ═══ APP ROOT ═══ */
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
