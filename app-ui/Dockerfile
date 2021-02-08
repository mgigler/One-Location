FROM node:13.7.0-stretch
WORKDIR /app-ui
ENV PATH /app-ui/node_modules/.bin:$PATH
COPY package*.json ./
RUN npm ci -y
RUN npm install react-scripts@3.0.1 -g --silent

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

