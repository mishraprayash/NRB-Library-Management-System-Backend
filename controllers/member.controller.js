
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { getDBConstraints, groupBooks, validateMember } from "../lib/helpers.js"
import { sendVerificationEmail, sendWelcomeNotification } from '../services/emailService/emailSender.js'
import { sendError, sendResponse } from "../lib/responseHelper.js";


/*
SuperAdmin and Admin only
*/

export const getMembers = async (req, res) => {
    try {
        const allMembers = await prisma.member.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                designation: true,
                role: true,
                isActive: true,
                isEmailVerified: true,
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

        const { name, username, email, password, phoneNo, designation } = req.body;

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
                phoneNo,
                designation
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

        const { memberId, name, username, phoneNo, email, password, designation } = req.body;

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
                    designation,
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
                    email,
                    designation
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

        const memberExist = await validateMember(memberId);

        if (!memberExist) {
            return sendResponse(res,200,`Member with this id ${memberId} doesnot exist`);
        }

        const borrowedBooks = await prisma.borrowedBook.findMany({
            where: {
                memberId,
                returned:false
            }
        })

        if (borrowedBooks.length) {
            return sendError(res, 400, "Cannot delete. The Member has remainig books to return")
        }
        await prisma.member.delete({
            where: {
                id: memberId
            }
        })
        return sendResponse(res, 200, "Member Deleted Successfully");
    }
    catch (error) {
        throw error;
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
            include: {
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
            include: {
                book: {}
            },
            orderBy: {
                borrowedDate: 'desc'
            },
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

        const groupedCurrentlyBorrowedBooks = groupBooks(currentlyBorrowedBooks);

        return res.status(200).json({
            message: "Details Fetched Successfully",
            countOfTotalBorrowed,
            countOfCurrentlyBorrowedBooks: currentlyBorrowedBooks.length,
            countOfExpiredBooks: expiredBooks.length,
            expiredBooks,
            currentlyBorrowedBooks: groupedCurrentlyBorrowedBooks
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
        throw error
    }
}

// get all the admin information
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await prisma.member.findMany({
            where: {
                role: "ADMIN",
            },
            select: {
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                designation: true,
                isActive: true,
                isEmailVerified: true,
                createdAt: true
            }
        })
        return sendResponse(res, 200, 'Successuly Fetched Admins', { admins })
    } catch (error) {
        throw error;
    }
}

export const deactivateMember = async (req, res) => {
    try {
        const { username } = req.body;
        const memberExists = await prisma.member.findUnique({
            where: { username }
        })
        if (!memberExists.isActive) {
            return sendError(res, 400, `${memberExists.role} is already deactivated`);
        }
        await prisma.member.update({
            where: { username },
            data: {
                isActive: false
            }
        })
        return sendResponse(res, 200, `Successfully deactivated ${memberExists.role}`);
    } catch (error) {
        throw error;
    }
}

export const activateMember = async (req, res) => {
    try {
        const { username } = req.body;
        const memberExists = await prisma.member.findUnique({
            where: { username }
        })
        if (memberExists.isActive) {
            return sendError(res, 400, `${memberExists.role} is already active`);
        }
        await prisma.member.update({
            where: { username },
            data: {
                isActive: true
            }
        })
        return sendResponse(res, 200, `Successfully activated ${memberExists.role}`);
    } catch (error) {
        throw error;
    }
}
