# 🚀 Deploy & Operações

> **Guia para build, publicação estática e execução da Edge Function `monthly-reset` do Barber Analytics Pro.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Visão Geral

O projeto é uma SPA React (Vite) que consome Supabase diretamente. O build gera arquivos estáticos em `dist/`, prontos para hospedagem estática (Vercel, NGINX, PM2). A Edge Function `monthly-reset` roda no Supabase Functions para resetar a Lista da Vez.

---

## 🔑 Variáveis de Ambiente

| Contexto      | Variáveis                                                           |
| ------------- | ------------------------------------------------------------------- |
| Frontend      | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, etc. |
| Edge Function | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENVIRONMENT`          |

- 📝 Use `.env.example` como base.
- 🔒 Nunca exponha chaves `SERVICE_ROLE` no frontend.

---

## 🏗️ Build

```
npm install
npm run build   # gera dist/
```

---

## ☁️ Vercel (estático)

1. Configure variáveis no dashboard (`VITE_*`).
2. Defina comando de build `npm run build`.
3. Output: `dist`.
4. `vercel.json` já contém rewrite SPA → `index.html`.

---

## 🖥️ NGINX + VPS

1. **Build:**
   ```
   npm ci
   npm run build
   ```
2. **Configuração NGINX (exemplo):**

   ```
   server {
       listen 80;
       server_name sua-api.com www.sua-api.com;

       root /var/www/barber-analytics-pro/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```

3. **PM2 (opcional):** `pm2 serve dist 3000 --spa --name barber-analytics-pro`

---

## 🛰️ Edge Function `monthly-reset`

1. Configure Supabase CLI (`supabase login`).
2. Defina variáveis no ambiente da função (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Deploy:
   ```
   supabase functions deploy monthly-reset
   ```
4. Execução manual/cron: chame a URL da função enviando cabeçalhos `Authorization` ou `apikey` com a chave de serviço.

---

## 🔁 Automação & CI

- ⏳ Agende cron jobs (Supabase scheduler ou serviço externo) para o endpoint da Edge Function.
- ⚙️ CI sugerido (não configurado): lint (`npm run lint`), tests (`npm run test:run`), build (`npm run build`).

---

## 📌 Observações

- 📄 Garanta que `.env` não seja commitado (use `.gitignore`).
- 📦 Para múltiplos ambientes (staging/prod), configure variáveis separadamente.
- 🧾 Registre execuções do reset mensal via logs da Edge Function.
