import prisma from '../config/prisma';
import { processAndSaveImage, deleteImageFile } from '../utils/image.util';
import { NotFoundError } from '../errors/AppError';

export class CompanyImageService {
  static async uploadCompanyImage(companyId: string, fileBuffer: Buffer, caption?: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundError('Cég');
    }

    const { url } = await processAndSaveImage(fileBuffer, 'company');

    const companyImage = await prisma.companyImage.create({
      data: {
        companyId,
        url,
        caption: caption || null
      }
    });

    return companyImage;
  }

  static async getCompanyImages(companyId: string) {
    const images = await prisma.companyImage.findMany({
      where: { companyId },
      orderBy: { order: 'asc' }
    });

    return images;
  }

  static async deleteCompanyImage(companyId: string, imageId: string) {
    const image = await prisma.companyImage.findUnique({
      where: { id: imageId, companyId }
    });

    if (!image) {
      throw new NotFoundError('Céghez tartozó kép');
    }

    await deleteImageFile(image.url);

    await prisma.companyImage.delete({
      where: { id: imageId }
    });
  }
}
