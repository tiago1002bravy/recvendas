#!/bin/bash

# Teste do webhook com dados reais do Evandro Dalpissol
# Venda: 7459563
# Produto: Lucro sem caos – Pro Pass
# Valor: R$ 127,90 | Líquido: R$ 114,49

curl -X POST https://recvendas.bravy.com.br/webhook/lsc0126 \
  -H "Content-Type: application/json" \
  -d '{
    "client": {
      "name": "Evandro Dalpissol",
      "email": "evandro@planquality.com.br",
      "cellphone": "+5554981111517"
    },
    "sale": {
      "id": "7459563",
      "amount": 127.9,
      "seller_balance": 114.49,
      "status": "paid",
      "method": "PIX",
      "created_at": "2026-01-01T19:25:37Z"
    },
    "product": {
      "name": "Lucro sem caos – Pro Pass"
    },
    "utms": {
      "utm_source": "Instagram_Feed",
      "utm_medium": "cpc",
      "utm_campaign": "[LSC0126] [VENDAS] [LP - V1] [PQ 365D] [CRIATIVOS CAMPEÕES] 31.12.2025 – 86ae6ff4v",
      "utm_content": "[JP.ASV] [PERFIL 365D] - 86a54406f",
      "utm_term": "[AD109] Vou implentar seu ClickUp – IMG – 86a60p85a"
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTempo de resposta: %{time_total}s\n" \
  -v

