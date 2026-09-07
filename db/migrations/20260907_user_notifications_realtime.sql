-- ==============================================================================
-- DELCHAT 500k CCU INBOX REALTIME NOTIFICATIONS: USER NOTIFICATIONS REPLICATION
-- Migration: 20260907_user_notifications_realtime.sql
-- Target: Supabase PostgreSQL
-- Architecture: Logical Replication CDC on public.user_notifications for
--               targeted user-scoped inbox realtime notifications.
-- ==============================================================================

alter table public.user_notifications replica identity full;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.user_notifications';
    end if;
  end if;
end $$;
