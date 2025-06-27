FROM node:22

# create app directory
WORKDIR /usr/src/app

# install app dependencies
COPY package*.json ./
RUN npm install

# bundle app source
COPY . .

# expose default port (others can be specified at runtime)
EXPOSE 8080

# commands (manager or worker) are passed to the entrypoint
ENTRYPOINT ["node", "index.js"]
