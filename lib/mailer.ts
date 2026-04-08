import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your login password)
  },
});

export async function sendAdminMail(subject: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  await transporter.sendMail({
    from: `"LLD Gym" <${process.env.GMAIL_USER}>`,
    to: "gauravmandal650@gmail.com",
    subject,
    html,
  });
}
