/**
 * ============================================================================
 * AUTOMATIC WEBP CONVERTER & SUPABASE STORAGE UPLOADER — src/lib/imageUpload.js
 * ============================================================================
 * Fitur:
 * 1. Menerima file gambar apa pun (.jpg, .jpeg, .png, .bmp, .gif, .webp).
 * 2. Jika ekstensi/tipe bukan `.webp` (atau untuk optimasi ukuran), otomatis
 *    mengonversi gambar menjadi format `.webp` menggunakan HTML5 Canvas API.
 * 3. Mengunggah file `.webp` ke Supabase Storage bucket `project-images`
 *    dengan `contentType: 'image/webp'` dan mengembalikan Public URL `.webp`.
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from './supabase';

export const SUPABASE_PROJECT_BUCKET = 'project-images';

function slugifyFileName(name) {
  const baseName = name.replace(/\.[^/.]+$/, '');
  return (
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project-image'
  );
}

/**
 * Mengonversi File gambar apa pun menjadi objek File `.webp` + DataURL preview
 * Jika `exactCrop = { width, height }` diberikan, gambar otomatis dicrop & di-resize pas dengan dimensi target (misal: 1200 x 630).
 * Jika `preserveOriginalDimensions = true`, maka ukuran/resolusi asli foto dipertahankan 100%.
 */
export function convertImageFileToWebP(
  file,
  quality = 0.88,
  maxWidth = 1920,
  preserveOriginalDimensions = false,
  exactCrop = null
) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar yang valid.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk konversi WebP.'));
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        let targetWidth = naturalW;
        let targetHeight = naturalH;
        let sx = 0;
        let sy = 0;
        let sw = naturalW;
        let sh = naturalH;

        if (exactCrop && exactCrop.width && exactCrop.height) {
          targetWidth = exactCrop.width;
          targetHeight = exactCrop.height;

          // Aspect fill & center crop
          const targetRatio = targetWidth / targetHeight;
          const currentRatio = naturalW / naturalH;

          if (currentRatio > targetRatio) {
            sw = Math.round(naturalH * targetRatio);
            sh = naturalH;
            sx = Math.round((naturalW - sw) / 2);
            sy = 0;
          } else {
            sw = naturalW;
            sh = Math.round(naturalW / targetRatio);
            sx = 0;
            sy = Math.round((naturalH - sh) / 2);
          }
        } else if (!preserveOriginalDimensions && maxWidth && targetWidth > maxWidth) {
          const ratio = maxWidth / targetWidth;
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak tersedia di browser ini.'));
          return;
        }

        // Image smoothing kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        const cleanSlug = slugifyFileName(file.name);
        const webpFileName = `${Date.now()}-${cleanSlug}.webp`;

        // Buat DataURL .webp sebagai fallback / instant preview
        const webpDataUrl = canvas.toDataURL('image/webp', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengonversi gambar ke format .webp'));
              return;
            }

            const webpFile = new File([blob], webpFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve({
              webpFile,
              webpFileName,
              webpDataUrl,
              originalName: file.name,
              originalType: file.type,
              originalSize: file.size,
              webpSize: blob.size,
              width: targetWidth,
              height: targetHeight,
              wasConverted:
                file.type !== 'image/webp' ||
                !file.name.toLowerCase().endsWith('.webp'),
            });
          },
          'image/webp',
          quality
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Mengonversi gambar ke `.webp` lalu mengunggahnya ke Supabase Storage (`project-images`).
 * Opsi `preserveOriginalDimensions: true` mempertahankan ukuran/dimensi asli foto 100%
 * (khususnya untuk karya Visual Design seperti poster 4:5, 1:1, 9:16, maupun banner).
 */
export async function uploadProjectImageAsWebP(file, options = {}) {
  const {
    preserveOriginalDimensions = false,
    folder = 'projects',
    exactCrop = null,
  } = options;
  const conversion = await convertImageFileToWebP(
    file,
    preserveOriginalDimensions ? 0.92 : 0.88,
    preserveOriginalDimensions ? null : 1600,
    preserveOriginalDimensions,
    exactCrop
  );
  const { webpFile, webpFileName, webpDataUrl } = conversion;

  if (isSupabaseConfigured && supabase) {
    const storagePath = `${folder}/${webpFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_PROJECT_BUCKET)
      .upload(storagePath, webpFile, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_PROJECT_BUCKET)
        .getPublicUrl(storagePath);

      if (publicUrlData?.publicUrl) {
        return {
          ...conversion,
          url: publicUrlData.publicUrl,
          storagePath,
          uploadedToSupabase: true,
        };
      }
    } else {
      return {
        ...conversion,
        url: webpDataUrl,
        uploadedToSupabase: false,
        storageWarning: uploadError.message,
      };
    }
  }

  return {
    ...conversion,
    url: webpDataUrl,
    uploadedToSupabase: false,
  };
}
