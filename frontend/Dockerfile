# syntax=docker/dockerfile:1.7
# Static storefront behind Nginx; proxies /api to the backend service
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Large/stable assets first → app code last so JS/CSS edits rebuild fast
COPY assets/ /usr/share/nginx/html/assets/
COPY index.html config.js styles.css app.js /usr/share/nginx/html/
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
