import prisma from '../../lib/prisma.js';

import { v4 as uuidv4 } from 'uuid';
import { convertBookExcelToJSON } from './ExceltoJSON.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateBookCode() {
  return uuidv4();
}

function isValidRow(row) {
  const requiredFields = [
    'Book Name',
    'Author Name',
    'Publisher',
    'Year',
    'pages',
    'Cost',
    'Category',
  ];
  return requiredFields.every(
    (field) =>
      row[field] !== undefined && row[field] !== null && row[field].toString().trim() !== ''
  );
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

const allCategories = [];

async function SeedBook() {
  const data = convertBookExcelToJSON(path.join(__dirname, '/BookList.xls'));

  const seenBooks = new Map();

  await prisma.book.deleteMany();
  await prisma.borrowedBook.deleteMany();

  let totalBooksCount = 0;
  let totalSuccess = 0;

  for (const row of data) {
    totalBooksCount++;
    if (!isValidRow(row)) continue;
    // converting each bookName to Title Case
    const bookName = toTitleCase(row['Book Name'].trim().toUpperCase());
    const authorsRaw = row['Author Name'].trim();
    const publisher = row['Publisher'];
    const publishedYear = parseInt(row['Year']);
    const pages = parseInt(row['pages']);
    const category = row['Category'].toString().trim().toUpperCase();
    const cost = Math.ceil(parseFloat(row['Cost']));

    if (
      !bookName ||
      !authorsRaw ||
      !publisher ||
      isNaN(publishedYear) ||
      isNaN(pages) ||
      isNaN(cost) ||
      !category
    ) {
      continue;
    }

    if (!allCategories.includes(category)) {
      allCategories.push(category);
    }

    const authors = authorsRaw.split('/').map((author) => author.trim());

    let bookCode;
    if (seenBooks.has(bookName)) {
      bookCode = seenBooks.get(bookName);
    } else {
      bookCode = generateBookCode();
      seenBooks.set(bookName, bookCode);
    }

    try {
      await prisma.book.create({
        data: {
          name: bookName,
          authors,
          publisher,
          publishedYear,
          bookCode,
          category,
          pages,
          cost,
        },
      });
      totalSuccess++;
    } catch (error) {
      console.error(`❌ Failed to insert book: ${bookName}`, err);
    }
  }
  console.log(`Total Books Given: 1144`);
  console.log(`Total added successfully: ${totalSuccess}`);
}

async function UpdateCategories() {
  try {
    // await prisma.variables.();
    await prisma.variables.updateMany({
      data: {
        CATEGORIES: allCategories,
      },
    });
    console.log('Variables Updated Success');
  } catch (error) {
    console.log(error);
  }
}

export async function handleBooksSeeding() {
  await SeedBook();
  await UpdateCategories();
}

// // in case you want to seed it alone

// handleBooksSeeding()
//   .then(() => console.log("✅ Books Added Successfully"))
//   .catch((e) => console.log(`Seeding Error`, e))
//   .finally(async () => {
//     prisma.$disconnect();
// });
