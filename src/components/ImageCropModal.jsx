import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Crop, ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

/**
 * Creates an HTML Image element from a source URL
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Crops and outputs a clean File object with exact dimensions (1200 x 630).
 */
async function getCroppedImageBlob(imageSrc, pixelCrop, rotation = 0, targetWidth = 1200, targetHeight = 630) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If rotation exists
  if (rotation !== 0) {
    const rotRad = (rotation * Math.PI) / 180;
    // For simple 90deg steps or complex rotation, render to intermediate canvas
    const rotCanvas = document.createElement('canvas');
    const rotCtx = rotCanvas.getContext('2d');
    rotCanvas.width = image.naturalWidth;
    rotCanvas.height = image.naturalHeight;
    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate(rotRad);
    rotCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    ctx.drawImage(
      rotCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal memotong gambar (canvas to blob error)'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      0.92
    );
  });
}

/**
 * ImageCropModal
 * Allows user to visually pan, zoom, and rotate any image with a locked 1.9047 (1200:630) aspect ratio.
 * When confirmed, generates a 1200x630 .webp File and passes it to onConfirm(file, previewUrl).
 */
export default function ImageCropModal({
  isOpen,
  imageSrc,
  fileName = 'og-image.webp',
  aspectRatio = 1200 / 630, // ~1.9047
  targetWidth = 1200,
  targetHeight = 630,
  onClose,
  onConfirm,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        rotation,
        targetWidth,
        targetHeight
      );

      const cleanBaseName = (fileName || 'image')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      const outputFileName = `${cleanBaseName}-cropped-1200x630.webp`;

      const croppedFile = new File([blob], outputFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      const previewUrl = URL.createObjectURL(blob);
      onConfirm(croppedFile, previewUrl);
    } catch (err) {
      console.error('Failed to crop image:', err);
      alert('Gagal memproses crop gambar: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="w-full max-w-3xl bg-[#1c1c1c] border border-[#8c7355] text-[#fcfbf9] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-[#333333] bg-[#171717]">
            <div className="flex items-center gap-2.5">
              <Crop className="w-4 h-4 text-[#8c7355]" />
              <div>
                <span className="font-mono font-bold text-[10px] text-[#8c7355] uppercase tracking-wider block">
                  CROP &amp; POSITION TOOL // OPENGRAPH
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#fcfbf9]">
                  Crop Gambar OpenGraph ({targetWidth} × {targetHeight} px)
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 border border-[#3a3835] hover:border-[#8c7355] text-[#d8d2c7] hover:text-[#fcfbf9] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cropper Workspace */}
          <div className="relative w-full h-[320px] sm:h-[420px] bg-[#0c0c0c] select-none">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              classes={{
                containerClassName: 'w-full h-full',
                cropAreaClassName: '!border-2 !border-[#8c7355] !shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]',
              }}
            />
            {/* Guide badge */}
            <div className="absolute top-3 left-3 pointer-events-none z-10 px-2.5 py-1 bg-black/75 border border-[#8c7355]/60 text-[10px] font-mono font-bold text-[#8c7355] uppercase">
              Rasio Terkunci: 1.91:1 ({targetWidth}×{targetHeight})
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 sm:px-6 bg-[#171717] border-t border-[#333333] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Zoom Slider */}
              <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                <ZoomOut className="w-3.5 h-3.5 text-[#8c857b]" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#8c7355] cursor-pointer bg-[#262626] h-1.5 rounded-none"
                />
                <ZoomIn className="w-3.5 h-3.5 text-[#8c857b]" />
                <span className="font-mono text-[11px] text-[#8c7355] w-12 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Rotate Button & Hint */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f1f] border border-[#3a3835] hover:border-[#8c7355] font-mono text-[11px] text-[#d8d2c7] hover:text-[#fcfbf9] cursor-pointer uppercase"
                >
                  <RotateCw className="w-3 h-3 text-[#8c7355]" />
                  <span>Putar +90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setCrop({ x: 0, y: 0 });
                  }}
                  className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#3a3835] hover:border-[#8c7355] font-mono text-[11px] text-[#8c857b] hover:text-[#fcfbf9] cursor-pointer uppercase"
                >
                  Reset
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#8c857b] font-sans leading-relaxed">
              💡 Geser gambar untuk menentukan posisi terbaik. Hasil akhir akan dipotong presisi berdimensi <strong>{targetWidth} × {targetHeight} px</strong> berformat <strong>.webp</strong> kualitas tinggi.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 bg-[#141414] border-t border-[#292929] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 bg-[#1c1c1c] border border-[#3a3835] hover:border-[#fcfbf9] font-mono font-bold text-xs uppercase text-[#d8d2c7] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyCrop}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#fcfbf9] text-[#181818] hover:bg-[#8c7355] hover:text-[#fcfbf9] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4 text-[#16a34a]" />
              <span>{isProcessing ? 'Memproses 1200×630...' : 'Simpan & Terapkan Crop'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
