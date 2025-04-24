import { deleteCookie } from "../lib/helpers.js";
import prisma from "../lib/prisma.js"

export const validateUser = async (req,res, next)=>{
    try {
        const userExists = await prisma.member.findUnique({
            where:{
                id:req.user.id
            }
        })
        console.log('User',userExists);
        if(!userExists){
            const isCookieCleared = deleteCookie(res);
            return res.status(400).json({message:"Sorry, but the user doesnot exist"});
        }
        next();
    } catch (error) {
        throw error;
    }
}