import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMembers() {
  await prisma.member.deleteMany();
  console.log('Deleted all members.');
}

async function deleteBooks() {
  await prisma.book.deleteMany();
  console.log('Deleted all books.');
}

async function deleteBorrowedBooks() {
  await prisma.borrowedBook.deleteMany();
  console.log('Deleted all borrowed books.');
}

async function deleteLogs() {
  await prisma.logs.deleteMany();
  console.log('Deleted all logs.');
}

async function deleteVariables() {
  await prisma.variables.deleteMany();
  console.log('Deleted all variables.');
}

async function flushAll() {
  try {
    await deleteBorrowedBooks(); // Foreign key dependencies should go first
    await deleteLogs();
    await deleteVariables();
    await deleteBooks();
    await deleteMembers();
    console.log('Database flushed successfully.');
  } catch (error) {
    console.error('Error flushing DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI input handling
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case 'all':
      await flushAll();
      break;
    case 'members':
      await deleteMembers();
      break;
    case 'books':
      await deleteBooks();
      break;
    case 'borrowed':
      await deleteBorrowedBooks();
      break;
    case 'logs':
      await deleteLogs();
      break;
    case 'vars':
      await deleteVariables();
      break;
    default:
      console.log('Usage: node flush.js [all|members|books|borrowed|logs|vars]');
  }
})();
