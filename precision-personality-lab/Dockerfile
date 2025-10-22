# ------------------------------
# Stage 1: Build the Next.js app
# ------------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (faster with cache)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build for production
RUN npm run build

# ------------------------------
# Stage 2: Run the production server
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only the necessary build output from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install only production deps
RUN npm ci --omit=dev

# Expose the Next.js production port
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start"]
