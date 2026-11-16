# Static storefront behind Nginx, proxies /api to the backend service
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
# Keep nginx config out of the public web root
RUN rm -f /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/Dockerfile \
  && chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
