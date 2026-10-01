'use strict';

// Pure pixel transform. The low-resolution derivative is decorative, not anonymized.
function tintFingerprint(pixels, color) {
  const result = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722;
    const ink = Math.max(0, Math.min(1, (210 - gray) / 155));
    result[i] = color[0];
    result[i + 1] = color[1];
    result[i + 2] = color[2];
    result[i + 3] = Math.round(ink * .84 * pixels[i + 3]);
  }
  return result;
}

// A faint one-pixel ink spread softens scan pinholes without painting new ridges.
function softenInkGaps(pixels, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0 || pixels.length !== width * height * 4) {
    throw new RangeError('Pixel dimensions must match the image.');
  }
  const result = new Uint8ClampedArray(pixels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alphaIndex = (y * width + x) * 4 + 3;
      let neighboringInk = 0;
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
          neighboringInk = Math.max(neighboringInk, pixels[(ny * width + nx) * 4 + 3]);
        }
      }
      result[alphaIndex] = Math.max(pixels[alphaIndex], Math.round(neighboringInk * .48));
    }
  }
  return result;
}

module.exports = { tintFingerprint, softenInkGaps };