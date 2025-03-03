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

export function setCookie(res, accessToken, age) {
    if (process.env.NODE_ENV === "development") {
        res.cookie("token", accessToken, {
            httpOnly: true,   
            secure: false,
            sameSite: "lax",
            maxAge: age
        });
    }
    if (process.env.NODE_ENV === "production") {
        res.cookie("token", accessToken, {
            httpOnly: true, // can only be accessed by server requests
            path: "/",
            secure: true,
            sameSite: "none", // "strict" | "lax" | "none" (secure must be true)
            maxAge: age, 
        });
    }
    return res;
}

export async function validateMember(memberId) {
    const memberExist = await prisma.member.findUnique({
        where: {
            id: memberId,
            role:"MEMBER"
        }
    })
    if (!memberExist) {
        return false;
    }
    return true;
}


export async function getConstraints(req,res){

     //  grabbing the limits and constraints for borrowing book.
     const VARIABLES = await prisma.variables.findMany();

     if (!VARIABLES.length) {
         return res.status(400).json({ message: "Please update your variables MAX_BORROW_LIMIT, EXPIRY_DATE, MAX_RENEWAL_LIMIT" })
     }

     const BORROW_LIMIT = VARIABLES[0].MAX_BORROW_LIMIT;
     const EXPIRY_DATE = VARIABLES[0].EXPIRYDATE;
     const CONSECUTIVE_BORROW_LIMIT_DAYS = VARIABLES[0].CONSECUTIVE_BORROW_LIMIT_DAYS;
     const MAX_RENEWAL_LIMIT = VARIABLES[0].MAX_RENEWAL_LIMIT


    return [BORROW_LIMIT,EXPIRY_DATE,CONSECUTIVE_BORROW_LIMIT_DAYS,MAX_RENEWAL_LIMIT];
}