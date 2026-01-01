# Recuperação de Vendas

Automação de recuperação de vendas com integração Supabase e ClickUp.

## 🚀 Deploy na Vercel

### Configuração na Vercel

1. **Framework Preset**: Outro (não é Next.js)
2. **Root Directory**: `/` (raiz do repositório)
3. **Build Command**: `yarn build`
4. **Output Directory**: Deixe vazio (não é um site estático)
5. **Install Command**: `yarn install`

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na Vercel:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# ClickUp (opcional - se não configurar, a integração será desabilitada)
CLICKUP_API_TOKEN=seu_token_clickup

# Node Environment
NODE_ENV=production
```

### Endpoints na Vercel

- **Webhook com projeto**: `POST https://seu-projeto.vercel.app/webhook/:projeto`
- **Webhook sem projeto**: `POST https://seu-projeto.vercel.app/webhook`

### Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy em produção
vercel --prod
```

## 🚀 Deploy no Coolify

### Configuração no Coolify

1. **Branch**: `main`
2. **Base Directory**: `/` (raiz do repositório)
3. **Port**: `3010` (porta padrão da aplicação)
4. **Is it a static site?**: ❌ **NÃO** (é uma API NestJS)
5. **Build Pack**: 
   - ✅ **Nixpacks** (recomendado - usa `nixpacks.toml`)
   - Ou **Dockerfile** (usa o Dockerfile fornecido)

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Coolify:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# ClickUp (opcional - se não configurar, a integração será desabilitada)
CLICKUP_TOKEN=seu_token_clickup
# ou
CLICKUP_API_TOKEN=seu_token_clickup

# Porta (opcional - padrão: 3010)
PORT=3010
```

### Endpoints

- **Webhook**: `POST /webhook/:projeto`
- **Webhook (sem projeto)**: `POST /webhook`
- **Health Check**: A aplicação responde na porta configurada

## 📦 Desenvolvimento Local

```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn dev

# Build
yarn build

# Rodar em produção
yarn start:prod
```

## 🔧 Tecnologias

- NestJS
- Supabase
- ClickUp API
- TypeScript

