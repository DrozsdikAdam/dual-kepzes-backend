import nodemailer from "nodemailer";

// Support both MAILTRAP_* and general SMTP_* environment variables
const smtpUser = process.env.SMTP_USER || process.env.MAILTRAP_USER;
const smtpPass = process.env.SMTP_PASS || process.env.MAILTRAP_PASS;
const smtpHost = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const smtpPort = Number(process.env.SMTP_PORT) || 2525;

const isEmailsEnabled = process.env.EMAILS_ENABLED !== 'false';
const isDev = process.env.NODE_ENV === 'development';

// Az emailek akkor vannak konfigurálva, ha van user/pass ÉS nincsenek letiltva ÉS nem development módban vagyunk
const isMailerConfigured = !!(smtpUser && smtpPass) && isEmailsEnabled && !isDev;

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
               const reason = !isEmailsEnabled ? "EMAILS_ENABLED=false" : isDev ? "NODE_ENV=development" : "SMTP NOT CONFIGURED";
               console.log(`--- MOCK EMAIL SENT (${reason}) ---`);
               console.log(`To: ${options.to}`);
               console.log(`Subject: ${options.subject}`);
               console.log("---------------------------------------------");
               return { messageId: "mock-id" };
          }
     } as any;

export { isMailerConfigured };