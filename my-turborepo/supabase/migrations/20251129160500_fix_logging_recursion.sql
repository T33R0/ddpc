-- Fix infinite recursion in logging triggers by ignoring activity_log table

CREATE OR REPLACE FUNCTION public.tg_log_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Prevent recursion: do not log inserts to the activity_log table itself
  if tg_table_name = 'activity_log' then
    return new;
  end if;
  
  perform public.log_activity(tg_table_name, new.id, to_jsonb(new));
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.tg_log_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Prevent recursion: do not log updates to the activity_log table itself
  if tg_table_name = 'activity_log' then
    return new;
  end if;

  perform public.log_activity(tg_table_name, new.id, jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return new;
end $function$;
