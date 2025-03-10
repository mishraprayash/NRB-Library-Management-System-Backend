import prisma from "../../lib/prisma.js"
import bcrypt from "bcryptjs";

import { validateMember } from "../../lib/helpers.js"
import { isAdmin, isSuperAdmin } from "../../lib/helpers.js";


export const getAllBooks = async (req, res) => {
    try {

        // const isAllowed = isAdmin(req) || isSuperAdmin(req);
        // if(!isAllowed){
        //     return res.status(403).json({message:"Unauthorized"})
        // }

        // Fetch all books with availability status
        const allBooks = await prisma.book.findMany();

        // Group books by bookCode
        const bookMap = new Map();

        allBooks.forEach(book => {
            if (!bookMap.has(book.bookCode)) {
                bookMap.set(book.bookCode, {
                    id: book.id,
                    bookCode: book.bookCode,
                    name: book.name,
                    authors: book.authors,
                    available: book.available,
                    pages: book.pages,
                    cost: book.cost,
                    publisher: book.publisher,
                    publishedYear: book.publishedYear,
                    category: book.category,
                    totalCount: 0,
                    availableCount: 0, 
                });
            }

            // Increment total count
            const bookEntry = bookMap.get(book.bookCode);
            bookEntry.totalCount += 1;

            // Increment available count if the book is available
            if (book.available) {
                bookEntry.availableCount += 1;
            }
        });

        // Convert map values to an array
        const groupedBooks = Array.from(bookMap.values());

        return res.status(200).json({
            message: "Books Fetched Successfully",
            books: groupedBooks
        });

    } catch (error) {
        console.error("Error fetching books:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getBooksWithDuplication = async (req, res) => {
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
        const allBooks = await prisma.book.findMany({
            where: {
                available: true
            }
        });

        // if (allBooks.length === 0) {
        //     return res.status(400).json({ message: "No books available" });
        // }

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
            message: "Available Books Fetched Successfully",
            books: groupedBooks
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getBooksForMember = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId) {
            return res.status(400).json({ message: "Please provide a valid memberId" });
        }
        if (!Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Invalid Data type for memberId. It must be an integer" });
        }
        const isMemberValid = await validateMember(memberId);
        if (!isMemberValid) {
            return res.status(400).json({ message: "The member doesnot exist" });
        }

        const borrowedBooks = await prisma.member.findMany({
            where: {
                id: memberId
            },
            select: {
                borrowedBooks: {
                    where: {
                        returned: false
                    },
                    include:{
                        book:{
                            select:{
                                name:true,
                                authors:true
                            }
                        }
                    }
                }
            }
        })

        return res.status(200).json({ message: "Book Borrowed Successfully", books:borrowedBooks })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const editProfileDetails = async (req, res) => {
    try {

        const { memberId, name, username, phoneNo, email } = req.body;
        if (!memberId || !name || !username || !phoneNo || !email) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        if (!Number.isInteger(memberId) || typeof name !== "string" || typeof username !== "string" || typeof phoneNo !== "string" || typeof email !== "string") {
            return res.status(400).json({ message: "Invalid data types" });
        }

        const memberExist = await prisma.member.findUnique({
            where: {
                id: memberId
            }
        })

        // validating member exists.
        if (!memberExist) {
            return res.status(400).json({ message: "Member doesnot exist" });
        }

        // validating changes have been made from the client side.
        if (
            memberExist.name === name &&
            memberExist.username === username &&
            memberExist.phoneNo === phoneNo &&
            memberExist.email === email
        ) {
            return res.status(400).json({ message: "Please update something before saving changes" });
        }

        const updateMember = await prisma.member.update({
            where: {
                id: memberId
            },
            data: {
                name,
                username,
                phoneNo,
                email
            }
        })

        if (!updateMember) {
            return res.status(400).json({ message: "Error while updating member" });
        }
        return res.status(200).json({ message: "Member Updated Successfully" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });

    }
}

export const resetPassword = async (req, res) => {
    try {
        const { memberId, oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword || typeof oldPassword !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({ message: "Please provide both old password and new password with valid values" });
        }

        const memberExist = await prisma.member.findUnique({
            where: {
                id: memberId
            }
        })
        if (!memberExist) {
            return res.status(400).json({ message: "Member not found" });
        }
        const isOldPasswordMatched = await bcrypt.compare(oldPassword, memberExist.password)
        if (!isOldPasswordMatched) {
            return res.status(400).json({ message: 'Old password doesnot match. Please contact admin for reseting your password' });
        }
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedMember = await prisma.member.update({
            where: {
                id: memberId
            },
            data: {
                password: {
                    set: newHashedPassword
                }
            }
        })
        if (!updatedMember) {
            return res.status(400).json({ message: "Error while updating password. Please contact admin for this." });
        }
        return res.status(200).json({ message: "Password Reset Successfully" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getProfile = async (req, res) => {
    try {
        const { memberId } = req.body;

        if (!memberId || !Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Please provide a memberId." })
        }

        const memberDetails = await prisma.member.findUnique({
            where: {
                id: memberId
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                createdAt: true
            }
        })

        if (!memberDetails) {
            return res.status(400).json({ message: "Member not found" });
        }
        return res.status(200).json({ message: "Member Fetched Successfully", memberDetails })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}