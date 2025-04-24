
import xlsx from "xlsx";

import prisma from "../../lib/prisma.js";

import { v4 as uuidv4 } from "uuid";


function generateBookCode() {
  return uuidv4();
}

function isValidRow(row) {
  const requiredFields = ['Book Name', 'Author Name', 'Publisher', 'Year', 'pages', 'Cost', 'Category'];
  return requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field].toString().trim() !== '')
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

const allCategories = [];




async function SeedBook() {

  const workbook = xlsx.readFile('/Users/prayashmishra/nrb-internship/nrb-library/prisma/Seeds/BookList.xls');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

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
    let cost = Math.ceil(parseFloat(row['Cost']));

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

    const authors = authorsRaw.split('/').map(author => author.trim());

    let bookCode;
    if (seenBooks.has(bookName)) {
      bookCode = seenBooks.get(bookName);
    }
    else {
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
          cost
        }
      })
      totalSuccess++;
    } catch (error) {
      console.error(`Failed to insert book: ${bookName}`, err);
    }

  }
  console.log(`${totalBooksCount} Total Books`);
  console.log(`${totalSuccess} added Successfully`);
}

async function UpdateVariables() {
  try {
    await prisma.variables.deleteMany();
    await prisma.variables.create({
      data: {
        MAX_BORROW_LIMIT: 5,
        MAX_RENEWAL_LIMIT: 2,
        EXPIRYDATE: 15,
        CATEGORIES: allCategories
      }
    });
  } catch (error) {
    console.log(error);
  }
}

async function main() {
  await SeedBook();
  UpdateVariables().then(() => console.log(`Variables Updated Successfully`));
}


main()
  .catch(e => console.log(`Seeding Error`, e))
  .finally(async () => {
    prisma.$disconnect();
  })
