# Monorepo: sumber backend di folder backend/
# File ini di ROOT repo supaya Railway (tanpa Root Directory) tetap pakai Docker, bukan Railpack.
# Node 22: cocok dengan engine @prisma/* terbaru (hindari EBADENGINE vs Node 20).
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
# Jangan jalankan postinstall saat npm ci: schema Prisma belum di-copy, dan prisma.config.ts butuh DATABASE_URL.
RUN npm ci --ignore-scripts

COPY backend/ ./
# prisma.config.ts wajib DATABASE_URL meski generate tidak menghubungi DB nyata.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
