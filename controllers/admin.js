
import prisma from '../lib/prisma.js'
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_LIFETIME = process.env.JWT_LIFETIME
const NODE_ENV = process.env.NODE_ENV


// validate if the user is admin
function isAdmin(req) {
    if (req.user.role === "ADMIN") {
        return true
    }
    else {
        return false
    }
}
// validate if the user is superadmin
function isSuperAdmin(req) {
    if (req.user.role === "SUPERADMIN") {
        return true
    }
    else {
        return false
    }
}

function setCookie(res, accessToken, age) {
    if (NODE_ENV === "development") {
        res.cookie("token", accessToken, {
            // can only be accessed by server requests
            httpOnly: true,
            // path = where the cookie is valid
            // path: "/",
            // domain = what domain the cookie is valid on
            // domain: "localhost",
            // secure = only send cookie over https
            secure: false,
            // sameSite = only send cookie if the request is coming from the same origin
            sameSite: "lax", // "strict" | "lax" | "none" (secure must be true)
            maxAge: age
        });
    }
    if (NODE_ENV === "production") {
        res.cookie("token", accessToken, {
            // can only be accessed by server requests
            httpOnly: true,
            // path = where the cookie is valid
            path: "/",
            // secure = only send cookie over https
            secure: true,
            // sameSite = only send cookie if the request is coming from the same origin
            sameSite: "none", // "strict" | "lax" | "none" (secure must be true)
            // maxAge = how long the cookie is valid for in milliseconds
            maxAge: age, // 1 hour
        });
    }
    return res;
}

async function validateMember(memberID) {
    const memberExist = await prisma.member.findUnique({
        where: {
            id: memberID
        }
    })
    if (!memberExist) {
        return false;
    }
    return true;
}

export const register = async (req, res) => {
    try {
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !password || !phoneNo || !email) {
            return res.status(400).json({
                message: "Please provide all required details"
            })
        }
        const adminCount = await prisma.member.count({
            where: {
                role: "ADMIN"
            }
        })
        if (adminCount > 0) {
            return res.status(400).json({ message: 'Admin already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10);


        const admin = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo,
                role: 'ADMIN'
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "Error while creating admin" });
        }
        return res.status(200).json({ message: "Admin Created Successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const login = async (req, res) => {
    try {

        const { username, password } = req.body;
        // if (!username || !password) {
        //     return res.status(400).json({ message: "Username and password both are required" });
        // }
        console.log(username,password)
        const admin = await prisma.member.findUnique({
            where: {
                username
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "No user found" });
        }
        const isPasswordMatched = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const accessToken = jwt.sign({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        }, JWT_SECRET, { expiresIn: JWT_LIFETIME })

        const cookieExpiryDate = 7 * 24 * 60 * 60

        setCookie(res, accessToken, cookieExpiryDate);

        return res.status(200).json({ message: 'Login Successfully',username:username, token: accessToken })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


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
            }
        })
        if (!allBorrowedBooks.length) {
            return res.status(400).json({ message: "No any books have been borrowed" });
        }
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

export const borrowBook = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(400).json({ message: "Unauthorized Access" });
        // }
        // get the memberID and BookCode
        const { memberId, bookId } = req.body

        if (!memberId || !bookId) {
            return res.status(400).json({ message: "Please provide memberId and bookCode" })
        }

        // check if the member exist
        const isValidMemberId = validateMember(memberId)

        if (!isValidMemberId) {
            return res.status(400).json({ message: "Member doesnot exist. Please provide a valid memberId" });
        }

        // check the number of books member has already borrowed.
        const borrowedBooksCount = await prisma.member.findUnique({
            where: { id: memberId },
            select: {
                _count: {
                    select: { borrowedBooks: { where: { returned: false } } },
                },
            },
        });

        const VARIABLES = await prisma.variables.findFirst({});

        if (borrowedBooksCount >= VARIABLES.MAX_BOOK_LIMIT) {
            return res.status(400).json({ message: `Borrow Limit Reached. The member has already borrowed ${VARIABLES.MAX_BOOK_LIMIT} books` });
        }

        // db query to check if the book is available or not.
        const isBookAvailable = await prisma.book.findUnique({
            where: {
                bookId,
                available: true
            }
        })

        if (!isBookAvailable) {
            return res.status(400).json({ message: "Soryy, the book is not currently available" });
        }

        // create a row in the borrowed book
        const borrowedBook = await prisma.borrowedBook.create({
            data: {
                bookId: isBookAvailable.id,
                memberId,
                expiryDate: new Date(Date.now() + VARIABLES.EXPIRYDATE * 24 * 60 * 60)

            }
        })

        if (!borrowedBook) {
            return res.status(400).json({ message: "Error while borroring book" });
        }

        // make this book unavailable after successfull borrow.
        await prisma.book.update({
            where: { id: bookId },
            data: {
                available: false
            }
        })

        return res.status(200).json({ message: "Book Successfuly Borrowed" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const returnBorroweddBook = async () => {

}

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
                    { publisher },
                ]
            }
        })
        if (bookExist) {
            return res.status(400).json({ message: "Book Already Exist. If you have to add the same book, increase the stock value from the edit option" });
        }
        // create a random-id for bookCode
        const uuid = uuidv4();

        // create multiple entries based on the stock value
        const addedBooks = await prisma.book.createMany({
            data: Array(stock).fill({
                name,
                authors,
                publisher,
                publishedYear,
                bookCode: uuid,
                cost,
                pages,
                category: category.toUpperCase()
            })
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


        const { bookId, bookCode, name, authors, publisher, publishedYear, pages, cost, category, stock } = req.body


        if (!name || !publisher || !publishedYear || !category || !authors || pages <= 0 || cost <= 0 || stock <= 0 || !bookCode) {
            return res.status(400).json({ message: "Please provided valid values for fields" });
        }

        if (
            typeof bookId !== "number" ||
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

        // check if the book exist in the library
        // const bookExist = await prisma.book.findMany({
        //     where: {
        //         bookCode,
        //         available: true
        //     }
        // })

        // if (!bookExist) {
        //     return res.status(400).json({ message: "Book is not available in the library" });
        // }

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
                category
            }
        });

        /*
        For the new added stock, creating a new entry with the same bookCode. 
        */
        await prisma.book.createMany({
            data: Array(addedStock).fill({
                name,
                authors,
                publisher,
                publishedYear,
                bookCode,
                cost,
                pages,
                category
            })
        })

        return res.json({ message: "Book Updated Successfully" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getMembers = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }
        const allMembers = await prisma.member.findMany({
            where: {
                role: "MEMBER"
            }
        });
        if (allMembers.length <= 0) {
            return res.status(400).json({ message: "No any members for now" });
        }
        return res.status(200).json({ message: "Members Fetched Successfuly", members: allMembers })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }

}

export const addMember = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !email || !password || !phoneNo) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        // query if user with same username or email already exists
        const memberExist = await prisma.member.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        })

        if (memberExist) {
            return res.status(400).json({ message: "Username or email already exists" });
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create a new member if doesnot exists
        await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo
            }
        })
        return res.status(200).json({ message: "Member added successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });

    }

}

export const deleteMember = async (req, res) => {
    try {
        // const isUserAuthenticated = isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });

        // }
        const { memberId } = req.body;
        if (!memberId) {
            return res.status(400).json({ message: "Invalid Member Id" });
        }
        const memberExist = await prisma.member.findUnique({
            where: {
                id
            }
        })
        if (!memberExist) {
            return res.status(400).json({ message: "Member doesnot exist" });

        }
        // delete a member
        await prisma.member.delete({
            where: {
                id
            }
        })
        return res.status(200).json({ message: "Successfully Deleted Member" });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });

    }

}


export const createVariables = async (req, res) => {
    try {
        const { MAX_BOOK_LIMIT, MAX_RENEWAL_LIMIT, BOOK_EXPIRY_DATE } = req.body
        if (!MAX_BOOK_LIMIT || !MAX_RENEWAL_LIMIT || !BOOK_EXPIRY_DATE) {
            return res.status(400).json({ message: "Please provide MAX_BOOK_LIMIT, MAX_RENEWAL_LIMIT and BOOK_EXPIRY_DATE" })
        }
        const rowExist = await prisma.variables.findMany();
        if (rowExist.length) {
            return res.status(400).json({ message: "Variables is already created. You can only update now." })
        }
        await prisma.variables.create({
            data: {
                MAX_BOOK_LIMIT,
                MAX_RENEWAL_LIMIT,
                EXPIRYDATE: BOOK_EXPIRY_DATE
            }
        })
        return res.status(200).json({ message: "Varibales Created Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateVariables = async (req, res) => {
    try {
        const { id, MAX_BOOK_LIMIT, MAX_RENEWAL_LIMIT, BOOK_EXPIRY_DATE } = req.body
        if (!id || !MAX_BOOK_LIMIT || !MAX_RENEWAL_LIMIT || !BOOK_EXPIRY_DATE) {
            return res.status(400).json({ message: "Please provide id, MAX_BOOK_LIMIT, MAX_RENEWAL_LIMIT and BOOK_EXPIRY_DATE" })
        }
        const rowExist = await prisma.variables.findUnique({
            where: { id }
        })
        if (!rowExist) {
            return res.status(400).json({ message: "Invalid ID or variable doesnot exist" });
        }
        await prisma.variables.update({
            where: { id },
            data: {
                MAX_BOOK_LIMIT,
                MAX_RENEWAL_LIMIT,
                EXPIRYDATE: BOOK_EXPIRY_DATE
            }
        })
        return res.status(200).json({ message: "Varibales Updated Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getVariables = async (req, res) => {
    try {
        const VARIABLES = await prisma.variables.findFirst()
        return res.status(200).json({ message: "Varibales Fetched Successfully", variables: VARIABLES });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}