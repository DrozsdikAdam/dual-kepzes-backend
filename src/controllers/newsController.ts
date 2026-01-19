import { Request, Response } from "express"
import prisma from "../config/prisma"
import { logAction } from "../utils/logger"

const newsSelector = {
     id: true,
     title: true,
     content: true,
     isImportant: true,
     targetGroup: true,
     tags: true,
     createdAt: true,
     updatedAt: true,
     isArchived: true
}

const userNewsSelector = {
     id: true,
     title: true,
     content: true,
     isImportant: true,
     targetGroup: true,
     tags: true,
     createdAt: true,
}

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

export const getUserNews = async (req: Request, res: Response) => {
     try {
          const newsArray = await prisma.news.findMany({
               where: { isArchived: false },
               orderBy: {
                    createdAt: "desc"
               },
               select: userNewsSelector
          })

          const filterNews = newsArray.filter((news) => {
               if (news.targetGroup === "ALL") {
                    return true;
               }
               if (news.targetGroup === "STUDENT" && req.user?.role === "STUDENT") {
                    return true;
               }
               return false;
          })

          return res.status(200).json({ news: filterNews })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hírek lekérdezésekor." })
     }
}

export const getUserNewsById = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;

          const news = await prisma.news.findFirst({
               where: { id, isArchived: false },
               select: userNewsSelector
          })

          if (!news) {
               return res.status(404).json({ message: "A hír nem található." })
          }

          return res.status(200).json({ news })
     } catch (error) {
          return res.json(500).json({ message: "Hiba a hír lekérdezésekor." })
     }
}

export const getAdminNews = async (req: Request, res: Response) => {
     try {
          const news = await prisma.news.findMany({
               orderBy: {
                    createdAt: "desc"
               },
               select: newsSelector
          })

          return res.status(200).json({ news })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hírek lekérdezésekor." })
     }
}

export const getAdminNewsById = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;

          const news = await prisma.news.findFirst({
               where: { id },
               select: newsSelector
          })

          if (!news) {
               return res.status(404).json({ message: "A hír nem található." })
          }

          return res.status(200).json({ news })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír lekérdezésekor." })
     }
}

export const archiveNews = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;

          const news = await prisma.news.update({
               where: { id },
               data: {
                    isArchived: true
               },
               select: newsSelector
          })

          await logAction(req, {
               action: "ARCHIVE_NEWS",
               entity: "News",
               entityId: news.id,
               details: {
                    updatedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          })

          return res.status(200).json({ message: "Hír sikeresen archiválva.", news })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír archiválásakor." })
     }
}

export const unarchiveNews = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          const news = await prisma.news.findFirst({
               where: { id }
          })

          if (!news) {
               return res.status(404).json({ message: "A keresett hír nem található." })
          }

          const unarchivedNews = await prisma.news.update({
               where: { id },
               data: {
                    isArchived: false
               }
          })

          await logAction(req, {
               action: "UNARCHIVE_NEWS",
               entity: "News",
               entityId: unarchivedNews.id,
               details: {
                    updatedById: req.user?.userId,
                    title: unarchivedNews.title,
                    targetGroup: unarchivedNews.targetGroup
               }
          })

          return res.status(200).json({ message: "Hír sikeresen archiválva lett." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír archiválásának visszavonásakor." })
     }
}

export const updateNews = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          const { title, content, isImportant, targetGroup, tags } = req.body;

          const news = await prisma.news.update({
               where: { id },
               data: {
                    title,
                    content,
                    isImportant,
                    targetGroup,
                    tags
               },
               select: newsSelector
          })

          await logAction(req, {
               action: "UPDATE_NEWS",
               entity: "News",
               entityId: news.id,
               details: {
                    updatedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          })

          return res.status(200).json({ message: "Hír sikeresen frissítve.", news })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír frissítésekor." })
     }
}

export const deleteNews = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;

          const news = await prisma.news.findFirst({
               where: { id }
          })

          if (!news) {
               return res.status(404).json({ message: "A keresett hír nem található." })
          }

          await prisma.news.update({
               where: { id },
               data: {
                    deletedAt: new Date()
               }
          })

          await logAction(req, {
               action: "DELETE_NEWS",
               entity: "News",
               entityId: news.id,
               details: {
                    deletedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          })

          return res.status(200).json({ message: "Hír sikeresen törölve lett." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a hír törlésekor." })
     }
}

export const getArchivedNews = async (req: Request, res: Response) => {
     try {
          const news = await prisma.news.findMany({
               where: {
                    deletedAt: null,
                    isArchived: true
               },
               select: newsSelector,
               orderBy: {
                    createdAt: "desc"
               }
          })

          return res.status(200).json({ news })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a archivált hírek lekérdezésekor." })
     }
}