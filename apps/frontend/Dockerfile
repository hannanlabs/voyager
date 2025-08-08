FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml ./

COPY packages/shared-ts/package.json ./packages/shared-ts/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install

COPY packages/shared-ts/ ./packages/shared-ts/

RUN pnpm --filter @voyager/shared-ts build

COPY apps/frontend/ ./apps/frontend/

WORKDIR /workspace/apps/frontend

EXPOSE 3000

CMD ["pnpm", "dev"]