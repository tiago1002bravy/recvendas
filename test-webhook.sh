#!/bin/bash

# Exemplo de como testar o webhook

curl -X POST http://localhost:3010/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "nomeLead": "João Silva",
    "valor": 299.90,
    "acaoTomada": "abandonou_carrinho",
    "produto": "Curso de Marketing Digital",
    "emailLead": "joao.silva@example.com",
    "whatsappLead": "+5511999999999"
  }'

