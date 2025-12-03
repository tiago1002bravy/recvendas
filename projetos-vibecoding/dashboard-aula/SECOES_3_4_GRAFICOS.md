# 📊 SEÇÕES 3 e 4 - Gráficos e Análise de UTMs

## 📦 Biblioteca Utilizada

**Recharts** v3.5.1 - Biblioteca de gráficos para React

```bash
yarn add recharts
```

---

## 🗂️ Estrutura de Arquivos Criados

### **1. Tipos TypeScript**
```
src/types/dashboard/
├── LeadsChartTypes.ts       # Tipos para dados de leads por dia
├── UTMAnalysisTypes.ts      # Tipos para análise de UTMs
└── index.ts                 # Barrel export atualizado
```

### **2. Hooks Customizados**
```
src/hooks/dashboard/
├── useDashboardLeadsPerDay.ts    # Hook para dados de leads por dia
├── useDashboardUTMAnalysis.ts    # Hook para dados de UTMs
└── index.ts                      # Barrel export atualizado
```

### **3. Componentes de Gráficos**
```
src/components/ui/charts/
├── BarChart.tsx              # Gráfico de barras verticais
├── PieChart.tsx              # Gráfico de pizza
├── UTMTable.tsx              # Tabela de UTMs
└── index.ts                  # Barrel export
```

### **4. Componentes de Dashboard**
```
src/components/features/dashboard/
├── DashboardLeadsPerDay.tsx       # Seção 3 completa
├── DashboardUTMAnalysis.tsx       # Seção 4 container
├── UTMAnalysisSection.tsx         # Componente reutilizável para cada UTM
└── index.ts                       # Barrel export atualizado
```

### **5. Página Principal**
```
src/app/page.tsx                   # Integração de todas as seções
```

---

## 📊 SEÇÃO 3 - Leads por Dia

### **Componente Principal**
`DashboardLeadsPerDay.tsx`

### **Características:**
- ✅ **Gráfico de Barras Verticais** usando Recharts
- ✅ **Eixo X**: Dias do mês (1-30/31)
- ✅ **Eixo Y**: Quantidade de leads
- ✅ **Cor das barras**: Azul primário (`#2563eb`)
- ✅ **Altura**: 350px
- ✅ **Grid**: Linhas horizontais sutis
- ✅ **Tooltip**: "Dia X: Y leads"
- ✅ **Labels**: "Dia do Mês" (X) e "Leads" (Y)

### **Estatísticas Resumidas:**
- Total de Leads
- Média por Dia
- Dia com Mais Leads

### **Hook de Dados:**
`useDashboardLeadsPerDay(month: string)`
- Gera dados fictícios para demonstração
- Calcula automaticamente estatísticas
- Loading state incluído

---

## 📈 SEÇÃO 4 - Análise de UTMs

### **Componente Container**
`DashboardUTMAnalysis.tsx`

### **Componente Reutilizável**
`UTMAnalysisSection.tsx`

### **Estrutura:**
5 Subseções idênticas (4A, 4B, 4C, 4D, 4E):
1. **UTM Medium**
2. **UTM Source**
3. **UTM Campaign**
4. **UTM Content**
5. **UTM Term**

### **Layout de Cada Subseção:**

#### **Grid 2 Colunas (40% / 60%)**

**Coluna Esquerda - Gráfico de Pizza:**
- ✅ Tipo: Gráfico de pizza (Recharts)
- ✅ Título: Nome da UTM
- ✅ Dados: Distribuição percentual
- ✅ Cores: Paleta variada (8 cores)
- ✅ Legenda: Posição inferior
- ✅ Tooltip: "utm_x: X leads (Y%)"
- ✅ Labels: Percentuais (apenas se >= 5%)

**Coluna Direita - Tabela:**
- ✅ **Coluna 1**: Nome da UTM (alinhado à esquerda)
- ✅ **Coluna 2**: Quantidade (centro, número inteiro)
- ✅ **Coluna 3**: Valor Total (direita, BRL, verde)
- ✅ **Header**: Background cinza claro, negrito
- ✅ **Ordenação**: Decrescente por quantidade
- ✅ **Linhas zebradas**: Alternância branco/cinza claro

### **Paleta de Cores:**
```typescript
const CHART_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#eab308", // yellow-500
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
];
```

### **Hook de Dados:**
`useDashboardUTMAnalysis(month: string)`
- Retorna dados para todas as 5 UTMs
- Calcula percentuais automaticamente
- Atribui cores do array de paleta
- Loading state incluído

### **Tratamento de Dados Vazios:**
- Mensagem: "Sem dados para este período"
- Centralizada e estilizada

---

## 🎨 Design System

### **Cards**
- Background: Branco (`bg-white`)
- Border: Cinza claro (`border-gray-200`)
- Sombra: Sutil (`shadow-sm`)
- Border Radius: `rounded-xl`
- Padding: `p-6`

### **Títulos**
- Principais: `text-2xl font-bold text-gray-900`
- Subseções: `text-xl font-bold text-gray-900`

### **Tabelas**
- Header: `bg-gray-100 text-gray-700 uppercase text-xs font-bold`
- Valores BRL: `text-green-600 font-semibold`
- Linhas: Alternância `bg-white` / `bg-gray-50`
- Border: `border-gray-200`

### **Tooltips**
- Background: Branco
- Border: `border-gray-200`
- Sombra: `shadow-lg`
- Padding: `px-3 py-2`
- Texto: Semibold

---

## 🔄 Integração na Página Principal

### **Estado Global:**
```typescript
const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
```

### **Ordem das Seções:**
1. ✅ **Seção 1**: Métricas Financeiras
2. ✅ **Seção 2**: Funil de Conversão
3. ✅ **Seção 3**: Leads por Dia ⬅️ NOVO
4. ✅ **Seção 4**: Análise de UTMs ⬅️ NOVO

### **Divisores:**
- Linha horizontal cinza entre cada seção
- Container: `container mx-auto px-4`
- Estilo: `h-px bg-gray-200`

---

## 📝 Dados Mocados

### **Leads por Dia:**
- Gera automaticamente baseado no mês
- Valores aleatórios: 10-60 leads/dia
- Número de dias: Calculado dinamicamente (28-31)

### **UTMs:**
- Dados fixos para demonstração
- Totalmente customizáveis
- Percentuais calculados automaticamente

---

## ✅ Checklist de Implementação

- [x] Instalar Recharts
- [x] Criar tipos TypeScript
- [x] Criar hooks customizados
- [x] Criar componente de gráfico de barras
- [x] Criar componente de gráfico de pizza
- [x] Criar componente de tabela UTM
- [x] Criar Seção 3 (Leads por Dia)
- [x] Criar Seção 4 (Análise de UTMs)
- [x] Integrar na página principal
- [x] Validar ausência de erros de linter

---

## 🚀 Como Testar

```bash
# Se o servidor não estiver rodando
yarn dev
```

Acesse: **http://localhost:3000**

Verifique:
1. ✅ Gráfico de barras de leads por dia
2. ✅ 5 subseções de UTMs com gráficos de pizza
3. ✅ Tabelas com dados formatados em BRL
4. ✅ Tooltips interativos
5. ✅ Responsividade (grid adapta para mobile)

---

## 📚 Documentação Técnica

### **Recharts - Documentação Oficial**
- [BarChart](https://recharts.org/en-US/api/BarChart)
- [PieChart](https://recharts.org/en-US/api/PieChart)
- [Tooltip](https://recharts.org/en-US/api/Tooltip)
- [Legend](https://recharts.org/en-US/api/Legend)

---

## 🎯 Próximos Passos (Opcional)

1. Conectar com API real (substituir hooks mocados)
2. Adicionar filtros avançados
3. Exportar dados para CSV/Excel
4. Adicionar mais tipos de gráficos (linha, área)
5. Implementar drill-down nos gráficos
6. Adicionar comparação entre períodos

