import nodemailer from "nodemailer";

if (!process.env.EMAIL_AUTH_USER || !process.env.EMAIL_AUTH_PASSWORD) {
    throw new Error('Email authentication credentials missing. Please set EMAIL_AUTH_USER and EMAIL_AUTH_PASSWORD environment variables');
}

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_AUTH_USER,
        pass: process.env.EMAIL_AUTH_PASSWORD
    },
});


export const sendEmail = async (to, subject, message) => {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_AUTH_USER,
        to,
        subject,
        html: message
    })
    if(info.rejected){
        console.log('Error while sending email',info.messageId);
    }
    else{
        console.log(`✉️ Email sent to ${to}`);
    }
}

//login, borrowbook, renew events handlers
