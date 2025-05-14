FROM node:18-alpine

# FORCE CACHE BUST
RUN echo "Build time: Wed May 14 22:20:00 GMT 2025" > /build_info

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

# Expose port 80 instead of 5000
EXPOSE 80

# Start the application
CMD ["npm", "start"]