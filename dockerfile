# 使用官方 Node.js 映像
FROM node:16

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

CMD ["node", "server.js"]
