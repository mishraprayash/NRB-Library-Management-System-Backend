import prisma from '../../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid';


import { validateMember, getDBConstraints } from "../../lib/helpers.js"

/**
If we need to add a new book to the library, we can use this route.
- Cannot add same book that already exists with the same book name
- Can add multiple same books at the same time. For e.g  Alchemist (50 pieces)
*/

export const addBook = async (req, res) => {
    try {

        const { name, authors, publisher, publishedYear, pages, cost, category, stock } = req.body

        if (!name || !publisher || !publishedYear || !authors || pages <= 0 || cost <= 0 || stock <= 0 || !category) {
            return res.status(400).json({ message: "Please provided valid values for fields" });
        }

        // Type validation
        if (
            typeof name !== "string" ||
            typeof publisher !== "string" ||
            typeof category !== "string" ||
            !Array.isArray(authors) || authors.length === 0 || // Authors should be an array with at least one element
            typeof publishedYear !== "number" ||
            typeof pages !== "number" || pages <= 0 ||
            typeof cost !== "number" || cost <= 0 ||
            typeof stock !== "number" || stock < 0 // Stock can be 0 but not negative
        ) {
            return res.status(400).json({ message: "Invalid data types or values provided" });
        }

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
            return res.status(400).json({ message: "Book Already Exist. If you have to add the same book, increase the stock value from the edit option" });
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

        return res.status(200).json({ message: `Book Added Successfully`, count: addedBooks.count });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/** 
If needed to change any details later if there are any typos, this route can
be used to edit the information. 
- If you change one book, then the details for all same book in the library will be changed.  
*/

export const editBook = async (req, res) => {
    try {

        const { bookCode, name, authors, publisher, publishedYear, pages, cost, category, stock } = req.body

        if (!name || !publisher || !publishedYear || !category || !authors || pages <= 0 || cost <= 0 || stock < 0 || !bookCode) {
            return res.status(400).json({ message: "Please provided valid values for fields" });
        }

        if (
            typeof bookCode !== "string" ||
            typeof name !== "string" ||
            typeof publisher !== "string" ||
            typeof category !== "string" ||
            !Array.isArray(authors) || authors.length === 0 ||
            typeof publishedYear !== "number" ||
            typeof pages !== "number" || pages <= 0 ||
            typeof cost !== "number" || cost <= 0 ||
            typeof stock !== "number" || stock < 0
        ) {
            return res.status(400).json({
                message: "Invalid data types or values provided"

            })
        };

        // Counting the totalStock in our database
        const totalStock = await prisma.book.count({
            where: {
                bookCode,
            }
        })

        if (stock < totalStock) {
            return res.status(400).json({ message: "You are not allowed to remove a book. SuperAdmin Permission is required. Use the delete method for removing books." });
        }

        const addedStock = stock - totalStock;

        // If the stock value isnot changed and only fields are changed, changing the values for all the total stock.
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

        /*
        For the new added stock, creating a new entry with the same bookCode. 
        */
        const upperCasedCategory = category.toUpperCase();
        const booksToAdd = Array.from({ length: addedStock }, () => ({
            bookCode,
            name,
            authors,
            publisher,
            publishedYear,
            cost,
            pages,
            category: upperCasedCategory
        }))

        await prisma.book.createMany({
            data: booksToAdd
        })

        return res.json({ message: "Book Updated Successfully" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/** 
When a member need to borrow a new book, the admin need to assign a book to that member.
*/
export const borrowBook = async (req, res) => {
    try {
        const { memberId, bookIds } = req.body;

        // Validate input
        if (!memberId || !Array.isArray(bookIds) || bookIds.length === 0) {
            return res.status(400).json({ message: "Invalid memberId or bookIds." });
        }
        if (bookIds.some(id => !Number.isInteger(id))) {
            return res.status(400).json({ message: "All bookIds must be integers." });
        }

        // Check if member exists
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
                id: { in: bookIds }
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

        // Collect bookCodes to check for recent returns
        const bookCodesToCheck = books.map(book => book.bookCode);

        // Check if any of these bookCodes were recently returned by the member
        const recentlyReturnedBooks = await prisma.borrowedBook.findMany({
            where: {
                memberId,
                returned: true,
                returnedDate: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                book: {
                    bookCode: {
                        in: bookCodesToCheck
                    }
                }
            },
            select: {
                book: {
                    select: {
                        bookCode: true
                    }
                }
            }
        });

        const restrictedBookCodes = new Set(
            recentlyReturnedBooks.map(entry => entry.book.bookCode)
        );

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
            } else if (restrictedBookCodes.has(book.bookCode)) {
                restrictedBooks.push({
                    bookId: book.id,
                    message: "A book with the same code was returned within the last week.",
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
                message: "You cannot borrow these books due to existing borrows or recent returns.",
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
*/

export const getAllBorrowedBooks = async (req, res) => {
    try {

        const allBorrowedBooks = await prisma.borrowedBook.findMany({
            where: {
                returned: false
            },
            include: {
                member: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                book: {
                    select: {
                        name: true,
                        authors: true
                    }
                }

            },
        })
        return res.status(200).json({ message: "Borrowed Books Found", borrowedBooks: allBorrowedBooks })
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

        if (!memberId || !bookIds) {
            return res.status(400).json({ message: "Please provide both memberId and bookIds" });
        }
        if (!Number.isInteger(memberId) || !Array.isArray(bookIds)) {
            return res.status(400).json({ message: "Invalid data types for memberId or bookIds" });
        }

        // Validate bookIds are integers
        if (bookIds.some(bookId => !Number.isInteger(bookId) || bookId <= 0)) {
            return res.status(400).json({ message: "Provide valid bookIds." });
        }

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
                throw new Error('Error while returning books');
            }
            // Update book table to mark books as total
            const updateBook = await tx.book.updateMany({
                where: { id: { in: bookIds }, available: false },
                data: { available: true },
            });
            if (updateBook.count === 0) {
                throw new Error('Error while returning books');
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
        console.log("Error", error);
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
            }
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
        const { count, bookCode } = req.body;
        if (!count || count <= 0 || !bookCode || typeof bookCode !== "string") {
            return res.status(400).json({ message: "Please provide count>0 and valid bookCode" });
        }
        const availableBooks = await prisma.book.findMany({
            where: {
                bookCode,
                available: true
            }
        })
        if (count > availableBooks.length) {
            return res.status(400).json({ message: `You cannot delete more than ${availableBooks.length} as other books are borrowed by the members` });
        }

        await Promise.all(
            Array.from({ length: count }).map(async () => {
                return prisma.book.delete({
                    where: {
                        bookCode,
                        available: true
                    }
                });
            })
        );
        return res.status(200).json({ message: `${count} Books Deleted Successfully` });

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

        // get DB constraints
        const [MAX_BORROW_LIMIT, EXPIRYDATE, CONSECUTIVE_BORROW_LIMIT_DAYS, MAX_RENEWAL_LIMIT, CATEGORIES] =  await getDBConstraints();

        // Get all books count by category
        const totalBooksByCategory = await prisma.book.groupBy({
            by: ["category"],
            _count: { id: true },
        });

        // Convert total books data to a map for quick lookup
        let totalBooksMap = {};
        totalBooksByCategory.forEach(({ category, _count }) => {
            totalBooksMap[category] = _count.id;
        });

        // Fetch borrowed books
        const borrowedBooks = await prisma.borrowedBook.findMany({
            select: {
                id: true,
                returned: true,
                expiryDate: true,
                borrowedDate: true,
                renewalCount: true,
                book: {
                    select: {
                        category: true
                    }
                }
            },
            orderBy: {
                borrowedDate: 'desc'
            }
        });

        // Initialize counts
        let countOfTotalBorrowed = borrowedBooks.length;
        let currentlyBorrowedBooks = [];
        let expiredBooks = [];
        let borrowedBooksMap = {}; // Stores borrowed book counts per category

        borrowedBooks.forEach((borrow) => {
            const category = borrow.book.category;

            if (category) {
                borrowedBooksMap[category] = (borrowedBooksMap[category] || 0) + 1;
            }

            if (!borrow.returned) {
                currentlyBorrowedBooks.push(borrow);
                if (borrow.expiryDate <= new Date()) {
                    expiredBooks.push(borrow);
                }
            }
        });

        // Build the response array for categories
        const categoryStats = Object.keys(totalBooksMap).map(category => ({
            category,
            totalCount: totalBooksMap[category] || 0,
            borrowedCount: borrowedBooksMap[category] || 0
        }));

        return res.status(200).json({
            message: "Details Fetched Successfully",
            countOfTotalBorrowed,
            countOfCurrentlyBorrowedBooks: currentlyBorrowedBooks.length,
            countOfExpiredBooks: expiredBooks.length,
            expiredBooks,
            categoryStats,
            variables: {
                MAX_BORROW_LIMIT,
                MAX_RENEWAL_LIMIT,
                EXPIRYDATE,
                CONSECUTIVE_BORROW_LIMIT_DAYS,
                CATEGORIES
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching details", error });
    }
};

/**  
This route is for editing the book Details in case needed by the superadmin.
Only SuperAdmin can do this
*/
export const editBookUpdated = async (req, res) => {
    try {

        const { bookCode, name, authors, publisher, publishedYear, pages, cost, category } = req.body

        if (!name || !publisher || !publishedYear || !category || !authors || pages <= 0 || cost <= 0 || !bookCode) {
            return res.status(400).json({ message: "Please provided valid values for fields" });
        }

        if (
            typeof bookCode !== "string" ||
            typeof name !== "string" ||
            typeof publisher !== "string" ||
            typeof category !== "string" ||
            !Array.isArray(authors) || authors.length === 0 ||
            typeof publishedYear !== "number" ||
            typeof pages !== "number" || pages <= 0 ||
            typeof cost !== "number" || cost <= 0
        ) {
            return res.status(400).json({
                message: "Invalid data types or values provided"

            })
        };

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

        return res.json({ message: "Book Updated Successfully" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const addStock = async (req, res) => {
    try {
        const { bookCode, stock } = req;
        if (!bookCode || typeof bookCode !== "string" || !stock || !Number.isInteger(stock) || stock <= 0) {
            return res.status(400).json({ message: "Please provide a valid bookCode and additional stock value" })
        }

        const bookData = await prisma.book.findFirst({
            where: {
                bookCode
            }
        })
        if (!bookData) {
            return res.status(400).json({ message: "Invalid book code" });
        }
        const addedData = Array.from({ length: stock }, () => ({
            bookCode,
            name: bookData.name,
            authors: bookData.authors,
            publisher: bookData.publisher,
            publishedYear: bookData.publishedYear,
            cost: bookData.cost,
            pages: bookData.pages,
            category: bookData.category
        }))
    
        await prisma.book.createMany({ data: addedData })
        return res.status(200).json({ message: `${stock} stock added successfully` });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


