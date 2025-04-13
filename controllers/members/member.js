
import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import { getDBConstraints, validateMember } from "../../lib/helpers.js"
import { sendWelcomeNotification } from '../../services/emailService/emailWorker.js'


/*
SuperAdmin and Admin only
*/

export const getMembers = async (req, res) => {
    try {
        const allMembers = await prisma.member.findMany({
            where: {
                role: "MEMBER"
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                _count: {
                    select: {
                        borrowedBooks: {
                            where: {
                                returned: false
                            },
                        },

                    },
                },
            }
        });

        allMembers.sort((a, b) => b._count.borrowedBooks - a._count.borrowedBooks)

        return res.status(200).json({ message: "Members Fetched Successfuly", members: allMembers })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const addMember = async (req, res) => {
    try {

        const { name, username, email, password, phoneNo } = req.body;

        // query if user with same username or email already exists
        const memberExist = await prisma.member.findFirst({
            where: {
                OR: [
                    { username }, { email }, { phoneNo }
                ]
            }
        })

        if (memberExist) {
            return res.status(400).json({ message: "Username, email or phoneNo already exists" });
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create a new member if doesnot exists
        const addedMember = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo
            }
        })
        if (!addedMember) {
            return res.status(400).json({ message: "Error while adding member" });
        }

        await sendWelcomeNotification(email, username, password, addedMember.role);
        return res.status(200).json({
            message: "Member added successfully", member: {
                id: addedMember.id,
                name: addedMember.name,
                username: addedMember.username,
                email: addedMember.email,
                phoneNo: addedMember.phoneNo,
                createdAt: addedMember.createdAt
            }
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const editMemberDetails = async (req, res) => {
    try {

        const { memberId, name, username, phoneNo, email, password } = req.body;
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

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const updateMember = await prisma.member.update({
                where: {
                    id: memberId
                },
                data: {
                    name,
                    username,
                    phoneNo,
                    email,
                    password: hashedPassword
                }
            })
            if (!updateMember) {
                return res.status(400).json({ message: "Error while updating member details" });
            }
            return res.status(200).json({ message: "Member Updated Successfully along with password" });

        }
        else {
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

        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/**
SuperAdmin only
*/
export const deleteMember = async (req, res) => {
    try {
        const { memberId } = req.body;

        if (!memberId || !Number.isInteger(memberId)) {
            return res.status(500).json({ message: "Please provide a valid memberId" })
        }
        const memberExist = await validateMember(memberId);

        if (!memberExist) {
            return res.status(400).json({ message: `Member with this id ${memberId} doesnot exist` });
        }

        const deletedMember = await prisma.member.delete({
            where: {
                id: memberId
            }
        })

        if (!deletedMember) {
            return res.status(400).json({ message: 'Error while deleting member' });
        }

        return res.status(200).json({ message: "Member Deleted Successfully" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }

}

/**
Fetching dashboard info for a member.
*/

export const getDashboardDetails = async (req, res) => {
    try {

        const [, EXPIRY_DATE] = await getDBConstraints(req, res);

        // Fetch all relevant data in a single query
        const borrowedBooks = await prisma.borrowedBook.findMany({
            where: { memberId: req.user.id },
            select: {
                id: true,
                returned: true,
                expiryDate: true,
                borrowedDate: true,
                renewalCount: true,
                book: {
                    select: {
                        name: true,
                        authors: true,
                        publisher: true,
                    }
                }
            },
            orderBy: {
                borrowedDate: 'desc'
            }
        });

        let countOfTotalBorrowed = borrowedBooks.length;
        let currentlyBorrowedBooks = [];
        let expiredBooks = [];

        borrowedBooks.forEach((borrow) => {
            if (!borrow.returned) {
                currentlyBorrowedBooks.push(borrow);
                if (borrow.expiryDate <= new Date()) {
                    expiredBooks.push(borrow);
                }
            }
        });

        return res.status(200).json({
            message: "Details Fetched Successfully",
            countOfTotalBorrowed,
            countOfCurrentlyBorrowedBooks: currentlyBorrowedBooks.length,
            countOfExpiredBooks: expiredBooks.length,
            expiredBooks,
            currentlyBorrowedBooks
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
Fetching past borrowed books for a member.
*/
export const getPastBorrowedBooks = async (req, res) => {
    try {

        const pastBorrowedBooks = await prisma.borrowedBook.findMany({
            where: {
                memberId: req.user.id,
                returned: true
            },
            select: {
                id: true,
                returnedDate: true,
                borrowedDate: true,
                expiryDate: true,
                book: {
                    select: {
                        name: true,
                        authors: true,
                        publisher: true
                    }
                }
            },
            orderBy: {
                borrowedDate: "desc"
            }
        })

        return res.status(200).json({ message: "History Fetched Successfully", historyBooks: pastBorrowedBooks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}








