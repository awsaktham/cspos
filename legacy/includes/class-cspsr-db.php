<?php
defined('ABSPATH') || exit;

class CSPSR_DB {

    // ── Table name helpers ────────────────────────────────────────────────────
    public static function tbl($name) {
        global $wpdb;
        return $wpdb->prefix . 'cspsr_' . $name;
    }

    private static function table_exists($table) {
        global $wpdb;
        return (bool) $wpdb->get_var("SHOW TABLES LIKE '$table'");
    }

    private static function table_columns($table) {
        global $wpdb;
        if (!self::table_exists($table)) return [];
        $rows = $wpdb->get_results("SHOW COLUMNS FROM $table", ARRAY_A);
        $cols = [];
        foreach ((array) $rows as $row) {
            if (!empty($row['Field'])) $cols[] = $row['Field'];
        }
        return $cols;
    }

    public static function ensure_archive_tables() {
        global $wpdb;
        $pairs = [
            ['ops_tasks', 'ops_tasks_archive'],
            ['ops_task_positions', 'ops_task_positions_archive'],
            ['ops_task_events', 'ops_task_events_archive'],
        ];
        foreach ($pairs as $pair) {
            $src = self::tbl($pair[0]);
            $dst = self::tbl($pair[1]);
            if (!self::table_exists($src)) continue;
            if (!self::table_exists($dst)) {
                $wpdb->query("CREATE TABLE $dst LIKE $src");
            }
            if (self::table_exists($dst) && !in_array('archived_at', self::table_columns($dst), true)) {
                $wpdb->query("ALTER TABLE $dst ADD COLUMN archived_at datetime DEFAULT NULL");
                $wpdb->query("ALTER TABLE $dst ADD KEY archived_at (archived_at)");
            }
        }
    }

    public static function archive_old_completed_ops_tasks($days = 30, $limit = 300) {
        global $wpdb;
        self::ensure_archive_tables();

        $live_tasks = self::tbl('ops_tasks');
        $arc_tasks  = self::tbl('ops_tasks_archive');
        $live_pos   = self::tbl('ops_task_positions');
        $arc_pos    = self::tbl('ops_task_positions_archive');
        $live_evt   = self::tbl('ops_task_events');
        $arc_evt    = self::tbl('ops_task_events_archive');

        if (!self::table_exists($live_tasks) || !self::table_exists($arc_tasks)) return 0;

        $days = max(1, (int) $days);
        $limit = max(1, min(1000, (int) $limit));

        $ids = $wpdb->get_col($wpdb->prepare(
            "SELECT id
             FROM $live_tasks
             WHERE completed_at IS NOT NULL
               AND completed_at <> ''
               AND completed_at <> '0000-00-00 00:00:00'
               AND completed_at < DATE_SUB(NOW(), INTERVAL %d DAY)
             ORDER BY completed_at ASC, id ASC
             LIMIT %d",
            $days,
            $limit
        ));
        if (empty($ids)) return 0;

        $id_sql = implode(',', array_map('intval', $ids));
        $now_sql = current_time('mysql');

        $live_task_cols = self::table_columns($live_tasks);
        $arc_task_cols = self::table_columns($arc_tasks);
        $task_common = array_values(array_intersect($live_task_cols, $arc_task_cols));
        $task_common = array_values(array_filter($task_common, function($col){ return $col !== 'archived_at'; }));
        if (!empty($task_common)) {
            $cols = implode(',', $task_common);
            $wpdb->query(
                "INSERT IGNORE INTO $arc_tasks ($cols, archived_at)
                 SELECT $cols, '" . esc_sql($now_sql) . "'
                 FROM $live_tasks
                 WHERE id IN ($id_sql)"
            );
        }

        if (self::table_exists($live_pos) && self::table_exists($arc_pos)) {
            $live_pos_cols = self::table_columns($live_pos);
            $arc_pos_cols = self::table_columns($arc_pos);
            $pos_common = array_values(array_intersect($live_pos_cols, $arc_pos_cols));
            $pos_common = array_values(array_filter($pos_common, function($col){ return $col !== 'archived_at'; }));
            if (!empty($pos_common)) {
                $cols = implode(',', $pos_common);
                $wpdb->query(
                    "INSERT IGNORE INTO $arc_pos ($cols, archived_at)
                     SELECT $cols, '" . esc_sql($now_sql) . "'
                     FROM $live_pos
                     WHERE task_id IN ($id_sql)"
                );
            }
        }

        if (self::table_exists($live_evt) && self::table_exists($arc_evt)) {
            $live_evt_cols = self::table_columns($live_evt);
            $arc_evt_cols = self::table_columns($arc_evt);
            $evt_common = array_values(array_intersect($live_evt_cols, $arc_evt_cols));
            $evt_common = array_values(array_filter($evt_common, function($col){ return $col !== 'archived_at'; }));
            if (!empty($evt_common)) {
                $cols = implode(',', $evt_common);
                $wpdb->query(
                    "INSERT IGNORE INTO $arc_evt ($cols, archived_at)
                     SELECT $cols, '" . esc_sql($now_sql) . "'
                     FROM $live_evt
                     WHERE task_id IN ($id_sql)"
                );
            }
        }

        if (self::table_exists($live_pos)) {
            $wpdb->query("DELETE FROM $live_pos WHERE task_id IN ($id_sql)");
        }
        if (self::table_exists($live_evt)) {
            $wpdb->query("DELETE FROM $live_evt WHERE task_id IN ($id_sql)");
        }
        $wpdb->query("DELETE FROM $live_tasks WHERE id IN ($id_sql)");

        return count($ids);
    }

    // ── Migration check ───────────────────────────────────────────────────────
    public static function maybe_migrate() {
        global $wpdb;
        $installed = get_option('cspsr_db_version', '0');
        if (version_compare($installed, CSPSR_DB_VERSION, '<')) {
            self::install();
            update_option('cspsr_db_version', CSPSR_DB_VERSION);
        }
        // Always run column patches (safe to run multiple times)
        self::patch_columns();
        self::ensure_archive_tables();
    }

    // Add missing columns to existing tables without dropping data
    private static function patch_columns() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // ✅ Always ensure suppliers table exists (safe with IF NOT EXISTS)
        $wpdb->query("CREATE TABLE IF NOT EXISTS " . self::tbl('suppliers') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL DEFAULT '',
            name_en varchar(191) DEFAULT '',
            phone varchar(50) DEFAULT '',
            phone_alt varchar(50) DEFAULT '',
            workday_start varchar(5) DEFAULT '09:00',
            workday_end varchar(5) DEFAULT '17:00',
            working_days text DEFAULT NULL,
            holidays text DEFAULT NULL,
            map_url text DEFAULT NULL,
            notes text DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset");

        // Add supplier_id to production_step_library if missing
        $sl_sup = self::tbl('production_step_library');
        if ($wpdb->get_var("SHOW TABLES LIKE '$sl_sup'")) {
            $sup_col = $wpdb->get_results("SHOW COLUMNS FROM $sl_sup LIKE 'supplier_id'");
            if (empty($sup_col)) { $wpdb->query("ALTER TABLE $sl_sup ADD COLUMN supplier_id bigint(20) UNSIGNED DEFAULT NULL"); }
        }
        $sup_tbl = self::tbl('suppliers');
        if ($wpdb->get_var("SHOW TABLES LIKE '$sup_tbl'")) {
            $sup_ws = $wpdb->get_results("SHOW COLUMNS FROM $sup_tbl LIKE 'workday_start'");
            if (empty($sup_ws)) { $wpdb->query("ALTER TABLE $sup_tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00' AFTER phone_alt"); }
            $sup_we = $wpdb->get_results("SHOW COLUMNS FROM $sup_tbl LIKE 'workday_end'");
            if (empty($sup_we)) { $wpdb->query("ALTER TABLE $sup_tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00' AFTER workday_start"); }
            $sup_wd = $wpdb->get_results("SHOW COLUMNS FROM $sup_tbl LIKE 'working_days'");
            if (empty($sup_wd)) { $wpdb->query("ALTER TABLE $sup_tbl ADD COLUMN working_days text DEFAULT NULL AFTER workday_end"); }
            $sup_hd = $wpdb->get_results("SHOW COLUMNS FROM $sup_tbl LIKE 'holidays'");
            if (empty($sup_hd)) { $wpdb->query("ALTER TABLE $sup_tbl ADD COLUMN holidays text DEFAULT NULL AFTER working_days"); }
        }
        // Add supplier_id to item_steps if missing
        $is_sup = self::tbl('item_steps');
        if ($wpdb->get_var("SHOW TABLES LIKE '$is_sup'")) {
            $sup_col3 = $wpdb->get_results("SHOW COLUMNS FROM $is_sup LIKE 'supplier_id'");
            if (empty($sup_col3)) { $wpdb->query("ALTER TABLE $is_sup ADD COLUMN supplier_id bigint(20) UNSIGNED DEFAULT NULL"); }
        }
        // Add completed_by_ids to item_steps if missing
        if ($wpdb->get_var("SHOW TABLES LIKE '$is_sup'")) {
            $cb = $wpdb->get_results("SHOW COLUMNS FROM $is_sup LIKE 'completed_by_ids'");
            if (empty($cb)) { $wpdb->query("ALTER TABLE $is_sup ADD COLUMN completed_by_ids text DEFAULT NULL AFTER completed_at"); }
        }
        // Add sort_order to departments if missing
        $dept_tbl = self::tbl('departments');
        if ($wpdb->get_var("SHOW TABLES LIKE '$dept_tbl'")) {
            $dept_so = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'sort_order'");
            if (empty($dept_so)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN sort_order int DEFAULT 0 AFTER color"); }
            $dept_ne = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'name_en'");
            if (empty($dept_ne)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name"); }
            $dept_ws = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'workday_start'");
            if (empty($dept_ws)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00' AFTER sort_order"); }
            $dept_we = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'workday_end'");
            if (empty($dept_we)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00' AFTER workday_start"); }
            $dept_wd = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'working_days'");
            if (empty($dept_wd)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN working_days text DEFAULT NULL AFTER workday_end"); }
            $dept_hd = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'holidays'");
            if (empty($dept_hd)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN holidays text DEFAULT NULL AFTER working_days"); }
        }

        $team_tbl = self::tbl('teams');
        if ($wpdb->get_var("SHOW TABLES LIKE '$team_tbl'")) {
            $team_ws = $wpdb->get_results("SHOW COLUMNS FROM $team_tbl LIKE 'workday_start'");
            if (empty($team_ws)) { $wpdb->query("ALTER TABLE $team_tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00' AFTER lead_employee_id"); }
            $team_we = $wpdb->get_results("SHOW COLUMNS FROM $team_tbl LIKE 'workday_end'");
            if (empty($team_we)) { $wpdb->query("ALTER TABLE $team_tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00' AFTER workday_start"); }
            $team_wd = $wpdb->get_results("SHOW COLUMNS FROM $team_tbl LIKE 'working_days'");
            if (empty($team_wd)) { $wpdb->query("ALTER TABLE $team_tbl ADD COLUMN working_days text DEFAULT NULL AFTER workday_end"); }
            $team_hd = $wpdb->get_results("SHOW COLUMNS FROM $team_tbl LIKE 'holidays'");
            if (empty($team_hd)) { $wpdb->query("ALTER TABLE $team_tbl ADD COLUMN holidays text DEFAULT NULL AFTER working_days"); }
        }

        // Add external supplier tracking fields to product_steps
        $ps_tbl = self::tbl('product_steps');
        if ($wpdb->get_var("SHOW TABLES LIKE '$ps_tbl'")) {
            foreach (['supplier_id bigint(20) UNSIGNED DEFAULT NULL',
                      'ext_send_at datetime DEFAULT NULL',
                      'ext_receive_expected datetime DEFAULT NULL',
                      'ext_receive_actual datetime DEFAULT NULL'] as $col_def) {
                $col_name = explode(' ', $col_def)[0];
                if (empty($wpdb->get_results("SHOW COLUMNS FROM $ps_tbl LIKE '$col_name'")))
                    $wpdb->query("ALTER TABLE $ps_tbl ADD COLUMN $col_def");
            }
        }

        // Add external supplier tracking fields to item_steps
        $is_tbl = self::tbl('item_steps');
        if ($wpdb->get_var("SHOW TABLES LIKE '$is_tbl'")) {
            foreach (['supplier_id bigint(20) UNSIGNED DEFAULT NULL',
                      'ext_send_at datetime DEFAULT NULL',
                      'ext_receive_expected datetime DEFAULT NULL',
                      'ext_receive_actual datetime DEFAULT NULL'] as $col_def) {
                $col_name = explode(' ', $col_def)[0];
                if (empty($wpdb->get_results("SHOW COLUMNS FROM $is_tbl LIKE '$col_name'")))
                    $wpdb->query("ALTER TABLE $is_tbl ADD COLUMN $col_def");
            }
        }

        $orders_tbl = self::tbl('orders');
        $col = $wpdb->get_results("SHOW COLUMNS FROM $orders_tbl LIKE 'is_done'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE $orders_tbl ADD COLUMN is_done tinyint(1) DEFAULT 0 AFTER is_urgent");
        }

        // Personal notifications support (optional per-user targeting)
        $no_tbl = self::tbl('notifications');
        if ($wpdb->get_var("SHOW TABLES LIKE '$no_tbl'")) {
            $no_user = $wpdb->get_results("SHOW COLUMNS FROM $no_tbl LIKE 'user_id'");
            if (empty($no_user)) {
                $wpdb->query("ALTER TABLE $no_tbl ADD COLUMN user_id bigint(20) UNSIGNED DEFAULT NULL AFTER id");
                $wpdb->query("ALTER TABLE $no_tbl ADD KEY user_id (user_id)");
            }
            $no_sound = $wpdb->get_results("SHOW COLUMNS FROM $no_tbl LIKE 'sound'");
            if (empty($no_sound)) {
                $wpdb->query("ALTER TABLE $no_tbl ADD COLUMN sound varchar(50) DEFAULT NULL AFTER type");
            }
            $no_surl = $wpdb->get_results("SHOW COLUMNS FROM $no_tbl LIKE 'sound_url'");
            if (empty($no_surl)) {
                $wpdb->query("ALTER TABLE $no_tbl ADD COLUMN sound_url text DEFAULT NULL AFTER sound");
            }
        }

        $st = self::tbl('statuses');
        $scol = $wpdb->get_results("SHOW COLUMNS FROM $st LIKE 'is_done'");
        if (empty($scol)) {
            $wpdb->query("ALTER TABLE $st ADD COLUMN is_done tinyint(1) DEFAULT 0");
        }
        $scol = $wpdb->get_results("SHOW COLUMNS FROM $st LIKE 'is_done'");
        if (empty($scol)) {
            $wpdb->query("ALTER TABLE $st ADD COLUMN is_done tinyint(1) DEFAULT 0");
        }
        // Ensure at least one is_done=1 status exists — prefer slug='done' only if no other exists
        $any_done = $wpdb->get_var("SELECT id FROM $st WHERE is_done=1 LIMIT 1");
        if (!$any_done) {
            // No done status at all — create one
            $wpdb->insert($st, ['name' => 'مكتمل', 'slug' => 'done', 'color' => '#22c55e', 'sort_order' => 3, 'is_done' => 1]);
        } else {
            // Make sure slug='done' rows have is_done=1 (migration for old installs)
            $wpdb->query("UPDATE $st SET is_done=1 WHERE slug='done'");
        }

        // Create auth tables if missing (for existing installs)
        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('app_users') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            username varchar(100) NOT NULL,
            password_hash varchar(255) NOT NULL,
            role varchar(20) DEFAULT 'user',
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY username (username)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('app_tokens') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            token varchar(64) NOT NULL,
            expires_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY token (token)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('app_permissions') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            perm_key varchar(191) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY user_perm (user_id, perm_key)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('employee_leaves') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) UNSIGNED NOT NULL,
            leave_start date NOT NULL,
            leave_end date NOT NULL,
            reason text DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY employee_id (employee_id),
            KEY leave_window (leave_start, leave_end)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('employee_leave_reassignments') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            leave_id bigint(20) UNSIGNED NOT NULL,
            scope_key varchar(191) NOT NULL,
            department_id bigint(20) UNSIGNED DEFAULT NULL,
            replacement_employee_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY leave_id (leave_id),
            KEY scope_key (scope_key)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('employee_points') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) UNSIGNED NOT NULL,
            points int NOT NULL DEFAULT 0,
            reason_code varchar(64) NOT NULL DEFAULT '',
            reason_label varchar(191) DEFAULT '',
            order_id bigint(20) UNSIGNED DEFAULT NULL,
            order_item_id bigint(20) UNSIGNED DEFAULT NULL,
            step_id bigint(20) UNSIGNED DEFAULT NULL,
            ops_task_id bigint(20) UNSIGNED DEFAULT NULL,
            event_at datetime DEFAULT CURRENT_TIMESTAMP,
            meta longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY employee_id (employee_id),
            KEY reason_code (reason_code),
            KEY order_id (order_id),
            KEY step_id (step_id),
            KEY ops_task_id (ops_task_id),
            KEY event_at (event_at)
        ) $charset;");

        // Add avatar + employee_id to app_users if missing
        $users_tbl = self::tbl('app_users');
        $col_av = $wpdb->get_results("SHOW COLUMNS FROM $users_tbl LIKE 'avatar'");
        if (empty($col_av)) {
            $wpdb->query("ALTER TABLE $users_tbl ADD COLUMN avatar mediumtext DEFAULT NULL AFTER is_active");
        }
        $col_eid = $wpdb->get_results("SHOW COLUMNS FROM $users_tbl LIKE 'employee_id'");
        if (empty($col_eid)) {
            $wpdb->query("ALTER TABLE $users_tbl ADD COLUMN employee_id bigint(20) UNSIGNED DEFAULT NULL AFTER avatar");
        }

        // Add avatar to employees if missing
        $emp_tbl = self::tbl('employees');
        $col_emp_av = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'avatar'");
        if (empty($col_emp_av)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN avatar mediumtext DEFAULT NULL AFTER phone");
        }
        // Add name_en to employees if missing
        $col_emp_en = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'name_en'");
        if (empty($col_emp_en)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name");
        }
        $col_emp_ws = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'workday_start'");
        if (empty($col_emp_ws)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00' AFTER team_id");
        }
        $col_emp_we = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'workday_end'");
        if (empty($col_emp_we)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00' AFTER workday_start");
        }
        $col_emp_wd = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'working_days'");
        if (empty($col_emp_wd)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN working_days text DEFAULT NULL AFTER workday_end");
        }
        $col_emp_hd = $wpdb->get_results("SHOW COLUMNS FROM $emp_tbl LIKE 'holidays'");
        if (empty($col_emp_hd)) {
            $wpdb->query("ALTER TABLE $emp_tbl ADD COLUMN holidays text DEFAULT NULL AFTER working_days");
        }

        $ops_tbl = self::tbl('ops_tasks');
        if ($wpdb->get_var("SHOW TABLES LIKE '$ops_tbl'")) {
            $ops_emp = $wpdb->get_results("SHOW COLUMNS FROM $ops_tbl LIKE 'assigned_employee_id'");
            if (empty($ops_emp)) {
                $wpdb->query("ALTER TABLE $ops_tbl ADD COLUMN assigned_employee_id bigint(20) UNSIGNED DEFAULT NULL AFTER product_id");
            }
            $ops_emp_ids = $wpdb->get_results("SHOW COLUMNS FROM $ops_tbl LIKE 'assigned_employee_ids'");
            if (empty($ops_emp_ids)) {
                $wpdb->query("ALTER TABLE $ops_tbl ADD COLUMN assigned_employee_ids text DEFAULT NULL AFTER assigned_employee_id");
            }
            $ops_created = $wpdb->get_results("SHOW COLUMNS FROM $ops_tbl LIKE 'created_by'");
            if (empty($ops_created)) {
                $wpdb->query("ALTER TABLE $ops_tbl ADD COLUMN created_by bigint(20) UNSIGNED DEFAULT NULL AFTER assigned_employee_id");
            }
        }
        $ops_arc_tbl = self::tbl('ops_tasks_archive');
        if ($wpdb->get_var("SHOW TABLES LIKE '$ops_arc_tbl'")) {
            $ops_arc_emp_ids = $wpdb->get_results("SHOW COLUMNS FROM $ops_arc_tbl LIKE 'assigned_employee_ids'");
            if (empty($ops_arc_emp_ids)) {
                $wpdb->query("ALTER TABLE $ops_arc_tbl ADD COLUMN assigned_employee_ids text DEFAULT NULL AFTER assigned_employee_id");
            }
        }

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('employee_leaves') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) UNSIGNED NOT NULL,
            leave_start date NOT NULL,
            leave_end date NOT NULL,
            reason text DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY employee_id (employee_id),
            KEY leave_window (leave_start, leave_end)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('employee_leave_reassignments') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            leave_id bigint(20) UNSIGNED NOT NULL,
            scope_key varchar(191) NOT NULL,
            department_id bigint(20) UNSIGNED DEFAULT NULL,
            replacement_employee_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY leave_id (leave_id),
            KEY scope_key (scope_key)
        ) $charset;");
        $users_tbl = self::tbl('app_users');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM $users_tbl")) {
            $wpdb->insert($users_tbl, [
                'name'          => 'المدير',
                'username'      => 'admin',
                'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
                'role'          => 'admin',
                'is_active'     => 1,
            ]);
        } else {
            // Always ensure 'admin' username has admin role
            $wpdb->query("UPDATE $users_tbl SET role='admin' WHERE username='admin'");
        }

        // Add description_en to products if missing
        $prod_tbl = self::tbl('products');
        $den = $wpdb->get_results("SHOW COLUMNS FROM $prod_tbl LIKE 'description_en'");
        if (empty($den)) { $wpdb->query("ALTER TABLE $prod_tbl ADD COLUMN description_en text DEFAULT NULL AFTER description"); }

        // Auto-create production_step_library if missing
        $sl_check = $wpdb->get_var("SHOW TABLES LIKE '".self::tbl('production_step_library')."'");
        if (!$sl_check) {
            $wpdb->query("CREATE TABLE IF NOT EXISTS ".self::tbl('production_step_library')." (
                id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                step_name varchar(191) NOT NULL,
                step_name_en varchar(191) DEFAULT '',
                default_employee_ids text DEFAULT NULL,
                default_team_id bigint(20) UNSIGNED DEFAULT NULL,
                show_in_prds tinyint(1) DEFAULT 1,
                is_external tinyint(1) DEFAULT 0,
                is_delivery tinyint(1) DEFAULT 0,
                delivery_direction varchar(32) DEFAULT 'delivered_to_client',
                sort_order int DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ".$charset);
        }

        // Add qty_per_unit to product_steps if missing (default 1 = per unit)
        $ps_tbl4 = self::tbl('product_steps');
        $qpu = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl4 LIKE 'qty_per_unit'");
        if (empty($qpu)) { $wpdb->query("ALTER TABLE $ps_tbl4 ADD COLUMN qty_per_unit int DEFAULT 1 AFTER scales_with_qty"); }

        // Add delivery_direction to product_steps if missing
        $ps_dir = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl4 LIKE 'delivery_direction'");
        if (empty($ps_dir)) { $wpdb->query("ALTER TABLE $ps_tbl4 ADD COLUMN delivery_direction varchar(32) DEFAULT 'delivered_to_client' AFTER is_delivery"); }

        // Create order_recipients table if missing
        $or_tbl = self::tbl('order_recipients');
        $or_exists = $wpdb->get_var("SHOW TABLES LIKE '$or_tbl'");
        if (!$or_exists) {
            $wpdb->query("CREATE TABLE $or_tbl (
                id int AUTO_INCREMENT PRIMARY KEY,
                order_id int NOT NULL,
                recipient_id int NOT NULL,
                name varchar(200) DEFAULT '',
                phone varchar(50) DEFAULT '',
                address text DEFAULT '',
                notes text DEFAULT '',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                INDEX(order_id)
            ) {$charset_collate}");
        }

        // Add delay_reason to orders if missing
        $ord_tbl2 = self::tbl('orders');
        $dr = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2 LIKE 'delay_reason'");
        if (empty($dr)) { $wpdb->query("ALTER TABLE $ord_tbl2 ADD COLUMN delay_reason text DEFAULT NULL"); }
        $dlat = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2 LIKE 'delay_reported_at'");
        if (empty($dlat)) { $wpdb->query("ALTER TABLE $ord_tbl2 ADD COLUMN delay_reported_at datetime DEFAULT NULL"); }

        // Add queue_order to orders if missing
        $ord_tbl = self::tbl('orders');
        $qo = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl LIKE 'queue_order'");
        if (empty($qo)) { $wpdb->query("ALTER TABLE $ord_tbl ADD COLUMN queue_order int DEFAULT 0 AFTER is_done"); }

        // Add scales_with_qty to product_steps if missing
        $ps_tbl3 = self::tbl('product_steps');
        $swq = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl3 LIKE 'scales_with_qty'");
        if (empty($swq)) { $wpdb->query("ALTER TABLE $ps_tbl3 ADD COLUMN scales_with_qty tinyint(1) DEFAULT 0 AFTER is_delivery"); }

        // Add delivery_direction to product_steps if missing
        $ps_dir2 = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl3 LIKE 'delivery_direction'");
        if (empty($ps_dir2)) { $wpdb->query("ALTER TABLE $ps_tbl3 ADD COLUMN delivery_direction varchar(32) DEFAULT 'delivered_to_client' AFTER is_delivery"); }

        // Add is_delivery to product_steps if missing
        $ps_tbl2 = self::tbl('product_steps');
        $psd = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl2 LIKE 'is_delivery'");
        if (empty($psd)) { $wpdb->query("ALTER TABLE $ps_tbl2 ADD COLUMN is_delivery tinyint(1) DEFAULT 0 AFTER is_external"); }

        // Add qty_per_unit to item_steps if missing
        $is_tbl3 = self::tbl('item_steps');
        $qpu2 = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl3 LIKE 'qty_per_unit'");
        if (empty($qpu2)) { $wpdb->query("ALTER TABLE $is_tbl3 ADD COLUMN qty_per_unit int DEFAULT 1 AFTER scales_with_qty"); }

        // Add scales_with_qty to item_steps if missing
        $is_tbl2 = self::tbl('item_steps');
        $swq2 = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl2 LIKE 'scales_with_qty'");
        if (empty($swq2)) { $wpdb->query("ALTER TABLE $is_tbl2 ADD COLUMN scales_with_qty tinyint(1) DEFAULT 0 AFTER is_delivery"); }

        // Add delivery_direction to item_steps if missing
        $is_dir = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl2 LIKE 'delivery_direction'");
        if (empty($is_dir)) { $wpdb->query("ALTER TABLE $is_tbl2 ADD COLUMN delivery_direction varchar(32) DEFAULT 'delivered_to_client' AFTER is_delivery"); }

        // Add is_delivery to item_steps if missing
        $is_tbl = self::tbl('item_steps');
        $isd = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl LIKE 'is_delivery'");
        if (empty($isd)) { $wpdb->query("ALTER TABLE $is_tbl ADD COLUMN is_delivery tinyint(1) DEFAULT 0 AFTER is_external"); }

        // Add is_active to customer_recipients if missing
        $cr_tbl = self::tbl('customer_recipients');
        $ia = $wpdb->get_results("SHOW COLUMNS FROM $cr_tbl LIKE 'is_active'");
        if (empty($ia)) { $wpdb->query("ALTER TABLE $cr_tbl ADD COLUMN is_active tinyint(1) DEFAULT 1 AFTER delivery_notes"); }

        // Add is_delivery flag to production_step_library if missing
        $sl_tbl2 = self::tbl('production_step_library');
        $idl = $wpdb->get_results("SHOW COLUMNS FROM $sl_tbl2 LIKE 'is_delivery'");
        if (empty($idl)) { $wpdb->query("ALTER TABLE $sl_tbl2 ADD COLUMN is_delivery tinyint(1) DEFAULT 0 AFTER is_external"); }

        // Add delivery_direction flag to production_step_library if missing
        $sldir = $wpdb->get_results("SHOW COLUMNS FROM $sl_tbl2 LIKE 'delivery_direction'");
        if (empty($sldir)) { $wpdb->query("ALTER TABLE $sl_tbl2 ADD COLUMN delivery_direction varchar(32) DEFAULT 'delivered_to_client' AFTER is_delivery"); }

        // Add is_temp_recipient to customer_contacts if missing
        $cc_tbl = self::tbl('customer_contacts');
        $itr = $wpdb->get_results("SHOW COLUMNS FROM $cc_tbl LIKE 'is_temp_recipient'");
        if (empty($itr)) { $wpdb->query("ALTER TABLE $cc_tbl ADD COLUMN is_temp_recipient tinyint(1) DEFAULT 0 AFTER email"); }

        // Add bilingual + map_url fields to customer_contacts if missing
        $cc_name_en = $wpdb->get_results("SHOW COLUMNS FROM $cc_tbl LIKE 'name_en'");
        if (empty($cc_name_en)) { $wpdb->query("ALTER TABLE $cc_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name"); }
        $cc_job_en = $wpdb->get_results("SHOW COLUMNS FROM $cc_tbl LIKE 'job_title_en'");
        if (empty($cc_job_en)) { $wpdb->query("ALTER TABLE $cc_tbl ADD COLUMN job_title_en varchar(191) DEFAULT '' AFTER job_title"); }
        $cc_map = $wpdb->get_results("SHOW COLUMNS FROM $cc_tbl LIKE 'map_url'");
        if (empty($cc_map)) { $wpdb->query("ALTER TABLE $cc_tbl ADD COLUMN map_url varchar(500) DEFAULT '' AFTER email"); }
        $cc_phone_alt = $wpdb->get_results("SHOW COLUMNS FROM $cc_tbl LIKE 'phone_alt'");
        if (empty($cc_phone_alt)) { $wpdb->query("ALTER TABLE $cc_tbl ADD COLUMN phone_alt varchar(50) DEFAULT '' AFTER phone"); }

        // Add default_employee_ids to production_step_library if missing
        $sl_tbl = self::tbl('production_step_library');
        $dei = $wpdb->get_results("SHOW COLUMNS FROM $sl_tbl LIKE 'default_employee_ids'");
        if (empty($dei)) { $wpdb->query("ALTER TABLE $sl_tbl ADD COLUMN default_employee_ids text DEFAULT NULL AFTER default_employee_id"); }

        // Add contact_person_id to orders if missing (replaces old account_manager_id logic)
        $ord_tbl2 = self::tbl('orders');
        $cp = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2 LIKE 'contact_person_id'");
        if (empty($cp)) { $wpdb->query("ALTER TABLE $ord_tbl2 ADD COLUMN contact_person_id bigint(20) UNSIGNED DEFAULT NULL AFTER customer_id"); }
        $cpn = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2 LIKE 'contact_person_name'");
        if (empty($cpn)) { $wpdb->query("ALTER TABLE $ord_tbl2 ADD COLUMN contact_person_name varchar(191) DEFAULT '' AFTER contact_person_id"); }
        $cpp = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2 LIKE 'contact_person_phone'");
        if (empty($cpp)) { $wpdb->query("ALTER TABLE $ord_tbl2 ADD COLUMN contact_person_phone varchar(50) DEFAULT '' AFTER contact_person_name"); }

        // Add delivery_employee_id to orders if missing
        $ord_tbl2b = self::tbl('orders');
        $dei = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl2b LIKE 'delivery_employee_id'");
        if (empty($dei)) { $wpdb->query("ALTER TABLE $ord_tbl2b ADD COLUMN delivery_employee_id bigint(20) UNSIGNED DEFAULT NULL"); }


        // Add contact person fields to orders if missing
        $ord_tbl = self::tbl('orders');
        $contact_cols = ['contact_name','contact_phone','contact_email','contact_map','contact_address'];
        foreach ($contact_cols as $cc) {
            $exists = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl LIKE '$cc'");
            if (empty($exists)) { $wpdb->query("ALTER TABLE $ord_tbl ADD COLUMN $cc varchar(500) DEFAULT '' AFTER delivery_notes"); }
        }
        $itc = $wpdb->get_results("SHOW COLUMNS FROM $ord_tbl LIKE 'is_temp_contact'");
        if (empty($itc)) { $wpdb->query("ALTER TABLE $ord_tbl ADD COLUMN is_temp_contact tinyint(1) DEFAULT 0 AFTER contact_address"); }

        // Add name_en to bilingual tables if missing
        // app_users name_en
        $au_tbl = self::tbl('app_users');
        $au_col = $wpdb->get_results("SHOW COLUMNS FROM $au_tbl LIKE 'name_en'");
        if (empty($au_col)) { $wpdb->query("ALTER TABLE $au_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name"); }
        foreach (['roles','departments','teams','statuses','products'] as $tname) {
            $tbl = self::tbl($tname);
            $col_check = $wpdb->get_results("SHOW COLUMNS FROM $tbl LIKE 'name_en'");
            if (empty($col_check)) {
                $wpdb->query("ALTER TABLE $tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name");
            }
        }
        // product_steps uses step_name / step_name_en
        $ps_tbl = self::tbl('product_steps');
        $col_ps = $wpdb->get_results("SHOW COLUMNS FROM $ps_tbl LIKE 'step_name_en'");
        if (empty($col_ps)) {
            $wpdb->query("ALTER TABLE $ps_tbl ADD COLUMN step_name_en varchar(191) DEFAULT '' AFTER step_name");
        }
        // item_steps (order copies) also get step_name_en
        $is_tbl = self::tbl('item_steps');
        $col_is = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl LIKE 'step_name_en'");
        if (empty($col_is)) {
            $wpdb->query("ALTER TABLE $is_tbl ADD COLUMN step_name_en varchar(191) DEFAULT '' AFTER step_name");
        }

        // Add name_en and company_name_en to customers if missing
        $cust_tbl = self::tbl('customers');
        $cne = $wpdb->get_results("SHOW COLUMNS FROM $cust_tbl LIKE 'name_en'");
        if (empty($cne)) { $wpdb->query("ALTER TABLE $cust_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name"); }
        $ccne = $wpdb->get_results("SHOW COLUMNS FROM $cust_tbl LIKE 'company_name_en'");
        if (empty($ccne)) { $wpdb->query("ALTER TABLE $cust_tbl ADD COLUMN company_name_en varchar(191) DEFAULT '' AFTER company_name"); }
        $caddr_en = $wpdb->get_results("SHOW COLUMNS FROM $cust_tbl LIKE 'address_en'");
        if (empty($caddr_en)) { $wpdb->query("ALTER TABLE $cust_tbl ADD COLUMN address_en text DEFAULT NULL AFTER address"); }

        // Add product_name_en to order_items if missing
        $oi_tbl = self::tbl('order_items');
        $pne = $wpdb->get_results("SHOW COLUMNS FROM $oi_tbl LIKE 'product_name_en'");
        if (empty($pne)) { $wpdb->query("ALTER TABLE $oi_tbl ADD COLUMN product_name_en varchar(191) DEFAULT '' AFTER product_name"); }

        // Add is_paused and pause_reason to item_steps (step-level pause)
        $is_tbl_p = self::tbl('item_steps');
        $isp2 = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'is_paused'");
        if (empty($isp2)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN is_paused tinyint(1) DEFAULT 0 AFTER status_slug"); }
        $pr2 = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'pause_reason'");
        if (empty($pr2)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN pause_reason text DEFAULT NULL AFTER is_paused"); }
        // Add paused_at and paused_seconds for tracking pause duration
        $pa = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'paused_at'");
        if (empty($pa)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN paused_at datetime DEFAULT NULL AFTER pause_reason"); }
        $ps = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'paused_seconds'");
        if (empty($ps)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN paused_seconds int DEFAULT 0 AFTER paused_at"); }
        // Add paused_machine — stores the machine name linked to the pause reason
        $pm = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'paused_machine'");
        if (empty($pm)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN paused_machine varchar(255) DEFAULT NULL AFTER pause_reason"); }
        // Add completed_by_ids — stores who actually completed the step (selected at confirm time)
        $cb = $wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE 'completed_by_ids'");
        if (empty($cb)) { $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN completed_by_ids text DEFAULT NULL AFTER completed_at"); }

        // Fix legacy data: if an order has no 'done' steps and its first step is 'in_progress',
        // it was auto-started by the old code. Reset it to 'pending' so user must click Start.
        $steps_tbl  = self::tbl('item_steps');
        $items_tbl  = self::tbl('order_items');
        $orders_tbl2 = self::tbl('orders');
        $wpdb->query("
            UPDATE $steps_tbl s
            INNER JOIN $items_tbl i ON i.id = s.order_item_id
            INNER JOIN $orders_tbl2 o ON o.id = i.order_id
            SET s.status_slug = 'pending', s.started_at = NULL
            WHERE s.status_slug = 'in_progress'
              AND o.is_done = 0
              AND s.step_order = (
                  SELECT MIN(s2.step_order)
                  FROM $steps_tbl s2
                  WHERE s2.order_item_id = s.order_item_id
              )
              AND NOT EXISTS (
                  SELECT 1 FROM $steps_tbl s3
                  WHERE s3.order_item_id = s.order_item_id
                    AND s3.status_slug IN ('done','completed')
              )
        ");

        // Add delivery_date to orders if missing
        $ord_dd = self::tbl('orders');
        $dd_col = $wpdb->get_results("SHOW COLUMNS FROM $ord_dd LIKE 'delivery_date'");
        if (empty($dd_col)) { $wpdb->query("ALTER TABLE $ord_dd ADD COLUMN delivery_date datetime DEFAULT NULL AFTER deadline"); }

        // Lifecycle + KPI tracking fields on orders
        if ($wpdb->get_var("SHOW TABLES LIKE '$ord_dd'")) {
            $order_cols = [
                "entered_at datetime DEFAULT NULL AFTER deadline",
                "customer_deadline_at datetime DEFAULT NULL AFTER entered_at",
                "requested_delivery_at datetime DEFAULT NULL AFTER customer_deadline_at",
                "production_started_at datetime DEFAULT NULL AFTER requested_delivery_at",
                "ready_at datetime DEFAULT NULL AFTER production_started_at",
                "internal_ready_at datetime DEFAULT NULL AFTER ready_at",
                "dispatch_due_at datetime DEFAULT NULL AFTER internal_ready_at",
                "delivery_planned_at datetime DEFAULT NULL AFTER dispatch_due_at",
                "delivery_ready_at datetime DEFAULT NULL AFTER delivery_planned_at",
                "delivered_at datetime DEFAULT NULL AFTER delivery_ready_at",
                "closed_at datetime DEFAULT NULL AFTER delivered_at",
                "delivery_status varchar(50) DEFAULT 'pending' AFTER closed_at",
                "delivery_attempt_count int DEFAULT 0 AFTER delivery_status",
                "delivery_hold_reason text DEFAULT NULL AFTER delivery_attempt_count",
                "delivery_buffer_minutes int DEFAULT 60 AFTER delivery_hold_reason",
                "schedule_anchor_at datetime DEFAULT NULL AFTER delivery_buffer_minutes",
                "last_event_at datetime DEFAULT NULL AFTER schedule_anchor_at",
                "kpi_snapshot text DEFAULT NULL AFTER last_event_at"
            ];
            foreach ($order_cols as $col_def) {
                $col_name = explode(' ', trim($col_def))[0];
                if (empty($wpdb->get_results("SHOW COLUMNS FROM $ord_dd LIKE '$col_name'"))) {
                    $wpdb->query("ALTER TABLE $ord_dd ADD COLUMN $col_def");
                }
            }
            $wpdb->query("UPDATE $ord_dd SET entered_at = COALESCE(entered_at, created_at) WHERE entered_at IS NULL");
            $wpdb->query("UPDATE $ord_dd SET customer_deadline_at = COALESCE(customer_deadline_at, deadline) WHERE customer_deadline_at IS NULL AND deadline IS NOT NULL");
        }

        // Lifecycle + KPI tracking fields on item_steps
        if ($wpdb->get_var("SHOW TABLES LIKE '$is_tbl_p'")) {
            $step_cols = [
                "planned_start_at datetime DEFAULT NULL AFTER expected_hours",
                "planned_due_at datetime DEFAULT NULL AFTER planned_start_at",
                "actual_started_at datetime DEFAULT NULL AFTER planned_due_at",
                "actual_completed_at datetime DEFAULT NULL AFTER actual_started_at",
                "expected_duration_minutes int DEFAULT 0 AFTER actual_completed_at",
                "actual_duration_minutes int DEFAULT 0 AFTER expected_duration_minutes",
                "queue_wait_minutes int DEFAULT 0 AFTER actual_duration_minutes",
                "last_event_at datetime DEFAULT NULL AFTER queue_wait_minutes"
            ];
            foreach ($step_cols as $col_def) {
                $col_name = explode(' ', trim($col_def))[0];
                if (empty($wpdb->get_results("SHOW COLUMNS FROM $is_tbl_p LIKE '$col_name'"))) {
                    $wpdb->query("ALTER TABLE $is_tbl_p ADD COLUMN $col_def");
                }
            }
            $wpdb->query("UPDATE $is_tbl_p SET actual_started_at = COALESCE(actual_started_at, started_at) WHERE actual_started_at IS NULL AND started_at IS NOT NULL");
            $wpdb->query("UPDATE $is_tbl_p SET actual_completed_at = COALESCE(actual_completed_at, completed_at) WHERE actual_completed_at IS NULL AND completed_at IS NOT NULL");
            $wpdb->query("UPDATE $is_tbl_p SET expected_duration_minutes = ROUND(COALESCE(expected_hours,0) * 60) WHERE COALESCE(expected_duration_minutes,0) = 0");
        }

        // Lifecycle event tables
        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('order_events') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            step_id bigint(20) UNSIGNED DEFAULT NULL,
            attempt_id bigint(20) UNSIGNED DEFAULT NULL,
            event_type varchar(100) NOT NULL,
            event_time datetime NOT NULL,
            payload longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY event_type (event_type),
            KEY event_time (event_time)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('step_events') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            step_id bigint(20) UNSIGNED NOT NULL,
            order_id bigint(20) UNSIGNED DEFAULT NULL,
            event_type varchar(100) NOT NULL,
            event_time datetime NOT NULL,
            payload longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY step_id (step_id),
            KEY order_id (order_id),
            KEY event_type (event_type)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('delivery_attempts') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            attempt_no int NOT NULL DEFAULT 1,
            planned_at datetime DEFAULT NULL,
            dispatch_at datetime DEFAULT NULL,
            arrived_at datetime DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            status varchar(50) DEFAULT 'scheduled',
            failure_reason varchar(191) DEFAULT '',
            notes text DEFAULT NULL,
            customer_response varchar(191) DEFAULT '',
            next_attempt_at datetime DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY status (status)
        ) $charset;");

        // Add is_ready_for_delivery to order_items if missing
        $oi_rfd = self::tbl('order_items');
        $rfd_col = $wpdb->get_results("SHOW COLUMNS FROM $oi_rfd LIKE 'is_ready_for_delivery'");
        if (empty($rfd_col)) { $wpdb->query("ALTER TABLE $oi_rfd ADD COLUMN is_ready_for_delivery tinyint(1) DEFAULT 0"); }
        $rfd_at_col = $wpdb->get_results("SHOW COLUMNS FROM $oi_rfd LIKE 'ready_for_delivery_at'");
        if (empty($rfd_at_col)) { $wpdb->query("ALTER TABLE $oi_rfd ADD COLUMN ready_for_delivery_at datetime DEFAULT NULL"); }
        $delivered_col = $wpdb->get_results("SHOW COLUMNS FROM $oi_rfd LIKE 'is_delivered'");
        if (empty($delivered_col)) { $wpdb->query("ALTER TABLE $oi_rfd ADD COLUMN is_delivered tinyint(1) DEFAULT 0"); }
        $delivered_at_col = $wpdb->get_results("SHOW COLUMNS FROM $oi_rfd LIKE 'delivered_at'");
        if (empty($delivered_at_col)) { $wpdb->query("ALTER TABLE $oi_rfd ADD COLUMN delivered_at datetime DEFAULT NULL"); }
        $batch_id_col = $wpdb->get_results("SHOW COLUMNS FROM $oi_rfd LIKE 'delivery_batch_id'");
        if (empty($batch_id_col)) { $wpdb->query("ALTER TABLE $oi_rfd ADD COLUMN delivery_batch_id bigint(20) UNSIGNED DEFAULT NULL"); }

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('delivery_batches') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            batch_no int NOT NULL DEFAULT 1,
            status varchar(50) NOT NULL DEFAULT 'queued',
            notes text DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            delivered_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY status (status)
        ) $charset;");

        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('delivery_batch_items') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            batch_id bigint(20) UNSIGNED NOT NULL,
            order_item_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY batch_item (batch_id, order_item_id),
            KEY order_item_id (order_item_id)
        ) $charset;");

        // One-time fix: sync expected_hours from product_steps to item_steps where 0
        if (!get_option('cspsr_fixed_expected_hours_v4')) {
            $is_tbl = self::tbl('item_steps');
            $oi_tbl = self::tbl('order_items');
            $ps_tbl = self::tbl('product_steps');

            // Fix negative expected_hours on delivery steps → set to 0
            $wpdb->query("UPDATE $is_tbl SET expected_hours = 0 WHERE expected_hours < 0");
            // Fix negative expected_hours on product_steps too
            $wpdb->query("UPDATE $ps_tbl SET expected_hours = 0 WHERE expected_hours < 0");
            $zero_steps = $wpdb->get_results(
                "SELECT s.id, s.step_name, i.product_id, i.quantity
                 FROM $is_tbl s
                 INNER JOIN $oi_tbl i ON i.id = s.order_item_id
                 WHERE (s.expected_hours IS NULL OR s.expected_hours = 0)
                   AND s.is_delivery != 1",
                ARRAY_A
            );
            foreach ($zero_steps as $step) {
                $ps = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $ps_tbl WHERE product_id=%d AND step_name=%s LIMIT 1",
                    (int)$step['product_id'], $step['step_name']
                ), ARRAY_A);
                if (!$ps || (float)$ps['expected_hours'] <= 0) continue;
                $qty   = max(1, (int)$step['quantity']);
                $qpu   = max(1, (int)($ps['qty_per_unit'] ?? 1));
                $hrs   = (float)$ps['expected_hours'];
                $final = !empty($ps['scales_with_qty']) ? $hrs * ($qty / $qpu) : $hrs;
                $wpdb->update($is_tbl, ['expected_hours' => $final], ['id' => (int)$step['id']]);
            }
            // Recalc expected_hours_total on all orders
            $order_ids = $wpdb->get_col("SELECT DISTINCT i.order_id FROM $oi_tbl i INNER JOIN $is_tbl s ON s.order_item_id = i.id");
            foreach ($order_ids as $oid) {
                $total = (float)$wpdb->get_var($wpdb->prepare(
                    "SELECT SUM(s.expected_hours) FROM $is_tbl s INNER JOIN $oi_tbl i ON i.id = s.order_item_id WHERE i.order_id=%d AND s.is_delivery!=1",
                    (int)$oid
                ));
                $wpdb->update(self::tbl('orders'), ['expected_hours_total' => $total], ['id' => (int)$oid]);
            }
            update_option('cspsr_fixed_expected_hours_v4', 1);
        }
    }

    // ── Install all tables ────────────────────────────────────────────────────
    public static function install() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $charset_collate = $charset;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // roles
        dbDelta("CREATE TABLE " . self::tbl('roles') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            color varchar(20) DEFAULT '#6366f1',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // departments
        dbDelta("CREATE TABLE " . self::tbl('departments') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            color varchar(20) DEFAULT '#0ea5e9',
            sort_order int DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // Add sort_order to departments if missing
        $dept_tbl = self::tbl('departments');
        $dept_so = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'sort_order'");
        if (empty($dept_so)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN sort_order int DEFAULT 0 AFTER color"); }
        // Add name_en to departments if missing
        $dept_ne = $wpdb->get_results("SHOW COLUMNS FROM $dept_tbl LIKE 'name_en'");
        if (empty($dept_ne)) { $wpdb->query("ALTER TABLE $dept_tbl ADD COLUMN name_en varchar(191) DEFAULT '' AFTER name"); }

        // teams
        dbDelta("CREATE TABLE " . self::tbl('teams') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            department_id bigint(20) UNSIGNED DEFAULT NULL,
            lead_employee_id bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // customers
        dbDelta("CREATE TABLE " . self::tbl('customers') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            company_name varchar(191) DEFAULT '',
            phone varchar(50) DEFAULT '',
            phone_alt varchar(50) DEFAULT '',
            address text DEFAULT NULL,
            map_url text DEFAULT NULL,
            lat varchar(50) DEFAULT NULL,
            lng varchar(50) DEFAULT NULL,
            delivery_notes text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // customer_recipients
        dbDelta("CREATE TABLE " . self::tbl('customer_recipients') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            customer_id bigint(20) UNSIGNED NOT NULL,
            name varchar(191) NOT NULL,
            phone varchar(50) DEFAULT '',
            address text DEFAULT NULL,
            map_url text DEFAULT NULL,
            lat varchar(50) DEFAULT NULL,
            lng varchar(50) DEFAULT NULL,
            delivery_notes text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // production_step_library (global reusable steps)
        dbDelta("CREATE TABLE " . self::tbl('production_step_library') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            step_name varchar(191) NOT NULL,
            step_name_en varchar(191) DEFAULT '',
            default_employee_id bigint(20) UNSIGNED DEFAULT NULL,
            default_team_id bigint(20) UNSIGNED DEFAULT NULL,
            default_role_id bigint(20) UNSIGNED DEFAULT NULL,
            default_minutes int DEFAULT 0,
            show_in_prds tinyint(1) DEFAULT 1,
            is_external tinyint(1) DEFAULT 0,
            is_delivery tinyint(1) DEFAULT 0,
            delivery_direction varchar(32) DEFAULT 'delivered_to_client',
            sort_order int DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // customer_contacts (persons responsible for orders, client-side)
        dbDelta("CREATE TABLE " . self::tbl('customer_contacts') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            customer_id bigint(20) UNSIGNED NOT NULL,
            name varchar(191) NOT NULL,
            job_title varchar(191) DEFAULT '',
            phone varchar(50) DEFAULT '',
            email varchar(191) DEFAULT '',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // employees
        dbDelta("CREATE TABLE " . self::tbl('employees') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            role_id bigint(20) UNSIGNED DEFAULT NULL,
            department_id bigint(20) UNSIGNED DEFAULT NULL,
            team_id bigint(20) UNSIGNED DEFAULT NULL,
            phone varchar(50) DEFAULT '',
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // statuses
        dbDelta("CREATE TABLE " . self::tbl('statuses') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            slug varchar(100) NOT NULL,
            color varchar(20) DEFAULT '#6b7280',
            sort_order int DEFAULT 0,
            is_done tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) $charset;");

        // products
        dbDelta("CREATE TABLE " . self::tbl('products') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            sku varchar(100) DEFAULT '',
            description text DEFAULT NULL,
            estimated_hours decimal(6,2) DEFAULT 0,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // product_steps (template)
        dbDelta("CREATE TABLE " . self::tbl('product_steps') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id bigint(20) UNSIGNED NOT NULL,
            step_name varchar(191) NOT NULL,
            step_order int DEFAULT 0,
            assigned_employee_id bigint(20) UNSIGNED DEFAULT NULL,
            assigned_employee_ids text DEFAULT NULL,
            assigned_team_id bigint(20) UNSIGNED DEFAULT NULL,
            assigned_team_ids text DEFAULT NULL,
            assigned_role_id bigint(20) UNSIGNED DEFAULT NULL,
            status_slug varchar(100) DEFAULT 'pending',
            expected_hours decimal(6,2) DEFAULT 0,
            show_in_prds tinyint(1) DEFAULT 0,
            is_external tinyint(1) DEFAULT 0,
            is_delivery tinyint(1) DEFAULT 0,
            delivery_direction varchar(32) DEFAULT 'delivered_to_client',
            scales_with_qty tinyint(1) DEFAULT 0,
            qty_per_unit int DEFAULT 1,
            supplier_id bigint(20) UNSIGNED DEFAULT NULL,
            ext_send_at datetime DEFAULT NULL,
            ext_receive_expected datetime DEFAULT NULL,
            ext_receive_actual datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // orders
        dbDelta("CREATE TABLE " . self::tbl('orders') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_number varchar(100) NOT NULL,
            customer_id bigint(20) UNSIGNED DEFAULT NULL,
            recipient_id bigint(20) UNSIGNED DEFAULT NULL,
            delivery_address text DEFAULT NULL,
            delivery_map_url text DEFAULT NULL,
            delivery_notes text DEFAULT NULL,
            priority varchar(20) DEFAULT 'normal',
            is_urgent tinyint(1) DEFAULT 0,
            is_done tinyint(1) DEFAULT 0,
            deadline datetime DEFAULT NULL,
            entered_at datetime DEFAULT NULL,
            customer_deadline_at datetime DEFAULT NULL,
            requested_delivery_at datetime DEFAULT NULL,
            production_started_at datetime DEFAULT NULL,
            ready_at datetime DEFAULT NULL,
            internal_ready_at datetime DEFAULT NULL,
            dispatch_due_at datetime DEFAULT NULL,
            delivery_planned_at datetime DEFAULT NULL,
            delivery_ready_at datetime DEFAULT NULL,
            delivered_at datetime DEFAULT NULL,
            closed_at datetime DEFAULT NULL,
            delivery_status varchar(50) DEFAULT 'pending',
            delivery_attempt_count int DEFAULT 0,
            delivery_hold_reason text DEFAULT NULL,
            delivery_buffer_minutes int DEFAULT 60,
            schedule_anchor_at datetime DEFAULT NULL,
            last_event_at datetime DEFAULT NULL,
            kpi_snapshot longtext DEFAULT NULL,
            status_slug varchar(100) DEFAULT 'pending',
            current_step_label varchar(255) DEFAULT '',
            expected_hours_total decimal(8,2) DEFAULT 0,
            actual_hours_total decimal(8,2) DEFAULT 0,
            variance_hours decimal(8,2) DEFAULT 0,
            started_at datetime DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY order_number (order_number)
        ) $charset;");

        // order_items
        dbDelta("CREATE TABLE " . self::tbl('order_items') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            product_id bigint(20) UNSIGNED DEFAULT NULL,
            product_name varchar(191) NOT NULL,
            product_name_en varchar(191) DEFAULT '',
            quantity int DEFAULT 1,
            notes text DEFAULT NULL,
            is_ready_for_delivery tinyint(1) DEFAULT 0,
            ready_for_delivery_at datetime DEFAULT NULL,
            is_delivered tinyint(1) DEFAULT 0,
            delivered_at datetime DEFAULT NULL,
            delivery_batch_id bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('delivery_batches') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            batch_no int NOT NULL DEFAULT 1,
            status varchar(50) NOT NULL DEFAULT 'queued',
            notes text DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            delivered_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY status (status)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('delivery_batch_items') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            batch_id bigint(20) UNSIGNED NOT NULL,
            order_item_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY batch_item (batch_id, order_item_id),
            KEY order_item_id (order_item_id)
        ) $charset;");

        // item_steps (execution snapshot)
        dbDelta("CREATE TABLE " . self::tbl('item_steps') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_item_id bigint(20) UNSIGNED NOT NULL,
            step_name varchar(191) NOT NULL,
            step_order int DEFAULT 0,
            assigned_employee_id bigint(20) UNSIGNED DEFAULT NULL,
            assigned_employee_ids text DEFAULT NULL,
            assigned_team_id bigint(20) UNSIGNED DEFAULT NULL,
            assigned_team_ids text DEFAULT NULL,
            assigned_role_id bigint(20) UNSIGNED DEFAULT NULL,
            status_slug varchar(100) DEFAULT 'pending',
            expected_hours decimal(6,2) DEFAULT 0,
            planned_start_at datetime DEFAULT NULL,
            planned_due_at datetime DEFAULT NULL,
            actual_started_at datetime DEFAULT NULL,
            actual_completed_at datetime DEFAULT NULL,
            expected_duration_minutes int DEFAULT 0,
            actual_duration_minutes int DEFAULT 0,
            queue_wait_minutes int DEFAULT 0,
            last_event_at datetime DEFAULT NULL,
            show_in_prds tinyint(1) DEFAULT 0,
            is_external tinyint(1) DEFAULT 0,
            is_delivery tinyint(1) DEFAULT 0,
            delivery_direction varchar(32) DEFAULT 'delivered_to_client',
            scales_with_qty tinyint(1) DEFAULT 0,
            qty_per_unit int DEFAULT 1,
            supplier_id bigint(20) UNSIGNED DEFAULT NULL,
            ext_send_at datetime DEFAULT NULL,
            ext_receive_expected datetime DEFAULT NULL,
            ext_receive_actual datetime DEFAULT NULL,
            notes text DEFAULT NULL,
            started_at datetime DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // notifications
        dbDelta("CREATE TABLE " . self::tbl('notifications') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            title varchar(255) NOT NULL,
            body text DEFAULT NULL,
            type varchar(50) DEFAULT 'info',
            sound varchar(50) DEFAULT NULL,
            sound_url text DEFAULT NULL,
            is_read tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset;");

        // push devices (FCM tokens)
        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('push_devices') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            token varchar(512) NOT NULL,
            platform varchar(40) DEFAULT 'web',
            device_label varchar(120) DEFAULT NULL,
            is_disabled tinyint(1) DEFAULT 0,
            last_seen_at datetime DEFAULT CURRENT_TIMESTAMP,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY token (token),
            KEY user_id (user_id),
            KEY is_disabled (is_disabled)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('order_events') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            step_id bigint(20) UNSIGNED DEFAULT NULL,
            attempt_id bigint(20) UNSIGNED DEFAULT NULL,
            event_type varchar(100) NOT NULL,
            event_time datetime NOT NULL,
            payload longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY event_type (event_type),
            KEY event_time (event_time)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('step_events') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            step_id bigint(20) UNSIGNED NOT NULL,
            order_id bigint(20) UNSIGNED DEFAULT NULL,
            event_type varchar(100) NOT NULL,
            event_time datetime NOT NULL,
            payload longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY step_id (step_id),
            KEY order_id (order_id),
            KEY event_type (event_type)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('delivery_attempts') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id bigint(20) UNSIGNED NOT NULL,
            attempt_no int NOT NULL DEFAULT 1,
            planned_at datetime DEFAULT NULL,
            dispatch_at datetime DEFAULT NULL,
            arrived_at datetime DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            status varchar(50) DEFAULT 'scheduled',
            failure_reason varchar(191) DEFAULT '',
            notes text DEFAULT NULL,
            customer_response varchar(191) DEFAULT '',
            next_attempt_at datetime DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY status (status)
        ) $charset;");

        // suppliers (مجهزين خارجيين)
        dbDelta("CREATE TABLE IF NOT EXISTS " . self::tbl('suppliers') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL DEFAULT '',
            name_en varchar(191) DEFAULT '',
            phone varchar(50) DEFAULT '',
            phone_alt varchar(50) DEFAULT '',
            map_url text DEFAULT NULL,
            notes text DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // Add supplier_id to production_step_library if missing
        $sl_sup = self::tbl('production_step_library');
        $sup_col = $wpdb->get_results("SHOW COLUMNS FROM $sl_sup LIKE 'supplier_id'");
        if (empty($sup_col)) { $wpdb->query("ALTER TABLE $sl_sup ADD COLUMN supplier_id bigint(20) UNSIGNED DEFAULT NULL AFTER is_delivery"); }

        // Add supplier_id to product_steps if missing
        $ps_sup = self::tbl('product_steps');
        $sup_col2 = $wpdb->get_results("SHOW COLUMNS FROM $ps_sup LIKE 'supplier_id'");
        if (empty($sup_col2)) { $wpdb->query("ALTER TABLE $ps_sup ADD COLUMN supplier_id bigint(20) UNSIGNED DEFAULT NULL AFTER is_delivery"); }

        // Add supplier_id to item_steps if missing
        $is_sup = self::tbl('item_steps');
        $sup_col3 = $wpdb->get_results("SHOW COLUMNS FROM $is_sup LIKE 'supplier_id'");
        if (empty($sup_col3)) { $wpdb->query("ALTER TABLE $is_sup ADD COLUMN supplier_id bigint(20) UNSIGNED DEFAULT NULL AFTER is_delivery"); }

        // ── Auth: app users (independent of WordPress) ──────────────────────
        dbDelta("CREATE TABLE " . self::tbl('app_users') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(191) NOT NULL,
            username varchar(100) NOT NULL,
            password_hash varchar(255) NOT NULL,
            role varchar(20) DEFAULT 'user',
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY username (username)
        ) $charset;");

        // ── Auth: tokens (session management) ───────────────────────────────
        dbDelta("CREATE TABLE " . self::tbl('app_tokens') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            token varchar(64) NOT NULL,
            expires_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY token (token)
        ) $charset;");

        // ── Auth: permissions per user ───────────────────────────────────────
        // key examples: orders.view, orders.create, orders.edit, orders.delete
        //               customers.view, products.view, steps.طباعة, steps.سلفنة ...
        dbDelta("CREATE TABLE " . self::tbl('app_permissions') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            perm_key varchar(191) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY user_perm (user_id, perm_key)
        ) $charset;");

        // ── Operations: task stages (kanban columns per department) ──────────
        dbDelta("CREATE TABLE " . self::tbl('ops_stages') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            department_id bigint(20) UNSIGNED NOT NULL,
            name varchar(191) NOT NULL,
            sort_order int DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;");

        // ── Operations: company-wide tasks ───────────────────────────────────
        dbDelta("CREATE TABLE " . self::tbl('ops_tasks') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            task_no varchar(50) NOT NULL,
            linked_order_id bigint(20) UNSIGNED DEFAULT NULL,
            customer_id bigint(20) UNSIGNED NOT NULL,
            contact_person_id bigint(20) UNSIGNED DEFAULT NULL,
            product_id bigint(20) UNSIGNED DEFAULT NULL,
            assigned_employee_id bigint(20) UNSIGNED DEFAULT NULL,
            description text DEFAULT NULL,
            deadline datetime DEFAULT NULL,
            time varchar(50) DEFAULT '',
            completed_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY task_no (task_no)
        ) $charset;");

        // ── Operations: task position in kanban (department + stage) ─────────
        dbDelta("CREATE TABLE " . self::tbl('ops_task_positions') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            task_id bigint(20) UNSIGNED NOT NULL,
            department_id bigint(20) UNSIGNED NOT NULL,
            stage_id bigint(20) UNSIGNED DEFAULT NULL,
            sort_order int DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY task_dept (task_id, department_id)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('ops_task_events') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            task_id bigint(20) UNSIGNED NOT NULL,
            event_type varchar(100) NOT NULL,
            event_time datetime NOT NULL,
            payload longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY task_id (task_id),
            KEY event_type (event_type),
            KEY event_time (event_time)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('employee_leaves') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) UNSIGNED NOT NULL,
            leave_start date NOT NULL,
            leave_end date NOT NULL,
            reason text DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY employee_id (employee_id),
            KEY leave_window (leave_start, leave_end)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('employee_leave_reassignments') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            leave_id bigint(20) UNSIGNED NOT NULL,
            scope_key varchar(191) NOT NULL,
            department_id bigint(20) UNSIGNED DEFAULT NULL,
            replacement_employee_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY leave_id (leave_id),
            KEY scope_key (scope_key)
        ) $charset;");

        dbDelta("CREATE TABLE " . self::tbl('employee_points') . " (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) UNSIGNED NOT NULL,
            points int NOT NULL DEFAULT 0,
            reason_code varchar(64) NOT NULL DEFAULT '',
            reason_label varchar(191) DEFAULT '',
            order_id bigint(20) UNSIGNED DEFAULT NULL,
            order_item_id bigint(20) UNSIGNED DEFAULT NULL,
            step_id bigint(20) UNSIGNED DEFAULT NULL,
            ops_task_id bigint(20) UNSIGNED DEFAULT NULL,
            event_at datetime DEFAULT CURRENT_TIMESTAMP,
            meta longtext DEFAULT NULL,
            created_by bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY employee_id (employee_id),
            KEY reason_code (reason_code),
            KEY order_id (order_id),
            KEY step_id (step_id),
            KEY ops_task_id (ops_task_id),
            KEY event_at (event_at)
        ) $charset;");

        self::seed_defaults();
        self::ensure_archive_tables();
    }

    // ── Default seed data ─────────────────────────────────────────────────────
    private static function seed_defaults() {
        global $wpdb;

        // Statuses
        $statuses_tbl = self::tbl('statuses');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM $statuses_tbl")) {
            $statuses = [
                ['name' => 'قيد الانتظار',    'slug' => 'pending',     'color' => '#6b7280', 'sort_order' => 1,  'is_done' => 0],
                ['name' => 'قيد التنفيذ',     'slug' => 'in_progress', 'color' => '#3b82f6', 'sort_order' => 2,  'is_done' => 0],
                ['name' => 'مراجعة',          'slug' => 'review',      'color' => '#f59e0b', 'sort_order' => 3,  'is_done' => 0],
                ['name' => 'جاهز للتسليم',   'slug' => 'ready',       'color' => '#10b981', 'sort_order' => 4,  'is_done' => 0],
                ['name' => 'مكتمل',           'slug' => 'done',        'color' => '#22c55e', 'sort_order' => 5,  'is_done' => 1],
                ['name' => 'ملغي',            'slug' => 'cancelled',   'color' => '#ef4444', 'sort_order' => 6,  'is_done' => 1],
            ];
            foreach ($statuses as $s) {
                $wpdb->insert($statuses_tbl, $s);
            }
        }

        // Roles
        $roles_tbl = self::tbl('roles');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM $roles_tbl")) {
            $roles = [
                ['name' => 'مصمم',   'color' => '#8b5cf6'],
                ['name' => 'طباعة', 'color' => '#0ea5e9'],
                ['name' => 'تشطيب', 'color' => '#f59e0b'],
                ['name' => 'توصيل', 'color' => '#10b981'],
                ['name' => 'إدارة', 'color' => '#ef4444'],
            ];
            foreach ($roles as $r) {
                $wpdb->insert($roles_tbl, $r);
            }
        }

        // Departments
        $dept_tbl = self::tbl('departments');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM $dept_tbl")) {
            $depts = [
                ['name' => 'تصميم',     'color' => '#8b5cf6'],
                ['name' => 'طباعة',    'color' => '#0ea5e9'],
                ['name' => 'تشطيب',   'color' => '#f59e0b'],
                ['name' => 'لوجستيات', 'color' => '#10b981'],
            ];
            foreach ($depts as $d) {
                $wpdb->insert($dept_tbl, $d);
            }
        }

        // Default admin user
        $users_tbl = self::tbl('app_users');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM $users_tbl")) {
            $wpdb->insert($users_tbl, [
                'name'          => 'المدير',
                'username'      => 'admin',
                'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
                'role'          => 'admin',
                'is_active'     => 1,
            ]);
        }
    }
}
