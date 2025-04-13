import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.logs.deleteMany();
    await prisma.borrowedBook.deleteMany();
    await prisma.book.deleteMany();
    await prisma.member.deleteMany();
    await prisma.variables.deleteMany();

    // Create system variables
    const variables = await prisma.variables.create({
        data: {
            MAX_BORROW_LIMIT: 5,
            MAX_RENEWAL_LIMIT: 2,
            EXPIRYDATE: 14, // 14 days
            CONSECUTIVE_BORROW_LIMIT_DAYS: 30,
            CATEGORIES: ['FICTION', 'NON-FICTION', 'SCIENCE', 'HISTORY', 'BIOGRAPHY']
        }
    });

    // Create members with hashed passwords
    const password = await bcrypt.hash('prayash', 10);
    
    const superAdmin = await prisma.member.create({
        data: {
            name: 'Super Admin',
            username: 'superadmin',
            email: 'superadmin@library.com',
            password,
            phoneNo: '1234567890',
            role: 'SUPERADMIN'
        }
    });

    const admin = await prisma.member.create({
        data: {
            name: 'Prayash',
            username: 'prayash',
            email: 'prayash@library.com',
            password,
            phoneNo: '2345678901',
            role: 'ADMIN'
        }
    });

    const members = await Promise.all([
        prisma.member.create({
            data: {
                name: 'John Doe',
                username: 'johndoe',
                email: 'john@example.com',
                password,
                phoneNo: '3456789012',
                role: 'MEMBER'
            }
        }),
        prisma.member.create({
            data: {
                name: 'Jane Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                password,
                phoneNo: '4567890123',
                role: 'MEMBER'
            }
        }),
        prisma.member.create({
            data: {
                name: 'Alice Johnson',
                username: 'alicej',
                email: 'alice@example.com',
                password,
                phoneNo: '5678901234',
                role: 'MEMBER'
            }
        }),
        prisma.member.create({
            data: {
                name: 'Bob Wilson',
                username: 'bobw',
                email: 'bob@example.com',
                password,
                phoneNo: '6789012345',
                role: 'MEMBER'
            }
        }),
        prisma.member.create({
            data: {
                name: 'Emma Davis',
                username: 'emmad',
                email: 'emma@example.com',
                password,
                phoneNo: '7890123456',
                role: 'MEMBER'
            }
        })
    ]);

    // Create books
    const books = await Promise.all([
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Great Gatsby',
                authors: ['F. Scott Fitzgerald'],
                publisher: 'Scribner',
                publishedYear: 1925,
                pages: 180,
                cost: 15,
                category: 'FICTION',
                available: false
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'To Kill a Mockingbird',
                authors: ['Harper Lee'],
                publisher: 'Grand Central Publishing',
                publishedYear: 1960,
                pages: 281,
                cost: 20,
                category: 'FICTION',
                available: false
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'A Brief History of Time',
                authors: ['Stephen Hawking'],
                publisher: 'Bantam',
                publishedYear: 1988,
                pages: 256,
                cost: 25,
                category: 'SCIENCE',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'Sapiens',
                authors: ['Yuval Noah Harari'],
                publisher: 'Harper',
                publishedYear: 2014,
                pages: 443,
                cost: 30,
                category: 'HISTORY',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: '1984',
                authors: ['George Orwell'],
                publisher: 'Secker & Warburg',
                publishedYear: 1949,
                pages: 328,
                cost: 18,
                category: 'FICTION',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Selfish Gene',
                authors: ['Richard Dawkins'],
                publisher: 'Oxford University Press',
                publishedYear: 1976,
                pages: 224,
                cost: 22,
                category: 'SCIENCE',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Diary of a Young Girl',
                authors: ['Anne Frank'],
                publisher: 'Contact Publishing',
                publishedYear: 1947,
                pages: 283,
                cost: 16,
                category: 'BIOGRAPHY',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Art of War',
                authors: ['Sun Tzu'],
                publisher: 'Various',
                publishedYear: -500,
                pages: 273,
                cost: 12,
                category: 'HISTORY',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Origin of Species',
                authors: ['Charles Darwin'],
                publisher: 'John Murray',
                publishedYear: 1859,
                pages: 502,
                cost: 28,
                category: 'SCIENCE',
                available: true
            }
        }),
        prisma.book.create({
            data: {
                bookCode: uuidv4(),
                name: 'The Power of Habit',
                authors: ['Charles Duhigg'],
                publisher: 'Random House',
                publishedYear: 2012,
                pages: 371,
                cost: 19,
                category: 'NON-FICTION',
                available: true
            }
        })
    ]);

    // Create borrowed books
    const borrowedBooks = await Promise.all([
        prisma.borrowedBook.create({
            data: {
                bookId: books[0].id,
                memberId: members[0].id,
                borrowedDate: new Date(),
                expiryDate: new Date(Date.now() + variables.EXPIRYDATE * 24 * 60 * 60 * 1000),
                returned: false,
                renewalCount: 0
            }
        }),
        prisma.borrowedBook.create({
            data: {
                bookId: books[1].id,
                memberId: members[1].id,
                borrowedDate: new Date(),
                expiryDate: new Date(Date.now() + variables.EXPIRYDATE * 24 * 60 * 60 * 1000),
                returned: false,
                renewalCount: 0
            }
        })
    ]);

    // Create some logs
    const logs = await Promise.all([
        prisma.logs.create({
            data: {
                level: 'INFO',
                performedBy: superAdmin.name,
                performerID: superAdmin.id,
                action: 'SYSTEM_INITIALIZED',
                description: 'System initialized with seed data',
                module: 'SEED',
                time: new Date()
            }
        }),
        prisma.logs.create({
            data: {
                level: 'INFO',
                performedBy: admin.name,
                performerID: admin.id,
                action: 'BOOK_ADDED',
                affectedIds: [books[0].id.toString()],
                description: 'Added new book to library',
                module: 'BOOK',
                time: new Date()
            }
        })
    ]);

    console.log('Seed data created successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 