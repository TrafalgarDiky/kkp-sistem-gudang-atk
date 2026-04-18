# Backend API — build dengan Docker agar Railway tidak bergantung Railpack (monorepo).
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
