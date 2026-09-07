import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';

export type UploadedImage = { url: string; publicId: string };

export function uploadImage(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'sundas-beauty-parlour', resource_type: 'image' }, (error, result) => {
      if (error || !result) return reject(error ?? new Error('Image upload failed'));
      const uploaded = result as UploadApiResponse;
      resolve({ url: uploaded.secure_url, publicId: uploaded.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId?: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}