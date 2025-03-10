import prisma from "./prisma.js"


// validate if the user is admin
export function isAdmin(req) {
    if (req.user.role === "ADMIN") {
        return true
    }
    else {
        return false
    }
}
// validate if the user is superadmin
export function isSuperAdmin(req) {
    if (req.user.role === "SUPERADMIN") {
        return true
    }
    else {
        return false
    }
}


export async function validateMember(memberId) {
    const memberExist = await prisma.member.findUnique({
        where: {
            id: memberId,
            role: "MEMBER"
        }
    })
    if (!memberExist) {
        return false;
    }
    return true;
}


export async function getConstraints(req, res) {

    //  grabbing the limits and constraints for borrowing book.
    const VARIABLES = await prisma.variables.findMany();

    if (!VARIABLES.length) {
        return res.status(400).json({ message: "Please update your variables MAX_BORROW_LIMIT, EXPIRY_DATE, MAX_RENEWAL_LIMIT" })
    }

    return [
        VARIABLES[0].MAX_BORROW_LIMIT,
        VARIABLES[0].EXPIRYDATE,
        VARIABLES[0].CONSECUTIVE_BORROW_LIMIT_DAYS,
        VARIABLES[0].MAX_RENEWAL_LIMIT,
        VARIABLES[0].CATEGORIES
    ];
}