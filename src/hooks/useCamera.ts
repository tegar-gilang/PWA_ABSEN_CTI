import { useState, useCallback } from 'react';

interface UseCameraOptions {
  maxWidth?: number;
  quality?: number;
}

export function useCamera({ maxWidth = 800, quality = 0.6 }: UseCameraOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureImage = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsCapturing(true);
      setError(null);

      // Create file input dynamically to trigger native camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user'; // Prefer front camera

      // Listen for when a file is selected
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) {
          setIsCapturing(false);
          reject(new Error('No image selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Compress by resizing dimensions
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Convert to performant JPEG
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              setIsCapturing(false);
              resolve(dataUrl);
            } else {
              setIsCapturing(false);
              setError('Failed to compress image');
              reject(new Error('Canvas context is null'));
            }
          };
          
          img.onerror = () => {
            setIsCapturing(false);
            setError('Failed to read image');
            reject(new Error('Image load error'));
          };
          
          if (readerEvent.target?.result) {
            img.src = readerEvent.target.result as string;
          }
        };
        
        reader.onerror = () => {
          setIsCapturing(false);
          setError('Failed to read file');
          reject(new Error('File read error'));
        };

        reader.readAsDataURL(file);
      };

      // Native camera overlay can't reliably detect cancel via JS event, 
      // but in some browsers input value change empty works.
      input.click();
      
      // Fallback timeout to reset capturing state if user just closes camera without selecting
      // Since window focus happens when camera closes
      const handleFocus = () => {
        setTimeout(() => {
          if (document.activeElement !== input) {
            setIsCapturing(false);
            window.removeEventListener('focus', handleFocus);
          }
        }, 1000);
      };
      window.addEventListener('focus', handleFocus);
    });
  }, [maxWidth, quality]);

  return { captureImage, isCapturing, error };
}
