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



# Запускаем приложение
CMD ["npm", "start"]