<?php
defined('ABSPATH') || exit;

class CSPSR_REST {

    const NS = 'cspsr/v1';

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static function ok($data)  { return new WP_REST_Response($data, 200); }
    private static function created($data) { return new WP_REST_Response($data, 201); }
    private static function err($msg, $code = 400) { return new WP_Error('cspsr_error', $msg, ['status' => $code]); }
    public static function auth_perm($request) {
        if (!class_exists('CSPSR_Auth')) return self::err('Authentication unavailable', 500);
        return CSPSR_Auth::auth_permission($request);
    }
    public static function admin_perm_check($request) {
        if (!class_exists('CSPSR_Auth')) return self::err('Authentication unavailable', 500);
        return CSPSR_Auth::admin_permission($request);
    }
    private static function public_perm() { return '__return_true'; }
    private static function perm() { return [__CLASS__, 'auth_perm']; }
    private static function admin_perm() { return [__CLASS__, 'admin_perm_check']; }
    private static function int_arg() { return ['validate_callback' => fn($v) => is_numeric($v)]; }

    private static function tbl($n) { return CSPSR_DB::tbl($n); }

    private static function now() { return current_time('mysql'); }

    private static function has_column($table, $column) {
        global $wpdb;
        return !empty($wpdb->get_results("SHOW COLUMNS FROM $table LIKE '$column'"));
    }

    private static function as_json($value) {
        if (is_string($value)) return $value;
        return wp_json_encode($value, JSON_UNESCAPED_UNICODE);
    }

    private static function dt($value) {
        if ($value === null || $value === '') return null;
        $ts = is_numeric($value) ? (int)$value : strtotime((string)$value);
        if (!$ts) return null;
        return gmdate('Y-m-d H:i:s', $ts + (get_option('gmt_offset', 0) * HOUR_IN_SECONDS));
    }

    private static function minutes_between($from, $to) {
        $a = $from ? strtotime((string)$from) : false;
        $b = $to ? strtotime((string)$to) : false;
        if (!$a || !$b) return 0;
        return (int) max(0, round(($b - $a) / 60));
    }

    private static function wp_tz() {
        if (function_exists('wp_timezone')) return wp_timezone();
        $tz = get_option('timezone_string');
        if ($tz) {
            try { return new DateTimeZone($tz); } catch (Throwable $e) {}
        }
        return new DateTimeZone('UTC');
    }

    private static function dt_obj($value) {
        if ($value === null || $value === '') return null;
        try {
            return new DateTimeImmutable((string)$value, self::wp_tz());
        } catch (Throwable $e) {
            return null;
        }
    }

    private static function hm_to_minutes($value) {
        $value = trim((string)$value);
        if (!preg_match('/^(\d{1,2}):(\d{2})$/', $value, $m)) return null;
        $h = (int)$m[1];
        $i = (int)$m[2];
        if ($h < 0 || $h > 23 || $i < 0 || $i > 59) return null;
        return ($h * 60) + $i;
    }

    private static function normalize_working_days($value) {
        if (is_array($value)) {
            $days = $value;
        } else {
            $raw = trim((string)$value);
            if ($raw === '') return [0,1,2,3,4,5,6];
            $decoded = json_decode($raw, true);
            $days = is_array($decoded) ? $decoded : preg_split('/[\s,|]+/', $raw);
        }
        $out = [];
        foreach ((array)$days as $day) {
            if ($day === '' || $day === null) continue;
            $i = (int)$day;
            if ($i >= 0 && $i <= 6) $out[$i] = $i;
        }
        if (empty($out)) return [0,1,2,3,4,5,6];
        ksort($out);
        return array_values($out);
    }

    private static function normalize_holidays($value) {
        if (is_array($value)) {
            $days = $value;
        } else {
            $raw = trim((string)$value);
            if ($raw === '') return [];
            $decoded = json_decode($raw, true);
            $days = is_array($decoded) ? $decoded : preg_split('/[\r\n,;]+/', $raw);
        }
        $out = [];
        foreach ((array)$days as $day) {
            $day = trim((string)$day);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) $out[$day] = $day;
        }
        ksort($out);
        return array_values($out);
    }

    private static function table_exists($table) {
        global $wpdb;
        return (bool) $wpdb->get_var("SHOW TABLES LIKE '$table'");
    }

    private static function pagination_params($request, $default_per_page = 25, $max_per_page = 200) {
        $page = (int) ($request ? $request->get_param('page') : 1);
        $per_page = (int) ($request ? $request->get_param('per_page') : $default_per_page);
        if ($page < 1) $page = 1;
        if ($per_page < 1) $per_page = $default_per_page;
        $per_page = min(max(1, $per_page), $max_per_page);
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => ($page - 1) * $per_page,
        ];
    }

    private static function paged_payload($items, $page, $per_page, $total) {
        $total = max(0, (int) $total);
        $per_page = max(1, (int) $per_page);
        return [
            'items' => array_values((array) $items),
            'meta' => [
                'page' => max(1, (int) $page),
                'per_page' => $per_page,
                'total' => $total,
                'total_pages' => max(1, (int) ceil($total / $per_page)),
            ],
        ];
    }
    private static function reschedule_open_orders() {
        global $wpdb;
        $open_order_ids = $wpdb->get_col("SELECT id FROM " . self::tbl('orders') . " WHERE COALESCE(is_done,0) != 1");
        foreach (($open_order_ids ?: []) as $oid) {
            self::schedule_order((int) $oid);
            self::sync_order_lifecycle((int) $oid);
        }
    }

    private static function supplier_work_window($supplier_id) {
        global $wpdb;
        $supplier_id = (int)$supplier_id;
        if (!$supplier_id) return null;
        $tbl = self::tbl('suppliers');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return null;
        $row = $wpdb->get_row($wpdb->prepare("SELECT workday_start, workday_end, working_days, holidays FROM $tbl WHERE id=%d", $supplier_id), ARRAY_A);
        if (!$row) return null;
        $start = self::hm_to_minutes($row['workday_start'] ?? '');
        $end = self::hm_to_minutes($row['workday_end'] ?? '');
        if ($start === null || $end === null || $end <= $start) return null;
        return [
            'start' => $start,
            'end' => $end,
            'working_days' => self::normalize_working_days($row['working_days'] ?? ''),
            'holidays' => self::normalize_holidays($row['holidays'] ?? ''),
        ];
    }

    private static function company_work_window() {
        $start = self::hm_to_minutes(get_option('cspsr_company_workday_start', '09:00'));
        $end = self::hm_to_minutes(get_option('cspsr_company_workday_end', '17:00'));
        if ($start === null || $end === null || $end <= $start) {
            $start = self::hm_to_minutes('09:00');
            $end = self::hm_to_minutes('17:00');
        }
        return [
            'start' => $start,
            'end' => $end,
            'working_days' => self::normalize_working_days(get_option('cspsr_company_working_days', [0,1,2,3,4,5,6])),
            'holidays' => self::normalize_holidays(get_option('cspsr_company_holidays', [])),
        ];
    }

    private static function row_work_window($row, $fallback = null) {
        $base = is_array($fallback) ? $fallback : self::company_work_window();
        if (!is_array($row) || !$row) return $base;
        $start = self::hm_to_minutes($row['workday_start'] ?? '');
        $end = self::hm_to_minutes($row['workday_end'] ?? '');
        if ($start === null || $end === null || $end <= $start) {
            $start = $base['start'];
            $end = $base['end'];
        }
        $days = self::normalize_working_days($row['working_days'] ?? $base['working_days']);
        $holidays = self::normalize_holidays($row['holidays'] ?? $base['holidays']);
        return [
            'start' => $start,
            'end' => $end,
            'working_days' => $days,
            'holidays' => $holidays,
        ];
    }

    private static function team_work_window($team_id) {
        global $wpdb;
        $team_id = (int) $team_id;
        $fallback = self::company_work_window();
        if ($team_id <= 0) return $fallback;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT workday_start, workday_end, working_days, holidays FROM " . self::tbl('teams') . " WHERE id=%d LIMIT 1",
            $team_id
        ), ARRAY_A);
        return self::row_work_window($row ?: [], $fallback);
    }

    private static function employee_work_window($employee_id) {
        global $wpdb;
        $employee_id = (int) $employee_id;
        $fallback = self::company_work_window();
        if ($employee_id <= 0) return $fallback;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT team_id, workday_start, workday_end, working_days, holidays FROM " . self::tbl('employees') . " WHERE id=%d LIMIT 1",
            $employee_id
        ), ARRAY_A);
        if (!$row) return $fallback;
        $window = self::row_work_window($row, self::team_work_window((int) ($row['team_id'] ?? 0)));
        $window['holidays'] = array_values(array_unique(array_merge(
            (array) ($window['holidays'] ?? []),
            self::employee_leave_holiday_dates($employee_id)
        )));
        return $window;
    }

    private static function employee_leave_holiday_dates($employee_id) {
        global $wpdb;
        $employee_id = (int) $employee_id;
        if ($employee_id <= 0) return [];
        $tbl = self::tbl('employee_leaves');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return [];
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT leave_start, leave_end FROM $tbl WHERE employee_id=%d AND is_active=1",
            $employee_id
        ), ARRAY_A);
        $out = [];
        foreach ((array) $rows as $row) {
            $start = !empty($row['leave_start']) ? DateTimeImmutable::createFromFormat('Y-m-d', substr((string) $row['leave_start'], 0, 10)) : false;
            $end = !empty($row['leave_end']) ? DateTimeImmutable::createFromFormat('Y-m-d', substr((string) $row['leave_end'], 0, 10)) : false;
            if (!$start || !$end) continue;
            if ($end < $start) {
                $tmp = $start;
                $start = $end;
                $end = $tmp;
            }
            $cursor = $start;
            for ($guard = 0; $guard < 370 && $cursor <= $end; $guard++) {
                $out[] = $cursor->format('Y-m-d');
                $cursor = $cursor->modify('+1 day');
            }
        }
        return array_values(array_unique($out));
    }

    private static function internal_work_window($employee_id = 0, $team_id = 0) {
        $employee_id = (int) $employee_id;
        $team_id = (int) $team_id;
        if ($employee_id > 0) return self::employee_work_window($employee_id);
        if ($team_id > 0) return self::team_work_window($team_id);
        return self::company_work_window();
    }

    private static function is_window_business_day(DateTimeImmutable $day, $window) {
        $weekday = (int) $day->format('w');
        $ymd = $day->format('Y-m-d');
        return in_array($weekday, (array) ($window['working_days'] ?? []), true)
            && !in_array($ymd, (array) ($window['holidays'] ?? []), true);
    }

    private static function window_day_start(DateTimeImmutable $day, $window) {
        return $day->setTime((int) floor(((int) $window['start']) / 60), ((int) $window['start']) % 60, 0);
    }

    private static function window_day_end(DateTimeImmutable $day, $window) {
        return $day->setTime((int) floor(((int) $window['end']) / 60), ((int) $window['end']) % 60, 0);
    }

    private static function business_minutes_between_window($from, $to, $window) {
        $start = self::dt_obj($from);
        $end = self::dt_obj($to);
        if (!$start || !$end || !is_array($window)) return 0;
        if ($end <= $start) return 0;

        $dayCursor = $start->setTime(0, 0, 0);
        $endDay = $end->setTime(0, 0, 0);
        $total = 0;

        while ($dayCursor <= $endDay) {
            if (!self::is_window_business_day($dayCursor, $window)) {
                $dayCursor = $dayCursor->modify('+1 day');
                continue;
            }
            $workStart = self::window_day_start($dayCursor, $window);
            $workEnd = self::window_day_end($dayCursor, $window);
            $segStart = $start > $workStart ? $start : $workStart;
            $segEnd = $end < $workEnd ? $end : $workEnd;
            if ($segEnd > $segStart) {
                $total += (int) round(($segEnd->getTimestamp() - $segStart->getTimestamp()) / 60);
            }
            $dayCursor = $dayCursor->modify('+1 day');
        }

        return max(0, $total);
    }

    private static function align_window_forward($value, $window) {
        $dt = self::dt_obj($value);
        if (!$dt || !is_array($window)) return null;
        $cursor = $dt;
        for ($guard = 0; $guard < 370; $guard++) {
            $day = $cursor->setTime(0, 0, 0);
            if (!self::is_window_business_day($day, $window)) {
                $cursor = $day->modify('+1 day');
                continue;
            }
            $workStart = self::window_day_start($day, $window);
            $workEnd = self::window_day_end($day, $window);
            if ($cursor < $workStart) return $workStart;
            if ($cursor <= $workEnd) return $cursor;
            $cursor = $day->modify('+1 day');
        }
        return $dt;
    }

    private static function align_window_backward($value, $window) {
        $dt = self::dt_obj($value);
        if (!$dt || !is_array($window)) return null;
        $cursor = $dt;
        for ($guard = 0; $guard < 370; $guard++) {
            $day = $cursor->setTime(0, 0, 0);
            if (!self::is_window_business_day($day, $window)) {
                $cursor = $day->modify('-1 day')->setTime(23, 59, 59);
                continue;
            }
            $workStart = self::window_day_start($day, $window);
            $workEnd = self::window_day_end($day, $window);
            if ($cursor > $workEnd) return $workEnd;
            if ($cursor >= $workStart) return $cursor;
            $cursor = $day->modify('-1 day')->setTime(23, 59, 59);
        }
        return $dt;
    }

    private static function subtract_business_minutes_window($to, $minutes, $window) {
        $minutes = (int) $minutes;
        $cursor = self::align_window_backward($to, $window);
        if (!$cursor || !is_array($window)) return self::dt($to);
        if ($minutes <= 0) return $cursor->format('Y-m-d H:i:s');

        while ($minutes > 0) {
            $day = $cursor->setTime(0, 0, 0);
            if (!self::is_window_business_day($day, $window)) {
                $cursor = self::align_window_backward($day->modify('-1 second')->format('Y-m-d H:i:s'), $window);
                if (!$cursor) break;
                continue;
            }
            $workStart = self::window_day_start($day, $window);
            $workEnd = self::window_day_end($day, $window);
            $segmentEnd = $cursor < $workEnd ? $cursor : $workEnd;
            if ($segmentEnd <= $workStart) {
                $cursor = self::align_window_backward($day->modify('-1 second')->format('Y-m-d H:i:s'), $window);
                if (!$cursor) break;
                continue;
            }
            $available = (int) floor(($segmentEnd->getTimestamp() - $workStart->getTimestamp()) / 60);
            if ($minutes <= $available) {
                return $segmentEnd->modify('-' . $minutes . ' minutes')->format('Y-m-d H:i:s');
            }
            $minutes -= $available;
            $cursor = self::align_window_backward($day->modify('-1 second')->format('Y-m-d H:i:s'), $window);
            if (!$cursor) break;
        }

        return $cursor ? $cursor->format('Y-m-d H:i:s') : self::dt($to);
    }

    private static function step_work_window($step) {
        if (!empty($step['is_external'])) {
            $supplier_id = !empty($step['supplier_id']) ? (int) $step['supplier_id'] : 0;
            return self::supplier_work_window($supplier_id) ?: self::company_work_window();
        }
        return self::internal_work_window(
            (int) ($step['assigned_employee_id'] ?? 0),
            (int) ($step['assigned_team_id'] ?? 0)
        );
    }

    private static function business_minutes_between($from, $to, $supplier_id = 0) {
        $start = self::dt_obj($from);
        $end = self::dt_obj($to);
        if (!$start || !$end) return 0;
        if ($end <= $start) return 0;

        $window = self::supplier_work_window($supplier_id);
        if (!$window) return self::minutes_between($from, $to);
        return self::business_minutes_between_window($from, $to, $window);
    }

    private static function duration_minutes_from_step($step) {
        $mins = (int)($step['expected_duration_minutes'] ?? 0);
        if ($mins > 0) return $mins;
        $hours = (float)($step['expected_hours'] ?? 0);
        return (int) max(0, round($hours * 60));
    }

    private static function product_step_supplier($product_id, $step_name, $step_name_en = '') {
        global $wpdb;
        $product_id = (int) $product_id;
        $step_name = trim((string) $step_name);
        $step_name_en = trim((string) $step_name_en);
        if (!$product_id) return null;
        $row = null;
        if ($step_name !== '' || $step_name_en !== '') {
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT supplier_id FROM " . self::tbl('product_steps') . " WHERE product_id = %d AND (step_name = %s OR step_name_en = %s) LIMIT 1",
                $product_id,
                $step_name,
                $step_name_en
            ), ARRAY_A);
        }
        if (!$row) {
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT supplier_id FROM " . self::tbl('product_steps') . " WHERE product_id = %d AND is_external = 1 ORDER BY step_order ASC, id ASC LIMIT 1",
                $product_id
            ), ARRAY_A);
        }
        if ($row && !empty($row['supplier_id'])) return (int) $row['supplier_id'];
        return self::step_library_supplier($step_name, $step_name_en);
    }

    private static function step_library_supplier($step_name, $step_name_en = '') {
        global $wpdb;
        $step_name = trim((string) $step_name);
        $step_name_en = trim((string) $step_name_en);
        if ($step_name === '' && $step_name_en === '') return null;
        $tbl = self::tbl('production_step_library');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return null;
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT supplier_id FROM $tbl WHERE (step_name = %s OR step_name_en = %s) AND is_external = 1 LIMIT 1",
                $step_name,
                $step_name_en
            ),
            ARRAY_A
        );
        if (!$row || empty($row['supplier_id'])) return null;
        return (int) $row['supplier_id'];
    }

    private static function json_array($value) {
        if (is_array($value)) return $value;
        if (!is_string($value) || $value === '') return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function repair_step_from_events($step, $events) {
        $events = is_array($events) ? $events : [];
        if (empty($events)) return $step;

        usort($events, function($a, $b){
            return strcmp((string)($a['event_time'] ?? ''), (string)($b['event_time'] ?? ''));
        });

        $step_tbl = self::tbl('item_steps');
        $step_id = (int)($step['id'] ?? 0);

        $started = null;
        $auto_started = null;
        $completed = $step['actual_completed_at'] ?? ($step['completed_at'] ?? null);
        $paused_seconds = (int)($step['paused_seconds'] ?? 0);
        $last_pause_at = !empty($step['paused_at']) ? $step['paused_at'] : null;
        $has_manual_start = false;
        $has_auto_start = false;
        $has_completion = false;
        $has_restore = false;

        foreach ($events as $event) {
            $type = (string)($event['event_type'] ?? '');
            $time = $event['event_time'] ?? null;
            $payload = self::json_array($event['payload'] ?? null);
            if (!$time) continue;

            if (in_array($type, ['step_started', 'step_resumed'], true)) {
                $candidate = $payload['actual_started_at'] ?? $payload['started_at'] ?? $time;
                if (!$started || strtotime($candidate) < strtotime($started)) {
                    $started = $candidate;
                }
                $has_manual_start = true;
                if ($type === 'step_resumed' && $last_pause_at) {
                    $delta = strtotime($time) - strtotime($last_pause_at);
                    if ($delta > 0) $paused_seconds += $delta;
                    $last_pause_at = null;
                }
            } elseif ($type === 'step_auto_started') {
                $candidate = $payload['actual_started_at'] ?? $payload['started_at'] ?? $time;
                if (!$auto_started || strtotime($candidate) < strtotime($auto_started)) {
                    $auto_started = $candidate;
                }
                $has_auto_start = true;
            } elseif ($type === 'step_paused') {
                if (!$last_pause_at || strtotime($time) > strtotime($last_pause_at)) {
                    $last_pause_at = $time;
                }
            } elseif ($type === 'step_restored') {
                $has_restore = true;
                $started = null;
                $auto_started = null;
                $completed = null;
                $paused_seconds = 0;
                $last_pause_at = null;
                $has_manual_start = false;
                $has_auto_start = false;
                $has_completion = false;
            } elseif ($type === 'step_completed') {
                $has_completion = true;
                $candidate = $payload['actual_completed_at'] ?? $payload['completed_at'] ?? $time;
                if (!$completed || strtotime($candidate) > strtotime($completed)) {
                    $completed = $candidate;
                }
                if ($last_pause_at) {
                    $delta = strtotime($candidate) - strtotime($last_pause_at);
                    if ($delta > 0) $paused_seconds += $delta;
                    $last_pause_at = null;
                }
            }
        }

        if (!$started && $has_completion && $auto_started) {
            $started = $auto_started;
        }

        $update = [];
        if ($started && empty($step['started_at'])) $update['started_at'] = $started;
        if ($started && empty($step['actual_started_at'])) $update['actual_started_at'] = $started;
        if ($completed && empty($step['completed_at'])) $update['completed_at'] = $completed;
        if ($completed && empty($step['actual_completed_at'])) $update['actual_completed_at'] = $completed;
        if ($paused_seconds > (int)($step['paused_seconds'] ?? 0)) $update['paused_seconds'] = $paused_seconds;

        if ($has_auto_start && !$has_manual_start && !$has_completion) {
            $update['status_slug'] = 'pending';
            $update['started_at'] = null;
            $update['actual_started_at'] = null;
            $update['actual_duration_minutes'] = 0;
            $update['is_paused'] = 0;
            $update['paused_at'] = null;
            $update['paused_seconds'] = 0;
            $step = array_merge($step, $update);
        }

        if ($has_restore && !$has_manual_start && !$has_auto_start && !$has_completion) {
            $update['status_slug'] = 'pending';
            $update['started_at'] = null;
            $update['actual_started_at'] = null;
            $update['completed_at'] = null;
            $update['actual_completed_at'] = null;
            $update['actual_duration_minutes'] = 0;
            $update['is_paused'] = 0;
            $update['paused_at'] = null;
            $update['paused_seconds'] = 0;
            $step = array_merge($step, $update);
        }

        if (($completed || in_array(($step['status_slug'] ?? ''), ['done', 'completed'], true)) && $started) {
            $actual_minutes = self::minutes_between($started, $completed ?: self::now()) - (int) round($paused_seconds / 60);
            $actual_minutes = max(0, $actual_minutes);
            if ((int)($step['actual_duration_minutes'] ?? -1) <= 0) {
                $update['actual_duration_minutes'] = $actual_minutes;
            }
            if ($completed && ($step['status_slug'] ?? '') === 'pending') {
                $update['status_slug'] = 'done';
            }
        } elseif ($started && !$completed && ($step['status_slug'] ?? '') === 'pending') {
            $update['status_slug'] = 'in_progress';
        }

        if (!empty($update) && $step_id) {
            global $wpdb;
            $wpdb->update($step_tbl, $update, ['id' => $step_id]);
            $step = array_merge($step, $update);
        }

        if (!empty($step['actual_started_at']) && empty($step['started_at'])) $step['started_at'] = $step['actual_started_at'];
        if (!empty($step['actual_completed_at']) && empty($step['completed_at'])) $step['completed_at'] = $step['actual_completed_at'];
        return $step;
    }

    private static function repair_order_step_data($order_id) {
        global $wpdb;
        $order_id = (int)$order_id;
        if (!$order_id || !self::has_column(self::tbl('step_events'), 'event_type')) return;

        $events = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM " . self::tbl('step_events') . " WHERE order_id=%d ORDER BY event_time ASC, id ASC",
            $order_id
        ), ARRAY_A) ?: [];
        if (empty($events)) return;

        $by_step = [];
        foreach ($events as $event) {
            $sid = (int)($event['step_id'] ?? 0);
            if (!$sid) continue;
            if (!isset($by_step[$sid])) $by_step[$sid] = [];
            $by_step[$sid][] = $event;
        }
        if (empty($by_step)) return;

        $ids = array_keys($by_step);
        $steps = $wpdb->get_results(
            "SELECT s.*
             FROM " . self::tbl('item_steps') . " s
             INNER JOIN " . self::tbl('order_items') . " i ON i.id = s.order_item_id
             WHERE i.order_id = " . $order_id,
            ARRAY_A
        ) ?: [];

        foreach ($steps as $step) {
            $sid = (int)($step['id'] ?? 0);
            if (!$sid || empty($by_step[$sid])) continue;
            self::repair_step_from_events($step, $by_step[$sid]);
        }
    }

    private static function item_step_minutes_from_payload($step, $item, $order_deadline = null) {
        $qty = (float)($item['quantity'] ?? 1);
        $qpu = max(1, (int)($step['qty_per_unit'] ?? 1));
        $base_hours = (float)($step['expected_hours'] ?? 0);
        $is_external = !empty($step['is_external']);
        $is_delivery = !empty($step['is_delivery']);
        $supplier_id = !empty($item['supplier_id']) ? (int)$item['supplier_id'] : (!empty($step['supplier_id']) ? (int)$step['supplier_id'] : 0);

        if ($is_external) {
            $mins = self::business_minutes_between($item['external_send_at'] ?? null, $item['external_receive_expected'] ?? null, $supplier_id);
            return max(0, (int)$mins);
        }
        if ($is_delivery) {
            $mins = self::business_minutes_between_window(
                $item['delivery_scheduled_at'] ?? null,
                $order_deadline ?: null,
                self::company_work_window()
            );
            return max(0, (int)$mins);
        }
        // Production steps are quantity-based by default: minutes scale with qty/per-unit.
        $scale = $qty / $qpu;
        if ($scale <= 0) $scale = 1;
        return (int) max(0, round(($base_hours * $scale) * 60));
    }

    private static function apply_item_timing_to_step_row($row, $step, $item, $order_deadline = null) {
        $mins = self::item_step_minutes_from_payload($step, $item, $order_deadline);
        $row['expected_duration_minutes'] = $mins;
        $row['expected_hours'] = round($mins / 60, 4);

        if (!empty($step['is_external'])) {
            $row['ext_send_at'] = !empty($item['external_send_at']) ? self::dt($item['external_send_at']) : null;
            $row['ext_receive_expected'] = !empty($item['external_receive_expected']) ? self::dt($item['external_receive_expected']) : null;
        }
        if (!empty($step['is_delivery'])) {
            $planned = !empty($item['delivery_scheduled_at']) ? self::dt($item['delivery_scheduled_at']) : null;
            $row['planned_start_at'] = $planned;
            $row['planned_due_at'] = $order_deadline ? self::dt($order_deadline) : null;
        }
        return $row;
    }

    private static function current_app_user_id() {
        // NOTE:
        // The CSPSR app authenticates via `X-CSPSR-Token` header OR `cspsr_app_token` cookie (see CSPSR_Auth).
        // This method is used by non-REST entrypoints like the QR page (?cspsr_qr_contact=...),
        // so it MUST accept cookie-based app sessions as well.
        if (class_exists('CSPSR_Auth') && method_exists('CSPSR_Auth', 'get_user_from_token')) {
            $u = CSPSR_Auth::get_user_from_token();
            if (!empty($u['id'])) return (int)$u['id'];
        }

        // Legacy fallback: accept "Bearer <token>" header or `cspsr_token` cookie.
        global $wpdb;
        $token = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (!$token && isset($_COOKIE['cspsr_token'])) $token = 'Bearer ' . $_COOKIE['cspsr_token'];
        if (!$token || stripos($token, 'Bearer ') !== 0) return null;
        $raw = trim(substr($token, 7));
        if ($raw === '') return null;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT user_id FROM " . self::tbl('app_tokens') . " WHERE token=%s AND expires_at >= %s ORDER BY id DESC LIMIT 1",
            $raw,
            self::now()
        ), ARRAY_A);
        return !empty($row['user_id']) ? (int)$row['user_id'] : null;
    }

    private static function ops_task_current_position($task_id) {
        global $wpdb;
        $task_id = (int) $task_id;
        if ($task_id <= 0) return null;
        $pos_tbl  = self::tbl('ops_task_positions');
        $dept_tbl = self::tbl('departments');
        $stage_tbl = self::tbl('ops_stages');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$pos_tbl'")) return null;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT p.*,
                    d.name AS department_name, d.name_en AS department_name_en,
                    s.name AS stage_name
             FROM $pos_tbl p
             LEFT JOIN $dept_tbl d ON d.id = p.department_id
             LEFT JOIN $stage_tbl s ON s.id = p.stage_id
             WHERE p.task_id=%d
             ORDER BY p.id DESC
             LIMIT 1",
            $task_id
        ), ARRAY_A);
    }

    private static function is_printing_department($department_id) {
        global $wpdb;
        $department_id = (int) $department_id;
        if ($department_id <= 0) return false;

        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT name, name_en FROM " . self::tbl('departments') . " WHERE id=%d LIMIT 1",
            $department_id
        ), ARRAY_A);
        if (!$row) return false;

        $name = trim((string)($row['name'] ?? ''));
        $name_en = trim((string)($row['name_en'] ?? ''));
        $combined = $name . ' ' . $name_en;
        if (function_exists('mb_strtolower')) $combined = mb_strtolower($combined, 'UTF-8');
        else $combined = strtolower($combined);

        return (
            strpos($combined, 'print') !== false ||
            strpos($combined, 'production') !== false ||
            strpos($combined, 'طباعة') !== false ||
            strpos($combined, 'انتاج') !== false ||
            strpos($combined, 'إنتاج') !== false
        );
    }

    private static function log_ops_task_event($task_id, $event_type, $payload = []) {
        global $wpdb;
        $task_id = (int) $task_id;
        $tbl = self::tbl('ops_task_events');
        if ($task_id <= 0 || !$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return;

        $now = self::now();
        $wpdb->insert($tbl, [
            'task_id'    => $task_id,
            'event_type' => sanitize_key($event_type),
            'event_time' => $now,
            'payload'    => self::as_json($payload),
            'created_by' => self::current_app_user_id(),
        ]);

        if (self::has_column(self::tbl('ops_tasks'), 'last_event_at')) {
            $wpdb->update(self::tbl('ops_tasks'), ['last_event_at' => $now], ['id' => $task_id]);
        }
    }

    private static function add_employee_points($employee_id, $points, $reason_code, $reason_label, $context = [], $event_at = null) {
        global $wpdb;
        $employee_id = (int)$employee_id;
        $points = (int)$points;
        if ($employee_id <= 0 || $points === 0) return;
        $tbl = self::tbl('employee_points');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return;

        $payload = is_array($context) ? $context : [];
        $wpdb->insert($tbl, [
            'employee_id'  => $employee_id,
            'points'       => $points,
            'reason_code'  => sanitize_key((string)$reason_code),
            'reason_label' => sanitize_text_field((string)$reason_label),
            'order_id'     => !empty($payload['order_id']) ? (int)$payload['order_id'] : null,
            'order_item_id'=> !empty($payload['order_item_id']) ? (int)$payload['order_item_id'] : null,
            'step_id'      => !empty($payload['step_id']) ? (int)$payload['step_id'] : null,
            'ops_task_id'  => !empty($payload['ops_task_id']) ? (int)$payload['ops_task_id'] : null,
            'event_at'     => $event_at ?: self::now(),
            'meta'         => self::as_json($payload),
            'created_by'   => self::current_app_user_id(),
        ]);
    }

    private static function award_points_for_advanced_step($step, $item, $order, $completed_by_json, $delivery_direction, $now, $actual_duration_minutes = null) {
        $employee_ids = array_values(array_filter(array_map('intval', self::unwrap_emp_ids($completed_by_json))));
        if (empty($employee_ids)) {
            $employee_ids = array_values(array_filter(array_map('intval', self::unwrap_emp_ids($step['assigned_employee_ids'] ?? []))));
        }
        if (empty($employee_ids) && !empty($step['assigned_employee_id'])) {
            $employee_ids = [(int)$step['assigned_employee_id']];
        }
        $employee_ids = array_values(array_unique(array_filter(array_map('intval', $employee_ids))));
        if (empty($employee_ids)) return;

        $context = [
            'order_id' => (int)($order['id'] ?? 0),
            'order_item_id' => (int)($item['id'] ?? 0),
            'step_id' => (int)($step['id'] ?? 0),
            'step_name' => $step['step_name'] ?? '',
            'delivery_direction' => (string)$delivery_direction,
        ];
        $deadline_raw = trim((string)($order['deadline'] ?? ''));
        if ($deadline_raw === '') $deadline_raw = trim((string)($step['expected_end'] ?? ''));
        $done_raw = trim((string)$now);
        $deadline_ts = $deadline_raw !== '' ? strtotime($deadline_raw) : false;
        $done_ts = $done_raw !== '' ? strtotime($done_raw) : false;
        $timing = 'no_deadline';
        if ($deadline_ts && $done_ts) {
            if ($done_ts < $deadline_ts) $timing = 'before_deadline';
            else if ($done_ts > $deadline_ts) $timing = 'after_deadline';
            else $timing = 'at_deadline';
        }
        $context['timing'] = $timing;

        // Delivery: only "delivered_to_client" and only when not late => +5
        if (!empty($step['is_delivery'])) {
            if ($delivery_direction === 'delivered_to_client' && $deadline_ts && $done_ts && $done_ts <= $deadline_ts) {
                foreach ($employee_ids as $employee_id) {
                    self::add_employee_points($employee_id, 5, 'delivery_with_deadline', 'Delivery With Deadline', $context, $now);
                }
            }
            return;
        }

        // Internal + External (same rule):
        // before deadline +10, exactly at deadline +5, after deadline -5.
        if (!$deadline_ts || !$done_ts) return;
        $pts = 0; $code = ''; $label = '';
        if ($done_ts < $deadline_ts) {
            $pts = 10;
            $code = !empty($step['is_external']) ? 'external_before_deadline' : 'internal_before_deadline';
            $label = !empty($step['is_external']) ? 'External Before Deadline' : 'Internal Before Deadline';
        } else if ($done_ts === $deadline_ts) {
            $pts = 5;
            $code = !empty($step['is_external']) ? 'external_at_deadline' : 'internal_at_deadline';
            $label = !empty($step['is_external']) ? 'External At Deadline' : 'Internal At Deadline';
        } else {
            $pts = -5;
            $code = !empty($step['is_external']) ? 'external_after_deadline' : 'internal_after_deadline';
            $label = !empty($step['is_external']) ? 'External After Deadline' : 'Internal After Deadline';
        }
        foreach ($employee_ids as $employee_id) {
            self::add_employee_points($employee_id, $pts, $code, $label, $context, $now);
        }
    }

    private static function ops_task_timeline($task_id) {
        global $wpdb;
        $task_id = (int) $task_id;
        $tbl = self::tbl('ops_task_events');
        $users_tbl = self::tbl('app_users');
        if ($task_id <= 0 || !$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return [];
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, u.name AS created_by_name, u.username AS created_by_username
             FROM $tbl e
             LEFT JOIN $users_tbl u ON u.id = e.created_by
             WHERE e.task_id=%d
             ORDER BY e.event_time ASC, e.id ASC",
            $task_id
        ), ARRAY_A) ?: [];

        foreach ($rows as &$row) {
            $row['payload'] = !empty($row['payload']) ? json_decode($row['payload'], true) : [];
        }
        unset($row);
        return $rows;
    }

    private static function log_order_event($order_id, $event_type, $payload = [], $step_id = null, $attempt_id = null) {
        global $wpdb;
        if (!(int)$order_id || !self::has_column(self::tbl('order_events'), 'event_type')) return;
        $now = self::now();
        $wpdb->insert(self::tbl('order_events'), [
            'order_id'    => (int)$order_id,
            'step_id'     => $step_id ? (int)$step_id : null,
            'attempt_id'  => $attempt_id ? (int)$attempt_id : null,
            'event_type'  => sanitize_key($event_type),
            'event_time'  => $now,
            'payload'     => self::as_json($payload),
            'created_by'  => self::current_app_user_id(),
        ]);
        if (self::has_column(self::tbl('orders'), 'last_event_at')) {
            $wpdb->update(self::tbl('orders'), ['last_event_at' => $now], ['id' => (int)$order_id]);
        }
    }

    private static function order_event_exists($order_id, $event_type) {
        global $wpdb;
        $order_id = (int)$order_id;
        if (!$order_id || !self::has_column(self::tbl('order_events'), 'event_type')) return false;
        $tbl = self::tbl('order_events');
        $id = $wpdb->get_var($wpdb->prepare("SELECT id FROM $tbl WHERE order_id=%d AND event_type=%s LIMIT 1", $order_id, sanitize_key($event_type)));
        return !empty($id);
    }

    private static function resolve_team_id_by_option_or_guess($opt_key, $keywords = []) {
        global $wpdb;
        $id = (int) get_option($opt_key, 0);
        if ($id > 0) return $id;
        $tbl = self::tbl('teams');
        $keywords = is_array($keywords) ? $keywords : [];
        $keywords = array_values(array_filter(array_map('strval', $keywords)));
        if (empty($keywords)) return 0;
        $where = [];
        $args = [];
        foreach ($keywords as $kw) {
            $where[] = "name LIKE %s";
            $args[] = '%' . $wpdb->esc_like($kw) . '%';
        }
        $sql = "SELECT id FROM $tbl WHERE " . implode(' OR ', $where) . " ORDER BY id ASC LIMIT 1";
        $row = $wpdb->get_var($wpdb->prepare($sql, $args));
        return (int)($row ?: 0);
    }

    private static function resolve_department_id_by_option_or_guess($opt_key, $keywords = []) {
        global $wpdb;
        $id = (int) get_option($opt_key, 0);
        if ($id > 0) return $id;
        $tbl = self::tbl('departments');
        $keywords = is_array($keywords) ? $keywords : [];
        $keywords = array_values(array_filter(array_map('strval', $keywords)));
        if (empty($keywords)) return 0;
        $has_en = self::has_column($tbl, 'name_en');
        $where = [];
        $args = [];
        foreach ($keywords as $kw) {
            $where[] = $has_en ? "(name LIKE %s OR name_en LIKE %s)" : "(name LIKE %s)";
            $args[] = '%' . $wpdb->esc_like($kw) . '%';
            if ($has_en) $args[] = '%' . $wpdb->esc_like($kw) . '%';
        }
        $sql = "SELECT id FROM $tbl WHERE " . implode(' OR ', $where) . " ORDER BY id ASC LIMIT 1";
        $row = $wpdb->get_var($wpdb->prepare($sql, $args));
        return (int)($row ?: 0);
    }

    private static function user_ids_by_team_id($team_id) {
        global $wpdb;
        $team_id = (int)$team_id;
        if (!$team_id) return [];
        $u_tbl = self::tbl('app_users');
        $e_tbl = self::tbl('employees');
        if (!self::has_column($u_tbl, 'employee_id')) return [];
        $rows = $wpdb->get_col($wpdb->prepare(
            "SELECT u.id
             FROM $u_tbl u
             INNER JOIN $e_tbl e ON e.id = u.employee_id
             WHERE e.team_id=%d
               AND (u.is_active IS NULL OR u.is_active=1)
               AND (e.is_active IS NULL OR e.is_active=1)",
            $team_id
        ));
        return array_values(array_filter(array_map('intval', $rows)));
    }

    private static function user_ids_by_department_id($department_id) {
        global $wpdb;
        $department_id = (int)$department_id;
        if (!$department_id) return [];
        $u_tbl = self::tbl('app_users');
        $e_tbl = self::tbl('employees');
        if (!self::has_column($u_tbl, 'employee_id')) return [];
        $rows = $wpdb->get_col($wpdb->prepare(
            "SELECT u.id
             FROM $u_tbl u
             INNER JOIN $e_tbl e ON e.id = u.employee_id
             WHERE e.department_id=%d
               AND (u.is_active IS NULL OR u.is_active=1)
               AND (e.is_active IS NULL OR e.is_active=1)",
            $department_id
        ));
        return array_values(array_filter(array_map('intval', $rows)));
    }

    private static function user_ids_all_active() {
        global $wpdb;
        $u_tbl = self::tbl('app_users');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$u_tbl'")) return [];
        $where = "1=1";
        if (self::has_column($u_tbl, 'is_active')) {
            $where .= " AND (is_active IS NULL OR is_active=1)";
        }
        $rows = $wpdb->get_col("SELECT id FROM $u_tbl WHERE $where");
        return array_values(array_filter(array_map('intval', $rows)));
    }

    private static function create_personal_notifications($user_ids, $title, $body, $type = 'info') {
        global $wpdb;
        $user_ids = array_values(array_filter(array_map('intval', is_array($user_ids) ? $user_ids : [])));
        if (empty($user_ids)) return 0;
        $tbl = self::tbl('notifications');
        $has_user = self::has_column($tbl, 'user_id');
        $has_sound = self::has_column($tbl, 'sound');
        $has_surl  = self::has_column($tbl, 'sound_url');
        $count = 0;
        foreach ($user_ids as $uid) {
            $row = [
                'title' => (string)$title,
                'body'  => (string)$body,
                'type'  => (string)$type,
                'is_read' => 0,
            ];
            if ($has_user) $row['user_id'] = $uid;
            $ok = $wpdb->insert($tbl, $row);
            if ($ok) $count++;
        }
        // Best-effort push via FCM (does not affect DB insert result).
        self::maybe_send_push_to_users($user_ids, [
            'title' => (string)$title,
            'body'  => (string)$body,
            'url'   => home_url('/'),
        ]);
        return $count;
    }

    private static function normalize_notification_rules($raw) {
        $arr = is_array($raw) ? $raw : (json_decode((string)$raw, true) ?: []);
        if (!is_array($arr)) $arr = [];
        $out = [];
        foreach ($arr as $r) {
            if (!is_array($r)) continue;
            $event = sanitize_key($r['event'] ?? '');
            if (!in_array($event, ['new_order','delivery_ready'], true)) continue;
            $target = sanitize_key($r['target_type'] ?? 'department');
            if (!in_array($target, ['department','team'], true)) $target = 'department';
            $dept_id = max(0, (int)($r['department_id'] ?? 0));
            $team_id = max(0, (int)($r['team_id'] ?? 0));
            $sound = sanitize_key($r['sound'] ?? '');
            $sound_url = '';
            if ($sound === 'custom') $sound_url = esc_url_raw((string)($r['sound_url'] ?? ''));
            $out[] = [
                'event' => $event,
                'target_type' => $target,
                'department_id' => $dept_id,
                'team_id' => $team_id,
                'sound' => $sound,
                'sound_url' => $sound_url,
            ];
        }
        return $out;
    }

    private static function get_notification_rules() {
        $raw = get_option('cspsr_notification_rules', '[]');
        return self::normalize_notification_rules($raw);
    }

    private static function create_personal_notifications_with_sound($user_ids, $title, $body, $type, $sound, $sound_url) {
        global $wpdb;
        $user_ids = array_values(array_filter(array_map('intval', is_array($user_ids) ? $user_ids : [])));
        if (empty($user_ids)) return 0;
        $tbl = self::tbl('notifications');
        $has_user = self::has_column($tbl, 'user_id');
        $has_sound = self::has_column($tbl, 'sound');
        $has_surl  = self::has_column($tbl, 'sound_url');
        $count = 0;
        foreach ($user_ids as $uid) {
            $row = [
                'title' => (string)$title,
                'body'  => (string)$body,
                'type'  => (string)$type,
                'is_read' => 0,
            ];
            if ($has_user) $row['user_id'] = $uid;
            if ($has_sound && $sound !== '') $row['sound'] = (string)$sound;
            if ($has_surl && $sound_url !== '') $row['sound_url'] = (string)$sound_url;
            $ok = $wpdb->insert($tbl, $row);
            if ($ok) $count++;
        }
        // Best-effort push via FCM (does not affect DB insert result).
        self::maybe_send_push_to_users($user_ids, [
            'title' => (string)$title,
            'body'  => (string)$body,
            'url'   => home_url('/'),
        ]);
        return $count;
    }

    private static function maybe_send_push_to_users($user_ids, $notif) {
        $enabled = (bool) get_option('cspsr_fcm_enabled', false);
        if (!$enabled) return;
        $user_ids = array_values(array_unique(array_filter(array_map('intval', is_array($user_ids) ? $user_ids : []))));
        if (empty($user_ids)) return;
        foreach ($user_ids as $uid) {
            try {
                self::fcm_send_to_user((int)$uid, $notif);
            } catch (\Throwable $e) {
                // ignore
            }
        }
    }

    private static function maybe_notify_printing_new_order($order_id, $order_number) {
        $order_id = (int)$order_id;
        if (!$order_id) return;
        if (self::order_event_exists($order_id, 'notified_printing_new_order')) return;
        $rules = self::get_notification_rules();
        $matched = array_values(array_filter($rules, function($r){ return ($r['event'] ?? '') === 'new_order'; }));
        if (empty($matched)) {
            // Back-compat: old single team option
            $team_id = self::resolve_team_id_by_option_or_guess('cspsr_notify_printing_team_id', ['print', 'printing', 'طباعة', 'طباعه']);
            if (!$team_id) return;
            $matched = [[ 'target_type'=>'team', 'team_id'=>$team_id, 'department_id'=>0, 'sound'=>'', 'sound_url'=>'' ]];
        }

        $title = '🔔 New Order / طلب جديد';
        $body  = 'Order #' . $order_number . ' / طلب رقم ' . $order_number;
        $total = 0;
        $targets = [];
        foreach ($matched as $rule) {
            $t = $rule['target_type'] ?? 'department';
            $uids = [];
            if ($t === 'team') {
                $uids = self::user_ids_by_team_id((int)($rule['team_id'] ?? 0));
            } else {
                $uids = self::user_ids_by_department_id((int)($rule['department_id'] ?? 0));
            }
            if (empty($uids)) continue;
            $sound = (string)($rule['sound'] ?? '');
            $surl  = (string)($rule['sound_url'] ?? '');
            $inserted = self::create_personal_notifications_with_sound($uids, $title, $body, 'new_order', $sound, $surl);
            if ($inserted > 0) {
                $total += $inserted;
                $targets[] = ['target_type'=>$t, 'department_id'=>(int)($rule['department_id']??0), 'team_id'=>(int)($rule['team_id']??0), 'count'=>$inserted];
            }
        }
        if ($total > 0) {
            self::log_order_event($order_id, 'notified_printing_new_order', [
                'targets' => $targets,
                'total' => $total,
            ]);
        }
    }

    private static function maybe_notify_logistics_delivery_ready($order_id, $order_number) {
        $order_id = (int)$order_id;
        if (!$order_id) return;
        if (self::order_event_exists($order_id, 'notified_logistics_delivery_ready')) return;
        $title = '🚚 Ready for Delivery / جاهز للتوصيل';
        $body  = 'Order #' . $order_number . ' / طلب رقم ' . $order_number;
        $rules = self::get_notification_rules();
        $matched = array_values(array_filter($rules, function($r){ return ($r['event'] ?? '') === 'delivery_ready'; }));
        if (empty($matched)) {
            // Back-compat: old single department option
            $dept_id = self::resolve_department_id_by_option_or_guess('cspsr_notify_logistics_department_id', ['logistics', 'delivery', 'dispatch', 'توصيل', 'لوجست', 'شحن']);
            if (!$dept_id) return;
            $matched = [[ 'target_type'=>'department', 'department_id'=>$dept_id, 'team_id'=>0, 'sound'=>'', 'sound_url'=>'' ]];
        }

        $total = 0;
        $targets = [];
        foreach ($matched as $rule) {
            $t = $rule['target_type'] ?? 'department';
            $uids = [];
            if ($t === 'team') {
                $uids = self::user_ids_by_team_id((int)($rule['team_id'] ?? 0));
            } else {
                $uids = self::user_ids_by_department_id((int)($rule['department_id'] ?? 0));
            }
            if (empty($uids)) continue;
            $sound = (string)($rule['sound'] ?? '');
            $surl  = (string)($rule['sound_url'] ?? '');
            $inserted = self::create_personal_notifications_with_sound($uids, $title, $body, 'delivery_ready', $sound, $surl);
            if ($inserted > 0) {
                $total += $inserted;
                $targets[] = ['target_type'=>$t, 'department_id'=>(int)($rule['department_id']??0), 'team_id'=>(int)($rule['team_id']??0), 'count'=>$inserted];
            }
        }
        if ($total > 0) {
            self::log_order_event($order_id, 'notified_logistics_delivery_ready', [
                'targets' => $targets,
                'total' => $total,
            ]);
        }
    }

    private static function log_step_event($step_id, $event_type, $payload = [], $order_id = null) {
        global $wpdb;
        if (!(int)$step_id || !self::has_column(self::tbl('step_events'), 'event_type')) return;
        $now = self::now();
        $wpdb->insert(self::tbl('step_events'), [
            'step_id'     => (int)$step_id,
            'order_id'    => $order_id ? (int)$order_id : null,
            'event_type'  => sanitize_key($event_type),
            'event_time'  => $now,
            'payload'     => self::as_json($payload),
            'created_by'  => self::current_app_user_id(),
        ]);
        if (self::has_column(self::tbl('item_steps'), 'last_event_at')) {
            $wpdb->update(self::tbl('item_steps'), ['last_event_at' => $now], ['id' => (int)$step_id]);
        }
    }

    private static function order_event_exists_with_ops_event($order_id, $event_type, $ops_event_id) {
        global $wpdb;
        $order_id = (int)$order_id;
        $ops_event_id = (int)$ops_event_id;
        if ($order_id <= 0 || $ops_event_id <= 0) return false;
        $tbl = self::tbl('order_events');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return false;
        $like = '%"ops_event_id":' . $ops_event_id . '%';
        $sql = $wpdb->prepare(
            "SELECT id FROM $tbl WHERE order_id=%d AND event_type=%s AND payload LIKE %s LIMIT 1",
            $order_id,
            sanitize_key($event_type),
            $like
        );
        return (bool)$wpdb->get_var($sql);
    }

    private static function sync_ops_task_history_to_order($task_id, $order_id) {
        $task_id = (int)$task_id;
        $order_id = (int)$order_id;
        if ($task_id <= 0 || $order_id <= 0) return;

        $timeline = self::ops_task_timeline($task_id);
        if (empty($timeline)) return;

        foreach ((array)$timeline as $evt) {
            $event_id = (int)($evt['id'] ?? 0);
            $etype = (string)($evt['event_type'] ?? '');
            $payload = is_array($evt['payload'] ?? null) ? $evt['payload'] : [];
            $event_time = !empty($evt['event_time']) ? $evt['event_time'] : self::now();

            if ($etype === 'task_moved') {
                $from_stage = trim((string)($payload['from_stage_name'] ?? ''));
                $from_dept = trim((string)($payload['from_department_name'] ?? ''));
                if ($from_stage !== '') {
                    $order_event_type = 'ops_stage_completed';
                    if (!self::order_event_exists_with_ops_event($order_id, $order_event_type, $event_id)) {
                        self::log_order_event($order_id, $order_event_type, [
                            'ops_task_id' => $task_id,
                            'ops_event_id' => $event_id,
                            'task_no' => $payload['task_no'] ?? '',
                            'department_name' => $from_dept,
                            'stage_name' => $from_stage,
                            'completed_at' => $event_time,
                            'source' => 'ops_task_timeline'
                        ]);
                    }
                }
                continue;
            }

            if ($etype === 'task_completed') {
                $stage = trim((string)($payload['stage_name'] ?? ''));
                $dept = trim((string)($payload['department_name'] ?? ''));
                $order_event_type = 'ops_task_completed';
                if (!self::order_event_exists_with_ops_event($order_id, $order_event_type, $event_id)) {
                    self::log_order_event($order_id, $order_event_type, [
                        'ops_task_id' => $task_id,
                        'ops_event_id' => $event_id,
                        'task_no' => $payload['task_no'] ?? '',
                        'department_name' => $dept,
                        'stage_name' => $stage,
                        'completed_at' => $payload['completed_at'] ?? $event_time,
                        'source' => 'ops_task_timeline'
                    ]);
                }
            }
        }

        self::sync_order_lifecycle($order_id);
    }

    // ── Register all routes ───────────────────────────────────────────────────
    public static function register_routes() {
        $ns = self::NS;

        // Bootstrap
        register_rest_route($ns, '/bootstrap', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'bootstrap'],
            'permission_callback' => self::perm(),
        ]);

        // Generic CRUD factory
        $resources = ['roles','departments','teams','employees','statuses','products','notifications','suppliers'];
        foreach ($resources as $res) {
            self::crud_routes($ns, $res);
        }

        // Customers (+ nested recipients)
        self::crud_routes($ns, 'customers');
        register_rest_route($ns, '/customers/(?P<id>\d+)/recipients', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_recipients'],   'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'create_recipient'],  'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/recipients/(?P<id>\d+)', [
            ['methods'=>'GET',    'callback'=>[__CLASS__,'get_recipient'],    'permission_callback'=>self::perm()],
            ['methods'=>'PUT',    'callback'=>[__CLASS__,'update_recipient'], 'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,'delete_recipient'], 'permission_callback'=>self::perm()],
        ]);

        // Production step library
        register_rest_route($ns, '/step-library', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_step_library'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'create_step_library'],'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/step-library/(?P<id>\d+)', [
            ['methods'=>'PUT',    'callback'=>[__CLASS__,'update_step_library'],'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,'delete_step_library'],'permission_callback'=>self::perm()],
        ]);

        // Customer contacts
        register_rest_route($ns, '/customers/(?P<id>\d+)/contacts', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_contacts'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'create_contact'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/contacts/(?P<id>\d+)', [
            ['methods'=>'PUT',    'callback'=>[__CLASS__,'update_contact'], 'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,'delete_contact'], 'permission_callback'=>self::perm()],
        ]);

        // Products steps (template)
        register_rest_route($ns, '/products/(?P<id>\d+)/steps', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_product_steps'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'create_product_step'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/product-steps/(?P<id>\d+)', [
            ['methods'=>'GET',    'callback'=>[__CLASS__,'get_product_step'],    'permission_callback'=>self::perm()],
            ['methods'=>'PUT',    'callback'=>[__CLASS__,'update_product_step'], 'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,'delete_product_step'], 'permission_callback'=>self::perm()],
        ]);

        // Orders
        register_rest_route($ns, '/orders', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_orders'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'create_order'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)', [
            ['methods'=>'GET',    'callback'=>[__CLASS__,'get_order'],    'permission_callback'=>self::perm()],
            ['methods'=>'PUT',    'callback'=>[__CLASS__,'update_order'], 'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,'delete_order'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/lifecycle', [
            ['methods'=>'GET',    'callback'=>[__CLASS__,'get_order_lifecycle'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/delivery-attempts', [
            ['methods'=>'GET',    'callback'=>[__CLASS__,'list_delivery_attempts'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST',   'callback'=>[__CLASS__,'create_delivery_attempt'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/delivery-attempts/(?P<id>\d+)/dispatch', [
            ['methods'=>'POST',   'callback'=>[__CLASS__,'dispatch_delivery_attempt'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/delivery-attempts/(?P<id>\d+)/fail', [
            ['methods'=>'POST',   'callback'=>[__CLASS__,'fail_delivery_attempt'], 'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/delivery-attempts/(?P<id>\d+)/complete', [
            ['methods'=>'POST',   'callback'=>[__CLASS__,'complete_delivery_attempt'], 'permission_callback'=>self::perm()],
        ]);

        // Order recipients
        register_rest_route($ns, '/orders/(?P<id>\d+)/recipients', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'list_order_recipients'],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'add_order_recipient'],    'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/recipients/(?P<rid>\d+)', [
            ['methods'=>'DELETE','callback'=>[__CLASS__,'remove_order_recipient'],'permission_callback'=>self::perm()],
        ]);

        // Report delay reason
        register_rest_route($ns, '/orders/(?P<id>\d+)/delay-reason', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'report_delay_reason'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/reports/employee-performance', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'employee_performance_report'],
            'permission_callback' => self::perm(),
        ]);

        // Order queue reorder
        register_rest_route($ns, '/orders/requeue', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'requeue_orders'],
            'permission_callback' => self::perm(),
        ]);

        // Order cancel & force-complete
        register_rest_route($ns, '/orders/(?P<id>\d+)/cancel', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'cancel_order'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/force-complete', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'force_complete_order'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/restore', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'restore_order'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/pause', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'pause_order'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/orders/(?P<id>\d+)/resume', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'resume_order'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/steps/(?P<id>\d+)/pause', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'pause_step'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/steps/(?P<id>\d+)/resume', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'resume_step'],
            'permission_callback' => self::perm(),
        ]);

        // Step start (first step — begins timer)
        register_rest_route($ns, '/steps/(?P<id>\d+)/start', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'start_step'],
            'permission_callback' => self::perm(),
        ]);

        // Step advance
        register_rest_route($ns, '/steps/(?P<id>\d+)/advance', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'advance_step'],
            'permission_callback' => self::perm(),
        ]);

        // External supplier tracking for item_steps
        register_rest_route($ns, '/steps/(?P<id>\\d+)/ext-supplier', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'update_step_ext_supplier'],
            'permission_callback' => self::perm(),
        ]);

        // Fix expected hours — sync item_steps from product_steps
        register_rest_route($ns, '/admin/fix-expected-hours', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'fix_expected_hours'],
            'permission_callback' => self::admin_perm(),
        ]);

        // Delete all completed orders
        register_rest_route($ns, '/admin/delete-completed-orders', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'delete_completed_orders'],
            'permission_callback' => self::admin_perm(),
        ]);

        // Fix: delete status with sort_order=5, migrate orders to sort_order=3
        register_rest_route($ns, '/admin/fix-status-5', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'fix_status_5'],
            'permission_callback' => self::admin_perm(),
        ]);







        // Setup / Branding
        register_rest_route($ns, '/setup', [
            ['methods'=>'GET',  'callback'=>[__CLASS__,'get_setup'],  'permission_callback'=>self::public_perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,'save_setup'], 'permission_callback'=>self::admin_perm()],
        ]);

        // Push notifications (FCM) — device registration + test (logged-in users)
        register_rest_route($ns, '/push/register-token', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'push_register_token'],
            'permission_callback' => self::perm(),
        ]);
        register_rest_route($ns, '/push/test', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'push_test_self'],
            'permission_callback' => self::perm(),
        ]);

        // Export / Import (admin only)
        register_rest_route($ns, '/export', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'export_data'],
            'permission_callback' => self::admin_perm(),
        ]);
        register_rest_route($ns, '/import', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'import_data'],
            'permission_callback' => self::admin_perm(),
        ]);

        // QR
        register_rest_route($ns, '/qr', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'qr_image'],
            'permission_callback' => self::perm(),
        ]);

        // QR Contact page — protected because it exposes order/customer info
        register_rest_route($ns, '/qr-contact', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'qr_contact_page'],
            'permission_callback' => self::public_perm(),
        ]);

        register_rest_route($ns, '/orders/(?P<id>\d+)/partial-deliver', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'partial_deliver'],
            'permission_callback' => self::perm(),
        ]);

        // ── Operations Tasks ──────────────────────────────────────────────────
        register_rest_route($ns, '/ops-tasks', [
            ['methods' => 'GET',  'callback' => [__CLASS__, 'list_ops_tasks'],   'permission_callback' => self::perm()],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_ops_task'],  'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/completed', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'list_ops_tasks_completed'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)', [
            ['methods' => 'GET',    'callback' => [__CLASS__, 'get_ops_task'],    'permission_callback' => self::perm()],
            ['methods' => 'PUT',    'callback' => [__CLASS__, 'update_ops_task'], 'permission_callback' => self::perm()],
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_ops_task'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)/timeline', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_ops_task_timeline'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)/move', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'move_ops_task'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)/complete', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'complete_ops_task'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)/reopen', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'reopen_ops_task'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-tasks/(?P<id>\d+)/restore', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'restore_ops_task'], 'permission_callback' => self::perm()],
        ]);

        register_rest_route($ns, '/employee-leaves', [
            ['methods' => 'GET',  'callback' => [__CLASS__, 'list_employee_leaves'], 'permission_callback' => self::perm()],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_employee_leave'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/employee-leaves/preview', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'preview_employee_leave'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/employee-leaves/(?P<id>\d+)', [
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_employee_leave'], 'permission_callback' => self::perm()],
        ]);

        // ── Departments reorder ────────────────────────────────────────────────
        register_rest_route($ns, '/departments/reorder', [
            ['methods'=>'POST', 'callback'=>[__CLASS__,'reorder_departments'], 'permission_callback'=>self::perm()],
        ]);

        // ── Operations Stages (kanban columns per department) ─────────────────
        register_rest_route($ns, '/departments/(?P<id>\d+)/ops-stages', [
            ['methods' => 'GET',  'callback' => [__CLASS__, 'list_ops_stages'],  'permission_callback' => self::perm()],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_ops_stage'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-stages/(?P<id>\d+)', [
            ['methods' => 'PUT',    'callback' => [__CLASS__, 'update_ops_stage'], 'permission_callback' => self::perm()],
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_ops_stage'], 'permission_callback' => self::perm()],
        ]);
        register_rest_route($ns, '/ops-stages/reorder', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'reorder_ops_stages'], 'permission_callback' => self::perm()],
        ]);
    }

    // ── Generic CRUD routes helper ────────────────────────────────────────────
    private static function crud_routes($ns, $res) {
        $method = strtolower($res);
        register_rest_route($ns, "/$res", [
            ['methods'=>'GET',  'callback'=>[__CLASS__,"list_$method"],  'permission_callback'=>self::perm()],
            ['methods'=>'POST', 'callback'=>[__CLASS__,"create_$method"],'permission_callback'=>self::perm()],
        ]);
        register_rest_route($ns, "/$res/(?P<id>\d+)", [
            ['methods'=>'GET',    'callback'=>[__CLASS__,"get_$method"],    'permission_callback'=>self::perm()],
            ['methods'=>'PUT',    'callback'=>[__CLASS__,"update_$method"], 'permission_callback'=>self::perm()],
            ['methods'=>'DELETE', 'callback'=>[__CLASS__,"delete_$method"], 'permission_callback'=>self::perm()],
        ]);
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    private static function calc_step_metrics($step) {
        $expected = (int)($step['expected_duration_minutes'] ?? 0);
        if ($expected <= 0) {
            $expected = self::duration_minutes_from_step($step);
        }
        $actual = (int)($step['actual_duration_minutes'] ?? 0);
        if ($actual <= 0 && (!empty($step['actual_started_at']) || !empty($step['started_at'])) && (!empty($step['actual_completed_at']) || !empty($step['completed_at']))) {
            $actual = self::minutes_between(
                $step['actual_started_at'] ?? $step['started_at'],
                $step['actual_completed_at'] ?? $step['completed_at']
            );
            $actual -= (int) round(((int)($step['paused_seconds'] ?? 0)) / 60);
            $actual = max(0, $actual);
        }
        $queue = (int)($step['queue_wait_minutes'] ?? 0);
        if ($queue <= 0 && !empty($step['planned_start_at']) && (!empty($step['actual_started_at']) || !empty($step['started_at']))) {
            $queue = self::minutes_between($step['planned_start_at'], $step['actual_started_at'] ?? $step['started_at']);
        }
        $planned_due = $step['planned_due_at'] ?? null;
        $actual_done = $step['actual_completed_at'] ?? ($step['completed_at'] ?? null);
        $delay = ($planned_due && $actual_done) ? self::minutes_between($planned_due, $actual_done) : 0;
        return [
            'expected_duration_minutes' => $expected,
            'actual_duration_minutes'   => $actual,
            'queue_wait_minutes'        => $queue,
            'variance_minutes'          => $actual - $expected,
            'delay_minutes'             => $delay,
        ];
    }

    private static function calc_external_metrics($step) {
        $sent = $step['ext_send_at'] ?? null;
        $promised = $step['ext_receive_expected'] ?? null;
        $actual = $step['ext_receive_actual'] ?? null;
        $supplier_id = !empty($step['supplier_id']) ? (int)$step['supplier_id'] : 0;
        $promised_minutes = ($sent && $promised) ? self::business_minutes_between($sent, $promised, $supplier_id) : 0;
        $actual_minutes = ($sent && $actual) ? self::business_minutes_between($sent, $actual, $supplier_id) : 0;
        $variance_minutes = ($promised_minutes > 0 && $actual_minutes > 0) ? ($actual_minutes - $promised_minutes) : 0;
        $live_variance = 0;
        if ($sent && $promised && !$actual) {
            $live_variance = self::business_minutes_between($promised, self::now(), $supplier_id);
        }
        $status = 'awaiting_send';
        if ($actual) {
            if ($variance_minutes > 0) $status = 'late';
            elseif ($variance_minutes < 0) $status = 'early';
            else $status = 'on_time';
        } elseif ($sent) {
            $status = $live_variance > 0 ? 'late' : 'at_supplier';
        } elseif ($promised) {
            $status = 'scheduled';
        }
        return [
            'sent_at' => $sent,
            'promised_at' => $promised,
            'received_at' => $actual,
            'working_day_start' => $supplier_id ? (($w = self::supplier_work_window($supplier_id)) ? sprintf('%02d:%02d', floor($w['start']/60), $w['start']%60) : null) : null,
            'working_day_end' => $supplier_id ? (($w2 = self::supplier_work_window($supplier_id)) ? sprintf('%02d:%02d', floor($w2['end']/60), $w2['end']%60) : null) : null,
            'promised_duration_minutes' => $promised_minutes,
            'actual_duration_minutes' => $actual_minutes,
            'variance_minutes' => $variance_minutes,
            'live_variance_minutes' => $live_variance,
            'on_time_status' => $status,
        ];
    }

    private static function schedule_order($order_id) {
        global $wpdb;
        $order_id = (int)$order_id;
        if (!$order_id) return;
        $o_tbl = self::tbl('orders');
        $oi_tbl = self::tbl('order_items');
        $is_tbl = self::tbl('item_steps');
        $order = $wpdb->get_row($wpdb->prepare("SELECT * FROM $o_tbl WHERE id=%d", $order_id), ARRAY_A);
        if (!$order) return;

        $anchor = self::dt($order['requested_delivery_at'] ?? null)
            ?: self::dt($order['customer_deadline_at'] ?? null)
            ?: self::dt($order['deadline'] ?? null);
        if (!$anchor) return;

        $steps = $wpdb->get_results($wpdb->prepare(
            "SELECT s.*, i.order_id
             FROM $is_tbl s
             INNER JOIN $oi_tbl i ON i.id = s.order_item_id
             WHERE i.order_id=%d
             ORDER BY s.step_order ASC, s.id ASC",
            $order_id
        ), ARRAY_A);
        if (empty($steps)) {
            $wpdb->update($o_tbl, [
                'customer_deadline_at' => $anchor,
                'requested_delivery_at' => self::dt($order['requested_delivery_at'] ?? null),
                'schedule_anchor_at' => $anchor,
            ], ['id' => $order_id]);
            return;
        }

        $delivery_steps = [];
        $prod_steps = [];
        foreach ($steps as $step) {
            if (!empty($step['is_delivery'])) $delivery_steps[] = $step;
            else $prod_steps[] = $step;
        }

        $last_step = !empty($delivery_steps) ? $delivery_steps[count($delivery_steps) - 1] : (!empty($prod_steps) ? $prod_steps[count($prod_steps) - 1] : null);
        $anchor_window = $last_step ? self::step_work_window($last_step) : self::company_work_window();
        $cursor = self::align_window_forward($anchor, $anchor_window);
        if (!$cursor) {
            $cursor = self::dt_obj($anchor);
        }
        if (!$cursor) return;
        $aligned_anchor = $cursor->format('Y-m-d H:i:s');
        $dispatch_due = $cursor->format('Y-m-d H:i:s');
        if (!empty($delivery_steps)) {
            for ($i = count($delivery_steps) - 1; $i >= 0; $i--) {
                $step = $delivery_steps[$i];
                $mins = max(0, self::duration_minutes_from_step($step));
                $window = self::step_work_window($step);
                $dueDt = self::align_window_backward($cursor->format('Y-m-d H:i:s'), $window);
                if (!$dueDt) $dueDt = $cursor;
                $due = $dueDt->format('Y-m-d H:i:s');
                $start = self::subtract_business_minutes_window($due, $mins, $window);
                $wpdb->update($is_tbl, [
                    'planned_start_at' => $start,
                    'planned_due_at' => $due,
                    'expected_duration_minutes' => $mins,
                ], ['id' => (int)$step['id']]);
                $cursor = self::dt_obj($start) ?: $dueDt;
                $dispatch_due = $start;
            }
        }

        for ($i = count($prod_steps) - 1; $i >= 0; $i--) {
            $step = $prod_steps[$i];
            $mins = max(0, self::duration_minutes_from_step($step));
            $window = self::step_work_window($step);
            $dueDt = self::align_window_backward($cursor->format('Y-m-d H:i:s'), $window);
            if (!$dueDt) $dueDt = $cursor;
            $due = $dueDt->format('Y-m-d H:i:s');
            $start = self::subtract_business_minutes_window($due, $mins, $window);
            $update = [
                'planned_start_at' => $start,
                'planned_due_at' => $due,
                'expected_duration_minutes' => $mins,
            ];
            if (!empty($step['is_external'])) {
                $update['ext_send_at'] = $start;
                $update['ext_receive_expected'] = $due;
            }
            $wpdb->update($is_tbl, $update, ['id' => (int)$step['id']]);
            $cursor = self::dt_obj($start) ?: $dueDt;
        }

        $internal_ready = !empty($delivery_steps) ? $cursor->format('Y-m-d H:i:s') : $dispatch_due;
        $wpdb->update($o_tbl, [
            'customer_deadline_at' => $aligned_anchor,
            'requested_delivery_at' => !empty($order['requested_delivery_at']) ? $aligned_anchor : self::dt($order['requested_delivery_at'] ?? null),
            'internal_ready_at' => $internal_ready,
            'dispatch_due_at' => $dispatch_due,
            'delivery_planned_at' => !empty($delivery_steps) ? $dispatch_due : null,
            'schedule_anchor_at' => $aligned_anchor,
        ], ['id' => $order_id]);
    }

    private static function sync_order_lifecycle($order_id) {
        global $wpdb;
        $order_id = (int)$order_id;
        if (!$order_id) return;
        self::repair_order_step_data($order_id);
        $o_tbl = self::tbl('orders');
        $oi_tbl = self::tbl('order_items');
        $is_tbl = self::tbl('item_steps');
        $steps = $wpdb->get_results($wpdb->prepare(
            "SELECT s.*
             FROM $is_tbl s
             INNER JOIN $oi_tbl i ON i.id = s.order_item_id
             WHERE i.order_id=%d
             ORDER BY s.step_order ASC, s.id ASC",
            $order_id
        ), ARRAY_A);
        if (empty($steps)) return;

        $non_delivery = array_values(array_filter($steps, function($s){ return empty($s['is_delivery']); }));
        $delivery = array_values(array_filter($steps, function($s){ return !empty($s['is_delivery']); }));

        $prod_started = null;
        $ready_at = null;
        $delivered_at = null;
        $all_prod_done = !empty($non_delivery);
        $all_delivery_done = !empty($delivery);
        $actual_total = 0;

        foreach ($non_delivery as $step) {
            $start = $step['actual_started_at'] ?? ($step['started_at'] ?? null);
            $done  = $step['actual_completed_at'] ?? ($step['completed_at'] ?? null);
            if ($start && (!$prod_started || strtotime($start) < strtotime($prod_started))) $prod_started = $start;
            if (!$done || !in_array($step['status_slug'], ['done','completed'], true)) $all_prod_done = false;
            if ($done && (!$ready_at || strtotime($done) > strtotime($ready_at))) $ready_at = $done;
            $metrics = self::calc_step_metrics($step);
            $actual_total += (int)$metrics['actual_duration_minutes'];
        }

        foreach ($delivery as $step) {
            $done = $step['actual_completed_at'] ?? ($step['completed_at'] ?? null);
            if (!$done || !in_array($step['status_slug'], ['done','completed'], true)) $all_delivery_done = false;
            if ($done && (!$delivered_at || strtotime($done) > strtotime($delivered_at))) $delivered_at = $done;
        }

        $order = $wpdb->get_row($wpdb->prepare("SELECT * FROM $o_tbl WHERE id=%d", $order_id), ARRAY_A);
        if (!$order) return;
        $expected_mins = (int) round(((float)($order['expected_hours_total'] ?? 0)) * 60);
        $lead_minutes = self::minutes_between($order['entered_at'] ?? ($order['created_at'] ?? null), $delivered_at ?: self::now());
        $production_minutes = $prod_started && $ready_at ? self::minutes_between($prod_started, $ready_at) : 0;
        $delivery_delay_minutes = 0;
        $deadline = $order['customer_deadline_at'] ?? ($order['deadline'] ?? null);
        if ($deadline && $delivered_at) {
            $delivery_delay_minutes = self::minutes_between($deadline, $delivered_at);
        }

        $delivery_status = $order['delivery_status'] ?? 'pending';
        if ($delivered_at) $delivery_status = 'delivered';
        elseif ($ready_at && !empty($delivery)) $delivery_status = 'ready_to_dispatch';
        elseif ($prod_started) $delivery_status = $delivery_status === 'pending' ? 'production' : $delivery_status;

        $update = [
            'production_started_at' => $prod_started,
            'ready_at' => $all_prod_done ? $ready_at : null,
            'delivery_ready_at' => $all_prod_done ? $ready_at : null,
            'delivered_at' => $all_delivery_done ? $delivered_at : null,
            'closed_at' => ($all_delivery_done || (empty($delivery) && $all_prod_done)) ? ($delivered_at ?: $ready_at ?: self::now()) : null,
            'actual_hours_total' => round($actual_total / 60, 2),
            'variance_hours' => round(($actual_total - $expected_mins) / 60, 2),
            'delivery_status' => $delivery_status,
            'kpi_snapshot' => self::as_json([
                'lead_time_minutes' => $lead_minutes,
                'production_lead_minutes' => $production_minutes,
                'delivery_delay_minutes' => $delivery_delay_minutes,
                'expected_duration_minutes' => $expected_mins,
                'actual_duration_minutes' => $actual_total,
                'variance_minutes' => $actual_total - $expected_mins,
            ]),
        ];

        if ($prod_started && empty($order['started_at'])) $update['started_at'] = $prod_started;
        if ($all_delivery_done || (empty($delivery) && $all_prod_done)) {
            $update['completed_at'] = $delivered_at ?: $ready_at ?: self::now();
            $update['is_done'] = 1;
        }
        $wpdb->update($o_tbl, $update, ['id' => $order_id]);
        if ($delivery_status === 'ready_to_dispatch') {
            self::maybe_notify_logistics_delivery_ready($order_id, $order['order_number'] ?? (string)$order_id);
        }
    }

    private static function hydrate_order_metrics(&$order) {
        $snapshot = [];
        if (!empty($order['kpi_snapshot'])) {
            $decoded = json_decode($order['kpi_snapshot'], true);
            if (is_array($decoded)) $snapshot = $decoded;
        }
        $order['kpis'] = array_merge([
            'lead_time_minutes' => 0,
            'production_lead_minutes' => 0,
            'delivery_delay_minutes' => 0,
            'expected_duration_minutes' => (int) round(((float)($order['expected_hours_total'] ?? 0)) * 60),
            'actual_duration_minutes' => (int) round(((float)($order['actual_hours_total'] ?? 0)) * 60),
            'variance_minutes' => (int) round(((float)($order['variance_hours'] ?? 0)) * 60),
        ], $snapshot);
    }

    public static function bootstrap(WP_REST_Request $req) {
        global $wpdb;

        // Auto-fix expected_hours for any item_steps that have 0/null (once, lightweight)
        $is_tbl = self::tbl('item_steps');
        $oi_tbl = self::tbl('order_items');
        $ps_tbl = self::tbl('product_steps');
        $zero_steps = $wpdb->get_results(
            "SELECT s.id, s.order_item_id, s.step_name, s.scales_with_qty, s.qty_per_unit,
                    i.product_id, i.quantity
             FROM $is_tbl s
             INNER JOIN $oi_tbl i ON i.id = s.order_item_id
             WHERE (s.expected_hours IS NULL OR s.expected_hours = 0)
             LIMIT 200",
            ARRAY_A
        );
        foreach ($zero_steps as $step) {
            $ps = $wpdb->get_row($wpdb->prepare(
                "SELECT expected_hours, qty_per_unit FROM $ps_tbl WHERE product_id=%d AND step_name=%s LIMIT 1",
                (int)$step['product_id'], $step['step_name']
            ), ARRAY_A);
            if (!$ps || (float)$ps['expected_hours'] <= 0) continue;
            $qty = max(1, (float)($step['quantity'] ?? 1));
            $qpu = max(1, (int)($ps['qty_per_unit'] ?? $step['qty_per_unit'] ?? 1));
            $hrs = (float)$ps['expected_hours'] * ($qty / $qpu);
            $wpdb->update($is_tbl, ['expected_hours' => $hrs], ['id' => (int)$step['id']]);
        }
        // Recalc expected_hours_total on affected orders
        if (!empty($zero_steps)) {
            $order_ids = array_unique(array_map(function($s) use ($wpdb, $oi_tbl) {
                $r = $wpdb->get_var($wpdb->prepare("SELECT order_id FROM $oi_tbl WHERE id=%d", (int)$s['order_item_id']));
                return (int)$r;
            }, $zero_steps));
            foreach ($order_ids as $oid) {
                if (!$oid) continue;
                $total = $wpdb->get_var($wpdb->prepare(
                    "SELECT SUM(s.expected_hours) FROM $is_tbl s INNER JOIN $oi_tbl i ON i.id=s.order_item_id WHERE i.order_id=%d AND s.is_delivery!=1",
                    $oid
                ));
                $wpdb->update(self::tbl('orders'), ['expected_hours_total' => (float)$total], ['id' => $oid]);
            }
        }

        $current_user = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        $current_user_payload = null;
        $user_permissions = [];
        if ($current_user) {
            $current_user_payload = [
                'id'          => $current_user['id'],
                'name'        => $current_user['name'],
                'username'    => $current_user['username'],
                'role'        => $current_user['role'],
                'avatar'      => $current_user['avatar'] ?? null,
                'employee_id' => $current_user['employee_id'] ?? null,
            ];
            $user_permissions = $wpdb->get_col($wpdb->prepare(
                "SELECT perm_key FROM " . self::tbl('app_permissions') . " WHERE user_id=%d",
                (int) $current_user['id']
            )) ?: [];
        }

        $pause_reasons = get_option('cspsr_pause_reasons', '[]');
        $setup = [
            'system_name'           => get_option('cspsr_system_name', ''),
            'logo_url'              => get_option('cspsr_logo_url', ''),
            'logo_base64'           => get_option('cspsr_logo_base64', ''),
            'is_setup_done'         => (bool) get_option('cspsr_setup_done', false),
            'pause_reasons'         => json_decode($pause_reasons, true) ?: [],
            'kds_carousel_interval' => (int) get_option('cspsr_kds_carousel_interval', 8),
            'whatsapp_notify'       => get_option('cspsr_whatsapp_notify', ''),
            'debug_bar_enabled'     => (bool) get_option('cspsr_debug_bar_enabled', 1),
            'company_workday_start' => get_option('cspsr_company_workday_start', '09:00'),
            'company_workday_end'   => get_option('cspsr_company_workday_end', '17:00'),
            'company_working_days'  => self::normalize_working_days(get_option('cspsr_company_working_days', [0,1,2,3,4,5,6])),
            'company_holidays'      => self::normalize_holidays(get_option('cspsr_company_holidays', [])),
            'notify_printing_team_id'        => (int) get_option('cspsr_notify_printing_team_id', 0),
            'notify_logistics_department_id' => (int) get_option('cspsr_notify_logistics_department_id', 0),
            'notification_rules'            => self::normalize_notification_rules(get_option('cspsr_notification_rules', '[]')),
            'fcm' => [
                'enabled' => (bool) get_option('cspsr_fcm_enabled', false),
                'vapid_public' => (string) get_option('cspsr_fcm_vapid_public', ''),
                'config' => self::normalize_fcm_config(get_option('cspsr_fcm_config', '')),
                'service_account_set' => (
                    (string) get_option('cspsr_fcm_service_account_json', '') !== ''
                    || ((string) get_option('cspsr_fcm_service_account_path', '') !== '' && file_exists((string) get_option('cspsr_fcm_service_account_path', '')))
                ),
            ],
        ];
        $time_meta = [
            'server_now' => self::now(),
            'server_gmt_offset_minutes' => (int) round(((float) get_option('gmt_offset', 0)) * 60),
            'server_timezone_string' => (string) get_option('timezone_string', ''),
        ];

        $n_tbl = self::tbl('notifications');
        $notifications = [];
        if ($wpdb->get_var("SHOW TABLES LIKE '".$n_tbl."'")) {
            $uid = (int)($current_user_payload['id'] ?? 0);
            if (self::has_column($n_tbl, 'user_id')) {
                if ($uid > 0) {
                    $notifications = $wpdb->get_results(
                        $wpdb->prepare("SELECT * FROM $n_tbl WHERE (user_id IS NULL OR user_id=%d) ORDER BY created_at DESC LIMIT 100", $uid),
                        ARRAY_A
                    ) ?: [];
                } else {
                    $notifications = $wpdb->get_results("SELECT * FROM $n_tbl WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 100", ARRAY_A) ?: [];
                }
            } else {
                $notifications = $wpdb->get_results("SELECT * FROM $n_tbl ORDER BY created_at DESC LIMIT 100", ARRAY_A) ?: [];
            }
        }

        return self::ok([
            'customers'     => $wpdb->get_results("SELECT * FROM " . self::tbl('customers') . " ORDER BY id DESC", ARRAY_A),
            'roles'         => $wpdb->get_results("SELECT * FROM " . self::tbl('roles') . " ORDER BY name", ARRAY_A),
            'departments'   => $wpdb->get_results("SELECT * FROM " . self::tbl('departments') . " ORDER BY sort_order ASC, id ASC", ARRAY_A),
            'teams'         => $wpdb->get_results("SELECT * FROM " . self::tbl('teams') . " ORDER BY name", ARRAY_A),
            'employees'     => $wpdb->get_results("SELECT * FROM " . self::tbl('employees') . " ORDER BY name", ARRAY_A),
            'statuses'      => $wpdb->get_results("SELECT * FROM " . self::tbl('statuses') . " ORDER BY sort_order", ARRAY_A),
            'products'      => $wpdb->get_results("SELECT * FROM " . self::tbl('products') . " ORDER BY name", ARRAY_A),
            'product_steps' => self::_get_product_steps_with_str_ids(),
            'step_library'  => self::_get_step_library_with_emp_ids(),
            'suppliers'     => $wpdb->get_var("SHOW TABLES LIKE '".self::tbl('suppliers')."'") ? $wpdb->get_results("SELECT * FROM " . self::tbl('suppliers') . " WHERE is_active=1 ORDER BY name", ARRAY_A) : [],
            'orders'        => self::_fetch_orders_with_relations(),
            'notifications' => $notifications,
            'ops-tasks'     => self::_fetch_ops_tasks("(t.completed_at IS NULL OR t.completed_at = '' OR t.completed_at = '0000-00-00 00:00:00')"),
            'setup'         => $setup,
            'time_meta'     => $time_meta,
            'current_user'  => $current_user_payload,
            'user_permissions' => $user_permissions,
        ]);
    }

    // ── Orders with full joins ────────────────────────────────────────────────
    private static function _fetch_orders_with_relations($where = '1=1', $limit = null, $offset = 0, $order_by = 'o.queue_order ASC, o.id ASC') {
        global $wpdb;
        $limit_sql = '';
        if ($limit !== null) {
            $limit_sql = ' LIMIT ' . max(1, (int) $limit) . ' OFFSET ' . max(0, (int) $offset);
        }
        $orders = $wpdb->get_results(
            "SELECT o.*,
                    c.name AS customer_name, c.company_name AS customer_company_name,
                    c.name_en AS customer_name_en, c.company_name_en AS customer_company_name_en,
                    c.phone AS customer_phone,
                    cr.name AS recipient_name, cr.phone AS recipient_phone,
                    cr.address AS recipient_address, cr.map_url AS recipient_map_url,
                    cc.name AS contact_person_name_linked, cc.phone AS contact_person_phone_linked,
                    cc.email AS contact_person_email_linked, cc.map_url AS contact_person_map_linked
             FROM " . self::tbl('orders') . " o
             LEFT JOIN " . self::tbl('customers') . " c  ON c.id = o.customer_id
             LEFT JOIN " . self::tbl('customer_recipients') . " cr ON cr.id = o.recipient_id
             LEFT JOIN " . self::tbl('customer_contacts') . " cc ON cc.id = o.contact_person_id
             WHERE $where
             ORDER BY $order_by
             $limit_sql",
            ARRAY_A
        );

        $supplier_rows = $wpdb->get_results(
            "SELECT * FROM " . self::tbl('suppliers'),
            ARRAY_A
        );
        $suppliers_by_id = [];
        foreach (($supplier_rows ?: []) as $supplier_row) {
            $suppliers_by_id[(int)$supplier_row['id']] = $supplier_row;
        }

        // Attach items + steps
        foreach ($orders as &$order) {
            self::repair_order_step_data((int)$order['id']);
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM " . self::tbl('order_items') . " WHERE order_id = %d ORDER BY id",
                $order['id']
            ), ARRAY_A);
            $order_started = !empty($order['started_at']) || !empty($order['production_started_at']) || (($order['status_slug'] ?? '') === 'in_progress');
            $current_label = trim((string)($order['current_step_label'] ?? ''));
            $has_active_step = false;
            $first_unfinished = null;
            $matched_pending_step = null;

            foreach ($items as &$item) {
                $item['steps'] = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM " . self::tbl('item_steps') . " WHERE order_item_id = %d ORDER BY step_order",
                    $item['id']
                ), ARRAY_A);
                foreach ($item['steps'] as &$step) {
                    if (!empty($step['is_external'])) {
                        $supplier_id = !empty($step['supplier_id']) ? (int)$step['supplier_id'] : 0;
                        if (!$supplier_id) {
                            $supplier_id = (int) self::product_step_supplier((int)($item['product_id'] ?? 0), $step['step_name'] ?? '', $step['step_name_en'] ?? '');
                            if ($supplier_id && self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                                $step['supplier_id'] = $supplier_id;
                                $wpdb->update(self::tbl('item_steps'), ['supplier_id' => $supplier_id], ['id' => (int)$step['id']]);
                            }
                        }
                        if ($supplier_id && !empty($suppliers_by_id[$supplier_id])) {
                            $step['supplier_name'] = $suppliers_by_id[$supplier_id]['name'] ?? ($suppliers_by_id[$supplier_id]['company_name'] ?? '');
                            $step['supplier_name_en'] = $suppliers_by_id[$supplier_id]['name_en'] ?? ($suppliers_by_id[$supplier_id]['company_name_en'] ?? '');
                        }
                    }
                    if ($first_unfinished === null && !in_array($step['status_slug'], ['done', 'completed'], true)) {
                        $first_unfinished = $step;
                    }
                    if ($step['status_slug'] === 'in_progress') {
                        $fallback_start = $step['actual_started_at'] ?? ($step['started_at'] ?? ($order['production_started_at'] ?? ($order['started_at'] ?? null)));
                        if (!empty($fallback_start) && (empty($step['started_at']) || empty($step['actual_started_at']))) {
                            $patch = [];
                            if (empty($step['started_at'])) {
                                $step['started_at'] = $fallback_start;
                                $patch['started_at'] = $fallback_start;
                            }
                            if (empty($step['actual_started_at'])) {
                                $step['actual_started_at'] = $fallback_start;
                                $patch['actual_started_at'] = $fallback_start;
                            }
                            if (!empty($patch)) {
                                $wpdb->update(self::tbl('item_steps'), $patch, ['id' => (int)$step['id']]);
                            }
                        }
                        $has_active_step = true;
                    }
                    if (
                        $current_label !== '' &&
                        !$matched_pending_step &&
                        $step['status_slug'] === 'pending' &&
                        (
                            trim((string)($step['step_name'] ?? '')) === $current_label ||
                            trim((string)($step['step_name_en'] ?? '')) === $current_label
                        )
                    ) {
                        $matched_pending_step = $step;
                    }
                    $step['metrics'] = self::calc_step_metrics($step);
                    $step['external_metrics'] = self::calc_external_metrics($step);
                }
                $external_step = null;
                $delivery_step = null;
                foreach ($item['steps'] as $srow) {
                    if (!$external_step && !empty($srow['is_external'])) $external_step = $srow;
                    if (!$delivery_step && !empty($srow['is_delivery'])) $delivery_step = $srow;
                }
                $item['external_send_at'] = $external_step['ext_send_at'] ?? null;
                $item['external_receive_expected'] = $external_step['ext_receive_expected'] ?? null;
                $item['delivery_scheduled_at'] = $delivery_step['planned_start_at'] ?? null;
                $item['delivery_state'] = !empty($item['is_delivered']) ? 'delivered' : (!empty($item['is_ready_for_delivery']) ? 'queued_for_delivery' : 'in_production');
            }

            if ($order_started && !$has_active_step) {
                $step_to_activate = $matched_pending_step ?: $first_unfinished;
                if ($step_to_activate && ($step_to_activate['status_slug'] ?? '') === 'pending') {
                    $now = self::now();
                    $queue_wait = !empty($step_to_activate['planned_start_at'])
                        ? self::minutes_between($step_to_activate['planned_start_at'], $now)
                        : (int)($step_to_activate['queue_wait_minutes'] ?? 0);
                    $wpdb->update(self::tbl('item_steps'), [
                        'status_slug' => 'in_progress',
                        'started_at' => $step_to_activate['started_at'] ?: $now,
                        'actual_started_at' => $step_to_activate['actual_started_at'] ?: ($step_to_activate['started_at'] ?: $now),
                        'queue_wait_minutes' => $queue_wait,
                    ], ['id' => (int)$step_to_activate['id']]);
                    if (!$current_label) {
                        $order['current_step_label'] = $step_to_activate['step_name'] ?? null;
                        $wpdb->update(self::tbl('orders'), [
                            'current_step_label' => $order['current_step_label'],
                            'status_slug' => 'in_progress',
                        ], ['id' => (int)$order['id']]);
                    }
                    $items = $wpdb->get_results($wpdb->prepare(
                        "SELECT * FROM " . self::tbl('order_items') . " WHERE order_id = %d ORDER BY id",
                        $order['id']
                    ), ARRAY_A);
                    foreach ($items as &$item) {
                        $item['steps'] = $wpdb->get_results($wpdb->prepare(
                            "SELECT * FROM " . self::tbl('item_steps') . " WHERE order_item_id = %d ORDER BY step_order",
                            $item['id']
                        ), ARRAY_A);
                        foreach ($item['steps'] as &$step) {
                            if (!empty($step['is_external'])) {
                                $supplier_id = !empty($step['supplier_id']) ? (int)$step['supplier_id'] : 0;
                                if (!$supplier_id) {
                                    $supplier_id = (int) self::product_step_supplier((int)($item['product_id'] ?? 0), $step['step_name'] ?? '', $step['step_name_en'] ?? '');
                                    if ($supplier_id && self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                                        $step['supplier_id'] = $supplier_id;
                                        $wpdb->update(self::tbl('item_steps'), ['supplier_id' => $supplier_id], ['id' => (int)$step['id']]);
                                    }
                                }
                                if ($supplier_id && !empty($suppliers_by_id[$supplier_id])) {
                                    $step['supplier_name'] = $suppliers_by_id[$supplier_id]['name'] ?? ($suppliers_by_id[$supplier_id]['company_name'] ?? '');
                                    $step['supplier_name_en'] = $suppliers_by_id[$supplier_id]['name_en'] ?? ($suppliers_by_id[$supplier_id]['company_name_en'] ?? '');
                                }
                            }
                            $step['metrics'] = self::calc_step_metrics($step);
                            $step['external_metrics'] = self::calc_external_metrics($step);
                        }
                        unset($step);
                        $external_step = null;
                        $delivery_step = null;
                        foreach ($item['steps'] as $srow) {
                            if (!$external_step && !empty($srow['is_external'])) $external_step = $srow;
                            if (!$delivery_step && !empty($srow['is_delivery'])) $delivery_step = $srow;
                        }
                        $item['external_send_at'] = $external_step['ext_send_at'] ?? null;
                        $item['external_receive_expected'] = $external_step['ext_receive_expected'] ?? null;
                        $item['delivery_scheduled_at'] = $delivery_step['planned_start_at'] ?? null;
                        $item['delivery_state'] = !empty($item['is_delivered']) ? 'delivered' : (!empty($item['is_ready_for_delivery']) ? 'queued_for_delivery' : 'in_production');
                    }
                }
            }
            $order['items'] = $items;
            $order['delivery_batches'] = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM " . self::tbl('delivery_batches') . " WHERE order_id=%d ORDER BY batch_no ASC, id ASC",
                (int)$order['id']
            ), ARRAY_A) ?: [];
            $order['recipients'] = $wpdb->get_results($wpdb->prepare(
                "SELECT or2.*, cr.name AS rec_name, cr.phone AS rec_phone
                 FROM ".self::tbl('order_recipients')." or2
                 LEFT JOIN ".self::tbl('customer_recipients')." cr ON cr.id = or2.recipient_id
                 WHERE or2.order_id=%d ORDER BY or2.id", (int)$order['id']
            ), ARRAY_A) ?: [];
            $order['delivery_attempts'] = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM " . self::tbl('delivery_attempts') . " WHERE order_id=%d ORDER BY attempt_no ASC, id ASC",
                (int)$order['id']
            ), ARRAY_A) ?: [];
            $order['ops_tasks'] = [];
            $ops_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT id, task_no, description, created_at, completed_at, assigned_employee_id
                 FROM " . self::tbl('ops_tasks') . "
                 WHERE linked_order_id=%d
                 ORDER BY id ASC",
                (int)$order['id']
            ), ARRAY_A) ?: [];
            foreach ($ops_rows as &$ops_row) {
                $ops_row['timeline'] = self::ops_task_timeline((int)$ops_row['id']);
            }
            unset($ops_row);
            $order['ops_tasks'] = $ops_rows;
            $order['events'] = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM " . self::tbl('order_events') . " WHERE order_id=%d ORDER BY event_time DESC, id DESC LIMIT 100",
                (int)$order['id']
            ), ARRAY_A) ?: [];
            self::hydrate_order_metrics($order);
        }
        return $orders;
    }

    // ────────────────────────────────────────────────────────────────────────
    //  ROLES
    // ────────────────────────────────────────────────────────────────────────
    public static function list_roles()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('roles')." ORDER BY name", ARRAY_A)); }
    public static function get_roles(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('roles')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_roles(WP_REST_Request $r) { global $wpdb; $d=$r->get_json_params(); $wpdb->insert(self::tbl('roles'),['name'=>$d['name']??'','name_en'=>$d['name_en']??'','color'=>$d['color']??'#6366f1']); return self::created(['id'=>$wpdb->insert_id]); }
    public static function update_roles(WP_REST_Request $r) { global $wpdb; $d=$r->get_json_params(); $wpdb->update(self::tbl('roles'),['name'=>$d['name']??'','name_en'=>$d['name_en']??'','color'=>$d['color']??'#6366f1'],['id'=>$r['id']]); return self::ok(['updated'=>true]); }
    public static function delete_roles(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('roles'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  DEPARTMENTS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_departments()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('departments')." ORDER BY sort_order ASC, id ASC", ARRAY_A)); }
    public static function get_departments(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('departments')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_departments(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('departments'),[
            'name' => $d['name'] ?? '',
            'name_en' => $d['name_en'] ?? '',
            'color' => $d['color'] ?? '#0ea5e9',
            'sort_order' => (int)($d['sort_order'] ?? 0),
            'workday_start' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days' => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays' => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
        ]);
        self::reschedule_open_orders();
        return self::created(['id'=>$wpdb->insert_id]);
    }
    public static function update_departments(WP_REST_Request $r) {
        global $wpdb;
        $d=$r->get_json_params();
        $wpdb->update(self::tbl('departments'),[
            'name'=>$d['name']??'',
            'name_en'=>$d['name_en']??'',
            'color'=>$d['color']??'#0ea5e9',
            'sort_order'=>(int)($d['sort_order']??0),
            'workday_start' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days' => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays' => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
        ],['id'=>$r['id']]);
        self::reschedule_open_orders();
        return self::ok(['updated'=>true]);
    }
    public static function delete_departments(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('departments'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }
    public static function reorder_departments(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $ids = $d['ids'] ?? []; // ordered array of IDs
        foreach ($ids as $i => $id) {
            $wpdb->update(self::tbl('departments'), ['sort_order' => $i], ['id' => (int)$id]);
        }
        return self::ok(['reordered' => true]);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  TEAMS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_teams()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('teams')." ORDER BY name", ARRAY_A)); }
    public static function get_teams(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('teams')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_teams(WP_REST_Request $r) {
        global $wpdb;
        $d=$r->get_json_params();
        $wpdb->insert(self::tbl('teams'),[
            'name'=>$d['name']??'',
            'name_en'=>$d['name_en']??'',
            'department_id'=>$d['department_id']??null,
            'lead_employee_id'=>$d['lead_employee_id']??null,
            'workday_start' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days' => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays' => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
        ]);
        self::reschedule_open_orders();
        return self::created(['id'=>$wpdb->insert_id]);
    }
    public static function update_teams(WP_REST_Request $r) {
        global $wpdb;
        $d  = $r->get_json_params();
        $tid = (int)$r['id'];
        $wpdb->update(self::tbl('teams'), [
            'name'             => $d['name'] ?? '',
            'name_en'          => $d['name_en'] ?? '',
            'department_id'    => !empty($d['department_id'])    ? (int)$d['department_id']    : null,
            'lead_employee_id' => !empty($d['lead_employee_id']) ? (int)$d['lead_employee_id'] : null,
            'workday_start'    => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end'      => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days'     => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays'         => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
        ], ['id' => $tid]);
        /* sync member_ids → employee.team_id */
        if (isset($d['member_ids']) && is_array($d['member_ids'])) {
            $new_ids = array_map('intval', $d['member_ids']);
            /* clear all employees currently in this team */
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('employees')." SET team_id=NULL WHERE team_id=%d", $tid
            ));
            /* assign selected employees */
            foreach ($new_ids as $eid) {
                if ($eid > 0) {
                    $wpdb->update(self::tbl('employees'), ['team_id' => $tid], ['id' => $eid]);
                }
            }
        }
        self::reschedule_open_orders();
        return self::ok(['updated' => true]);
    }
    public static function delete_teams(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('teams'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  EMPLOYEES
    // ────────────────────────────────────────────────────────────────────────
    public static function list_employees()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('employees')." ORDER BY name", ARRAY_A)); }

    // ── Suppliers ─────────────────────────────────────────────────────────────
    public static function list_suppliers(WP_REST_Request $r = null) {
        global $wpdb;
        $r = $r ?: new WP_REST_Request('GET');
        $tbl = self::tbl('suppliers');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) {
            // Table missing — create it now
            $charset = $wpdb->get_charset_collate();
            $wpdb->query("CREATE TABLE IF NOT EXISTS $tbl (
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
        }
        $q = trim((string) $r->get_param('q'));
        $has_page = ($r->get_param('page') !== null || $r->get_param('per_page') !== null);
        if (!$has_page && $q === '') {
            return self::ok($wpdb->get_results("SELECT * FROM $tbl ORDER BY name", ARRAY_A));
        }

        $pagination = self::pagination_params($r, 25, 200);
        $where = "1=1";
        $params = [];
        if ($q !== '') {
            $like = '%' . $wpdb->esc_like($q) . '%';
            $where .= " AND (name LIKE %s OR name_en LIKE %s OR phone LIKE %s OR phone_alt LIKE %s)";
            array_push($params, $like, $like, $like, $like);
        }

        $count_sql = "SELECT COUNT(*) FROM $tbl WHERE $where";
        $total = (int) $wpdb->get_var($params ? $wpdb->prepare($count_sql, ...$params) : $count_sql);

        $rows_sql = "SELECT * FROM $tbl WHERE $where ORDER BY name ASC LIMIT %d OFFSET %d";
        $rows_params = $params;
        $rows_params[] = $pagination['per_page'];
        $rows_params[] = $pagination['offset'];
        $rows = $wpdb->get_results($wpdb->prepare($rows_sql, ...$rows_params), ARRAY_A);
        return self::ok(self::paged_payload($rows, $pagination['page'], $pagination['per_page'], $total));
    }
    public static function get_suppliers(WP_REST_Request $r) {
        global $wpdb;
        $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('suppliers')." WHERE id=%d",$r['id']),ARRAY_A);
        return $row?self::ok($row):self::err('Not found',404);
    }
    public static function create_suppliers(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $tbl = self::tbl('suppliers');
        // Auto-create table if missing
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) {
            $charset = $wpdb->get_charset_collate();
            $wpdb->query("CREATE TABLE IF NOT EXISTS $tbl (
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
        }
        // Add missing columns if needed
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");
        if (!in_array('phone_alt', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN phone_alt varchar(50) DEFAULT ''");
        if (!in_array('name_en',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN name_en varchar(191) DEFAULT ''");
        if (!in_array('workday_start', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00'");
        if (!in_array('workday_end',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00'");
        if (!in_array('working_days', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN working_days text DEFAULT NULL");
        if (!in_array('holidays', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN holidays text DEFAULT NULL");
        if (!in_array('map_url',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN map_url text DEFAULT NULL");
        if (!in_array('notes',     $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN notes text DEFAULT NULL");
        if (!in_array('is_active', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN is_active tinyint(1) DEFAULT 1");

        $data = ['name' => $d['name'] ?? '', 'is_active' => (int)($d['is_active'] ?? 1)];
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl"); // re-fetch after patches
        if (in_array('name_en',   $cols)) $data['name_en']   = $d['name_en']   ?? '';
        if (in_array('phone',     $cols)) $data['phone']     = $d['phone']     ?? '';
        if (in_array('phone_alt', $cols)) $data['phone_alt'] = $d['phone_alt'] ?? '';
        if (in_array('workday_start', $cols)) $data['workday_start'] = preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00';
        if (in_array('workday_end',   $cols)) $data['workday_end']   = preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00';
        if (in_array('working_days',  $cols)) $data['working_days']  = self::as_json(self::normalize_working_days($d['working_days'] ?? []));
        if (in_array('holidays',      $cols)) $data['holidays']      = self::as_json(self::normalize_holidays($d['holidays'] ?? []));
        if (in_array('map_url',   $cols)) $data['map_url']   = $d['map_url']   ?? '';
        if (in_array('notes',     $cols)) $data['notes']     = $d['notes']     ?? '';

        $wpdb->insert($tbl, $data);
        if ($wpdb->last_error) return self::err('DB error: '.$wpdb->last_error, 500);
        self::reschedule_open_orders();
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_suppliers(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $tbl = self::tbl('suppliers');
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");
        // Add missing columns
        if (!in_array('phone_alt', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN phone_alt varchar(50) DEFAULT ''");
        if (!in_array('name_en',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN name_en varchar(191) DEFAULT ''");
        if (!in_array('workday_start', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN workday_start varchar(5) DEFAULT '09:00'");
        if (!in_array('workday_end',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN workday_end varchar(5) DEFAULT '17:00'");
        if (!in_array('working_days', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN working_days text DEFAULT NULL");
        if (!in_array('holidays', $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN holidays text DEFAULT NULL");
        if (!in_array('map_url',   $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN map_url text DEFAULT NULL");
        if (!in_array('notes',     $cols)) $wpdb->query("ALTER TABLE $tbl ADD COLUMN notes text DEFAULT NULL");
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");

        $data = ['name' => $d['name'] ?? '', 'is_active' => (int)($d['is_active'] ?? 1)];
        if (in_array('name_en',   $cols)) $data['name_en']   = $d['name_en']   ?? '';
        if (in_array('phone',     $cols)) $data['phone']     = $d['phone']     ?? '';
        if (in_array('phone_alt', $cols)) $data['phone_alt'] = $d['phone_alt'] ?? '';
        if (in_array('workday_start', $cols)) $data['workday_start'] = preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00';
        if (in_array('workday_end',   $cols)) $data['workday_end']   = preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00';
        if (in_array('working_days',  $cols)) $data['working_days']  = self::as_json(self::normalize_working_days($d['working_days'] ?? []));
        if (in_array('holidays',      $cols)) $data['holidays']      = self::as_json(self::normalize_holidays($d['holidays'] ?? []));
        if (in_array('map_url',   $cols)) $data['map_url']   = $d['map_url']   ?? '';
        if (in_array('notes',     $cols)) $data['notes']     = $d['notes']     ?? '';

        $wpdb->update($tbl, $data, ['id' => (int)$r['id']]);
        if ($wpdb->last_error) return self::err('DB error: '.$wpdb->last_error, 500);
        self::reschedule_open_orders();
        return self::ok(['updated' => true]);
    }
    public static function delete_suppliers(WP_REST_Request $r) {
        global $wpdb;
        $wpdb->delete(self::tbl('suppliers'), ['id' => (int)$r['id']]);
        return self::ok(['deleted' => true]);
    }
    public static function get_employees(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('employees')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_employees(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('employees'), [
            'name'          => $d['name'] ?? '',
            'name_en'       => $d['name_en'] ?? '',
            'role_id'       => $d['role_id'] ?? null,
            'department_id' => $d['department_id'] ?? null,
            'team_id'       => $d['team_id'] ?? null,
            'workday_start' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end'   => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days'  => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays'      => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
            'phone'         => $d['phone'] ?? '',
            'is_active'     => $d['is_active'] ?? 1,
        ]);
        self::reschedule_open_orders();
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_employees(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->update(self::tbl('employees'), [
            'name'          => $d['name'] ?? '',
            'name_en'       => $d['name_en'] ?? '',
            'role_id'       => $d['role_id'] ?? null,
            'department_id' => $d['department_id'] ?? null,
            'team_id'       => $d['team_id'] ?? null,
            'workday_start' => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_start'] ?? '')) ? $d['workday_start'] : '09:00',
            'workday_end'   => preg_match('/^\d{2}:\d{2}$/', (string)($d['workday_end'] ?? '')) ? $d['workday_end'] : '17:00',
            'working_days'  => self::as_json(self::normalize_working_days($d['working_days'] ?? [])),
            'holidays'      => self::as_json(self::normalize_holidays($d['holidays'] ?? [])),
            'phone'         => $d['phone'] ?? '',
            'is_active'     => $d['is_active'] ?? 1,
        ], ['id' => $r['id']]);
        self::reschedule_open_orders();
        return self::ok(['updated' => true]);
    }
    public static function delete_employees(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        // Block delete if this employee is linked to a user account
        $linked = $wpdb->get_var($wpdb->prepare("SELECT id FROM ".self::tbl('app_users')." WHERE employee_id=%d", $id));
        if ($linked) return self::err('لا يمكن حذف موظف مرتبط بحساب مستخدم. احذف المستخدم أولاً.', 409);
        $wpdb->delete(self::tbl('employees'), ['id'=>$id]);
        return self::ok(['deleted'=>true]);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  STATUSES
    // ────────────────────────────────────────────────────────────────────────
    public static function list_statuses()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('statuses')." ORDER BY sort_order", ARRAY_A)); }
    public static function get_statuses(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('statuses')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_statuses(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('statuses'), [
            'name'       => $d['name'] ?? '',
            'name_en'    => $d['name_en'] ?? '',
            'slug'       => $d['slug'] ?? sanitize_title($d['name'] ?? ''),
            'color'      => $d['color'] ?? '#6b7280',
            'sort_order' => $d['sort_order'] ?? 0,
            'is_done'    => $d['is_done'] ?? 0,
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_statuses(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->update(self::tbl('statuses'), [
            'name'       => $d['name'] ?? '',
            'name_en'    => $d['name_en'] ?? '',
            'slug'       => $d['slug'] ?? '',
            'color'      => $d['color'] ?? '#6b7280',
            'sort_order' => $d['sort_order'] ?? 0,
            'is_done'    => $d['is_done'] ?? 0,
        ], ['id' => $r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_statuses(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('statuses'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  PRODUCTS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_products()   { global $wpdb; return self::ok($wpdb->get_results("SELECT * FROM ".self::tbl('products')." ORDER BY name", ARRAY_A)); }
    public static function get_products(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('products')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_products(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('products'), [
            'name'            => $d['name'] ?? '',
            'name_en'         => $d['name_en'] ?? '',
            'sku'             => $d['sku'] ?? '',
            'description'     => $d['description'] ?? '',
            'description_en'  => $d['description_en'] ?? '',
            'estimated_hours' => $d['estimated_hours'] ?? 0,
            'is_active'       => $d['is_active'] ?? 1,
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_products(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->update(self::tbl('products'), [
            'name'            => $d['name'] ?? '',
            'name_en'         => $d['name_en'] ?? '',
            'sku'             => $d['sku'] ?? '',
            'description'     => $d['description'] ?? '',
            'description_en'  => $d['description_en'] ?? '',
            'estimated_hours' => $d['estimated_hours'] ?? 0,
            'is_active'       => $d['is_active'] ?? 1,
        ], ['id' => $r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_products(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('products'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  NOTIFICATIONS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_notifications()   {
        global $wpdb;
        $tbl = self::tbl('notifications');
        $has_user_col = self::has_column($tbl, 'user_id');
        if (!$has_user_col) {
            return self::ok($wpdb->get_results("SELECT * FROM $tbl ORDER BY created_at DESC LIMIT 100", ARRAY_A));
        }
        $actor = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        $actor_id = $actor && !empty($actor['id']) ? (int) $actor['id'] : 0;
        if ($actor_id <= 0) {
            return self::ok($wpdb->get_results("SELECT * FROM $tbl WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 100", ARRAY_A));
        }
        return self::ok($wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $tbl WHERE user_id IS NULL OR user_id=%d ORDER BY created_at DESC LIMIT 100", $actor_id),
            ARRAY_A
        ));
    }
    public static function get_notifications(WP_REST_Request $r)    { global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('notifications')." WHERE id=%d",$r['id']),ARRAY_A); return $row?self::ok($row):self::err('Not found',404); }
    public static function create_notifications(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $tbl = self::tbl('notifications');
        $actor = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        $actor_id = $actor && !empty($actor['id']) ? (int) $actor['id'] : null;
        $is_admin = $actor && (($actor['role'] ?? '') === 'admin');

        $user_id = null;
        $has_user_col = self::has_column($tbl, 'user_id');
        if ($has_user_col) {
            // Default: personal notification (only current user).
            $user_id = $actor_id;

            // Admin can target specific scopes.
            $scope = strtolower(trim((string)($d['scope'] ?? 'me')));
            if ($is_admin) {
                if ($scope === 'broadcast' || $scope === 'all') {
                    $uids = self::user_ids_all_active();
                    $title = sanitize_text_field((string)($d['title'] ?? ''));
                    $body  = sanitize_textarea_field((string)($d['body'] ?? ''));
                    $type  = sanitize_key((string)($d['type'] ?? 'info')) ?: 'info';
                    $count = self::create_personal_notifications($uids, $title, $body, $type);
                    return self::created(['created' => $count]);
                }
                if ($scope === 'department') {
                    $dept_id = (int) ($d['department_id'] ?? 0);
                    $uids = self::user_ids_by_department_id($dept_id);
                    $title = sanitize_text_field((string)($d['title'] ?? ''));
                    $body  = sanitize_textarea_field((string)($d['body'] ?? ''));
                    $type  = sanitize_key((string)($d['type'] ?? 'info')) ?: 'info';
                    $count = self::create_personal_notifications($uids, $title, $body, $type);
                    return self::created(['created' => $count, 'department_id' => $dept_id]);
                }
                if ($scope === 'team') {
                    $team_id = (int) ($d['team_id'] ?? 0);
                    $uids = self::user_ids_by_team_id($team_id);
                    $title = sanitize_text_field((string)($d['title'] ?? ''));
                    $body  = sanitize_textarea_field((string)($d['body'] ?? ''));
                    $type  = sanitize_key((string)($d['type'] ?? 'info')) ?: 'info';
                    $count = self::create_personal_notifications($uids, $title, $body, $type);
                    return self::created(['created' => $count, 'team_id' => $team_id]);
                }
                if (isset($d['user_id'])) {
                    $target = (int) $d['user_id'];
                    $user_id = $target > 0 ? $target : $actor_id;
                } elseif ($scope === 'broadcast') {
                    $user_id = null;
                }
            }
        }

        $row = [
            'title' => $d['title'] ?? '',
            'body'  => $d['body'] ?? '',
            'type'  => $d['type'] ?? 'info',
        ];
        if ($has_user_col) {
            $row['user_id'] = $user_id;
        }
        $wpdb->insert($tbl, $row);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_notifications(WP_REST_Request $r) {
        global $wpdb;
        $tbl = self::tbl('notifications');
        $id = (int) $r['id'];
        $actor = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        $actor_id = $actor && !empty($actor['id']) ? (int) $actor['id'] : null;
        $is_admin = $actor && (($actor['role'] ?? '') === 'admin');
        if (self::has_column($tbl, 'user_id') && !$is_admin) {
            // Regular users can only mark their own notifications (or broadcast user_id NULL).
            $allowed = $wpdb->get_var($wpdb->prepare("SELECT id FROM $tbl WHERE id=%d AND (user_id IS NULL OR user_id=%d) LIMIT 1", $id, $actor_id));
            if (!$allowed) return self::err('Not found', 404);
        }
        $wpdb->update($tbl, ['is_read' => 1], ['id' => $id]);
        return self::ok(['updated' => true]);
    }
    public static function delete_notifications(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('notifications'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  CUSTOMERS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_customers(WP_REST_Request $r = null) {
        global $wpdb;
        $r = $r ?: new WP_REST_Request('GET');
        $tbl = self::tbl('customers');
        $q = trim((string) $r->get_param('q'));
        $has_page = ($r->get_param('page') !== null || $r->get_param('per_page') !== null);
        if (!$has_page && $q === '') {
            return self::ok($wpdb->get_results("SELECT * FROM $tbl ORDER BY id DESC", ARRAY_A));
        }

        $pagination = self::pagination_params($r, 25, 200);
        $where = "1=1";
        $params = [];
        if ($q !== '') {
            $like = '%' . $wpdb->esc_like($q) . '%';
            $where .= " AND (name LIKE %s OR name_en LIKE %s OR company_name LIKE %s OR company_name_en LIKE %s OR phone LIKE %s OR address LIKE %s OR address_en LIKE %s)";
            array_push($params, $like, $like, $like, $like, $like, $like, $like);
        }

        $count_sql = "SELECT COUNT(*) FROM $tbl WHERE $where";
        $total = (int) $wpdb->get_var($params ? $wpdb->prepare($count_sql, ...$params) : $count_sql);

        $rows_sql = "SELECT * FROM $tbl WHERE $where ORDER BY id DESC LIMIT %d OFFSET %d";
        $rows_params = $params;
        $rows_params[] = $pagination['per_page'];
        $rows_params[] = $pagination['offset'];
        $rows = $wpdb->get_results($wpdb->prepare($rows_sql, ...$rows_params), ARRAY_A);
        return self::ok(self::paged_payload($rows, $pagination['page'], $pagination['per_page'], $total));
    }
    public static function get_customers(WP_REST_Request $r) {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('customers')." WHERE id=%d", $r['id']), ARRAY_A);
        if (!$row) return self::err('Not found', 404);
        $row['recipients'] = $wpdb->get_results($wpdb->prepare("SELECT * FROM ".self::tbl('customer_recipients')." WHERE customer_id=%d ORDER BY id", $r['id']), ARRAY_A);
        return self::ok($row);
    }
    public static function create_customers(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('customers'), [
            'name'             => $d['name'] ?? '',
            'name_en'          => $d['name_en'] ?? '',
            'company_name'     => $d['company_name'] ?? '',
            'company_name_en'  => $d['company_name_en'] ?? '',
            'phone'            => $d['phone'] ?? '',
            'phone_alt'        => $d['phone_alt'] ?? '',
            'address'          => $d['address'] ?? '',
            'address_en'       => $d['address_en'] ?? '',
            'map_url'          => $d['map_url'] ?? '',
            'lat'              => $d['lat'] ?? '',
            'lng'              => $d['lng'] ?? '',
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_customers(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->update(self::tbl('customers'), [
            'name'             => $d['name'] ?? '',
            'name_en'          => $d['name_en'] ?? '',
            'company_name'     => $d['company_name'] ?? '',
            'company_name_en'  => $d['company_name_en'] ?? '',
            'phone'            => $d['phone'] ?? '',
            'phone_alt'        => $d['phone_alt'] ?? '',
            'address'          => $d['address'] ?? '',
            'address_en'       => $d['address_en'] ?? '',
            'map_url'          => $d['map_url'] ?? '',
            'lat'              => $d['lat'] ?? '',
            'lng'              => $d['lng'] ?? '',
        ], ['id' => $r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_customers(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('customers'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ── Recipients ────────────────────────────────────────────────────────────
    public static function list_recipients(WP_REST_Request $r) {
        global $wpdb;
        return self::ok($wpdb->get_results($wpdb->prepare("SELECT * FROM ".self::tbl('customer_recipients')." WHERE customer_id=%d ORDER BY id", $r['id']), ARRAY_A));
    }
    public static function create_recipient(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('customer_recipients'), [
            'customer_id'    => $r['id'],
            'name'           => $d['name'] ?? '',
            'phone'          => $d['phone'] ?? '',
            'address'        => $d['address'] ?? '',
            'map_url'        => $d['map_url'] ?? '',
            'lat'            => $d['lat'] ?? '',
            'lng'            => $d['lng'] ?? '',
            'delivery_notes'   => $d['delivery_notes'] ?? '',
            'contact_person_id'    => !empty($d['contact_person_id']) ? (int)$d['contact_person_id'] : null,
            'contact_person_name'  => $d['contact_person_name'] ?? '',
            'contact_person_phone' => $d['contact_person_phone'] ?? '',
            'contact_name'     => $d['contact_name'] ?? '',
            'contact_phone'    => $d['contact_phone'] ?? '',
            'contact_email'    => $d['contact_email'] ?? '',
            'contact_map'      => $d['contact_map'] ?? '',
            'contact_address'  => $d['contact_address'] ?? '',
            'is_temp_contact'  => isset($d['is_temp_contact']) ? (int)$d['is_temp_contact'] : 0,
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function get_recipient(WP_REST_Request $r) {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('customer_recipients')." WHERE id=%d", $r['id']), ARRAY_A);
        return $row ? self::ok($row) : self::err('Not found', 404);
    }
    public static function update_recipient(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->update(self::tbl('customer_recipients'), [
            'name'           => $d['name'] ?? '',
            'phone'          => $d['phone'] ?? '',
            'address'        => $d['address'] ?? '',
            'map_url'        => $d['map_url'] ?? '',
            'lat'            => $d['lat'] ?? '',
            'lng'            => $d['lng'] ?? '',
            'delivery_notes'   => $d['delivery_notes'] ?? '',
            'contact_person_id'    => !empty($d['contact_person_id']) ? (int)$d['contact_person_id'] : null,
            'contact_person_name'  => $d['contact_person_name'] ?? '',
            'contact_person_phone' => $d['contact_person_phone'] ?? '',
            'contact_name'     => $d['contact_name'] ?? '',
            'contact_phone'    => $d['contact_phone'] ?? '',
            'contact_email'    => $d['contact_email'] ?? '',
            'contact_map'      => $d['contact_map'] ?? '',
            'contact_address'  => $d['contact_address'] ?? '',
            'is_temp_contact'  => isset($d['is_temp_contact']) ? (int)$d['is_temp_contact'] : 0,
        ], ['id' => $r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_recipient(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('customer_recipients'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ── Production Step Library ──────────────────────────────────────────────
    public static function list_step_library() {
        global $wpdb;
        $rows = $wpdb->get_results("SELECT * FROM ".self::tbl('production_step_library')." ORDER BY sort_order,id", ARRAY_A);
        foreach ($rows as &$row) {
            $row['default_employee_ids'] = self::unwrap_emp_ids($row['default_employee_ids'] ?? '[]');
        }
        return self::ok($rows);
    }
    public static function create_step_library(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        // check which columns exist to avoid insert errors
        $cols = $wpdb->get_col("SHOW COLUMNS FROM ".self::tbl('production_step_library'));
        $data = [
            'step_name'    => $d['step_name'] ?? '',
            'step_name_en' => $d['step_name_en'] ?? '',
            'show_in_prds' => (int)($d['show_in_prds'] ?? 1),
            'is_external'  => (int)($d['is_external'] ?? 0),
            'sort_order'   => (int)($d['sort_order'] ?? 0),
        ];
        if ((int)($d['is_external'] ?? 0) === 0 && (int)($d['is_delivery'] ?? 0) === 0) {
            $data['scales_with_qty'] = (int)($d['scales_with_qty'] ?? 1);
            $data['qty_per_unit']    = max(1, (int)($d['qty_per_unit'] ?? 1));
        }
        if (in_array('default_employee_ids', $cols)) $data['default_employee_ids'] = isset($d['default_employee_ids']) ? (is_array($d['default_employee_ids']) ? json_encode($d['default_employee_ids']) : $d['default_employee_ids']) : '[]';
        if (in_array('default_team_id', $cols))     $data['default_team_id']     = !empty($d['default_team_id']) ? (int)$d['default_team_id'] : null;
        if (in_array('is_delivery', $cols))         $data['is_delivery']         = (int)($d['is_delivery'] ?? 0);
        if (in_array('delivery_direction', $cols))  $data['delivery_direction']  = !empty($d['delivery_direction']) ? sanitize_text_field($d['delivery_direction']) : 'delivered_to_client';
        if (in_array('supplier_id', $cols))         $data['supplier_id']         = !empty($d['supplier_id']) ? (int)$d['supplier_id'] : null;
        $wpdb->insert(self::tbl('production_step_library'), $data);
        if ($wpdb->last_error) return self::err('DB error: '.$wpdb->last_error.' | cols: '.implode(',',$cols), 500);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_step_library(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $tbl  = self::tbl('production_step_library');
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");
        $data = [
            'step_name'    => $d['step_name']    ?? '',
            'step_name_en' => $d['step_name_en'] ?? '',
            'show_in_prds' => (int)($d['show_in_prds'] ?? 1),
            'is_external'  => (int)($d['is_external']  ?? 0),
            'sort_order'   => (int)($d['sort_order']   ?? 0),
        ];
        if ((int)($d['is_external'] ?? 0) === 0 && (int)($d['is_delivery'] ?? 0) === 0) {
            $data['scales_with_qty'] = (int)($d['scales_with_qty'] ?? 1);
            $data['qty_per_unit']    = max(1, (int)($d['qty_per_unit'] ?? 1));
        }
        if (in_array('default_employee_ids', $cols)) {
            // Always normalise to a JSON array string
            $emp_ids = $d['default_employee_ids'] ?? [];
            if (is_string($emp_ids)) {
                $decoded = json_decode($emp_ids, true);
                $emp_ids = is_array($decoded) ? $decoded : [];
            }
            $data['default_employee_ids'] = json_encode(array_values(array_filter(array_map('strval', $emp_ids))));
        }
        if (in_array('default_team_id', $cols))
            $data['default_team_id'] = !empty($d['default_team_id']) ? (int)$d['default_team_id'] : null;
        if (in_array('is_delivery', $cols))
            $data['is_delivery'] = (int)($d['is_delivery'] ?? 0);
        if (in_array('delivery_direction', $cols))
            $data['delivery_direction'] = !empty($d['delivery_direction']) ? sanitize_text_field($d['delivery_direction']) : 'delivered_to_client';
        if (in_array('supplier_id', $cols))
            $data['supplier_id'] = !empty($d['supplier_id']) ? (int)$d['supplier_id'] : null;
        $result = $wpdb->update($tbl, $data, ['id' => (int)$r['id']]);
        if ($wpdb->last_error) return self::err('DB error: ' . $wpdb->last_error, 500);
        return self::ok(['updated' => true]);
    }
    public static function delete_step_library(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('production_step_library'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ── Customer Contacts ─────────────────────────────────────────────────────
    public static function list_contacts(WP_REST_Request $r) {
        global $wpdb;
        return self::ok($wpdb->get_results($wpdb->prepare("SELECT * FROM ".self::tbl('customer_contacts')." WHERE customer_id=%d ORDER BY id", $r['id']), ARRAY_A));
    }
    public static function create_contact(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $wpdb->insert(self::tbl('customer_contacts'), [
            'customer_id'       => $r['id'],
            'name'              => $d['name'] ?? '',
            'name_en'           => $d['name_en'] ?? '',
            'job_title'         => $d['job_title'] ?? '',
            'job_title_en'      => $d['job_title_en'] ?? '',
            'phone'             => $d['phone'] ?? '',
            'phone_alt'         => $d['phone_alt'] ?? '',
            'email'             => $d['email'] ?? '',
            'map_url'           => $d['map_url'] ?? '',
            'is_temp_recipient' => (int)($d['is_temp_recipient'] ?? 0),
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function update_contact(WP_REST_Request $r) {
        global $wpdb; $d = $r->get_json_params();
        $wpdb->update(self::tbl('customer_contacts'), [
            'name'              => $d['name'] ?? '',
            'name_en'           => $d['name_en'] ?? '',
            'job_title'         => $d['job_title'] ?? '',
            'job_title_en'      => $d['job_title_en'] ?? '',
            'phone'             => $d['phone'] ?? '',
            'phone_alt'         => $d['phone_alt'] ?? '',
            'email'             => $d['email'] ?? '',
            'map_url'           => $d['map_url'] ?? '',
            'is_temp_recipient' => (int)($d['is_temp_recipient'] ?? 0),
        ], ['id' => $r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_contact(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('customer_contacts'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  PRODUCT STEPS (template)
    // ────────────────────────────────────────────────────────────────────────
    public static function list_product_steps(WP_REST_Request $r) {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order", $r['id']), ARRAY_A);
        foreach ($rows as &$row) {
            $row['assigned_employee_ids'] = self::unwrap_emp_ids($row['assigned_employee_ids'] ?? '[]');
            if (!empty($row['is_external']) && empty($row['supplier_id'])) {
                $supplier_id = self::step_library_supplier($row['step_name'] ?? '', $row['step_name_en'] ?? '');
                if ($supplier_id && self::has_column(self::tbl('product_steps'), 'supplier_id')) {
                    $row['supplier_id'] = $supplier_id;
                    $wpdb->update(self::tbl('product_steps'), ['supplier_id' => $supplier_id], ['id' => (int)$row['id']]);
                }
            }
        }
        return self::ok($rows);
    }
    private static function unwrap_emp_ids($raw) {
        $decoded = $raw;
        $i = 0;
        while (is_string($decoded) && $i < 10) {
            $try = json_decode($decoded, true);
            if ($try === null) break;
            $decoded = $try;
            $i++;
        }
        if (!is_array($decoded)) return [];
        $flat = [];
        foreach ($decoded as $v) {
            if (is_array($v)) { foreach ($v as $vv) { $flat[] = strval($vv); } }
            else { $flat[] = strval($v); }
        }
        return array_values(array_unique($flat));
    }

    private static function _get_product_steps_with_str_ids() {
        global $wpdb;
        $rows = $wpdb->get_results("SELECT * FROM " . self::tbl('product_steps') . " ORDER BY product_id, step_order", ARRAY_A);
        $suppliers_by_id = [];
        if ($wpdb->get_var("SHOW TABLES LIKE '" . self::tbl('suppliers') . "'")) {
            $supplier_rows = $wpdb->get_results("SELECT * FROM " . self::tbl('suppliers'), ARRAY_A);
            foreach (($supplier_rows ?: []) as $supplier_row) {
                $suppliers_by_id[(int)$supplier_row['id']] = $supplier_row;
            }
        }
        foreach ($rows as &$row) {
            $row['assigned_employee_ids'] = self::unwrap_emp_ids($row['assigned_employee_ids'] ?? '[]');
            if (!empty($row['is_external']) && empty($row['supplier_id'])) {
                $supplier_id = self::step_library_supplier($row['step_name'] ?? '', $row['step_name_en'] ?? '');
                if ($supplier_id && self::has_column(self::tbl('product_steps'), 'supplier_id')) {
                    $row['supplier_id'] = $supplier_id;
                    $wpdb->update(self::tbl('product_steps'), ['supplier_id' => $supplier_id], ['id' => (int)$row['id']]);
                }
            }
            $supplier_id = !empty($row['supplier_id']) ? (int)$row['supplier_id'] : 0;
            if ($supplier_id && !empty($suppliers_by_id[$supplier_id])) {
                $row['supplier_name'] = $suppliers_by_id[$supplier_id]['name'] ?? '';
                $row['supplier_name_en'] = $suppliers_by_id[$supplier_id]['name_en'] ?? '';
            }
        }
        return $rows;
    }

    private static function _get_step_library_with_emp_ids() {
        global $wpdb;
        $rows = $wpdb->get_results("SELECT * FROM " . self::tbl('production_step_library') . " ORDER BY sort_order,id", ARRAY_A);
        foreach ($rows as &$row) {
            $row['default_employee_ids'] = self::unwrap_emp_ids($row['default_employee_ids'] ?? '[]');
        }
        return $rows;
    }

    private static function norm_emp_ids($val) {
        if (!isset($val)) return '[]';
        // Unwrap nested JSON strings
        $decoded = $val;
        $iterations = 0;
        while (is_string($decoded) && $iterations < 10) {
            $try = json_decode($decoded, true);
            if ($try === null) break;
            $decoded = $try;
            $iterations++;
        }
        if (is_array($decoded)) {
            // Flatten if it's an array containing a JSON string
            $flat = [];
            foreach ($decoded as $v) {
                if (is_array($v)) { $flat = array_merge($flat, $v); }
                else { $flat[] = $v; }
            }
            return json_encode(array_values(array_unique($flat)));
        }
        return '[]';
    }
    public static function create_product_step(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('product_steps'), [
            'product_id'           => (int)$r['id'],
            'step_name'            => $d['step_name'] ?? '',
            'step_name_en'         => $d['step_name_en'] ?? '',
            'step_order'           => (int)($d['step_order'] ?? 0),
            'assigned_employee_id' => !empty($d['assigned_employee_id']) ? (int)$d['assigned_employee_id'] : null,
            'assigned_employee_ids'=> self::norm_emp_ids($d['assigned_employee_ids'] ?? null),
            'assigned_team_id'     => !empty($d['assigned_team_id']) ? (int)$d['assigned_team_id'] : null,
            'assigned_role_id'     => !empty($d['assigned_role_id']) ? (int)$d['assigned_role_id'] : null,
            'expected_hours'       => (float)($d['expected_hours'] ?? 0),
            'show_in_prds'         => (int)($d['show_in_prds'] ?? 1),
            'is_external'          => (int)($d['is_external'] ?? 0),
            'is_delivery'          => (int)($d['is_delivery'] ?? 0),
            'scales_with_qty'      => (int)($d['scales_with_qty'] ?? 0),
            'qty_per_unit'         => max(1,(int)($d['qty_per_unit'] ?? 1)),
            'delivery_direction'   => !empty($d['delivery_direction']) ? sanitize_text_field($d['delivery_direction']) : 'delivered_to_client',
        ]);
        if ($wpdb->last_error) return self::err('DB error: '.$wpdb->last_error, 500);
        return self::created(['id' => $wpdb->insert_id]);
    }
    public static function get_product_step(WP_REST_Request $r) {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('product_steps')." WHERE id=%d", $r['id']), ARRAY_A);
        return $row ? self::ok($row) : self::err('Not found', 404);
    }
    public static function update_product_step(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $tbl = self::tbl('product_steps');
        $cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");
        $data = [
            'step_name'            => $d['step_name'] ?? '',
            'step_name_en'         => $d['step_name_en'] ?? '',
            'step_order'           => (int)($d['step_order'] ?? 0),
            'assigned_employee_id' => !empty($d['assigned_employee_id']) ? (int)$d['assigned_employee_id'] : null,
            'assigned_employee_ids'=> self::norm_emp_ids($d['assigned_employee_ids'] ?? null),
            'assigned_team_id'     => !empty($d['assigned_team_id']) ? (int)$d['assigned_team_id'] : null,
            'assigned_role_id'     => !empty($d['assigned_role_id']) ? (int)$d['assigned_role_id'] : null,
            'expected_hours'       => (float)($d['expected_hours'] ?? 0),
            'show_in_prds'         => (int)($d['show_in_prds'] ?? 1),
            'is_external'          => (int)($d['is_external'] ?? 0),
            'is_delivery'          => (int)($d['is_delivery'] ?? 0),
            'scales_with_qty'      => (int)($d['scales_with_qty'] ?? 0),
            'qty_per_unit'         => max(1,(int)($d['qty_per_unit'] ?? 1)),
            'delivery_direction'   => !empty($d['delivery_direction']) ? sanitize_text_field($d['delivery_direction']) : 'delivered_to_client',
        ];
        if (in_array('supplier_id', $cols))           $data['supplier_id']           = !empty($d['supplier_id']) ? (int)$d['supplier_id'] : null;
        if (in_array('ext_send_at', $cols))            $data['ext_send_at']            = $d['ext_send_at']           ?: null;
        if (in_array('ext_receive_expected', $cols))   $data['ext_receive_expected']   = $d['ext_receive_expected']  ?: null;
        $wpdb->update($tbl, $data, ['id' => (int)$r['id']]);
        return self::ok(['updated' => true]);
    }
    public static function delete_product_step(WP_REST_Request $r) { global $wpdb; $wpdb->delete(self::tbl('product_steps'),['id'=>$r['id']]); return self::ok(['deleted'=>true]); }

    // ────────────────────────────────────────────────────────────────────────
    //  ORDERS
    // ────────────────────────────────────────────────────────────────────────
    public static function list_order_recipients(WP_REST_Request $r) {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT or2.*, cr.name AS rec_name, cr.phone AS rec_phone, cr.address AS rec_address
             FROM ".self::tbl('order_recipients')." or2
             LEFT JOIN ".self::tbl('customer_recipients')." cr ON cr.id = or2.recipient_id
             WHERE or2.order_id=%d ORDER BY or2.id", (int)$r['id']
        ), ARRAY_A);
        return self::ok($rows ?: []);
    }

    public static function add_order_recipient(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $wpdb->insert(self::tbl('order_recipients'), [
            'order_id'     => (int)$r['id'],
            'recipient_id' => (int)($d['recipient_id'] ?? 0),
            'name'         => $d['name'] ?? '',
            'phone'        => $d['phone'] ?? '',
            'address'      => $d['address'] ?? '',
            'notes'        => $d['notes'] ?? '',
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }

    public static function remove_order_recipient(WP_REST_Request $r) {
        global $wpdb;
        $wpdb->delete(self::tbl('order_recipients'), ['id' => (int)$r['rid'], 'order_id' => (int)$r['id']]);
        return self::ok(['deleted' => true]);
    }

    public static function report_delay_reason(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $reason = sanitize_text_field($d['reason'] ?? '');
        if (!$reason) return self::err('Reason required', 400);
        $wpdb->update(self::tbl('orders'), [
            'delay_reason'       => $reason,
            'delay_reported_at'  => self::now(),
        ], ['id' => (int)$r['id']]);
        self::log_order_event((int)$r['id'], 'delay_reason_reported', ['reason' => $reason]);
        return self::ok(['saved' => true]);
    }

    private static function report_period_bounds($from_raw, $to_raw) {
        $from = trim((string)$from_raw);
        $to = trim((string)$to_raw);
        if ($from === '') $from = date('Y-m-01');
        if ($to === '') $to = date('Y-m-d');
        $from_ts = strtotime($from . ' 00:00:00');
        $to_ts = strtotime($to . ' 23:59:59');
        if (!$from_ts) $from_ts = strtotime(date('Y-m-01 00:00:00'));
        if (!$to_ts) $to_ts = strtotime(date('Y-m-d 23:59:59'));
        if ($to_ts < $from_ts) {
            $tmp = $from_ts;
            $from_ts = $to_ts;
            $to_ts = $tmp;
        }
        return [date('Y-m-d H:i:s', $from_ts), date('Y-m-d H:i:s', $to_ts)];
    }

    private static function init_employee_perf_bucket($employee) {
        return [
            'employee_id' => (int)($employee['id'] ?? 0),
            'employee_name' => $employee['name'] ?? '',
            'employee_name_en' => $employee['name_en'] ?? '',
            'tasks_total' => 0,
            'tasks_on_time' => 0,
            'tasks_late' => 0,
            'production_tasks' => 0,
            'ops_tasks' => 0,
            'points_total' => 0,
            'points_events' => 0,
        ];
    }

    public static function employee_performance_report(WP_REST_Request $r) {
        global $wpdb;
        list($from_dt, $to_dt) = self::report_period_bounds($r->get_param('from'), $r->get_param('to'));

        $employees_tbl = self::tbl('employees');
        $perf = [];
        if ($wpdb->get_var("SHOW TABLES LIKE '$employees_tbl'")) {
            $employee_rows = $wpdb->get_results("SELECT id, name, name_en FROM $employees_tbl ORDER BY id ASC", ARRAY_A) ?: [];
            foreach ($employee_rows as $er) $perf[(int)$er['id']] = self::init_employee_perf_bucket($er);
        }

        $points_tbl = self::tbl('employee_points');
        if ($wpdb->get_var("SHOW TABLES LIKE '$points_tbl'")) {
            $points_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT employee_id, SUM(points) AS points_total, COUNT(*) AS events_count
                 FROM $points_tbl
                 WHERE event_at BETWEEN %s AND %s
                 GROUP BY employee_id",
                $from_dt, $to_dt
            ), ARRAY_A) ?: [];
            foreach ($points_rows as $pr) {
                $eid = (int)($pr['employee_id'] ?? 0);
                if ($eid <= 0) continue;
                if (!isset($perf[$eid])) $perf[$eid] = self::init_employee_perf_bucket(['id' => $eid, 'name' => '#'.$eid, 'name_en' => '#'.$eid]);
                $perf[$eid]['points_total'] = (int)round((float)($pr['points_total'] ?? 0));
                $perf[$eid]['points_events'] = (int)($pr['events_count'] ?? 0);
            }
        }

        $item_steps_tbl = self::tbl('item_steps');
        if ($wpdb->get_var("SHOW TABLES LIKE '$item_steps_tbl'")) {
            $step_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT id, status_slug, expected_duration_minutes, expected_hours, actual_duration_minutes,
                        started_at, actual_started_at, completed_at, actual_completed_at,
                        assigned_employee_id, assigned_employee_ids, completed_by_ids
                 FROM $item_steps_tbl
                 WHERE status_slug IN ('done','completed')
                   AND COALESCE(actual_completed_at, completed_at) BETWEEN %s AND %s",
                $from_dt, $to_dt
            ), ARRAY_A) ?: [];
            foreach ($step_rows as $sr) {
                $employee_ids = self::unwrap_emp_ids($sr['completed_by_ids'] ?? []);
                if (empty($employee_ids)) $employee_ids = self::unwrap_emp_ids($sr['assigned_employee_ids'] ?? []);
                if (empty($employee_ids) && !empty($sr['assigned_employee_id'])) $employee_ids = [(string)$sr['assigned_employee_id']];
                $employee_ids = array_values(array_unique(array_filter(array_map('intval', (array)$employee_ids))));
                if (empty($employee_ids)) continue;

                $expected = (int)($sr['expected_duration_minutes'] ?? 0);
                if ($expected <= 0) {
                    $expected_hours = (float)($sr['expected_hours'] ?? 0);
                    if ($expected_hours > 0) $expected = (int)round($expected_hours * 60);
                }
                $actual = (int)($sr['actual_duration_minutes'] ?? 0);
                if ($actual <= 0) {
                    $start = $sr['actual_started_at'] ?: ($sr['started_at'] ?? null);
                    $done = $sr['actual_completed_at'] ?: ($sr['completed_at'] ?? null);
                    if (!empty($start) && !empty($done)) $actual = max(0, self::minutes_between($start, $done));
                }
                $is_late = ($expected > 0 && $actual > $expected);
                $is_on_time = ($expected > 0 && $actual <= $expected);
                foreach ($employee_ids as $eid) {
                    if (!isset($perf[$eid])) $perf[$eid] = self::init_employee_perf_bucket(['id' => $eid, 'name' => '#'.$eid, 'name_en' => '#'.$eid]);
                    $perf[$eid]['tasks_total']++;
                    $perf[$eid]['production_tasks']++;
                    if ($is_late) $perf[$eid]['tasks_late']++;
                    else if ($is_on_time) $perf[$eid]['tasks_on_time']++;
                }
            }
        }

        $ops_tasks_tbl = self::tbl('ops_tasks');
        if ($wpdb->get_var("SHOW TABLES LIKE '$ops_tasks_tbl'")) {
            $ops_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT id, assigned_employee_id, deadline, completed_at
                 FROM $ops_tasks_tbl
                 WHERE assigned_employee_id IS NOT NULL
                   AND assigned_employee_id > 0
                   AND completed_at IS NOT NULL
                   AND completed_at <> ''
                   AND completed_at <> '0000-00-00 00:00:00'
                   AND completed_at BETWEEN %s AND %s",
                $from_dt, $to_dt
            ), ARRAY_A) ?: [];
            foreach ($ops_rows as $orow) {
                $eid = (int)($orow['assigned_employee_id'] ?? 0);
                if ($eid <= 0) continue;
                if (!isset($perf[$eid])) $perf[$eid] = self::init_employee_perf_bucket(['id' => $eid, 'name' => '#'.$eid, 'name_en' => '#'.$eid]);
                $perf[$eid]['tasks_total']++;
                $perf[$eid]['ops_tasks']++;
                $deadline = trim((string)($orow['deadline'] ?? ''));
                $completed = trim((string)($orow['completed_at'] ?? ''));
                if ($deadline !== '' && $completed !== '' && $deadline !== '0000-00-00 00:00:00') {
                    if (strtotime($completed) > strtotime($deadline)) $perf[$eid]['tasks_late']++;
                    else $perf[$eid]['tasks_on_time']++;
                }
            }
        }

        $rows = array_values($perf);
        usort($rows, function($a, $b){
            if ((int)$b['points_total'] !== (int)$a['points_total']) return (int)$b['points_total'] <=> (int)$a['points_total'];
            if ((int)$b['tasks_total'] !== (int)$a['tasks_total']) return (int)$b['tasks_total'] <=> (int)$a['tasks_total'];
            return strcasecmp((string)($a['employee_name'] ?? ''), (string)($b['employee_name'] ?? ''));
        });
        return self::ok(['from' => substr($from_dt, 0, 10), 'to' => substr($to_dt, 0, 10), 'rows' => $rows]);
    }

    public static function requeue_orders(WP_REST_Request $r) {
        global $wpdb;
        $ids = $r->get_json_params()['ids'] ?? [];
        if (empty($ids) || !is_array($ids)) return self::err('No ids', 400);
        foreach ($ids as $i => $id) {
            $wpdb->update(self::tbl('orders'), ['queue_order' => $i + 1], ['id' => (int)$id]);
        }
        return self::ok(['requeued' => true]);
    }

    public static function list_orders(WP_REST_Request $r = null) {
        global $wpdb;
        $r = $r ?: new WP_REST_Request('GET');
        $q = trim((string) $r->get_param('q'));
        $is_done_raw = $r->get_param('is_done');
        $has_done_filter = ($is_done_raw !== null && $is_done_raw !== '');
        $is_done = $has_done_filter ? (int) $is_done_raw : null;
        $has_page = ($r->get_param('page') !== null || $r->get_param('per_page') !== null);

        if (!$has_page && !$has_done_filter && $q === '') {
            return self::ok(self::_fetch_orders_with_relations());
        }

        $pagination = self::pagination_params($r, 25, 200);
        $where_parts = ['1=1'];
        $params = [];
        if ($has_done_filter) {
            $where_parts[] = 'COALESCE(o.is_done,0) = %d';
            $params[] = $is_done ? 1 : 0;
        }
        if ($q !== '') {
            $like = '%' . $wpdb->esc_like($q) . '%';
            $where_parts[] = "(o.order_number LIKE %s OR c.name LIKE %s OR c.name_en LIKE %s OR c.company_name LIKE %s OR c.company_name_en LIKE %s)";
            array_push($params, $like, $like, $like, $like, $like);
        }
        $where_sql = implode(' AND ', $where_parts);
        $count_sql = "SELECT COUNT(*) FROM " . self::tbl('orders') . " o LEFT JOIN " . self::tbl('customers') . " c ON c.id=o.customer_id WHERE $where_sql";
        $total = (int) $wpdb->get_var($params ? $wpdb->prepare($count_sql, ...$params) : $count_sql);

        $order_by = $is_done ? "COALESCE(o.completed_at, o.updated_at, o.created_at) DESC, o.id DESC" : "o.queue_order ASC, o.id ASC";
        $orders = self::_fetch_orders_with_relations(
            $params ? $wpdb->prepare($where_sql, ...$params) : $where_sql,
            $pagination['per_page'],
            $pagination['offset'],
            $order_by
        );
        return self::ok(self::paged_payload($orders, $pagination['page'], $pagination['per_page'], $total));
    }

    public static function get_order(WP_REST_Request $r) {
        $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$r['id']);
        return $rows ? self::ok($rows[0]) : self::err('Not found', 404);
    }

    private static function find_order_id_by_number($order_number, $exclude_id = 0) {
        global $wpdb;
        $normalized = trim((string)$order_number);
        if ($normalized === '') return 0;
        $sql = "SELECT id FROM " . self::tbl('orders') . " WHERE TRIM(order_number) = %s";
        $params = [$normalized];
        if ($exclude_id > 0) {
            $sql .= " AND id <> %d";
            $params[] = (int)$exclude_id;
        }
        $sql .= " LIMIT 1";
        return (int)$wpdb->get_var($wpdb->prepare($sql, ...$params));
    }

    public static function get_order_lifecycle(WP_REST_Request $r) {
        global $wpdb;
        $order_id = (int)$r['id'];
        self::sync_order_lifecycle($order_id);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $order_id);
        if (!$rows) return self::err('Not found', 404);
        $order = $rows[0];
        $step_events = $wpdb->get_results($wpdb->prepare(
            "SELECT se.*
             FROM " . self::tbl('step_events') . " se
             WHERE se.order_id=%d
             ORDER BY se.event_time DESC, se.id DESC
             LIMIT 200",
            $order_id
        ), ARRAY_A) ?: [];
        return self::ok([
            'order' => $order,
            'events' => $order['events'] ?? [],
            'step_events' => $step_events,
            'delivery_attempts' => $order['delivery_attempts'] ?? [],
            'kpis' => $order['kpis'] ?? [],
        ]);
    }

    public static function create_order(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();

        // Generate order number — use what the user typed, fallback to CS- + timestamp
        if (!empty($d['order_number']) && trim($d['order_number']) !== '' && trim($d['order_number']) !== 'CS-0') {
            $order_number = sanitize_text_field($d['order_number']);
        } else {
            $order_number = 'CS-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -4));
        }
        if (self::find_order_id_by_number($order_number) > 0) {
            return self::err('رقم الطلب مستخدم مسبقاً', 409);
        }

        // Set queue_order to end of queue
        $max_queue = (int)$wpdb->get_var("SELECT MAX(queue_order) FROM ".self::tbl('orders')." WHERE is_done=0");

        $wpdb->insert(self::tbl('orders'), [
            'order_number'         => $order_number,
            'customer_id'          => $d['customer_id'] ?? null,
            'recipient_id'         => $d['recipient_id'] ?? null,
            'delivery_address'     => $d['delivery_address'] ?? '',
            'delivery_map_url'     => $d['delivery_map_url'] ?? '',
            'delivery_notes'       => $d['delivery_notes'] ?? '',
            'priority'             => $d['priority'] ?? 'normal',
            'is_urgent'            => $d['is_urgent'] ?? 0,
            'deadline'             => $d['deadline'] ?? null,
            'entered_at'           => self::now(),
            'customer_deadline_at' => !empty($d['customer_deadline_at']) ? $d['customer_deadline_at'] : ($d['deadline'] ?? null),
            'requested_delivery_at'=> !empty($d['requested_delivery_at']) ? $d['requested_delivery_at'] : (!empty($d['deadline']) ? $d['deadline'] : null),
            'status_slug'          => 'pending',
            'queue_order'          => $max_queue + 1,
            'started_at'           => null,
            'delivery_employee_id' => !empty($d['delivery_employee_id']) ? intval($d['delivery_employee_id']) : null,
            'delivery_buffer_minutes' => !empty($d['delivery_buffer_minutes']) ? intval($d['delivery_buffer_minutes']) : 60,
            'delivery_status'      => 'pending',
        ]);
        $order_id = $wpdb->insert_id;
        if ($wpdb->last_error) { error_log('[CSPSR] create_order insert error: '.$wpdb->last_error); }

        // Save delivery_date separately (column may need patch_columns to exist)
        if ($order_id && !empty($d['delivery_date'])) {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('orders')." SET delivery_date=%s WHERE id=%d",
                $d['delivery_date'], $order_id
            ));
        }

        // Create order items and copy product steps → item_steps
        $total_expected = 0;
        if (!empty($d['items']) && is_array($d['items'])) {
            foreach ($d['items'] as $item) {
                $product_id   = $item['product_id'] ?? null;
                $product_name = $item['product_name'] ?? '';
                $product_name_en = $item['product_name_en'] ?? '';

                if ($product_id && !$product_name) {
                    $p = $wpdb->get_row($wpdb->prepare("SELECT name, name_en FROM ".self::tbl('products')." WHERE id=%d", $product_id));
                    $product_name = $p->name ?? '';
                    if (!$product_name_en) $product_name_en = $p->name_en ?? '';
                }

                $wpdb->insert(self::tbl('order_items'), [
                    'order_id'        => $order_id,
                    'product_id'      => $product_id,
                    'product_name'    => $product_name,
                    'product_name_en' => $product_name_en,
                    'quantity'        => $item['quantity'] ?? 1,
                    'notes'           => $item['notes'] ?? '',
                ]);
                $item_id = $wpdb->insert_id;

                // Copy product template steps
                if ($product_id) {
                    $steps = $wpdb->get_results($wpdb->prepare(
                        "SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order",
                        $product_id
                    ), ARRAY_A);

                    $first_step_name = null;
                    foreach ($steps as $step) {
                        $step_minutes = self::item_step_minutes_from_payload($step, $item, $d['deadline'] ?? null);
                        if (empty($step['is_delivery'])) {
                            $total_expected += ($step_minutes / 60);
                        }
                        // All steps start as pending — first step needs manual "Start" to begin timer
                        $step_row = [
                            'order_item_id'        => $item_id,
                            'step_name'            => $step['step_name'],
                            'step_name_en'         => $step['step_name_en'] ?? '',
                            'step_order'           => $step['step_order'],
                            'assigned_employee_id' => $step['assigned_employee_id'],
                            'assigned_employee_ids'=> $step['assigned_employee_ids'],
                            'assigned_team_id'     => $step['assigned_team_id'],
                            'assigned_team_ids'    => $step['assigned_team_ids'],
                            'assigned_role_id'     => $step['assigned_role_id'],
                            'status_slug'          => 'pending',
                            'started_at'           => null,
                            'actual_started_at'    => null,
                            'expected_hours'       => round($step_minutes / 60, 4),
                            'expected_duration_minutes' => (int) $step_minutes,
                            'qty_per_unit'         => (int)($step['qty_per_unit'] ?? 1),
                            'show_in_prds'         => $step['show_in_prds'],
                            'is_external'          => $step['is_external'],
                            'is_delivery'          => $step['is_delivery'] ?? 0,
                            'scales_with_qty'      => $step['scales_with_qty'] ?? 0,
                            'qty_per_unit'         => (int)($step['qty_per_unit'] ?? 1),
                            'delivery_direction'   => !empty($step['delivery_direction']) ? sanitize_text_field($step['delivery_direction']) : 'delivered_to_client',
                        ];
                        if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                            $step_row['supplier_id'] = !empty($item['supplier_id'])
                                ? (int)$item['supplier_id']
                                : (!empty($step['supplier_id']) ? (int)$step['supplier_id'] : null);
                        }
                        $step_row = self::apply_item_timing_to_step_row($step_row, $step, $item, $d['deadline'] ?? null);
                        $wpdb->insert(self::tbl('item_steps'), $step_row);
                        if ($first_step_name === null) {
                            $first_step_name = $step['step_name'];
                            $wpdb->update(self::tbl('orders'), ['current_step_label' => $first_step_name], ['id' => $order_id]);
                        }
                    }
                }
            }
        }

        // Update expected hours total
        $wpdb->update(self::tbl('orders'), ['expected_hours_total' => $total_expected], ['id' => $order_id]);
        self::schedule_order($order_id);
        self::sync_order_lifecycle($order_id);
        self::log_order_event($order_id, 'order_created', [
            'order_number' => $order_number,
            'deadline' => $d['deadline'] ?? null,
            'requested_delivery_at' => $d['requested_delivery_at'] ?? null,
            'items_count' => is_array($d['items'] ?? null) ? count($d['items']) : 0,
        ]);
        self::maybe_notify_printing_new_order($order_id, $order_number);

        $rows = self::_fetch_orders_with_relations('o.id = ' . $order_id);
        return self::created($rows[0] ?? ['id' => $order_id]);
    }

    public static function update_order(WP_REST_Request $r) {
        global $wpdb;
        $d  = $r->get_json_params();
        $id = (int)$r['id'];
        $current_order = $wpdb->get_row($wpdb->prepare("SELECT order_number, started_at FROM ".self::tbl('orders')." WHERE id=%d", $id), ARRAY_A);
        if (!$current_order) return self::err('Not found', 404);
        $incoming_order_number = isset($d['order_number']) ? sanitize_text_field($d['order_number']) : ($current_order['order_number'] ?? '');
        if (trim((string)$incoming_order_number) === '') {
            return self::err('رقم الطلب مطلوب', 400);
        }
        if (self::find_order_id_by_number($incoming_order_number, $id) > 0) {
            return self::err('رقم الطلب مستخدم مسبقاً', 409);
        }
        $wpdb->update(self::tbl('orders'), [
            'order_number'         => $incoming_order_number,
            'customer_id'          => $d['customer_id'] ?? null,
            'contact_person_id'    => $d['contact_person_id'] ?? null,
            'contact_person_name'  => $d['contact_person_name'] ?? '',
            'contact_person_phone' => $d['contact_person_phone'] ?? '',
            'recipient_id'         => $d['recipient_id'] ?? null,
            'delivery_address'     => $d['delivery_address'] ?? '',
            'delivery_map_url'     => $d['delivery_map_url'] ?? '',
            'delivery_notes'       => $d['delivery_notes'] ?? '',
            'priority'             => $d['priority'] ?? 'normal',
            'is_urgent'            => $d['is_urgent'] ?? 0,
            'deadline'             => !empty($d['deadline']) ? $d['deadline'] : null,
            'customer_deadline_at' => !empty($d['customer_deadline_at']) ? $d['customer_deadline_at'] : (!empty($d['deadline']) ? $d['deadline'] : null),
            'requested_delivery_at'=> !empty($d['requested_delivery_at']) ? $d['requested_delivery_at'] : (!empty($d['deadline']) ? $d['deadline'] : null),
            'status_slug'          => $d['status_slug'] ?? 'pending',
            'delivery_employee_id' => !empty($d['delivery_employee_id']) ? intval($d['delivery_employee_id']) : null,
            'delivery_buffer_minutes' => !empty($d['delivery_buffer_minutes']) ? intval($d['delivery_buffer_minutes']) : 60,
        ], ['id' => $id]);

        // Save delivery_date separately (column added via patch_columns migration)
        if (!empty($d['delivery_date'])) {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('orders')." SET delivery_date=%s WHERE id=%d",
                $d['delivery_date'], $id
            ));
        } else {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('orders')." SET delivery_date=NULL WHERE id=%d", $id
            ));
        }

        // Update items
        $order = $current_order;
        if (isset($d['items']) && is_array($d['items'])) {
            $order_started = !empty($order['started_at']);

            if (!$order_started) {
                // Order not started: delete all and re-insert
                $old_item_ids = $wpdb->get_col($wpdb->prepare("SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id));
                foreach ($old_item_ids as $iid) {
                    $wpdb->delete(self::tbl('item_steps'), ['order_item_id' => (int)$iid]);
                }
                $wpdb->delete(self::tbl('order_items'), ['order_id' => $id]);

                $total_expected = 0;
                foreach ($d['items'] as $item) {
                    $product_id = $item['product_id'] ?? null;
                    $product_name = $item['product_name'] ?? '';
                    $product_name_en = $item['product_name_en'] ?? '';
                    if ($product_id && !$product_name) {
                        $p = $wpdb->get_row($wpdb->prepare("SELECT name, name_en FROM ".self::tbl('products')." WHERE id=%d", $product_id));
                        $product_name = $p->name ?? '';
                        if (!$product_name_en) $product_name_en = $p->name_en ?? '';
                    }
                    $wpdb->insert(self::tbl('order_items'), [
                        'order_id'        => $id,
                        'product_id'      => $product_id,
                        'product_name'    => $product_name,
                        'product_name_en' => $product_name_en,
                        'quantity'        => $item['quantity'] ?? 1,
                        'notes'           => $item['notes'] ?? '',
                    ]);
                    $item_id = $wpdb->insert_id;
                    if ($product_id) {
                        $steps = $wpdb->get_results($wpdb->prepare(
                            "SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order",
                            $product_id
                        ), ARRAY_A);
                        foreach ($steps as $step) {
                            $step_minutes = self::item_step_minutes_from_payload($step, $item, $d['deadline'] ?? null);
                            if (empty($step['is_delivery'])) {
                                $total_expected += ($step_minutes / 60);
                            }
                            $step_row = [
                                'order_item_id'        => $item_id,
                                'step_name'            => $step['step_name'],
                                'step_name_en'         => $step['step_name_en'] ?? '',
                                'step_order'           => $step['step_order'],
                                'assigned_employee_id' => $step['assigned_employee_id'],
                                'assigned_employee_ids'=> $step['assigned_employee_ids'] ?? '[]',
                                'assigned_team_id'     => $step['assigned_team_id'],
                                'assigned_role_id'     => $step['assigned_role_id'],
                                'expected_hours'       => round($step_minutes / 60, 4),
                                'expected_duration_minutes' => (int) $step_minutes,
                                'qty_per_unit'         => (int)($step['qty_per_unit'] ?? 1),
                                'status_slug'          => 'pending',
                                'show_in_prds'         => $step['show_in_prds'] ?? 1,
                                'is_external'          => $step['is_external'] ?? 0,
                                'is_delivery'          => $step['is_delivery'] ?? 0,
                                'scales_with_qty'      => $step['scales_with_qty'] ?? 0,
                            ];
                            if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                                $step_row['supplier_id'] = !empty($item['supplier_id'])
                                    ? (int)$item['supplier_id']
                                    : (!empty($step['supplier_id']) ? (int)$step['supplier_id'] : null);
                            }
                            $step_row = self::apply_item_timing_to_step_row($step_row, $step, $item, $d['deadline'] ?? null);
                            $wpdb->insert(self::tbl('item_steps'), $step_row);
                        }
                    }
                }
                $wpdb->update(self::tbl('orders'), ['expected_hours_total' => $total_expected], ['id' => $id]);

            } else {
                // Order started: only update notes/qty for existing items, and insert new items
                $existing_ids = $wpdb->get_col($wpdb->prepare("SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id));
                $total_expected = 0;

                foreach ($d['items'] as $item) {
                    $item_db_id = isset($item['id']) ? (int)$item['id'] : 0;

                    if ($item_db_id && in_array($item_db_id, $existing_ids)) {
                        // Existing item: update notes and quantity only
                        $wpdb->update(self::tbl('order_items'), [
                            'notes'    => $item['notes'] ?? '',
                            'quantity' => $item['quantity'] ?? 1,
                        ], ['id' => $item_db_id]);
                        $product_id = !empty($item['product_id']) ? (int)$item['product_id'] : (int)$wpdb->get_var($wpdb->prepare(
                            "SELECT product_id FROM ".self::tbl('order_items')." WHERE id=%d LIMIT 1",
                            $item_db_id
                        ));
                        $product_steps = [];
                        if ($product_id) {
                            $product_steps = $wpdb->get_results($wpdb->prepare(
                                "SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order",
                                $product_id
                            ), ARRAY_A);
                        }
                        $existing_steps = $wpdb->get_results($wpdb->prepare(
                            "SELECT * FROM ".self::tbl('item_steps')." WHERE order_item_id=%d ORDER BY step_order",
                            $item_db_id
                        ), ARRAY_A);
                        foreach ($existing_steps as $step_row) {
                            $source_step = null;
                            foreach ($product_steps as $ps) {
                                if ((int)($ps['step_order'] ?? 0) === (int)($step_row['step_order'] ?? 0)) { $source_step = $ps; break; }
                            }
                            if (!$source_step) {
                                foreach ($product_steps as $ps) {
                                    if (trim((string)($ps['step_name'] ?? '')) !== '' && trim((string)($ps['step_name'] ?? '')) === trim((string)($step_row['step_name'] ?? ''))) { $source_step = $ps; break; }
                                }
                            }
                            if (!$source_step) $source_step = $step_row;
                            $update = [];
                            $update['expected_duration_minutes'] = self::item_step_minutes_from_payload($source_step, $item, $d['deadline'] ?? null);
                            $update['expected_hours'] = round(((int)$update['expected_duration_minutes']) / 60, 4);
                            if (isset($source_step['scales_with_qty'])) {
                                $update['scales_with_qty'] = (int)$source_step['scales_with_qty'];
                            }
                            if (isset($source_step['qty_per_unit'])) {
                                $update['qty_per_unit'] = max(1, (int)$source_step['qty_per_unit']);
                            }
                            if (isset($source_step['delivery_direction'])) {
                                $update['delivery_direction'] = sanitize_text_field($source_step['delivery_direction'] ?: 'delivered_to_client');
                            } elseif (!empty($step_row['is_delivery'])) {
                                $update['delivery_direction'] = 'delivered_to_client';
                            }
                            if (!empty($source_step['is_external'])) {
                                $update['ext_send_at'] = !empty($item['external_send_at']) ? self::dt($item['external_send_at']) : null;
                                $update['ext_receive_expected'] = !empty($item['external_receive_expected']) ? self::dt($item['external_receive_expected']) : null;
                                if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                                    $update['supplier_id'] = !empty($item['supplier_id'])
                                        ? (int)$item['supplier_id']
                                        : (!empty($source_step['supplier_id']) ? (int)$source_step['supplier_id'] : null);
                                }
                            } elseif (!empty($source_step['is_delivery'])) {
                                $update['planned_start_at'] = !empty($item['delivery_scheduled_at']) ? self::dt($item['delivery_scheduled_at']) : null;
                                $update['planned_due_at'] = !empty($d['deadline']) ? self::dt($d['deadline']) : null;
                            }
                            if (!empty($update)) {
                                $wpdb->update(self::tbl('item_steps'), $update, ['id' => (int)$step_row['id']]);
                                if (isset($update['expected_duration_minutes']) && empty($step_row['is_delivery'])) {
                                    $total_expected += ((int)$update['expected_duration_minutes']) / 60;
                                }
                            }
                        }
                    } else {
                        // New item: insert with steps
                        $product_id = $item['product_id'] ?? null;
                        $product_name = $item['product_name'] ?? '';
                        $product_name_en = $item['product_name_en'] ?? '';
                        if ($product_id && !$product_name) {
                            $p = $wpdb->get_row($wpdb->prepare("SELECT name, name_en FROM ".self::tbl('products')." WHERE id=%d", $product_id));
                            $product_name = $p->name ?? '';
                            if (!$product_name_en) $product_name_en = $p->name_en ?? '';
                        }
                        $wpdb->insert(self::tbl('order_items'), [
                            'order_id'        => $id,
                            'product_id'      => $product_id,
                            'product_name'    => $product_name,
                            'product_name_en' => $product_name_en,
                            'quantity'        => $item['quantity'] ?? 1,
                            'notes'           => $item['notes'] ?? '',
                        ]);
                        $item_id = $wpdb->insert_id;
                        if ($product_id) {
                            $steps = $wpdb->get_results($wpdb->prepare(
                                "SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order",
                                $product_id
                            ), ARRAY_A);
                            foreach ($steps as $step) {
                                $step_minutes = self::item_step_minutes_from_payload($step, $item, $d['deadline'] ?? null);
                                if (empty($step['is_delivery'])) {
                                    $total_expected += ($step_minutes / 60);
                                }
                                $step_row = [
                                    'order_item_id'        => $item_id,
                                    'step_name'            => $step['step_name'],
                                    'step_name_en'         => $step['step_name_en'] ?? '',
                                    'step_order'           => $step['step_order'],
                                    'assigned_employee_id' => $step['assigned_employee_id'],
                                    'assigned_employee_ids'=> $step['assigned_employee_ids'] ?? '[]',
                                    'assigned_team_id'     => $step['assigned_team_id'],
                                    'assigned_role_id'     => $step['assigned_role_id'],
                                    'expected_hours'       => round($step_minutes / 60, 4),
                                    'expected_duration_minutes' => (int) $step_minutes,
                                    'qty_per_unit'         => (int)($step['qty_per_unit'] ?? 1),
                                    'status_slug'          => 'pending',
                                    'show_in_prds'         => $step['show_in_prds'] ?? 1,
                                    'is_external'          => $step['is_external'] ?? 0,
                                    'is_delivery'          => $step['is_delivery'] ?? 0,
                                    'scales_with_qty'      => $step['scales_with_qty'] ?? 0,
                                    'delivery_direction'   => !empty($step['delivery_direction']) ? sanitize_text_field($step['delivery_direction']) : 'delivered_to_client',
                                ];
                                if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                                    $step_row['supplier_id'] = !empty($item['supplier_id'])
                                        ? (int)$item['supplier_id']
                                        : (!empty($step['supplier_id']) ? (int)$step['supplier_id'] : null);
                                }
                                $step_row = self::apply_item_timing_to_step_row($step_row, $step, $item, $d['deadline'] ?? null);
                                $wpdb->insert(self::tbl('item_steps'), $step_row);
                            }
                        }
                    }
                }
                $wpdb->update(self::tbl('orders'), ['expected_hours_total' => $total_expected], ['id' => $id]);
            }
        }

        self::schedule_order($id);
        self::sync_order_lifecycle($id);
        self::log_order_event($id, 'order_updated', [
            'deadline' => $d['deadline'] ?? null,
            'requested_delivery_at' => $d['requested_delivery_at'] ?? null,
            'items_count' => is_array($d['items'] ?? null) ? count($d['items']) : null,
        ]);
        return self::ok(['updated' => true]);
    }

    public static function delete_order(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        // Block delete if order has any started or done step
        $item_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id
        ));
        if (!empty($item_ids)) {
            $placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
            $started = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM ".self::tbl('item_steps')
                ." WHERE order_item_id IN ($placeholders) AND status_slug IN ('in_progress','done')",
                ...$item_ids
            ));
            if ($started > 0) {
                return self::err('لا يمكن حذف طلب بدأ تنفيذه. استخدم إيقاف أو إنهاء إجباري.', 403);
            }
        }
        // Delete steps → items → order
        foreach ($item_ids as $iid) {
            $step_ids = $wpdb->get_col($wpdb->prepare("SELECT id FROM ".self::tbl('item_steps')." WHERE order_item_id=%d", (int)$iid));
            foreach ($step_ids as $sid) {
                $wpdb->delete(self::tbl('step_events'), ['step_id' => (int)$sid]);
            }
            $wpdb->delete(self::tbl('item_steps'), ['order_item_id' => (int)$iid]);
        }
        $wpdb->delete(self::tbl('delivery_attempts'), ['order_id' => $id]);
        $wpdb->delete(self::tbl('order_events'), ['order_id' => $id]);
        $wpdb->delete(self::tbl('order_items'), ['order_id' => $id]);
        $wpdb->delete(self::tbl('orders'), ['id' => $id]);
        return self::ok(['deleted' => true]);
    }

    public static function list_delivery_attempts(WP_REST_Request $r) {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM " . self::tbl('delivery_attempts') . " WHERE order_id=%d ORDER BY attempt_no ASC, id ASC",
            (int)$r['id']
        ), ARRAY_A);
        return self::ok($rows ?: []);
    }

    public static function create_delivery_attempt(WP_REST_Request $r) {
        global $wpdb;
        $order_id = (int)$r['id'];
        $d = $r->get_json_params();
        $attempt_no = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(MAX(attempt_no),0)+1 FROM " . self::tbl('delivery_attempts') . " WHERE order_id=%d",
            $order_id
        ));
        $planned_at = self::dt($d['planned_at'] ?? null)
            ?: self::dt($d['next_attempt_at'] ?? null)
            ?: self::dt($d['requested_delivery_at'] ?? null)
            ?: self::now();
        $wpdb->insert(self::tbl('delivery_attempts'), [
            'order_id' => $order_id,
            'attempt_no' => max(1, $attempt_no),
            'planned_at' => $planned_at,
            'status' => 'scheduled',
            'notes' => $d['notes'] ?? '',
            'customer_response' => $d['customer_response'] ?? '',
            'next_attempt_at' => self::dt($d['next_attempt_at'] ?? null),
            'created_by' => self::current_app_user_id(),
        ]);
        $attempt_id = (int)$wpdb->insert_id;
        $wpdb->update(self::tbl('orders'), [
            'delivery_status' => 'scheduled',
            'delivery_attempt_count' => max(1, $attempt_no),
            'delivery_planned_at' => $planned_at,
            'requested_delivery_at' => $planned_at,
            'delivery_hold_reason' => '',
        ], ['id' => $order_id]);
        self::log_order_event($order_id, 'delivery_attempt_scheduled', [
            'attempt_no' => $attempt_no,
            'planned_at' => $planned_at,
            'notes' => $d['notes'] ?? '',
        ], null, $attempt_id);
        self::schedule_order($order_id);
        self::sync_order_lifecycle($order_id);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $order_id);
        return self::created(['attempt_id' => $attempt_id, 'order' => $rows[0] ?? null]);
    }

    public static function dispatch_delivery_attempt(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $attempt = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::tbl('delivery_attempts') . " WHERE id=%d", $id), ARRAY_A);
        if (!$attempt) return self::err('Attempt not found', 404);
        $now = self::now();
        $wpdb->update(self::tbl('delivery_attempts'), [
            'dispatch_at' => $now,
            'status' => 'out_for_delivery',
            'notes' => ($r->get_json_params()['notes'] ?? $attempt['notes']),
        ], ['id' => $id]);
        $wpdb->update(self::tbl('orders'), [
            'delivery_status' => 'out_for_delivery',
            'delivery_planned_at' => $attempt['planned_at'] ?: $now,
        ], ['id' => (int)$attempt['order_id']]);
        self::log_order_event((int)$attempt['order_id'], 'delivery_dispatched', [
            'attempt_no' => (int)$attempt['attempt_no'],
            'dispatch_at' => $now,
        ], null, $id);
        $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$attempt['order_id']);
        return self::ok(['dispatched' => true, 'order' => $rows[0] ?? null]);
    }

    public static function fail_delivery_attempt(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $d = $r->get_json_params();
        $attempt = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::tbl('delivery_attempts') . " WHERE id=%d", $id), ARRAY_A);
        if (!$attempt) return self::err('Attempt not found', 404);
        $reason = sanitize_text_field($d['reason'] ?? 'customer_unreachable');
        $next_at = self::dt($d['next_attempt_at'] ?? null);
        $wpdb->update(self::tbl('delivery_attempts'), [
            'status' => 'failed',
            'failure_reason' => $reason,
            'notes' => $d['notes'] ?? $attempt['notes'],
            'customer_response' => $d['customer_response'] ?? $attempt['customer_response'],
            'next_attempt_at' => $next_at,
        ], ['id' => $id]);
        $wpdb->update(self::tbl('orders'), [
            'delivery_status' => $next_at ? 'rescheduled' : 'failed_attempt',
            'delivery_hold_reason' => $reason,
            'requested_delivery_at' => $next_at ?: ($attempt['planned_at'] ?? null),
        ], ['id' => (int)$attempt['order_id']]);
        self::log_order_event((int)$attempt['order_id'], 'delivery_attempt_failed', [
            'attempt_no' => (int)$attempt['attempt_no'],
            'reason' => $reason,
            'next_attempt_at' => $next_at,
            'customer_response' => $d['customer_response'] ?? '',
        ], null, $id);
        if ($next_at) {
            self::schedule_order((int)$attempt['order_id']);
        }
        self::sync_order_lifecycle((int)$attempt['order_id']);
        $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$attempt['order_id']);
        return self::ok(['failed' => true, 'order' => $rows[0] ?? null]);
    }

    public static function complete_delivery_attempt(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $attempt = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::tbl('delivery_attempts') . " WHERE id=%d", $id), ARRAY_A);
        if (!$attempt) return self::err('Attempt not found', 404);
        $now = self::now();
        $wpdb->update(self::tbl('delivery_attempts'), [
            'arrived_at' => $attempt['arrived_at'] ?: $now,
            'completed_at' => $now,
            'status' => 'delivered',
        ], ['id' => $id]);
        $wpdb->update(self::tbl('orders'), [
            'delivery_status' => 'delivered',
            'delivered_at' => $now,
            'closed_at' => $now,
        ], ['id' => (int)$attempt['order_id']]);
        self::log_order_event((int)$attempt['order_id'], 'delivery_completed', [
            'attempt_no' => (int)$attempt['attempt_no'],
            'completed_at' => $now,
        ], null, $id);
        self::sync_order_lifecycle((int)$attempt['order_id']);
        $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$attempt['order_id']);
        return self::ok(['completed' => true, 'order' => $rows[0] ?? null]);
    }

    // ── Cancel order ─────────────────────────────────────────────────────────
    public static function cancel_order(WP_REST_Request $r) {
        global $wpdb;
        $id  = (int)$r['id'];
        $now = self::now();
        // Set all non-done steps to cancelled
        $item_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id
        ));
        foreach ($item_ids as $iid) {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('item_steps')
                ." SET status_slug='cancelled' WHERE order_item_id=%d AND status_slug NOT IN ('done')",
                (int)$iid
            ));
        }
        // Cancel the order itself
        $wpdb->update(self::tbl('orders'), [
            'status_slug'        => 'cancelled',
            'current_step_label' => 'ملغي',
        ], ['id' => $id]);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $id);
        return self::ok($rows[0] ?? ['id' => $id]);
    }

    // ── Pause order ───────────────────────────────────────────────────────────
    public static function pause_order(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $d  = $r->get_json_params();
        $reason = $d['reason'] ?? '';
        $wpdb->update(self::tbl('orders'), [
            'is_paused'    => 1,
            'pause_reason' => $reason,
            'status_slug'  => 'paused',
        ], ['id' => $id]);
        self::log_order_event($id, 'order_paused', ['reason' => $reason]);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $id);
        return self::ok($rows[0] ?? ['id' => $id]);
    }

    // ── Resume order ──────────────────────────────────────────────────────────
    public static function resume_order(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        // Restore status based on step states
        $item_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id
        ));
        $has_in_progress = false;
        $has_done = false;
        foreach ($item_ids as $iid) {
            $statuses = $wpdb->get_col($wpdb->prepare(
                "SELECT status_slug FROM ".self::tbl('item_steps')." WHERE order_item_id=%d", (int)$iid
            ));
            foreach ($statuses as $s) {
                if ($s === 'in_progress') $has_in_progress = true;
                if ($s === 'done' || $s === 'completed') $has_done = true;
            }
        }
        $new_status = $has_in_progress ? 'in_progress' : ($has_done ? 'in_progress' : 'pending');
        $wpdb->update(self::tbl('orders'), [
            'is_paused'    => 0,
            'pause_reason' => null,
            'status_slug'  => $new_status,
        ], ['id' => $id]);
        self::log_order_event($id, 'order_resumed', ['status' => $new_status]);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $id);
        return self::ok($rows[0] ?? ['id' => $id]);
    }

    // ── Force-complete order ──────────────────────────────────────────────────
    public static function force_complete_order(WP_REST_Request $r) {
        global $wpdb;
        $id  = (int)$r['id'];
        $now = self::now();
        // Mark all pending/in_progress steps as done
        $item_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM ".self::tbl('order_items')." WHERE order_id=%d", $id
        ));
        foreach ($item_ids as $iid) {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('item_steps')
                ." SET status_slug='done', completed_at='".$now."' WHERE order_item_id=%d AND status_slug IN ('pending','in_progress')",
                (int)$iid
            ));
        }
        // Find the done status slug
        $done_status = $wpdb->get_var(
            "SELECT slug FROM ".self::tbl('statuses')." WHERE is_done=1 ORDER BY sort_order ASC LIMIT 1"
        ) ?: 'done';
        $wpdb->update(self::tbl('orders'), [
            'is_done'            => 1,
            'status_slug'        => $done_status,
            'completed_at'       => $now,
            'current_step_label' => 'مكتمل (إجباري)',
        ], ['id' => $id]);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $id);
        return self::ok($rows[0] ?? ['id' => $id]);
    }

    // ── Advance step ──────────────────────────────────────────────────────────
    // Only accepts a step that is currently 'in_progress'.
    // Starts a pending step — sets status to in_progress and records started_at.
    public static function restore_order(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $d = $r->get_json_params();
        $reason = sanitize_text_field($d['reason'] ?? '');
        $restart_step_id = (int)($d['restart_step_id'] ?? 0);
        $items_payload = is_array($d['items'] ?? null) ? $d['items'] : [];
        $now = self::now();

        if (!$id) return self::err('Order not found', 404);
        if ($reason === '') return self::err('Restore reason is required', 400);
        if (!$restart_step_id) return self::err('Restart step is required', 400);

        $order = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('orders')." WHERE id=%d", $id), ARRAY_A);
        if (!$order) return self::err('Order not found', 404);
        $status_slug = strtolower(trim((string)($order['status_slug'] ?? '')));
        $restorable_statuses = ['done', 'completed', 'cancelled', 'canceled'];
        if (empty($order['is_done']) && !in_array($status_slug, $restorable_statuses, true) && empty($order['completed_at'])) {
            return self::err('Order is not completed', 400);
        }

        $anchor_step = $wpdb->get_row($wpdb->prepare(
            "SELECT s.*
             FROM ".self::tbl('item_steps')." s
             INNER JOIN ".self::tbl('order_items')." i ON i.id = s.order_item_id
             WHERE s.id = %d AND i.order_id = %d
             LIMIT 1",
            $restart_step_id,
            $id
        ), ARRAY_A);
        if (!$anchor_step) return self::err('Restart step not found', 404);

        $anchor_order = (int)($anchor_step['step_order'] ?? 1);
        $anchor_name = $anchor_step['step_name'] ?? '';
        $anchor_name_en = $anchor_step['step_name_en'] ?? '';

        $existing_items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM ".self::tbl('order_items')." WHERE order_id=%d ORDER BY id ASC",
            $id
        ), ARRAY_A);
        $existing_by_id = [];
        foreach ($existing_items as $ei) {
            $existing_by_id[(int)$ei['id']] = $ei;
        }

        $product_steps_cache = [];
        $load_product_steps = function($product_id) use (&$product_steps_cache, $wpdb) {
            $pid = (int)$product_id;
            if ($pid <= 0) return [];
            if (!isset($product_steps_cache[$pid])) {
                $product_steps_cache[$pid] = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM ".self::tbl('product_steps')." WHERE product_id=%d ORDER BY step_order ASC, id ASC",
                    $pid
                ), ARRAY_A) ?: [];
            }
            return $product_steps_cache[$pid];
        };

        $processed_item_ids = [];
        $total_expected = 0.0;

        foreach ($items_payload as $item) {
            $item_id = !empty($item['id']) ? (int)$item['id'] : 0;
            $quantity = max(1, (int)($item['quantity'] ?? 1));
            $notes = sanitize_textarea_field($item['notes'] ?? '');
            $product_id = !empty($item['product_id']) ? (int)$item['product_id'] : 0;

            if ($item_id && isset($existing_by_id[$item_id])) {
                $product_id = (int)($existing_by_id[$item_id]['product_id'] ?? 0);
                $wpdb->update(self::tbl('order_items'), [
                    'quantity' => $quantity,
                    'notes'    => $notes,
                ], ['id' => $item_id]);
            } elseif ($product_id) {
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT name, name_en FROM ".self::tbl('products')." WHERE id=%d",
                    $product_id
                ), ARRAY_A);
                $wpdb->insert(self::tbl('order_items'), [
                    'order_id'        => $id,
                    'product_id'      => $product_id,
                    'product_name'    => $item['product_name'] ?? ($product['name'] ?? ''),
                    'product_name_en' => $item['product_name_en'] ?? ($product['name_en'] ?? ''),
                    'quantity'        => $quantity,
                    'notes'           => $notes,
                ]);
                $item_id = (int)$wpdb->insert_id;
            } else {
                continue;
            }

            $processed_item_ids[$item_id] = true;
            $steps_template = $load_product_steps($product_id);
            if (empty($steps_template)) continue;

            $existing_steps = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM ".self::tbl('item_steps')." WHERE order_item_id=%d ORDER BY step_order ASC, id ASC",
                $item_id
            ), ARRAY_A);
            $existing_by_order = [];
            $existing_by_name = [];
            foreach ($existing_steps as $es) {
                $existing_by_order[(int)$es['step_order']][] = $es;
                $existing_by_name[trim((string)($es['step_name'] ?? ''))][] = $es;
            }

            foreach ($steps_template as $tpl) {
                $minutes = self::item_step_minutes_from_payload($tpl, [
                    'quantity' => $quantity,
                    'supplier_id' => $item['supplier_id'] ?? null,
                    'external_send_at' => $item['external_send_at'] ?? null,
                    'external_receive_expected' => $item['external_receive_expected'] ?? null,
                    'delivery_scheduled_at' => $item['delivery_scheduled_at'] ?? null,
                ], $order['deadline'] ?? null);
                $step_order = (int)($tpl['step_order'] ?? 0);
                $base_update = [
                    'expected_duration_minutes' => (int)$minutes,
                    'expected_hours'            => round($minutes / 60, 4),
                    'qty_per_unit'              => max(1, (int)($tpl['qty_per_unit'] ?? 1)),
                    'scales_with_qty'           => (int)($tpl['scales_with_qty'] ?? 0),
                    'delivery_direction'        => !empty($tpl['delivery_direction']) ? sanitize_text_field($tpl['delivery_direction']) : 'delivered_to_client',
                ];
                if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                    $base_update['supplier_id'] = !empty($item['supplier_id'])
                        ? (int)$item['supplier_id']
                        : (!empty($tpl['supplier_id']) ? (int)$tpl['supplier_id'] : null);
                }
                if (!empty($tpl['is_external'])) {
                    $base_update['ext_send_at'] = !empty($item['external_send_at']) ? self::dt($item['external_send_at']) : null;
                    $base_update['ext_receive_expected'] = !empty($item['external_receive_expected']) ? self::dt($item['external_receive_expected']) : null;
                } elseif (!empty($tpl['is_delivery'])) {
                    $base_update['planned_start_at'] = !empty($item['delivery_scheduled_at']) ? self::dt($item['delivery_scheduled_at']) : null;
                    $base_update['planned_due_at'] = !empty($order['deadline']) ? self::dt($order['deadline']) : null;
                }

                $match = null;
                if (!empty($existing_by_order[$step_order])) {
                    $match = array_shift($existing_by_order[$step_order]);
                } else {
                    $name = trim((string)($tpl['step_name'] ?? ''));
                    if ($name !== '' && !empty($existing_by_name[$name])) {
                        $match = array_shift($existing_by_name[$name]);
                    }
                }

                if ($match) {
                    $update = $base_update;
                    if ($step_order < $anchor_order) {
                        // keep history state, only expected values are refreshed
                    } elseif ($step_order === $anchor_order) {
                        $update = array_merge($update, [
                            'status_slug'         => 'in_progress',
                            'started_at'          => $now,
                            'actual_started_at'   => $now,
                            'completed_at'        => null,
                            'actual_completed_at' => null,
                            'paused_at'           => null,
                            'paused_seconds'      => 0,
                            'actual_duration_minutes' => 0,
                            'queue_wait_minutes'  => 0,
                            'completed_by_ids'    => null,
                            'last_event_at'       => $now,
                        ]);
                    } else {
                        $update = array_merge($update, [
                            'status_slug'         => 'pending',
                            'started_at'          => null,
                            'actual_started_at'   => null,
                            'completed_at'        => null,
                            'actual_completed_at' => null,
                            'paused_at'           => null,
                            'paused_seconds'      => 0,
                            'actual_duration_minutes' => 0,
                            'queue_wait_minutes'  => 0,
                            'completed_by_ids'    => null,
                            'last_event_at'       => $now,
                            'ext_receive_actual'  => null,
                        ]);
                    }
                    $wpdb->update(self::tbl('item_steps'), $update, ['id' => (int)$match['id']]);
                    self::log_step_event((int)$match['id'], 'step_restored', [
                        'reason' => $reason,
                        'restart_step_id' => $restart_step_id,
                        'restart_step_order' => $anchor_order,
                        'restart_step_name' => $anchor_name,
                        'restart_step_name_en' => $anchor_name_en,
                    ], $id);
                } else {
                    $insert = [
                        'order_item_id'           => $item_id,
                        'step_name'               => $tpl['step_name'],
                        'step_name_en'            => $tpl['step_name_en'] ?? '',
                        'step_order'              => $tpl['step_order'],
                        'assigned_employee_id'    => $tpl['assigned_employee_id'],
                        'assigned_employee_ids'   => $tpl['assigned_employee_ids'] ?? '[]',
                        'assigned_team_id'        => $tpl['assigned_team_id'],
                        'assigned_role_id'        => $tpl['assigned_role_id'],
                        'status_slug'             => ($step_order === $anchor_order ? 'in_progress' : 'pending'),
                        'started_at'              => ($step_order === $anchor_order ? $now : null),
                        'actual_started_at'       => ($step_order === $anchor_order ? $now : null),
                        'completed_at'            => null,
                        'actual_completed_at'     => null,
                        'paused_at'               => null,
                        'paused_seconds'          => 0,
                        'actual_duration_minutes' => 0,
                        'expected_hours'          => round($minutes / 60, 4),
                        'expected_duration_minutes'=> (int)$minutes,
                        'qty_per_unit'            => max(1, (int)($tpl['qty_per_unit'] ?? 1)),
                        'show_in_prds'            => $tpl['show_in_prds'] ?? 1,
                        'is_external'             => $tpl['is_external'] ?? 0,
                        'is_delivery'             => $tpl['is_delivery'] ?? 0,
                        'scales_with_qty'         => (int)($tpl['scales_with_qty'] ?? 0),
                        'delivery_direction'      => !empty($tpl['delivery_direction']) ? sanitize_text_field($tpl['delivery_direction']) : 'delivered_to_client',
                        'last_event_at'           => $now,
                    ];
                    if (self::has_column(self::tbl('item_steps'), 'supplier_id')) {
                        $insert['supplier_id'] = !empty($item['supplier_id'])
                            ? (int)$item['supplier_id']
                            : (!empty($tpl['supplier_id']) ? (int)$tpl['supplier_id'] : null);
                    }
                    if (!empty($tpl['is_external'])) {
                        $insert['ext_send_at'] = !empty($item['external_send_at']) ? self::dt($item['external_send_at']) : null;
                        $insert['ext_receive_expected'] = !empty($item['external_receive_expected']) ? self::dt($item['external_receive_expected']) : null;
                    } elseif (!empty($tpl['is_delivery'])) {
                        $insert['planned_start_at'] = !empty($item['delivery_scheduled_at']) ? self::dt($item['delivery_scheduled_at']) : null;
                        $insert['planned_due_at'] = !empty($order['deadline']) ? self::dt($order['deadline']) : null;
                    }
                    $wpdb->insert(self::tbl('item_steps'), $insert);
                    $new_step_id = (int)$wpdb->insert_id;
                    self::log_step_event($new_step_id, 'step_restored', [
                        'reason' => $reason,
                        'restart_step_id' => $restart_step_id,
                        'restart_step_order' => $anchor_order,
                        'restart_step_name' => $anchor_name,
                        'restart_step_name_en' => $anchor_name_en,
                    ], $id);
                }

                if (empty($tpl['is_delivery'])) {
                    $total_expected += $minutes / 60;
                }
            }
        }

        if (!empty($existing_items)) {
            foreach ($existing_items as $ei) {
                if (isset($processed_item_ids[(int)$ei['id']])) continue;
                $steps_sum = $wpdb->get_var($wpdb->prepare(
                    "SELECT COALESCE(SUM(CASE WHEN is_delivery!=1 THEN expected_duration_minutes ELSE 0 END),0) FROM ".self::tbl('item_steps')." WHERE order_item_id=%d",
                    (int)$ei['id']
                ));
                $total_expected += ((float)$steps_sum) / 60;
            }
        }

        $next_queue = (int)$wpdb->get_var(
            "SELECT COALESCE(MAX(queue_order),0) FROM ".self::tbl('orders')." WHERE is_done=0 AND id <> ".$id
        ) + 1;
        $wpdb->update(self::tbl('orders'), [
            'is_done'               => 0,
            'status_slug'           => 'in_progress',
            'completed_at'          => null,
            'closed_at'             => null,
            'delivered_at'          => null,
            'delivery_ready_at'     => null,
            'ready_at'              => null,
            'delivery_status'       => 'pending',
            'is_paused'             => 0,
            'pause_reason'          => null,
            'current_step_label'    => $anchor_name,
            'expected_hours_total'  => round($total_expected, 4),
            'last_event_at'         => $now,
            'queue_order'           => $next_queue,
            'internal_ready_at'     => null,
            'delivery_attempt_count'=> 0,
            'delivery_hold_reason'  => null,
        ], ['id' => $id]);

        if (self::has_column(self::tbl('order_items'), 'is_ready_for_delivery')) {
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('order_items')." SET is_ready_for_delivery=0, ready_for_delivery_at=NULL, is_delivered=0, delivered_at=NULL, delivery_batch_id=NULL WHERE order_id=%d",
                $id
            ));
        }

        self::log_order_event($id, 'order_restored', [
            'reason' => $reason,
            'restart_step_id' => $restart_step_id,
            'restart_step_order' => $anchor_order,
            'restart_step_name' => $anchor_name,
            'restart_step_name_en' => $anchor_name_en,
            'items_count' => count($items_payload),
        ]);

        self::schedule_order($id);
        self::sync_order_lifecycle($id);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $id);
        return self::ok($rows[0] ?? ['id' => $id]);
    }

    public static function start_step(WP_REST_Request $r) {
        global $wpdb;
        $id  = (int)$r['id'];
        $now = self::now();

        $step = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id),
            ARRAY_A
        );
        if (!$step) return self::err('Step not found', 404);
        if ($step['status_slug'] !== 'pending') return self::err('Step is not pending', 400);

        // Mark this step as in_progress and record start time
        $update_data = [
            'status_slug' => 'in_progress',
            'started_at'  => $now,
            'actual_started_at' => $now,
            'queue_wait_minutes' => !empty($step['planned_start_at']) ? self::minutes_between($step['planned_start_at'], $now) : (int)($step['queue_wait_minutes'] ?? 0),
        ];
        $wpdb->update(self::tbl('item_steps'), $update_data, ['id' => $id]);
        if ($wpdb->last_error) {
            return self::err('DB error: '.$wpdb->last_error, 500);
        }
        $started_step = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id),
            ARRAY_A
        );
        if (!$started_step || $started_step['status_slug'] !== 'in_progress') {
            // Last-resort direct SQL so the persisted state cannot remain stale.
            $wpdb->query($wpdb->prepare(
                "UPDATE ".self::tbl('item_steps')."
                 SET status_slug='in_progress',
                     started_at=%s,
                     actual_started_at=%s,
                     queue_wait_minutes=%d
                 WHERE id=%d",
                $now,
                $now,
                !empty($step['planned_start_at']) ? self::minutes_between($step['planned_start_at'], $now) : (int)($step['queue_wait_minutes'] ?? 0),
                $id
            ));
            if ($wpdb->last_error) {
                return self::err('DB error: '.$wpdb->last_error, 500);
            }
            $started_step = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id),
                ARRAY_A
            );
            if (!$started_step || $started_step['status_slug'] !== 'in_progress') {
                return self::err('Failed to persist step start', 500);
            }
        }
        $step = $started_step;

        // Update order current_step_label
        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']),
            ARRAY_A
        );
        $needs_delay_reason = false;
        if ($item) {
            $order = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('orders')." WHERE id=%d", (int)$item['order_id']), ARRAY_A);
            $update = ['current_step_label' => $step['step_name'], 'status_slug' => 'in_progress'];
            if ($order && empty($order['started_at'])) { $update['started_at'] = $now; }
            if ($order && empty($step['is_delivery']) && self::has_column(self::tbl('orders'), 'production_started_at') && empty($order['production_started_at'])) {
                $update['production_started_at'] = $now;
            }
            $wpdb->update(self::tbl('orders'), $update, ['id' => (int)$item['order_id']]);
            // Check if deadline passed — only for delivery steps
            if ($order && !empty($step['is_delivery']) && !empty($order['deadline']) && empty($order['delay_reason'])) {
                $deadline_cutoff = strtotime(date('Y-m-d', strtotime($order['deadline'])) . ' 23:59:00');
                if (time() > $deadline_cutoff) { $needs_delay_reason = true; }
            }
        }

        $updated_order = null;
        if ($item) {
            self::log_step_event($id, 'step_started', [
                'step_name' => $step['step_name'],
                'planned_start_at' => $step['planned_start_at'] ?? null,
                'actual_started_at' => $now,
            ], (int)$item['order_id']);
            self::log_order_event((int)$item['order_id'], 'step_started', [
                'step_name' => $step['step_name'],
                'step_id' => $id,
                'is_delivery' => !empty($step['is_delivery']),
            ], $id);
            self::sync_order_lifecycle((int)$item['order_id']);
            $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$item['order_id']);
            $updated_order = $rows[0] ?? null;
        }

        return self::ok(['started' => true, 'step_id' => $id, 'started_at' => $now, 'needs_delay_reason' => $needs_delay_reason, 'order_id' => $item ? (int)$item['order_id'] : null, 'order' => $updated_order]);
    }

    // Marks it 'done', starts the next 'pending' step, or completes the order.
    public static function advance_step(WP_REST_Request $r) {
        global $wpdb;
        $id  = (int)$r['id'];
        $now = self::now();

        // 1. Load the step
        $step = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id),
            ARRAY_A
        );
        if (!$step) return self::err('Step not found', 404);

        // 2. Guard: only allow completing an in_progress step
        if ($step['status_slug'] !== 'in_progress') {
            if ($step['status_slug'] === 'pending') {
                $has_active = (int)$wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM ".self::tbl('item_steps')." WHERE order_item_id=%d AND status_slug='in_progress' AND id<>%d",
                    (int)$step['order_item_id'],
                    $id
                ));
                $blocking_prev = (int)$wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM ".self::tbl('item_steps')."
                     WHERE order_item_id=%d
                       AND step_order < %d
                       AND status_slug NOT IN ('done','completed')",
                    (int)$step['order_item_id'],
                    (int)($step['step_order'] ?? 0)
                ));
                if ($has_active === 0 && $blocking_prev === 0) {
                    $wpdb->update(self::tbl('item_steps'), [
                        'status_slug' => 'in_progress',
                        'started_at' => $step['started_at'] ?: $now,
                        'actual_started_at' => $step['actual_started_at'] ?: $now,
                        'queue_wait_minutes' => !empty($step['planned_start_at']) ? self::minutes_between($step['planned_start_at'], $now) : (int)($step['queue_wait_minutes'] ?? 0),
                    ], ['id' => $id]);
                    $item_for_auto = $wpdb->get_row(
                        $wpdb->prepare("SELECT * FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']),
                        ARRAY_A
                    );
                    if ($item_for_auto) {
                        $wpdb->update(self::tbl('orders'), [
                            'current_step_label' => $step['step_name'],
                            'status_slug' => 'in_progress',
                        ], ['id' => (int)$item_for_auto['order_id']]);
                    }
                    $step = $wpdb->get_row(
                        $wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id),
                        ARRAY_A
                    );
                }
            }
            if (!$step || $step['status_slug'] !== 'in_progress') {
                return self::err('Step is not in progress', 400);
            }
        }

        // 3. Mark this step done
        $json = $r->get_json_params();
        $completed_by = $json['completed_by_ids'] ?? null;
        $delivery_direction_req = sanitize_text_field($json['delivery_direction'] ?? '');
        $completed_by_json = '[]';
        if (!empty($completed_by)) {
            if (is_array($completed_by)) {
                $completed_by_json = json_encode(array_values(array_map('strval', $completed_by)));
            } elseif (is_string($completed_by)) {
                $decoded = json_decode($completed_by, true);
                $completed_by_json = is_array($decoded) ? json_encode(array_values(array_map('strval', $decoded))) : '[]';
            }
        }
        // Check if completed_by_ids column exists before including it
        $tbl_is = self::tbl('item_steps');
        $has_col = $wpdb->get_results("SHOW COLUMNS FROM $tbl_is LIKE 'completed_by_ids'");
        $update_data = [
            'status_slug'  => 'done',
            'completed_at' => $now,
            'actual_completed_at' => $now,
        ];
        $actual_start = $step['actual_started_at'] ?? ($step['started_at'] ?? null);
        if ($actual_start) {
            $dur = self::minutes_between($actual_start, $now) - (int) round(((int)($step['paused_seconds'] ?? 0)) / 60);
            $update_data['actual_duration_minutes'] = max(0, $dur);
        }
        if (!empty($step['is_delivery']) && $delivery_direction_req === 'received_by_client') {
            // Customer received directly: do not bind this completion to any employee.
            $completed_by_json = '[]';
        }
        if (!empty($has_col)) {
            $update_data['completed_by_ids'] = $completed_by_json;
        }
        if (!empty($step['is_delivery'])) {
            $has_dir_col = $wpdb->get_results("SHOW COLUMNS FROM $tbl_is LIKE 'delivery_direction'");
            if (!empty($has_dir_col)) {
                $dir = in_array($delivery_direction_req, ['delivered_to_client', 'received_by_client'], true)
                    ? $delivery_direction_req
                    : ($step['delivery_direction'] ?? 'delivered_to_client');
                $update_data['delivery_direction'] = $dir;
            }
        }
        // Auto-set ext_receive_actual for external steps if not already set
        $has_ext = $wpdb->get_results("SHOW COLUMNS FROM $tbl_is LIKE 'ext_receive_actual'");
        if (!empty($has_ext) && !empty($step['is_external']) && empty($step['ext_receive_actual'])) {
            $update_data['ext_receive_actual'] = $now;
        }
        $wpdb->update($tbl_is, $update_data, ['id' => $id]);

        // 3b-check: if this is the last step being completed AND order has deadline AND now > deadline date → flag delay
        $parent_item_check = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']), ARRAY_A);
        if ($parent_item_check) {
            $order_check = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('orders')." WHERE id=%d", (int)$parent_item_check['order_id']), ARRAY_A);
            if ($order_check && !empty($order_check['deadline'])) {
                $deadline_date = date('Y-m-d', strtotime($order_check['deadline']));
                $today_date    = date('Y-m-d');
                if ($today_date > $deadline_date && empty($order_check['delay_reason'])) {
                    // Return special flag so frontend can ask for reason
                    // We still complete the step — UI handles the dialog
                    $wpdb->update(self::tbl('orders'), ['delay_reported_at' => null], ['id' => (int)$parent_item_check['order_id']]);
                }
            }
        }

        // 3b. If this is a delivery step, deactivate the temp recipient linked to the order
        if (!empty($step['is_delivery'])) {
            if (true) {
                $parent_item = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']),
                    ARRAY_A
                );
                if ($parent_item) {
                    $order_rec = $wpdb->get_row(
                        $wpdb->prepare("SELECT recipient_id FROM ".self::tbl('orders')." WHERE id=%d", (int)$parent_item['order_id']),
                        ARRAY_A
                    );
                    if ($order_rec && !empty($order_rec['recipient_id'])) {
                        $wpdb->update(self::tbl('customer_recipients'), ['is_active' => 0], ['id' => (int)$order_rec['recipient_id']]);
                    }
                }
            }
        }

        // 4. Load the parent item and order
        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']),
            ARRAY_A
        );
        if (!$item) return self::ok(['updated' => true]);
        $order_id = (int)$item['order_id'];
        self::log_step_event($id, 'step_completed', [
            'step_name' => $step['step_name'],
            'actual_completed_at' => $now,
            'actual_duration_minutes' => $update_data['actual_duration_minutes'] ?? null,
            'completed_by_ids' => json_decode($completed_by_json, true),
        ], $order_id);
        self::log_order_event($order_id, !empty($step['is_delivery']) ? 'delivery_step_completed' : 'step_completed', [
            'step_name' => $step['step_name'],
            'step_id' => $id,
            'actual_duration_minutes' => $update_data['actual_duration_minutes'] ?? null,
        ], $id);
        $order_for_points = $wpdb->get_row(
            $wpdb->prepare("SELECT id, deadline FROM ".self::tbl('orders')." WHERE id=%d", $order_id),
            ARRAY_A
        );
        $effective_dir = !empty($update_data['delivery_direction'])
            ? (string)$update_data['delivery_direction']
            : (string)($step['delivery_direction'] ?? 'delivered_to_client');
        self::award_points_for_advanced_step(
            $step,
            $item,
            $order_for_points ?: ['id' => $order_id, 'deadline' => null],
            $completed_by_json,
            $effective_dir,
            $now,
            (int)($update_data['actual_duration_minutes'] ?? 0)
        );

        // 5. Find next pending step (by step_order) and make it the current step,
        // but do not auto-start it. Operators must start the next step manually.
        $next = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM ".self::tbl('item_steps')
                ." WHERE order_item_id=%d AND status_slug='pending' ORDER BY step_order ASC LIMIT 1",
                $item['id']
            ),
            ARRAY_A
        );

        if ($next) {
            $wpdb->update(self::tbl('orders'),
                ['current_step_label' => $next['step_name'], 'status_slug' => 'in_progress'],
                ['id' => $order_id]
            );
            // If the next step is a delivery step, this item is now ready for delivery.
            // KDS will classify the order as Partial Delivery automatically if other items
            // are still in production.
            $isDelivery = !empty($next['is_delivery']) ||
                stripos($next['step_name'] ?? '', 'deliver') !== false ||
                strpos($next['step_name'] ?? '', 'توصيل') !== false ||
                strpos($next['step_name'] ?? '', 'تسليم') !== false;
            if ($isDelivery) {
                $wpdb->update(self::tbl('order_items'),
                    [
                        'is_ready_for_delivery' => 1,
                        'ready_for_delivery_at' => $now,
                    ],
                    ['id' => (int)$item['id']]
                );
            }
            self::log_order_event($order_id, 'step_ready', [
                'step_name' => $next['step_name'],
                'step_id' => (int)$next['id'],
                'item_id' => (int)$item['id'],
                'item_ready_for_delivery' => $isDelivery ? 1 : 0,
            ], (int)$next['id']);
        } else {
            // 6. No next step — check if ALL steps in ALL items of this order are done
            $remaining = (int)$wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM ".self::tbl('item_steps')." s
                 INNER JOIN ".self::tbl('order_items')." i ON i.id = s.order_item_id
                 WHERE i.order_id = %d AND s.status_slug NOT IN ('done','completed')",
                $order_id
            ));
            $debug_info = ['remaining' => $remaining];

            if ($remaining === 0) {
                // All steps done — mark order complete
                $done_slug = $wpdb->get_var(
                    "SELECT slug FROM ".self::tbl('statuses')
                    ." WHERE is_done=1 AND slug NOT IN ('pending','in_progress') ORDER BY sort_order ASC LIMIT 1"
                );
                if (!$done_slug) $done_slug = 'done';

                // Calculate actual_hours_total from completed item_steps (non-delivery only)
                $is_tbl = self::tbl('item_steps');
                $oi_tbl = self::tbl('order_items');
                $done_steps = $wpdb->get_results($wpdb->prepare(
                    "SELECT s.started_at, s.completed_at, s.paused_seconds
                     FROM $is_tbl s
                     INNER JOIN $oi_tbl i ON i.id = s.order_item_id
                     WHERE i.order_id = %d
                       AND s.is_delivery != 1
                       AND s.status_slug IN ('done','completed')
                       AND s.started_at IS NOT NULL AND s.completed_at IS NOT NULL",
                    $order_id
                ), ARRAY_A);
                $actual_secs = 0;
                foreach ($done_steps as $ds) {
                    $secs = strtotime($ds['completed_at']) - strtotime($ds['started_at']);
                    $paused = (int)($ds['paused_seconds'] ?? 0);
                    $actual_secs += max(0, $secs - $paused);
                }
                $actual_hours = round($actual_secs / 3600, 2);

                $result = $wpdb->update(self::tbl('orders'), [
                    'status_slug'        => $done_slug,
                    'current_step_label' => null,
                    'completed_at'       => $now,
                    'is_done'            => 1,
                    'actual_hours_total' => $actual_hours,
                ], ['id' => $order_id]);
                self::log_order_event($order_id, 'order_completed', [
                    'completed_at' => $now,
                    'actual_hours_total' => $actual_hours,
                ], $id);
                self::sync_order_lifecycle($order_id);
                error_log('[CSPSR] order complete order='.$order_id.' done_slug='.$done_slug.' result='.(int)$result.' db_err='.$wpdb->last_error);
                // Check delay after order completion — only if this was a delivery step
                $order_final = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('orders')." WHERE id=%d", $order_id), ARRAY_A);
                $needs_delay = false;
                if ($order_final && !empty($step['is_delivery']) && !empty($order_final['deadline']) && empty($order_final['delay_reason'])) {
                    $deadline_cutoff = strtotime(date('Y-m-d', strtotime($order_final['deadline'])) . ' 23:59:00');
                    if (time() > $deadline_cutoff) { $needs_delay = true; }
                }
                return self::ok(['updated' => true, 'step_id' => $id, 'order_done' => true, 'needs_delay_reason' => $needs_delay, 'order_id' => $order_id, 'debug' => $debug_info]);
            }
        }

        // Check delay for mid-order — only if current step is delivery
        $order_mid = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('orders')." WHERE id=%d", $order_id), ARRAY_A);
        $needs_delay_mid = false;
        if ($order_mid && !empty($step['is_delivery']) && !empty($order_mid['deadline']) && empty($order_mid['delay_reason'])) {
            $deadline_cutoff = strtotime(date('Y-m-d', strtotime($order_mid['deadline'])) . ' 23:59:00');
            if (time() > $deadline_cutoff) { $needs_delay_mid = true; }
        }

        self::sync_order_lifecycle($order_id);
        $rows = self::_fetch_orders_with_relations('o.id = ' . $order_id);
        return self::ok(['updated' => true, 'step_id' => $id, 'needs_delay_reason' => $needs_delay_mid, 'order_id' => $order_id, 'order' => $rows[0] ?? null]);
    }

    // ── Pause step ────────────────────────────────────────────────────────────
    public static function pause_step(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $d  = $r->get_json_params();
        $reason  = $d['reason']  ?? '';
        $machine = $d['machine'] ?? '';
        $now = self::now();
        $step = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id), ARRAY_A);
        if (!$step) return self::err('Step not found', 404);
        $update = [
            'is_paused'    => 1,
            'pause_reason' => $reason,
            'paused_at'    => $now,
        ];
        // Save machine only if column exists
        $tbl_is = self::tbl('item_steps');
        $has_machine = $wpdb->get_results("SHOW COLUMNS FROM $tbl_is LIKE 'paused_machine'");
        if (!empty($has_machine)) {
            $update['paused_machine'] = $machine;
        }
        $wpdb->update($tbl_is, $update, ['id' => $id]);
        // Update order status_slug to paused
        $item = $wpdb->get_row($wpdb->prepare("SELECT order_id FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']), ARRAY_A);
        if ($item) {
            $wpdb->update(self::tbl('orders'), ['status_slug' => 'paused'], ['id' => (int)$item['order_id']]);
            self::log_step_event($id, 'step_paused', ['reason' => $reason, 'machine' => $machine], (int)$item['order_id']);
            self::log_order_event((int)$item['order_id'], 'step_paused', ['step_id' => $id, 'reason' => $reason], $id);
            $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$item['order_id']);
            return self::ok(['paused' => true, 'order' => $rows[0] ?? null]);
        }
        return self::ok(['paused' => true]);
    }

    // ── Resume step ───────────────────────────────────────────────────────────
    public static function resume_step(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $now = self::now();
        $step = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id), ARRAY_A);
        if (!$step) return self::err('Step not found', 404);
        // Calculate pause duration and accumulate
        $extra_secs = 0;
        if (!empty($step['paused_at'])) {
            $extra_secs = strtotime($now) - strtotime($step['paused_at']);
            if ($extra_secs < 0) $extra_secs = 0;
        }
        $total_paused = (int)($step['paused_seconds'] ?? 0) + $extra_secs;
        $wpdb->update(self::tbl('item_steps'), [
            'is_paused'      => 0,
            'pause_reason'   => null,
            'paused_at'      => null,
            'paused_seconds' => $total_paused,
        ], ['id' => $id]);
        $step = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('item_steps')." WHERE id=%d", $id), ARRAY_A);
        $item = $step ? $wpdb->get_row($wpdb->prepare("SELECT order_id FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']), ARRAY_A) : null;
        if ($item) {
            $wpdb->update(self::tbl('orders'), ['status_slug' => 'in_progress'], ['id' => (int)$item['order_id']]);
            self::log_step_event($id, 'step_resumed', ['paused_seconds' => $total_paused], (int)$item['order_id']);
            self::log_order_event((int)$item['order_id'], 'step_resumed', ['step_id' => $id, 'paused_seconds' => $total_paused], $id);
            $rows = self::_fetch_orders_with_relations('o.id = ' . (int)$item['order_id']);
            return self::ok(['resumed' => true, 'order' => $rows[0] ?? null]);
        }
        return self::ok(['resumed' => true]);
    }

    // ── Fix expected hours: sync item_steps.expected_hours from product_steps ──
    public static function update_step_ext_supplier(WP_REST_Request $r) {
        global $wpdb;
        $id = (int)$r['id'];
        $d  = $r->get_json_params();
        $tbl = self::tbl('item_steps');

        // Ensure all ext columns exist
        $existing_cols = $wpdb->get_col("SHOW COLUMNS FROM $tbl");
        $ext_cols = [
            'ext_send_at'           => 'datetime DEFAULT NULL',
            'ext_receive_expected'  => 'datetime DEFAULT NULL',
            'ext_receive_actual'    => 'datetime DEFAULT NULL',
            'supplier_id'           => 'bigint(20) UNSIGNED DEFAULT NULL',
        ];
        foreach ($ext_cols as $col => $def) {
            if (!in_array($col, $existing_cols)) {
                $wpdb->query("ALTER TABLE $tbl ADD COLUMN $col $def");
            }
        }

        $data = [];
        if (array_key_exists('supplier_id',           $d)) $data['supplier_id']           = !empty($d['supplier_id']) ? (int)$d['supplier_id'] : null;
        if (array_key_exists('ext_send_at',            $d)) $data['ext_send_at']            = $d['ext_send_at']            ?: null;
        if (array_key_exists('ext_receive_expected',   $d)) $data['ext_receive_expected']   = $d['ext_receive_expected']   ?: null;
        if (array_key_exists('ext_receive_actual',     $d)) $data['ext_receive_actual']     = $d['ext_receive_actual']     ?: null;

        if (empty($data)) return self::err('No data', 400);
        $current = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tbl WHERE id=%d", $id), ARRAY_A);
        if (!$current) return self::err('Not found', 404);

        $merged = array_merge($current, $data);
        $supplier_id = !empty($merged['supplier_id']) ? (int)$merged['supplier_id'] : 0;
        if (!empty($merged['ext_send_at']) && !empty($merged['ext_receive_expected'])) {
            $mins = self::business_minutes_between($merged['ext_send_at'], $merged['ext_receive_expected'], $supplier_id);
            $data['expected_duration_minutes'] = max(0, (int)$mins);
            $data['expected_hours'] = round(((int)$data['expected_duration_minutes']) / 60, 4);
        }
        $wpdb->update($tbl, $data, ['id' => $id]);
        if ($wpdb->last_error) return self::err('DB error: '.$wpdb->last_error, 500);

        // Return updated order for UI refresh
        $step = $wpdb->get_row($wpdb->prepare("SELECT order_item_id FROM $tbl WHERE id=%d", $id), ARRAY_A);
        if ($step) {
            $item = $wpdb->get_row($wpdb->prepare("SELECT order_id FROM ".self::tbl('order_items')." WHERE id=%d", $step['order_item_id']), ARRAY_A);
            if ($item) {
                $rows = self::_fetch_orders_with_relations('o.id='.(int)$item['order_id']);
                return self::ok(['updated'=>true, 'order'=>$rows[0]??null]);
            }
        }
        return self::ok(['updated' => true]);
    }

    public static function fix_expected_hours(WP_REST_Request $r) {
        global $wpdb;
        $is_tbl  = self::tbl('item_steps');
        $oi_tbl  = self::tbl('order_items');
        $ps_tbl  = self::tbl('product_steps');

        // Rebuild all non-delivery item_steps from their product step template.
        $steps = $wpdb->get_results(
            "SELECT s.*, i.product_id, i.quantity
             FROM $is_tbl s
             INNER JOIN $oi_tbl i ON i.id = s.order_item_id
             WHERE s.is_delivery != 1",
            ARRAY_A
        );

        $updated = 0;
        $total   = count($steps);

        foreach ($steps as $step) {
            // Match by step_name against product_steps
            $ps = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $ps_tbl WHERE product_id = %d AND step_name = %s LIMIT 1",
                (int)$step['product_id'],
                $step['step_name']
            ), ARRAY_A);

            if (!$ps || (float)$ps['expected_hours'] <= 0) continue;

            $qty = max(1, (int)$step['quantity']);
            $qpu = max(1, (int)($ps['qty_per_unit'] ?? 1));
            $hrs = (float)$ps['expected_hours'];
            $final_hrs = $hrs * ($qty / $qpu);

            $wpdb->update($is_tbl, ['expected_hours' => $final_hrs], ['id' => (int)$step['id']]);
            $updated++;
        }

        // Also recalc expected_hours_total on orders
        $orders = $wpdb->get_col("SELECT DISTINCT i.order_id FROM $oi_tbl i INNER JOIN $is_tbl s ON s.order_item_id = i.id");
        foreach ($orders as $oid) {
            $total_hrs = (float)$wpdb->get_var($wpdb->prepare(
                "SELECT SUM(s.expected_hours) FROM $is_tbl s INNER JOIN $oi_tbl i ON i.id = s.order_item_id WHERE i.order_id = %d AND s.is_delivery != 1",
                (int)$oid
            ));
            $wpdb->update(self::tbl('orders'), ['expected_hours_total' => $total_hrs], ['id' => (int)$oid]);
        }

        return self::ok(['updated_steps' => $updated, 'total_checked' => $total]);
    }

    // ── Delete all completed orders ───────────────────────────────────────────
    public static function delete_completed_orders(WP_REST_Request $r) {
        global $wpdb;
        $o_tbl  = self::tbl('orders');
        $oi_tbl = self::tbl('order_items');
        $is_tbl = self::tbl('item_steps');
        $or_tbl = self::tbl('order_recipients');
        $no_tbl = self::tbl('notifications');

        // Get all completed order IDs (is_done=1 OR status_slug in done statuses)
        $done_slugs = $wpdb->get_col("SELECT slug FROM ".self::tbl('statuses')." WHERE is_done=1");
        $slug_condition = '';
        if (!empty($done_slugs)) {
            $slug_placeholders = implode(',', array_fill(0, count($done_slugs), '%s'));
            $slug_condition = $wpdb->prepare(" OR status_slug IN ($slug_placeholders)", $done_slugs);
        }
        $order_ids = $wpdb->get_col("SELECT id FROM $o_tbl WHERE is_done = 1 OR is_done = '1' OR status_slug = 'cancelled'$slug_condition");
        if (empty($order_ids)) return self::ok(['deleted' => 0]);

        $ids_in = implode(',', array_map('intval', $order_ids));

        // Get item IDs for these orders
        $item_ids = $wpdb->get_col("SELECT id FROM $oi_tbl WHERE order_id IN ($ids_in)");

        // Delete item_steps (includes paused_at, paused_seconds etc.)
        if (!empty($item_ids)) {
            $iids_in = implode(',', array_map('intval', $item_ids));
            $wpdb->query("DELETE FROM $is_tbl WHERE order_item_id IN ($iids_in)");
        }

        // Delete notifications linked to these orders
        if ($wpdb->get_var("SHOW TABLES LIKE '$no_tbl'") === $no_tbl) {
            $wpdb->query("DELETE FROM $no_tbl WHERE order_id IN ($ids_in)");
        }

        // Delete order_items, order_recipients, orders
        $wpdb->query("DELETE FROM $oi_tbl WHERE order_id IN ($ids_in)");
        $wpdb->query("DELETE FROM $or_tbl WHERE order_id IN ($ids_in)");
        $wpdb->query("DELETE FROM $o_tbl WHERE id IN ($ids_in)");

        return self::ok(['deleted' => count($order_ids)]);
    }

    public static function fix_status_5(WP_REST_Request $r) {
        global $wpdb;
        $st_tbl = self::tbl('statuses');
        $o_tbl  = self::tbl('orders');
        $s_tbl  = self::tbl('order_item_steps');

        // Find the target status (sort_order=3, is_done=1) — the "good" one
        $good = $wpdb->get_row("SELECT id, slug FROM $st_tbl WHERE is_done=1 AND sort_order=3 LIMIT 1", ARRAY_A);
        if (!$good) $good = $wpdb->get_row("SELECT id, slug FROM $st_tbl WHERE is_done=1 ORDER BY sort_order ASC LIMIT 1", ARRAY_A);
        if (!$good) return self::err('Could not find target is_done=1 status');

        // Find all OTHER is_done statuses to remove (keep only the good one)
        $bad_rows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, slug FROM $st_tbl WHERE is_done=1 AND id != %d",
            $good['id']
        ), ARRAY_A);

        $deleted = []; $orders_updated = 0; $steps_updated = 0;

        foreach ($bad_rows as $bad) {
            // Migrate orders
            $orders_updated += (int)$wpdb->query($wpdb->prepare(
                "UPDATE $o_tbl SET status_slug=%s WHERE status_slug=%s",
                $good['slug'], $bad['slug']
            ));
            // Migrate steps
            $steps_updated += (int)$wpdb->query($wpdb->prepare(
                "UPDATE $s_tbl SET status_slug=%s WHERE status_slug=%s",
                $good['slug'], $bad['slug']
            ));
            // Delete the bad status
            $wpdb->delete($st_tbl, ['id' => $bad['id']]);
            $deleted[] = $bad['slug'];
        }

        return self::ok([
            'kept'           => $good['slug'],
            'deleted_slugs'  => $deleted,
            'orders_updated' => $orders_updated,
            'steps_updated'  => $steps_updated,
        ]);
    }
    public static function get_setup() {
        $pause_reasons = get_option('cspsr_pause_reasons', '[]');
        return self::ok([
            'system_name'          => get_option('cspsr_system_name', ''),
            'logo_url'             => get_option('cspsr_logo_url',    ''),
            'logo_base64'          => get_option('cspsr_logo_base64', ''),
            'is_setup_done'        => (bool) get_option('cspsr_setup_done', false),
            'pause_reasons'        => json_decode($pause_reasons, true) ?: [],
            'kds_carousel_interval'=> (int) get_option('cspsr_kds_carousel_interval', 8),
            'whatsapp_notify'      => get_option('cspsr_whatsapp_notify', ''),
            'debug_bar_enabled'    => (bool) get_option('cspsr_debug_bar_enabled', 1),
            'company_workday_start'=> get_option('cspsr_company_workday_start', '09:00'),
            'company_workday_end'  => get_option('cspsr_company_workday_end', '17:00'),
            'company_working_days' => self::normalize_working_days(get_option('cspsr_company_working_days', [0,1,2,3,4,5,6])),
            'company_holidays'     => self::normalize_holidays(get_option('cspsr_company_holidays', [])),
            'notify_printing_team_id'        => (int) get_option('cspsr_notify_printing_team_id', 0),
            'notify_logistics_department_id' => (int) get_option('cspsr_notify_logistics_department_id', 0),
            'notification_rules'            => self::normalize_notification_rules(get_option('cspsr_notification_rules', '[]')),
            'fcm' => [
                'enabled' => (bool) get_option('cspsr_fcm_enabled', false),
                'vapid_public' => (string) get_option('cspsr_fcm_vapid_public', ''),
                'config' => self::normalize_fcm_config(get_option('cspsr_fcm_config', '')),
                'service_account_set' => (
                    (string) get_option('cspsr_fcm_service_account_json', '') !== ''
                    || ((string) get_option('cspsr_fcm_service_account_path', '') !== '' && file_exists((string) get_option('cspsr_fcm_service_account_path', '')))
                ),
            ],
        ]);
    }

    public static function save_setup(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $calendar_changed = false;
        if (isset($d['system_name']))           update_option('cspsr_system_name',  sanitize_text_field($d['system_name']));
        if (isset($d['logo_url']))              update_option('cspsr_logo_url',     esc_url_raw($d['logo_url']));
        if (isset($d['logo_base64']))           update_option('cspsr_logo_base64',  $d['logo_base64']);
        if (!empty($d['mark_done']))            update_option('cspsr_setup_done',   1);
        if (isset($d['pause_reasons']))         update_option('cspsr_pause_reasons', json_encode($d['pause_reasons']));
        if (isset($d['kds_carousel_interval'])) update_option('cspsr_kds_carousel_interval', max(3, min(120, intval($d['kds_carousel_interval']))));
        if (isset($d['whatsapp_notify']))        update_option('cspsr_whatsapp_notify', sanitize_text_field($d['whatsapp_notify']));
        if (isset($d['debug_bar_enabled']))      update_option('cspsr_debug_bar_enabled', !empty($d['debug_bar_enabled']) ? 1 : 0);
        if (isset($d['company_workday_start']))  { update_option('cspsr_company_workday_start', preg_match('/^\d{2}:\d{2}$/', (string)$d['company_workday_start']) ? $d['company_workday_start'] : '09:00'); $calendar_changed = true; }
        if (isset($d['company_workday_end']))    { update_option('cspsr_company_workday_end', preg_match('/^\d{2}:\d{2}$/', (string)$d['company_workday_end']) ? $d['company_workday_end'] : '17:00'); $calendar_changed = true; }
        if (isset($d['company_working_days']))   { update_option('cspsr_company_working_days', self::normalize_working_days($d['company_working_days'])); $calendar_changed = true; }
        if (isset($d['company_holidays']))       { update_option('cspsr_company_holidays', self::normalize_holidays($d['company_holidays'])); $calendar_changed = true; }
        if (array_key_exists('notify_printing_team_id', $d)) update_option('cspsr_notify_printing_team_id', max(0, intval($d['notify_printing_team_id'])));
        if (array_key_exists('notify_logistics_department_id', $d)) update_option('cspsr_notify_logistics_department_id', max(0, intval($d['notify_logistics_department_id'])));
        if (array_key_exists('notification_rules', $d)) update_option('cspsr_notification_rules', wp_json_encode(self::normalize_notification_rules($d['notification_rules'])));

        if (array_key_exists('fcm_enabled', $d)) update_option('cspsr_fcm_enabled', !empty($d['fcm_enabled']) ? 1 : 0);
        if (array_key_exists('fcm_vapid_public', $d)) update_option('cspsr_fcm_vapid_public', sanitize_text_field((string)$d['fcm_vapid_public']));
        if (array_key_exists('fcm_config', $d)) {
            $cfg = self::normalize_fcm_config($d['fcm_config']);
            update_option('cspsr_fcm_config', wp_json_encode($cfg, JSON_UNESCAPED_SLASHES), false);
        }
        if (array_key_exists('fcm_service_account_json', $d)) {
            $sa = $d['fcm_service_account_json'];
            $sa_str = '';
            if (is_string($sa)) {
                $sa_str = trim($sa);
            } elseif (is_array($sa)) {
                $sa_str = wp_json_encode($sa, JSON_UNESCAPED_SLASHES);
            }
            if ($sa_str === '') {
                update_option('cspsr_fcm_service_account_json', '', false);
            } else {
                $decoded = json_decode($sa_str, true);
                if (is_array($decoded)) {
                    update_option('cspsr_fcm_service_account_json', wp_json_encode($decoded, JSON_UNESCAPED_SLASHES), false);
                }
            }
        }
        if (array_key_exists('fcm_service_account_path', $d)) {
            update_option('cspsr_fcm_service_account_path', sanitize_text_field((string)$d['fcm_service_account_path']), false);
        }
        if ($calendar_changed) self::reschedule_open_orders();
        return self::ok(['saved' => true]);
    }

    private static function normalize_fcm_config($value) {
        $cfg = $value;
        if (is_string($cfg)) {
            $trim = trim($cfg);
            if ($trim === '') return [];
            $decoded = json_decode($trim, true);
            if (is_array($decoded)) $cfg = $decoded;
        }
        if (!is_array($cfg)) return [];
        $allow = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId','measurementId'];
        $out = [];
        foreach ($allow as $k) {
            if (!array_key_exists($k, $cfg)) continue;
            $out[$k] = is_string($cfg[$k]) ? trim($cfg[$k]) : (string)$cfg[$k];
        }
        // Require minimal fields for messaging
        if (empty($out['projectId']) || empty($out['messagingSenderId']) || empty($out['appId'])) return [];
        return $out;
    }

    public static function push_register_token(WP_REST_Request $r) {
        global $wpdb;
        $user = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        if (!$user) return self::err('Unauthorized', 401);

        $d = $r->get_json_params();
        $token = sanitize_text_field((string)($d['token'] ?? ''));
        if ($token === '' || strlen($token) < 20) return self::err('Invalid token', 400);

        $platform = sanitize_text_field((string)($d['platform'] ?? 'web'));
        $device_label = sanitize_text_field((string)($d['device_label'] ?? ''));

        $tbl = self::tbl('push_devices');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) {
            // Ensure DB installed
            if (class_exists('CSPSR_DB')) CSPSR_DB::install();
        }

        $now = self::now();
        $wpdb->query($wpdb->prepare(
            "INSERT INTO $tbl (user_id, token, platform, device_label, is_disabled, last_seen_at, created_at, updated_at)
             VALUES (%d, %s, %s, %s, 0, %s, %s, %s)
             ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), platform=VALUES(platform), device_label=VALUES(device_label), is_disabled=0, last_seen_at=VALUES(last_seen_at), updated_at=VALUES(updated_at)",
            (int)$user['id'], $token, $platform ?: 'web', $device_label ?: null, $now, $now, $now
        ));

        return self::ok(['saved' => true]);
    }

    public static function push_test_self(WP_REST_Request $r) {
        $user = class_exists('CSPSR_Auth') ? CSPSR_Auth::get_user_from_token() : null;
        if (!$user) return self::err('Unauthorized', 401);

        $title = 'CSPSR';
        $body = 'Test notification';
        $d = $r->get_json_params();
        if (!empty($d['title'])) $title = sanitize_text_field((string)$d['title']);
        if (!empty($d['body'])) $body = sanitize_text_field((string)$d['body']);

        $result = self::fcm_send_to_user((int)$user['id'], [
            'title' => $title,
            'body'  => $body,
            'url'   => home_url('/'),
        ]);

        return self::ok($result);
    }

    private static function fcm_send_to_user($user_id, $notif) {
        global $wpdb;
        $user_id = (int)$user_id;
        if ($user_id <= 0) return ['sent' => 0, 'error' => 'Invalid user'];

        $enabled = (bool) get_option('cspsr_fcm_enabled', false);
        $vapid = (string) get_option('cspsr_fcm_vapid_public', '');
        $cfg = self::normalize_fcm_config(get_option('cspsr_fcm_config', ''));
        if (!$enabled) return ['sent' => 0, 'error' => 'FCM disabled'];
        if (empty($vapid)) return ['sent' => 0, 'error' => 'Missing VAPID'];
        if (empty($cfg)) return ['sent' => 0, 'error' => 'Missing Firebase config'];

        $sa_path = (string) get_option('cspsr_fcm_service_account_path', '');
        $sa_path = trim($sa_path);
        $sa_json = (string) get_option('cspsr_fcm_service_account_json', '');
        $sa_json = trim($sa_json);
        if (($sa_path === '' || !file_exists($sa_path)) && $sa_json === '') {
            return ['sent' => 0, 'error' => 'Missing service account'];
        }
        if (!is_readable($sa_path)) return ['sent' => 0, 'error' => 'Service account not readable'];

        $tbl = self::tbl('push_devices');
        if (!$wpdb->get_var("SHOW TABLES LIKE '$tbl'")) return ['sent' => 0, 'error' => 'push_devices table missing'];
        $tokens = $wpdb->get_col($wpdb->prepare("SELECT token FROM $tbl WHERE user_id=%d AND (is_disabled IS NULL OR is_disabled=0)", $user_id)) ?: [];
        $tokens = array_values(array_filter(array_map('strval', $tokens)));
        if (empty($tokens)) return ['sent' => 0, 'error' => 'No registered devices for this user'];

        $access_token = null;
        if ($sa_path !== '' && file_exists($sa_path)) {
            $access_token = self::fcm_get_access_token_from_file($sa_path);
        }
        if (!$access_token && $sa_json !== '') {
            $decoded = json_decode($sa_json, true);
            if (is_array($decoded)) {
                $access_token = self::fcm_get_access_token_from_json($decoded);
            }
        }
        if (!$access_token) return ['sent' => 0, 'error' => 'Failed to get OAuth access token'];

        $project_id = $cfg['projectId'] ?? '';
        if (!$project_id) return ['sent' => 0, 'error' => 'Missing projectId'];

        $title = (string)($notif['title'] ?? 'Notification');
        $body  = (string)($notif['body'] ?? '');
        $url   = (string)($notif['url'] ?? home_url('/'));

        $count = 0;
        $last_error = '';
        foreach ($tokens as $token) {
            $payload = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'webpush' => [
                        'fcm_options' => [
                            'link' => $url,
                        ],
                    ],
                    'data' => [
                        'url' => $url,
                    ],
                ],
            ];

            $res = wp_remote_post("https://fcm.googleapis.com/v1/projects/$project_id/messages:send", [
                'timeout' => 12,
                'headers' => [
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type'  => 'application/json; charset=utf-8',
                ],
                'body' => wp_json_encode($payload),
            ]);

            $code = (int) wp_remote_retrieve_response_code($res);
            if ($code >= 200 && $code < 300) {
                $count++;
            } else {
                $body = wp_remote_retrieve_body($res);
                $last_error = 'HTTP '.$code.($body ? (': '.substr((string)$body, 0, 200)) : '');
            }
        }
        return ['sent' => $count, 'devices' => count($tokens), 'error' => ($count > 0 ? '' : $last_error)];
    }

    private static function fcm_get_access_token_from_file($service_account_path) {
        $raw = @file_get_contents($service_account_path);
        if (!$raw) return null;
        $json = json_decode($raw, true);
        if (!is_array($json)) return null;
        return self::fcm_get_access_token_from_json($json);
    }

    private static function fcm_get_access_token_from_json($json) {
        if (!is_array($json)) return null;
        $client_email = $json['client_email'] ?? '';
        $private_key  = $json['private_key'] ?? '';
        $token_uri    = $json['token_uri'] ?? 'https://oauth2.googleapis.com/token';
        if (!$client_email || !$private_key) return null;

        $now = time();
        $header = self::b64url(json_encode(['alg'=>'RS256','typ'=>'JWT']));
        $claims = self::b64url(json_encode([
            'iss'   => $client_email,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => $token_uri,
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));
        $unsigned = $header . '.' . $claims;
        $signature = '';
        $ok = openssl_sign($unsigned, $signature, $private_key, 'sha256');
        if (!$ok) return null;
        $jwt = $unsigned . '.' . self::b64url($signature);

        $resp = wp_remote_post($token_uri, [
            'timeout' => 12,
            'headers' => ['Content-Type'=>'application/x-www-form-urlencoded'],
            'body'    => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
        ]);
        $code = (int) wp_remote_retrieve_response_code($resp);
        $body = wp_remote_retrieve_body($resp);
        if ($code < 200 || $code >= 300) return null;
        $tok = json_decode($body, true);
        if (!is_array($tok) || empty($tok['access_token'])) return null;
        return (string)$tok['access_token'];
    }

    private static function b64url($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function table_columns_cached($table) {
        static $cache = [];
        if (isset($cache[$table])) return $cache[$table];
        global $wpdb;
        $rows = $wpdb->get_results("SHOW COLUMNS FROM $table", ARRAY_A);
        $cols = [];
        foreach (($rows ?: []) as $row) {
            if (!empty($row['Field'])) $cols[$row['Field']] = true;
        }
        $cache[$table] = $cols;
        return $cols;
    }

    private static function normalize_export_include($value) {
        $default = ['setup', 'master'];
        if (!$value) return $default;
        $arr = is_array($value) ? $value : preg_split('/[\s,|]+/', (string)$value);
        $out = [];
        foreach (($arr ?: []) as $v) {
            $k = strtolower(trim((string)$v));
            if (!$k) continue;
            if (in_array($k, [
                'setup','master','customers','users','operational','ops','hr',
                // Granular export/import includes.
                'op_orders','op_items','op_steps','op_events','op_delivery','op_notifications',
                'ops_boards','ops_stages','ops_events'
            ], true)) $out[$k] = $k;
        }
        return !empty($out) ? array_values($out) : $default;
    }

    private static function ymd_or_null($value) {
        $s = trim((string)$value);
        if ($s === '') return null;
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) ? $s : null;
    }

    private static function prepare_sql($sql, $params) {
        global $wpdb;
        $params = is_array($params) ? $params : [$params];
        return call_user_func_array([$wpdb, 'prepare'], array_merge([$sql], $params));
    }

    public static function export_data(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $include = self::normalize_export_include($d['include'] ?? null);
        $filters = (!empty($d['filters']) && is_array($d['filters'])) ? $d['filters'] : [];

        $payload = [
            'plugin'      => 'colorsource-production-suite',
            'version'     => defined('CSPSR_VERSION') ? CSPSR_VERSION : '',
            'exported_at' => self::now(),
            'site_url'    => home_url('/'),
            'include'     => $include,
            'filters'     => $filters,
            'options'     => [],
            'tables'      => [],
        ];

        if (in_array('setup', $include, true)) {
            $payload['options'] = [
                'cspsr_system_name'            => get_option('cspsr_system_name', ''),
                'cspsr_logo_url'               => get_option('cspsr_logo_url', ''),
                'cspsr_logo_base64'            => get_option('cspsr_logo_base64', ''),
                'cspsr_setup_done'             => (bool) get_option('cspsr_setup_done', false),
                'cspsr_pause_reasons'          => get_option('cspsr_pause_reasons', '[]'),
                'cspsr_kds_carousel_interval'  => (int) get_option('cspsr_kds_carousel_interval', 8),
                'cspsr_whatsapp_notify'        => get_option('cspsr_whatsapp_notify', ''),
                'cspsr_debug_bar_enabled'      => (bool) get_option('cspsr_debug_bar_enabled', 1),
                'cspsr_company_workday_start'  => get_option('cspsr_company_workday_start', '09:00'),
                'cspsr_company_workday_end'    => get_option('cspsr_company_workday_end', '17:00'),
                'cspsr_company_working_days'   => get_option('cspsr_company_working_days', [0,1,2,3,4,5,6]),
                'cspsr_company_holidays'       => get_option('cspsr_company_holidays', []),
                'cspsr_notify_printing_team_id'        => (int) get_option('cspsr_notify_printing_team_id', 0),
                'cspsr_notify_logistics_department_id' => (int) get_option('cspsr_notify_logistics_department_id', 0),
                'cspsr_notification_rules'            => self::normalize_notification_rules(get_option('cspsr_notification_rules', '[]')),
            ];
        }

        $table_sets = [];
        if (in_array('master', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'roles','departments','teams','employees','statuses','products',
                'product_steps','production_step_library','suppliers',
            ]);
        }
        if (in_array('customers', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'customers','customer_recipients','customer_contacts',
            ]);
        }
        if (in_array('users', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'app_users','app_permissions',
            ]);
        }
        if (in_array('hr', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'employee_leaves','employee_leave_reassignments','employee_points',
            ]);
        }
        if (in_array('ops', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'ops_stages','ops_tasks','ops_task_positions','ops_task_events',
                // Archives (if they exist)
                'ops_tasks_archive','ops_task_positions_archive','ops_task_events_archive',
            ]);
        }
        if (in_array('ops_boards', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'ops_tasks','ops_task_positions',
                // Archives (if they exist)
                'ops_tasks_archive','ops_task_positions_archive',
            ]);
        }
        if (in_array('ops_stages', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'ops_stages',
            ]);
        }
        if (in_array('ops_events', $include, true)) {
            $table_sets = array_merge($table_sets, [
                'ops_task_events',
                // Archives (if they exist)
                'ops_task_events_archive',
            ]);
        }

        $table_sets = array_values(array_unique(array_filter($table_sets)));
        foreach ($table_sets as $suffix) {
            $table = self::tbl($suffix);
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
            if (!$exists) continue;
            $rows = $wpdb->get_results("SELECT * FROM $table", ARRAY_A);
            $payload['tables'][$suffix] = $rows ?: [];
        }

        // Operational exports can be requested as a single set ("operational") or granular sub-keys.
        $op_wants_orders = in_array('operational', $include, true) || in_array('op_orders', $include, true);
        $op_wants_items = in_array('operational', $include, true) || in_array('op_items', $include, true);
        $op_wants_steps = in_array('operational', $include, true) || in_array('op_steps', $include, true);
        $op_wants_events = in_array('operational', $include, true) || in_array('op_events', $include, true);
        $op_wants_delivery = in_array('operational', $include, true) || in_array('op_delivery', $include, true);
        $op_wants_notifications = in_array('operational', $include, true) || in_array('op_notifications', $include, true);
        $op_any = $op_wants_orders || $op_wants_items || $op_wants_steps || $op_wants_events || $op_wants_delivery || $op_wants_notifications;

        if ($op_any) {
            $op = (!empty($filters['operational']) && is_array($filters['operational'])) ? $filters['operational'] : [];
            $from = self::ymd_or_null($op['from'] ?? null);
            $to   = self::ymd_or_null($op['to'] ?? null);
            $max_orders = (int)($op['max_orders'] ?? 300);
            $max_orders = max(1, min(5000, $max_orders));
            $include_done = !empty($op['include_done']);

            $orders_tbl = self::tbl('orders');

            // Keep stable keys for callers, but only fill what was requested.
            $payload['tables']['orders'] = [];
            $payload['tables']['order_items'] = [];
            $payload['tables']['item_steps'] = [];
            $payload['tables']['order_events'] = [];
            $payload['tables']['step_events'] = [];
            $payload['tables']['delivery_attempts'] = [];
            $payload['tables']['delivery_batches'] = [];
            $payload['tables']['delivery_batch_items'] = [];
            $payload['tables']['notifications'] = [];

            $need_order_selection = $op_wants_orders || $op_wants_items || $op_wants_steps || $op_wants_events || $op_wants_delivery;
            $order_ids = [];
            if ($need_order_selection) {
                $where = "1=1";
                $params = [];
                if ($from) { $where .= " AND created_at >= %s"; $params[] = $from . " 00:00:00"; }
                if ($to)   { $where .= " AND created_at <= %s"; $params[] = $to . " 23:59:59"; }
                if (!$include_done) {
                    $where .= " AND (is_done IS NULL OR is_done=0) AND LOWER(COALESCE(status_slug,'')) NOT IN ('done','completed','cancelled')";
                }
                $params[] = $max_orders;
                $sql = "SELECT id FROM $orders_tbl WHERE $where ORDER BY id DESC LIMIT %d";
                $order_ids = $wpdb->get_col(self::prepare_sql($sql, $params)) ?: [];
                $order_ids = array_values(array_filter(array_map('intval', $order_ids)));
            }

            if (!empty($order_ids)) {
                $id_sql = implode(',', $order_ids);

                if ($op_wants_orders) {
                    $payload['tables']['orders'] = $wpdb->get_results("SELECT * FROM $orders_tbl WHERE id IN ($id_sql)", ARRAY_A) ?: [];
                }

                $items = [];
                $item_ids = [];
                if ($op_wants_items || $op_wants_steps) {
                    $items_tbl = self::tbl('order_items');
                    $items = $wpdb->get_results("SELECT * FROM $items_tbl WHERE order_id IN ($id_sql)", ARRAY_A) ?: [];
                    if ($op_wants_items) {
                        $payload['tables']['order_items'] = $items;
                    }
                    $item_ids = array_values(array_filter(array_map(function ($r) { return (int)($r['id'] ?? 0); }, $items)));
                }

                $steps = [];
                $step_ids = [];
                if ($op_wants_steps && !empty($item_ids)) {
                    $item_sql = implode(',', array_map('intval', $item_ids));
                    $steps_tbl = self::tbl('item_steps');
                    $steps = $wpdb->get_results("SELECT * FROM $steps_tbl WHERE order_item_id IN ($item_sql)", ARRAY_A) ?: [];
                    $payload['tables']['item_steps'] = $steps;
                    $step_ids = array_values(array_filter(array_map(function ($r) { return (int)($r['id'] ?? 0); }, $steps)));
                }

                if ($op_wants_events) {
                    $oe_tbl = self::tbl('order_events');
                    $payload['tables']['order_events'] = $wpdb->get_results("SELECT * FROM $oe_tbl WHERE order_id IN ($id_sql)", ARRAY_A) ?: [];

                    $se_tbl = self::tbl('step_events');
                    if (!empty($step_ids)) {
                        $step_sql = implode(',', array_map('intval', $step_ids));
                        $payload['tables']['step_events'] = $wpdb->get_results(
                            "SELECT * FROM $se_tbl WHERE step_id IN ($step_sql) OR order_id IN ($id_sql)",
                            ARRAY_A
                        ) ?: [];
                    } else {
                        $payload['tables']['step_events'] = $wpdb->get_results(
                            "SELECT * FROM $se_tbl WHERE order_id IN ($id_sql)",
                            ARRAY_A
                        ) ?: [];
                    }
                }

                if ($op_wants_delivery) {
                    $da_tbl = self::tbl('delivery_attempts');
                    $payload['tables']['delivery_attempts'] = $wpdb->get_results("SELECT * FROM $da_tbl WHERE order_id IN ($id_sql)", ARRAY_A) ?: [];

                    $db_tbl = self::tbl('delivery_batches');
                    $batches = $wpdb->get_results("SELECT * FROM $db_tbl WHERE order_id IN ($id_sql)", ARRAY_A) ?: [];
                    $payload['tables']['delivery_batches'] = $batches;
                    $batch_ids = array_values(array_filter(array_map(function ($r) { return (int)($r['id'] ?? 0); }, $batches)));
                    if (!empty($batch_ids)) {
                        $bi_tbl = self::tbl('delivery_batch_items');
                        $batch_sql = implode(',', array_map('intval', $batch_ids));
                        $payload['tables']['delivery_batch_items'] = $wpdb->get_results("SELECT * FROM $bi_tbl WHERE batch_id IN ($batch_sql)", ARRAY_A) ?: [];
                    }
                }
            }

            if ($op_wants_notifications) {
                $n_tbl = self::tbl('notifications');
                $payload['tables']['notifications'] = $wpdb->get_results("SELECT * FROM $n_tbl ORDER BY id DESC LIMIT 1000", ARRAY_A) ?: [];
            }
        }

        return self::ok($payload);
    }

    public static function import_data(WP_REST_Request $r) {
        global $wpdb;
        $d = $r->get_json_params();
        $payload = $d['payload'] ?? null;
        if (!$payload || !is_array($payload)) return self::err('Invalid payload', 400);

        $include = self::normalize_export_include($d['include'] ?? ($payload['include'] ?? null));
        $mode = strtolower(trim((string)($d['mode'] ?? 'merge')));
        $mode = ($mode === 'replace') ? 'replace' : 'merge';

        $result = [
            'mode' => $mode,
            'include' => $include,
            'options_updated' => 0,
            'tables' => [],
        ];

        if (in_array('setup', $include, true) && !empty($payload['options']) && is_array($payload['options'])) {
            $allowed = [
                'cspsr_system_name','cspsr_logo_url','cspsr_logo_base64','cspsr_setup_done',
                'cspsr_pause_reasons','cspsr_kds_carousel_interval','cspsr_whatsapp_notify','cspsr_debug_bar_enabled',
                'cspsr_company_workday_start','cspsr_company_workday_end','cspsr_company_working_days','cspsr_company_holidays',
                'cspsr_notify_printing_team_id','cspsr_notify_logistics_department_id',
                'cspsr_notification_rules',
            ];
            foreach ($allowed as $k) {
                if (!array_key_exists($k, $payload['options'])) continue;
                update_option($k, $payload['options'][$k]);
                $result['options_updated']++;
            }
            self::reschedule_open_orders();
        }

        $tables = (!empty($payload['tables']) && is_array($payload['tables'])) ? $payload['tables'] : [];
        foreach ($tables as $suffix => $rows) {
            $suffix = (string)$suffix;

            // Enforce include set for safety.
            $in_scope = false;
            if (in_array('master', $include, true) && in_array($suffix, ['roles','departments','teams','employees','statuses','products','product_steps','production_step_library','suppliers'], true)) $in_scope = true;
            if (in_array('customers', $include, true) && in_array($suffix, ['customers','customer_recipients','customer_contacts'], true)) $in_scope = true;
            if (in_array('users', $include, true) && in_array($suffix, ['app_users','app_permissions'], true)) $in_scope = true;
            if (in_array('hr', $include, true) && in_array($suffix, ['employee_leaves','employee_leave_reassignments','employee_points'], true)) $in_scope = true;
            if (in_array('ops', $include, true) && in_array($suffix, ['ops_stages','ops_tasks','ops_task_positions','ops_task_events','ops_tasks_archive','ops_task_positions_archive','ops_task_events_archive'], true)) $in_scope = true;
            if (in_array('ops_boards', $include, true) && in_array($suffix, ['ops_tasks','ops_task_positions','ops_tasks_archive','ops_task_positions_archive'], true)) $in_scope = true;
            if (in_array('ops_stages', $include, true) && in_array($suffix, ['ops_stages'], true)) $in_scope = true;
            if (in_array('ops_events', $include, true) && in_array($suffix, ['ops_task_events','ops_task_events_archive'], true)) $in_scope = true;

            if (in_array('operational', $include, true) && in_array($suffix, ['orders','order_items','item_steps','order_events','step_events','delivery_attempts','delivery_batches','delivery_batch_items','notifications'], true)) $in_scope = true;
            if (in_array('op_orders', $include, true) && in_array($suffix, ['orders'], true)) $in_scope = true;
            if (in_array('op_items', $include, true) && in_array($suffix, ['order_items'], true)) $in_scope = true;
            if (in_array('op_steps', $include, true) && in_array($suffix, ['item_steps'], true)) $in_scope = true;
            if (in_array('op_events', $include, true) && in_array($suffix, ['order_events','step_events'], true)) $in_scope = true;
            if (in_array('op_delivery', $include, true) && in_array($suffix, ['delivery_attempts','delivery_batches','delivery_batch_items'], true)) $in_scope = true;
            if (in_array('op_notifications', $include, true) && in_array($suffix, ['notifications'], true)) $in_scope = true;
            if (!$in_scope) continue;

            $table = self::tbl($suffix);
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
            if (!$exists) continue;

            $rows = is_array($rows) ? $rows : [];
            $cols = self::table_columns_cached($table);
            $written = 0;

            if ($mode === 'replace') {
                $wpdb->query("TRUNCATE TABLE $table");
            }

            foreach ($rows as $row) {
                if (!is_array($row)) continue;
                $filtered = [];
                foreach ($row as $k => $v) {
                    $k = (string)$k;
                    if (!isset($cols[$k])) continue;
                    $filtered[$k] = $v;
                }
                if (empty($filtered)) continue;
                $ok = $wpdb->replace($table, $filtered);
                if ($ok !== false) $written++;
            }

            $result['tables'][$suffix] = [
                'rows_in_payload' => count($rows),
                'rows_written' => $written,
            ];
        }

        return self::ok($result);
    }

    // ── QR image proxy ────────────────────────────────────────────────────────
    public static function qr_image(WP_REST_Request $r) {
        $text = $r->get_param('text') ?? '';
        $url  = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . rawurlencode($text);
        return self::ok(['url' => $url, 'text' => $text]);
    }

    public static function qr_contact_page(WP_REST_Request $r) {
        global $wpdb;

        $app_user_id = self::current_app_user_id();
        $wp_logged_in = function_exists('is_user_logged_in') ? is_user_logged_in() : false;
        if (!$app_user_id && !$wp_logged_in) {
            $current_url = (isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'https')
                . '://'
                . ($_SERVER['HTTP_HOST'] ?? '')
                . ($_SERVER['REQUEST_URI'] ?? '');
            $login_api = rest_url('cspsr/v1/auth/login');
            header('Content-Type: text/html; charset=utf-8');
            status_header(401);
            echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                . '<title>Login Required</title>'
                . '<style>body{font-family:Arial,sans-serif;background:#f5f7fb;color:#111827;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0} .box{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px;max-width:460px;box-shadow:0 10px 30px rgba(0,0,0,.06)} a{display:inline-block;margin-top:12px;background:#635bff;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600}</style>'
                . '</head><body><div class="box"><h2 style="margin:0 0 8px 0;">Login Required</h2>'
                . '<p style="margin:0 0 6px 0;line-height:1.6">You must sign in before opening this QR page.</p>'
                . '<p style="margin:0 0 6px 0;line-height:1.6">يجب تسجيل الدخول أولاً لفتح صفحة QR.</p>'
                . '<style>.in{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;outline:none;margin-top:6px;box-sizing:border-box}.btn{display:inline-block;margin-top:12px;background:#635bff;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer;width:100%}.msg{font-size:13px;margin-top:10px}.err{color:#b91c1c}.ok{color:#166534}</style>'
                . '<label style="display:block;margin-top:8px">Username<input id="qr_user" class="in" autocomplete="username"></label>'
                . '<label style="display:block;margin-top:10px">Password<input id="qr_pass" type="password" class="in" autocomplete="current-password"></label>'
                . '<button id="qr_login_btn" class="btn">Sign in to open QR</button>'
                . '<div id="qr_msg" class="msg"></div>'
                . '<script>(function(){var api=' . json_encode(esc_url_raw($login_api)) . ';var redirectUrl=' . json_encode($current_url) . ';var btn=document.getElementById("qr_login_btn"),msg=document.getElementById("qr_msg");function setMsg(t,ok){msg.className="msg "+(ok?"ok":"err");msg.textContent=t||"";}function saveToken(token){try{localStorage.setItem("cspsr_token",token);}catch(e){}var secure=(location.protocol==="https:")?"; Secure":"";document.cookie="cspsr_token="+encodeURIComponent(token)+"; Path=/; Max-Age="+(60*60*24*30)+"; SameSite=Lax"+secure;}function doLogin(){var u=(document.getElementById("qr_user").value||"").trim();var p=(document.getElementById("qr_pass").value||"");if(!u||!p){setMsg("Enter username and password / أدخل اسم المستخدم وكلمة المرور",false);return;}btn.disabled=true;btn.textContent="Signing in...";setMsg("",false);fetch(api,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})}).then(function(r){return r.json().then(function(j){if(!r.ok){throw new Error((j&&j.message)||"Login failed");}return j;});}).then(function(j){if(!j||!j.token) throw new Error("Token missing");saveToken(j.token);setMsg("Success. Opening QR page... / تم تسجيل الدخول",true);setTimeout(function(){location.replace(redirectUrl);},250);}).catch(function(e){setMsg((e&&e.message?e.message:"Login failed")+" / فشل تسجيل الدخول",false);btn.disabled=false;btn.textContent="Sign in to open QR";});}btn.addEventListener("click",doLogin);document.getElementById("qr_pass").addEventListener("keydown",function(e){if(e.key==="Enter") doLogin();});})();</script>'
                . '</div></body></html>';
            exit;
        }

        $order_id = intval($r->get_param('order_id'));
        if (!$order_id && isset($_GET['order_id'])) $order_id = intval($_GET['order_id']);
        $batch_id = intval($r->get_param('batch_id'));
        if (!$batch_id && isset($_GET['batch_id'])) $batch_id = intval($_GET['batch_id']);
        $is_partial = (bool) $r->get_param('partial');
        if (!$is_partial && isset($_GET['partial'])) $is_partial = (bool) intval($_GET['partial']);
        $item_ids_raw = $r->get_param('item_ids');
        if ($item_ids_raw === null && isset($_GET['item_ids'])) $item_ids_raw = wp_unslash($_GET['item_ids']);
        $item_ids = array_values(array_filter(array_map('intval', explode(',', (string)$item_ids_raw))));
        if (!$order_id) { header('Content-Type: text/html; charset=utf-8'); echo '<p>Invalid</p>'; exit; }

        $pfx    = $wpdb->prefix . 'cspsr_';
        $o_tbl  = $pfx . 'orders';
        $c_tbl  = $pfx . 'customers';
        $cc_tbl = $pfx . 'customer_contacts';
        $cr_tbl = $pfx . 'customer_recipients';
        $oi_tbl = $pfx . 'order_items';

        $order = $wpdb->get_row($wpdb->prepare("SELECT * FROM $o_tbl WHERE id=%d LIMIT 1", $order_id), ARRAY_A);
        if (!$order) { header('Content-Type: text/html; charset=utf-8'); echo '<p>Order not found</p>'; exit; }

        // Fetch customer
        $cust = !empty($order['customer_id'])
            ? ($wpdb->get_row($wpdb->prepare("SELECT * FROM $c_tbl WHERE id=%d LIMIT 1", $order['customer_id']), ARRAY_A) ?: [])
            : [];

        // Fetch ONLY the contact person selected on this order
        // If none selected, fallback to first contact person of the customer
        $cp = [];
        if (!empty($order['contact_person_id'])) {
            $cp = $wpdb->get_row($wpdb->prepare("SELECT * FROM $cc_tbl WHERE id=%d LIMIT 1", $order['contact_person_id']), ARRAY_A) ?: [];
        }
        if (empty($cp) && !empty($order['customer_id'])) {
            $cp = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $cc_tbl WHERE customer_id=%d ORDER BY id LIMIT 1", $order['customer_id']
            ), ARRAY_A) ?: [];
        }

        // Fetch recipient
        $rec = !empty($order['recipient_id'])
            ? ($wpdb->get_row($wpdb->prepare("SELECT * FROM $cr_tbl WHERE id=%d LIMIT 1", $order['recipient_id']), ARRAY_A) ?: [])
            : [];

        $queued_count = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $oi_tbl WHERE order_id=%d AND is_ready_for_delivery=1 AND (is_delivered IS NULL OR is_delivered=0)",
            $order_id
        ));
        $open_count = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $oi_tbl WHERE order_id=%d AND (is_delivered IS NULL OR is_delivered=0)",
            $order_id
        ));
        $has_partial_state = $queued_count > 0 && $open_count > $queued_count;
        if (!$is_partial && $batch_id <= 0 && empty($item_ids) && $has_partial_state) {
            $is_partial = true;
        }

        // Fetch items
        if ($batch_id > 0) {
            $dbi_tbl = $pfx . 'delivery_batch_items';
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT oi.id, oi.product_name, oi.quantity
                 FROM $oi_tbl oi
                 INNER JOIN $dbi_tbl dbi ON dbi.order_item_id = oi.id
                 WHERE oi.order_id=%d AND dbi.batch_id=%d
                 ORDER BY oi.id",
                $order_id,
                $batch_id
            ), ARRAY_A) ?: [];
        } elseif (!empty($item_ids)) {
            $placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
            $params = array_merge([$order_id], $item_ids);
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity FROM $oi_tbl WHERE order_id=%d AND id IN ($placeholders) ORDER BY id",
                $params
            ), ARRAY_A) ?: [];
        } elseif ($is_partial) {
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity
                 FROM $oi_tbl
                 WHERE order_id=%d AND is_ready_for_delivery=1 AND (is_delivered IS NULL OR is_delivered=0)
                 ORDER BY id",
                $order_id
            ), ARRAY_A) ?: [];
        } else {
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity FROM $oi_tbl WHERE order_id=%d ORDER BY id", $order_id
            ), ARRAY_A) ?: [];
        }

        if (empty($items) && $batch_id > 0 && !empty($item_ids)) {
            $placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
            $params = array_merge([$order_id], $item_ids);
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity FROM $oi_tbl WHERE order_id=%d AND id IN ($placeholders) ORDER BY id",
                $params
            ), ARRAY_A) ?: [];
        }
        if (empty($items) && $is_partial) {
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity
                 FROM $oi_tbl
                 WHERE order_id=%d AND (is_ready_for_delivery=1 OR delivery_batch_id IS NOT NULL) AND (is_delivered IS NULL OR is_delivered=0)
                 ORDER BY id",
                $order_id
            ), ARRAY_A) ?: [];
        }

        if (empty($items)) {
            $queued_items = $wpdb->get_results($wpdb->prepare(
                "SELECT id, product_name, quantity
                 FROM $oi_tbl
                 WHERE order_id=%d AND is_ready_for_delivery=1 AND (is_delivered IS NULL OR is_delivered=0)
                 ORDER BY id",
                $order_id
            ), ARRAY_A) ?: [];
            $all_open_items = $wpdb->get_results($wpdb->prepare(
                "SELECT id FROM $oi_tbl WHERE order_id=%d AND (is_delivered IS NULL OR is_delivered=0)",
                $order_id
            ), ARRAY_A) ?: [];
            if (!empty($queued_items) && count($queued_items) < count($all_open_items)) {
                $items = $queued_items;
                $is_partial = true;
            }
        }

        // Best info: recipient > contact_person > customer
        $recipient = ($rec['name']  ?? '') ?: ($cp['name']  ?? '') ?: '';
        $phone     = ($rec['phone'] ?? '') ?: ($cp['phone'] ?? '') ?: ($cust['phone'] ?? '') ?: ($cust['phone_alt'] ?? '') ?: '';
        $address   = ($rec['address'] ?? '') ?: ($cp['address'] ?? '') ?: ($cust['address_ar'] ?? '') ?: ($cust['address'] ?? '') ?: '';
        $map       = ($rec['map_url'] ?? '') ?: ($cp['map_url'] ?? '') ?: ($cust['map_url'] ?? '') ?: ($order['delivery_map_url'] ?? '') ?: '';
        $company   = ($cust['company_name_ar'] ?? '') ?: ($cust['company_name_en'] ?? '') ?: ($cust['company_name'] ?? '') ?: ($cust['name_ar'] ?? '') ?: ($cust['name_en'] ?? '') ?: ($cust['name'] ?? '') ?: '';
        $order_num = $order['order_number'] ?: '#'.$order_id;
        $wa_phone  = preg_replace('/[^0-9]/', '', $phone);

        // Notify WhatsApp number from Settings
        $notify_wa  = preg_replace('/[^0-9]/', '', get_option('cspsr_whatsapp_notify', ''));
        $detail_url = add_query_arg([
            'cspsr_qr_contact' => $order_id,
            'partial' => $is_partial ? 1 : null,
            'batch_id' => $batch_id > 0 ? $batch_id : null,
            'item_ids' => !empty($item_ids) ? implode(',', $item_ids) : null,
        ], home_url('/'));
        $notify_msg = urlencode(
            'طلب: ' . $order_num . "\n" .
            'الشركة: ' . $company . "\n" .
            ($recipient ? 'المستلم: ' . $recipient . "\n" : '') .
            ($phone     ? 'الهاتف: ' . $phone . "\n" : '') .
            ($address   ? 'العنوان: ' . $address . "\n" : '') .
            'رابط التفاصيل: ' . $detail_url
        );
        $qr_url = $detail_url;
        $qr_img_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='.urlencode($qr_url);
        // Fetch QR as base64 for reliable printing
        $qr_response = wp_remote_get($qr_img_url, ['timeout'=>8]);
        if (!is_wp_error($qr_response) && wp_remote_retrieve_response_code($qr_response) === 200) {
            $qr_img_src = 'data:image/png;base64,' . base64_encode(wp_remote_retrieve_body($qr_response));
        } else {
            $qr_img_src = $qr_img_url;
        }

        $products_rows = '';
        if (!empty($items)) {
            foreach ($items as $idx => $i) {
                $label = $idx === 0 ? 'المنتجات' : '';
                $products_rows .= '<tr><td>'.$label.'</td><td>'.esc_html($i['product_name']).' <span style="color:#6b7280;font-weight:400">&times; '.intval($i['quantity']).'</span></td></tr>';
            }
        }

        ob_start();
?><!DOCTYPE html><html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title><?=esc_html($order_num)?></title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:"Segoe UI",Tahoma,system-ui,sans-serif;background:#f0f4f8;padding:12px;direction:rtl;color:#111827;}
.card{background:#fff;border-radius:16px;max-width:380px;width:100%;margin:0 auto;box-shadow:0 6px 24px rgba(0,0,0,.12);overflow:hidden;}
.card-header{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:14px 18px 12px;text-align:center;}
.card-header h1{font-size:13px;font-weight:700;color:#dbeafe;letter-spacing:.2px;margin-bottom:2px;}
.card-header .order-num{font-size:22px;font-weight:800;color:#fff;font-family:monospace;line-height:1.1;}
.card-body{padding:14px 16px 10px;}
table.info{width:100%;border-collapse:collapse;}
table.info tr{border-bottom:1px solid #f1f5f9;}
table.info tr:last-child{border-bottom:none;}
table.info td{padding:8px 4px;font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;}
table.info td:first-child{font-weight:700;color:#4b5563;width:82px;white-space:nowrap;}
table.info td:last-child{color:#111827;font-weight:600;}
.qr-section{margin:10px 16px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;text-align:center;}
.qr-label{font-size:10px;color:#6b7280;letter-spacing:.8px;margin-bottom:8px;font-weight:700;}
.qr-wrap{display:flex;justify-content:center;align-items:center;min-height:210px;}
.qr-wrap svg{border-radius:6px;max-width:100%;height:auto;}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:10px 18px 16px;}
.btn{display:flex;align-items:center;justify-content:center;padding:10px 6px;border-radius:10px;text-decoration:none;font-weight:700;font-size:12px;border:1px solid transparent;text-align:center;gap:4px;}
.btn-call{background:#f0fdf4;color:#166534;border-color:#bbf7d0;}
.btn-wa{background:#dcfce7;color:#15803d;border-color:#86efac;}
.btn-map{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;}
.btn-notify{background:#fef9c3;color:#854d0e;border-color:#fde68a;grid-column:1/-1;}
.btn-sys{background:#f5f3ff;color:#5b21b6;border-color:#ddd6fe;grid-column:1/-1;}
/* Print styles */
@media print{
  @page{size:80mm auto;margin:4mm;}
  html,body{width:80mm;max-width:80mm;background:#fff;padding:0;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-size:12px;}
  .card{box-shadow:none;border-radius:0;max-width:72mm;width:72mm;margin:0 auto;border:0;}
  .card-header{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .card-header{padding:10px 10px 9px;}
  .card-header h1{font-size:12px;margin-bottom:2px;}
  .card-header .order-num{font-size:24px;}
  .card-body{padding:10px 10px 8px;}
  table.info td{padding:7px 2px;font-size:12px;line-height:1.35;}
  table.info td:first-child{width:64px;}
  .qr-section{margin:8px 10px;padding:8px;border:1px solid #d1d5db;border-radius:8px;}
  .qr-label{font-size:10px;margin-bottom:6px;}
  .qr-wrap{min-height:0;}
  .qr-wrap svg{width:48mm!important;height:48mm!important;max-width:48mm!important;max-height:48mm!important;}
  .btns{display:none!important;}
  .qr-wrap svg{display:block!important;}
}
@media print {
  .btns { display:none !important; }
  canvas { display:block !important; visibility:visible !important; }
}
@media (max-width:420px){
  body{padding:8px;background:#fff;}
  .card{max-width:100%;border-radius:10px;box-shadow:none;}
  .card-header{padding:12px 14px 10px;}
  .card-header .order-num{font-size:24px;}
  .card-body{padding:12px 12px 8px;}
  table.info td{font-size:13px;padding:8px 2px;}
  table.info td:first-child{width:70px;}
  .qr-section{margin:8px 12px;padding:10px;}
  .qr-wrap svg{width:220px;max-width:100%;height:auto;}
}
</style>
</head><body>
<script>
(function(window){
var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};
var QRMode={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8};
var QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}



var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};



function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};



function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};


function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};



function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};


//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
// Modified to work in node for this project (and some refactoring)
//---------------------------------------------------------------------


function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};


window.makeQRSVG = function(text, px) {
  px = px || 9;
  var qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(text);
  qr.make();
  var s = qr.getModuleCount(), p = px*2, d = s*px + p*2;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + d + '" height="' + d + '" style="display:block;margin:0 auto">';
  svg += '<rect width="' + d + '" height="' + d + '" fill="#fff"/>';
  for(var r=0;r<s;r++) for(var c=0;c<s;c++)
    if(qr.isDark(r,c)) svg += '<rect x="' + (p+c*px) + '" y="' + (p+r*px) + '" width="' + px + '" height="' + px + '" fill="#000"/>';
  svg += '</svg>';
  return svg;
};
})(typeof window !== "undefined" ? window : this);

var QR_DATA = "<?=addslashes($qr_url)?>";
var AUTO_PRINT = (window.location.search.indexOf('print=1') >= 0);
</script>
<div class="card">
<div class="card-header">
  <h1>وصل التوصيل</h1>
  <div class="order-num">#<?=esc_html($order_num)?></div>
</div>
<div class="card-body">
<table class="info">
  <?php if ($company): ?><tr><td>الشركة</td><td><?=esc_html($company)?></td></tr><?php endif; ?>
  <?php if ($recipient): ?><tr><td>المستلم</td><td><?=esc_html($recipient)?></td></tr><?php endif; ?>
  <?php if ($phone): ?><tr><td>الهاتف</td><td dir="ltr" style="text-align:right"><?=esc_html($phone)?></td></tr><?php endif; ?>
  <?php if ($address): ?><tr><td>العنوان</td><td><?=esc_html($address)?></td></tr><?php endif; ?>
  <?php if ($products_rows): ?><?=$products_rows?><?php endif; ?>
</table>
</div>
<div class="qr-section">
  <div class="qr-label">امسح للتفاصيل</div>
  <div class="qr-wrap" id="qr-wrap"></div>
</div>
<script>
window.addEventListener('load', function(){
  var wrap = document.getElementById('qr-wrap');
  try {
    var svg = makeQRSVG(QR_DATA, 7);
    wrap.innerHTML = svg;
  } catch(e) {
    wrap.innerHTML = '<div style="padding:20px;color:#999;text-align:center">QR unavailable</div>';
  }
  if (AUTO_PRINT) setTimeout(function(){ window.print(); }, 600);
});
</script>
<div class="btns">
<?php if ($phone): ?>
  <a href="tel:<?=esc_attr($phone)?>" class="btn btn-call">📞 اتصال مباشر</a>
  <a href="https://wa.me/<?=esc_attr($wa_phone)?>" target="_blank" class="btn btn-wa">💬 فتح واتساب</a>
<?php endif; ?>
<?php if ($map): ?>
  <a href="<?=esc_url($map)?>" target="_blank" class="btn btn-map">🗺 فتح Google Maps</a>
<?php endif; ?>
<?php if ($notify_wa): ?>
  <a href="https://wa.me/<?=esc_attr($notify_wa)?>?text=<?=$notify_msg?>" target="_blank" class="btn btn-notify">📤 إرسال للواتساب</a>
<?php endif; ?>
</div>
</div></body></html><?php
        $html = ob_get_clean();
        header('Content-Type: text/html; charset=utf-8');
        header('X-Robots-Tag: noindex');
        echo $html;
        exit;
    }

    public static function partial_deliver(WP_REST_Request $req) {
        global $wpdb;
        $order_id = (int)$req->get_param('id');
        $d        = $req->get_json_params();
        $item_ids = array_map('intval', $d['item_ids'] ?? []);

        if (empty($item_ids)) return self::err('item_ids is required');

        $oi_tbl = self::tbl('order_items');
        $is_tbl = self::tbl('item_steps');
        $batch_tbl = self::tbl('delivery_batches');
        $batch_items_tbl = self::tbl('delivery_batch_items');
        $batch_no = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(MAX(batch_no),0)+1 FROM $batch_tbl WHERE order_id=%d",
            $order_id
        ));
        $wpdb->insert($batch_tbl, [
            'order_id' => $order_id,
            'batch_no' => max(1, $batch_no),
            'status' => 'queued',
            'notes' => $d['notes'] ?? '',
            'created_by' => self::current_app_user_id(),
        ]);
        $batch_id = (int)$wpdb->insert_id;
        $queued = 0;

        foreach ($item_ids as $item_id) {
            // Verify item belongs to this order
            $item = $wpdb->get_row($wpdb->prepare(
                "SELECT id FROM $oi_tbl WHERE id=%d AND order_id=%d", $item_id, $order_id
            ), ARRAY_A);
            if (!$item) continue;

            $remaining_prod = (int)$wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $is_tbl WHERE order_item_id=%d AND is_delivery != 1 AND status_slug NOT IN ('done','completed')",
                $item_id
            ));
            if ($remaining_prod > 0) continue;

            // Flag item as ready for delivery and bind it to a delivery batch
            $wpdb->update($oi_tbl, [
                'is_ready_for_delivery' => 1,
                'ready_for_delivery_at' => self::now(),
                'delivery_batch_id' => $batch_id,
            ], ['id' => $item_id]);
            $wpdb->query($wpdb->prepare(
                "INSERT IGNORE INTO $batch_items_tbl (batch_id, order_item_id) VALUES (%d, %d)",
                $batch_id,
                $item_id
            ));
            $queued++;
        }
        if ($queued === 0) {
            $wpdb->delete($batch_tbl, ['id' => $batch_id]);
            return self::err('No production-complete items were selected', 400);
        }
        self::log_order_event($order_id, 'partial_delivery_queued', [
            'batch_id' => $batch_id,
            'batch_no' => $batch_no,
            'item_ids' => $item_ids,
            'queued_count' => $queued,
        ]);

        // Fetch updated order and return
        $rows = self::_fetch_orders_with_relations('o.id = ' . $order_id);
        return self::ok(['queued' => $queued, 'batch_id' => $batch_id, 'batch_no' => $batch_no, 'order_completed' => false, 'order' => $rows[0] ?? null]);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  OPERATIONS TASKS
    // ════════════════════════════════════════════════════════════════════════

    /** Auto-generate the next task number: OT-0001, OT-0002 … */
    private static function next_task_no() {
        global $wpdb;
        $tbl  = self::tbl('ops_tasks');
        $last = $wpdb->get_var("SELECT task_no FROM $tbl ORDER BY id DESC LIMIT 1");
        if (!$last) return 'OT-0001';
        $num = (int) preg_replace('/\D/', '', $last);
        return 'OT-' . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
    }

    /** Return all tasks with customer + contact person names joined, excluding completed */
    public static function list_ops_tasks(WP_REST_Request $req) {
        global $wpdb;
        $rows = self::_fetch_ops_tasks("(t.completed_at IS NULL OR t.completed_at = '' OR t.completed_at = '0000-00-00 00:00:00')");
        return self::ok($rows);
    }

    private static function completed_ops_tasks_source_sql($include_archive = false) {
        $live = self::tbl('ops_tasks');
        if (!$include_archive) {
            return "SELECT t.*, 'live' AS source_type FROM $live t";
        }
        $archive = self::tbl('ops_tasks_archive');
        if (!self::table_exists($archive)) {
            return "SELECT t.*, 'live' AS source_type FROM $live t";
        }
        return "
            SELECT t.*, 'live' AS source_type FROM $live t
            UNION ALL
            SELECT t.*, 'archive' AS source_type FROM $archive t
        ";
    }

    /** Return only completed tasks */
    public static function list_ops_tasks_completed(WP_REST_Request $req) {
        global $wpdb;
        $q = trim((string) $req->get_param('q'));
        $include_archive = ((int) $req->get_param('include_archive') === 1) || ($q !== '');
        $has_page = ($req->get_param('page') !== null || $req->get_param('per_page') !== null || $q !== '' || $include_archive);

        if (!$has_page) {
            $rows = self::_fetch_ops_tasks("(t.completed_at IS NOT NULL AND t.completed_at <> '' AND t.completed_at <> '0000-00-00 00:00:00')");
            return self::ok($rows);
        }

        $pagination = self::pagination_params($req, 25, 200);
        $source_sql = self::completed_ops_tasks_source_sql($include_archive);
        $where = "t.completed_at IS NOT NULL AND t.completed_at <> '' AND t.completed_at <> '0000-00-00 00:00:00'";
        $params = [];
        if ($q !== '') {
            $like = '%' . $wpdb->esc_like($q) . '%';
            $where .= " AND (
                t.task_no LIKE %s OR
                t.description LIKE %s OR
                c.name LIKE %s OR c.company_name LIKE %s OR
                cc.name LIKE %s OR
                e.name LIKE %s OR e.name_en LIKE %s
            )";
            array_push($params, $like, $like, $like, $like, $like, $like, $like);
        }

        $count_sql = "
            SELECT COUNT(*)
            FROM ($source_sql) t
            LEFT JOIN " . self::tbl('customers') . " c ON c.id = t.customer_id
            LEFT JOIN " . self::tbl('customer_contacts') . " cc ON cc.id = t.contact_person_id
            LEFT JOIN " . self::tbl('employees') . " e ON e.id = t.assigned_employee_id
            WHERE $where
        ";
        $total = (int) $wpdb->get_var($params ? $wpdb->prepare($count_sql, ...$params) : $count_sql);

        $rows_sql = "
            SELECT t.*,
                   c.name  AS customer_name,  c.company_name AS customer_company,
                   c.name_en AS customer_name_en, c.company_name_en AS customer_company_en,
                   c.phone AS customer_phone,
                   cc.name AS contact_person_name, cc.phone AS contact_person_phone,
                   e.name AS assigned_employee_name, e.name_en AS assigned_employee_name_en,
                   cu.name AS created_by_name, cu.username AS created_by_username
            FROM ($source_sql) t
            LEFT JOIN " . self::tbl('customers') . " c ON c.id = t.customer_id
            LEFT JOIN " . self::tbl('customer_contacts') . " cc ON cc.id = t.contact_person_id
            LEFT JOIN " . self::tbl('employees') . " e ON e.id = t.assigned_employee_id
            LEFT JOIN " . self::tbl('app_users') . " cu ON cu.id = t.created_by
            WHERE $where
            ORDER BY COALESCE(t.completed_at, t.created_at) DESC, t.id DESC
            LIMIT %d OFFSET %d
        ";
        $rows_params = $params;
        $rows_params[] = $pagination['per_page'];
        $rows_params[] = $pagination['offset'];
        $rows = $wpdb->get_results($wpdb->prepare($rows_sql, ...$rows_params), ARRAY_A) ?: [];

        foreach ($rows as &$row) {
            $row['is_archived'] = (($row['source_type'] ?? 'live') === 'archive') ? 1 : 0;
            $row['positions'] = [];
            $ids = self::unwrap_emp_ids($row['assigned_employee_ids'] ?? []);
            if (empty($ids) && !empty($row['assigned_employee_id'])) $ids = [(string)((int)$row['assigned_employee_id'])];
            $ids = array_values(array_unique(array_filter(array_map(function($v){ return (string)((int)$v); }, (array)$ids), function($v){ return ((int)$v) > 0; })));
            $row['assigned_employee_ids'] = $ids;
            if (!empty($ids)) $row['assigned_employee_id'] = (int)$ids[0];
        }
        unset($row);

        return self::ok(self::paged_payload($rows, $pagination['page'], $pagination['per_page'], $total));
    }

    public static function get_ops_task(WP_REST_Request $req) {
        $rows = self::_fetch_ops_tasks($req->get_param('id') ? 't.id=' . (int)$req->get_param('id') : '1=0');
        return $rows ? self::ok($rows[0]) : self::err('Not found', 404);
    }

    public static function get_ops_task_timeline(WP_REST_Request $req) {
        $task_id = (int) $req->get_param('id');
        $rows = self::_fetch_ops_tasks($task_id ? 't.id=' . $task_id : '1=0');
        if (empty($rows)) return self::err('Not found', 404);
        $task = $rows[0];
        return self::ok([
            'task' => $task,
            'current_position' => self::ops_task_current_position($task_id),
            'events' => self::ops_task_timeline($task_id),
        ]);
    }

    public static function create_ops_task(WP_REST_Request $req) {
        global $wpdb;
        $d = $req->get_json_params();
        if (empty($d['customer_id'])) return self::err('customer_id is required');
        $assigned_employee_ids = self::unwrap_emp_ids($d['assigned_employee_ids'] ?? []);
        if (empty($assigned_employee_ids) && !empty($d['assigned_employee_id'])) {
            $assigned_employee_ids = [(string)((int)$d['assigned_employee_id'])];
        }
        $assigned_employee_ids = array_values(array_unique(array_filter(array_map(function($v){ return (string)((int)$v); }, (array)$assigned_employee_ids), function($v){ return ((int)$v) > 0; })));
        $assigned_employee_id = !empty($assigned_employee_ids) ? (int)$assigned_employee_ids[0] : null;

        $task_no = self::next_task_no();
        $wpdb->insert(self::tbl('ops_tasks'), [
            'task_no'           => $task_no,
            'linked_order_id'   => !empty($d['linked_order_id'])   ? (int)$d['linked_order_id']   : null,
            'customer_id'       => (int)$d['customer_id'],
            'contact_person_id' => !empty($d['contact_person_id']) ? (int)$d['contact_person_id'] : null,
            'product_id'        => !empty($d['product_id'])        ? (int)$d['product_id']        : null,
            'assigned_employee_id' => $assigned_employee_id,
            'assigned_employee_ids' => wp_json_encode($assigned_employee_ids),
            'created_by'        => self::current_app_user_id(),
            'description'       => sanitize_textarea_field($d['description'] ?? ''),
            'deadline'          => !empty($d['deadline']) ? sanitize_text_field($d['deadline']) : null,
            'time'              => sanitize_text_field($d['time'] ?? ''),
        ]);
        $task_id = $wpdb->insert_id;

        // Optional initial placement: only if the caller explicitly asks for it.
        $dept_id  = !empty($d['department_id']) ? (int) $d['department_id'] : 0;
        $stage_id = !empty($d['stage_id']) ? (int) $d['stage_id'] : 0;
        if ($dept_id > 0 || $stage_id > 0) {
            if ($dept_id <= 0 && $stage_id > 0) {
                $dept_id = (int) $wpdb->get_var($wpdb->prepare(
                    "SELECT department_id FROM " . self::tbl('ops_stages') . " WHERE id=%d LIMIT 1",
                    $stage_id
                ));
            }
            if ($dept_id > 0 && $stage_id <= 0) {
                $stage_id = (int) $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM " . self::tbl('ops_stages') . " WHERE department_id=%d ORDER BY sort_order ASC, id ASC LIMIT 1",
                    $dept_id
                ));
            }
            $wpdb->insert(self::tbl('ops_task_positions'), [
                'task_id'       => $task_id,
                'department_id' => $dept_id > 0 ? $dept_id : null,
                'stage_id'      => $stage_id > 0 ? $stage_id : null,
                'sort_order'    => !empty($d['sort_order']) ? (int)$d['sort_order'] : 0,
            ]);
        }

        $created_pos = self::ops_task_current_position($task_id);
        self::log_ops_task_event($task_id, 'task_created', [
            'task_no' => $task_no,
            'customer_id' => (int) $d['customer_id'],
            'contact_person_id' => !empty($d['contact_person_id']) ? (int)$d['contact_person_id'] : null,
            'assigned_employee_id' => $assigned_employee_id,
            'assigned_employee_ids' => $assigned_employee_ids,
            'department_id' => $created_pos ? (int)($created_pos['department_id'] ?? 0) : ($dept_id > 0 ? $dept_id : null),
            'department_name' => $created_pos['department_name'] ?? null,
            'stage_id' => $created_pos ? (int)($created_pos['stage_id'] ?? 0) : ($stage_id > 0 ? $stage_id : null),
            'stage_name' => $created_pos['stage_name'] ?? null,
            'deadline' => !empty($d['deadline']) ? sanitize_text_field($d['deadline']) : null,
            'time' => sanitize_text_field($d['time'] ?? ''),
        ]);

        return self::created(['id' => $task_id, 'task_no' => $task_no]);
    }

    public static function update_ops_task(WP_REST_Request $req) {
        global $wpdb;
        $id = (int)$req->get_param('id');
        $d  = $req->get_json_params();
        $assigned_employee_ids = self::unwrap_emp_ids($d['assigned_employee_ids'] ?? []);
        if (empty($assigned_employee_ids) && !empty($d['assigned_employee_id'])) {
            $assigned_employee_ids = [(string)((int)$d['assigned_employee_id'])];
        }
        $assigned_employee_ids = array_values(array_unique(array_filter(array_map(function($v){ return (string)((int)$v); }, (array)$assigned_employee_ids), function($v){ return ((int)$v) > 0; })));
        $assigned_employee_id = !empty($assigned_employee_ids) ? (int)$assigned_employee_ids[0] : null;
        $wpdb->update(self::tbl('ops_tasks'), [
            'linked_order_id'   => !empty($d['linked_order_id'])   ? (int)$d['linked_order_id']   : null,
            'customer_id'       => (int)($d['customer_id'] ?? 0),
            'contact_person_id' => !empty($d['contact_person_id']) ? (int)$d['contact_person_id'] : null,
            'product_id'        => !empty($d['product_id'])        ? (int)$d['product_id']        : null,
            'assigned_employee_id' => $assigned_employee_id,
            'assigned_employee_ids' => wp_json_encode($assigned_employee_ids),
            'description'       => sanitize_textarea_field($d['description'] ?? ''),
            'deadline'          => !empty($d['deadline']) ? sanitize_text_field($d['deadline']) : null,
            'time'              => sanitize_text_field($d['time'] ?? ''),
        ], ['id' => $id]);
        return self::ok(['updated' => true]);
    }

    public static function delete_ops_task(WP_REST_Request $req) {
        global $wpdb;
        $id = (int)$req->get_param('id');
        $wpdb->delete(self::tbl('ops_task_positions'), ['task_id' => $id]);
        $wpdb->delete(self::tbl('ops_tasks'), ['id' => $id]);
        return self::ok(['deleted' => true]);
    }

    /**
     * Move a task to a specific stage (and optionally a sort_order within that stage).
     * Handles the department-flow rule: if linked_order_id is null and next dept is Production, skip it.
     * Body: { stage_id, department_id, sort_order }
     */
      public static function move_ops_task(WP_REST_Request $req) {
          global $wpdb;
          $id   = (int)$req->get_param('id');
          $d    = $req->get_json_params();
          $task = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::tbl('ops_tasks') . " WHERE id=%d LIMIT 1", $id), ARRAY_A);
          if (!$task) return self::err('Task not found', 404);
          $stage_id = !empty($d['stage_id']) ? (int)$d['stage_id'] : null;
          $dept_id  = (int)($d['department_id'] ?? 0);
          $sort     = (int)($d['sort_order'] ?? 0);
          $assigned_employee_ids = self::unwrap_emp_ids($d['assigned_employee_ids'] ?? []);
          if (empty($assigned_employee_ids) && !empty($d['assigned_employee_id'])) {
              $assigned_employee_ids = [(string)((int)$d['assigned_employee_id'])];
          }
         $assigned_employee_ids = array_values(array_unique(array_filter(array_map(function($v){ return (string)((int)$v); }, (array)$assigned_employee_ids), function($v){ return ((int)$v) > 0; })));
         $assigned_employee_id = !empty($assigned_employee_ids) ? (int)$assigned_employee_ids[0] : null;
         $linked_order_id = isset($d['linked_order_id']) ? (int)$d['linked_order_id'] : null;
         $deadline = isset($d['deadline']) ? trim((string)$d['deadline']) : null;
         if ($deadline === '') $deadline = null;
         if ($linked_order_id !== null && $linked_order_id <= 0) $linked_order_id = null;
         $effective_linked_order_id = $linked_order_id !== null
             ? $linked_order_id
             : (!empty($task['linked_order_id']) ? (int)$task['linked_order_id'] : null);
          if ($dept_id > 0 && self::is_printing_department($dept_id) && !$effective_linked_order_id) {
              return self::err('Printing department requires linking this task to an order', 422);
          }
          $before = self::ops_task_current_position($id);

          // Keep a single current position per task so it cannot appear in multiple departments.
          $wpdb->delete(self::tbl('ops_task_positions'), ['task_id' => $id]);
          $wpdb->insert(self::tbl('ops_task_positions'), [
              'task_id'       => $id,
            'department_id' => $dept_id > 0 ? $dept_id : null,
             'stage_id'      => $stage_id,
             'sort_order'    => $sort,
         ]);

         $update = [];
         if (isset($d['assigned_employee_id']) || isset($d['assigned_employee_ids'])) {
             $update['assigned_employee_id'] = $assigned_employee_id;
             $update['assigned_employee_ids'] = wp_json_encode($assigned_employee_ids);
          }
         if ($linked_order_id !== null) {
             $update['linked_order_id'] = $linked_order_id;
          }
          if (array_key_exists('deadline', (array)$d)) {
              $update['deadline'] = $deadline ? sanitize_text_field($deadline) : null;
          }
          if (!empty($update)) {
              $wpdb->update(self::tbl('ops_tasks'), $update, ['id' => $id]);
          }

          $after = self::ops_task_current_position($id);
          self::log_ops_task_event($id, 'task_moved', [
              'task_no' => $task['task_no'] ?? '',
              'from_department_id' => $before ? (int)($before['department_id'] ?? 0) : null,
              'from_department_name' => $before['department_name'] ?? null,
              'from_stage_id' => $before ? (int)($before['stage_id'] ?? 0) : null,
              'from_stage_name' => $before['stage_name'] ?? null,
              'to_department_id' => $after ? (int)($after['department_id'] ?? 0) : ($dept_id > 0 ? $dept_id : null),
              'to_department_name' => $after['department_name'] ?? null,
              'to_stage_id' => $after ? (int)($after['stage_id'] ?? 0) : ($stage_id ?: null),
              'to_stage_name' => $after['stage_name'] ?? null,
              'assigned_employee_id' => $assigned_employee_id,
              'assigned_employee_ids' => $assigned_employee_ids,
              'linked_order_id' => $effective_linked_order_id,
              'deadline' => $deadline,
              'sort_order' => $sort,
          ]);

          $target_department_id = $after ? (int)($after['department_id'] ?? 0) : ($dept_id > 0 ? $dept_id : 0);
          if (!empty($effective_linked_order_id)) {
              self::sync_ops_task_history_to_order((int)$id, (int)$effective_linked_order_id);
          }
          if ($target_department_id > 0 && self::is_printing_department($target_department_id) && !empty($effective_linked_order_id)) {
              self::log_order_event((int)$effective_linked_order_id, 'ops_task_entered_printing', [
                  'ops_task_id' => (int)$id,
                  'task_no' => $task['task_no'] ?? '',
                  'from_department_name' => $before['department_name'] ?? null,
                  'from_stage_name' => $before['stage_name'] ?? null,
                  'to_department_name' => $after['department_name'] ?? null,
                  'to_stage_name' => $after['stage_name'] ?? null,
                  'moved_at' => self::now(),
              ]);
          }

          return self::ok(['moved' => true]);
      }

      /** Mark a task as completed (sets completed_at = now) */
      public static function complete_ops_task(WP_REST_Request $req) {
          global $wpdb;
          $id = (int)$req->get_param('id');
          $d = $req->get_json_params();
          $task = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('ops_tasks')." WHERE id=%d", $id), ARRAY_A);
          if (!$task) return self::err('Task not found', 404);
          $incoming_linked_order_id = isset($d['linked_order_id']) ? (int)$d['linked_order_id'] : null;
          if ($incoming_linked_order_id !== null && $incoming_linked_order_id <= 0) $incoming_linked_order_id = null;
          $effective_linked_order_id = $incoming_linked_order_id !== null
              ? $incoming_linked_order_id
              : (!empty($task['linked_order_id']) ? (int)$task['linked_order_id'] : null);

          $was_completed = !empty($task['completed_at']) && $task['completed_at'] !== '0000-00-00 00:00:00';
          $completed_at = self::now();
          $before = self::ops_task_current_position($id);
          $task_update = ['completed_at' => $completed_at];
          if ($incoming_linked_order_id !== null) {
              $task_update['linked_order_id'] = $incoming_linked_order_id;
          }
          $wpdb->update(self::tbl('ops_tasks'), $task_update, ['id' => $id]);
          self::log_ops_task_event($id, 'task_completed', [
              'completed_at' => $completed_at,
              'department_id' => $before ? (int)($before['department_id'] ?? 0) : null,
              'department_name' => $before['department_name'] ?? null,
              'stage_id' => $before ? (int)($before['stage_id'] ?? 0) : null,
              'stage_name' => $before['stage_name'] ?? null,
              'linked_order_id' => $effective_linked_order_id,
          ]);
          if (!empty($effective_linked_order_id)) {
              self::sync_ops_task_history_to_order((int)$id, (int)$effective_linked_order_id);
          }
          if (!$was_completed) {
              $assignee_ids = self::ops_task_assignee_ids($task);
              $deadline_ts = !empty($task['deadline']) ? strtotime((string)$task['deadline']) : false;
              $done_ts = strtotime((string)$completed_at);
              $ops_points = 0;
              $ops_code = '';
              $ops_label = '';
              if ($deadline_ts && $done_ts) {
                  if ($done_ts < $deadline_ts) {
                      $ops_points = 10;
                      $ops_code = 'ops_before_deadline';
                      $ops_label = 'Operations Task Before Deadline';
                  } else if ($done_ts === $deadline_ts) {
                      $ops_points = 5;
                      $ops_code = 'ops_at_deadline';
                      $ops_label = 'Operations Task At Deadline';
                  } else {
                      $ops_points = -5;
                      $ops_code = 'ops_after_deadline';
                      $ops_label = 'Operations Task After Deadline';
                  }
              }
              foreach ($assignee_ids as $assignee_id) {
                  if ($ops_points === 0) continue;
                  self::add_employee_points((int)$assignee_id, $ops_points, $ops_code, $ops_label, [
                      'ops_task_id' => $id,
                      'order_id' => !empty($effective_linked_order_id) ? (int)$effective_linked_order_id : null,
                      'task_no' => $task['task_no'] ?? '',
                  ], $completed_at);
              }
          }
          return self::ok(['completed' => true]);
      }

      /** Reopen a completed task (clears completed_at) */
      public static function reopen_ops_task(WP_REST_Request $req) {
          global $wpdb;
          $id = (int)$req->get_param('id');
          $wpdb->update(self::tbl('ops_tasks'), ['completed_at' => null], ['id' => $id]);
          self::log_ops_task_event($id, 'task_reopened', []);
          return self::ok(['reopened' => true]);
      }

      /** Restore alias for completed task (same behavior as reopen) */
      public static function restore_ops_task(WP_REST_Request $req) {
          global $wpdb;
          $id = (int)$req->get_param('id');
          if (!$id) return self::err('ID required', 400);
          $task = $wpdb->get_row($wpdb->prepare("SELECT * FROM ".self::tbl('ops_tasks')." WHERE id=%d", $id), ARRAY_A);
          if (!$task) return self::err('Task not found', 404);
          $wpdb->update(self::tbl('ops_tasks'), ['completed_at' => null], ['id' => $id]);
          self::log_ops_task_event($id, 'task_restored', []);
          return self::ok(['restored' => true]);
      }

    private static function leave_bounds($start, $end) {
        $s = !empty($start) ? substr((string) $start, 0, 10) : '';
        $e = !empty($end) ? substr((string) $end, 0, 10) : '';
        if (!$s || !$e) return [null, null];
        if ($e < $s) {
            $tmp = $s;
            $s = $e;
            $e = $tmp;
        }
        return [$s . ' 00:00:00', $e . ' 23:59:59'];
    }

    private static function datetime_in_range($value, $from, $to) {
        if (empty($value) || empty($from) || empty($to)) return false;
        return ((string) $value >= (string) $from) && ((string) $value <= (string) $to);
    }

    private static function step_belongs_to_employee($step, $employee_id) {
        $employee_id = (int) $employee_id;
        if ($employee_id <= 0 || !is_array($step)) return false;
        if ((int) ($step['assigned_employee_id'] ?? 0) === $employee_id) return true;
        $ids = self::unwrap_emp_ids($step['assigned_employee_ids'] ?? []);
        foreach ((array) $ids as $id) {
            if ((int) $id === $employee_id) return true;
        }
        return false;
    }

    private static function ops_task_assignee_ids($task) {
        if (!is_array($task)) return [];
        $ids = self::unwrap_emp_ids($task['assigned_employee_ids'] ?? []);
        if (empty($ids) && !empty($task['assigned_employee_id'])) {
            $ids = [(string)((int)$task['assigned_employee_id'])];
        }
        $ids = array_values(array_unique(array_filter(array_map(function($v){
            return (int)$v;
        }, (array)$ids), function($v){ return $v > 0; })));
        return $ids;
    }

    private static function ops_task_belongs_to_employee($task, $employee_id) {
        $employee_id = (int)$employee_id;
        if ($employee_id <= 0 || !is_array($task)) return false;
        $ids = self::ops_task_assignee_ids($task);
        foreach ($ids as $eid) {
            if ((int)$eid === $employee_id) return true;
        }
        return false;
    }

    private static function employee_replacement_options($employee_id, $department_id = 0) {
        global $wpdb;
        $employee_id = (int) $employee_id;
        $department_id = (int) $department_id;
        $where = "is_active=1 AND id <> %d";
        $params = [$employee_id];
        if ($department_id > 0) {
            $where .= " AND department_id=%d";
            $params[] = $department_id;
        }
        $sql = "SELECT id, name, name_en, department_id FROM " . self::tbl('employees') . " WHERE $where ORDER BY name";
        return $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A) ?: [];
    }

    private static function affected_leave_groups($employee_id, $leave_start, $leave_end) {
        global $wpdb;
        $employee_id = (int) $employee_id;
        list($from, $to) = self::leave_bounds($leave_start, $leave_end);
        if ($employee_id <= 0 || !$from || !$to) return [];

        $employees_tbl = self::tbl('employees');
        $dept_tbl = self::tbl('departments');
        $steps_tbl = self::tbl('item_steps');
        $items_tbl = self::tbl('order_items');
        $orders_tbl = self::tbl('orders');
        $ops_tbl = self::tbl('ops_tasks');
        $ops_pos_tbl = self::tbl('ops_task_positions');

        $employee = $wpdb->get_row($wpdb->prepare("SELECT * FROM $employees_tbl WHERE id=%d LIMIT 1", $employee_id), ARRAY_A);
        $employee_dept = (int) ($employee['department_id'] ?? 0);
        $dept_names = [];
        foreach ((array) $wpdb->get_results("SELECT id, name, name_en FROM $dept_tbl", ARRAY_A) as $dept) {
            $dept_names[(int) $dept['id']] = $dept;
        }

        $groups = [];
        $ensure = function($scope_key, $label, $department_id = 0) use (&$groups, $employee_id) {
            if (!isset($groups[$scope_key])) {
                $groups[$scope_key] = [
                    'scope_key' => $scope_key,
                    'label' => $label,
                    'department_id' => (int) $department_id,
                    'affected_count' => 0,
                    'step_ids' => [],
                    'order_ids' => [],
                    'ops_task_ids' => [],
                    'replacement_options' => self::employee_replacement_options($employee_id, (int) $department_id),
                ];
            }
            return $groups[$scope_key];
        };

        $step_rows = $wpdb->get_results(
            "SELECT s.*, oi.order_id, oi.product_name, oi.product_name_en, o.delivery_date
             FROM $steps_tbl s
             LEFT JOIN $items_tbl oi ON oi.id = s.order_item_id
             LEFT JOIN $orders_tbl o ON o.id = oi.order_id
             WHERE s.status_slug NOT IN ('done','cancelled')",
            ARRAY_A
        ) ?: [];

        foreach ($step_rows as $step) {
            if (!self::step_belongs_to_employee($step, $employee_id)) continue;
            $refs = [
                $step['planned_start_at'] ?? null,
                $step['planned_due_at'] ?? null,
                $step['started_at'] ?? null,
                $step['actual_started_at'] ?? null,
                $step['ext_send_at'] ?? null,
                $step['ext_receive_expected'] ?? null,
            ];
            $in_range = false;
            foreach ($refs as $ref) {
                if (self::datetime_in_range($ref, $from, $to)) {
                    $in_range = true;
                    break;
                }
            }
            if (!$in_range && ($step['status_slug'] ?? '') !== 'in_progress') continue;

            $is_delivery = !empty($step['is_delivery']) || stripos((string) ($step['step_name'] ?? ''), 'توصيل') !== false || stripos((string) ($step['step_name_en'] ?? ''), 'delivery') !== false;
            $scope_key = $is_delivery ? 'delivery' : ('production_' . max(0, $employee_dept));
            $label = $is_delivery
                ? 'Delivery Orders'
                : ('Production Tasks' . ($employee_dept > 0 && !empty($dept_names[$employee_dept]['name']) ? ' - ' . ($dept_names[$employee_dept]['name']) : ''));
            $ensure($scope_key, $label, $is_delivery ? 0 : $employee_dept);
            $groups[$scope_key]['step_ids'][] = (int) $step['id'];
            $groups[$scope_key]['affected_count']++;
        }

        $delivery_rows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, order_number, delivery_date, delivery_planned_at, dispatch_due_at, status_slug
             FROM $orders_tbl
             WHERE is_done=0 AND delivery_employee_id=%d",
            $employee_id
        ), ARRAY_A) ?: [];

        foreach ($delivery_rows as $order) {
            $refs = [$order['delivery_date'] ?? null, $order['delivery_planned_at'] ?? null, $order['dispatch_due_at'] ?? null];
            $in_range = false;
            foreach ($refs as $ref) {
                if (self::datetime_in_range($ref, $from, $to)) {
                    $in_range = true;
                    break;
                }
            }
            if (!$in_range && ($order['status_slug'] ?? '') !== 'in_progress') continue;
            $ensure('delivery', 'Delivery Orders', 0);
            $groups['delivery']['order_ids'][] = (int) $order['id'];
            $groups['delivery']['affected_count']++;
        }

        if ($wpdb->get_var("SHOW TABLES LIKE '$ops_tbl'")) {
            $ops_rows = $wpdb->get_results(
                "SELECT * FROM $ops_tbl WHERE (completed_at IS NULL OR completed_at = '' OR completed_at = '0000-00-00 00:00:00')",
                ARRAY_A
            ) ?: [];
            foreach ($ops_rows as $task) {
                if (!self::ops_task_belongs_to_employee($task, $employee_id)) continue;
                $in_range = empty($task['deadline']) ? true : self::datetime_in_range($task['deadline'], $from, $to);
                if (!$in_range) continue;
                $positions = $wpdb->get_results($wpdb->prepare(
                    "SELECT department_id FROM $ops_pos_tbl WHERE task_id=%d",
                    (int) $task['id']
                ), ARRAY_A) ?: [['department_id' => $employee_dept]];
                foreach ($positions as $pos) {
                    $dept_id = (int) ($pos['department_id'] ?? 0);
                    $dept_label = !empty($dept_names[$dept_id]['name']) ? $dept_names[$dept_id]['name'] : 'Operations';
                    $scope_key = 'ops_' . $dept_id;
                    $ensure($scope_key, 'Operations Tasks - ' . $dept_label, $dept_id);
                    $groups[$scope_key]['ops_task_ids'][] = (int) $task['id'];
                    $groups[$scope_key]['affected_count']++;
                }
            }
        }

        foreach ($groups as &$group) {
            $group['step_ids'] = array_values(array_unique(array_map('intval', $group['step_ids'])));
            $group['order_ids'] = array_values(array_unique(array_map('intval', $group['order_ids'])));
            $group['ops_task_ids'] = array_values(array_unique(array_map('intval', $group['ops_task_ids'])));
            $group['affected_count'] = count($group['step_ids']) + count($group['order_ids']) + count($group['ops_task_ids']);
        }
        unset($group);

        if ($employee_dept > 0) {
            $prod_key = 'production_' . $employee_dept;
            if (!isset($groups[$prod_key])) {
                $groups[$prod_key] = [
                    'scope_key' => $prod_key,
                    'label' => 'Production Tasks' . (!empty($dept_names[$employee_dept]['name']) ? ' - ' . $dept_names[$employee_dept]['name'] : ''),
                    'department_id' => $employee_dept,
                    'affected_count' => 0,
                    'step_ids' => [],
                    'order_ids' => [],
                    'ops_task_ids' => [],
                    'replacement_options' => self::employee_replacement_options($employee_id, $employee_dept),
                ];
            }

            $ops_key = 'ops_' . $employee_dept;
            if (!isset($groups[$ops_key])) {
                $groups[$ops_key] = [
                    'scope_key' => $ops_key,
                    'label' => 'Operations Tasks' . (!empty($dept_names[$employee_dept]['name']) ? ' - ' . $dept_names[$employee_dept]['name'] : ''),
                    'department_id' => $employee_dept,
                    'affected_count' => 0,
                    'step_ids' => [],
                    'order_ids' => [],
                    'ops_task_ids' => [],
                    'replacement_options' => self::employee_replacement_options($employee_id, $employee_dept),
                ];
            }
        }

        if (!empty($delivery_rows) && !isset($groups['delivery'])) {
            $groups['delivery'] = [
                'scope_key' => 'delivery',
                'label' => 'Delivery Orders',
                'department_id' => 0,
                'affected_count' => 0,
                'step_ids' => [],
                'order_ids' => [],
                'ops_task_ids' => [],
                'replacement_options' => self::employee_replacement_options($employee_id, 0),
            ];
        }

        return array_values($groups);
    }

    public static function preview_employee_leave(WP_REST_Request $req) {
        $d = $req->get_json_params();
        $employee_id = (int) ($d['employee_id'] ?? 0);
        $leave_start = sanitize_text_field($d['leave_start'] ?? '');
        $leave_end = sanitize_text_field($d['leave_end'] ?? '');
        if ($employee_id <= 0 || !$leave_start || !$leave_end) {
            return self::err('employee_id, leave_start and leave_end are required');
        }
        return self::ok(self::affected_leave_groups($employee_id, $leave_start, $leave_end));
    }

    public static function list_employee_leaves(WP_REST_Request $req) {
        global $wpdb;
        $employee_id = (int) $req->get_param('employee_id');
        $tbl = self::tbl('employee_leaves');
        $rep = self::tbl('employee_leave_reassignments');
        $emp = self::tbl('employees');
        $where = $employee_id > 0 ? $wpdb->prepare("WHERE l.employee_id=%d", $employee_id) : '';
        $rows = $wpdb->get_results(
            "SELECT l.*, e.name AS employee_name, e.name_en AS employee_name_en
             FROM $tbl l
             LEFT JOIN $emp e ON e.id = l.employee_id
             $where
             ORDER BY l.leave_start DESC, l.id DESC",
            ARRAY_A
        ) ?: [];
        foreach ($rows as &$row) {
            $row['reassignments'] = $wpdb->get_results($wpdb->prepare(
                "SELECT r.*, e.name AS replacement_name, e.name_en AS replacement_name_en
                 FROM $rep r
                 LEFT JOIN $emp e ON e.id = r.replacement_employee_id
                 WHERE r.leave_id=%d
                 ORDER BY r.id ASC",
                (int) $row['id']
            ), ARRAY_A) ?: [];
        }
        unset($row);
        return self::ok($rows);
    }

    private static function apply_employee_leave_reassignments($leave_id) {
        global $wpdb;
        $leave_id = (int) $leave_id;
        if ($leave_id <= 0) return;
        $leave_tbl = self::tbl('employee_leaves');
        $rep_tbl = self::tbl('employee_leave_reassignments');
        $steps_tbl = self::tbl('item_steps');
        $orders_tbl = self::tbl('orders');
        $ops_tbl = self::tbl('ops_tasks');

        $leave = $wpdb->get_row($wpdb->prepare("SELECT * FROM $leave_tbl WHERE id=%d LIMIT 1", $leave_id), ARRAY_A);
        if (!$leave) return;

        $groups = [];
        foreach ((array) self::affected_leave_groups((int) $leave['employee_id'], $leave['leave_start'], $leave['leave_end']) as $group) {
            $groups[$group['scope_key']] = $group;
        }
        $reassignments = $wpdb->get_results($wpdb->prepare("SELECT * FROM $rep_tbl WHERE leave_id=%d", $leave_id), ARRAY_A) ?: [];
        foreach ($reassignments as $reassignment) {
            $scope_key = (string) ($reassignment['scope_key'] ?? '');
            $replacement_id = (int) ($reassignment['replacement_employee_id'] ?? 0);
            if (!$scope_key || $replacement_id <= 0 || empty($groups[$scope_key])) continue;
            $group = $groups[$scope_key];

            foreach ((array) ($group['step_ids'] ?? []) as $step_id) {
                $step = $wpdb->get_row($wpdb->prepare("SELECT assigned_employee_id, assigned_employee_ids FROM $steps_tbl WHERE id=%d LIMIT 1", (int) $step_id), ARRAY_A);
                if (!$step) continue;
                $ids = self::unwrap_emp_ids($step['assigned_employee_ids'] ?? []);
                $ids = array_map('intval', (array) $ids);
                $ids = array_values(array_filter(array_map(function($id) use ($leave, $replacement_id) {
                    $id = (int) $id;
                    return $id === (int) $leave['employee_id'] ? $replacement_id : $id;
                }, $ids)));
                if (!in_array($replacement_id, $ids, true)) $ids[] = $replacement_id;
                $wpdb->update($steps_tbl, [
                    'assigned_employee_id' => $replacement_id,
                    'assigned_employee_ids' => wp_json_encode(array_values(array_unique($ids))),
                ], ['id' => (int) $step_id]);
            }

            foreach ((array) ($group['order_ids'] ?? []) as $order_id) {
                $wpdb->update($orders_tbl, ['delivery_employee_id' => $replacement_id], ['id' => (int) $order_id]);
            }

            foreach ((array) ($group['ops_task_ids'] ?? []) as $task_id) {
                $task = $wpdb->get_row($wpdb->prepare("SELECT assigned_employee_id, assigned_employee_ids FROM $ops_tbl WHERE id=%d LIMIT 1", (int) $task_id), ARRAY_A);
                if (!$task) continue;
                $ids = self::unwrap_emp_ids($task['assigned_employee_ids'] ?? []);
                $ids = array_map('intval', (array) $ids);
                if (empty($ids) && !empty($task['assigned_employee_id'])) $ids[] = (int)$task['assigned_employee_id'];
                $ids = array_values(array_filter(array_map(function($id) use ($leave, $replacement_id) {
                    $id = (int)$id;
                    return $id === (int)$leave['employee_id'] ? $replacement_id : $id;
                }, $ids)));
                if (!in_array($replacement_id, $ids, true)) $ids[] = $replacement_id;
                $ids = array_values(array_unique($ids));
                $wpdb->update($ops_tbl, [
                    'assigned_employee_id' => !empty($ids) ? (int)$ids[0] : null,
                    'assigned_employee_ids' => wp_json_encode($ids),
                ], ['id' => (int) $task_id]);
            }
        }
    }

    public static function create_employee_leave(WP_REST_Request $req) {
        global $wpdb;
        $d = $req->get_json_params();
        $employee_id = (int) ($d['employee_id'] ?? 0);
        $leave_start = substr(sanitize_text_field($d['leave_start'] ?? ''), 0, 10);
        $leave_end = substr(sanitize_text_field($d['leave_end'] ?? ''), 0, 10);
        $reason = sanitize_textarea_field($d['reason'] ?? '');
        $reassignments = is_array($d['reassignments'] ?? null) ? $d['reassignments'] : [];
        if ($employee_id <= 0 || !$leave_start || !$leave_end) {
            return self::err('employee_id, leave_start and leave_end are required');
        }

        $wpdb->insert(self::tbl('employee_leaves'), [
            'employee_id' => $employee_id,
            'leave_start' => $leave_start,
            'leave_end' => $leave_end,
            'reason' => $reason,
            'is_active' => 1,
        ]);
        $leave_id = (int) $wpdb->insert_id;

        foreach ($reassignments as $row) {
            $replacement_id = (int) ($row['replacement_employee_id'] ?? 0);
            if ($replacement_id <= 0) continue;
            $wpdb->insert(self::tbl('employee_leave_reassignments'), [
                'leave_id' => $leave_id,
                'scope_key' => sanitize_text_field($row['scope_key'] ?? ''),
                'department_id' => !empty($row['department_id']) ? (int) $row['department_id'] : null,
                'replacement_employee_id' => $replacement_id,
            ]);
        }

        self::apply_employee_leave_reassignments($leave_id);
        return self::created(['id' => $leave_id]);
    }

    public static function delete_employee_leave(WP_REST_Request $req) {
        global $wpdb;
        $id = (int) $req->get_param('id');
        $wpdb->delete(self::tbl('employee_leave_reassignments'), ['leave_id' => $id]);
        $wpdb->delete(self::tbl('employee_leaves'), ['id' => $id]);
        return self::ok(['deleted' => true]);
    }

    /** Internal: fetch tasks with joined customer + contact names */
    private static function _fetch_ops_tasks($where = '1=1') {
        global $wpdb;
        $t   = self::tbl('ops_tasks');
        $c   = self::tbl('customers');
        $cc  = self::tbl('customer_contacts');
        $pos = self::tbl('ops_task_positions');
        $emp = self::tbl('employees');
        $u   = self::tbl('app_users');
        $emp_rows = $wpdb->get_results("SELECT id, name, name_en FROM $emp", ARRAY_A) ?: [];
        $emp_map = [];
        foreach ($emp_rows as $er) {
            $eid = (int)($er['id'] ?? 0);
            if ($eid <= 0) continue;
            $emp_map[$eid] = [
                'id' => $eid,
                'name' => (string)($er['name'] ?? ''),
                'name_en' => (string)($er['name_en'] ?? ''),
            ];
        }

          $tasks = $wpdb->get_results(
              "SELECT t.*,
                      c.name  AS customer_name,  c.company_name AS customer_company,
                      c.name_en AS customer_name_en, c.company_name_en AS customer_company_en,
                      c.phone AS customer_phone,
                      cc.name AS contact_person_name, cc.phone AS contact_person_phone,
                      e.name AS assigned_employee_name, e.name_en AS assigned_employee_name_en,
                      cu.name AS created_by_name, cu.username AS created_by_username
               FROM $t t
               LEFT JOIN $c  c  ON c.id  = t.customer_id
               LEFT JOIN $cc cc ON cc.id = t.contact_person_id
               LEFT JOIN $emp e ON e.id = t.assigned_employee_id
               LEFT JOIN $u cu ON cu.id = t.created_by
               WHERE $where
               ORDER BY t.id DESC",
              ARRAY_A
          );

        // Attach current position (department + stage) to each task
        foreach ($tasks as &$task) {
            $current_pos = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $pos WHERE task_id=%d ORDER BY id DESC LIMIT 1",
                $task['id']
            ), ARRAY_A);
            $task['positions'] = $current_pos ? [$current_pos] : [];
            $emp_ids = self::unwrap_emp_ids($task['assigned_employee_ids'] ?? []);
            if (empty($emp_ids) && !empty($task['assigned_employee_id'])) {
                $emp_ids = [(string)((int)$task['assigned_employee_id'])];
            }
            $emp_ids = array_values(array_unique(array_filter(array_map(function($v){
                return (string)((int)$v);
            }, (array)$emp_ids), function($v){ return ((int)$v) > 0; })));
            $task['assigned_employee_ids'] = $emp_ids;
            if (!empty($emp_ids)) $task['assigned_employee_id'] = (int)$emp_ids[0];
            $task['assigned_employees'] = [];
            foreach ($emp_ids as $eid_s) {
                $eid = (int)$eid_s;
                if (!empty($emp_map[$eid])) $task['assigned_employees'][] = $emp_map[$eid];
            }
        }

        return $tasks;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  OPERATIONS STAGES  (kanban columns per department)
    // ════════════════════════════════════════════════════════════════════════

    public static function list_ops_stages(WP_REST_Request $req) {
        global $wpdb;
        $dept_id = (int)$req->get_param('id');
        $tbl     = self::tbl('ops_stages');
        return self::ok($wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $tbl WHERE department_id=%d ORDER BY sort_order ASC, id ASC",
            $dept_id
        ), ARRAY_A));
    }

    public static function create_ops_stage(WP_REST_Request $req) {
        global $wpdb;
        $dept_id = (int)$req->get_param('id');
        $d       = $req->get_json_params();
        if (empty($d['name'])) return self::err('name is required');

        // Auto sort_order = max + 1
        $tbl      = self::tbl('ops_stages');
        $max_sort = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(MAX(sort_order),0) FROM $tbl WHERE department_id=%d", $dept_id
        ));
        $wpdb->insert($tbl, [
            'department_id' => $dept_id,
            'name'          => sanitize_text_field($d['name']),
            'sort_order'    => $max_sort + 1,
        ]);
        return self::created(['id' => $wpdb->insert_id]);
    }

    public static function update_ops_stage(WP_REST_Request $req) {
        global $wpdb;
        $id = (int)$req->get_param('id');
        $d  = $req->get_json_params();
        $data = [];
        if (isset($d['name']))       $data['name']       = sanitize_text_field($d['name']);
        if (isset($d['sort_order'])) $data['sort_order'] = (int)$d['sort_order'];
        if (empty($data)) return self::err('Nothing to update');
        $wpdb->update(self::tbl('ops_stages'), $data, ['id' => $id]);
        return self::ok(['updated' => true]);
    }

    /** Delete stage only if no tasks are currently placed in it */
    public static function delete_ops_stage(WP_REST_Request $req) {
        global $wpdb;
        $id  = (int)$req->get_param('id');
        $pos = self::tbl('ops_task_positions');

        $task_count = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $pos WHERE stage_id=%d", $id
        ));
        if ($task_count > 0) {
            return self::err("Cannot delete stage: $task_count task(s) are still in this stage.", 409);
        }

        $wpdb->delete(self::tbl('ops_stages'), ['id' => $id]);
        return self::ok(['deleted' => true]);
    }

    /** Bulk reorder stages. Body: [{id, sort_order}, …] */
    public static function reorder_ops_stages(WP_REST_Request $req) {
        global $wpdb;
        $items = $req->get_json_params();
        if (!is_array($items)) return self::err('Expected array');
        $tbl = self::tbl('ops_stages');
        foreach ($items as $item) {
            if (empty($item['id'])) continue;
            $wpdb->update($tbl, ['sort_order' => (int)($item['sort_order'] ?? 0)], ['id' => (int)$item['id']]);
        }
        return self::ok(['reordered' => true]);
    }
}
