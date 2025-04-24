/**
 * Library Management System - Helper Functions
 * 
 * This module provides utility functions that are used across the application
 * for common tasks like member validation, database constraints, and cookie management.
 */

import prisma from "./prisma.js";

/**
 * Validates if a user with the given ID exists and has a MEMBER role
 * 
 * @param {string} memberId - The unique identifier of the member to validate
 * @returns {Promise<boolean>} True if the member exists, false otherwise
 */
export async function validateMember(memberId) {
    try {
        const memberExists = await prisma.member.findUnique({
            where: {
                id: memberId,
            }
        });

        return !!memberExists;
    } catch (error) {
        console.error("Error validating member:", error);
        return false;
    }
}

/**
 * Retrieves system configuration variables from the database
 * 
 * These variables define constraints for book borrowing and library operations, including:
 * - Maximum number of books a member can borrow at once
 * - Default expiry date for borrowed books
 * - Consecutive borrow limit in days
 * - Maximum number of times a book can be renewed
 * - Available book categories
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Array|undefined>} An array containing system constraints or undefined if an error occurs
 */
export async function getDBConstraints(req, res) {
    try {
        // Retrieve all system variables from the database
        const variables = await prisma.variables.findMany();

        if (!variables.length) {
            res.status(400).json({
                message: "System configuration error: Required variables not found in database",
                details: "Please update system variables: MAX_BORROW_LIMIT, EXPIRY_DATE, MAX_RENEWAL_LIMIT"
            });
        }

        // Return variables as an array for easy destructuring by consumers
        return [
            variables[0].MAX_BORROW_LIMIT,
            variables[0].EXPIRYDATE,
            variables[0].MAX_RENEWAL_LIMIT,
            variables[0].CATEGORIES
        ];
    } catch (error) {
        console.error("Error retrieving database constraints:", error);
        res.status(500).json({ message: "Failed to retrieve system configuration" });
    }
}

/**
 * Sets authentication cookies for the user session
 * 
 * Creates two HTTP-only cookies:
 * - token: Contains the JWT access token
 * - role: Contains the user's role (ADMIN, MEMBER, etc.)
 * 
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} role - User role (e.g., "ADMIN", "MEMBER")
 * @returns {boolean} True if cookies were set successfully, false otherwise
 */
export function setCookie(res, token, role) {
    try {
        if (!res || !token || !role) {
            console.error("setCookie: Missing required parameters");
            return false;
        }

        const cookieOptions = {
            httpOnly: true, // Prevents client-side JS from accessing cookie
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // Provides CSRF protection with better UX than 'strict'
            maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        };

        res.cookie('token', token, cookieOptions);
        return true;
    } catch (error) {
        console.error("Error setting cookies:", error);
        return false;
    }
}

/**
 * Removes authentication cookies to log user out
 * 
 * Clears both the token and role cookies, effectively ending the user's session
 * 
 * @param {Object} res - Express response object
 * @returns {boolean} True if cookies were cleared successfully, false otherwise
 */
export function deleteCookie(res) {
    try {
        if (!res) {
            console.error("deleteCookie: Missing response object");
            return false;
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        res.clearCookie('token', cookieOptions);
        return true;
    } catch (error) {
        console.error("Error deleting cookies:", error);
        return false;
    }
}

/**
 * Formats a date as YYYY-MM-DD
 * 
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
    if (!date || !(date instanceof Date)) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Calculates the expiry date based on current date and days to add
 * 
 * @param {number} days - Number of days to add to current date
 * @returns {Date} The calculated expiry date
 */
export function calculateExpiryDate(days) {
    if (!days || isNaN(days)) {
        days = 14; // Default to 14 days if invalid input
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
}



export const groupBooks = (books) => {
    const map = new Map();
    books.forEach((book) => {
      if (!map.has(book.bookCode)) {
        map.set(book.bookCode, {
          ...book,
          totalCount: 0,
          availableCount: 0,
        });
      }
      const entry = map.get(book.bookCode);
      entry.totalCount += 1;
      if (book.available) entry.availableCount += 1;
    });
    return Array.from(map.values());
};

