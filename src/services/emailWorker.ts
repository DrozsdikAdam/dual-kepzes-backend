import { Worker } from "bullmq"
import { redisConfig } from "../config/redis"
import { mailer } from "../config/mailer"
import prisma from "../config/prisma"

export const emailWorker = new Worker("email-queue", async (job) => {
     const { notificationId, email, subject, body } = job.data
     try {

          await mailer.sendMail({
               from: '"Duális Képzés" <no-reply@dualis.hu>',
               to: email,
               subject: subject,
               text: body
          })

          await prisma.notification.update({
               where: { id: notificationId },
               data: {
                    status: "SENT",
                    sentAt: new Date(),
                    error: null,
               }
          })

     } catch (error: any) {
          await prisma.notification.update({
               where: { id: notificationId },
               data: {
                    status: "FAILED",
                    error: error.message,
                    sentAt: new Date(),
               }
          })
          throw error;
     }
},
     { connection: redisConfig }
)
