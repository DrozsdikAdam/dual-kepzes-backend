import { Request, Response } from "express"
import prisma from "../config/prisma"
import { logAction } from "../utils/logger"

export const createNews = async (req: Request, res: Response) => {
     try {
          const { title, content, isImportant, targetGroup, tags } = req.body;

          const news = await prisma.news.create({
               data: {
                    title,
                    content,
                    isImportant,
                    targetGroup,
                    tags
               }
          })

          await logAction(req, {
               action: "CREATE_NEWS",
               entity: "News",
               entityId: news.id,
               details: {
                    createdById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          })

          return res.status(201).json({ message: "Hír sikeresen létrehozva.", news })

     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír létrehozásakor." })
     }
}

