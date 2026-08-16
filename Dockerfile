##### STAGE 1: Dependencies #####
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma 

RUN \
  if [ -f yarn.lock ]; then \
    yarn --frozen-lockfile && yarn add sharp --platform=linuxmusl --arch=x64; \
  elif [ -f package-lock.json ]; then \
    npm ci && npm install --os=linux --libc=musl --cpu=x64 sharp; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile && pnpm add sharp --os=linux --libc=musl --cpu=x64; \
  else echo "Lockfile not found." && exit 1; \
  fi

##### STAGE 2: Builder #####
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true

RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

##### STAGE 3: Runner #####
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build files first
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ensure the upload directory exists and is writable by nextjs user
# We do this as root BEFORE switching to the nextjs user
RUN mkdir -p /app/public/uploads/style_photos && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chmod -R 755 /app/public/uploads

# Switch to non-root user
USER nextjs

EXPOSE 7000

CMD ["node", "server.js"]