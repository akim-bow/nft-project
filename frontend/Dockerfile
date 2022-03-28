FROM node:16-alpine

WORKDIR /app

EXPOSE 3000

RUN npm install -g serve

COPY . .

RUN npm i && npm run build

CMD serve -s ./build -l 3000
