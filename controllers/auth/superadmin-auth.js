
import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { setCookie } from "../../lib/helpers.js";
import { memoryUsage } from "process";

export const register = async (req, res) => {
    try {
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !password || !phoneNo || !email) {
            return res.status(400).json({
                message: "Please provide all required details"
            })
        }
        const superAdminCount = await prisma.member.count({
            where: {
                role: "SUPERADMIN"
            }
        })
        if (superAdminCount > 0) {
            return res.status(400).json({ message: 'Super Admin already exists. You cannot create more than one superadmin.' })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo,
                role: 'SUPERADMIN'
            }
        })
        if (!superAdmin) {
            return res.status(400).json({ message: "Error while creating superAdmin" });
        }
        return res.status(200).json({ message: "Super Admin Created Successfully" });

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

        const superAdminAlreadyExist = await prisma.member.findMany({
            where: {
                role: "SUPERADMIN"
            }
        })
        if (!superAdminAlreadyExist.length) {
            return res.statu(400).json({ message: "Super Admin doesnot exist. Please create one before logging in." });
        }

        const superAdmin = await prisma.member.findUnique({
            where: {
                username,
                role: "SUPERADMIN"
            }
        })
        if (!superAdmin) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const isPasswordMatched = await bcrypt.compare(password, superAdmin.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Username or password doesnot match" });
        }
        const accessToken = jwt.sign({
            id: superAdmin.id,
            username: superAdmin.username,
            email: superAdmin.email,
            role: superAdmin.role,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })

        const isCookieSet = setCookie(res, accessToken, superAdmin.role)
        if (!isCookieSet) {
            return res.status(500).json({ message: "Error while setting cookie" });
        }

        return res.status(200).json({ message: 'Login Successfully', token: accessToken })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateDetails = async (req, res) => {
    try {
        const { name, username, email, phoneNo, password } = req.body;

    } catch (error) {

    }
}