// src/utils/cropHelper.js
// React-Image-Crop helper (expects pixel crop {x,y,width,height})
export async function getCroppedImgFromImageCrop(imageSrc, cropPx) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const x = Math.round(cropPx.x || 0);
  const y = Math.round(cropPx.y || 0);
  const width = Math.round(cropPx.width || image.naturalWidth);
  const height = Math.round(cropPx.height || image.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
  });
}

// default export for older imports
export default getCroppedImgFromImageCrop;
