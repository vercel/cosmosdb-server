FROM node:12-slim

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production=false --frozen-lockfile 

COPY . .

RUN yarn run build

ENTRYPOINT [ "node", "lib/cli.js" ] 
