# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Ensure the .env file is also copied
COPY .env .env

# Command to run the app
CMD ["npm", "run", "start"]



## docker build -t greg .
## docker run greg
