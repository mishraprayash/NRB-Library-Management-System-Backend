import prisma from "../lib/prisma.js"


// authentication required for these routes as well.

export const getBooks = async (req, res) => {
    try {

        const allBooks = await prisma.book.findMany();
       
        if (allBooks.length === 0) {
            return res.status(400).json({ message: "No books available" });
        }

        // Group books by bookCode
        const bookMap = new Map();

        allBooks.forEach(book => {
            if (bookMap.has(book.bookCode)) {
                bookMap.get(book.bookCode).count += 1;
            } else {
                bookMap.set(book.bookCode, { ...book, count: 1 });
            }
        });

        // Convert map values to an array
        const groupedBooks = Array.from(bookMap.values());

        return res.status(200).json({
            message: "Books Fetched Successfully",
            books: groupedBooks
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getBooksWithDuplication = async (req,res) => {
    try {
        const books = await prisma.book.findMany();
        if (!books.length) return res.status(400).json({ message: "No books available" });
        return res.status(200).json({ message: "Books Fetched Successfully", info: "Duplicates are also shown", books })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getAvailableBooks = async (req, res) => {
    try {
        const allAvailableBooks = await prisma.book.findMany({
            where: {
                available: true
            }
        })
        if (!allAvailableBooks) {
            return res.status(400).json({ message: "No available books" });
        }
        return res.status(200).json({ message: "Available Books Fetched Successfully", books: allAvailableBooks });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token")
        res.status(200).json({ message: "Logout Success" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });

    }
}
