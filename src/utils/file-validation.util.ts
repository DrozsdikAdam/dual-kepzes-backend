/**
 * 🛡️ Never Trust The Client - File Validation Utility
 * 
 * Magic bytes (file signature) alapú fájltípus ellenőrzés.
 * A kliens által küldött MIME type könnyen hamisítható, 
 * ezért a fájl tényleges tartalmát is ellenőrizzük.
 */

import { fromBuffer } from 'file-type';
import { BadRequestError } from '../errors/AppError';

/**
 * Engedélyezett MIME típusok (PDF és Word dokumentumok)
 */
export const ALLOWED_MIME_TYPES = [
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * MIME type mapping a file-type csomag kimenetelemeihez
 */
const MIME_TYPE_MAP: Record<string, string> = {
     'pdf': 'application/pdf',
     'doc': 'application/msword',
     'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

/**
 * Validálja a fájl tartalmát magic bytes alapján
 * 
 * @param buffer A fájl tartalma Buffer-ként
 * @param filename A fájl eredeti neve (hibakezeléshez)
 * @returns A tényleges MIME type
 * @throws BadRequestError ha a fájl típusa nem engedélyezett vagy a tartalom nem egyezik
 */
export async function validateFileContent(
     buffer: Buffer,
     filename: string
): Promise<string> {
     const fileTypeResult = await fromBuffer(buffer);

     if (!fileTypeResult) {
          throw new BadRequestError(
               `Nem sikerült azonosítani a fájl típusát: ${filename}. ` +
               'Kérjük, töltsön fel érvényes PDF vagy Word dokumentumot.'
          );
     }

     const detectedMimeType = MIME_TYPE_MAP[fileTypeResult.ext] || fileTypeResult.mime;

     if (!ALLOWED_MIME_TYPES.includes(detectedMimeType)) {
          throw new BadRequestError(
               `Érvénytelen fájlformátum: ${filename}. ` +
               `Észlelt típus: ${fileTypeResult.ext} (${detectedMimeType}). ` +
               'Csak PDF (.pdf) és Word (.doc, .docx) dokumentumok engedélyezettek.'
          );
     }

     return detectedMimeType;
}

/**
 * Validálja az összes feltöltött fájlt magic bytes alapján
 * 
 * @param files A feltöltött fájlok objektuma
 * @throws BadRequestError ha bármely fájl típusa nem engedélyezett
 */
export async function validateUploadedFiles(
     files: { [fieldname: string]: Express.Multer.File[] } | undefined
): Promise<void> {
     if (!files) return;

     const validationPromises: Promise<void>[] = [];

     for (const [fieldname, fileArray] of Object.entries(files)) {
          for (const file of fileArray) {
               validationPromises.push(
                    validateFileContent(file.buffer, file.originalname).then(() => { })
               );
          }
     }

     await Promise.all(validationPromises);
}
