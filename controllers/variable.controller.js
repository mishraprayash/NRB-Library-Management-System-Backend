import prisma from '../lib/prisma.js';

/*
These variables are the MAX_BORROW_LIMIT, MAX_RENEWAL_LIMIT and EXPIRY_DATE which can be updated by the admin. 
*/

export const createVariables = async (req, res) => {
  try {
    const { MAX_BORROW_LIMIT, MAX_RENEWAL_LIMIT, EXPIRYDATE, CATEGORIES } = req.body;

    const rowExist = await prisma.variables.findMany();
    if (rowExist.length) {
      return res
        .status(400)
        .json({ message: 'Variables are already created. You can only update now.' });
    }
    await prisma.variables.create({
      data: {
        MAX_BORROW_LIMIT,
        MAX_RENEWAL_LIMIT,
        EXPIRYDATE,
        CATEGORIES,
      },
    });
    return res.status(200).json({ message: 'Varibales Created Successfully' });
  } catch (error) {
    throw error;
  }
};

export const updateVariables = async (req, res) => {
  try {
    const { MAX_BORROW_LIMIT, MAX_RENEWAL_LIMIT, EXPIRYDATE, CATEGORIES } = req.body;
    if (
      !MAX_BORROW_LIMIT ||
      !MAX_RENEWAL_LIMIT ||
      !EXPIRYDATE ||
      !CATEGORIES ||
      CATEGORIES.length === 0
    ) {
      return res.status(400).json({
        message: 'Please provide id, MAX_BOOK_LIMIT, MAX_RENEWAL_LIMIT and BOOK_EXPIRY_DATE',
      });
    }

    const rowExist = await prisma.variables.findMany();
    if (!rowExist.length) {
      return res.status(400).json({ message: 'Please create the variables in the table first.' });
    }
    await prisma.variables.updateMany({
      data: {
        MAX_BORROW_LIMIT,
        MAX_RENEWAL_LIMIT,
        EXPIRYDATE,
        CATEGORIES,
      },
    });
    return res.status(200).json({ message: 'Varibales Updated Successfully' });
  } catch (error) {
    throw error;
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const variable = await prisma.variables.findFirst();
    if (!variable) {
      return res.status(400).json({ message: 'Please create the variables in the table first.' });
    }

    const booksByCategory = await prisma.book.findMany({
      where: {
        category,
      },
    });

    if (booksByCategory.length) {
      return res.status(400).json({ message: 'Books with this category exists.' });
    }

    // array with removed category
    const updatedCategories = variable.CATEGORIES.filter((cat) => cat !== category);

    // updating category handling removed
    await prisma.variables.updateMany({
      data: {
        CATEGORIES: updatedCategories,
      },
    });
    return res.status(200).json({ message: 'Delete Category Successfully' });
  } catch (error) {
    throw error;
  }
};

export const getVariables = async (req, res) => {
  try {
    const VARIABLES = await prisma.variables.findFirst({
      select: {
        MAX_BORROW_LIMIT: true,
        MAX_RENEWAL_LIMIT: true,
        EXPIRYDATE: true,
        CATEGORIES: true,
      },
    });
    if (!VARIABLES) {
      return res.status(400).json({ message: 'Please create the variables first' });
    }
    return res
      .status(200)
      .json({ message: 'Varibales Fetched Successfully', variables: VARIABLES });
  } catch (error) {
    throw error;
  }
};
