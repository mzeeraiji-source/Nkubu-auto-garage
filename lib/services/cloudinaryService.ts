/**
 * Cloudinary Service
 * Image hosting and optimization for vehicle photos
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  /**
   * Upload vehicle image
   */
  static async uploadVehicleImage(
    fileData: string,
    vehicleId: string
  ): Promise<{
    success: boolean;
    url?: string;
    publicId?: string;
    error?: string;
  }> {
    try {
      const result = await cloudinary.uploader.upload(fileData, {
        folder: `vehicles/${vehicleId}`,
        resource_type: 'auto',
        quality: 'auto:best',
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(publicId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { success: true };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  }

  /**
   * Get optimized image URL
   */
  static getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}

export default CloudinaryService;