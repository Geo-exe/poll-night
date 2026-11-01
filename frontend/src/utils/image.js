export function resizeImageFile(file, { size = 1200, quality = 0.78, square = false } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load the image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (square) {
          canvas.width = size;
          canvas.height = size;
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size / scale - img.width) / 2;
          const y = (size / scale - img.height) / 2;
          ctx.drawImage(img, x, y, img.width, img.height, 0, 0, size, size);
        } else {
          const scale = Math.min(1, size / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
