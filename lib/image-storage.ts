// Frequency Content Publishing Suite - Image Storage (Supabase Storage)

import { getSupabaseClient, isSupabaseAvailable } from './supabase';
import { CarouselImage, generateId } from './types';

const BUCKET_NAME = 'carousel-images';

/**
 * Upload an image file to Supabase Storage
 * Returns the public URL
 */
export async function uploadImage(
  file: File,
  arcId: string,
  postId: string,
  onProgress?: (percent: number) => void
): Promise<CarouselImage | null> {
  const client = getSupabaseClient();
  if (!client) {
    // Fallback: return a local blob URL
    const url = URL.createObjectURL(file);
    return {
      id: generateId(),
      url,
      filename: file.name,
      order: 0,
      uploaded: false,
    };
  }

  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const path = `${arcId}/${postId}/${filename}`;

    // Simulate progress since supabase-js doesn't support upload progress natively
    onProgress?.(30);

    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    onProgress?.(80);

    if (uploadError) {
      console.error('Failed to upload image:', uploadError);
      // Fallback to blob URL
      const url = URL.createObjectURL(file);
      return {
        id: generateId(),
        url,
        filename: file.name,
        order: 0,
        uploaded: false,
      };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    onProgress?.(100);

    return {
      id: generateId(),
      url: urlData.publicUrl,
      filename: file.name,
      order: 0,
      uploaded: true,
    };
  } catch (err) {
    console.error('Error uploading image:', err);
    const url = URL.createObjectURL(file);
    return {
      id: generateId(),
      url,
      filename: file.name,
      order: 0,
      uploaded: false,
    };
  }
}

/**
 * Upload multiple images for a post
 */
export async function uploadImages(
  files: File[],
  arcId: string,
  postId: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<CarouselImage[]> {
  const results: CarouselImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const image = await uploadImage(
      files[i],
      arcId,
      postId,
      (percent) => onProgress?.(i, percent)
    );
    if (image) {
      image.order = i;
      results.push(image);
    }
  }

  return results;
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Extract path from URL
    const urlObj = new URL(imageUrl);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/carousel-images\/(.+)/);
    if (!pathMatch) return false;

    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([pathMatch[1]]);

    if (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting image:', err);
    return false;
  }
}
