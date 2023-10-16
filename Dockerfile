FROM node:lts-alpine3.18

RUN apk update && apk upgrade && \
    apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    harfbuzz \
    nss \
    freetype \
    freetype-dev \
    ttf-freefont \
    fontconfig

WORKDIR /home/node/app

COPY package*.json ./
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start" ]
