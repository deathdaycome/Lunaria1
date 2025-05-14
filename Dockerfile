FROM node:18-alpine

WORKDIR /app

# Устанавливаем curl для health check
RUN apk add --no-cache curl

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY . .

# Устанавливаем dev dependencies для сборки
RUN npm install --only=dev

# Собираем проект
RUN npm run build

# Удаляем dev dependencies после сборки
RUN npm prune --production

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Меняем владельца файлов
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Порт
ENV PORT=5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Запуск
CMD ["npm", "start"]