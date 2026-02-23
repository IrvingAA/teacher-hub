FROM nginx:1.27-alpine AS base
RUN rm -f /etc/nginx/conf.d/default.conf

FROM base AS dev
COPY docker/nginx/dev.conf /etc/nginx/conf.d/default.conf

FROM base AS prod
COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
