import nodemailer from "nodemailer";

const cleanEnvVar = (val: string | undefined): string | undefined => {
     if (!val) return undefined;
     const trimmed = val.trim();
     if (trimmed === '""' || trimmed === "''" || trimmed === "") {
          return undefined;
     }
     // Remove wrapping double quotes if present
     if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1);
     }
     return trimmed;
};

const smtpHost = cleanEnvVar(process.env.SMTP_HOST) || "sandbox.smtp.mailtrap.io";
const smtpPort = Number(process.env.SMTP_PORT) || 2525;

export const mailFrom = cleanEnvVar(process.env.MAIL_FROM) || '"Duális Képzés" <no-reply@dualis.hu>';

const isDev = process.env.NODE_ENV === 'development';

// Az emailek akkor vannak engedélyezve, ha:
// 1. Éles környezetben vagyunk ÉS nincsenek letiltva (EMAILS_ENABLED !== 'false')
// 2. Vagy fejlesztői környezetben vagyunk, de kifejezetten bekapcsoltuk (EMAILS_ENABLED === 'true')
const isEmailsEnabled = process.env.EMAILS_ENABLED === 'true' || (process.env.EMAILS_ENABLED !== 'false' && !isDev);

const isMailerConfigured = isEmailsEnabled;

export const mailer = isMailerConfigured
     ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
     })
     : {
          sendMail: async (options: any) => {
               const reason = !isEmailsEnabled ? "EMAILS_ENABLED is false" : "SMTP NOT CONFIGURED";
               console.log(`--- MOCK EMAIL SENT (${reason}) ---`);
               console.log(`To: ${options.to}`);
               console.log(`Subject: ${options.subject}`);
               console.log("---------------------------------------------");
               return { messageId: "mock-id" };
          }
     } as any;

export { isMailerConfigured };