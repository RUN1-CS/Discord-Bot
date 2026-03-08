# Node JS
FROM node:24.14-alpine3.23

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Start the app
CMD ["npm", "run"]