import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeNotification } from "../services/emailService/emailWorker.js";

const SALT_ROUNDS = 10;

/**
 * Get a member by their username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} Member object or null if not found
 */
export const getMemberByUsername = async (username) => {
    try {
        return await prisma.member.findUnique({
            where: { username }
        });
    } catch (error) {
        console.error('Error finding member by username:', error);
        throw error;
    }
};

/**
 * Verify if the provided password matches the hashed password
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match
 */
export const verifyPassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error('Error verifying password:', error);
        throw error;
    }
};

/**
 * Generate a hashed password
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
export const generateHashedPassword = async (password) => {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        console.error('Error generating hashed password:', error);
        throw error;
    }
};

/**
 * Generate a JWT token for the user
 * @param {Object} user - User object containing id, username, email, and role
 * @returns {string} JWT token
 */
export const generateAccessToken = (user) => {
    try {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_LIFETIME
        });
    } catch (error) {
        console.error('Error generating JWT token:', error);
        throw error;
    }
};

export const generateRefreshToken = (user)=>{
    try {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_LIFETIME || '90d' // fallback to 7 days
        });
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw error;
    }
}

/**
 * Create a new admin or superadmin user
 * @param {Object} userData - User data including name, username, email, password, phoneNo
 * @param {string} role - Role to assign ('ADMIN' or 'SUPERADMIN')
 * @returns {Promise<Object>} Created user object
 * @throws {Object} If user already exists or database operation fails
 */
export const createMember = async (userData, role) => {
    try {
        // Check for existing user with same username or duplicate role (for admin/superadmin)
        const existingUser = await prisma.member.findFirst({
            where: {
                OR: [
                    { username: userData.username },
                    { role }
                ]
            },
            select: { username: true, role: true }
        });

        if (existingUser) {
            // Return an object with error details instead of throwing
            return {
                error: true,
                status: 409,
                message: existingUser.username === userData.username
                    ? "Username already exists"
                    : `${role === 'ADMIN' ? 'Admin' : 'Super Admin'} already exists. Only one can be registered.`
            };
        }

        // Hash the password
        userData.password = await generateHashedPassword(userData.password);

        // Create the new member
        const newMember = await prisma.member.create({
            data: {
                ...userData,
                role
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        /* 
        Fire and Forget. Call the asynchronous function and doesnot care if it fails or succeed.
        Typically used in while sending emails which are low priority-tasks.
        But we can use .catch to log error if any occurs.
        */
        sendWelcomeNotification(newMember.email, newMember.username, userData.password, newMember.role)
            .catch((error) => {
                console.log(`Error while sending to ${newMember.email}`);
            });

        return newMember;
    } catch (error) {
        // Only throw unexpected errors to the global handler
        console.error('Error creating member:', error);
        throw error;
    }
};
