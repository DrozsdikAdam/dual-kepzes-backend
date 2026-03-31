import { processAndSaveImage, deleteImageFile } from '../image.util';

// Mock-oljuk az S3 utility-t – nem akarunk valódi S3 hívásokat
jest.mock('../s3.util', () => ({
    uploadToS3: jest.fn().mockResolvedValue(undefined),
    deleteFromS3: jest.fn().mockResolvedValue(undefined),
}));

// Mock-oljuk a sharp-ot
jest.mock('sharp', () => {
    const mockSharp = jest.fn(() => ({
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-webp-data')),
    }));
    (mockSharp as any).fit = { inside: 'inside' };
    return { __esModule: true, default: mockSharp };
});

// Mock-oljuk a crypto.randomUUID-t stabil fájlnévhez
jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

import { uploadToS3, deleteFromS3 } from '../s3.util';
import sharp from 'sharp';

describe('image.util', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            SUPABASE_PUBLIC_URL: 'https://example.supabase.co/storage/v1/object/public',
            SUPABASE_S3_BUCKET_NAME: 'images',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    // =============================================
    // processAndSaveImage
    // =============================================
    describe('processAndSaveImage', () => {
        const fakeBuffer = Buffer.from('fake-image-data');

        it('should process image with sharp, upload to S3, and return correct url', async () => {
            const result = await processAndSaveImage(fakeBuffer, 'company');

            // Sharp-ot meghívta a bemeneti bufferrel
            expect(sharp).toHaveBeenCalledWith(fakeBuffer);

            // S3 upload megtörtént a helyes kulccsal
            expect(uploadToS3).toHaveBeenCalledWith(
                'company/test-uuid-1234.webp',
                Buffer.from('fake-webp-data')
            );

            // A visszatérési érték helyes
            expect(result).toEqual({
                filename: 'test-uuid-1234.webp',
                url: 'https://example.supabase.co/storage/v1/object/public/images/company/test-uuid-1234.webp',
            });
        });

        it('should work with gallery entity type', async () => {
            const result = await processAndSaveImage(fakeBuffer, 'gallery');

            expect(uploadToS3).toHaveBeenCalledWith(
                'gallery/test-uuid-1234.webp',
                expect.any(Buffer)
            );

            expect(result.url).toContain('/gallery/');
        });

        it('should throw if SUPABASE_PUBLIC_URL is missing', async () => {
            delete process.env.SUPABASE_PUBLIC_URL;

            await expect(processAndSaveImage(fakeBuffer, 'company')).rejects.toThrow(
                'Missing public URL prefix or bucket name environment variables.'
            );
        });

        it('should throw if SUPABASE_S3_BUCKET_NAME is missing', async () => {
            delete process.env.SUPABASE_S3_BUCKET_NAME;

            await expect(processAndSaveImage(fakeBuffer, 'company')).rejects.toThrow(
                'Missing public URL prefix or bucket name environment variables.'
            );
        });

        it('should propagate S3 upload errors', async () => {
            (uploadToS3 as jest.Mock).mockRejectedValueOnce(new Error('S3 connection failed'));

            await expect(processAndSaveImage(fakeBuffer, 'company')).rejects.toThrow(
                'S3 connection failed'
            );
        });
    });

    // =============================================
    // deleteImageFile
    // =============================================
    describe('deleteImageFile', () => {
        it('should extract key from S3 URL and call deleteFromS3', async () => {
            const s3Url =
                'https://example.supabase.co/storage/v1/object/public/images/company/some-uuid.webp';

            await deleteImageFile(s3Url);

            expect(deleteFromS3).toHaveBeenCalledWith('company/some-uuid.webp');
        });

        it('should not call deleteFromS3 for old local /uploads/ URLs', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            await deleteImageFile('/uploads/company/old-file.webp');

            expect(deleteFromS3).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Local file deletion not supported')
            );

            consoleSpy.mockRestore();
        });

        it('should silently handle missing env config', async () => {
            delete process.env.SUPABASE_PUBLIC_URL;
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await deleteImageFile('https://some-url.com/file.webp');

            expect(deleteFromS3).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Missing config to delete from S3');

            consoleSpy.mockRestore();
        });

        it('should silently handle S3 delete errors', async () => {
            (deleteFromS3 as jest.Mock).mockRejectedValueOnce(new Error('S3 delete failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const s3Url =
                'https://example.supabase.co/storage/v1/object/public/images/gallery/img.webp';

            await deleteImageFile(s3Url);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should not call deleteFromS3 for unrecognized URLs', async () => {
            await deleteImageFile('https://totally-different-domain.com/img.webp');

            expect(deleteFromS3).not.toHaveBeenCalled();
        });
    });
});
