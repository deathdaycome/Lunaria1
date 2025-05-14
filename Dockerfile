FROM node:18-alpine

WORKDIR /app

# Устанавливаем curl для health check
RUN apk add --no-cache curl

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Порт 5000
ENV PORT=5000
EXPOSE 5000

# КРИТИЧНО: Добавляем health check (используем 127.0.0.1 вместо localhost)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/health || exit 1

# Запускаем приложение
CMD ["npm", "start"]