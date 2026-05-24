FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- deps ---
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# --- builder ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/types ./types
COPY --from=builder /app/i18n ./i18n
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["node", "server.js"]
