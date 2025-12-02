# Recuperação de Vendas

Automação de recuperação de vendas com integração Supabase e ClickUp.

## 🚀 Deploy no Coolify

### Configuração no Coolify

1. **Branch**: `main`
2. **Base Directory**: `/` ou deixar **VAZIO** (raiz do repositório)
   - ⚠️ **IMPORTANTE**: Se o Dockerfile não for encontrado, verifique se o Base Directory está como `/` ou vazio
3. **Port**: `3010` (porta padrão da aplicação)
4. **Is it a static site?**: ❌ **NÃO** (é uma API NestJS)
5. **Build Pack**: 
   - ✅ **Nixpacks** (recomendado - usa `nixpacks.toml`)
   - Ou **Dockerfile** (usa o Dockerfile fornecido)
   - ⚠️ Se usar Dockerfile e der erro "no such file or directory", tente usar **Nixpacks** primeiro

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

