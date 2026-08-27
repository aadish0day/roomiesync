FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci || npm install --omit=dev

COPY . .

EXPOSE 5000

ENV PORT=5000
ENV MONGO_URI=mongodb://mongodb:27017/roomiesync

CMD ["npm", "start"]
