ARG NODE_VERSION=22.12.0
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# --- 1) базовый образ с Node ---
# Кэш зависимостей: сперва только манифесты
COPY package.json package-lock.json* ./

# Если есть lock-файл — используем npm ci; иначе — npm install
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# --- 2) сборка проекта ---
FROM deps AS build
WORKDIR /app
# Копируем исходники после установки зависимостей — кэш сохранится
COPY . .
ENV NODE_ENV=production
# У тебя есть скрипт build:prod в package.json
RUN npm run build:prod

# --- 3) экспорт артефактов для твоего скрипта ---
FROM alpine:3.20 AS export
# Финальный stage существует только ради папки /export
WORKDIR /export
COPY --from=build /app/dist ./
