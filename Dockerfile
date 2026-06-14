FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p storage/orders logs backups

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
