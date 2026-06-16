# ─────────────────────────────────────────────────────────────
# ERUDITIO API — development image (hot reload via nest --watch)
# Built from the monorepo root context.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine

# Native build toolchain for modules like bcrypt (node-gyp needs these on Alpine/musl)
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Install workspace dependencies first (better layer caching)
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install

# Build the shared package (pure TS: FSRS + types)
COPY packages/shared ./packages/shared
RUN npm run build -w @eruditio/shared

# Copy the API source and generate the Prisma client
COPY apps/api ./apps/api
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

EXPOSE 3000

# On boot: sync schema to DB (idempotent), seed the admin user, then start with hot reload.
CMD ["sh", "-c", "npx prisma db push --schema apps/api/prisma/schema.prisma --accept-data-loss && npm run prisma:seed -w @eruditio/api && npm run start:dev -w @eruditio/api"]
