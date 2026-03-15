import { Request, Response, NextFunction } from "express";
import { locationService } from "../services/location.service";
import { mapLocationWithCompany } from "../utils/mapper.util";

export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const locations = await locationService.getAll();
          res.json({
               success: true,
               data: locations.map(mapLocationWithCompany).filter(l => l !== null)
          });
     } catch (error) {
          next(error);
     }
};
