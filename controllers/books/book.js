import prisma from '../../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid';

// helper functions
import { validateMember, getConstraints } from "../../lib/helpers.js"



// @@gives all the issued books
// can only be seen my admin and superadmin 
export const getAllBorrowedBooks = async (req, res) => {
    try {
        // const isValidUser = isAdmin(req) || isSuperAdmin(req);
        // if (!isValidUser) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }
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
                book:{
                    select:{
                        name:true,
                        id:true
                    }
                }

            },
        })



        return res.status(200).json({ message: "Borrowed Books Found", borrowedBooks: allBorrowedBooks })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


/**
 
A member can borrow a book. It should be approved and processed by the admin. 
Whenever a member wants to borrow a book, the admin will assign a book to a certain member.

Admin will search for name of the member and issue a book to him/her.
**/



export const addBook = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(400).json({ message: "Unauthorized Access" });
        // }

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
            name,
            authors,
            publisher,
            publishedYear,
            bookCode: uuid,
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

export const editBook = async (req, res) => {
    try {

        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(400).json({ message: "Unauthorized Access" });
        // }

        const { bookCode, name, authors, publisher, publishedYear, pages, cost, category, stock } = req.body


        if (!name || !publisher || !publishedYear || !category || !authors || pages <= 0 || cost <= 0 || stock <= 0 || !bookCode) {
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
            typeof stock !== "number" || stock < 0 // Stock can be 0 but not negative
        ) {
            return res.status(400).json({
                message: "Invalid data types or values provided"

            })
        };

        // Counting the availableStock in our database
        const availableStock = await prisma.book.count({
            where: {
                bookCode,
                available: true
            }
        })

        if (stock < availableStock) {
            return res.status(400).json({ message: "You are not allowed to remove a book. SuperAdmin Permission is required" });
        }
        // if (availableStock <= 0) 
        //     return res.status(400).json({ message: "Not available stock" });

        const addedStock = stock - availableStock;

        // If the stock value isnot changed and only fields are changed, changing the values for all the available stock.
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
            name,
            authors,
            publisher,
            publishedYear,
            bookCode,
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

export const borrowBook = async (req, res) => {
    try {

        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(400).json({ message: "Unauthorized Access" });
        // }

        // get the memberID and BookCode
        const { memberId, bookIds } = req.body

        if (!memberId || !bookIds) {

            return res.status(400).json({ message: "Please provide a valid memberId and valid array of bookIds" });
        }


        if (!Array.isArray(bookIds) || bookIds.length === 0) {
            return res.status(400).json({ message: "Please provide an array of valid bookIds. It must be an integer." });
        }

        let isInvalidId = false;

        bookIds.map((bookid) => {
            if (!Number.isInteger(bookid)) {
                isInvalidId = true;
            }
        })

        if (isInvalidId) {
            return res.status(400).json({ message: "Invalid data types in bookIds array" });
        }

        // check if the member exist
        const isValidMemberId = await validateMember(memberId)

        if (!isValidMemberId) {
            return res.status(400).json({ message: "Member doesnot exist. Please provide a valid memberId" });
        }

        const [BORROW_LIMIT, EXPIRY_DATE, CONSECUTIVE_BORROW_LIMIT_DAYS] = await getConstraints(req, res)

        // check the number of books member has already borrowed.
        const borrowedBooksCount = await prisma.member.findUnique({
            where: { id: memberId },
            select: {
                _count: {
                    select: { borrowedBooks: { where: { returned: false } } },
                },
            },
        });

        const countOfBorrowedBooks = borrowedBooksCount._count.borrowedBooks

        if (countOfBorrowedBooks >= BORROW_LIMIT) {
            return res.status(400).json({ message: `Borrow Limit Reached. The member has already borrowed ${BORROW_LIMIT} books. Please return the borrowed books first.` });
        }

        if (countOfBorrowedBooks + bookIds.length > BORROW_LIMIT) {
            console.log(countOfBorrowedBooks, BORROW_LIMIT)
            return res.status(400).json({
                message: `Limit Exceeded. The member has already borrowed ${countOfBorrowedBooks} books.`,
                borrowedCount: countOfBorrowedBooks
            });
        }

        // Remove duplicate book IDs
        const uniqueBookIds = [...new Set(bookIds)];

        // Fetch available books along with recent borrow records for the member
        const books = await prisma.book.findMany({
            where: {
                id: { in: uniqueBookIds },
                available: true,
            },
            select: {
                id: true,
                borrowedBooks: {
                    where: {
                        memberId,
                        returnedDate: { gte: new Date(Date.now() - CONSECUTIVE_BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000) }
                    },
                    select: { id: true }
                }
            }
        });

        // Determine allowed and restricted books from the fetched results.
        const allowedBooksIds = [];
        const restrictedBooks = [];
        for (const book of books) {
            if (book.borrowedBooks.length > 0) {
                // Book was borrowed within the last week by this member.
                restrictedBooks.push(book.id);
            } else {
                allowedBooksIds.push(book.id);
            }
        }

        // invalidBooksIds: IDs that either don't exist or are not available.
        const fetchedBookIds = new Set(books.map(b => b.id));
        const invalidBooksIds = uniqueBookIds.filter(id => !fetchedBookIds.has(id));

        if (!allowedBooksIds.length) {
            return res.status(400).json({
                message: "You cannot borrow these books as you have borrowed them within the last week.",
                restrictedBooks
            });
        }

        // Create transactions only for allowed books.
        const transactions = allowedBooksIds.flatMap(bookId => [
            prisma.borrowedBook.create({
                data: {
                    bookId,
                    memberId,
                    expiryDate: new Date(Date.now() + EXPIRY_DATE * 24 * 60 * 60 * 1000),
                },
            }),
            prisma.book.updateMany({
                where: { id: bookId },
                data: { available: false },
            }),
        ]);

        const transactionResults = await prisma.$transaction(transactions);

        // Extract only the successfully borrowed books.
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

    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const returnBook = async (req, res) => {
    try {
        // bookIds is an array
        const { memberId, bookIds } = req.body;
        if (!memberId || !bookIds) {
            return res.status(400).json({ message: "Please provide both memberId and bookId" });
        }
        if (!Number.isInteger(memberId) || !Array.isArray(bookIds)) {
            return res.status(400).json({ message: "Invalid data types for memberId or bookIds" });

        }
        const isInvalidId = false;
        bookIds.map((bookId) => {
            if (!Number.isInteger(bookId) || bookId <= 0) {
                isInvalidId = true
            }
        })
        if (isInvalidId) {
            return res.status(400).json({ message: "Provide a valid data types for bookIds." });
        }

        const ismemberValid = validateMember(memberId);
        if (!ismemberValid) {
            return res.status(400).json({ message: "The member doesnot exist." });
        }

        const transactions = bookIds.flatMap(bookId => [
            prisma.borrowedBook.up({
                data: {
                    bookId,
                    memberId,
                    expiryDate: new Date(Date.now() + EXPIRY_DATE * 24 * 60 * 60 * 1000),
                },
            }),
            prisma.book.updateMany({
                where: { id: bookId },
                data: { available: false },
            }),
        ]);

        const [returnedBook] = await prisma.$transaction([
            prisma.borrowedBook.updateMany({
                where: {
                    bookId,
                },
                data: {
                    returned: true,
                    returnedDate: new Date(Date.now())
                }
            }),
            prisma.book.update({
                where: { id: bookId },
                data: {
                    available: true
                }
            })
        ])

        if (!returnedBook) {
            return res.status(400).json({ message: "Error while returning the book" });
        }

        return res.status(200).json({ message: "Book Returned Successfully", returnedBook });
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const renewBook = async () => {

}


export const deleteBook = async (req, res) => {
    try {

        const { bookId, bookIds, bookCode } = req.body;

        // If no valid identifier is provided, return an error.
        if (!bookId && !bookIds && !bookCode) {
            return res.status(400).json({
                message: "Please provide a bookId, an array of bookIds, or a bookCode."
            });
        }

        // Delete based on bookCode first if provided (deletes all copies with that code).
        if (bookCode) {
            const deleteResult = await prisma.book.deleteMany({
                where: { bookCode }
            });
            return res.status(200).json({
                message: `Deleted ${deleteResult.count} books with bookCode ${bookCode}.`
            });
        }

        // Next, if an array of bookIds is provided.
        if (Array.isArray(bookIds) && bookIds.length > 0) {
            const deleteResult = await prisma.book.deleteMany({
                where: { id: { in: bookIds } }
            });
            return res.status(200).json({
                message: `Deleted ${deleteResult.count} books based on the provided ids.`
            });
        }

        // Finally, if a single bookId is provided.
        if (bookId) {
            const deletedBook = await prisma.book.delete({
                where: { id: bookId }
            });
            return res.status(200).json({
                message: `Book with id ${bookId} successfully deleted.`,
                book: deletedBook
            });
        }
    } catch (error) {
        console.error("Error in deleteBook:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};