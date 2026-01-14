import { Request } from "express"
import prisma from "../config/prisma"

export const auditLogger = async (req: Request, params: {
     action: string,
     entity: string,
     entityId?: string,
     details?: any
}) => {
     try {

          await prisma.auditLog.create({
               data: {
                    userId: req.user?.userId,
                    action: params.action,
                    entity: params.entity,
                    entityId: params.entityId,
                    details: params.details
               }
          })

     } catch (error) {
          console.error("Audit log error:", error);
     }

}