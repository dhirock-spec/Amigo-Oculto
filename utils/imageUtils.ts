/**
 * Compresses a base64 image string to a smaller size/quality suitable for Firestore.
 * Firestore documents have a 1MB limit, so we aim for small file sizes.
 */
export const compressImage = (base64Str: string, maxWidth = 600, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert back to base64 with reduced quality
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};