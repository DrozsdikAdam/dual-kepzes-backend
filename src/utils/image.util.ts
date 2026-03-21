import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Feldolgozza és elmenti a memóriában lévő képet.
 * Átméretezi max 1920px szélességre (arányos magassággal), és wepb formátumba konvertálja.
 * @param buffer Kép puffer a multer-ből
 * @param entityType Milyen entitáshoz tartozik (pl. 'company', 'gallery')
 * @returns {Promise<{ filename: string, url: string }>} A fájl neve és az URL elérhetőség
 */
export const processAndSaveImage = async (buffer: Buffer, entityType: string): Promise<{ filename: string, url: string }> => {
  // Győződjünk meg róla, hogy létezik a mappa (uploads/company vagy uploads/gallery)
  const targetDir = path.join(UPLOADS_DIR, entityType);
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${crypto.randomUUID()}.webp`;
  const filePath = path.join(targetDir, filename);

  // Kép feldolgozása libvips segítségével (sharp)
  await sharp(buffer)
    .resize(1920, 1920, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toFile(filePath);

  // Visszaadjuk a relatív url-t, amelyet az express.static ki fog tudni szolgálni
  const url = `/uploads/${entityType}/${filename}`;

  return { filename, url };
};

/**
 * Kép fizikai törlése a szerverről
 * @param url A kép eltárolt relatív elérési útvonala (pl. /uploads/company/uuid.webp)
 */
export const deleteImageFile = async (url: string) => {
  try {
    if (!url || !url.startsWith('/uploads/')) return;
    
    const relativePath = url.substring(1); // 'uploads/company/uuid.webp'
    const fullPath = path.join(process.cwd(), relativePath);
    
    await fs.unlink(fullPath);
  } catch (err) {
    console.error(`Failed to delete file for url ${url}:`, err);
    // Silent fail, ha a fájl már nincs a lemezen
  }
};
