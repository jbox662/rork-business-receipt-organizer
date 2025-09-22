import { supabase } from '@/constants/supabase';
import { decode } from 'base64-arraybuffer';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase storage
 * @param imageUri - Local image URI (file:// or data: URI)
 * @param base64Data - Base64 encoded image data (optional, will be extracted from URI if not provided)
 * @param userId - User ID for organizing files
 * @param fileName - Optional custom filename
 * @returns Promise with upload result
 */
export async function uploadImageToSupabase(
  imageUri: string,
  base64Data?: string,
  userId?: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Validate inputs
    if (!imageUri || !imageUri.trim()) {
      throw new Error('Image URI is required');
    }
    if (imageUri.length > 2000) {
      throw new Error('Image URI is too long');
    }
    if (base64Data && base64Data.length > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Base64 data is too large');
    }
    if (fileName && fileName.length > 255) {
      throw new Error('Filename is too long');
    }

    console.log('Starting image upload to Supabase...');
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('Has base64 data:', !!base64Data);
    console.log('User ID:', userId);

    // Generate filename if not provided
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = fileName?.trim().replace(/[^a-zA-Z0-9._-]/g, '_') || `receipt_${timestamp}_${randomId}.jpg`;
    const finalFileName = sanitizedFileName;
    
    // Create the storage path
    const sanitizedUserId = userId?.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = sanitizedUserId ? `receipts/${sanitizedUserId}/${finalFileName}` : `receipts/anonymous/${finalFileName}`;
    
    console.log('Storage path:', storagePath);

    let imageData: ArrayBuffer;

    if (base64Data && base64Data.trim()) {
      // Use provided base64 data
      console.log('Using provided base64 data');
      const sanitizedBase64 = base64Data.trim();
      imageData = decode(sanitizedBase64);
    } else if (imageUri.startsWith('data:')) {
      // Extract base64 from data URI
      console.log('Extracting base64 from data URI');
      const sanitizedUri = imageUri.trim();
      const base64 = sanitizedUri.split(',')[1];
      if (!base64) {
        throw new Error('Invalid data URI format');
      }
      imageData = decode(base64);
    } else if (imageUri.startsWith('file://')) {
      // For file URIs, we need to read the file
      console.log('Reading file from URI');
      try {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }
        imageData = await response.arrayBuffer();
      } catch (fetchError) {
        console.error('Error fetching file:', fetchError);
        throw new Error('Failed to read image file');
      }
    } else {
      throw new Error('Unsupported image URI format');
    }

    console.log('Image data size:', imageData.byteLength, 'bytes');

    if (imageData.byteLength === 0) {
      throw new Error('Image data is empty');
    }

    // Upload to Supabase storage
    console.log('Uploading to Supabase storage...');
    const { data, error } = await supabase.storage
      .from('receipt-images')
      .upload(storagePath, imageData, {
        contentType: 'image/jpeg',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('receipt-images')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete an image from Supabase storage
 * @param imageUrl - The public URL of the image to delete
 * @param userId - User ID for organizing files
 * @returns Promise with deletion result
 */
export async function deleteImageFromSupabase(
  imageUrl: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate inputs
    if (!imageUrl || !imageUrl.trim()) {
      throw new Error('Image URL is required');
    }
    if (imageUrl.length > 2000) {
      throw new Error('Image URL is too long');
    }

    const sanitizedUrl = imageUrl.trim();
    console.log('Deleting image from Supabase:', sanitizedUrl);

    // Extract the file path from the URL
    const url = new URL(sanitizedUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'receipt-images');
    
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL format');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    console.log('File path to delete:', filePath);

    const { error } = await supabase.storage
      .from('receipt-images')
      .remove([filePath]);

    if (error) {
      console.error('Supabase storage deletion error:', error);
      throw new Error(`Storage deletion failed: ${error.message}`);
    }

    console.log('Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Image deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deletion error',
    };
  }
}