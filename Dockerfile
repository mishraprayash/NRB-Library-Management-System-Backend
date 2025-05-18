FROM node:20-alpine

WORKDIR /app

# Install dependencies including PM2 globally
COPY package*.json ./
RUN npm ci
RUN npm install -g pm2

# Copy application code
COPY . .

# Generate Prisma client
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose the application port (based on your ecosystem config)
EXPOSE 5000 5001

# Command to run the application with PM2
CMD ["pm2-runtime", "ecosystem.config.cjs"]