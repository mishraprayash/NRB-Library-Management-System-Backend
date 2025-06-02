// scripts/checkSeeded.js

import prisma from "../../lib/prisma.js";

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM seed_check LIMIT 1;`
    process.exit(0) // table exists
  } catch (e) {
    process.exit(1) // table doesn't exist
  } finally {
    await prisma.$disconnect()
  }
}
main()
