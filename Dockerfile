FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: $(date)" > /build_info

WORKDIR /app

# Install system dependencies BEFORE switching to non-root user
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies (production + dev для сборки)
RUN npm ci

# Copy source code
COPY . .

# Build frontend AND server
RUN echo '🧹 Cleaning dist...' && \
    rm -rf dist && \
    echo '🔨 Building frontend...' && \
    npx vite build && \
    echo '🔨 Building server...' && \
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18 --external:sharp && \
    echo '✅ Build complete!'

# Verify build
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of dist:" && \
    ls -la dist/ && \
    echo "Server file exists:" && \
    ls -la dist/index.js && \
    echo "Frontend files:" && \
    ls -la dist/public/ && \
    echo "CSS files:" && \
    find dist -name "*.css" -type f

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create necessary directories
RUN mkdir -p /app/uploads /app/files

# Create user (AFTER all system operations)
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

# Verify production setup (БЕЗ команды file!)
RUN echo "=== PRODUCTION VERIFICATION ===" && \
    echo "Node version:" && node --version && \
    echo "Built server file size:" && ls -lh dist/index.js && \
    echo "✅ Production build ready"

# Use npm start (which runs: NODE_ENV=production node dist/index.js)
CMD ["sleep", "infinity"]