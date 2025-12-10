# Mapeamento de Colunas - CSV para Banco de Dados

## Estrutura da Tabela `recuperacao_vendas`

A tabela possui os seguintes campos:
- `id` (uuid, auto-gerado)
- `nome_lead` (varchar, obrigatório)
- `valor` (numeric, default 0)
- `liquidado` (numeric, default 0)
- `acao_tomada` (array de strings, obrigatório)
- `produto` (varchar, obrigatório)
- `email_lead` (varchar, obrigatório)
- `whatsapp_lead` (varchar, obrigatório)
- `id_original` (varchar, opcional)
- `created_original` (timestamp, opcional)
- `from_original` (varchar, opcional)
- `utms` (jsonb, opcional) - objeto JSON com utm_source, utm_medium, utm_campaign, utm_content, utm_term
- `projeto` (varchar, opcional) - será preenchido com "escala-26"
- `dados_originais` (jsonb, opcional) - objeto JSON com todos os dados extras
- `created_at` (timestamp, auto-gerado)
- `updated_at` (timestamp, auto-gerado)

## Mapeamento de Colunas do CSV

| Coluna CSV | Tipo | Mapeamento para Banco | Observações |
|------------|------|----------------------|-------------|
| **Código da venda** | string | `id_original` | ID único da venda no sistema de origem |
| **Data** | datetime | `created_original` | Data/hora da venda (formato: "DD/MM/YYYY HH:MM:SS") |
| **Nome do cliente** | string | `nome_lead` | Nome completo do cliente |
| **Email do cliente** | string | `email_lead` | Email do cliente (usado para identificar duplicados) |
| **Método de pagamento** | string | `dados_originais.metodo_pagamento` | CREDIT_CARD, PIX, BOLETO, etc. |
| **Valor Bruto** | number | `valor` | Valor bruto da venda |
| **Valor Líquido** | number | `liquidado` | Valor líquido recebido (pode estar vazio) |
| **Telefone** | string | `whatsapp_lead` | Telefone com código do país (ex: +5548991679672) |
| **Nome do produto** | string | `produto` | Nome do produto vendido |
| **Código da Oferta** | string | `dados_originais.codigo_oferta` | Código único da oferta |
| **Nome da Oferta** | string | `dados_originais.nome_oferta` | Nome da oferta |
| **Status da venda** | string | `acao_tomada` (array) | Status: paid, waiting_payment, refused, refunded |
| **Erro do processamento** | string | `dados_originais.erro_processamento` | Erro se houver (ex: INSUFFICIENT_FUNDS) |
| **Documento** | string | `dados_originais.documento` | CPF ou CNPJ |
| **Tipo de documento** | string | `dados_originais.tipo_documento` | "cpf" ou "cnpj" |
| **Estado do cliente** | string | `dados_originais.estado` | Estado do cliente |
| **Cidade do cliente** | string | `dados_originais.cidade` | Cidade do cliente |
| **Bairro do cliente** | string | `dados_originais.bairro` | Bairro do cliente |
| **CEP do cliente** | string | `dados_originais.cep` | CEP do cliente |
| **Endereço do cliente** | string | `dados_originais.endereco` | Endereço completo |
| **Complemento do endereço** | string | `dados_originais.complemento` | Complemento do endereço |
| **Número do cliente** | string | `dados_originais.numero` | Número do endereço |
| **Co-Produtor** | string | `dados_originais.co_produtor` | Co-produtor |
| **Gerente de afiliados** | string | `dados_originais.gerente_afiliados` | Gerente de afiliados |
| **Nome do afiliado** | string | `dados_originais.nome_afiliado` | Nome do afiliado |
| **Afiliado** | string | `dados_originais.afiliado` | ID do afiliado |
| **Data de pagamento** | datetime | `dados_originais.data_pagamento` | Data/hora do pagamento |
| **Código País** | string | `dados_originais.codigo_pais` | Código do país (ex: BR, PT) |
| **Parcelas contrato assinatura** | number | `dados_originais.parcelas_contrato` | Número de parcelas |
| **Parcela atual** | number | `dados_originais.parcela_atual` | Parcela atual |
| **Cupom** | string | `dados_originais.cupom` | Código do cupom utilizado |
| **utm_source** | string | `utms.utm_source` | UTM source |
| **utm_medium** | string | `utms.utm_medium` | UTM medium |
| **utm_campaign** | string | `utms.utm_campaign` | UTM campaign |
| **utm_content** | string | `utms.utm_content` | UTM content |
| **utm_term** | string | `utms.utm_term` | UTM term |

## Regras de Importação

### 1. Identificação de Duplicados
- **Chave única**: `email_lead` + `projeto` (onde projeto = "escala-26")
- Se já existir um registro com o mesmo email e projeto:
  - **Atualizar** o registro existente
  - Fazer **merge** do array `acao_tomada` (adicionar novos status sem duplicar)
  - Atualizar campos principais (valor, liquidado, produto, etc.)
  - Manter histórico em `dados_originais`

### 2. Campo `acao_tomada`
- Será um **array** contendo o status da venda
- Valores possíveis: `paid`, `waiting_payment`, `refused`, `refunded`
- Se o mesmo email tiver múltiplas vendas com status diferentes, todos os status serão incluídos no array

### 3. Campo `projeto`
- Será preenchido com: **"escala-26"** para todos os registros deste CSV

### 4. Campo `dados_originais`
- Objeto JSON contendo todos os campos extras do CSV que não têm coluna específica na tabela
- Estrutura:
```json
{
  "metodo_pagamento": "CREDIT_CARD",
  "codigo_oferta": "LBui9o",
  "nome_oferta": "Gravação | Operação escala 26",
  "erro_processamento": "INSUFFICIENT_FUNDS",
  "documento": "22.836.982/0001-99",
  "tipo_documento": "cnpj",
  "estado": "",
  "cidade": "",
  "bairro": "",
  "cep": "",
  "endereco": "",
  "complemento": "",
  "numero": "",
  "co_produtor": "0",
  "gerente_afiliados": "0",
  "nome_afiliado": "",
  "afiliado": "",
  "data_pagamento": "2025-12-10 01:05:21",
  "codigo_pais": "BR",
  "parcelas_contrato": "0",
  "parcela_atual": "",
  "cupom": ""
}
```

### 5. Campo `utms`
- Objeto JSON com os parâmetros UTM:
```json
{
  "utm_source": "cpc",
  "utm_medium": "[EDU] [OE26] [VENDAS] [LP] [LAL 1% compradores green]  - 08.12.25 – 86adtndb6",
  "utm_campaign": "Semelhante (BR, 1%) - [GREEN] [COMPRADORES] – 86a62kc17",
  "utm_content": "[REELS] O jogo mudou.",
  "utm_term": ""
}
```

### 6. Tratamento de Valores Vazios
- Campos numéricos vazios → `0` ou `null` (dependendo do campo)
- Campos de texto vazios → `null` ou string vazia `""`
- Datas vazias → `null`

### 7. Conversão de Datas
- Formato CSV: `"DD/MM/YYYY HH:MM:SS"` (ex: "09/12/2025 22:05:15")
- Formato Banco: `YYYY-MM-DD HH:MM:SS` (ISO 8601)

## Exemplo de Registro Final

Para uma linha do CSV, o registro no banco seria:

```json
{
  "nome_lead": "Raphaella Job Santos",
  "email_lead": "raphaella.job@gmail.com",
  "whatsapp_lead": "+5548991679672",
  "valor": 197,
  "liquidado": 0,
  "produto": "Gravação - Operação escala 26",
  "acao_tomada": ["refused"],
  "id_original": "7286876",
  "created_original": "2025-12-09T22:05:15Z",
  "projeto": "escala-26",
  "utms": {
    "utm_source": "cpc",
    "utm_medium": "[EDU] [OE26] [VENDAS] [LP] [LAL 1% compradores green]  - 08.12.25 – 86adtndb6",
    "utm_campaign": "Semelhante (BR, 1%) - [GREEN] [COMPRADORES] – 86a62kc17",
    "utm_content": "[REELS] O jogo mudou.",
    "utm_term": ""
  },
  "dados_originais": {
    "metodo_pagamento": "CREDIT_CARD",
    "codigo_oferta": "LBui9o",
    "nome_oferta": "Gravação | Operação escala 26",
    "erro_processamento": "INSUFFICIENT_FUNDS",
    "documento": "22.836.982/0001-99",
    "tipo_documento": "cnpj",
    "data_pagamento": null,
    "codigo_pais": "BR",
    "parcelas_contrato": "0",
    "parcela_atual": "",
    "cupom": ""
  }
}
```

## Observações Importantes

1. **Múltiplas vendas do mesmo cliente**: Se o mesmo email aparecer em múltiplas linhas (compras diferentes), cada linha será tratada como uma venda separada, mas o sistema fará merge no banco se já existir um registro com o mesmo email + projeto.

2. **Status diferentes**: Se o mesmo cliente tiver vendas com status diferentes (ex: uma "paid" e outra "refused"), o array `acao_tomada` conterá ambos: `["paid", "refused"]`.

3. **Valor líquido vazio**: Alguns registros não têm valor líquido. Nesses casos, será usado `0` ou o valor será deixado como `null` (dependendo da lógica de negócio).

4. **Projeto fixo**: Todos os registros deste CSV terão `projeto = "escala-26"`.

---

**Aguardando validação antes de prosseguir com a importação.**



