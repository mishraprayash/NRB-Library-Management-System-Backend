import { deleteCookie } from "../lib/helpers.js";
import prisma from "../lib/prisma.js"

export const validateUser = async (req, res, next) => {
    try {
        const userExists = await prisma.member.findUnique({
            where: {
                id: req.user.id,
                isActive: true
            }
        })
        if (!userExists) {
            deleteCookie(res);
            return res.redirect(`${process.env.FRONTEND_URI }/login`)
        }
        next();
    } catch (error) {
        throw error;
    }
}