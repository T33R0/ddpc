-- 1. List Triggers on issue_reports and maintenance_log
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition,
    action_timing as timing
FROM information_schema.triggers
WHERE event_object_table IN ('issue_reports', 'maintenance_log', 'user_vehicle', 'service_intervals');

-- 2. Check Active Locks (waiting for lock)
SELECT 
    a.pid, 
    usename, 
    pg_blocking_pids(a.pid) as blocked_by, 
    query as blocked_query,
    mode
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.granted = false;

-- 3. Check Long Running Queries
SELECT pid, now() - query_start as duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - query_start > interval '5 seconds';
