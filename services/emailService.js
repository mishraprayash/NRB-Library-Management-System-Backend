import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.AUTH_USER,
        pass: process.env.AUTH_PASSWORD
    },
});


export const sendEmail = async (to, subject, message) => {
    const info = await transporter.sendMail({
        from: process.env.AUTH_USER,
        to,
        subject,
        html: message
    })
    if(info.rejected){
        console.log('Error while sending email',info.messageId);
    }
}