# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Install bash for wait-for-it.sh
RUN apk add --no-cache bash

# Add wait-for-it.sh
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Start the server only after db and redis are ready
CMD ["/wait-for-it.sh", "db:5432", "--", "/wait-for-it.sh", "redis:6379", "--", "npm", "start"] 