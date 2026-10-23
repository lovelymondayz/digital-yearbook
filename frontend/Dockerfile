# syntax=docker/dockerfile:1

# ---- Build stage: compile the React app inside the image ----
# The previous runtime-only stage COPYed a pre-built ./dist directory, but
# frontend/dist is untracked in git. A clean build on any other machine
# produced an empty /usr/share/nginx/html and a broken site.
FROM node:22-alpine AS build

WORKDIR /app

# Install against the lockfile for reproducible installs
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- Runtime stage: serve the built assets ----
FROM nginx:alpine

# Custom nginx config (SPA fallback, API proxy, cache headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets produced by the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Fix permissions for nginx
RUN chmod -R 755 /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
