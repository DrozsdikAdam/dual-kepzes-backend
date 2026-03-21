import { Request, Response, NextFunction } from 'express';
import { CompanyImageService } from '../services/companyImage.service';
import { BadRequestError } from '../errors/AppError';

export const uploadCompanyImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const file = req.file;

    if (!file) {
      throw new BadRequestError('Nem lett kép kiválasztva a feltöltéshez.');
    }

    const companyImage = await CompanyImageService.uploadCompanyImage(
      companyId,
      file.buffer,
      req.body.caption
    );

    res.status(201).json({
      success: true,
      message: 'Kép sikeresen feltöltve a céghez.',
      data: companyImage
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;

    const images = await CompanyImageService.getCompanyImages(companyId);

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompanyImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, imageId } = req.params;

    await CompanyImageService.deleteCompanyImage(companyId, imageId);

    res.status(200).json({
      success: true,
      message: 'Kép sikeresen törölve.'
    });
  } catch (error) {
    next(error);
  }
};
