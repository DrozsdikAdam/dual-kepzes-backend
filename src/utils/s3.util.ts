import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Beállítjuk a Supabase S3 kliensét a környezeti változók alapján
export const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION || 'eu-west-1',
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Fontos a Supabase S3 kompatibilitáshoz
});

/**
 * Fájl feltöltése a Supabase S3 bucketbe
 * @param key Az S3-on belüli útvonal és fájlnév (pl. company/uuid.webp)
 * @param buffer A fájl tartalma
 * @param contentType A fájl MIME típusa (alapértelmezetten image/webp)
 */
export const uploadToS3 = async (
  key: string,
  buffer: Buffer,
  contentType: string = 'image/webp'
): Promise<void> => {
  const bucketName = process.env.SUPABASE_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('Hiányzik a SUPABASE_S3_BUCKET_NAME környezeti változó!');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
};

/**
 * Fájl törlése a Supabase S3 bucketből
 * @param key Az S3-on belüli útvonal és fájlnév
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const bucketName = process.env.SUPABASE_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('Hiányzik a SUPABASE_S3_BUCKET_NAME környezeti változó!');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
};
