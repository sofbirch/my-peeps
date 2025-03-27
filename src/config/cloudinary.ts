import { Cloudinary } from '@cloudinary/url-gen';

// Cloudinary cloud name
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Upload preset from Cloudinary dashboard
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Upload URL
export const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME
  }
}); 