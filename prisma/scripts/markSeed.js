// scripts/markSeeded.js

import prisma from "../../lib/prisma.js"

async function main() {
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS seed_check (id INT PRIMARY KEY);`
  await prisma.$disconnect()
}
main()
