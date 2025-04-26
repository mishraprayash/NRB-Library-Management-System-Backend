import prisma from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid';
import fuzzy from "fuzzy"


import { validateMember, getDBConstraints, groupBooks } from "../lib/helpers.js"
import { sendResponse, sendError } from '../lib/responseHelper.js';
import { searchBorrowedBookSchema } from '../validation/schema.js';


/**
If we need to add a new book to the library, we can use this route.
- Cannot add same book that already exists with the same book name
- Can add multiple same books at the same time. For e.g  Alchemist (50 pieces)
*/

export const addBook = async (req, res) => {
    try {

        const { name, authors, publisher, publishedYear, pages, cost, category, stock } = req.body;

        // check if book already exist
        const bookExist = await prisma.book.findFirst({
            where: {
                AND: [
                    { name },
                    { publisher }
                ]
            }
        })
        if (bookExist) {
            return sendError(res, 404, "Book with same name already exists");
        }

        // create a random-id for bookCode
        const uuid = uuidv4();

        const upperCasedCategory = category.toUpperCase();

        // creating an array based on stock count
        const booksToAdd = Array.from({ length: stock }, () => ({
            bookCode: uuid,
            name,
            authors,
            publisher,
            publishedYear,
            cost,
            pages,
            category: upperCasedCategory
        }))

        // create multiple entries based on the stock value
        const addedBooks = await prisma.book.createMany({
            data: booksToAdd
        })

        return sendResponse(res, 200, "Books Added Successfully", { count: addedBooks.count });

        // return res.status(200).json({ message: `Book Added Successfully`, count: addedBooks.count });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/** 
When a member need to borrow a new book, the admin need to assign a book to that member.
*/
export const borrowBook = async (req, res) => {
    try {

        const { memberId, bookIds } = req.body;
        const removedDuplicateIds = Array.from(new Set(bookIds));

        const memberExists = await validateMember(memberId);
        if (!memberExists) {
            return res.status(400).json({ message: "Member does not exist. Please provide a valid memberId" });
        }
        // Get system constraints
        const [BORROW_LIMIT, EXPIRY_DATE] = await getDBConstraints(req, res);

        // Fetch already borrowed books for the member
        const booksBorrowedByAMember = await prisma.borrowedBook.findMany({
            where: {
                memberId,
                returned: false
            },
            include: {
                book: {
                    select: {
                        name: true,
                        id: true,
                        bookCode: true
                    }
                }
            }
        });

        // Check borrowing limit
        const countOfBorrowedBooks = booksBorrowedByAMember.length;
        if (countOfBorrowedBooks + bookIds.length > BORROW_LIMIT) {
            return res.status(400).json({
                message: `Limit Exceeded. The member has borrowed ${countOfBorrowedBooks} books. Remaining Borrow Limit: ${BORROW_LIMIT - countOfBorrowedBooks}`,
                borrowedCount: countOfBorrowedBooks
            });
        }

        // Create a set of bookCodes already borrowed by the member
        const alreadyBorrowedBookCodes = new Set(
            booksBorrowedByAMember.map(record => record.book.bookCode)
        );

        // Fetch books the member is trying to borrow
        const books = await prisma.book.findMany({
            where: {
                id: { in: removedDuplicateIds }
            },
            select: {
                id: true,
                name: true,
                bookCode: true,
            }
        });

        // Check for invalid bookIds
        const fetchedBookIds = new Set(books.map(book => book.id));
        const invalidBooksIds = bookIds.filter(id => !fetchedBookIds.has(id));

        // If no valid books found, return error
        if (books.length === 0) {
            return res.status(400).json({
                message: "No valid books found to borrow.",
                invalidBooksIds
            });
        }


        // Categorize books into allowed and restricted
        const allowedBooksIds = [];
        const restrictedBooks = [];

        for (const book of books) {
            if (alreadyBorrowedBookCodes.has(book.bookCode)) {
                restrictedBooks.push({
                    bookId: book.id,
                    message: "Book is already borrowed",
                    bookName: [book.name]
                });
            } else {
                allowedBooksIds.push({
                    bookId: book.id,
                    bookName: [book.name]
                });
            }
        }

        if (allowedBooksIds.length === 0) {
            return res.status(400).json({
                message: "You have already borrowed these books. Please return before borrowing again.",
                restrictedBooks,
                invalidBooksIds
            });
        }

        // Create transactions for allowed books
        const transactions = allowedBooksIds.flatMap(book => [
            prisma.borrowedBook.create({
                data: {
                    bookId: book.bookId,
                    memberId,
                    expiryDate: new Date(Date.now() + EXPIRY_DATE * 24 * 60 * 60 * 1000),
                },
                select: {
                    book: {
                        select: {
                            name: true
                        }
                    },
                    member: {
                        select: {
                            username: true
                        }
                    }
                }
            }),
            prisma.book.updateMany({
                where: { id: book.bookId },
                data: { available: false },
            }),
        ]);

        const transactionResults = await prisma.$transaction(transactions);

        // Extract successful borrows
        const successfulBorrows = [];
        for (let i = 0; i < transactionResults.length; i += 2) {
            if (transactionResults[i + 1].count > 0) {
                successfulBorrows.push(transactionResults[i]);
            }
        }

        return res.status(200).json({
            message: "Books Borrowed Successfully",
            borrowedBooks: successfulBorrows,
            invalidBooksIds,
            restrictedBooks
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
gives all the borrwed books list by all members.
admin or superadmin can access this route.

/api/v1/book/getallborrowed?b_name=some_value
*/

export const getAllBorrowedBooks = async (req, res) => {
    try {

        const parsed = searchBorrowedBookSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const { b_name, sort, page, sortBy, limit } = parsed.data;
        let where = {
            returned: false, expiryDate: {
                gte: new Date(Date.now())
            }
        };
        const borrowedBooks = await prisma.borrowedBook.findMany({
            where,
            orderBy: { [sortBy]: sort },
            include: {
                member: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                book: {}
            },
        })

        let filteredBooks = borrowedBooks;

        if (b_name) {
            const bookNames = borrowedBooks.map(book => book.book.name);
            const fuzzyBookResults = fuzzy.filter(b_name, bookNames);
            const matchedBooks = new Set(fuzzyBookResults.map(result => result.string));
            filteredBooks = filteredBooks.filter(book => matchedBooks.has(book.book.name));
        }

        const totalCount = filteredBooks.length;
        const totalPages = Math.ceil(totalCount / limit);

        const validPage = Math.max(1, Math.min(page, totalPages || 1));
        const skip = (validPage - 1) * limit;
        const paginatedBooks = filteredBooks.slice(skip, skip + limit);

        return res.status(200).json({
            message: 'Success',
            groupedBooks: paginatedBooks,
            pagination: {
                totalCount,
                totalPages,
                currentPage: validPage,
                hasNextPage: validPage < totalPages,
                hasPrevPage: validPage > 1
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/**
While returning a book, admin will return it from the member borrowed books list.
admin or superadmin can only access this route
*/

export const returnBook = async (req, res) => {
    try {
        const { memberId, bookIds } = req.body;

        // Validate member exists
        const isMemberValid = await validateMember(memberId);

        if (!isMemberValid) {
            return res.status(400).json({ message: "The member does not exist." });
        }

        const borrowedBooksByMember = await prisma.borrowedBook.findMany({
            where: {
                bookId: { in: bookIds },
                memberId,
                returned: false
            }
        })

        if (!borrowedBooksByMember.length) {
            return res.status(400).json({ message: "The member hasnot borrowed books with provided ids." });
        }

        await prisma.$transaction(async (tx) => {
            // Update borrowedBook table
            const updatedBorrowedBooks = await tx.borrowedBook.updateMany({
                where: {
                    bookId: { in: bookIds },
                    memberId: memberId,
                    returned: false
                },
                data: {
                    returned: true,
                    returnedDate: new Date(),
                    renewalCount: 0
                },
            });

            if (updatedBorrowedBooks.count === 0) {
                throw new Error('Error while returning books 1');
            }
            // Update book table to mark books as total
            const updateBook = await tx.book.updateMany({
                where: { id: { in: bookIds } },
                data: { available: true },
            });
            if (updateBook.count === 0) {
                throw new Error('Error while returning books 2');
            }
        });

        return res.status(200).json({ message: "Books returned successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/** 
* When renewning a book, admin will help renew the book following certain constraints.
*/
export const renewBook = async (req, res) => {
    try {
        const { memberId, bookIds } = req.body;
        if (!memberId || !bookIds) {
            return res.status(400).json({ message: "Please provide both memberId and bookId" });
        }
        if (!Number.isInteger(memberId) || !Array.isArray(bookIds)) {
            return res.status(400).json({ message: "Invalid data types for memberId or bookIds" });
        }

        // Validate bookIds are integers
        if (bookIds.some(bookId => !Number.isInteger(bookId) || bookId <= 0)) {
            return res.status(400).json({ message: "Provide valid bookIds." });
        }

        // Validate member
        const isMemberValid = await validateMember(memberId);
        if (!isMemberValid) {
            return res.status(400).json({ message: "The member doesnot exist." });
        }

        // Fetch all borrowed books for a member
        const borrowedBooksByMember = await prisma.borrowedBook.findMany({
            where: {
                bookId: { in: bookIds },
                memberId,
                returned: false,
            },
            select: {
                bookId: true,
                renewalCount: true,
                expiryDate: true,
                book: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!borrowedBooksByMember.length) {
            return res.status(400).json({ message: "The member hasnot borrowed books with provided ids." });
        }

        const [, EXPIRY_DATE, , MAX_RENEWAL_LIMIT] = await getDBConstraints();
        const invalidRenewalBooks = [];
        const validRenewalBooks = [];
        const failedRenew = [];
        const successfullRenews = [];

        // Check renewal count
        borrowedBooksByMember.forEach((book) => {
            if (book.renewalCount >= MAX_RENEWAL_LIMIT) {
                invalidRenewalBooks.push({ bookId: book.bookId, expiryDate: book.expiryDate, message: "Max renewal limit reached", bookName: book.book.name });
            } else {
                validRenewalBooks.push({ bookId: book.bookId, renewalCount: book.renewalCount, expiryDate: book.expiryDate, bookName: book.book.name });
            }
        });

        // if (!validRenewalBooks.length) {
        //     return res.status(400).json({ message: "The member hasnot borrowed these books" });
        // }

        // Current time for comparison
        // const now = new Date();
        // // Two days from now
        // const TWO_DAYS = 2;
        // const twoDaysFromNow = new Date(now.getTime() + TWO_DAYS * 24 * 60 * 60 * 1000);

        // Process renewals only if expiry date is within 2 days
        for (const validBook of validRenewalBooks) {
            // If the book's expiry date is more than 2 days away, skip renewal.
            // if (validBook.expiryDate > twoDaysFromNow) {
            //     invalidRenewalBooks.push({ bookId: validBook.bookId, expiryDate: validBook.expiryDate, message: "Cannot renew before 2 days of expiry date.", bookName: validBook.bookName });
            //     continue;
            // }
            const newExpiryDate = new Date(Date.now() + EXPIRY_DATE * 24 * 60 * 60 * 1000);
            const renewedBook = await prisma.borrowedBook.updateMany({
                where: {
                    bookId: validBook.bookId,
                    memberId,
                    returned: false
                },
                data: {
                    expiryDate: { set: newExpiryDate },
                    renewalCount: { increment: 1 }
                }
            });
            if (!renewedBook.count) {
                failedRenew.push({ message: "Book Renew Failed", bookId: validBook.bookId, bookName: validBook.bookName })
            }
            successfullRenews.push({ bookId: validBook.bookId, message: `Book with ${validBook.bookId} renewed successfully`, bookName: validBook.bookName });
        }

        if (!successfullRenews.length) {
            return res.status(400).json({
                message: "Book Renewal Failed",
                invalidRenewalBooks,
                failedRenew: failedRenew.length !== 0 ? failedRenew : []
            })
        }
        return res.status(200).json({
            message: `${successfullRenews.length} Books Renewed`,
            successfullRenews,
            invalidRenewalBooks,
            failedRenew
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/** 
This route is for deleting same book and all of them at once. For example there might be multiple same books in the library.
Only SuperAdmin can access this route
*/

export const deleteSameMultipleBook = async (req, res) => {
    try {
        const { bookCode } = req.body;
        if (!bookCode || typeof bookCode !== "string") {
            return res.status(400).json({ message: "Provide a valid bookCode." });
        }
        const bookExist = await prisma.book.findMany({
            where: {
                bookCode,
                available: true
            },

        })
        if (!bookExist.length) {
            return res.status(400).json({ message: "You cannot delete these books as they are assigned to someone." });
        }
        await prisma.book.deleteMany({
            where: {
                bookCode,
                available: true
            }
        })
        return res.status(200).json({ message: "Books Deleted Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

/**
This route is for deleting same books but with specific count. For example there might be 50 books which are same and you want to delete only 5 of them.
Only SuperAdmin can access this route
*/

export const deleteBookByCount = async (req, res) => {
    try {
        const { stock, bookCode } = req.body;

        const booksToDelete = await prisma.book.findMany({
            where: {
                bookCode,
                available: true
            },
            select: {
                id: true
            },
            take: stock
        })
        if (stock > booksToDelete.length) {
            return res.status(400).json({ message: `There are only ${booksToDelete.length} books available in the library` });
        }

        await prisma.$transaction(
            booksToDelete.map(book =>
                prisma.book.delete({
                    where: { id: book.id }
                })
            )
        );
        return res.status(200).json({ message: `${stock} Books Deleted Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/**
This route is for providing information to show in the admin and superadmin dashboard
Both Admin and SuperAdmin can access this route
*/
export const getDashBoardInfo = async (req, res) => {
    try {
        const now = new Date();

        // Get DB constraints
        const [MAX_BORROW_LIMIT, EXPIRYDATE, MAX_RENEWAL_LIMIT, CATEGORIES] = await getDBConstraints(req, res);

        // Get book stats
        const [booksByCategory, totalBooksCount, distinctBookNames, totalMemberCount, borrowedBooks] = await Promise.all([
            prisma.book.groupBy({
                by: ["category"],
                _count: { id: true },
            }),
            prisma.book.count(),
            prisma.book.findMany({
                distinct: ["name"],
                select: { name: true },
            }),
            prisma.member.count({
                where: { role: 'MEMBER' },
            }),
            prisma.borrowedBook.findMany({
                select: {
                    id: true,
                    returned: true,
                    expiryDate: true,
                    borrowedDate: true,
                    renewalCount: true,
                    book: {
                        select: { category: true },
                    },
                },
                orderBy: { borrowedDate: 'desc' },
            }),
        ]);

        const totalUniqueBooksCount = distinctBookNames.length;

        const { borrowedBooksMap, currentlyBorrowed, expired } = borrowedBooks.reduce(
            (acc, borrow) => {
                const category = borrow.book?.category;
                if (category) {
                    acc.borrowedBooksMap[category] = (acc.borrowedBooksMap[category] || 0) + 1;
                }

                if (!borrow.returned) {
                    acc.currentlyBorrowed.push(borrow);
                    if (borrow.expiryDate <= now) {
                        acc.expired.push(borrow);
                    }
                }

                return acc;
            },
            {
                borrowedBooksMap: {},
                currentlyBorrowed: [],
                expired: [],
            }
        );

        const categoryStats = booksByCategory.map(({ category, _count }) => ({
            category,
            totalCount: _count.id,
            borrowedCount: borrowedBooksMap[category] || 0,
        }));

        return res.status(200).json({
            message: "Details Fetched Successfully",
            countOfTotalBorrowed: borrowedBooks.length,
            countOfCurrentlyBorrowedBooks: currentlyBorrowed.length,
            countOfExpiredBooks: expired.length,
            totalBooksCount,
            totalUniqueBooksCount,
            expiredBooks: expired,
            categoryStats,
            totalMemberCount,
            variables: {
                MAX_BORROW_LIMIT,
                MAX_RENEWAL_LIMIT,
                EXPIRYDATE,
                CATEGORIES,
            },
        });
    } catch (error) {
        throw error;
    }
};

/**  
This route is for editing the book Details in case needed by the superadmin.
Only SuperAdmin can do this
*/
export const editBookUpdated = async (req, res) => {
    try {

        const { bookCode, name, authors, publisher, publishedYear, pages, cost, category } = req.body

        const bookExists = await prisma.book.findMany({
            where: {
                bookCode
            }
        })
        if (!bookExists.length) {
            return sendError(res, 400, "Book doesnot exist");
        }

        await prisma.book.updateMany({
            where: {
                bookCode
            },
            data: {
                name,
                authors,
                publisher,
                publishedYear,
                cost,
                pages,
                category: category.toUpperCase()
            }
        });

        return sendResponse(res, 200, 'Book Edited Successfully')

    } catch (error) {
        throw error;
    }
}


// add a book stock
export const addStock = async (req, res) => {
    try {
        const { bookCode, stock } = req.body;

        const bookExists = await prisma.book.findMany({
            where: {
                bookCode
            }
        })
        if (!bookExists.length) {
            return sendError(res,400,'Book doesnot exists');
        }
        const addedBook = Array.from({ length: stock }, () => ({
            bookCode,
            name: bookExists.name,
            authors: bookExists.authors,
            publisher: bookExists.publisher,
            publishedYear: bookExists.publishedYear,
            cost: bookExists.cost,
            pages: bookExists.pages,
            category: bookExists.category
        }))

        await prisma.book.createMany({ data: addedBook })
        return sendResponse(res,200,`${stock} stock added successfully`)

    } catch (error) {
       throw error;
    }
}

// get the top 10 recently added books

export const getRecentlyAddedBooks = async (req, res) => {
    try {
        const recentBooks = await prisma.book.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            distinct: ['name'],
            take: 10
        })
        if (!recentBooks.length) {
            return sendError(res, 400, "Book Not Found");
        }
        return sendResponse(res, 200, "Sucessfully Fetched Recent Books", { recentBooks });

    } catch (error) {
       throw error;
    }
}


// get all the expired books that are not yet returned
export const getExpiredBooks = async (req, res) => {
    try {
        const parsed = searchBorrowedBookSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const { b_name, sort, page, sortBy, limit } = parsed.data;

        let where = {
            returned: false, expiryDate: {
                lt: new Date(Date.now())
            }
        };

        const borrowedBooks = await prisma.borrowedBook.findMany({
            where,
            orderBy: { [sortBy]: sort },
            include: {
                member: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                book: {}
            },
        })

        let filteredBooks = borrowedBooks;

        if (b_name) {
            const bookNames = borrowedBooks.map(book => book.name);
            const fuzzyBookResults = fuzzy.filter(b_name, bookNames);
            const matchedBooks = new Set(fuzzyBookResults.map(result => result.string));
            filteredBooks = filteredBooks.filter(book => matchedBooks.has(book.name));
        }

        const totalCount = filteredBooks.length;
        const totalPages = Math.ceil(totalCount / limit);

        // always ensure the pagenumber is with a valid range
        const validPage = Math.max(1, Math.min(page, totalPages || 1));
        const skip = (validPage - 1) * limit;
        const paginatedBooks = filteredBooks.slice(skip, skip + limit);

        return sendResponse(res, 200, "Successfully fetched expired books", {
            expiredBooks: paginatedBooks, 
            pagination: {
                totalCount,
                totalPages,
                currentPage: validPage,
                hasNextPage: validPage < totalPages,
                hasPrevPage: validPage > 1
            },
        })
    } catch (error) {
        throw error;
    }
}