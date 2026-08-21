# Small Steps — Launch Checklist

Пошаговая инструкция. Каждый шаг — одна страница в браузере.

---

## Шаг 1: Stripe (платежи)

### 1.1 Создай аккаунт
1. Открой https://dashboard.stripe.com/register
2. Зарегистрируйся (email + пароль)
3. Подтверди email

### 1.2 Создай продукт
1. Перейди в https://dashboard.stripe.com/products
2. Нажми **+ Add product**
3. Заполни:
   - **Name**: `Small Steps Private`
   - **Description**: `Your words, kept closer — a private journal with no tracking`
   - **Pricing**: нажми **Add price**
     - **Price**: `48`
     - **Billing period**: `Yearly`
4. Нажми **Save product**
5. Скопируй **Price ID** (начинается с `price_`)

### 1.3 Получи API ключ
1. Перейди в https://dashboard.stripe.com/apikeys
2. Нажми **Reveal live key token**
3. Скопируй **Secret key** (начинается с `sk_live_`)

### 1.4 Настрой вебхук
1. Перейди в https://dashboard.stripe.com/webhooks
2. Нажми **+ Add endpoint**
3. **Endpoint URL**: `https://small-steps-seven.vercel.app/api/webhook`
4. **Events to send**: выбери:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Нажми **Add events**, затем **Add endpoint**
6. Нажми на созданный вебхук
7. Скопируй **Signing secret** (начинается с `whsec_`)

### Запиши ключи:
```
STRIPE_SECRET_KEY = sk_live_...
STRIPE_PRICE_ID = price_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

---

## Шаг 2: Gemini API (AI ответы)

### 2.1 Получи ключ
1. Открой https://aistudio.google.com/apikey
2. Войди через Google аккаунт
3. Нажми **Create API key**
4. Скопируй ключ

### Запиши:
```
GEMINI_API_KEY = AIza...
```

---

## Шаг 3: Resend (email)

### 3.1 Создай аккаунт
1. Открой https://resend.com/signup
2. Зарегистрируйся
3. Подтверди email

### 3.2 Получи ключ
1. Перейди в https://resend.com/api-keys
2. Нажми **Create API Key**
3. Назови: `small-steps`
4. Скопируй ключ

### Запиши:
```
RESEND_API_KEY = re_...
```

---

## Шаг 4: Supabase Access Token

### 4.1 Получи токен
1. Открой https://supabase.com/dashboard/account/tokens
2. Нажми **Generate new token**
3. Назови: `deploy`
4. Скопируй токен

### Запиши:
```
SUPABASE_ACCESS_TOKEN = (новый токен)
```

### 4.2 Отзови старый токен
На той же странице найди старый токен и нажми **Revoke**

---

## Шаг 5: Sentry (ошибки) — опционально

### 5.1 Создай проект
1. Открой https://sentry.io/signup
2. Зарегистрируйся
3. Выбери **React** как платформу
4. Назови проект: `small-steps`
5. Скопируй **DSN** (начинается с `https://`)

### Запиши:
```
VITE_SENTRY_DSN = https://...@sentry.io/...
```

---

## Шаг 6: GitHub Secrets

---

## Шаг 7: Введи ключи сюда

После того как получишь все ключи, вернись ко мне и скажи:
"Ключи готовы: STRIPE_SECRET_KEY=..., STRIPE_PRICE_ID=..., ..."

Я автоматически настрою всё остальное.

---

## Шаг 8: Финальный деплой

После настройки всех ключей:
```bash
git add -A
git commit -m "chore: launch configuration"
git push
vercel deploy --prod --yes
```

---

## Контакты

- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
