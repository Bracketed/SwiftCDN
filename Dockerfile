FROM node:bullseye-slim AS base

WORKDIR /usr/src/app

COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node env.d.ts .
COPY --chown=node:node .yarn/ .yarn/
COPY --chown=node:node src/ src/

FROM base AS builder
COPY --chown=node:node tsconfig.json .
RUN corepack enable
RUN yarn set version stable
RUN yarn install
RUN yarn setversion
RUN yarn compile

FROM base AS runner
COPY --chown=node:node --from=builder /usr/src/app/dist dist
COPY --chown=node:node --from=builder /usr/src/app/yarn.lock .
RUN yarn set version stable
RUN yarn install
RUN yarn workspaces focus --all --production
RUN chown node:node /usr/src/app

USER node

CMD ["yarn", "run", "start"]
