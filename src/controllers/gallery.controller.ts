import { Request, Response, NextFunction } from 'express';
import { GalleryService } from '../services/gallery.service';
import { BadRequestError } from '../errors/AppError';

export const getGalleries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const galleries = await GalleryService.getGalleries();

    res.status(200).json({
      success: true,
      data: galleries
    });
  } catch (error) {
    next(error);
  }
};

export const createGalleryGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      throw new BadRequestError('A galéria csoport címe (title) kötelező.');
    }

    const newGroup = await GalleryService.createGalleryGroup(title, description);

    res.status(201).json({
      success: true,
      message: 'Képcsoport sikeresen létrehozva.',
      data: newGroup
    });
  } catch (error) {
    next(error);
  }
};

export const uploadGalleryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const file = req.file;

    if (!file) {
      throw new BadRequestError('Nem lett kép kiválasztva a feltöltéshez.');
    }

    const galleryImage = await GalleryService.uploadGalleryImage(
      groupId,
      file.buffer,
      req.body.caption
    );

    res.status(201).json({
      success: true,
      message: 'Kép sikeresen feltöltve a galériába.',
      data: galleryImage
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;

    await GalleryService.deleteGalleryGroup(groupId);

    res.status(200).json({
      success: true,
      message: 'Képcsoport és a hozzá tartozó képek sikeresen törölve.'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;

    await GalleryService.deleteGalleryImage(imageId);

    res.status(200).json({
      success: true,
      message: 'Galéria kép sikeresen törölve.'
    });
  } catch (error) {
    next(error);
  }
};
