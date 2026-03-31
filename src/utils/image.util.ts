import sharp from 'sharp';
import crypto from 'crypto';
import { uploadToS3, deleteFromS3 } from './s3.util';

/**
 * Feldolgozza és elmenti a memóriában lévő képet az S3 bucketbe.
 * Átméretezi max 1920px szélességre (arányos magassággal), és wepb formátumba konvertálja.
 * @param buffer Kép puffer a multer-ből
 * @param entityType Milyen entitáshoz tartozik (pl. 'company', 'gallery')
 * @returns {Promise<{ filename: string, url: string }>} A fájl neve és az URL elérhetőség
 */
export const processAndSaveImage = async (buffer: Buffer, entityType: string): Promise<{ filename: string, url: string }> => {
  const filename = `${crypto.randomUUID()}.webp`;
  const key = `${entityType}/${filename}`;

  // Kép feldolgozása libvips segítségével (sharp) - bufferbe
  const processedBuffer = await sharp(buffer)
    .resize(1920, 1920, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toBuffer();

  // Fájl feltöltése az S3-ra
  await uploadToS3(key, processedBuffer);

  // Visszaadjuk a publikus S3 url-t, amelyet az objektum storage ad
  const publicUrlPrefix = process.env.SUPABASE_PUBLIC_URL;
  const bucketName = process.env.SUPABASE_S3_BUCKET_NAME;
  
  if(!publicUrlPrefix || !bucketName) {
      throw new Error("Missing public URL prefix or bucket name environment variables.");
  }
  
  const url = `${publicUrlPrefix}/${bucketName}/${key}`;

  return { filename, url };
};

/**
 * Kép fizikai törlése az S3 bucketből
 * @param url A kép eltárolt publikus URL-je
 */
export const deleteImageFile = async (url: string) => {
  try {
    const publicUrlPrefix = process.env.SUPABASE_PUBLIC_URL;
    const bucketName = process.env.SUPABASE_S3_BUCKET_NAME;
    
    if(!publicUrlPrefix || !bucketName) {
      console.error("Missing config to delete from S3");
      return;
    }

    const prefix = `${publicUrlPrefix}/${bucketName}/`;
    
    // Ha a kapott URL tartalmazza a prefixet, kivágjuk az S3 kulcsot
    if (url && url.startsWith(prefix)) {
      const key = url.substring(prefix.length); 
      await deleteFromS3(key);
    } 
    // Kompatibilitás a régi lokális képekkel
    else if (url && url.startsWith('/uploads/')) {
        console.warn(`Local file deletion not supported in S3 mode: ${url}`);
    }
  } catch (err) {
    console.error(`Failed to delete file for url ${url}:`, err);
    // Silent fail
  }
};
