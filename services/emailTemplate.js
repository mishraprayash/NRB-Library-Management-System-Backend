export function generateEmailTemplate(member) {
    const { username, books } = member;

    const bookList = books.map(book => `- **${book.name}** (Due by: ${new Date(book.expiryDate).toLocaleString()})`).join("\n");

    return `
        Subject: Reminder: Your Borrowed Books Are Due Soon 📚

        Dear ${username},

        This is a friendly reminder that the following book(s) you borrowed from the library are due within the next 24 hours. Please ensure they are returned on time to avoid late fees.

        ${bookList}

        You can return the books at the library during working hours. If you have already returned them, kindly disregard this message.

        Thank you for your cooperation.

        Best regards,  
        📖 Library Management Team
    `;
}