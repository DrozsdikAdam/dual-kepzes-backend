import prisma from '../config/prisma';
import { processAndSaveImage, deleteImageFile } from '../utils/image.util';
import { NotFoundError } from '../errors/AppError';

export class GalleryService {
  static async getGalleries() {
    const galleries = await prisma.galleryGroup.findMany({
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return galleries;
  }

  static async createGalleryGroup(title: string, description?: string) {
    const newGroup = await prisma.galleryGroup.create({
      data: { title, description }
    });

    return newGroup;
  }

  static async uploadGalleryImage(groupId: string, fileBuffer: Buffer, caption?: string) {
    const group = await prisma.galleryGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundError('Képcsoport');
    }

    const { url } = await processAndSaveImage(fileBuffer, 'gallery');

    const galleryImage = await prisma.galleryImage.create({
      data: {
        galleryGroupId: groupId,
        url,
        caption: caption || null
      }
    });

    return galleryImage;
  }

  static async deleteGalleryGroup(groupId: string) {
    const group = await prisma.galleryGroup.findUnique({
      where: { id: groupId },
      include: { images: true }
    });

    if (!group) {
      throw new NotFoundError('Képcsoport');
    }

    for (const img of group.images) {
      await deleteImageFile(img.url);
    }

    await prisma.galleryGroup.delete({
      where: { id: groupId }
    });
  }

  static async deleteGalleryImage(imageId: string) {
    const image = await prisma.galleryImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new NotFoundError('A keresett kép');
    }

    await deleteImageFile(image.url);

    await prisma.galleryImage.delete({
      where: { id: imageId }
    });
  }
}
