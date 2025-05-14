FROM node:18-alpine

# FORCE CACHE BUST - CHANGE THIS LINE TO BUST CACHE
RUN echo "Build time: Wed May 14 18:15:00 GMT 2025" > /build_info

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

# ИСПРАВЛЕНИЕ: НЕ удаляем dev dependencies, так как vite нужна для сервера
# RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]