import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  await prisma.logs.deleteMany();
  await prisma.borrowedBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.member.deleteMany();
  await prisma.variables.deleteMany();

  const variables = await prisma.variables.create({
    data: {
      MAX_BORROW_LIMIT: 5,
      MAX_RENEWAL_LIMIT: 2,
      EXPIRYDATE: 15,
      CATEGORIES: ['FICTION', 'NON-FICTION', 'SCIENCE', 'HISTORY', 'BIOGRAPHY'],
    },
  });

  const password = await bcrypt.hash('prayash', 10);

  const superAdmin = await prisma.member.create({
    data: {
      name: 'Super Admin',
      username: 'superadmin',
      email: 'superadmin@library.com',
      password,
      phoneNo: '1234567890',
      role: 'SUPERADMIN',
      designation: 'DIRECTOR',
    },
  });

  const admin = await prisma.member.create({
    data: {
      name: 'Prayash',
      username: 'prayash',
      email: 'prayash@library.com',
      password,
      phoneNo: '2345678901',
      role: 'ADMIN',
      designation: 'DEPUTY DIRECTOR',
    },
  });

  const memberNames = [
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Wilson',
    'Emma Davis',
    'Liam Brown',
    'Olivia Garcia',
    'Noah Martinez',
    'Ava Robinson',
    'Elijah Clark',
    'Sophia Lewis',
    'William Lee',
    'Isabella Walker',
    'James Hall',
    'Mia Allen',
    'Benjamin Young',
    'Charlotte Hernandez',
    'Lucas King',
  ];

  const members = await Promise.all(
    memberNames.map((name, index) =>
      prisma.member.create({
        data: {
          name,
          username: `user${index + 1}`,
          email: `user${index + 1}@example.com`,
          password,
          phoneNo: `98${(10000000 + index).toString()}`,
          role: 'MEMBER',
          designation: 'ASSISTANT',
        },
      })
    )
  );

  const bookTitles = Array.from({ length: 50 }, (_, i) => ({
    name: `Book Title ${i + 1}`,
    authors: [`Author ${i + 1}`],
    publisher: `Publisher ${i + 1}`,
    publishedYear: 2000 + (i % 20),
    pages: 100 + i,
    cost: 10 + i,
    category: variables.CATEGORIES[i % variables.CATEGORIES.length],
    available: true,
    bookCode: uuidv4(),
  }));

  const books = await Promise.all(bookTitles.map((book) => prisma.book.create({ data: book })));

  const borrowedBooks = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.borrowedBook.create({
        data: {
          bookId: books[i].id,
          memberId: members[i].id,
          borrowedDate: new Date(),
          expiryDate: new Date(Date.now() + variables.EXPIRYDATE * 24 * 60 * 60 * 1000),
          returned: false,
          renewalCount: 0,
        },
      })
    )
  );

  await prisma.logs.createMany({
    data: [
      {
        level: 'INFO',
        performedBy: superAdmin.name,
        performerID: superAdmin.id,
        action: 'SYSTEM_INITIALIZED',
        description: 'System initialized with seed data',
        module: 'SEED',
        time: new Date(),
      },
      {
        level: 'INFO',
        performedBy: admin.name,
        performerID: admin.id,
        action: 'BOOK_BULK_ADDED',
        description: 'Added 50 sample books',
        module: 'BOOK',
        time: new Date(),
      },
    ],
  });

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
