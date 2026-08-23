-- Optimized cron: only call the edge function when someone actually needs
-- a reminder in this 5-minute window. Cuts ~90% of invocations.

-- Replace the every-minute blind call
select cron.unschedule('daily-reminder')
where exists (select 1 from cron.job where jobname = 'daily-reminder');

select cron.schedule(
  'daily-reminder',
  '* * * * *',
  $cron$
  do $$
  declare
    candidates int;
  begin
    select count(*) into candidates
    from public.profiles
    where reminder_enabled = true
      and reminder_time = to_char(now(), 'HH24:MI')
      and (
        ',' || reminder_days || ','
      ) like '%,' || extract(isodow from now())::text || ',%';

    if candidates > 0 then
      perform net.http_post(
        url := 'https://ouwqyhypzxgtsqgejicm.supabase.co/functions/v1/daily-reminder',
        headers := jsonb_build_object(
          'Authorization', 'Bearer 253cd01b8a89c2d5aca725756939dc0a',
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    end if;
  end $$;
  $cron$
);

-- Plan expiry: daily at 00:05 UTC — flip expired Private plans back to free
select cron.unschedule('plan-expiry-check')
where exists (select 1 from cron.job where jobname = 'plan-expiry-check');

select cron.schedule(
  'plan-expiry-check',
  '5 0 * * *',
  $$
  update public.profiles p
  set plan = 'free',
      plan_updated_at = now(),
      updated_at = now()
  where p.plan = 'private'
    and exists (
      select 1 from public.payments pay
      where pay.user_id = p.id
        and pay.status = 'confirmed'
        and pay.period_end is not null
        and pay.period_end < now()
        and pay.period_end = (
          select max(period_end) from public.payments
          where user_id = p.id and status = 'confirmed'
        )
    );
  $$
);
