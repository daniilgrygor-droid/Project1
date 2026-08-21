# Small Steps — Edge Functions Deployment Guide

## Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Get your Supabase Access Token from https://supabase.com/dashboard/account/tokens
3. Set it: `$env:SUPABASE_ACCESS_TOKEN = "your-token-here"`

## One-time Setup

### 1. Link your project
```powershell
supabase link --project-ref ouwqyhypzxgtsqgejicm
```

### 2. Run Stripe migration
Go to Supabase SQL Editor and run `supabase/stripe-migration.sql`

### 3. Set edge function secrets
```powershell
supabase secrets set GEMINI_API_KEY=your-gemini-key
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set EMAIL_FROM="Small Steps <hello@yourdomain.com>"
supabase secrets set APP_URL=https://small-steps-seven.vercel.app
supabase secrets set WEEKLY_SUMMARY_SECRET=$(openssl rand -hex 32)
```

### 4. Deploy edge functions
```powershell
supabase functions deploy step-response --no-verify-jwt
supabase functions deploy daily-reminder
supabase functions deploy weekly-summary
```

### 5. Set up pg_cron jobs
Run in Supabase SQL Editor:

```sql
-- Daily reminders: runs every minute, checks user preferences
select cron.schedule(
  'daily-reminder',
  '* * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.weekly_summary_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Weekly summary: runs every Monday at 9am UTC
select cron.schedule(
  'weekly-summary',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/weekly-summary',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.weekly_summary_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Plan expiry check: runs daily at midnight UTC
select cron.schedule(
  'plan-expiry-check',
  '0 0 * * *',
  $$
  update public.profiles
  set plan = 'free',
      plan_updated_at = now(),
      updated_at = now()
  where plan = 'private'
    and period_end < now();
  $$
);
```

### 6. Set app settings for pg_cron
```sql
-- Run this FIRST to set the secrets that pg_cron uses
alter database set app.settings.supabase_url = 'https://ouwqyhypzxgtsqgejicm.supabase.co';
alter database set app.settings.weekly_summary_secret = 'your-weekly-summary-secret';
```

## Stripe Environment Variables (Vercel)

Set these in Vercel dashboard or CLI:
```powershell
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_PRICE_ID production
vercel env add APP_URL production
```

## Testing

### Test step-response
```bash
curl -X POST https://ouwqyhypzxgtsqgejicm.supabase.co/functions/v1/step-response \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note": "I drank water today"}'
```

### Test daily-reminder
```bash
curl -X POST https://ouwqyhypzxgtsqgejicm.supabase.co/functions/v1/daily-reminder \
  -H "Authorization: Bearer YOUR_WEEKLY_SUMMARY_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

- **401 Unauthorized**: Check that secrets are set correctly
- **500 Internal Error**: Check edge function logs in Supabase dashboard
- **Emails not sending**: Verify Resend API key and domain verification
