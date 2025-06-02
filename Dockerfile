FROM node:22-alpine

WORKDIR /app

# Install dependencies including PM2 globally
COPY package*.json ./
RUN npm ci
RUN npm install -g pm2

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

COPY entry-point.sh .
RUN chmod +x entry-point.sh

# Expose the application port (based on your ecosystem config)
EXPOSE 5000 5001

# Command to run the application with PM2
CMD ["./entry-point.sh"]



