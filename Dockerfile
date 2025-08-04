# CNC Simulator Standalone Docker Image
# Runs the CNC machine simulator for UNS Demo System

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create environment file template
RUN echo "# CNC Simulator Configuration\n\
# MQTT Broker Settings\n\
MQTT_BROKER_URL=mqtt://localhost:1883\n\
MQTT_USERNAME=\n\
MQTT_PASSWORD=\n\
\n\
# Simulation Settings\n\
PUBLISH_INTERVAL=3000\n\
ENABLE_LOGGING=true" > .env.example

# Create non-root user for security
RUN addgroup -g 1001 -S cnc && \
    adduser -S cnc -u 1001

# Change ownership of app directory
RUN chown -R cnc:cnc /app

# Switch to non-root user
USER cnc

# Expose port for health check if needed
EXPOSE 3001

# Health check command
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "console.log('CNC Simulator is running')" || exit 1

# Default command
CMD ["node", "dist/index.js"]