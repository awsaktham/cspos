<?php
defined('ABSPATH') || exit;

class CSPSR_App {

    private static function send_security_headers() {
        nocache_headers();
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }

    private static function current_app_user() {
        if (is_user_logged_in()) return wp_get_current_user();
        if (class_exists('CSPSR_Auth')) return CSPSR_Auth::get_user_from_token();
        return null;
    }

    private static function require_app_auth() {
        if (self::current_app_user()) return true;
        status_header(401);
        wp_die('Login required', 401);
    }

    private static function is_app_request() {
        $page = get_query_var('cspsr_page');
        if (in_array($page, ['app', 'kds', 'delivery'], true)) {
            return true;
        }

        if (is_singular()) {
            $post = get_queried_object();
            if ($post && !empty($post->post_content)) {
                if (has_shortcode($post->post_content, 'cspsr_app') || has_shortcode($post->post_content, 'cspsr_kds')) {
                    return true;
                }
            }
        }

        return false;
    }

    private static function ui_lang() {
        $locale = (string) get_locale();
        return stripos($locale, 'ar') === 0 ? 'ar' : 'en';
    }

    private static function ui_dir() {
        return self::ui_lang() === 'ar' ? 'rtl' : 'ltr';
    }

    public static function init() {
        add_action('init',             [__CLASS__, 'add_rewrite_rules']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
        add_action('admin_menu',       [__CLASS__, 'admin_menu']);
        add_shortcode('cspsr_app',     [__CLASS__, 'shortcode_app']);
        add_shortcode('cspsr_kds',     [__CLASS__, 'shortcode_kds']);
        add_filter('show_admin_bar',   [__CLASS__, 'maybe_hide_admin_bar']);
        add_action('template_redirect',[__CLASS__, 'handle_standalone_pages']);
    }

    public static function maybe_hide_admin_bar($show) {
        if (self::is_app_request()) {
            return false;
        }
        return $show;
    }

    private static function disable_admin_bar_runtime() {
        show_admin_bar(false);
        remove_action('wp_head', '_admin_bar_bump_cb');
        remove_action('wp_body_open', 'wp_admin_bar_render', 0);
        remove_action('wp_footer', 'wp_admin_bar_render', 1000);
    }

    // ── Rewrite rules ─────────────────────────────────────────────────────────
    public static function add_rewrite_rules() {
        add_rewrite_rule('^cspsr-app/?$',            'index.php?cspsr_page=app',      'top');
        add_rewrite_rule('^cspsr-kds/?$',            'index.php?cspsr_page=kds',      'top');
        add_rewrite_rule('^cspsr-delivery/([^/]+)/?$','index.php?cspsr_page=delivery&cspsr_order=$matches[1]','top');
        add_rewrite_tag('%cspsr_page%',   '([^&]+)');
        add_rewrite_tag('%cspsr_order%',  '([^&]+)');
    }

    // ── Enqueue ───────────────────────────────────────────────────────────────
    public static function enqueue_assets() {
        $page = get_query_var('cspsr_page');
        if (!$page && !has_shortcode(get_post_field('post_content', get_the_ID()), 'cspsr_app')) {
            return;
        }

        // Force deregister any previously registered version (clears WP script cache)
        wp_deregister_script('cspsr-app');
        wp_deregister_style('cspsr-app');

        // React & ReactDOM from CDN
        wp_enqueue_script('react',     'https://unpkg.com/react@18/umd/react.production.min.js',     [], '18', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', ['react'], '18', true);

        // App assets — filemtime + version ensures browser always loads latest file.
        // Additionally, route through PHP (?cspsr_asset=...) to bypass aggressive proxy caches that ignore querystrings.
        $v_app = CSPSR_VERSION . '.' . (filemtime(CSPSR_DIR . 'assets/js/app.js')   ?: time());
        $v_css = CSPSR_VERSION . '.' . (filemtime(CSPSR_DIR . 'assets/css/app.css') ?: time());
        $v_qr  = CSPSR_VERSION . '.' . (filemtime(CSPSR_DIR . 'assets/js/qrcode-local.js') ?: time());
        $v_off = CSPSR_VERSION . '.' . (filemtime(CSPSR_DIR . 'assets/js/offline-sync.js') ?: time());

        $asset_base = home_url('/');
        // Use short paths to avoid proxies/WAFs that mishandle slashes in query params.
        $src_qr  = add_query_arg(['cspsr_asset' => 'qrcode-local.js', 'v' => $v_qr], $asset_base);
        $src_off = add_query_arg(['cspsr_asset' => 'offline-sync.js', 'v' => $v_off], $asset_base);
        $src_app = add_query_arg(['cspsr_asset' => 'app.js', 'v' => $v_app], $asset_base);
        $src_css = add_query_arg(['cspsr_asset' => 'app.css', 'v' => $v_css], $asset_base);

        wp_enqueue_script('cspsr-qr',  $src_qr, [], $v_qr, true);
        wp_enqueue_script('cspsr-offline-sync', $src_off, [], $v_off, true);
        wp_register_script('cspsr-app', $src_app, ['react','react-dom','cspsr-qr','cspsr-offline-sync'], $v_app, true);
        wp_enqueue_script('cspsr-app');
        wp_register_style('cspsr-app',  $src_css, [], $v_css);
        wp_enqueue_style('cspsr-app');

        wp_localize_script('cspsr-app', 'CSPSR_CONFIG', [
            'root'     => esc_url_raw(rest_url('cspsr/v1/')),
            'nonce'    => wp_create_nonce('wp_rest'),
            'version'  => CSPSR_VERSION,
            'lang'     => self::ui_lang(),
            'site_url' => get_site_url(),
            'server_now' => current_time('mysql'),
            'server_gmt_offset_minutes' => (int) round(((float) get_option('gmt_offset', 0)) * 60),
            'server_timezone_string' => (string) get_option('timezone_string', ''),
            'offline_enabled' => true,
        ]);
    }

    // ── Admin menu ────────────────────────────────────────────────────────────
    public static function admin_menu() {
        add_menu_page(
            'ColorSource Production',
            'CS Production',
            'manage_options',
            'cspsr',
            [__CLASS__, 'admin_page'],
            'dashicons-chart-line',
            25
        );
    }

    public static function admin_page() {
        echo '<div id="cspsr-root" data-mode="app"></div>';
    }

    // ── Shortcodes ────────────────────────────────────────────────────────────
    public static function shortcode_app() {
        self::enqueue_assets();
        return '<div id="cspsr-root" data-mode="app"></div>';
    }

    public static function shortcode_kds() {
        self::enqueue_assets();
        return '<div id="cspsr-root" data-mode="kds"></div>';
    }

    // ── Standalone pages (template_redirect) ─────────────────────────────────
    public static function handle_standalone_pages() {
        $page = get_query_var('cspsr_page');
        if (!$page) return;

        self::send_security_headers();
        self::disable_admin_bar_runtime();
        self::enqueue_assets();

        switch ($page) {
            case 'app':
                self::render_shell('app');
                break;
            case 'kds':
                self::render_shell('kds');
                break;
            case 'delivery':
                $order_id = get_query_var('cspsr_order') ?: ($_GET['order'] ?? 0);
                self::render_delivery((int)$order_id);
                break;
        }
        exit;
    }

    private static function render_shell($mode) {
        global $wp_scripts, $wp_styles;

        $is_kds = ($mode === 'kds');
        $dir    = self::ui_dir();
        $lang   = self::ui_lang();
        $title  = $is_kds ? 'Production Display — ColorSource' : 'ColorSource Production';
        ?><!DOCTYPE html>
<html lang="<?= esc_attr($lang) ?>" dir="<?= esc_attr($dir) ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= esc_html($title) ?></title>
<style>
  html { margin-top: 0 !important; }
  body { margin-top: 0 !important; }
  #wpadminbar { display: none !important; }
</style>
<?php if ($is_kds): ?>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;overflow:hidden;background:#0d1117}
  #cspsr-root{height:100vh;overflow-y:auto;background:#0d1117}
</style>
<?php endif; ?>
<?php wp_head(); ?>
</head>
<body<?= $is_kds ? ' style="background:#0d1117;margin:0;padding:0"' : '' ?>>
<div id="cspsr-root" data-mode="<?= esc_attr($mode) ?>"></div>
<?php wp_footer(); ?>
</body>
</html><?php
    }

    private static function render_delivery($order_id) {
        global $wpdb;
        self::require_app_auth();
        $order = $wpdb->get_row($wpdb->prepare(
            "SELECT o.*, c.name AS customer_name, c.company_name AS customer_company_name,
                    cr.name AS recipient_name, cr.phone AS recipient_phone, cr.address AS recipient_address, cr.map_url AS recipient_map_url
             FROM " . CSPSR_DB::tbl('orders') . " o
             LEFT JOIN " . CSPSR_DB::tbl('customers') . " c ON c.id = o.customer_id
             LEFT JOIN " . CSPSR_DB::tbl('customer_recipients') . " cr ON cr.id = o.recipient_id
             WHERE o.id = %d", $order_id
        ), ARRAY_A);

        if (!$order) {
            wp_die('الطلب غير موجود', 404);
        }
        ?><!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تسليم طلب #<?= esc_html($order['order_number']) ?></title>
<style>
  body{font-family:system-ui,sans-serif;background:#f1f5f9;margin:0;padding:2rem;direction:rtl}
  .card{background:#fff;border-radius:1rem;padding:2rem;max-width:500px;margin:auto;box-shadow:0 4px 24px #0001}
  h1{font-size:1.4rem;color:#1e293b;margin:0 0 1rem}
  .row{display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid #f1f5f9}
  .label{color:#64748b;font-size:.9rem}
  .val{font-weight:600;color:#1e293b}
  .badge{display:inline-block;padding:.2rem .7rem;border-radius:999px;background:#dcfce7;color:#16a34a;font-size:.8rem}
  a.map-btn{display:block;margin-top:1rem;text-align:center;background:#3b82f6;color:#fff;padding:.7rem;border-radius:.5rem;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <h1>📦 طلب رقم: <?= esc_html($order['order_number']) ?></h1>
  <div class="row"><span class="label">العميل</span><span class="val"><?= esc_html($order['customer_company_name'] ?: $order['customer_name']) ?></span></div>
  <div class="row"><span class="label">المستلم</span><span class="val"><?= esc_html($order['recipient_name'] ?: '—') ?></span></div>
  <div class="row"><span class="label">هاتف المستلم</span><span class="val"><?= esc_html($order['recipient_phone'] ?: '—') ?></span></div>
  <div class="row"><span class="label">العنوان</span><span class="val"><?= esc_html($order['delivery_address'] ?: $order['recipient_address'] ?: '—') ?></span></div>
  <div class="row"><span class="label">الحالة</span><span class="val"><span class="badge"><?= esc_html($order['status_slug']) ?></span></span></div>
  <?php if ($order['delivery_notes']): ?>
  <div class="row"><span class="label">ملاحظات</span><span class="val"><?= esc_html($order['delivery_notes']) ?></span></div>
  <?php endif; ?>
  <?php $map = $order['delivery_map_url'] ?: $order['recipient_map_url']; if ($map): ?>
  <a class="map-btn" href="<?= esc_url($map) ?>" target="_blank">📍 فتح الخريطة</a>
  <?php endif; ?>
</div>
</body>
</html><?php
    }
}
