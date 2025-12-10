# 📋 Exemplos Visuais - Como os Dados Ficam no Banco

## ✅ Exemplo 1: COMPRADOR (Comprou e pagamento foi recebido)

```json
{
  "id": "uuid-123",
  "email_lead": "joao@exemplo.com",
  "nome_lead": "João Silva",
  "produto": "Ingresso + Template Escala 26",
  "valor": 147.00,
  "liquidado": 138.66,                    // ✅ > 0 (pagamento recebido)
  "acao_tomada": ["paid", "comprador"],   // ✅ Contém "paid"
  "projeto": "escala-26",
  "created_original": "2025-12-09T20:31:53Z"
}
```

**Categoria**: ✅ **COMPROU**  
**Conta como comprador?**: ✅ Sim  
**Conta no valor líquido?**: ✅ Sim (138.66)

---

## ❌ Exemplo 2: NÃO COMPROU (Nunca pagou)

```json
{
  "id": "uuid-456",
  "email_lead": "maria@exemplo.com",
  "nome_lead": "Maria Santos",
  "produto": "Ingresso Escala 26",
  "valor": 47.00,
  "liquidado": 0.00,                       // ❌ = 0 (não foi recebido)
  "acao_tomada": ["popup-blindado"],      // ❌ Não contém "paid"
  "projeto": "escala-26",
  "created_original": "2025-12-09T15:20:26Z"
}
```

**Categoria**: ❌ **NÃO COMPROU**  
**Conta como comprador?**: ❌ Não  
**Conta no valor líquido?**: ❌ Não

---

## ❌ Exemplo 3: NÃO COMPROU (Pagou mas não foi liquidado)

```json
{
  "id": "uuid-789",
  "email_lead": "pedro@exemplo.com",
  "nome_lead": "Pedro Costa",
  "produto": "Ingresso + Template Escala 26",
  "valor": 147.00,
  "liquidado": 0.00,                       // ❌ = 0 (não foi recebido)
  "acao_tomada": ["paid", "waiting_payment"], // ✅ Tem "paid" mas liquidado = 0
  "projeto": "escala-26",
  "created_original": "2025-12-09T05:09:39Z"
}
```

**Categoria**: ❌ **NÃO COMPROU**  
**Conta como comprador?**: ❌ Não (mesmo tendo "paid", liquidado = 0)  
**Conta no valor líquido?**: ❌ Não

---

## 💰 Exemplo 4: REEMBOLSO (Comprou mas pediu reembolso)

```json
{
  "id": "uuid-321",
  "email_lead": "ana@exemplo.com",
  "nome_lead": "Ana Lima",
  "produto": "Ingresso Escala 26",
  "valor": 27.00,
  "liquidado": 24.65,                     // ✅ > 0 (foi recebido)
  "acao_tomada": ["paid", "refunded"],    // ✅ Tem "paid" E "refunded"
  "projeto": "escala-26",
  "created_original": "2025-11-19T01:20:56Z"
}
```

**Categoria**: 💰 **REEMBOLSO**  
**Conta como comprador?**: ❌ Não (mesmo tendo "paid" e liquidado > 0)  
**Conta no valor líquido?**: ❌ Não (foi reembolsado)

---

## 💰 Exemplo 5: REEMBOLSO (Reembolso solicitado)

```json
{
  "id": "uuid-654",
  "email_lead": "carlos@exemplo.com",
  "nome_lead": "Carlos Oliveira",
  "produto": "Ingresso + Template Escala 26",
  "valor": 97.00,
  "liquidado": 91.16,                     // ✅ > 0
  "acao_tomada": ["paid", "reembolso"],  // ✅ Tem "paid" E "reembolso"
  "projeto": "escala-26",
  "created_original": "2025-11-19T01:26:34Z"
}
```

**Categoria**: 💰 **REEMBOLSO**  
**Conta como comprador?**: ❌ Não  
**Conta no valor líquido?**: ❌ Não

---

## 📊 Tabela Comparativa

| Exemplo | `paid`? | `liquidado` | `refunded`/`reembolso`? | Categoria | Conta como Comprador? | Conta no Valor Líquido? |
|---------|---------|-------------|------------------------|-----------|----------------------|------------------------|
| Exemplo 1 | ✅ Sim | 138.66 | ❌ Não | ✅ COMPROU | ✅ Sim | ✅ Sim |
| Exemplo 2 | ❌ Não | 0.00 | ❌ Não | ❌ NÃO COMPROU | ❌ Não | ❌ Não |
| Exemplo 3 | ✅ Sim | 0.00 | ❌ Não | ❌ NÃO COMPROU | ❌ Não | ❌ Não |
| Exemplo 4 | ✅ Sim | 24.65 | ✅ Sim (`refunded`) | 💰 REEMBOLSO | ❌ Não | ❌ Não |
| Exemplo 5 | ✅ Sim | 91.16 | ✅ Sim (`reembolso`) | 💰 REEMBOLSO | ❌ Não | ❌ Não |

---

## 🔍 Como Identificar no Código

### JavaScript/TypeScript

```typescript
function categorizarRegistro(registro) {
  const temPaid = registro.acao_tomada.includes('paid');
  const temLiquidado = registro.liquidado > 0;
  const temRefunded = registro.acao_tomada.includes('refunded');
  const temReembolso = registro.acao_tomada.includes('reembolso');
  
  // Reembolso (prioridade maior)
  if (temPaid && (temRefunded || temReembolso)) {
    return 'REEMBOLSO';
  }
  
  // Comprou
  if (temPaid && temLiquidado) {
    return 'COMPROU';
  }
  
  // Não comprou
  return 'NÃO COMPROU';
}
```

### SQL

```sql
SELECT 
  CASE 
    WHEN acao_tomada @> ARRAY['paid'] 
         AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
    THEN 'REEMBOLSO'
    
    WHEN acao_tomada @> ARRAY['paid'] AND liquidado > 0
    THEN 'COMPROU'
    
    ELSE 'NÃO COMPROU'
  END as categoria
FROM recuperacao_vendas
WHERE projeto = 'escala-26';
```

---

## 📝 Notas Importantes

1. **Array `acao_tomada`**: Pode conter múltiplos valores. Sempre verifique todos os status relevantes.

2. **Prioridade**: Reembolso tem prioridade sobre "Comprou". Se tem `refunded` ou `reembolso`, não conta como comprador.

3. **`liquidado > 0`**: É essencial verificar. Mesmo com `paid`, se `liquidado = 0`, não foi recebido.

4. **Valor vs Liquidado**: 
   - `valor`: Valor bruto (antes das taxas)
   - `liquidado`: Valor líquido (após taxas) - **use este para cálculos**

---

## 🎯 Regra de Ouro

**Para contar como comprador e no valor líquido**:
1. ✅ Deve ter `paid` no array
2. ✅ Deve ter `liquidado > 0`
3. ❌ NÃO deve ter `refunded`
4. ❌ NÃO deve ter `reembolso`

**Query final**:
```sql
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
```



