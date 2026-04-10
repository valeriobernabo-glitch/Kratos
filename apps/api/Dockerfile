FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy all package.json files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/config/ ./packages/config/
COPY packages/db/ ./packages/db/
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

FROM base AS production
WORKDIR /app

COPY --from=build /app ./

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

WORKDIR /app/apps/api
CMD ["npx", "tsx", "src/index.ts"]
