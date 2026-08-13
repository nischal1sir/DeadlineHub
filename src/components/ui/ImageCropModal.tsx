import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Modal } from './Modal';
import { Button } from './Button';
import { ZoomIn, ZoomOut, Upload, X } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  isUploading?: boolean;
}

// Helper: create a cropped image from canvas
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Output square 400x400
  const size = 400;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, size, size
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen, imageSrc, onClose, onCropComplete, isUploading
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUpload = async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(croppedBlob);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Your Photo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isUploading}>
            <X size={14} /> Cancel
          </Button>
          <Button onClick={handleUpload} isLoading={isUploading}>
            <Upload size={14} /> Save Photo
          </Button>
        </>
      }
    >
      <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-3 mt-4 px-2">
        <ZoomOut size={16} className="text-slate-400" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-brand"
        />
        <ZoomIn size={16} className="text-slate-400" />
      </div>

      <p className="text-xs text-slate-500 text-center mt-2">
        Drag to reposition • Scroll or use slider to zoom
      </p>
    </Modal>
  );
};
