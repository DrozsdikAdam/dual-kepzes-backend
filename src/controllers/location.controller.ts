import { Request, Response, NextFunction } from "express";
import { locationService } from "../services/location.service";

export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const locations = await locationService.getAll();
          res.json({
               success: true,
               data: locations
          });
     } catch (error) {
          next(error);
     }
};
