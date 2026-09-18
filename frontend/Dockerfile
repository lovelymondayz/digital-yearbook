# Runtime stage only — uses pre-built local dist
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from local dist
COPY dist /usr/share/nginx/html

# Fix permissions for nginx
RUN chmod -R 755 /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
