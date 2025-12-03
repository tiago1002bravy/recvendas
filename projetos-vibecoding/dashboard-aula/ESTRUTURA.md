# 🏗️ Estrutura Enterprise - Dashboard Estratégico

## 📊 Visão Geral da Arquitetura

```
dashboard-aula/
│
├── 📁 .cursorrules          # ⚙️ Regras de arquitetura (LEI do projeto)
├── 📁 .env.local            # 🔒 Variáveis de ambiente locais
├── 📁 .env.example          # 📝 Template de variáveis
├── 📁 README.md             # 📖 Documentação principal
├── 📁 SETUP.md              # 🚀 Guia de setup completo
├── 📁 ESTRUTURA.md          # 📂 Este arquivo
│
├── 📦 package.json          # Dependências do projeto
├── 📦 yarn.lock             # Lock file do Yarn
│
├── ⚙️ tsconfig.json         # Configuração TypeScript
├── ⚙️ tailwind.config.ts    # Configuração Tailwind CSS
├── ⚙️ postcss.config.mjs    # Configuração PostCSS
├── ⚙️ next.config.mjs       # Configuração Next.js
│
└── 📁 src/
    │
    ├── 📁 app/                      # 🌐 Next.js App Router
    │   ├── globals.css              # 🎨 Estilos globais + Tailwind
    │   ├── layout.tsx               # 📄 Layout raiz da aplicação
    │   └── page.tsx                 # 🏠 Página inicial (HomePage)
    │
    ├── 📁 components/               # 🧩 Componentes React
    │   ├── index.ts                 # 📤 Barrel export principal
    │   │
    │   ├── 📁 ui/                   # 🎨 Componentes UI reutilizáveis
    │   │   └── (vazio - pronto para adicionar)
    │   │
    │   ├── 📁 layout/               # 📐 Componentes de layout
    │   │   └── (vazio - pronto para adicionar)
    │   │
    │   └── 📁 features/             # ⭐ Features específicas
    │       ├── index.ts             # 📤 Barrel export
    │       │
    │       └── 📁 dashboard/        # 📊 Feature: Dashboard
    │           ├── index.ts                           # 📤 Barrel export
    │           ├── DashboardFeaturesSection.tsx       # 🎯 Componente principal
    │           │
    │           └── (estrutura sugerida para expandir):
    │               ├── 📁 metrics/
    │               │   ├── RevenueMetricCard.tsx
    │               │   ├── UserGrowthChart.tsx
    │               │   └── index.ts
    │               │
    │               ├── 📁 charts/
    │               │   ├── LineChartComponent.tsx
    │               │   ├── BarChartComponent.tsx
    │               │   └── index.ts
    │               │
    │               └── 📁 tables/
    │                   ├── DataTableComponent.tsx
    │                   └── index.ts
    │
    ├── 📁 hooks/                    # 🪝 Custom React Hooks
    │   └── (estrutura sugerida):
    │       ├── 📁 dashboard/
    │       │   ├── useDashboardMetrics.ts
    │       │   ├── useDashboardFilters.ts
    │       │   └── index.ts
    │       │
    │       └── 📁 authentication/
    │           ├── useUserAuthentication.ts
    │           └── index.ts
    │
    ├── 📁 lib/                      # 📚 Bibliotecas e utilidades
    │   │
    │   ├── 📁 utils/                # 🛠️ Funções utilitárias
    │   │   ├── index.ts             # 📤 Barrel export
    │   │   ├── cn.ts                # 🎨 Class name utility
    │   │   │
    │   │   └── (estrutura sugerida):
    │   │       ├── 📁 formatting/
    │   │       │   ├── formatCurrencyAmount.ts
    │   │       │   ├── formatDateAndTime.ts
    │   │       │   └── index.ts
    │   │       │
    │   │       └── 📁 validation/
    │   │           ├── validateEmailAddress.ts
    │   │           └── index.ts
    │   │
    │   ├── 📁 constants/            # 📋 Constantes
    │   │   └── (estrutura sugerida):
    │   │       ├── API_ENDPOINTS.ts
    │   │       ├── THEME_CONFIGURATION.ts
    │   │       └── index.ts
    │   │
    │   └── 📁 api/                  # 🌐 Clientes API
    │       └── (estrutura sugerida):
    │           ├── baseApiClient.ts
    │           │
    │           └── 📁 dashboard/
    │               ├── dashboardApiClient.ts
    │               ├── metricsApiRequest.ts
    │               └── index.ts
    │
    ├── 📁 types/                    # 📝 Tipos TypeScript
    │   └── (estrutura sugerida):
    │       ├── 📁 dashboard/
    │       │   ├── DashboardMetricTypes.ts
    │       │   ├── ChartDataTypes.ts
    │       │   └── index.ts
    │       │
    │       └── 📁 api/
    │           ├── ApiResponseTypes.ts
    │           └── index.ts
    │
    └── 📁 stores/                   # 🗄️ State Management
        └── (estrutura sugerida):
            └── 📁 dashboard/
                ├── dashboardMetricsStore.ts
                └── index.ts
```

---

## 🎯 Componentes Atuais

### ✅ DashboardFeaturesSection
**Caminho**: `src/components/features/dashboard/DashboardFeaturesSection.tsx`

**Responsabilidades**:
- Exibir carrossel de dashboards
- Animações GSAP
- Auto-play e navegação
- Parallax effect

**Import**:
```typescript
import { DashboardFeaturesSection } from "@/components/features/dashboard";
```

**Uso**:
```tsx
<DashboardFeaturesSection />
```

---

## 📋 Nomenclatura em Uso

### Componentes (PascalCase)
✅ `DashboardFeaturesSection.tsx` - Correto
- [Domain] = Dashboard
- [Entity] = Features
- [Type] = Section

### Utilitários (camelCase)
✅ `cn.ts` - Class name utility
- Função: `cn(...inputs)`

### Exports (index.ts)
✅ Barrel exports em todos os níveis
- `src/components/index.ts`
- `src/components/features/index.ts`
- `src/components/features/dashboard/index.ts`

---

## 🚀 Como Adicionar Novos Componentes

### Exemplo 1: Adicionar Card de Métrica

```bash
# Criar pasta
mkdir -p src/components/features/dashboard/metrics

# Criar componente
src/components/features/dashboard/metrics/RevenueMetricCard.tsx
```

```typescript
// RevenueMetricCard.tsx
"use client";

interface RevenueMetricCardProps {
  value: number;
  currency: string;
  trend: "up" | "down";
}

export function RevenueMetricCard({ value, currency, trend }: RevenueMetricCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">Receita Total</h3>
      <p className="mt-2 text-3xl font-bold">
        {currency} {value.toLocaleString()}
      </p>
    </div>
  );
}
```

```typescript
// src/components/features/dashboard/metrics/index.ts
export { RevenueMetricCard } from "./RevenueMetricCard";
```

### Exemplo 2: Adicionar Hook Customizado

```bash
# Criar pasta
mkdir -p src/hooks/dashboard

# Criar hook
src/hooks/dashboard/useDashboardMetrics.ts
```

```typescript
// useDashboardMetrics.ts
"use client";

import { useState, useEffect } from "react";

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch metrics
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // API call
  };

  return { metrics, loading };
}
```

```typescript
// src/hooks/dashboard/index.ts
export { useDashboardMetrics } from "./useDashboardMetrics";
```

### Exemplo 3: Adicionar Constante

```bash
# Criar arquivo
src/lib/constants/API_ENDPOINTS.ts
```

```typescript
// API_ENDPOINTS.ts
export const API_ENDPOINTS = {
  DASHBOARD: {
    METRICS: "/api/dashboard/metrics",
    CHARTS: "/api/dashboard/charts",
  },
  USERS: {
    LIST: "/api/users",
    DETAIL: (id: string) => `/api/users/${id}`,
  },
} as const;
```

```typescript
// src/lib/constants/index.ts
export { API_ENDPOINTS } from "./API_ENDPOINTS";
```

---

## 🎨 Path Aliases Configurados

```typescript
// tsconfig.json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/types/*"],
    "@/stores/*": ["./src/stores/*"]
  }
}
```

**Uso**:
```typescript
// ✅ Correto
import { DashboardFeaturesSection } from "@/components/features/dashboard";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "@/hooks/dashboard";

// ❌ Evitar
import { DashboardFeaturesSection } from "../../components/features/dashboard";
```

---

## 📦 Dependências Instaladas

```json
{
  "dependencies": {
    "next": "^14.2.0",              // Framework React
    "react": "^18.3.0",             // React
    "react-dom": "^18.3.0",         // React DOM
    "gsap": "^3.12.5",              // Animações
    "lucide-react": "^0.344.0",     // Ícones
    "clsx": "^2.1.0",               // Utility classes
    "tailwind-merge": "^2.2.0",     // Merge Tailwind classes
    "tailwindcss-animate": "^1.0.7" // Animações Tailwind
  },
  "devDependencies": {
    "typescript": "^5.3.0",         // TypeScript
    "tailwindcss": "^3.4.0",        // Tailwind CSS
    "@types/*": "..."               // TypeScript types
  }
}
```

---

## 🔧 Configurações Importantes

### Next.js (next.config.mjs)
```javascript
{
  images: {
    remotePatterns: [
      { hostname: "ui.shadcn.com" },
      { hostname: "images.unsplash.com" }
    ]
  }
}
```

### Tailwind (tailwind.config.ts)
- Dark mode suportado
- Tema customizado (cores, radius, etc)
- Plugin de animações

### TypeScript (tsconfig.json)
- Strict mode habilitado
- Path aliases configurados
- Next.js plugin habilitado

---

## 📚 Documentos Disponíveis

1. **`.cursorrules`** - Regras de arquitetura (LEI do projeto)
2. **`README.md`** - Documentação geral
3. **`SETUP.md`** - Guia de setup detalhado
4. **`ESTRUTURA.md`** - Este arquivo (estrutura visual)

---

## ✅ Status Atual

- [x] Projeto configurado
- [x] Estrutura enterprise criada
- [x] Componente principal implementado
- [x] Build testado e funcionando
- [x] Pronto para adicionar indicadores
- [x] Pronto para deploy na Vercel

---

## 🎉 Pronto para o Próximo Passo!

Agora você pode me dizer:
**"Quais indicadores estratégicos você quer visualizar no dashboard?"**

Exemplos de indicadores:
- 📈 Receita mensal
- 👥 Usuários ativos
- 💰 Ticket médio
- 📊 Taxa de conversão
- ⭐ NPS Score
- 🎯 Metas vs Realizações
- 📉 Churn rate
- 💳 MRR (Monthly Recurring Revenue)

