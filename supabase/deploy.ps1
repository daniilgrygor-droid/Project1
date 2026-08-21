# Small Steps — Automated Edge Function Deployment
# Run this after setting SUPABASE_ACCESS_TOKEN environment variable

$ErrorActionPreference = "Stop"

Write-Host "Small Steps — Edge Functions Deployment" -ForegroundColor Green
Write-Host ""

# Check for access token
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "Error: SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
    Write-Host "Get your token from: https://supabase.com/dashboard/account/tokens"
    Write-Host 'Then run: $env:SUPABASE_ACCESS_TOKEN = "your-token"'
    exit 1
}

# Check for required secrets
$requiredSecrets = @("GEMINI_API_KEY", "RESEND_API_KEY")
foreach ($secret in $requiredSecrets) {
    if (-not [System.Environment]::GetEnvironmentVariable($secret)) {
        Write-Host "Warning: $secret not set in environment" -ForegroundColor Yellow
        Write-Host "Set it with: supabase secrets set $secret=your-value"
    }
}

Write-Host "1. Linking to Supabase project..." -ForegroundColor Cyan
supabase link --project-ref ouwqyhypzxgtsqgejicm

Write-Host "2. Deploying step-response (no-verify-jwt for client calls)..." -ForegroundColor Cyan
supabase functions deploy step-response --no-verify-jwt

Write-Host "3. Deploying daily-reminder..." -ForegroundColor Cyan
supabase functions deploy daily-reminder

Write-Host "4. Deploying weekly-summary..." -ForegroundColor Cyan
supabase functions deploy weekly-summary

Write-Host "5. Setting edge function secrets..." -ForegroundColor Cyan
$secrets = @{}

# Read from .env.local if it exists
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.+)$") {
            $secrets[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
}

# Set secrets that exist in environment
$envVars = @("GEMINI_API_KEY", "RESEND_API_KEY", "EMAIL_FROM", "APP_URL")
foreach ($var in $envVars) {
    $value = if ($secrets.ContainsKey($var)) { $secrets[$var] }
             elseif ([System.Environment]::GetEnvironmentVariable($var)) { [System.Environment]::GetEnvironmentVariable($var) }
             else { $null }
    if ($value) {
        supabase secrets set "$var=$value"
    }
}

# Generate and set WEEKLY_SUMMARY_SECRET if not exists
$weeklySecret = if ($secrets.ContainsKey("WEEKLY_SUMMARY_SECRET")) { $secrets["WEEKLY_SUMMARY_SECRET"] }
                elseif ([System.Environment]::GetEnvironmentVariable("WEEKLY_SUMMARY_SECRET")) { [System.Environment]::GetEnvironmentVariable("WEEKLY_SUMMARY_SECRET") }
                else { $null }
if (-not $weeklySecret) {
    $weeklySecret = -join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
    Write-Host "Generated WEEKLY_SUMMARY_SECRET: $weeklySecret" -ForegroundColor Yellow
    Write-Host "Save this secret! You'll need it for pg_cron setup."
}
supabase secrets set "WEEKLY_SUMMARY_SECRET=$weeklySecret"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run supabase/stripe-migration.sql in Supabase SQL Editor"
Write-Host "2. Set up pg_cron jobs (see supabase/DEPLOY.md)"
Write-Host "3. Set Stripe env vars in Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, APP_URL"
Write-Host "4. Create Stripe product and price at https://dashboard.stripe.com"
