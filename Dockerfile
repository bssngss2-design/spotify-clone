FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install deps first (for caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Build args for Next.js (NEXT_PUBLIC_ vars must be available at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# Rewrites in next.config.ts read this at build time
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL

# Build the app with env vars
RUN NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    npm run build

# Production image
FROM node:20-slim

# Install Python, ffmpeg, and yt-dlp (latest from GitHub releases)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
