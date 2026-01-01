#!/bin/bash

echo "🔍 Diagnosticando API em produção..."
echo ""

URL="https://recvendas.bravy.com.br"

# Teste 1: Verificar DNS
echo "1️⃣ Testando resolução DNS..."
if host recvendas.bravy.com.br > /dev/null 2>&1; then
    echo "✅ DNS resolvido corretamente"
    host recvendas.bravy.com.br | head -1
else
    echo "❌ Erro ao resolver DNS"
fi
echo ""

# Teste 2: Verificar se a porta está aberta
echo "2️⃣ Testando conectividade básica..."
if curl -s --connect-timeout 5 -o /dev/null -w "HTTP Status: %{http_code}\n" "$URL" > /dev/null 2>&1; then
    STATUS=$(curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" "$URL")
    echo "✅ Servidor respondeu com status: $STATUS"
else
    echo "❌ Servidor não respondeu (timeout ou conexão recusada)"
fi
echo ""

# Teste 3: Tentar GET simples
echo "3️⃣ Testando requisição GET..."
curl -s --connect-timeout 10 -w "\nHTTP Status: %{http_code}\n" "$URL" || echo "❌ Falha na conexão"
echo ""

# Teste 4: Tentar POST no webhook
echo "4️⃣ Testando endpoint do webhook..."
curl -X POST "$URL/webhook/lsc0126" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -s --connect-timeout 10 \
  -w "\nHTTP Status: %{http_code}\n" || echo "❌ Falha na conexão"
echo ""

echo "📝 Resumo:"
echo "Se todos os testes falharam, a API pode estar:"
echo "  - Offline/não iniciada"
echo "  - Com problema de DNS"
echo "  - Bloqueada por firewall"
echo "  - Com URL incorreta"

