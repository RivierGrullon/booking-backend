##############################
# BUILD STAGE
##############################
FROM node:24-alpine AS builder

RUN apk add --no-cache openssl git
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./


RUN pnpm install --frozen-lockfile


COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src


RUN pnpm build


##############################
# RUNTIME STAGE
##############################
FROM node:24-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]



