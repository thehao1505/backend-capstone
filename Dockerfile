FROM node:20.18.1-alpine AS base

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install --package-lock-only
RUN npm ci

FROM base AS builder
# Copy the rest of the application code
COPY . .
# Build the application
RUN npm run build

FROM node:20.18.1-alpine AS production
# Set working directory
WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/main"]
