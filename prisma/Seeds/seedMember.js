import xlsx from "xlsx"
import prisma from "../../lib/prisma.js"
import crypto from "crypto"
import bcrypt from "bcryptjs";

import memberJson from './employee_info.json' with {type: 'json'}



function generateRandomEmail() {
    return crypto.randomBytes(10).toString('base64').slice(0, 10) + "@testemail.com"
}

// for production
async function seedMemberWithOriginalEmail() {
    try {
        for (const info of memberJson) {
            const username = info['EmpID']
            const name = info['EmpName']
            const phoneNo = info['Mobile'].toString()
            const password = info['EmpID']
            const designation = info['Designation']
            let role = info['Role ']
            // real email address
            const email = info['Email']
            if (role === 'Super Admin')
                role = "SUPERADMIN"
            else if (role === "Admin")
                role = "ADMIN"
            else role = "MEMBER"
            const hashsedPassword = await bcrypt.hash(password, 10)
            const memberData = {
                username,
                name,
                phoneNo,
                password: hashsedPassword,
                designation,
                role,
                email
            }
            await prisma.member.create({
                data: memberData
            })
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}

// for testing
async function seedMembersWithDummyEmail() {
    try {
        await prisma.member.deleteMany();
        for (const info of memberJson) {
            const username = info['EmpID']
            const name = info['EmpName']
            const phoneNo = info['Mobile'].toString()
            const password = info['EmpID']
            const designation = info['Designation']
            let role = info['Role ']
            const email = generateRandomEmail();
            if (role === 'Super Admin')
                role = "SUPERADMIN"
            else if (role === "Admin")
                role = "ADMIN"
            else role = "MEMBER"
            const hashsedPassword = await bcrypt.hash(password, 10)
            const memberData = {
                username,
                name,
                phoneNo,
                password: hashsedPassword,
                designation,
                role,
                email
            }
            await prisma.member.create({
                data: memberData
            })
        }

    } catch (error) {
        console.log(error);
        throw error
    }
}

async function main() {
    seedMembersWithDummyEmail();
}

main().catch((error) => {
    console.log(error);
})




/*
Extracting the complete information from the excel file
*/


// import xlsx from "xlsx"
// import fs from 'node:fs'

// // Load the workbook
// const workbook = xlsx.readFile("/Users/prayashmishra/nrb-internship/nrb-library-backend/prisma/Seeds/MemberList.xlsx");

// // Get the desired sheet
// const sheetName = "Employee Information";
// const worksheet = workbook.Sheets[sheetName];

// // Convert sheet to JSON, starting from row 5 (header is in row 5 = index 4)
// const jsonData = xlsx.utils.sheet_to_json(worksheet, {
//   range: 4, // starts reading from 5th row (0-indexed)
//   defval: null, // keeps empty cells as null
// });

// // Save to a JSON file
// fs.writeFileSync("employee_info.json", JSON.stringify(jsonData, null, 2), "utf-8");

// console.log("✅ Employee data extracted and saved to 'employee_info.json'");
