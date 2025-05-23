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

# Start with tsx directly - это обойдёт проблемы с ES modules
CMD ["npx", "tsx", "server/index.ts"]FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: Wed May 15 12:00:00 GMT 2025" > /build_info

WORKDIR /app

# Install curl
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install all dependencies (включая devDependencies для tsx)
RUN npm install

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
    ls -la dist/public/assets/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Start with tsx directly
CMD ["npx", "tsx", "server/index.ts"]