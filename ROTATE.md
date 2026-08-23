# Ротация ключей — сделай после запуска (15 минут)

Эти ключи светились в чате и должны быть заменены.

## 1. Stripe Secret Key (2 мин)
1. https://dashboard.stripe.com/apikeys
2. Напротив Secret key → **Roll key** → подтвердить
3. Новый `sk_live_…` обнови в Vercel: Settings → Environment Variables → `STRIPE_SECRET_KEY` → Save
4. **Redeploy** (Deployments → последний → ⋯ → Redeploy)

## 2. Resend API Key (2 мин)
1. https://resend.com/api-keys → старый ключ **Delete**
2. **Create API Key** → новый `re_…`
3. Supabase: https://supabase.com/dashboard/project/ouwqyhypzxgtsqgejicm/functions → Secrets → обнови `RESEND_API_KEY`

## 3. Supabase Access Token (2 мин)
1. https://supabase.com/dashboard/account/tokens
2. Старый токен → **Revoke**
3. **Generate new token** → используй для CLI (`$env:SUPABASE_ACCESS_TOKEN`)

## 4. Gemini API Key (2 мин)
1. https://aistudio.google.com/apikey → старый **Delete**
2. **Create API key** → новый
3. Supabase Secrets → обнови `GEMINI_API_KEY`

## 5. Vercel Token для GitHub Actions (3 мин)
1. https://vercel.com/account/tokens → старый **Remove**
2. **Create** → новый `vercel_…`
3. https://github.com/daniilgrygor-droid/Project1/settings/secrets/actions → обнови `VERCEL_TOKEN`

## Проверка после ротации
- [ ] `/pricing` → Go Private открывает Stripe Checkout
- [ ] Запись в check-in приходит AI-ответ (Gemini)
- [ ] `git push` запускает GitHub Actions зелёным

## 6. pg_cron — масштабирование (когда будет >1k юзеров)
Сейчас `daily-reminder` вызывается каждую минуту — edge function сама
фильтрует пользователей. Это ок до ~10k. Дальше: перенести фильтрацию в SQL
(миграция `supabase/migrations/20250823000002_cron_optimized.sql` уже делает
предфильтрацию — вызов происходит только если есть кому напоминать).
