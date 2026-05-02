<?php
/**
 * Plugin Name: ColorSource Production Suite Clean
 * Plugin URI:  https://colorsource.io
 * Description: Legacy-parity rebuild of the ColorSource production system.
 * Version: 6.6.73.22
 * Author:      ColorSource
 * Text Domain: cspsr
 */

defined('ABSPATH') || exit;

define('CSPSR_CLEAN_VERSION', '6.6.73.22');
define('CSPSR_CLEAN_FILE', __FILE__);
define('CSPSR_CLEAN_DIR', plugin_dir_path(__FILE__));
define('CSPSR_CLEAN_URL', plugin_dir_url(__FILE__));

// Legacy compatibility constants used by the parity runtime.
define('CSPSR_VERSION', '6.6.73.22');
define('CSPSR_DB_VERSION', '1.2.4');
define('CSPSR_DIR', CSPSR_CLEAN_DIR);
define('CSPSR_URL', CSPSR_CLEAN_URL);
define('CSPSR_SLUG', 'cspsr');

// Prevent WordPress emoji/Twemoji from replacing emoji characters with remote SVG/PNG assets (s.w.org),
// which can appear as broken icons when that CDN is blocked by the network or firewall.
add_action('init', function () {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_filter('the_content_feed', 'wp_staticize_emoji');
    remove_filter('comment_text_rss', 'wp_staticize_emoji');
    remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
}, 1);

// Serve plugin assets through PHP to bypass aggressive proxy/browser caches that may ignore querystrings.
// Example: https://taskat.iraqi.events/?cspsr_asset=app.js&v=...
add_action('template_redirect', function () {
    if (empty($_GET['cspsr_asset'])) {
        return;
    }
    $asset = (string) wp_unslash($_GET['cspsr_asset']);
    $asset = ltrim($asset, '/');
    $asset = str_replace(['..', '\\'], ['', '/'], $asset);

    $allow = [
        // Prefer short paths to avoid proxies/WAFs that mishandle slashes in query params.
        'app.js'  => 'application/javascript; charset=UTF-8',
        'app.css' => 'text/css; charset=UTF-8',
        'offline-sync.js' => 'application/javascript; charset=UTF-8',
        'qrcode-local.js' => 'application/javascript; charset=UTF-8',
        'qr-bundle.js' => 'application/javascript; charset=UTF-8',

        // Full paths (back-compat)
        'assets/js/app.js' => 'application/javascript; charset=UTF-8',
        'assets/js/offline-sync.js' => 'application/javascript; charset=UTF-8',
        'assets/js/qrcode-local.js' => 'application/javascript; charset=UTF-8',
        'assets/js/qr-bundle.js' => 'application/javascript; charset=UTF-8',
        'assets/css/app.css' => 'text/css; charset=UTF-8',
    ];
    if (!isset($allow[$asset])) {
        status_header(404);
        exit;
    }

    // Map short paths to real files.
    if ($asset === 'app.js')  $asset = 'assets/js/app.js';
    if ($asset === 'app.css') $asset = 'assets/css/app.css';
    if ($asset === 'offline-sync.js') $asset = 'assets/js/offline-sync.js';
    if ($asset === 'qrcode-local.js') $asset = 'assets/js/qrcode-local.js';
    if ($asset === 'qr-bundle.js') $asset = 'assets/js/qr-bundle.js';

    $path = CSPSR_CLEAN_DIR . str_replace('/', DIRECTORY_SEPARATOR, $asset);
    if (!is_file($path)) {
        status_header(404);
        exit;
    }

    // Strong no-cache headers.
    nocache_headers();
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: ' . $allow[$asset]);
    header('X-Content-Type-Options: nosniff');

    readfile($path);
    exit;
}, -1000);

// Serve Firebase Messaging service worker from the site root scope.
// Example registration URL: https://taskat.iraqi.events/?cspsr_fcm_sw=1&v=...
add_action('template_redirect', function () {
    if (empty($_GET['cspsr_fcm_sw'])) {
        return;
    }
    $enabled = (bool) get_option('cspsr_fcm_enabled', false);
    $vapid = (string) get_option('cspsr_fcm_vapid_public', '');
    $cfg_raw = get_option('cspsr_fcm_config', '');
    $cfg = [];
    if (is_string($cfg_raw) && trim($cfg_raw) !== '') {
        $decoded = json_decode($cfg_raw, true);
        if (is_array($decoded)) $cfg = $decoded;
    } elseif (is_array($cfg_raw)) {
        $cfg = $cfg_raw;
    }

    nocache_headers();
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: application/javascript; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Service-Worker-Allowed: /');

    if (!$enabled || empty($vapid) || empty($cfg)) {
        echo "/* CSPSR FCM SW disabled */\n";
        exit;
    }

    echo "/* CSPSR FCM service worker */\n";

    // Keep SW self-contained to avoid failures when external CDN scripts are blocked.
    // FCM WebPush delivers a standard PushEvent payload that we can render ourselves.
    echo "self.addEventListener('push', function(event){\n";
    echo "  try {\n";
    echo "    var data = {};\n";
    echo "    try { data = event.data && event.data.json ? event.data.json() : {}; } catch(e0) {\n";
    echo "      try { data = JSON.parse(event.data && event.data.text ? event.data.text() : '{}'); } catch(e1) { data = {}; }\n";
    echo "    }\n";
    echo "    var n = (data && data.notification) ? data.notification : {};\n";
    echo "    var title = n.title || 'Notification';\n";
    echo "    var body = n.body || '';\n";
    echo "    var url = '/';\n";
    echo "    if (data && data.data && data.data.url) url = data.data.url;\n";
    echo "    if (data && data.webpush && data.webpush.fcm_options && data.webpush.fcm_options.link) url = data.webpush.fcm_options.link;\n";
    echo "    var opts = { body: body, data: { url: url } };\n";
    echo "    if (n.icon) opts.icon = n.icon;\n";
    echo "    if (n.badge) opts.badge = n.badge;\n";
    echo "    event.waitUntil(self.registration.showNotification(title, opts));\n";
    echo "  } catch(e) {}\n";
    echo "});\n";

    echo "self.addEventListener('notificationclick', function(event){\n";
    echo "  event.notification.close();\n";
    echo "  const url = (event.notification && event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';\n";
    echo "  event.waitUntil(clients.openWindow(url));\n";
    echo "});\n";
    exit;
}, -999);

// Friendly URL for QR contact pages (avoids exposing wp-json URL in printed QR codes).
// Example: https://taskat.iraqi.events/?cspsr_qr_contact=54&print=1
add_action('template_redirect', function () {
    if (!isset($_GET['cspsr_qr_contact'])) {
        return;
    }
    if (!cspsr_clean_require_runtime()) {
        return;
    }
    if (!class_exists('WP_REST_Request') || !class_exists('CSPSR_REST')) {
        return;
    }
    $req = new WP_REST_Request('GET', '/cspsr/v1/qr-contact');
    $req->set_param('order_id', (int) $_GET['cspsr_qr_contact']);
    foreach (['print','partial','batch_id','item_ids'] as $k) {
        if (isset($_GET[$k])) {
            $req->set_param($k, wp_unslash($_GET[$k]));
        }
    }
    CSPSR_REST::qr_contact_page($req);
    exit;
}, 0);

function cspsr_clean_store_boot_error($message) {
    update_option('cspsr_boot_error', (string) $message, false);
}

function cspsr_clean_clear_boot_error() {
    delete_option('cspsr_boot_error');
}

function cspsr_clean_resolve_runtime_file($relative_path) {
    $direct = CSPSR_CLEAN_DIR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative_path);
    if (file_exists($direct)) {
        return $direct;
    }

    $basename = basename($relative_path);
    try {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(CSPSR_CLEAN_DIR, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getFilename() === $basename) {
                return $file->getPathname();
            }
        }
    } catch (Throwable $e) {
        // Fall through to false; caller will store a readable boot error.
    }

    return false;
}

function cspsr_clean_self_heal_permissions() {
    // Best-effort: fix common unzip/permission issues (dirs missing +x).
    // This may fail when PHP user is not the owner; that's ok.
    $base = CSPSR_CLEAN_DIR;
    $dirs = [
        $base,
        $base . 'legacy',
        $base . 'legacy/includes',
        $base . 'assets',
        $base . 'assets/js',
        $base . 'assets/css',
    ];
    foreach ($dirs as $d) {
        if (!is_dir($d)) continue;
        @chmod($d, 0755);
    }
    $files = [
        $base . 'legacy/includes/class-cspsr-db.php',
        $base . 'legacy/includes/class-cspsr-auth.php',
        $base . 'legacy/includes/class-cspsr-rest.php',
        $base . 'legacy/includes/class-cspsr-app.php',
        $base . 'assets/js/app.js',
        $base . 'assets/css/app.css',
        $base . 'assets/js/offline-sync.js',
        $base . 'assets/js/qrcode-local.js',
        $base . 'assets/js/qr-bundle.js',
    ];
    foreach ($files as $f) {
        if (!is_file($f)) continue;
        @chmod($f, 0644);
    }
}

function cspsr_clean_require_runtime() {
    static $loaded = false;
    if ($loaded) {
        return true;
    }

    try {
        // Try to self-heal common permission issues before requiring runtime.
        cspsr_clean_self_heal_permissions();

        $files = [
            'legacy/includes/class-cspsr-db.php',
            'legacy/includes/class-cspsr-auth.php',
            'legacy/includes/class-cspsr-rest.php',
            'legacy/includes/class-cspsr-app.php',
        ];
        foreach ($files as $relative) {
            $resolved = cspsr_clean_resolve_runtime_file($relative);
            if (!$resolved || !file_exists($resolved) || !is_readable($resolved)) {
                throw new RuntimeException('Missing runtime file: ' . $relative);
            }
            require_once $resolved;
        }
        $loaded = true;
        cspsr_clean_clear_boot_error();
        return true;
    } catch (Throwable $e) {
        cspsr_clean_store_boot_error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        return false;
    }
}

function cspsr_clean_init_legacy_runtime() {
    if (!cspsr_clean_require_runtime()) {
        return;
    }
    CSPSR_DB::maybe_migrate();
    CSPSR_App::init();
    CSPSR_REST::init();
    add_action('rest_api_init', ['CSPSR_Auth', 'register_routes']);
}
add_action('plugins_loaded', 'cspsr_clean_init_legacy_runtime');

add_action('cspsr_daily_archive_completed_ops_tasks', function () {
    if (!cspsr_clean_require_runtime()) {
        return;
    }
    if (class_exists('CSPSR_DB')) {
        CSPSR_DB::archive_old_completed_ops_tasks(30, 500);
    }
});

register_activation_hook(__FILE__, function () {
    if (!cspsr_clean_require_runtime()) {
        return;
    }
    CSPSR_DB::install();
    if (!wp_next_scheduled('cspsr_daily_archive_completed_ops_tasks')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'cspsr_daily_archive_completed_ops_tasks');
    }
    delete_transient('cspsr_patched');
    flush_rewrite_rules();
});

add_action('init', function () {
    if (!cspsr_clean_require_runtime()) {
        return;
    }
    if (!get_transient('cspsr_patched')) {
        CSPSR_DB::install();
        set_transient('cspsr_patched', 1, DAY_IN_SECONDS);
    }
    if (!wp_next_scheduled('cspsr_daily_archive_completed_ops_tasks')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'cspsr_daily_archive_completed_ops_tasks');
    }
});

register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('cspsr_daily_archive_completed_ops_tasks');
    flush_rewrite_rules();
});

add_action('admin_notices', function () {
    if (!current_user_can('manage_options')) {
        return;
    }
    $msg = get_option('cspsr_boot_error', '');
    if (!$msg) {
        return;
    }
    echo '<div class="notice notice-error"><p><strong>ColorSource Production Suite Clean:</strong> '
        . esc_html($msg)
        . '</p></div>';
});


