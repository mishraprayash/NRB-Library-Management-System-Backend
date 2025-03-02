import prisma from "../../../lib/prisma.js";
import bcrypt from "bcryptjs";
import { setCookie } from "../../../lib/helpers.js";
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
    try {
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !password || !phoneNo || !email) {
            return res.status(400).json({
                message: "Please provide all required details"
            })
        }
        const adminCount = await prisma.member.count({
            where: {
                role: "ADMIN"
            }
        })
        if (adminCount > 0) {
            return res.status(400).json({ message: 'Admin already exists. You cannot create more than one admin.' })
        }
        const hashedPassword = await bcrypt.hash(password, 10);


        const admin = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo,
                role: 'ADMIN'
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "Error while creating admin" });
        }
        return res.status(200).json({ message: "Admin Created Successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const login = async (req, res) => {
    try {

        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password both are required" });
        }

        const admin = await prisma.member.findUnique({
            where: {
                username
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "Admin doesnot exist." });
        }
        const isPasswordMatched = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const accessToken = jwt.sign({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })

        const cookieExpiryDate = 7 * 24 * 60 * 60

        setCookie(res, accessToken, cookieExpiryDate);

        return res.status(200).json({ message: 'Login Successfully', username: username, token: accessToken })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}