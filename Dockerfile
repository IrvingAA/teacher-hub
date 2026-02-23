FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init openssl

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci
COPY scripts ./scripts
RUN npm run iconify:sync

FROM deps AS build
COPY tsconfig.json jest.config.js ./
COPY src ./src
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY scripts ./scripts
RUN npm run iconify:sync

FROM base AS runner
ARG APP_VERSION=0.0.0-dev
ARG APP_GIT_SHA=unknown

ENV NODE_ENV=production
ENV APP_VERSION=${APP_VERSION}
ENV APP_GIT_SHA=${APP_GIT_SHA}

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/public ./public
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS test
ENV NODE_ENV=test
COPY . .
CMD ["npm", "test"]
