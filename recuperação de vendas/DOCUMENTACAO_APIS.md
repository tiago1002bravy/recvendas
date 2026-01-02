# 📚 Documentação Completa das APIs - Sistema de Recuperação de Vendas

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Setup Inicial](#2-setup-inicial)
3. [Endpoints da API](#3-endpoints-da-api)
4. [Processamento de Dados](#4-processamento-de-dados)
5. [Integração com Supabase](#5-integração-com-supabase)
6. [Integração com ClickUp](#6-integração-com-clickup)
7. [Formato de Dados Esperado](#7-formato-de-dados-esperado)
8. [Casos Especiais e Edge Cases](#8-casos-especiais-e-edge-cases)
9. [Exemplos Práticos](#9-exemplos-práticos)
10. [Tratamento de Erros](#10-tratamento-de-erros)
11. [Testes Sugeridos](#11-testes-sugeridos)
12. [Ordem de Desenvolvimento](#12-ordem-de-desenvolvimento)
13. [Instruções para IA](#13-instruções-para-ia)

---

## 1. Visão Geral da Arquitetura

O sistema é uma API NestJS que recebe webhooks de plataformas de vendas, processa os dados e os salva tanto no Supabase (banco de dados) quanto no ClickUp (gerenciamento de tarefas).

### Componentes Principais

- **WebhookController**: Recebe requisições HTTP POST
- **WebhookService**: Processa e formata os dados recebidos
- **SupabaseService**: Gerencia operações no banco de dados Supabase
- **ClickUpService**: Gerencia operações no ClickUp (criação/atualização de tasks)

### Fluxo de Dados

```
Webhook → WebhookController → WebhookService → [SupabaseService, ClickUpService]
```

### Stack Tecnológica

- **Framework**: NestJS 10+
- **Banco de Dados**: Supabase (PostgreSQL)
- **Integração**: ClickUp API v2
- **Runtime**: Node.js 18+
- **TypeScript**: 5.1+

---

## 2. Setup Inicial

### 2.1. Pré-requisitos

- Node.js 18+ instalado
- Conta Supabase criada
- Conta ClickUp (opcional, mas recomendado)
- Yarn instalado (não usar NPM)

### 2.2. Instalação

```bash
# Instalar dependências
yarn install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente (ver seção abaixo)
# Editar .env com suas credenciais

# Executar em desenvolvimento
yarn dev

# Build para produção
yarn build

# Executar produção
yarn start:prod
```

### 2.3. Estrutura do Arquivo .env

```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ClickUp (OPCIONAL - se não configurado, integração é desabilitada)
CLICKUP_API_TOKEN=pk_xxx
# OU
CLICKUP_TOKEN=pk_xxx

# Servidor (OPCIONAL)
PORT=3010
```

### 2.4. Estrutura de Arquivos

```
src/
├── app.module.ts          # Módulo principal
├── main.ts                # Bootstrap da aplicação
├── webhook/
│   ├── webhook.module.ts  # Módulo do webhook
│   ├── webhook.controller.ts  # Controller (endpoints)
│   ├── webhook.service.ts     # Lógica de processamento
│   └── dto/
│       └── webhook.dto.ts     # DTO (aceita any)
├── supabase/
│   ├── supabase.module.ts    # Módulo Supabase (Global)
│   └── supabase.service.ts   # Serviço Supabase
└── clickup/
    ├── clickup.module.ts  # Módulo ClickUp (Global)
    └── clickup.service.ts    # Serviço ClickUp

api/
└── index.ts              # Handler para Vercel/serverless
```

---

## 3. Endpoints da API

### 3.1. POST `/webhook`

Endpoint principal para receber webhooks sem especificar projeto.

**URL**: `POST /webhook`

**Headers**:
```
Content-Type: application/json
```

**Body**: Aceita qualquer formato JSON (sem validação rígida)

**Resposta**: 
- Status: `200 OK`
- Body: Dados formatados do lead processado

**Exemplo de Requisição**:
```json
{
  "client": {
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "cellphone": "11999999999"
  },
  "sale": {
    "amount": 147.00,
    "seller_balance": 138.66,
    "status": "paid",
    "method": "PIX"
  },
  "product": {
    "name": "Ingresso Escala 26"
  }
}
```

### 3.2. POST `/webhook/:projeto`

Endpoint para receber webhooks com projeto específico na URL.

**URL**: `POST /webhook/:projeto`

**Parâmetros de URL**:
- `projeto` (string): Nome do projeto (ex: "escala-26")

**Body**: Aceita qualquer formato JSON

**Resposta**: 
- Status: `200 OK`
- Body: Dados formatados do lead processado

**Exemplo de Requisição**:
```bash
POST /webhook/escala-26
Content-Type: application/json

{
  "body": {
    "client": {
      "name": "Maria Santos",
      "email": "maria@exemplo.com",
      "cellphone": "11988888888"
    },
    "sale": {
      "amount": 197.00,
      "seller_balance": 186.17,
      "status": "paid",
      "method": "PIX"
    },
    "product": {
      "name": "Ingresso + Template Escala 26"
    }
  }
}
```

---

## 4. Processamento de Dados

### 4.1. Formatação de Dados

O `WebhookService` extrai e normaliza os dados recebidos usando um sistema de mapeamento de campos flexível.

#### 4.1.1. Mapeamento de Campos

O sistema tenta encontrar campos em múltiplos caminhos (com fallback):

| Campo Final | Caminhos Tentados (em ordem de prioridade) |
|------------|--------------------------------------------|
| `nomeLead` | `client.name`, `body.client.name`, `name`, `content.name` |
| `emailLead` | `client.email`, `body.client.email`, `email`, `content.email` |
| `whatsappLead` | `body.client.cellphone`, `formatted_phone`, `whatsapp`, `telefone`, `content.whatsapp` |
| `valor` | `sale.amount`, `body.sale.amount`, `offer.amount`, `body.offer.amount`, `valor` |
| `liquidado` | `sale.seller_balance`, `body.sale.seller_balance`, `seller_balance`, `body.seller_balance` |
| `produto` | `product.name`, `body.product.name`, `produto` |
| `acaoTomada` | `acao`, `event`, `body.event`, `type`, `body.type` |

#### 4.1.2. Normalização de Dados

**WhatsApp**: 
- Normalizado para formato E.164 (ex: `+5511999999999`)
- Remove caracteres não numéricos
- Adiciona código do Brasil (+55) se não presente
- Remove zeros iniciais
- Exemplo: `11999999999` → `+5511999999999`
- Exemplo: `011999999999` → `+5511999999999`

**Produto**:
- Convertido para lowercase
- Espaços substituídos por hífens
- Mantém "+" mas remove espaços ao redor
- Exemplo: "Ingresso + Template Escala 26" → "ingresso+template-escala-26"
- Exemplo: "Ingresso Escala 26" → "ingresso-escala-26"

**Ações (Tags)**:
- Converte para array de strings
- Aceita: array, string separada por vírgula/ponto e vírgula/pipe
- Remove duplicatas
- Exemplo: `"paid,comprador"` → `["paid", "comprador"]`
- Exemplo: `["paid", "comprador"]` → `["paid", "comprador"]`

**Valores Numéricos**:
- Remove caracteres não numéricos (exceto ponto e vírgula)
- Converte vírgula para ponto
- Retorna 0 se inválido
- Exemplo: `"R$ 147,00"` → `147.00`
- Exemplo: `"147.50"` → `147.50`

### 4.2. Detecção Automática de Ações

O sistema detecta automaticamente ações baseado em status e eventos:

| Condição | Ação Detectada |
|----------|----------------|
| `sale.status === 'paid'` | `comprador` |
| `sale.status === 'waiting_payment' && method === 'PIX'` | `pix-gerado` |
| `sale.status === 'refunded'` | `reembolso` |
| `event === 'checkoutAbandoned'` ou `event === 'checkout-abandoned'` | `carrinho-abandonado` |
| `hasOffer && !hasSale` | `carrinho-abandonado` |
| `sale.status` em `['failed', 'refused', 'declined', 'error', 'rejected', 'canceled', 'cancelled']` | `cartao-recusado` |
| `event === 'saleUpdated'` ou `event === 'sale-updated'` | `venda-atualizada` |

### 4.3. Estrutura de Dados Formatados

```typescript
interface FormattedLeadData {
  nomeLead: string;
  emailLead: string;
  whatsappLead: string; // Formato E.164
  valor: number;
  liquidado: number; // Valor líquido recebido
  produto: string; // Normalizado
  acaoTomada: string[]; // Array de tags/ações
  id?: number | string; // ID original da venda
  created?: string; // Data original
  from?: string; // Origem do lead
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  projeto?: string;
  dadosOriginais?: any; // Dados completos originais
}
```

---

## 5. Integração com Supabase

### 5.1. Setup do Banco de Dados

#### 5.1.1. SQL da Tabela

```sql
-- Criar tabela recuperacao_vendas
CREATE TABLE recuperacao_vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_lead VARCHAR(255) NOT NULL,
  email_lead VARCHAR(255) NOT NULL,
  whatsapp_lead VARCHAR(20),
  produto VARCHAR(255) NOT NULL,
  valor NUMERIC DEFAULT 0,
  liquidado NUMERIC DEFAULT 0,
  acao_tomada TEXT[] DEFAULT '{}',
  projeto VARCHAR(255),
  id_original VARCHAR(255),
  created_original TIMESTAMP,
  from_original VARCHAR(255),
  utms JSONB,
  dados_originais JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_email_projeto UNIQUE(email_lead, projeto)
);

-- Índices recomendados para performance
CREATE INDEX idx_recuperacao_vendas_email_projeto ON recuperacao_vendas(email_lead, projeto);
CREATE INDEX idx_recuperacao_vendas_projeto ON recuperacao_vendas(projeto);
CREATE INDEX idx_recuperacao_vendas_created_at ON recuperacao_vendas(created_at DESC);
CREATE INDEX idx_recuperacao_vendas_acao_tomada ON recuperacao_vendas USING GIN(acao_tomada);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recuperacao_vendas_updated_at 
    BEFORE UPDATE ON recuperacao_vendas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### 5.1.2. Estrutura da Tabela

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `id` | UUID | ✅ Sim | ID único (auto-gerado) |
| `nome_lead` | VARCHAR(255) | ✅ Sim | Nome do lead |
| `email_lead` | VARCHAR(255) | ✅ Sim | Email do lead |
| `whatsapp_lead` | VARCHAR(20) | ❌ Não | WhatsApp (E.164) |
| `produto` | VARCHAR(255) | ✅ Sim | Nome do produto |
| `valor` | NUMERIC | ❌ Não | Valor bruto (default: 0) |
| `liquidado` | NUMERIC | ❌ Não | Valor líquido recebido (default: 0) |
| `acao_tomada` | ARRAY[TEXT] | ❌ Não | Array de status/ações (default: []) |
| `projeto` | VARCHAR(255) | ❌ Não | Nome do projeto |
| `id_original` | VARCHAR(255) | ❌ Não | ID da venda original |
| `created_original` | TIMESTAMP | ❌ Não | Data original da venda |
| `from_original` | VARCHAR(255) | ❌ Não | Origem do lead |
| `utms` | JSONB | ❌ Não | Parâmetros UTM |
| `dados_originais` | JSONB | ❌ Não | Dados completos originais |
| `created_at` | TIMESTAMP | ❌ Não | Data de criação (auto) |
| `updated_at` | TIMESTAMP | ❌ Não | Data de atualização (auto) |

### 5.2. Regras de Negócio - Supabase

#### 5.2.1. Identificação de Duplicados

**Chave única**: `email_lead` + `projeto`

- Se existe registro com mesmo `email_lead` e `projeto`:
  - **ATUALIZA** o registro existente
  - Faz **merge** do array `acao_tomada` (combina e remove duplicatas)
  - Atualiza outros campos com valores mais recentes

- Se não existe (email novo ou projeto diferente):
  - **CRIA** novo registro

#### 5.2.2. Merge de Ações

```typescript
// Exemplo de merge
acoesExistentes = ['popup-blindado', 'pix-gerado']
acoesNovas = ['comprador', 'paid']
acoesMerged = ['popup-blindado', 'pix-gerado', 'comprador', 'paid'] // Remove duplicatas
```

**Algoritmo de Merge**:
1. Combina arrays existentes e novos
2. Remove duplicatas usando `Set`
3. Mantém ordem cronológica (existentes primeiro, depois novas)

---

## 6. Integração com ClickUp

### 6.1. Configuração

- **List ID**: `901305222206` (fixo)
- **API Base URL**: `https://api.clickup.com/api/v2`
- **Token**: `CLICKUP_API_TOKEN` ou `CLICKUP_TOKEN` (variável de ambiente)

### 6.2. Custom Fields do ClickUp

O sistema mapeia automaticamente os seguintes custom fields:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **E-mail** | Text | Email do lead |
| **WhatsApp** | Text | WhatsApp do lead |
| **Oportunidade** | Number | Valor bruto da venda |
| **Liquidado** | Number | Valor líquido recebido |
| **Produto** | Labels | Produto vendido (campo de labels) |
| **Backend Projeto** | Text | Nome do projeto |

#### 6.2.1. Campo "Produto" (Labels)

**ID Fixo do Campo**: `b01ec9fe-187c-4e49-8d0e-5f40d24ed3f3`

**IDs Fixos dos Labels**:

| Nome do Produto (normalizado) | Label ID |
|-------------------------------|----------|
| `ingresso escala 26` | `000859e0-a3fb-482a-9042-b9eb72e7afec` |
| `ingresso-escala-26` | `000859e0-a3fb-482a-9042-b9eb72e7afec` |
| `ingressoescala26` | `000859e0-a3fb-482a-9042-b9eb72e7afec` |
| `ingresso + template escala 26` | `46f2f9e5-c903-4ea4-be76-2d95f45a8ae0` |
| `ingresso+template-escala-26` | `46f2f9e5-c903-4ea4-be76-2d95f45a8ae0` |
| `ingresso+template escala 26` | `46f2f9e5-c903-4ea4-be76-2d95f45a8ae0` |
| `ingressotemplateescala26` | `46f2f9e5-c903-4ea4-be76-2d95f45a8ae0` |

**Busca de Labels**:
1. Tenta IDs fixos primeiro (mais confiável)
2. Tenta busca normalizada (remove espaços/símbolos)
3. Tenta labels carregados dinamicamente da API
4. Se não encontrar, loga warning mas não falha

### 6.3. Regras de Negócio - ClickUp

#### 6.3.1. Identificação de Tasks Existentes

**Busca por**: `email_lead` + `projeto` (usando custom fields)

- Se encontra task existente:
  - **ATUALIZA** a task
  - Faz **merge** das tags (combina e remove duplicatas)
  - Atualiza custom fields
  - **NÃO altera o nome** da task (preserva nome existente)

- Se não encontra:
  - **CRIA** nova task
  - Nome da task = `nome_lead` (ou email se nome vazio)

#### 6.3.2. Gerenciamento de Tags

- Tags são adicionadas individualmente via endpoint específico
- Faz merge: combina tags existentes com novas, remove duplicatas
- Tags representam as ações (`acao_tomada`)
- Endpoint: `POST /task/{task_id}/tag/{tag_name}`

#### 6.3.3. Preservação do Nome da Task

**Regra**: O nome da task NUNCA é alterado após criação, exceto:
- Se o nome atual está vazio E o novo nome não está vazio → Atualiza
- Caso contrário → Mantém nome existente

**Lógica**:
```typescript
if (!nomeAtual.trim() && novoNome.trim()) {
  // Atualiza nome (estava vazio)
} else if (nomeAtual.trim() && !novoNome.trim()) {
  // NÃO atualiza (mantém existente)
} else if (nomeAtual.trim() && novoNome.trim() && nomeAtual !== novoNome) {
  // NÃO atualiza (mantém existente, mesmo que diferente)
}
```

### 6.4. Endpoints ClickUp Utilizados

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/list/{list_id}/field` | Carregar custom fields |
| `GET` | `/list/{list_id}/task` | Buscar tasks existentes (com filtros) |
| `GET` | `/task/{task_id}` | Buscar detalhes da task |
| `POST` | `/list/{list_id}/task` | Criar nova task |
| `PUT` | `/task/{task_id}` | Atualizar task |
| `POST` | `/task/{task_id}/tag/{tag_name}` | Adicionar tag individual |

---

## 7. Formato de Dados Esperado

### 7.1. Formato Padrão (n8n/Plataforma de Vendas)

```json
{
  "body": {
    "client": {
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "cellphone": "11999999999"
    },
    "sale": {
      "id": "12345",
      "amount": 147.00,
      "seller_balance": 138.66,
      "status": "paid",
      "method": "PIX",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "product": {
      "name": "Ingresso Escala 26"
    },
    "event": "saleUpdated",
    "utms": {
      "utm_source": "facebook",
      "utm_medium": "cpc",
      "utm_campaign": "escala-26"
    }
  }
}
```

### 7.2. Formato Direto (sem body)

```json
{
  "client": {
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "cellphone": "11999999999"
  },
  "sale": {
    "amount": 147.00,
    "seller_balance": 138.66,
    "status": "paid"
  },
  "product": {
    "name": "Ingresso Escala 26"
  }
}
```

### 7.3. Formato Array (n8n)

```json
[
  {
    "body": {
      "client": { ... },
      "sale": { ... }
    }
  }
]
```

---

## 8. Casos Especiais e Edge Cases

### 8.1. E-mail Inválido ou Ausente

**Cenário**: Email não fornecido ou inválido

**Tratamento**:
- Se email ausente mas whatsapp presente: usar whatsapp como chave única
- Se ambos ausentes: logar erro e salvar com `email_lead = 'desconhecido@{timestamp}'`
- Validar formato de email básico (contém @)

**Código sugerido**:
```typescript
if (!emailLead || !emailLead.includes('@')) {
  if (whatsappLead) {
    emailLead = `whatsapp_${whatsappLead.replace(/[^\d]/g, '')}@desconhecido.local`;
  } else {
    emailLead = `desconhecido_${Date.now()}@desconhecido.local`;
    this.logger.warn(`⚠️ Email e WhatsApp ausentes, usando email temporário: ${emailLead}`);
  }
}
```

### 8.2. Valores Negativos

**Cenário**: Valores negativos (reembolsos)

**Tratamento**:
- Reembolso: `liquidado` negativo é válido (representa devolução)
- Outros valores negativos: converter para 0
- Validar se `liquidado < 0` e `acao_tomada` contém `refunded` ou `reembolso`

**Código sugerido**:
```typescript
if (liquidado < 0 && !acaoTomada.includes('refunded') && !acaoTomada.includes('reembolso')) {
  this.logger.warn(`⚠️ Valor líquido negativo sem ação de reembolso: ${liquidado}`);
  // Manter negativo mas logar warning
}
```

### 8.3. Projeto Não Informado

**Cenário**: Projeto não fornecido na URL nem no body

**Tratamento**:
- Usar `'default'` como projeto
- Logar informação

**Código sugerido**:
```typescript
const projetoFinal = projetoUrl || this.extrairValor(dadosFinais, 'projeto|from|content.from') || 'default';
if (projetoFinal === 'default') {
  this.logger.debug('ℹ️ Projeto não informado, usando "default"');
}
```

### 8.4. Produto Não Encontrado no ClickUp

**Cenário**: Label do produto não existe no ClickUp

**Tratamento**:
- Logar warning
- Não enviar campo produto (ou enviar null)
- Continuar processamento normalmente
- Task será criada sem produto (pode ser preenchido manualmente depois)

### 8.5. Array de Ações Vazio

**Cenário**: Nenhuma ação detectada

**Tratamento**:
- Salvar com array vazio `[]`
- Logar debug informando que nenhuma ação foi detectada
- Não é erro, apenas informação

### 8.6. Dados Originais Muito Grandes

**Cenário**: `dados_originais` muito grande (pode exceder limite do JSONB)

**Tratamento**:
- Limitar tamanho do JSONB (sugestão: 1MB)
- Se exceder, salvar apenas campos essenciais
- Logar warning

**Código sugerido**:
```typescript
const dadosOriginaisStr = JSON.stringify(dadosOriginais);
if (dadosOriginaisStr.length > 1000000) { // 1MB
  this.logger.warn('⚠️ dados_originais muito grande, salvando apenas campos essenciais');
  dadosOriginais = {
    id: dadosOriginais.id,
    sale_id: dadosOriginais.sale?.id,
    client_email: dadosOriginais.client?.email,
    // ... apenas campos essenciais
  };
}
```

### 8.7. Timeout em Chamadas Externas

**Cenário**: Supabase ou ClickUp demoram muito para responder

**Tratamento**:
- Implementar timeout (sugestão: 10s para Supabase, 15s para ClickUp)
- Se timeout, logar erro mas não interromper fluxo
- Retornar dados formatados mesmo se salvamento falhar

---

## 9. Exemplos Práticos

### 9.1. Webhook de Compra Confirmada

**Requisição**:
```bash
POST /webhook/escala-26
Content-Type: application/json

{
  "body": {
    "client": {
      "name": "Maria Santos",
      "email": "maria@exemplo.com",
      "cellphone": "11988888888"
    },
    "sale": {
      "amount": 197.00,
      "seller_balance": 186.17,
      "status": "paid",
      "method": "PIX"
    },
    "product": {
      "name": "Ingresso + Template Escala 26"
    }
  }
}
```

**Processamento**:
1. Extrai dados: nome, email, whatsapp, valor, liquidado, produto
2. Detecta ação: `comprador` (status = paid)
3. Normaliza produto: `ingresso+template-escala-26`
4. Normaliza WhatsApp: `+5511988888888`
5. Salva no Supabase (cria ou atualiza se já existe)
6. Salva no ClickUp (cria task ou atualiza se já existe)

**Resultado**:
- Supabase: Registro criado/atualizado com `acao_tomada = ['comprador']`
- ClickUp: Task criada/atualizada com tag `comprador` e custom fields preenchidos

### 9.2. Webhook de PIX Gerado

**Requisição**:
```bash
POST /webhook/escala-26

{
  "body": {
    "client": {
      "name": "Pedro Costa",
      "email": "pedro@exemplo.com",
      "cellphone": "11977777777"
    },
    "sale": {
      "amount": 147.00,
      "status": "waiting_payment",
      "method": "PIX"
    },
    "product": {
      "name": "Ingresso Escala 26"
    }
  }
}
```

**Processamento**:
1. Detecta ação: `pix-gerado` (waiting_payment + PIX)
2. Salva no Supabase com `acao_tomada = ['pix-gerado']`
3. Se já existe registro, faz merge: `['popup-blindado', 'pix-gerado']`

### 9.3. Webhook de Carrinho Abandonado

**Requisição**:
```bash
POST /webhook/escala-26

{
  "body": {
    "client": {
      "name": "Ana Lima",
      "email": "ana@exemplo.com",
      "cellphone": "11966666666"
    },
    "offer": {
      "amount": 147.00
    },
    "product": {
      "name": "Ingresso Escala 26"
    },
    "event": "checkoutAbandoned"
  }
}
```

**Processamento**:
1. Detecta ação: `carrinho-abandonado` (event = checkoutAbandoned)
2. Salva no Supabase com `acao_tomada = ['carrinho-abandonado']`

### 9.4. Webhook de Reembolso

**Requisição**:
```bash
POST /webhook/escala-26

{
  "body": {
    "client": {
      "name": "Carlos Oliveira",
      "email": "carlos@exemplo.com",
      "cellphone": "11955555555"
    },
    "sale": {
      "amount": 197.00,
      "seller_balance": -186.17,
      "status": "refunded",
      "method": "PIX"
    },
    "product": {
      "name": "Ingresso + Template Escala 26"
    }
  }
}
```

**Processamento**:
1. Detecta ação: `reembolso` (status = refunded)
2. Salva `liquidado` negativo: `-186.17`
3. Salva no Supabase com `acao_tomada = ['reembolso']`
4. Se já existe registro com `paid`, merge: `['paid', 'comprador', 'reembolso']`

---

## 10. Tratamento de Erros

### 10.1. Erros Não Críticos

Estes erros são logados mas **não interrompem o fluxo**:

- ❌ Erro ao salvar no Supabase: Loga erro mas retorna dados formatados
- ❌ Erro ao salvar no ClickUp: Loga erro mas retorna dados formatados
- ⚠️ Campo não encontrado no ClickUp: Loga warning, continua processamento
- ⚠️ Label de produto não encontrado: Loga warning, task criada sem produto
- ⚠️ Tag já existe no ClickUp: Loga debug, continua normalmente

### 10.2. Erros Críticos

Estes erros **interrompem o fluxo** e lançam exceção:

- ❌ Variáveis de ambiente faltando: Lança exceção na inicialização
- ❌ Erro ao conectar no Supabase: Lança exceção
- ❌ Token do ClickUp inválido: Loga erro mas não interrompe (integração opcional)

### 10.3. Estratégia de Retry

**Não implementado por padrão**, mas pode ser adicionado:

- Supabase: Retry 3x com backoff exponencial
- ClickUp: Retry 2x com backoff exponencial
- Timeout: 10s Supabase, 15s ClickUp

---

## 11. Testes Sugeridos

### 11.1. Testes Unitários

#### Normalização de WhatsApp
```typescript
describe('normalizarWhatsApp', () => {
  it('deve normalizar número brasileiro sem código', () => {
    expect(normalizarWhatsApp('11999999999')).toBe('+5511999999999');
  });
  
  it('deve manter número já em E.164', () => {
    expect(normalizarWhatsApp('+5511999999999')).toBe('+5511999999999');
  });
  
  it('deve remover zeros iniciais', () => {
    expect(normalizarWhatsApp('011999999999')).toBe('+5511999999999');
  });
});
```

#### Normalização de Produto
```typescript
describe('normalizarProduto', () => {
  it('deve normalizar produto com espaços', () => {
    expect(normalizarProduto('Ingresso Escala 26')).toBe('ingresso-escala-26');
  });
  
  it('deve manter + mas remover espaços', () => {
    expect(normalizarProduto('Ingresso + Template')).toBe('ingresso+template');
  });
});
```

#### Detecção de Ações
```typescript
describe('detectarAcoes', () => {
  it('deve detectar comprador quando status paid', () => {
    expect(detectarAcoes({ status: 'paid' })).toContain('comprador');
  });
  
  it('deve detectar pix-gerado quando waiting_payment + PIX', () => {
    expect(detectarAcoes({ status: 'waiting_payment', method: 'PIX' })).toContain('pix-gerado');
  });
});
```

#### Merge de Arrays
```typescript
describe('mergeArrays', () => {
  it('deve remover duplicatas', () => {
    expect(mergeArrays(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });
  
  it('deve manter ordem', () => {
    expect(mergeArrays(['a', 'b'], ['c'])).toEqual(['a', 'b', 'c']);
  });
});
```

### 11.2. Testes de Integração

#### Criação no Supabase
```typescript
describe('salvarRecuperacaoVenda - Supabase', () => {
  it('deve criar novo registro quando não existe', async () => {
    const dados = { email_lead: 'teste@exemplo.com', projeto: 'teste', ... };
    const resultado = await supabaseService.salvarRecuperacaoVenda(dados);
    expect(resultado.id).toBeDefined();
  });
  
  it('deve atualizar registro existente com mesmo email+projeto', async () => {
    // Criar primeiro
    await supabaseService.salvarRecuperacaoVenda({ email_lead: 'teste@exemplo.com', projeto: 'teste', acao_tomada: ['a'] });
    // Atualizar
    const resultado = await supabaseService.salvarRecuperacaoVenda({ email_lead: 'teste@exemplo.com', projeto: 'teste', acao_tomada: ['b'] });
    expect(resultado.acao_tomada).toContain('a');
    expect(resultado.acao_tomada).toContain('b');
  });
});
```

#### Criação no ClickUp
```typescript
describe('salvarRecuperacaoVenda - ClickUp', () => {
  it('deve criar nova task quando não existe', async () => {
    const dados = { email_lead: 'teste@exemplo.com', projeto: 'teste', ... };
    await clickUpService.salvarRecuperacaoVenda(dados);
    // Verificar se task foi criada
  });
  
  it('deve atualizar task existente preservando nome', async () => {
    // Criar task com nome específico
    // Atualizar com nome diferente
    // Verificar que nome foi preservado
  });
});
```

#### Fluxo Completo
```typescript
describe('processarDados - Fluxo Completo', () => {
  it('deve processar webhook completo e salvar em ambos', async () => {
    const webhook = { body: { client: {...}, sale: {...} } };
    const resultado = await webhookService.processarDados(webhook, 'teste');
    expect(resultado.emailLead).toBeDefined();
    // Verificar Supabase
    // Verificar ClickUp
  });
});
```

### 11.3. Testes de Edge Cases

- Email ausente
- WhatsApp ausente
- Valores negativos
- Produto não encontrado no ClickUp
- Timeout em chamadas externas
- Dados originais muito grandes

---

## 12. Ordem de Desenvolvimento

### 12.1. Fase 1: Setup Inicial

- [ ] Criar projeto NestJS
- [ ] Configurar TypeScript strict mode
- [ ] Configurar ESLint e Prettier
- [ ] Configurar módulos base (ConfigModule)
- [ ] Criar estrutura de pastas
- [ ] Configurar variáveis de ambiente (.env.example)

### 12.2. Fase 2: Core (Supabase)

- [ ] Implementar SupabaseModule (Global)
- [ ] Implementar SupabaseService
- [ ] Criar tabela no Supabase (SQL fornecido)
- [ ] Implementar método `salvarRecuperacaoVenda`
- [ ] Implementar lógica de merge (email + projeto)
- [ ] Testar operações CRUD
- [ ] Implementar tratamento de erros

### 12.3. Fase 3: Webhook Processing

- [ ] Implementar WebhookModule
- [ ] Implementar WebhookService
- [ ] Implementar mapeamento de campos (com fallbacks)
- [ ] Implementar normalização de dados:
  - [ ] WhatsApp (E.164)
  - [ ] Produto (lowercase, hífens)
  - [ ] Valores numéricos
  - [ ] Arrays de ações
- [ ] Implementar detecção automática de ações
- [ ] Implementar método `formatarDados`
- [ ] Testar com diferentes formatos de entrada

### 12.4. Fase 4: ClickUp Integration

- [ ] Implementar ClickUpModule (Global)
- [ ] Implementar ClickUpService
- [ ] Implementar carregamento de custom fields
- [ ] Implementar busca de tasks existentes (email + projeto)
- [ ] Implementar criação de task
- [ ] Implementar atualização de task (preservando nome)
- [ ] Implementar merge de tags
- [ ] Implementar mapeamento de labels de produto
- [ ] Testar integração completa

### 12.5. Fase 5: Controller & Routes

- [ ] Implementar WebhookController
- [ ] Implementar endpoint `POST /webhook`
- [ ] Implementar endpoint `POST /webhook/:projeto`
- [ ] Implementar método `processarDados` (orquestração)
- [ ] Testar fluxo completo end-to-end
- [ ] Implementar logs detalhados

### 12.6. Fase 6: Edge Cases e Melhorias

- [ ] Implementar tratamento de email ausente
- [ ] Implementar tratamento de valores negativos
- [ ] Implementar tratamento de projeto ausente
- [ ] Implementar timeout em chamadas externas
- [ ] Implementar validação de tamanho de dados_originais
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

### 12.7. Fase 7: Documentação e Deploy

- [ ] Documentar API (esta documentação)
- [ ] Criar README.md
- [ ] Configurar para Vercel/serverless (api/index.ts)
- [ ] Testar em ambiente de produção
- [ ] Monitorar logs e erros

---

## 13. Instruções para IA

### 13.1. Padrões de Código

- ✅ **Usar TypeScript strict mode**
- ✅ **Seguir padrões NestJS** (decorators, dependency injection)
- ✅ **Usar async/await** (nunca callbacks ou Promises.then)
- ✅ **Logger em todas operações importantes** (log, debug, warn, error)
- ✅ **Try/catch em todas chamadas externas** (Supabase, ClickUp, fetch)
- ✅ **Não quebrar fluxo em erros não-críticos** (logar e continuar)
- ✅ **Validar env vars na inicialização** (lançar exceção se faltar obrigatórias)
- ✅ **Usar interfaces tipadas** (evitar `any` exceto webhook input)

### 13.2. Estrutura de Serviços

```typescript
@Injectable()
export class MeuService {
  private readonly logger = new Logger(MeuService.name);
  
  constructor(
    private readonly outroService: OutroService,
    private readonly configService: ConfigService,
  ) {}
  
  async metodoPrincipal(dados: DadosType): Promise<ResultadoType> {
    this.logger.log('🔄 Iniciando processamento...');
    
    try {
      // Lógica principal
      const resultado = await this.processar(dados);
      this.logger.log('✅ Processamento concluído');
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Erro: ${error.message}`);
      throw error; // Ou retornar valor padrão se não crítico
    }
  }
}
```

### 13.3. Tratamento de Erros

```typescript
// Erro não crítico (não interrompe fluxo)
try {
  await this.salvarNoClickUp(dados);
} catch (error) {
  this.logger.error(`❌ Erro ao salvar no ClickUp: ${error.message}`);
  // Não lança exceção, apenas loga
}

// Erro crítico (interrompe fluxo)
if (!this.apiToken) {
  this.logger.error('❌ Token do ClickUp não configurado');
  throw new Error('CLICKUP_TOKEN é obrigatório');
}
```

### 13.4. Logs

```typescript
// Operações normais
this.logger.log('✅ Task criada no ClickUp');

// Detalhes de debug
this.logger.debug(`📦 Dados formatados: ${JSON.stringify(dados)}`);

// Avisos (não críticos)
this.logger.warn('⚠️ Campo não encontrado, usando valor padrão');

// Erros
this.logger.error(`❌ Erro ao salvar: ${error.message}`);
```

### 13.5. Validações

```typescript
// Validar na inicialização
constructor(private configService: ConfigService) {
  const url = this.configService.get<string>('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL é obrigatória');
  }
}

// Validar em métodos
private validarEmail(email: string): boolean {
  return email && email.includes('@');
}
```

### 13.6. Normalização

- Sempre normalizar dados antes de salvar
- Usar métodos privados para normalização
- Documentar regras de normalização
- Testar casos extremos

### 13.7. Performance

- Usar cache quando apropriado (ex: custom fields do ClickUp)
- Implementar timeout em chamadas externas
- Usar índices no banco de dados
- Evitar loops desnecessários

---

## 📝 Notas Finais

### Considerações Importantes

1. **Sem Validação Rígida**: O sistema aceita qualquer formato de dados e tenta extrair o máximo possível
2. **Idempotência**: Múltiplas requisições com mesmo email+projeto resultam em atualização, não duplicação
3. **Merge Inteligente**: Arrays de ações são combinados sem duplicatas
4. **Preservação de Dados**: Nome da task no ClickUp é preservado após criação
5. **Fallbacks Múltiplos**: Sistema tenta múltiplos caminhos para encontrar campos
6. **Normalização Automática**: Dados são normalizados automaticamente (WhatsApp, produto, etc.)
7. **Resiliência**: Erros não críticos não interrompem o fluxo principal

### Próximos Passos

1. Implementar seguindo a ordem de desenvolvimento
2. Testar cada fase antes de avançar
3. Documentar decisões importantes
4. Monitorar logs em produção
5. Iterar baseado em feedback

---

**Última atualização**: 2024-01-15
**Versão**: 1.0.0

