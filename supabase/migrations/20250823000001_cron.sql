-- Enable pg_cron for scheduled jobs
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Daily reminder: every minute, checks user preferences
-- Uses pg_net to call the edge function
select
  cron.schedule(
    'daily-reminder',
    '* * * * *',
    $$
    select
      net.http_post(
        url := 'https://ouwqyhypzxgtsqgejicm.supabase.co/functions/v1/daily-reminder',
        headers := jsonb_build_object(
          'Authorization', 'Bearer 253cd01b8a89c2d5aca725756939dc0a',
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $$
  )
where not exists (select 1 from cron.job where jobname = 'daily-reminder');

-- Weekly summary: Mondays 9am UTC
select
  cron.schedule(
    'weekly-summary',
    '0 9 * * 1',
    $$
    select
      net.http_post(
        url := 'https://ouwqyhypzxgtsqgejicm.supabase.co/functions/v1/weekly-summary',
        headers := jsonb_build_object(
          'Authorization', 'Bearer 253cd01b8a89c2d5aca725756939dc0a',
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $$
  )
where not exists (select 1 from cron.job where jobname = 'weekly-summary');
