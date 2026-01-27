import nodemailer from "nodemailer";

const isMailerConfigured = !!(process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS);

export const mailer = isMailerConfigured
     ? nodemailer.createTransport({
          host: "sandbox.smtp.mailtrap.io",
          port: 2525,
          auth: {
               user: process.env.MAILTRAP_USER,
               pass: process.env.MAILTRAP_PASS,
          }
     })
     : {
          sendMail: async (options: any) => {
               console.log("--- MOCK EMAIL SENT ---");
               console.log(`To: ${options.to}`);
               console.log(`Subject: ${options.subject}`);
               console.log(`Body: ${options.text}`);
               console.log("-----------------------");
               return { messageId: "mock-id" };
          }
     } as any;

export { isMailerConfigured };