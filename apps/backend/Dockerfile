# SubBee Backend — Mult-stage Dockerfile
#
# Stage 1 (builder): installs ALL deps, compiles TypeScript → dist/
# Stage 2 (runtime): installs PROD deps only, copies compiled dist/
#
# Benefits of multi-stage:
#  - Final image has no TypeScript compiler, no source files, no dev tools
#  - Same image runs unchanged on Railway, Render, Fly.io, any VPS, or locally
#  - Moving servers = docker pull + docker run. Zero reconfiguration.

# ── Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy workspace manifests first (layer-cache friendly — only re-runs when
# package.json or lockfile changes, not when source code changes)
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json

# Install ALL dependencies (including devDeps — we need tsc here)
RUN pnpm install --filter backend --frozen-lockfile

# Copy backend source
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Compile TypeScript → dist/
RUN pnpm --filter backend build

# ── Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Install pnpm (needed to run pnpm install --prod)
RUN npm install -g pnpm@9

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json

# Install PRODUCTION dependencies only (no tsc, no nodemon, no ts-node)
RUN pnpm install --filter backend --frozen-lockfile --prod

# Copy compiled output from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Expose the port (Railway/Render/Fly read this; override with PORT env var)
EXPOSE 3000

# Health-check to know when the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Running the compiled JS directly, no TypeScript overhead in production
CMD ["node", "apps/backend/dist/server.js"]
