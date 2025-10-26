import { supabase } from '@/lib/supabase/client';

const BUCKET_NAME = 'listing-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function uploadListingImage(
  file: File,
  listingId: string,
  index: number
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${listingId}/${Date.now()}-${index}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteListingImage(url: string): Promise<void> {
  try {
    const path = url.split(`/${BUCKET_NAME}/`)[1];
    if (!path) return;

    await supabase.storage.from(BUCKET_NAME).remove([path]);
  } catch (error) {
    console.error('Delete error:', error);
  }
}

export async function deleteListingFolder(listingId: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list(listingId);

    if (files && files.length > 0) {
      const filePaths = files.map((file: any) => `${listingId}/${file.name}`);
      await supabase.storage.from(BUCKET_NAME).remove(filePaths);
    }
  } catch (error) {
    console.error('Delete folder error:', error);
  }
}
