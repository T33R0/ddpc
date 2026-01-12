-- Run this query in your Supabase SQL Editor to view table stats

SELECT
    T.table_name,
    pg_size_pretty(pg_total_relation_size('"' || T.table_schema || '"."' || T.table_name || '"')) as total_size,
    pg_size_pretty(pg_relation_size('"' || T.table_schema || '"."' || T.table_name || '"')) as data_size,
    (
        SELECT
            reltuples::bigint
        FROM
            pg_class C
            LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
        WHERE
            N.nspname = T.table_schema
            AND C.relname = T.table_name
    ) as estimated_rows,
    array_to_string(
        array_agg(
            C.column_name || ' (' || C.data_type || ')'
        ),
        ', '
    ) as columns
FROM
    information_schema.tables T
    JOIN information_schema.columns C ON T.table_name = C.table_name
    AND T.table_schema = C.table_schema
WHERE
    T.table_schema = 'public'
GROUP BY
    T.table_name,
    T.table_schema
ORDER BY
    pg_total_relation_size('"' || T.table_schema || '"."' || T.table_name || '"') DESC;
