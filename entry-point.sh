#!/bin/sh

set -e

echo "Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy

# Check if DB has been seeded
echo "Checking if DB is already seeded..."
if node prisma/scripts/checkSeed.js; then
  echo "Database already seeded. Skipping seeding step."
else
  echo "Seeding the database..."
  # this is for production, need to have excel files for books and members for this.
  # npm run seed:all 
  # this is for development
  npm run seed:dummy

  echo "Marking database as seeded..."
  node prisma/scripts/markSeed.js
fi

# Start the app
echo "Starting app with PM2..."
pm2-runtime ecosystem.config.cjs
