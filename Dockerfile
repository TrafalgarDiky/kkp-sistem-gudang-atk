# Monorepo: sumber backend di folder backend/
# File ini di ROOT repo supaya Railway (tanpa Root Directory) tetap pakai Docker, bukan Railpack.
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
