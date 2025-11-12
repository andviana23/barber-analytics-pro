# 🚀 Deploy VPS - Barber Analytics Pro

Este documento descreve como configurar o servidor Express de API no VPS junto com o frontend Vite.

---

## 📋 Arquitetura

```
VPS: app.tratodebarbados.com
├── Frontend (Vite): Porta 5173
├── API (Express): Porta 3001
└── Nginx: Proxy reverso
    ├── / → localhost:5173 (Frontend)
    └── /api → localhost:3001 (API)
```

---

## 🔧 Pré-requisitos

- Node.js >= 20.19.0
- pnpm >= 8.0.0
- PM2 (process manager)
- Nginx

---

## 📦 1. Deploy do Código

### SSH no VPS

```bash
ssh seu-usuario@app.tratodebarbados.com
```

### Clonar ou atualizar código

```bash
cd /var/www/barber-analytics-pro
git pull origin main
pnpm install
```

---

## 🏗️ 2. Build do Frontend

```bash
pnpm build
```

Isso gera o `dist/` com os arquivos estáticos.

---

## 🌐 3. Configurar Nginx

Editar configuração:

```bash
sudo nano /etc/nginx/sites-available/tratodebarbados
```

Conteúdo:

```nginx
# /etc/nginx/sites-available/tratodebarbados

# ========================================
# FRONTEND (Vite) - Arquivos estáticos
# ========================================
server {
    listen 80;
    server_name app.tratodebarbados.com;

    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.tratodebarbados.com;

    # SSL Certificates (ajuste os caminhos)
    ssl_certificate /etc/letsencrypt/live/app.tratodebarbados.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tratodebarbados.com/privkey.pem;

    # Root do frontend (build do Vite)
    root /var/www/barber-analytics-pro/dist;
    index index.html;

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ========================================
    # API (Express) - Proxy reverso
    # ========================================
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para cron jobs longos
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # ========================================
    # FRONTEND - React SPA
    # ========================================
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/barber-analytics-access.log;
    error_log /var/log/nginx/barber-analytics-error.log;
}
```

### Ativar configuração

```bash
sudo ln -sf /etc/nginx/sites-available/tratodebarbados /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ 4. Configurar PM2

### Instalar PM2 globalmente

```bash
npm install -g pm2
```

### Criar ecosystem.config.js

```bash
cd /var/www/barber-analytics-pro
nano ecosystem.config.js
```

Conteúdo:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'barber-api',
      script: './server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
```

### Iniciar processos

```bash
# Criar pasta de logs
mkdir -p logs

# Iniciar API
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar com o sistema
pm2 startup
```

---

## ✅ 5. Validar Deploy

### Testar API localmente no VPS

```bash
curl http://localhost:3001/health
```

Resposta esperada:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T21:00:00.000Z",
  "uptime": 123,
  "service": "barber-analytics-api"
}
```

### Testar API publicamente

```bash
curl https://app.tratodebarbados.com/health
```

### Testar endpoint de cron

```bash
curl "https://app.tratodebarbados.com/api/cron/relatorio-diario?secret=6ee7c402382fe346a673b355706e1164c9c99a226d9ae04b11e1c044fe77139a"
```

---

## 📊 6. Monitoramento

### Ver logs do PM2

```bash
# Logs em tempo real
pm2 logs barber-api

# Últimas 100 linhas
pm2 logs barber-api --lines 100

# Apenas erros
pm2 logs barber-api --err
```

### Status dos processos

```bash
pm2 status
pm2 monit
```

### Restart/Reload

```bash
# Restart (downtime)
pm2 restart barber-api

# Reload (zero-downtime)
pm2 reload barber-api

# Stop
pm2 stop barber-api

# Delete
pm2 delete barber-api
```

---

## 🔄 7. Atualizar Código

### Script de deploy

Criar `deploy.sh`:

```bash
#!/bin/bash
# deploy.sh - Deploy automático

set -e

echo "🚀 Iniciando deploy..."

# 1. Git pull
echo "📥 Baixando código..."
git pull origin main

# 2. Instalar dependências
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile

# 3. Build frontend
echo "🏗️ Buildando frontend..."
pnpm build

# 4. Reload API
echo "🔄 Recarregando API..."
pm2 reload barber-api

echo "✅ Deploy concluído!"
```

Tornar executável:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🐛 8. Troubleshooting

### API não responde

```bash
# Verificar se está rodando
pm2 status

# Reiniciar
pm2 restart barber-api

# Ver logs
pm2 logs barber-api --err
```

### Nginx retornando 502

```bash
# API deve estar rodando na porta 3001
netstat -tlnp | grep 3001

# Verificar logs do Nginx
tail -f /var/log/nginx/barber-analytics-error.log
```

### CRON_SECRET inválido

```bash
# Verificar variáveis de ambiente
pm2 env 0

# Atualizar .env e recarregar
pm2 reload barber-api
```

### Portas em uso

```bash
# Ver quem está usando a porta
lsof -i :3001

# Matar processo
kill -9 <PID>
```

---

## 🔐 9. Segurança

### Variáveis de ambiente

Garantir que o `.env` está no VPS:

```bash
cd /var/www/barber-analytics-pro
cat .env | grep CRON_SECRET
```

### Firewall

```bash
# Permitir apenas Nginx e SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### SSL/HTTPS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d app.tratodebarbados.com

# Auto-renovação
sudo certbot renew --dry-run
```

---

## 📊 10. Comandos Úteis

```bash
# Listar processos PM2
pm2 list

# Monitorar em tempo real
pm2 monit

# Status detalhado
pm2 show barber-api

# Deletar logs antigos
pm2 flush

# Resetar PM2
pm2 kill
pm2 resurrect
```

---

## 📚 Referências

- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

---

**Última atualização:** 10 de novembro de 2025
**Autor:** Andrey Viana
