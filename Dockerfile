# Base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (use Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build NestJS project
RUN npm run build

# Expose port (make sure app uses process.env.PORT or 8080)
EXPOSE 8080

# Run the app
CMD ["node", "dist/main"]
