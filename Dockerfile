FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# НЕ удаляем dev зависимости, так как они нужны в runtime
# (Закомментируйте эту строку)
# RUN npm ci --only=production && npm cache clean --force

# Порт будет назначен CapRover
ENV PORT=5000
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "start"]