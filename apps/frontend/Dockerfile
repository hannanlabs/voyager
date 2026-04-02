FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY apps/frontend/package.json ./

RUN pnpm install

COPY apps/frontend/ .
COPY data/airports.iata.geojson ./public/data/airports.iata.geojson

ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["pnpm", "start"]
