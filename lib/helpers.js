import prisma from "./prisma.js"


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


export async function getDBConstraints(req, res) {

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


export function setCookie(res, accessToken, role) {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        };
        res.cookie('tokne', accessToken, cookieOptions);
        res.cookie('role', role, cookieOptions);
        return true
    } catch (error) {
        console.log(error);
        return false;
    }
}

export function deleteCookie(res) {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        };
        res.clearCookie('token', cookieOptions);
        res.clearCookie('role', cookieOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}