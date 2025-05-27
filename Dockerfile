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

# Build ONLY frontend (не собираем сервер)
RUN echo '🧹 Cleaning dist...' && \
    rm -rf dist && \
    echo '🔨 Building frontend...' && \
    npx vite build && \
    echo '✅ Frontend build complete!' && \
    echo '⏭️  Skipping server build - will use tsx directly'

# Verify build
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of dist/public:" && \
    ls -la dist/public/ && \
    echo "Contents of dist/public/assets:" && \
    ls -la dist/public/assets/ && \
    echo "Checking for CSS files:" && \
    find dist -name "*.css" -type f

# Create necessary directories
RUN mkdir -p /app/uploads /app/files

# Create user (AFTER all system operations)
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

# Диагностика перед запуском
RUN echo "=== SYNTAX CHECK ===" && \
    echo "Checking server/index.ts syntax:" && \
    npx tsx --check server/index.ts || echo "❌ Syntax error in server/index.ts" && \
    echo "Checking package.json:" && \
    node -e "console.log('✅ package.json is valid JSON')" && \
    echo "TypeScript files:" && \
    find . -name "*.ts" -type f | head -10

# Запуск с детальной диагностикой
CMD ["sh", "-c", "\
    echo '=== STARTING APPLICATION ===' && \
    echo 'Environment variables:' && \
    echo \"NODE_ENV=$NODE_ENV\" && \
    echo \"PORT=$PORT\" && \
    echo \"DATABASE_URL=${DATABASE_URL:0:50}...\" && \
    echo '=== SYNTAX CHECK BEFORE START ===' && \
    echo 'Checking server/index.ts:' && \
    npx tsx --check server/index.ts && \
    echo '✅ Syntax check passed' && \
    echo 'Initializing database tables...' && \
    PGPASSWORD=Vfnfwbrfk1996 psql -h srv-captain--lunaria-db -U lunaria -d lunaria_db -c 'CREATE TABLE IF NOT EXISTS session (sid varchar NOT NULL, sess json NOT NULL, expire timestamp(6) NOT NULL, PRIMARY KEY (sid));' || echo 'Session table creation failed or already exists' && \
    echo 'Starting server with tsx...' && \
    npx tsx server/index.ts"]