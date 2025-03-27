import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { setCookie } from "../../lib/helpers.js";

import { sendEmail } from "../../services/emailService.js";


export const login = async (req, res) => {
    try {

        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password both are required" });
        }
        const userExist = await prisma.member.findUnique({
            where: {
                username
            }
        })
        if (!userExist) {
            return res.status(400).json({ message: "Member doesnot exist" });
        }
        const isPasswordMatched = await bcrypt.compare(password, userExist.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const accessToken = jwt.sign({
            id: userExist.id,
            username: userExist.username,
            email: userExist.email,
            role: userExist.role,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })

        const isCookieSet = setCookie(res, accessToken, userExist.role);
        if (!isCookieSet) {
            return res.status(500).json({ message: "Error while setting cookie" });
        }
        // send email notifying successful login
        // await sendEmail(userExist.email, "Logged In", `<p> You just logged in from ${req.headers['user-agent']} at ${new Date(Date.now()).toUTCString()}</p>`)

        return res.status(200).json({ message: 'Login Successfully', token: accessToken, role: userExist.role })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const registerAdmin = async (req, res) => {
    try {
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !password || !phoneNo || !email) {
            return res.status(400).json({
                message: "Please provide all required details"
            })
        }
        const adminCount = await prisma.member.count({
            where: {
                OR: [
                    { username },
                    { role: "ADMIN" }
                ]

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


export const registerSuperAdmin = async (req, res) => {
    try {
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !password || !phoneNo || !email) {
            return res.status(400).json({
                message: "Please provide all required details"
            })
        }
        const superAdminCount = await prisma.member.count({
            where: {
                OR: [
                    { role: "SUPERADMIN" },
                    { username }
                ]
            }
        })
        if (superAdminCount > 0) {
            return res.status(400).json({ message: 'Super admin already exists. You cannot create more than one super admin.' })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo,
                role: 'SUPERADMIN'
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "Error while creating super admin" });
        }
        return res.status(200).json({ message: "Super Admin Created Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}