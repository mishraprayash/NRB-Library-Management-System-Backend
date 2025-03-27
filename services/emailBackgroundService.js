import cron from "node-cron"
import prisma from "../lib/prisma"
import { sendEmail } from "./emailService";
import { generateEmailTemplate } from "./emailTemplate";

const sendEmailBeforeDate = 14 * 24 * 60 * 60 * 1000;

async function notifyThroughEmail() {
    try {
        const borrowedBooks = await prisma.borrowedBook.findMany({
            where: {
                returned: false,
                expiryDate: {
                    lte: new Date(Date.now() + sendEmailBeforeDate)
                },
            },
            select: {
                expiryDate: true,
            },
            include: {
                member: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                book: {
                    select: {
                        name: true
                    }
                }
            },
        })

        // group all the same books borrowed by the member.
        /*
        This is the format of the ouput after grouping.
        {
            "username": "john_doe",
            "email": "john@example.com",
            "books": [
                {
                    "name": "The Great Gatsby",
                    "expiryDate": "2025-03-28T12:00:00.000Z"
                },
                {
                    "name": "1984",
                    "expiryDate": "2025-03-28T14:00:00.000Z"
                }
            ]
        },
        */
        const groupedResults = borrowedBooks.reduce((acc, record) => {
            const { username, email } = record.member;
            const memberKey = `${username}-${email}`;

            if (!acc[memberKey]) {
                acc[memberKey] = {
                    username,
                    email,
                    books: []
                };
            }

            acc[memberKey].books.push({
                name: record.book.name,
                expiryDate: record.expiryDate
            });

            return acc;
        }, {});

        // Convert grouped object to an array (if needed)
        const finalResult = Object.values(groupedResults);

        finalResult.forEach(async (member) => {
            const emailBody = generateEmailTemplate(member);
            await sendEmail(member.email, "Reminder: Your Borrowed Books Are Due Soon 📚", emailBody)
        })
    } catch (error) {
        console.log("Error while sending emails", error);
    }
}
