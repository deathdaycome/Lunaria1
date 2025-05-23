FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: $(date)" > /build_info

WORKDIR /app

# Install curl
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install all dependencies (включая devDependencies для tsx)
RUN npm ci || npm install

# Copy source code
COPY . .

# Build ONLY frontend
RUN echo '🧹 Cleaning dist...' && \
    rm -rf dist && \
    echo '🔨 Building frontend...' && \
    npx vite build && \
    echo '✅ Frontend build complete!'

# Проверяем структуру после сборки
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of dist/public:" && \
    ls -la dist/public/ && \
    echo "Contents of dist/public/assets:" && \
    ls -la dist/public/assets/ && \
    echo "Checking for CSS files:" && \
    find dist -name "*.css" -type f

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production
# Временно для тестирования - потом удалите!
ENV DATABASE_URL="postgresql://lunaria:Vfnfwbrfk1996@srv-captain--lunaria-db:5432/lunaria_db"
ENV OPENAI_API_KEY="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"
ENV UPLOAD_PATH="/app/uploads"
ENV FILES_DIR="/app/files"

# Debug: проверяем версии и окружение
RUN echo "=== RUNTIME DEBUG ===" && \
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "TSX version:" && npx tsx --version && \
    echo "TypeScript files:" && find . -name "*.ts" -type f | head -10

# Start with error handling and detailed logging
CMD ["sh", "-c", "echo '=== STARTING APPLICATION ===' && \
     echo 'Environment variables:' && \
     echo \"NODE_ENV=$NODE_ENV\" && \
     echo \"PORT=$PORT\" && \
     echo \"DATABASE_URL=${DATABASE_URL:0:50}...\" && \
     echo 'Starting server with tsx...' && \
     npx tsx server/index.ts 2>&1 || \
     (echo 'Server failed to start. Error details above.' && exit 1)"]