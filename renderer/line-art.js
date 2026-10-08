(() => {
  'use strict';
  // Line art for coloring books. Loaded twice: as a page script (window.storyloomLineArt, used as a fallback
  // and by the self-test) and as a Web Worker, so converting a book never freezes the window.

  // Grayscale → 3×3 blur → Sobel edge magnitude → threshold. Lines come out dark on white.
  function lineArt(imageData, threshold = 48) {
    const { width: w, height: hgt, data } = imageData;
    const gray = new Float32Array(w * hgt);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      const a = data[p + 3] / 255; // Transparent counts as white.
      gray[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) * a + 255 * (1 - a);
    }
    const at = (arr, x, y) => arr[Math.min(hgt - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    const blur = new Float32Array(w * hgt);
    for (let y = 0; y < hgt; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += at(gray, x + dx, y + dy);
        blur[y * w + x] = s / 9;
      }
    }
    const out = new ImageData(w, hgt);
    const o = out.data;
    for (let y = 0; y < hgt; y++) {
      for (let x = 0; x < w; x++) {
        const tl = at(blur, x - 1, y - 1), t = at(blur, x, y - 1), tr = at(blur, x + 1, y - 1);
        const l = at(blur, x - 1, y), r = at(blur, x + 1, y);
        const bl = at(blur, x - 1, y + 1), b = at(blur, x, y + 1), br = at(blur, x + 1, y + 1);
        const gx = tr + 2 * r + br - tl - 2 * l - bl;
        const gy = bl + 2 * b + br - tl - 2 * t - tr;
        const v = Math.hypot(gx, gy) > threshold ? 0 : 255;
        const p = (y * w + x) * 4;
        o[p] = o[p + 1] = o[p + 2] = v;
        o[p + 3] = 255;
      }
    }
    return out;
  }

  self.storyloomLineArt = lineArt;
  if (typeof window === 'undefined') {
    // Worker: { id, image } in, { id, image } out; the pixel buffers are moved, not copied.
    self.onmessage = (event) => {
      const { id, image } = event.data;
      try {
        const out = lineArt(image);
        self.postMessage({ id, image: out }, [out.data.buffer]);
      } catch (error) {
        self.postMessage({ id, error: String(error?.message || error) });
      }
    };
  }
})();
