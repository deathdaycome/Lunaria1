FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: Wed May 15 12:00:00 GMT 2025" > /build_info

WORKDIR /app

# Install curl
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# ВАЖНО: Проверяем структуру после сборки
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of /app/dist:" && \
    ls -la /app/dist/ && \
    echo "Contents of /app/dist/public:" && \
    ls -la /app/dist/public/ && \
    echo "Contents of /app/dist/public/assets (first 10 files):" && \
    ls -la /app/dist/public/assets/ | head -20 && \
    echo "Checking for CSS files:" && \
    find /app/dist -name "*.css" -type f | head -10 && \
    echo "Checking index.html:" && \
    if [ -f /app/dist/public/index.html ]; then \
        echo "index.html found, first 20 lines:" && \
        head -20 /app/dist/public/index.html; \
    else \
        echo "ERROR: index.html not found!"; \
    fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port explicitly
EXPOSE 5000

# Set environment variable for port
ENV PORT=5000
ENV NODE_ENV=production

# Проверяем синтаксис перед запуском
RUN echo "=== SYNTAX CHECK ===" && \
    node --check dist/index.js || \
    (echo "Syntax error detected, showing first 50 lines of index.js:" && \
     head -50 dist/index.js)

# Start the application (только один CMD!)
CMD ["node", "--max-old-space-size=512", "dist/index.js"]