import { z } from 'zod'


// ---------- COMMON VALIDATORS ----------
const id = z.number().int().positive()
const stringNonEmpty = z.string().min(1)
const email = z.string().email()
const phoneNo = z.string().length(10)
const int = z.number().int()
const password = z.string().min(5);



export const userLoginSchema = z.object({
    username: stringNonEmpty,
    password: stringNonEmpty
})
export const userRegisterSchema = z.object({
    name: stringNonEmpty,
    username: stringNonEmpty,
    email: email,
    password: password,
    phoneNo: phoneNo
})
export const userEditSchema = z.object({
    name: stringNonEmpty,
    username: stringNonEmpty,
    email: email,
    password: z.string()
        .transform(val => val === "" ? undefined : val)
        .optional()
        .refine(val => val === undefined || val.length >= 5, {
            message: "Password must be at least 5 characters",
        }),
    phoneNo: phoneNo
})

// ---------- BOOK OPERATIONS ----------
export const addBookSchema = z.object({
    name: stringNonEmpty.min(2, "Book name must be at least 2 characters long"),
    authors: z.array(stringNonEmpty.min(2, "Author name must be at least 2 characters long")).min(1, "At least one author is required"),
    publisher: stringNonEmpty.min(2, "Publisher name must be at least 2 characters long"),
    publishedYear: int.min(1000, "Invalid year").max(new Date().getFullYear(), "Year cannot be in the future"),
    pages: int.positive("Pages must be a positive number"),
    cost: int.positive("Cost must be a positive number"),
    category: stringNonEmpty.min(2, "Category must be at least 2 characters long"),
    stock: int.positive("Stock must be a positive number")
})

export const editBookSchema = z.object({
    bookCode: stringNonEmpty.min(1, "Book code is required"),
    name: stringNonEmpty.min(2, "Book name must be at least 2 characters long"),
    authors: z.array(stringNonEmpty.min(2, "Author name must be at least 2 characters long")).min(1, "At least one author is required"),
    publisher: stringNonEmpty.min(2, "Publisher name must be at least 2 characters long"),
    publishedYear: int.min(1000, "Invalid year").max(new Date().getFullYear(), "Year cannot be in the future"),
    pages: int.positive("Pages must be a positive number"),
    cost: int.positive("Cost must be a positive number"),
    category: stringNonEmpty.min(2, "Category must be at least 2 characters long"),
    stock: int.nonnegative("Stock cannot be negative")
})

export const deleteBookSchema = z.object({
    bookCode: stringNonEmpty
})

export const deleteBookByCountSchema = z.object({
    bookCode: stringNonEmpty,
    stock: int.positive()
})

export const returnBookSchema = z.object({
    memberId: id,
    bookIds: z.array(id)
})

// ---------- MEMBER OPERATIONS ----------
export const updateProfileSchema = z.object({
    name: stringNonEmpty,
    phoneNo,
    email
})

export const resetPasswordSchema = z.object({
    oldPassword: stringNonEmpty,
    newPassword: password
})

export const getBorrowedBooksSchema = z.object({
    memberId: id
})

// ---------- VARIABLES OPERATIONS ----------
export const variablesCreateSchema = z.object({
    MAX_BORROW_LIMIT: int.positive(),
    MAX_RENEWAL_LIMIT: int.positive(),
    EXPIRYDATE: int.positive(),
    CATEGORIES: z.array(stringNonEmpty)
})

export const variablesUpdateSchema = z.object({
    MAX_BORROW_LIMIT: int.positive(),
    MAX_RENEWAL_LIMIT: int.positive(),
    EXPIRYDATE: int.positive(),
    CATEGORIES: z.array(stringNonEmpty)
})

export const addStockSchema = z.object({
    bookCode: stringNonEmpty.min(1, "Book code is required"),
    stock: int.positive()
})

const ALLOWED_SORT_FIELDS = ['createdAt', 'cost', 'publishedYear'];

export const searchQuerySchema = z.object({
    a_name: z.string().optional(),
    b_name: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
    sortBy: z.string().optional().default('createdAt').refine((val) => !val || ALLOWED_SORT_FIELDS.includes(val), {
        message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`,
    }),
    cat: z.string().optional(),
    page: z.coerce.number().positive().optional().default(1),
    limit: z.coerce.number().positive().max(100).optional().default(50),
});