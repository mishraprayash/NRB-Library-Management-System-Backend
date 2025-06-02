import prisma from '../../lib/prisma.js';

export async function handleVariablesSeeding() {
  try {
    await prisma.variables.deleteMany();

    // putting some default values at first
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

