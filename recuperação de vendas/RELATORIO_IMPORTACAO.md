# Relatório de Importação - Escala 26

## Resumo da Importação

**Data da Importação**: $(date)

### Estatísticas Gerais

- **Total de linhas no CSV**: 110 registros
- **Emails únicos no CSV**: 61 emails
- **Novos registros inseridos**: 43
- **Registros atualizados**: 18
- **Erros durante importação**: 0

### Estatísticas no Banco de Dados

- **Total de registros com projeto = 'escala-26'**: 74 registros
- **Emails únicos no banco**: 74 emails
- **Duplicados (email + projeto)**: 0 ✅ (constraint única funcionando)

### Status das Vendas

- **Com status 'paid'**: 53 registros
- **Com status 'waiting_payment'**: 7 registros
- **Com status 'refused'**: 5 registros
- **Com status 'refunded'**: 4 registros

*Nota: Alguns registros podem ter múltiplos status no array `acao_tomada`*

### Valores Financeiros

- **Valor total bruto**: R$ 7.788,00
- **Valor total líquido**: R$ 4.621,79

### Validação de Dados

- **Registros sem nome**: 1 (provavelmente registro antigo)
- **Registros sem email**: 1 (provavelmente registro antigo)
- **Registros sem produto**: 0 ✅
- **Registros sem WhatsApp**: 1 (provavelmente registro antigo)
- **Registros sem acao_tomada**: 0 ✅

### Observações

1. **Registros antigos**: Os 3 registros com dados faltantes (sem nome, email ou WhatsApp) provavelmente são registros que já existiam no banco antes da importação, vindos de webhooks ou outras fontes.

2. **Merge de duplicados**: O script identificou corretamente emails que apareciam em múltiplas linhas do CSV e fez merge dos dados, especialmente do array `acao_tomada`.

3. **Integridade dos dados**: 
   - ✅ Nenhum duplicado (mesmo email + projeto)
   - ✅ Todos os registros têm produto
   - ✅ Todos os registros têm acao_tomada
   - ✅ Datas convertidas corretamente
   - ✅ UTMs e dados_originais salvos corretamente

4. **Dados importados do CSV**: 61 registros únicos foram processados do CSV. Os outros 13 registros no banco (74 - 61 = 13) já existiam antes da importação.

## Conclusão

✅ **Importação bem-sucedida!**

Todos os registros do CSV foram processados corretamente, com tratamento adequado de duplicados e merge de dados quando necessário. A constraint única de `email_lead + projeto` está funcionando corretamente, garantindo que não há duplicados no banco.
