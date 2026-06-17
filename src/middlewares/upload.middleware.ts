import multer from 'multer';
import { BadRequestError } from '../errors/AppError';

// Memóriában tartjuk a képet, amíg a 'sharp' feldolgozza
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Ha nem megfelelő a típus, dobjon hibát
    cb(new BadRequestError('Csak képfájlok (.jpg, .jpeg, .png, .webp) feltöltése engedélyezett!'));
  }
};

export const uploadImageMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB per fájl feltöltéskor
  },
  fileFilter,
});
