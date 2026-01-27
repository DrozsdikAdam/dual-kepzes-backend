import nodemailer from "nodemailer";

// Support both MAILTRAP_* and general SMTP_* environment variables
const smtpUser = process.env.SMTP_USER || process.env.MAILTRAP_USER;
const smtpPass = process.env.SMTP_PASS || process.env.MAILTRAP_PASS;
const smtpHost = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const smtpPort = Number(process.env.SMTP_PORT) || 2525;

const isMailerConfigured = !!(smtpUser && smtpPass);

export const mailer = isMailerConfigured
     ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          auth: {
               user: smtpUser,
               pass: smtpPass,
          }
     })
     : {
          sendMail: async (options: any) => {
               console.log("--- MOCK EMAIL SENT (SMTP NOT CONFIGURED) ---");
               console.log(`To: ${options.to}`);
               console.log(`Subject: ${options.subject}`);
               console.log("---------------------------------------------");
               return { messageId: "mock-id" };
          }
     } as any;

export { isMailerConfigured };