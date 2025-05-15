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

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port explicitly
EXPOSE 5000

# Set environment variable for port
ENV PORT=5000

# Add health check (ИСПРАВЛЕНО - объединено в одну строку!)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application (только один CMD!)
CMD ["node", "--max-old-space-size=512", "dist/index.js"]