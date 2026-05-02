<?php
defined('ABSPATH') || exit;

class CSPSR_Auth {

    const APP_COOKIE = 'cspsr_app_token';

    private static function tbl($n) {
        global $wpdb; return $wpdb->prefix . 'cspsr_' . $n;
    }
    private static function ok($d)  { return new WP_REST_Response($d, 200); }
    private static function err($m, $c=400) { return new WP_Error('cspsr_auth', $m, ['status'=>$c]); }
    private static function current_ip() {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? '');
        return sanitize_text_field((string) $ip);
    }
    private static function login_rate_key($username) {
        return 'cspsr_login_' . md5(strtolower((string) $username) . '|' . self::current_ip());
    }
    private static function login_is_rate_limited($username) {
        $state = get_transient(self::login_rate_key($username));
        if (!is_array($state)) return false;
        return (int) ($state['fails'] ?? 0) >= 8;
    }
    private static function login_register_failure($username) {
        $key = self::login_rate_key($username);
        $state = get_transient($key);
        if (!is_array($state)) $state = ['fails' => 0];
        $state['fails'] = (int) ($state['fails'] ?? 0) + 1;
        set_transient($key, $state, 15 * MINUTE_IN_SECONDS);
    }
    private static function login_clear_failures($username) {
        delete_transient(self::login_rate_key($username));
    }
    private static function same_origin_request() {
        $site_host = wp_parse_url(home_url(), PHP_URL_HOST);
        if (!$site_host) return false;
        foreach ([(string) ($_SERVER['HTTP_ORIGIN'] ?? ''), (string) ($_SERVER['HTTP_REFERER'] ?? '')] as $value) {
            if (!$value) continue;
            $host = wp_parse_url($value, PHP_URL_HOST);
            if ($host && strcasecmp($host, $site_host) === 0) return true;
        }
        return false;
    }
    public static function verify_write_request(WP_REST_Request $r) {
        $method = strtoupper((string) $r->get_method());
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) return true;
        $nonce = (string) ($r->get_header('x-wp-nonce') ?: $r->get_header('x_cspsr_nonce') ?: '');
        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) return true;
        if (self::same_origin_request()) return true;
        return self::err('Security validation failed', 403);
    }
    public static function public_write_permission(WP_REST_Request $r) {
        return self::verify_write_request($r);
    }
    public static function auth_permission(WP_REST_Request $r) {
        $writeCheck = self::verify_write_request($r);
        if (is_wp_error($writeCheck)) return $writeCheck;
        $user = self::get_user_from_token();
        if (!$user) return self::err('غير مصرح', 401);
        return true;
    }
    public static function admin_permission(WP_REST_Request $r) {
        $auth = self::auth_permission($r);
        if (is_wp_error($auth)) return $auth;
        $user = self::get_user_from_token();
        if (!$user || ($user['role'] ?? '') !== 'admin') return self::err('غير مصرح', 403);
        return true;
    }
    private static function set_auth_cookie($token, $expires) {
        $exp = strtotime((string) $expires);
        if ($exp <= 0) $exp = time() + (30 * DAY_IN_SECONDS);
        setcookie(self::APP_COOKIE, $token, [
            'expires'  => $exp,
            'path'     => '/',
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        $_COOKIE[self::APP_COOKIE] = $token;
    }
    private static function clear_auth_cookie() {
        setcookie(self::APP_COOKIE, '', [
            'expires'  => time() - HOUR_IN_SECONDS,
            'path'     => '/',
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        unset($_COOKIE[self::APP_COOKIE]);
    }

    public static function register_routes() {
        $ns = 'cspsr/v1';
        register_rest_route($ns, '/auth/login',   ['methods'=>'POST','callback'=>[__CLASS__,'login'],   'permission_callback'=>[__CLASS__,'public_write_permission']]);
        register_rest_route($ns, '/auth/logout',  ['methods'=>'POST','callback'=>[__CLASS__,'logout'],  'permission_callback'=>[__CLASS__,'auth_permission']]);
        register_rest_route($ns, '/auth/me',      ['methods'=>'GET', 'callback'=>[__CLASS__,'me'],      'permission_callback'=>[__CLASS__,'auth_permission']]);
        // Sync an HttpOnly auth cookie for browser navigations (e.g. QR print page opened in a new tab).
        register_rest_route($ns, '/auth/sync-cookie', ['methods'=>'POST','callback'=>[__CLASS__,'sync_cookie'], 'permission_callback'=>[__CLASS__,'auth_permission']]);
        register_rest_route($ns, '/app-users',             ['methods'=>'GET', 'callback'=>[__CLASS__,'list_users'],   'permission_callback'=>[__CLASS__,'admin_permission']]);
        register_rest_route($ns, '/app-users',             ['methods'=>'POST','callback'=>[__CLASS__,'create_user'],  'permission_callback'=>[__CLASS__,'admin_permission']]);
        register_rest_route($ns, '/app-users/(?P<id>\d+)', ['methods'=>'PUT', 'callback'=>[__CLASS__,'update_user'],  'permission_callback'=>[__CLASS__,'admin_permission']]);
        register_rest_route($ns, '/app-users/(?P<id>\d+)', ['methods'=>'DELETE','callback'=>[__CLASS__,'delete_user'],'permission_callback'=>[__CLASS__,'admin_permission']]);
        register_rest_route($ns, '/app-users/(?P<id>\d+)/avatar',      ['methods'=>'POST','callback'=>[__CLASS__,'upload_avatar'],   'permission_callback'=>[__CLASS__,'auth_permission']]);
        register_rest_route($ns, '/app-users/(?P<id>\d+)/permissions', ['methods'=>'GET', 'callback'=>[__CLASS__,'get_permissions'],  'permission_callback'=>[__CLASS__,'admin_permission']]);
        register_rest_route($ns, '/app-users/(?P<id>\d+)/permissions', ['methods'=>'POST','callback'=>[__CLASS__,'save_permissions'], 'permission_callback'=>[__CLASS__,'admin_permission']]);
    }

    public static function get_token_from_request() {
        $h = $_SERVER['HTTP_X_CSPSR_TOKEN'] ?? '';
        if (!$h) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) $h = $m[1];
        }
        if (!$h) $h = $_COOKIE[self::APP_COOKIE] ?? '';
        return sanitize_text_field($h);
    }

    public static function get_user_from_token($token = null) {
        global $wpdb;
        if (!$token) $token = self::get_token_from_request();
        if (!$token) return null;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT u.* FROM ".self::tbl('app_users')." u INNER JOIN ".self::tbl('app_tokens')." t ON t.user_id=u.id WHERE t.token=%s AND t.expires_at>NOW() AND u.is_active=1",
            $token
        ), ARRAY_A);
        return $row ?: null;
    }

    private static function fmt_user($u) {
        return ['id'=>$u['id'],'name'=>$u['name'],'username'=>$u['username'],'role'=>$u['role'],'avatar'=>$u['avatar']??null,'employee_id'=>$u['employee_id']??null];
    }

    public static function login(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $username = sanitize_text_field($d['username'] ?? '');
        $password = $d['password'] ?? '';
        if (!$username || !$password) return self::err('Missing credentials');
        if (self::login_is_rate_limited($username)) return self::err('Too many login attempts. Try again later.', 429);
        $user = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('app_users')." WHERE username=%s AND is_active=1", $username), ARRAY_A);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            self::login_register_failure($username);
            return self::err('Invalid username or password', 401);
        }
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
        $wpdb->insert(self::tbl('app_tokens'), ['user_id'=>$user['id'],'token'=>$token,'expires_at'=>$expires]);
        self::login_clear_failures($username);
        self::set_auth_cookie($token, $expires);
        $perms = $wpdb->get_col($wpdb->prepare("SELECT perm_key FROM ".self::tbl('app_permissions')." WHERE user_id=%d", $user['id']));
        return self::ok(['token'=>$token,'expires_at'=>$expires,'user'=>self::fmt_user($user),'permissions'=>$perms]);
    }

    public static function logout(WP_REST_Request $r) {
        global $wpdb;
        $token = self::get_token_from_request();
        if ($token) $wpdb->delete(self::tbl('app_tokens'), ['token'=>$token]);
        self::clear_auth_cookie();
        return self::ok(['logged_out'=>true]);
    }

    public static function me(WP_REST_Request $r) {
        global $wpdb;
        $user = self::get_user_from_token();
        if (!$user) return self::err('غير مصرح', 401);
        $perms = $wpdb->get_col($wpdb->prepare("SELECT perm_key FROM ".self::tbl('app_permissions')." WHERE user_id=%d", $user['id']));
        return self::ok(['user'=>self::fmt_user($user),'permissions'=>$perms]);
    }

    public static function sync_cookie(WP_REST_Request $r) {
        global $wpdb;
        $token = self::get_token_from_request();
        if (!$token) return self::err('Unauthorized', 401);

        $expires = $wpdb->get_var($wpdb->prepare(
            "SELECT expires_at FROM ".self::tbl('app_tokens')." WHERE token=%s AND expires_at>NOW() ORDER BY id DESC LIMIT 1",
            $token
        ));
        if (!$expires) return self::err('Unauthorized', 401);

        self::set_auth_cookie($token, $expires);
        return self::ok(['synced' => true, 'expires_at' => $expires]);
    }

    public static function list_users(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $rows = $wpdb->get_results("SELECT id,name,name_en,username,role,is_active,avatar,employee_id,created_at FROM ".self::tbl('app_users')." ORDER BY id", ARRAY_A);
        return self::ok($rows);
    }

    public static function create_user(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $d = $r->get_json_params();
        if (empty($d['username']) || empty($d['password'])) return self::err('بيانات ناقصة');
        if ($wpdb->get_var($wpdb->prepare("SELECT id FROM ".self::tbl('app_users')." WHERE username=%s", $d['username']))) return self::err('اسم المستخدم مستخدم مسبقاً');
        $name    = sanitize_text_field($d['name'] ?? $d['username']);
        $name_en = sanitize_text_field($d['name_en'] ?? '');
        $role    = in_array($d['role']??'',['admin','user']) ? $d['role'] : 'user';
        $dept_id = !empty($d['department_id']) ? (int)$d['department_id'] : null;

        $link_emp_id = !empty($d['link_employee_id']) ? (int)$d['link_employee_id'] : null;
        if ($link_emp_id) {
            $emp_upd = ['name'=>$name,'name_en'=>$name_en,'is_active'=>1];
            if ($dept_id) $emp_upd['department_id'] = $dept_id;
            $wpdb->update(self::tbl('employees'), $emp_upd, ['id'=>$link_emp_id]);
            $emp_id = $link_emp_id;
        } else {
            $wpdb->insert(self::tbl('employees'), array_filter([
                'name'          => $name,
                'name_en'       => $name_en,
                'is_active'     => 1,
                'department_id' => $dept_id,
            ], function($v){ return $v !== null; }));
            $emp_id = $wpdb->insert_id;
        }
        $wpdb->insert(self::tbl('app_users'), ['name'=>$name,'name_en'=>$name_en,'username'=>sanitize_text_field($d['username']),'password_hash'=>password_hash($d['password'],PASSWORD_BCRYPT),'role'=>$role,'is_active'=>1,'employee_id'=>$emp_id]);
        return self::ok(['id'=>$wpdb->insert_id,'employee_id'=>$emp_id]);
    }

    public static function update_user(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $id = (int)$r['id']; $d = $r->get_json_params(); $upd = [];
        if (!empty($d['name']))     $upd['name']          = sanitize_text_field($d['name']);
        if (isset($d['name_en']))   $upd['name_en']       = sanitize_text_field($d['name_en']);
        if (!empty($d['username'])) $upd['username']      = sanitize_text_field($d['username']);
        if (!empty($d['password'])) $upd['password_hash'] = password_hash($d['password'], PASSWORD_BCRYPT);
        if (isset($d['role']) && in_array($d['role'],['admin','user'])) $upd['role'] = $d['role'];
        if (isset($d['is_active'])) $upd['is_active'] = (int)$d['is_active'];
        if ($upd) {
            $wpdb->update(self::tbl('app_users'), $upd, ['id'=>$id]);
            $emp_id = $wpdb->get_var($wpdb->prepare("SELECT employee_id FROM ".self::tbl('app_users')." WHERE id=%d", $id));
            if ($emp_id) {
                $emp_upd = [];
                if (!empty($upd['name']))       $emp_upd['name']          = $upd['name'];
                if (isset($upd['name_en']))     $emp_upd['name_en']       = $upd['name_en'];
                if (isset($d['department_id'])) $emp_upd['department_id'] = $d['department_id'] ? (int)$d['department_id'] : null;
                if (!empty($upd['is_active']))  $emp_upd['is_active']     = $upd['is_active'];
                if ($emp_upd) $wpdb->update(self::tbl('employees'), $emp_upd, ['id'=>$emp_id]);
            }
        }
        return self::ok(['updated'=>true]);
    }

    public static function delete_user(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $id = (int)$r['id'];
        if ($id === (int)$actor['id']) return self::err('لا يمكن حذف حسابك');
        $emp_id = $wpdb->get_var($wpdb->prepare("SELECT employee_id FROM ".self::tbl('app_users')." WHERE id=%d", $id));
        $wpdb->delete(self::tbl('app_tokens'),      ['user_id'=>$id]);
        $wpdb->delete(self::tbl('app_permissions'), ['user_id'=>$id]);
        $wpdb->delete(self::tbl('app_users'),       ['id'=>$id]);
        if ($emp_id) $wpdb->delete(self::tbl('employees'), ['id'=>(int)$emp_id]);
        return self::ok(['deleted'=>true]);
    }

    public static function upload_avatar(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor) return self::err('غير مصرح', 401);
        $id = (int)$r['id'];
        if ($actor['role'] !== 'admin' && (int)$actor['id'] !== $id) return self::err('غير مصرح', 403);
        $d = $r->get_json_params();
        $avatar = $d['avatar'] ?? '';
        if (!$avatar) return self::err('لا توجد صورة');
        if (!preg_match('/^data:image\/(jpeg|png|gif|webp);base64,/', $avatar)) return self::err('صيغة الصورة غير صحيحة');
        if (strlen($avatar) > 2800000) return self::err('الصورة كبيرة جداً، الحد الأقصى 2MB');
        $wpdb->update(self::tbl('app_users'), ['avatar'=>$avatar], ['id'=>$id]);
        $emp_id = $wpdb->get_var($wpdb->prepare("SELECT employee_id FROM ".self::tbl('app_users')." WHERE id=%d", $id));
        if ($emp_id) $wpdb->update(self::tbl('employees'), ['avatar'=>$avatar], ['id'=>$emp_id]);
        return self::ok(['avatar'=>$avatar]);
    }

    public static function get_permissions(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $id = (int)$r['id'];
        return self::ok($wpdb->get_col($wpdb->prepare("SELECT perm_key FROM ".self::tbl('app_permissions')." WHERE user_id=%d", $id)));
    }

    public static function save_permissions(WP_REST_Request $r) {
        global $wpdb;
        $actor = self::get_user_from_token();
        if (!$actor || $actor['role'] !== 'admin') return self::err('غير مصرح', 403);
        $id = (int)$r['id']; $d = $r->get_json_params();
        $keys = is_array($d['permissions'] ?? null) ? $d['permissions'] : [];
        $wpdb->delete(self::tbl('app_permissions'), ['user_id'=>$id]);
        foreach ($keys as $key) { $key = sanitize_text_field($key); if ($key) $wpdb->insert(self::tbl('app_permissions'), ['user_id'=>$id,'perm_key'=>$key]); }
        return self::ok(['saved'=>true]);
    }
}
