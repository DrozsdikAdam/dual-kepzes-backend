import { Request, Response, NextFunction } from "express";
import { searchService } from "../services/search.service";
import { BadRequestError } from "../errors/AppError";

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { q } = req.query;

          if (!q || typeof q !== "string") {
               throw new BadRequestError("Keresési paraméter (q) megadása kötelező.");
          }

          if (q.trim().length < 2) {
               return res.json({
                    success: true,
                    data: {
                         positions: [],
                         companies: [],
                         news: []
                    }
               });
          }

          const result = await searchService.globalSearch(q.trim(), 10);

          res.json({
               success: true,
               data: result
          });
     } catch (error) {
          next(error);
     }
};
