# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar apenas arquivos de dependências para melhor cache
COPY package.json yarn.lock ./

# Instalar dependências (incluindo devDependencies para build)
RUN yarn install --frozen-lockfile --production=false

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules do stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte e arquivos de configuração
COPY package.json yarn.lock tsconfig.json nest-cli.json ./
COPY src ./src

# Build da aplicação NestJS
RUN yarn build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3010

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Instalar apenas dependências de produção (como root)
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# Mudar propriedade dos arquivos para o usuário nestjs
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3010

# Healthcheck - verifica se a aplicação está respondendo
# Aceita qualquer resposta HTTP (incluindo 404) como sucesso
# Nota: O Coolify pode ter seu próprio healthcheck, este é opcional
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||'3010'),(r)=>{process.exit(0)}).on('error',()=>process.exit(1))"

# Comando de inicialização
CMD ["node", "dist/main.js"]

