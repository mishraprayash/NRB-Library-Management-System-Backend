import prisma from '../../lib/prisma.js';

export async function handleVariablesSeeding() {
  try {
    await prisma.variables.deleteMany();
    await prisma.variables.create({
      data: {
        MAX_BORROW_LIMIT: 5,
        MAX_RENEWAL_LIMIT: 2,
        EXPIRYDATE: 15,
        CATEGORIES: [],
      },
    });
  } catch (error) {
    console.log('Error while seeding library constraints', error);
  }
}

// // in case you just want to seed it alone
// handleVariablesSeeding()
//     .then(() => console.log("✅Variables seeded Successfully"))
//     .finally(async () => prisma.$disconnect())
