# Sistema de Recuperação de Vendas

API NestJS para processar webhooks de plataformas de vendas e salvar dados no Supabase e ClickUp.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Yarn instalado
- Conta Supabase
- Conta ClickUp (opcional)

### Instalação

```bash
# Instalar dependências
yarn install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

### Executar

```bash
# Desenvolvimento
yarn dev

# Produção
yarn build
yarn start:prod
```

## 📚 Documentação

Consulte `DOCUMENTACAO_APIS.md` para documentação completa das APIs, endpoints, integrações e exemplos.

## 🔧 Variáveis de Ambiente

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLICKUP_API_TOKEN=pk_xxx
PORT=3010
```

## 📡 Endpoints

- `POST /webhook` - Recebe webhook sem projeto
- `POST /webhook/:projeto` - Recebe webhook com projeto específico

## 🚢 Deploy na Vercel

O projeto está configurado para deploy na Vercel. Basta fazer push para o repositório e conectar na Vercel.

## 📝 Licença

MIT
