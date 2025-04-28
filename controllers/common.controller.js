import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import fuzzy from 'fuzzy';

import {
  sendEmailVerificationError,
  sendEmailVerificationResponse,
  sendError,
  sendResponse,
} from '../lib/responseHelper.js';
import {
  sendPasswordResetNotification,
  sendVerificationEmail,
} from '../services/emailService/emailSender.js';
import { version as uuidVersion, validate as uuidValidate, v4 as uuidv4 } from 'uuid';
import { searchAllBookSchema } from '../validation/schema.js';
import { deleteCookie, groupBooks } from '../lib/helpers.js';
import { createHash } from 'crypto';

/* 
This route hasnot been specifically used but it gives different rows for each book even if they are same without counting frequency for same books.
*/

export const getBooksWithDuplication = async (req, res) => {
  try {
    const books = await prisma.book.findMany();
    return res.status(200).json({
      message: 'Books Fetched Successfully',
      info: 'Duplicates are also shown in different row',
      books,
    });
  } catch (error) {
    throw error;
  }
};

/* 
This route is designed to give only the available books which are not currently borrowed by the members
*/
export const getAvailableBooks = async (req, res) => {
  try {
    const parsed = searchAllBookSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { a_name, b_name, sort, cat, page, sortBy, limit } = parsed.data;

    if (a_name && b_name) {
      return res
        .status(400)
        .json({ error: 'You can only search by either author name or book name, not both.' });
    }

    // Apply filters on the DB level first (category, sort,etc.)
    const where = { available: true };
    let orderBy = {};

    if (sortBy) {
      orderBy = { [sortBy]: sort };
    }
    if (cat) {
      where.category = { equals: cat.toUpperCase(), mode: 'insensitive' };
    }

    const books = await prisma.book.findMany({
      where,
      orderBy,
    });

    let filteredBooks = books;

    if (b_name) {
      // Fuzzy match on book names
      const bookNames = books.map((book) => book.name);
      const fuzzyBookResults = fuzzy.filter(b_name, bookNames);
      const matchedBooks = new Set(fuzzyBookResults.map((result) => result.string));

      filteredBooks = filteredBooks.filter((book) => matchedBooks.has(book.name));
    }

    if (a_name) {
      // Fuzzy match on author names (handle array of authors)
      const authorNames = books.map((book) => book.authors).flat(); // Flatten the authors array to match against
      const fuzzyAuthorResults = fuzzy.filter(a_name, authorNames);
      const matchedAuthors = new Set(fuzzyAuthorResults.map((result) => result.string));

      filteredBooks = filteredBooks.filter((book) =>
        book.authors.some((author) => matchedAuthors.has(author))
      );
    }

    // Group books by unique bookCode and include additional counts
    const groupedBooks = groupBooks(filteredBooks);

    const totalCount = groupedBooks.length;
    const totalPages = Math.ceil(totalCount / limit);

    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (validPage - 1) * limit;
    const paginatedBooks = groupBooks(filteredBooks).slice(skip, skip + limit);

    return res.status(200).json({
      message: 'Success',
      books: paginatedBooks,
      pagination: {
        totalCount,
        totalPages,
        currentPage: validPage,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
    });
  } catch (error) {
    throw error;
  }
};

/* 
This route is designed to fetch all the books that are currently borrowed by a member based on their memberID.
*/
export const getBorrowedBooksForMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const borrowedBooks = await prisma.member.findMany({
      where: {
        id: memberId,
      },
      select: {
        borrowedBooks: {
          where: {
            returned: false,
          },
          include: {
            book: {},
          },
        },
      },
    });

    return res.status(200).json({ message: 'Book Borrowed Successfully', books: borrowedBooks });
  } catch (error) {
    throw error;
  }
};

/**
This route is designed for member to update their profile information. 
For example name, phoneNo, and email can be changed by user.
*/

export const updateMyProfileDetails = async (req, res) => {
  try {
    const { name, phoneNo, email } = req.body;
    if (!name || !phoneNo || !email) {
      return res.status(400).json({ message: 'All fields are mandatory' });
    }

    if (typeof name !== 'string' || typeof phoneNo !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid data types' });
    }

    const userExist = await prisma.member.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!userExist) {
      return res.status(400).json({ message: 'This user doesnot exist' });
    }

    /*Checking if there are changes made or not */

    if (userExist.name === name && userExist.phoneNo === phoneNo && userExist.email === email) {
      return res.status(400).json({ message: 'Please update something before saving changes' });
    }

    const updateUser = await prisma.member.update({
      where: {
        id: req.user.id,
      },
      data: {
        name,
        phoneNo,
        email,
      },
    });

    if (!updateUser) {
      return res.status(400).json({ message: 'Error while updating profile' });
    }
    return res.status(200).json({ message: 'Profile Updated Successfully' });
  } catch (error) {
    throw error;
  }
};

/**
This route is for changing the password for the user which requires user for them to know their old password.
*/
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (
      !oldPassword ||
      !newPassword ||
      typeof oldPassword !== 'string' ||
      typeof newPassword !== 'string'
    ) {
      return res
        .status(400)
        .json({ message: 'Please provide both old password and new password with valid values' });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({ message: 'You have already used this password before' });
    }

    const userExist = await prisma.member.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!userExist) {
      return res.status(400).json({ message: 'User doesnot exist' });
    }
    const isOldPasswordMatched = await bcrypt.compare(oldPassword, userExist.password);

    if (!isOldPasswordMatched) {
      return res.status(400).json({
        message: 'Old password doesnot match. Please contact admin for reseting your password',
      });
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.member.update({
      where: {
        id: req.user.id,
      },
      data: {
        password: {
          set: newHashedPassword,
        },
      },
    });
    if (!updatedUser) {
      return res
        .status(400)
        .json({ message: 'Error while updating password. Please contact admin.' });
    }
    return res.status(200).json({ message: 'Password Reset Successfully' });
  } catch (error) {
    throw error;
  }
};

/**
This route is designed for getting the profile information for the user including member, admin and superadmin.
*/
export const getProfileDetails = async (req, res) => {
  try {
    const userInfo = await prisma.member.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phoneNo: true,
        createdAt: true,
        isEmailVerified: true,
        designation: true,
        role: true,
      },
    });

    if (!userInfo) {
      return res.status(400).json({ message: 'User doesnot exist' });
    }
    return res.status(200).json({ message: 'User Fetched Successfully', user: userInfo });
  } catch (error) {
    throw error;
  }
};

/**
This route if for logging out any user by clearing the cookie.
*/
export const logout = async (req, res) => {
  try {
    const isCookieDeleted = deleteCookie(res);
    if (!isCookieDeleted) {
      return res.status(500).json({ message: 'Error while deleting cookies. Couldnot Logout' });
    }
    return res.status(200).json({ message: 'Logout Successfully' });
  } catch (error) {
    throw error;
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const parsed = searchAllBookSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { a_name, b_name, sort, cat, page, sortBy, limit, status } = parsed.data;

    if (a_name && b_name) {
      return res
        .status(400)
        .json({ error: 'You can only search by either author name or book name, not both.' });
    }

    // Apply filters on the DB level first (category, sort,etc.)
    const where = {};
    let orderBy = {};

    if (sortBy) {
      orderBy = { [sortBy]: sort };
    }
    if (cat) {
      where.category = { equals: cat.toUpperCase(), mode: 'insensitive' };
    }
    if (status) {
      where.available = status === 'true' ? true : false;
    }

    const books = await prisma.book.findMany({
      where,
      orderBy,
    });

    let filteredBooks = books;

    if (b_name) {
      // Fuzzy match on book names
      const bookNames = books.map((book) => book.name);
      const fuzzyBookResults = fuzzy.filter(b_name, bookNames);
      const matchedBooks = new Set(fuzzyBookResults.map((result) => result.string));
      filteredBooks = filteredBooks.filter((book) => matchedBooks.has(book.name));
    }

    if (a_name) {
      // Fuzzy match on author names (handle array of authors)
      const authorNames = books.map((book) => book.authors).flat(); // Flatten the authors array to match against
      const fuzzyAuthorResults = fuzzy.filter(a_name, authorNames);
      const matchedAuthors = new Set(fuzzyAuthorResults.map((result) => result.string));

      filteredBooks = filteredBooks.filter((book) =>
        book.authors.some((author) => matchedAuthors.has(author))
      );
    }

    // Group books by unique bookCode and include additional counts
    const groupedBooks = groupBooks(filteredBooks);

    const totalCount = groupedBooks.length;
    const totalPages = Math.ceil(totalCount / limit);

    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (validPage - 1) * limit;
    const paginatedBooks = groupBooks(filteredBooks).slice(skip, skip + limit);

    return res.status(200).json({
      message: 'Success',
      groupedBooks: paginatedBooks,
      pagination: {
        totalCount,
        totalPages,
        currentPage: validPage,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Route for verifying the email of any user
 */

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return sendEmailVerificationError(res, 400, 'Token is required');
    }
    const isTokenValid = uuidValidate(token) && uuidVersion(token) === 4;

    if (!isTokenValid) {
      return sendEmailVerificationError(res, 400, 'Invalid Verification Token');
    }
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const member = await prisma.member.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        isEmailVerified: false,
        emailVerificationTokenExpiry: {
          gte: new Date(),
        },
      },
    });
    if (!member) {
      return sendEmailVerificationError(res, 400, 'Invalid Verification Token or Token Expired');
    }

    // Mark email as verified and remove the token
    await prisma.member.update({
      where: { id: member.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    return sendEmailVerificationResponse(res, 200, 'Email Verified Successfully');
  } catch (error) {
    throw error;
  }
};

/**
 * Route that sends a verififaction link to an email of a user
 *
 */

export const sendVerifyEmail = async (req, res) => {
  try {
    const user = await prisma.member.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      sendError(res, 400, 'Invalid User');
    }
    if (user.isEmailVerified) {
      return sendError(res, 400, 'Email is already verified');
    }

    const emailVerificationToken = uuidv4();
    const hashedEmailVerificationToken = createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');

    await prisma.member.update({
      where: {
        id: req.user.id,
      },
      data: {
        emailVerificationToken: hashedEmailVerificationToken,
        emailVerificationTokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });
    try {
      await sendVerificationEmail(user.email, user.username, user.role, emailVerificationToken);
      return sendResponse(res, 200, 'Verification Link Sent Successfully');
    } catch (emailError) {
      throw emailError;
    }
  } catch (error) {
    throw error;
  }
};

export const sendForgotPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;
    const userExist = await prisma.member.findFirst({
      where: {
        email,
      },
    });
    if (!userExist) {
      return sendError(res, 400, 'User with email doesnot exist');
    }

    const resetPasswordToken = uuidv4();

    // hashing so that anyone with read access to a DB cannot exploit the resetToken.
    const hashedResetPasswordToken = createHash('sha256').update(resetPasswordToken).digest('hex');

    await prisma.member.update({
      where: {
        email,
      },
      data: {
        resetPasswordToken: hashedResetPasswordToken,
        resetPasswordTokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // expires after 5 min
      },
    });

    try {
      await sendPasswordResetNotification(email, userExist.username, resetPasswordToken);
      // return res.redirect(`${process.env.FRONTEND_URI}/forgot/${resetPasswordToken}`)

      return sendResponse(res, 200, 'Password Reset Link Sent Successfully');
    } catch (emailError) {
      throw emailError;
    }
  } catch (error) {
    throw error;
  }
};

// POST {newPassword, confirmPassword}
// {BASE_URI}/resetpassword?token=somevalue

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const resetPasswordToken = req.query.token;

    if (!resetPasswordToken) {
      return sendError(res, 400, 'Token not found');
    }

    const isTokenValid = uuidValidate(resetPasswordToken) && uuidVersion(resetPasswordToken) === 4;

    if (!isTokenValid) {
      return sendError(res, 400, 'Invalid Token Format');
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 400, 'Password values doesnot match');
    }
    const hashedResetPasswordToken = createHash('sha256').update(resetPasswordToken).digest('hex');

    const user = await prisma.member.findFirst({
      where: {
        resetPasswordToken: hashedResetPasswordToken,
        resetPasswordTokenExpiry: {
          gte: new Date(Date.now()),
        },
      },
    });

    if (!user) {
      return sendError(res, 400, 'The token doesnot exist');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await prisma.member.update({
        where: {
          id: user.id,
        },
        data: {
          password: newHashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpiry: null,
        },
      });
      return sendResponse(res, 200, 'Password Reset Successfully');
    } catch {
      return sendError(res, 500, 'Error while reseting password');
    }
  } catch (error) {
    throw error;
  }
};

export const checkIsEmailVerified = async (req, res) => {
  try {
    const user = await prisma.member.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      sendError(res, 400, 'User doesnot exist');
    }
    return sendResponse(res, 200, 'OK', { isEmailVerified: user.isEmailVerified });
  } catch (error) {
    throw error;
  }
};
