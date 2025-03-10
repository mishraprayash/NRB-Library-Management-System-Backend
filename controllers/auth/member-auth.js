import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"


export const login = async (req, res) => {
    try {

        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password both are required" });
        }
        const memberExist = await prisma.member.findUnique({
            where: {
                username
            }
        })
        if (!memberExist) {
            return res.status(400).json({ message: "Member doesnot exist" });
        }
        const isPasswordMatched = await bcrypt.compare(password, memberExist.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const accessToken = jwt.sign({
            id: memberExist.id,
            username: memberExist.username,
            email: memberExist.email,
            role: memberExist.role,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })

        return res.status(200).json({ message: 'Login Successfully', username: username, memberId: memberExist.id, token: accessToken })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}