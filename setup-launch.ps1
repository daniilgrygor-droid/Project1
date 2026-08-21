# Small Steps — Full Launch Setup Script
# Запусти этот скрипт пошагово. Каждый шаг объясняет что делать.

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Small Steps — Launch Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# STEP 1: Stripe
# ============================================
Write-Host "STEP 1: Stripe Setup" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Открой https://dashboard.stripe.com и выполни:"
Write-Host "  1. Developers → API keys → скопируй Secret key (sk_live_...)"
Write-Host "  2. Products → Add product:"
Write-Host "     - Name: 'Small Steps Private'"
Write-Host "     - Description: 'Your words, kept closer'"
Write-Host "     - Price: $48/year, recurring"
Write-Host "     - Скопируй Price ID (price_...)"
Write-Host "  3. Developers → Webhooks → Add endpoint:"
Write-Host "     - URL: https://small-steps-seven.vercel.app/api/webhook"
Write-Host "     - Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"
Write-Host "     - Скопируй Signing secret (whsec_...)"
Write-Host ""
Write-Host "После этого введи значения:" -ForegroundColor Green

$STRIPE_SECRET_KEY = Read-Host "STRIPE_SECRET_KEY (sk_live_...)"
$STRIPE_PRICE_ID = Read-Host "STRIPE_PRICE_ID (price_...)"
$STRIPE_WEBHOOK_SECRET = Read-Host "STRIPE_WEBHOOK_SECRET (whsec_...)"

# ============================================
# STEP 2: Sentry
# ============================================
Write-Host ""
Write-Host "STEP 2: Sentry Setup" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Открой https://sentry.io and:"
Write-Host "  1. Create project → React"
Write-Host "  2. Скопируй DSN (https://...@sentry.io/...)"
Write-Host ""
$SENTRY_DSN = Read-Host "VITE_SENTRY_DSN (https://... или Enter чтобы пропустить)"

# ============================================
# STEP 3: Vercel Environment Variables
# ============================================
Write-Host ""
Write-Host "STEP 3: Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Добавляю переменные в Vercel..." -ForegroundColor Cyan

$envVars = @(
    @{ key = "STRIPE_SECRET_KEY"; value = $STRIPE_SECRET_KEY; },
    @{ key = "STRIPE_WEBHOOK_SECRET"; value = $STRIPE_WEBHOOK_SECRET; },
    @{ key = "STRIPE_PRICE_ID"; value = $STRIPE_PRICE_ID; },
    @{ key = "APP_URL"; value = "https://small-steps-seven.vercel.app"; }
)

if ($SENTRY_DSN) {
    $envVars += @{ key = "VITE_SENTRY_DSN"; value = $SENTRY_DSN; }
}

foreach ($envVar in $envVars) {
    if ($envVar.value) {
        Write-Host "  Setting $($envVar.key)..." -NoNewline
        try {
            $envVar.value | & "C:\Users\dengr\AppData\Roaming\npm\vercel.ps1" env add $envVar.key production 2>&1 | Out-Null
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " FAILED (set manually in Vercel dashboard)" -ForegroundColor Yellow
        }
    }
}

# ============================================
# STEP 4: Supabase Secrets
# ============================================
Write-Host ""
Write-Host "STEP 4: Supabase Edge Function Secrets" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Нужен Supabase Access Token."
Write-Host "Получи его тут: https://supabase.com/dashboard/account/tokens"
Write-Host ""
$SUPABASE_TOKEN = Read-Host "SUPABASE_ACCESS_TOKEN (или Enter чтобы пропустить)"

if ($SUPABASE_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN = $SUPABASE_TOKEN
    Write-Host "Linking project..." -ForegroundColor Cyan
    supabase link --project-ref ouwqyhypzxgtsqgejicm 2>&1 | Out-Null

    Write-Host "Deploying edge functions..." -ForegroundColor Cyan
    supabase functions deploy step-response --no-verify-jwt 2>&1 | Out-Null
    supabase functions deploy daily-reminder 2>&1 | Out-Null
    supabase functions deploy weekly-summary 2>&1 | Out-Null

    Write-Host "Setting secrets..." -ForegroundColor Cyan
    if ($env:GEMINI_API_KEY) { supabase secrets set "GEMINI_API_KEY=$env:GEMINI_API_KEY" 2>&1 | Out-Null }
    if ($env:RESEND_API_KEY) { supabase secrets set "RESEND_API_KEY=$env:RESEND_API_KEY" 2>&1 | Out-Null }
    supabase secrets set "APP_URL=https://small-steps-seven.vercel.app" 2>&1 | Out-Null
    supabase secrets set "EMAIL_FROM=Small Steps <onboarding@resend.dev>" 2>&1 | Out-Null

    Write-Host "Edge functions deployed!" -ForegroundColor Green
} else {
    Write-Host "Пропущено. Выполни вручную:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_ACCESS_TOKEN = "your-token"'
    Write-Host "  supabase link --project-ref ouwqyhypzxgtsqgejicm"
    Write-Host "  supabase functions deploy step-response --no-verify-jwt"
    Write-Host "  supabase functions deploy daily-reminder"
    Write-Host "  supabase functions deploy weekly-summary"
}

# ============================================
# STEP 5: Database Migration
# ============================================
Write-Host ""
Write-Host "STEP 5: Database Migration" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Открой Supabase SQL Editor и выполни:"
Write-Host "  1. supabase/stripe-migration.sql"
Write-Host "  2. supabase/schema.sql (если ещё не запускал)"
Write-Host ""

# ============================================
# STEP 6: GitHub Repository Secrets
# ============================================
Write-Host ""
Write-Host "STEP 6: GitHub Repository Secrets" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Открой https://github.com/daniilgrygor-droid/Project1/settings/secrets/actions"
Write-Host "Добавь (получи Vercel Token тут: https://vercel.com/account/tokens):"
Write-Host "  VERCEL_TOKEN = (твой токен)"
Write-Host "  VERCEL_ORG_ID = team_z4YkrFg6uhIaQayYekE7T9Zy"
Write-Host "  VERCEL_PROJECT_ID = prj_ldz4jmfV79Dn7SBaLMAY3lZeKJdo"
Write-Host ""

# ============================================
# STEP 7: Security
# ============================================
Write-Host ""
Write-Host "STEP 7: Security" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Отзови старый Supabase токен:" -ForegroundColor Red
Write-Host "  https://supabase.com/dashboard/account/tokens"
Write-Host "  Найди старый токен и нажми Revoke"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "После всех шагов:" -ForegroundColor Yellow
Write-Host "  1. git add -A && git commit -m 'chore: launch config' && git push"
Write-Host "  2. vercel deploy --prod --yes"
Write-Host "  3. Проверь https://small-steps-seven.vercel.app"
