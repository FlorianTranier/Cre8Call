FROM node:20.17.0-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Europe/Paris

ENV APPLICATION_ID
ENV BOT_TOKEN

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY commands/ commands/
COPY listeners/ listeners/
COPY index.js index.js

RUN npm ci --only=production

CMD ["npm", "run", "prod"]