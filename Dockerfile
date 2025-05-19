FROM node:22-alpine AS builder

WORKDIR /usr/src/app


COPY package*.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

RUN npm ci

COPY ./src ./src

RUN npm run build

FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000


CMD ["node", "dist/main.js"]