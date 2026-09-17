// Supabase Cloud Storage Service for Vehicle Finance App
// Uploads borrower photos, guarantor photos, vehicle images, RC, and Insurance documents

const SUPABASE_URL = 'https://wusdkpoapxlblqfpbswt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j6hGPLBrfIi7liQHe5bzxA_gXF7aKrA';
const BUCKET_NAME = 'vehicle-finance';

/**
 * Get public URL for a stored file
 */
export const getPublicUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const cleanPath = filePath.replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
};

/**
 * Upload single image URI (local file:// or content:// or data URL) to Supabase Storage
 * @param {string} localUri - Local device URI from camera or gallery
 * @param {string} folder - Destination folder within bucket (e.g. 'customers', 'vehicles', 'guarantors', 'documents')
 * @returns {Promise<string>} Public Supabase HTTPS URL
 */
export const uploadImageToSupabase = async (localUri, folder = 'general') => {
  if (!localUri) return null;

  // If already an HTTP/HTTPS URL, no need to upload
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  try {
    // Generate clean unique filename
    const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomStr}.${cleanExt}`;
    const filePath = `${folder}/${fileName}`;

    const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

    // Prepare FormData for React Native fetch
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: fileName,
      type: mimeType,
    });

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-upsert': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      // Fallback method: upload as Blob
      try {
        const blobRes = await fetch(localUri);
        const blob = await blobRes.blob();
        const fallbackRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: blob,
        });

        if (!fallbackRes.ok) {
          const errText = await fallbackRes.text();
          console.warn('Supabase storage upload fallback failed:', errText);
          // Return localUri if offline or upload failed so user data is not lost
          return localUri;
        }
      } catch (blobErr) {
        console.warn('Supabase blob conversion failed:', blobErr.message);
        return localUri;
      }
    }

    return getPublicUrl(filePath);
  } catch (error) {
    console.error('Error uploading image to Supabase Storage:', error);
    // Return the local URI as graceful fallback
    return localUri;
  }
};

/**
 * Upload array of image URIs concurrently
 * @param {string[]} uris - Array of local image URIs
 * @param {string} folder - Destination folder
 * @returns {Promise<string[]>} Array of public URLs
 */
export const uploadMultipleImagesToSupabase = async (uris = [], folder = 'vehicles') => {
  if (!Array.isArray(uris) || uris.length === 0) return [];
  const uploadPromises = uris.map((uri) => uploadImageToSupabase(uri, folder));
  return Promise.all(uploadPromises);
};

/**
 * Process and upload all loan photos before persisting to backend/local store
 * @param {Object} loanData - Object containing photo fields
 * @returns {Promise<Object>} Object with resolved Supabase public URLs
 */
export const processLoanPhotosForUpload = async (loanData) => {
  const result = { ...loanData };

  // 1. Customer Photo
  if (loanData.customerPhoto && !loanData.customerPhoto.startsWith('http')) {
    result.customerPhoto = await uploadImageToSupabase(loanData.customerPhoto, 'customers');
    result.customerPhotoUrl = result.customerPhoto;
  } else if (loanData.customerPhoto) {
    result.customerPhotoUrl = loanData.customerPhoto;
  }

  // 2. Guarantor Photo
  if (loanData.guarantorPhoto && !loanData.guarantorPhoto.startsWith('http')) {
    result.guarantorPhoto = await uploadImageToSupabase(loanData.guarantorPhoto, 'guarantors');
    result.guarantorPhotoUrl = result.guarantorPhoto;
  } else if (loanData.guarantorPhoto) {
    result.guarantorPhotoUrl = loanData.guarantorPhoto;
  }

  // 3. Vehicle Photos (Array up to 3)
  if (Array.isArray(loanData.vehiclePhotos) && loanData.vehiclePhotos.length > 0) {
    result.vehiclePhotos = await uploadMultipleImagesToSupabase(loanData.vehiclePhotos, 'vehicles');
    result.vehiclePhotoUrls = JSON.stringify(result.vehiclePhotos);
  } else if (loanData.vehiclePhotos) {
    result.vehiclePhotoUrls = Array.isArray(loanData.vehiclePhotos)
      ? JSON.stringify(loanData.vehiclePhotos)
      : String(loanData.vehiclePhotos);
  }

  // 4. RC Photo
  if (loanData.rcPhoto && !loanData.rcPhoto.startsWith('http')) {
    result.rcPhoto = await uploadImageToSupabase(loanData.rcPhoto, 'documents/rc');
    result.rcPhotoUrl = result.rcPhoto;
  } else if (loanData.rcPhoto) {
    result.rcPhotoUrl = loanData.rcPhoto;
  }

  // 5. Insurance Photo
  if (loanData.insurancePhoto && !loanData.insurancePhoto.startsWith('http')) {
    result.insurancePhoto = await uploadImageToSupabase(loanData.insurancePhoto, 'documents/insurance');
    result.insurancePhotoUrl = result.insurancePhoto;
  } else if (loanData.insurancePhoto) {
    result.insurancePhotoUrl = loanData.insurancePhoto;
  }

  return result;
};

export default {
  uploadImageToSupabase,
  uploadMultipleImagesToSupabase,
  processLoanPhotosForUpload,
  getPublicUrl,
};
