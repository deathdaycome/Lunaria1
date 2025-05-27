FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: $(date)" > /build_info

WORKDIR /app

# Install system dependencies BEFORE switching to non-root user
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (включая devDependencies для tsx)
RUN npm ci || npm install

# Copy source code
COPY . .

# Build ONLY frontend (не собираем сервер!)
RUN echo '🧹 Cleaning dist...' && \
    rm -rf dist && \
    echo '🔨 Building frontend...' && \
    npx vite build && \
    echo '✅ Frontend build complete!' && \
    echo '⏭️  Skipping server build - will use tsx directly'

# Проверяем структуру после сборки
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of dist/public:" && \
    ls -la dist/public/ && \
    echo "Contents of dist/public/assets:" && \
    ls -la dist/public/assets/ && \
    echo "Checking for CSS files:" && \
    find dist -name "*.css" -type f

# Создаём директории для загрузок
RUN mkdir -p /app/uploads /app/files

# Create non-root user и переключаемся ПОСЛЕ всех системных операций
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production
# Переменные должны быть установлены через CapRover!

# Debug: проверяем версии и окружение (как обычный пользователь)
RUN echo "=== RUNTIME DEBUG ===" && \
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "TSX version:" && npx tsx --version && \
    echo "TypeScript files:" && find . -name "*.ts" -type f | head -10

# Start with database initialization and then the server
CMD ["sh", "-c", "echo '=== STARTING APPLICATION ===' && \
     echo 'Environment variables:' && \
     echo \"NODE_ENV=$NODE_ENV\" && \
     echo \"PORT=$PORT\" && \
     echo \"DATABASE_URL=${DATABASE_URL:0:50}...\" && \
     echo 'Initializing database tables...' && \
     PGPASSWORD=Vfnfwbrfk1996 psql -h srv-captain--lunaria-db -U lunaria -d lunaria_db -c 'CREATE TABLE IF NOT EXISTS session (sid varchar NOT NULL, sess json NOT NULL, expire timestamp(6) NOT NULL, PRIMARY KEY (sid));' || echo 'Session table creation failed or already exists' && \
     echo 'Starting server with tsx...' && \
     npx tsx server/index.ts"]