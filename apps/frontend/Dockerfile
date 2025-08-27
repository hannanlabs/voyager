FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY packages/shared-ts/package.json ./packages/shared-ts/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install

COPY packages/shared-ts/ ./packages/shared-ts/

RUN pnpm --filter @voyager/shared-ts build

COPY apps/frontend/ ./apps/frontend/
COPY data/airports.iata.geojson ./apps/frontend/public/data/airports.iata.geojson

WORKDIR /workspace/apps/frontend

RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["pnpm", "start"]
