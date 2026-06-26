import { supabaseClient } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a base64 encoded image to Supabase Storage.
 * If the input is already a URL, it returns it directly.
 * 
 * @param {string} base64Data - The base64 string or URL
 * @param {string} bucketName - The name of the storage bucket
 * @param {string} folder - The folder path inside the bucket
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export const uploadBase64Image = async (base64Data, bucketName = 'images', folder = 'uploads') => {
  if (!base64Data || typeof base64Data !== 'string') return '';
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) return base64Data; // Already a URL
  if (!supabaseClient) return base64Data; // Fallback to base64 if no supabase connected

  try {
    // Extract base64 format info
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // It might be a raw base64 string without data: prefix, but we need mime type.
      // If it doesn't match, assume it's safe to just return it (could be mock data)
      return base64Data;
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Determine extension
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';

    const fileName = `${folder}/${uuidv4()}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient
      .storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      // Fallback: just return the base64 string so the app keeps working
      return base64Data; 
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    return base64Data;
  }
};

/**
 * Processes an array of images, uploading any base64 strings and returning an array of URLs.
 */
export const uploadImageArray = async (imagesArray, bucketName = 'images', folder = 'uploads') => {
  if (!Array.isArray(imagesArray)) return [];
  
  const uploadPromises = imagesArray.map(img => uploadBase64Image(img, bucketName, folder));
  return await Promise.all(uploadPromises);
};
