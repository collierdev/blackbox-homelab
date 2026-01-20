# Build stage for client
FROM node:22-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:22-slim AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production stage
FROM node:22-slim
WORKDIR /app

# Install util-linux for nsenter, procps for ps, iproute2 for ip command
RUN apt-get update && apt-get install -y --no-install-recommends \
    util-linux \
    procps \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Copy server build and dependencies
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/package.json ./

# Copy client build
COPY --from=client-builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/index.js"]
