import multer from "multer";

/**
 * GDPR-kompatibilis fájlfeltöltés konfiguráció
 * 
 * A fájlokat CSAK memóriában (Buffer) tárolja, nem menti lemezre.
 * Ez biztosítja, hogy a fájlok csak átmenő állomásként használják a szervert,
 * és a küldés után azonnal törlődnek a garbage collection által.
 */

// Memory storage - fájlok pufferként a memóriában
const storage = multer.memoryStorage();

// Engedélyezett MIME típusok (PDF és Word dokumentumok)
const ALLOWED_MIME_TYPES = [
     "application/pdf",
     "application/msword",
     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

// Fájlméret limit: 25MB (bytes-ban)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Fájl szűrő - csak PDF és Word dokumentumokat enged
const fileFilter = (
     _req: Express.Request,
     file: Express.Multer.File,
     cb: multer.FileFilterCallback
) => {
     if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
     } else {
          cb(new Error(`Nem engedélyezett fájltípus: ${file.mimetype}. Csak PDF és Word dokumentumok tölthetők fel.`));
     }
};

// Multer konfiguráció exportálása
export const uploadConfig = multer({
     storage,
     fileFilter,
     limits: {
          fileSize: MAX_FILE_SIZE,
          files: 2 // Maximum 2 fájl (CV + motivációs levél)
     }
});

// Konstansok exportálása
export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
