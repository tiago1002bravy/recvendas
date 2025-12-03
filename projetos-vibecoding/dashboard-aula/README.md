# Dashboard Estratégico 📊

Dashboard profissional para sessão estratégica com visualização de indicadores e métricas.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **GSAP** - Animações profissionais
- **shadcn/ui** - Componentes UI reutilizáveis

## 📁 Estrutura do Projeto

Este projeto segue a arquitetura enterprise definida em `.cursorrules`:

```
src/
├── app/                    # Rotas Next.js (App Router)
├── components/
│   ├── ui/                # Componentes UI reutilizáveis
│   ├── layout/            # Componentes de layout
│   └── features/          # Componentes de features específicas
│       └── dashboard/     # Features do dashboard
├── hooks/                 # Custom hooks
├── lib/
│   ├── utils/            # Funções utilitárias
│   ├── constants/        # Constantes
│   └── api/              # Clientes API
├── types/                # Definições TypeScript
└── stores/               # State management
```

## 🛠️ Setup

### 1. Instalar dependências

```bash
yarn install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e configure suas variáveis:

```bash
cp .env.example .env.local
```

### 3. Rodar o projeto

```bash
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponíveis

```bash
yarn dev      # Inicia o servidor de desenvolvimento
yarn build    # Cria build de produção
yarn start    # Inicia servidor de produção
yarn lint     # Executa linter
```

## 🎨 Regras de Nomenclatura

### Componentes React
- **PascalCase** + Descritivo
- Padrão: `[Domain][Entity][Action/Type].tsx`
- Exemplo: `DashboardFeaturesSection.tsx`

### Hooks Customizados
- **camelCase** + prefixo `use`
- Padrão: `use[Domain][Entity][Action].ts`
- Exemplo: `useDashboardMetrics.ts`

### Utilitários
- **camelCase** + Função Específica
- Padrão: `[action][Entity/Purpose].ts`
- Exemplo: `formatCurrencyAmount.ts`

### Constants
- **UPPER_SNAKE_CASE**
- Padrão: `[PURPOSE]_[CATEGORY].ts`
- Exemplo: `API_ENDPOINTS.ts`

## 🚀 Deploy na Vercel

### 1. Conectar Repositório
Acesse [vercel.com](https://vercel.com) e conecte seu repositório

### 2. Configurar Variáveis de Ambiente
No painel da Vercel: Settings → Environment Variables

Adicione todas as variáveis do `.env.local`

### 3. Deploy
```bash
# Instalar Vercel CLI
yarn global add vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

## 📋 Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas na Vercel
- [ ] Build local executado com sucesso (`yarn build`)
- [ ] Variáveis públicas com prefixo `NEXT_PUBLIC_`
- [ ] `.env.local` no `.gitignore`
- [ ] Domínio personalizado configurado (se aplicável)

## 🔒 Variáveis de Ambiente

### Variáveis Públicas (Client-side)
- Prefixo obrigatório: `NEXT_PUBLIC_*`
- Acessíveis no browser
- Exemplo: `NEXT_PUBLIC_API_URL`

### Variáveis Privadas (Server-side only)
- Sem prefixo `NEXT_PUBLIC_`
- Apenas acessíveis no servidor
- Exemplo: `DATABASE_URL`, `API_SECRET_KEY`

## 📚 Documentação

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [GSAP](https://greensock.com/docs/)
- [TypeScript](https://www.typescriptlang.org/docs/)

## 🎯 Features

- ✅ Carrossel de dashboards com animações GSAP
- ✅ Design responsivo e moderno
- ✅ Arquitetura enterprise escalável
- ✅ TypeScript para type safety
- ✅ Otimização de imagens com Next.js

## 📝 Licença

Este projeto está sob a licença MIT.

