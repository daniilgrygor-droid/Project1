# Small Steps — Quick Setup (after you have all API keys)
# Запусти этот скрипт после того как получишь все ключи из LAUNCH.md

$ErrorActionPreference = "Stop"

Write-Host "Small Steps — Quick Setup" -ForegroundColor Cyan
Write-Host ""

# Check if keys are provided
if (-not $env:STRIPE_SECRET_KEY) {
    $env:STRIPE_SECRET_KEY = Read-Host "STRIPE_SECRET_KEY"
}
if (-not $env:STRIPE_PRICE_ID) {
    $env:STRIPE_PRICE_ID = Read-Host "STRIPE_PRICE_ID"
}
if (-not $env:STRIPE_WEBHOOK_SECRET) {
    $env:STRIPE_WEBHOOK_SECRET = Read-Host "STRIPE_WEBHOOK_SECRET"
}
if (-not $env:GEMINI_API_KEY) {
    $env:GEMINI_API_KEY = Read-Host "GEMINI_API_KEY"
}
if (-not $env:RESEND_API_KEY) {
    $env:RESEND_API_KEY = Read-Host "RESEND_API_KEY"
}
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN = Read-Host "SUPABASE_ACCESS_TOKEN"
}

Write-Host ""
Write-Host "Setting Vercel env vars..." -ForegroundColor Cyan

# Set Vercel env vars
$envVars = @{
    "STRIPE_SECRET_KEY" = $env:STRIPE_SECRET_KEY
    "STRIPE_WEBHOOK_SECRET" = $env:STRIPE_WEBHOOK_SECRET
    "STRIPE_PRICE_ID" = $env:STRIPE_PRICE_ID
    "APP_URL" = "https://small-steps-seven.vercel.app"
    "VITE_SENTRY_DSN" = $env:VITE_SENTRY_DSN
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if ($value) {
        Write-Host "  $key" -NoNewline
        try {
            $value | vercel env add $key production 2>&1 | Out-Null
            Write-Host " ✓" -ForegroundColor Green
        } catch {
            Write-Host " ✗ (set manually)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Deploying Supabase edge functions..." -ForegroundColor Cyan

# Deploy edge functions
$env:SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN
supabase link --project-ref ouwqyhypzxgtsqgejicm
supabase functions deploy step-response --no-verify-jwt
supabase functions deploy daily-reminder
supabase functions deploy weekly-summary

# Set Supabase secrets
supabase secrets set "GEMINI_API_KEY=$env:GEMINI_API_KEY"
supabase secrets set "RESEND_API_KEY=$env:RESEND_API_KEY"
supabase secrets set "APP_URL=https://small-steps-seven.vercel.app"
supabase secrets set "EMAIL_FROM=Small Steps <onboarding@resend.dev>"

Write-Host ""
Write-Host "Done! Run: vercel deploy --prod --yes" -ForegroundColor Green
