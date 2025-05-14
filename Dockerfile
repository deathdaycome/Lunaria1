FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости включая dev (для сборки)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Устанавливаем только production зависимости для финального образа
RUN npm ci --only=production && npm cache clean --force

# Порт будет назначен CapRover
ENV PORT=5000
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "start"]