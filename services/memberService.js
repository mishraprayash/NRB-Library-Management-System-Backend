import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { validateMember } from "../lib/helpers.js";
import { sendWelcomeNotification } from './emailService/emailWorker.js';

const SALT_ROUNDS = 10;

/**
 * Get all members with their borrowed book counts
 * @returns {Promise<Array>} Array of members with their details
 */
export const getAllMembers = async () => {
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

        allMembers.sort((a, b) => b._count.borrowedBooks - a._count.borrowedBooks);
        return allMembers;
    } catch (error) {
        console.error('Error getting all members:', error);
        throw error;
    }
};

/**
 * Add a new member
 * @param {Object} memberData - Member data including name, username, email, password, phoneNo
 * @returns {Promise<Object>} Created member object
 */
export const addMember = async (memberData) => {
    try {
        const { name, username, email, password, phoneNo } = memberData;

        const memberExist = await prisma.member.findFirst({
            where: {
                OR: [
                    { username }, { email }, { phoneNo }
                ]
            }
        });

        if (memberExist) {
            throw new Error("Username, email or phoneNo already exists");
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const addedMember = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo
            }
        });

        if (!addedMember) {
            throw new Error("Error while adding member");
        }

        // Fire and forget welcome email
        sendWelcomeNotification(email, username, password, addedMember.role)
            .catch((error) => {
                console.error(`Error sending welcome email to ${email}:`, error);
            });
        
        return {
            id: addedMember.id,
            name: addedMember.name,
            username: addedMember.username,
            email: addedMember.email,
            phoneNo: addedMember.phoneNo,
            createdAt: addedMember.createdAt
        };
    } catch (error) {
        console.error('Error adding member:', error);
        throw error;
    }
};

/**
 * Edit member details
 * @param {number} memberId - ID of the member to update
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object>} Updated member object
 */
export const editMember = async (memberId, memberData) => {
    try {
        const { name, username, phoneNo, email, password } = memberData;

        const memberExist = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!memberExist) {
            throw new Error("Member does not exist");
        }

        const updateData = {
            name,
            username,
            phoneNo,
            email
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const updatedMember = await prisma.member.update({
            where: { id: memberId },
            data: updateData
        });

        if (!updatedMember) {
            throw new Error("Error while updating member");
        }

        return updatedMember;
    } catch (error) {
        console.error('Error editing member:', error);
        throw error;
    }
};

/**
 * Delete a member
 * @param {number} memberId - ID of the member to delete
 * @returns {Promise<Object>} Deleted member object
 */
export const deleteMember = async (memberId) => {
    try {
        const memberExist = await validateMember(memberId);

        if (!memberExist) {
            throw new Error(`Member with id ${memberId} does not exist`);
        }

        const deletedMember = await prisma.member.delete({
            where: { id: memberId }
        });

        if (!deletedMember) {
            throw new Error('Error while deleting member');
        }

        return deletedMember;
    } catch (error) {
        console.error('Error deleting member:', error);
        throw error;
    }
};

/**
 * Get dashboard details for a member
 * @param {number} memberId - ID of the member
 * @param {Date} expiryDate - Expiry date for borrowed books
 * @returns {Promise<Object>} Dashboard details including book counts and lists
 */
export const getDashboardDetails = async (memberId, expiryDate) => {
    try {
        const borrowedBooks = await prisma.borrowedBook.findMany({
            where: { memberId },
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

        return {
            countOfTotalBorrowed,
            countOfCurrentlyBorrowedBooks: currentlyBorrowedBooks.length,
            countOfExpiredBooks: expiredBooks.length,
            expiredBooks,
            currentlyBorrowedBooks
        };
    } catch (error) {
        console.error('Error getting dashboard details:', error);
        throw error;
    }
}; 