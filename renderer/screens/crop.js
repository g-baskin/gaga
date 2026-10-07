// Picture crop dialog (window.openCropDialog) and the "Generate a picture" Pictures-drawer extra.
(() => {
  'use strict';

  const ASPECTS = [['free', 'Free', null], ['square', 'Square', 1], ['4-3', '4:3', 4 / 3], ['3-4', '3:4', 3 / 4], ['16-9', '16:9', 16 / 9]];
  const HANDLES = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const MIN = 16; // smallest crop side in screen pixels
  const STAGE_W = 520;
  const STAGE_H = 380;

  // crop: { x, y, w, h } fractions of the source picture, or null for the whole picture.
  function openCropDialog({ bookId, image, crop }, onApply) {
    const img = h('img', { class: 'crop-image', alt: '', draggable: 'false' });
    const box = h('div', {
      class: 'crop-box', tabindex: '0', role: 'group', 'data-crop-box': '',
      'aria-label': 'Crop area. Arrow keys move it; Shift moves further; Alt with arrows changes its size.',
    }, HANDLES.map(([dx, dy]) => h('span', { class: 'crop-handle', 'data-dir': `${dx},${dy}`, style: { left: `${(dx + 1) * 50}%`, top: `${(dy + 1) * 50}%` } })));
    const stage = h('div', { class: 'crop-stage' }, img, box);
    const wrap = h('div', { class: 'crop-wrap' }, stage);
    const readout = h('span', { class: 'muted small-print crop-readout', 'aria-live': 'polite' });
    let W = 0; let H = 0; // displayed picture size (px)
    let natural = [1, 1];
    let r = { x: 0, y: 0, w: 0, h: 0 }; // crop rectangle in displayed px
    let aspect = null;
    const aspectButtons = ASPECTS.map(([id, label, value]) => h('button', {
      type: 'button', class: 'crop-aspect', 'data-aspect': id, 'aria-pressed': String(id === 'free'),
      onclick: () => setAspect(value, id),
    }, label));

    const draw = () => {
      Object.assign(box.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
      const pw = Math.round((r.w / W) * natural[0]);
      const ph = Math.round((r.h / H) * natural[1]);
      readout.textContent = W ? `${pw} × ${ph} pixels` : '';
    };
    const clampMove = (x, y) => ({ x: Math.min(Math.max(0, x), W - r.w), y: Math.min(Math.max(0, y), H - r.h) });

    // Largest rectangle of the given aspect (in picture pixels) centred on (cx, cy) that fits.
    function fitAspect(value, cx = W / 2, cy = H / 2) {
      let w = W; let hh = w / value;
      if (hh > H) { hh = H; w = hh * value; }
      const p = { w, h: hh };
      const pos = { x: Math.min(Math.max(0, cx - w / 2), W - w), y: Math.min(Math.max(0, cy - hh / 2), H - hh) };
      return { ...pos, ...p };
    }
    function setAspect(value, id) {
      aspect = value;
      for (const b of aspectButtons) b.setAttribute('aria-pressed', String(b.dataset.aspect === id));
      if (value) r = fitAspect(value, r.x + r.w / 2, r.y + r.h / 2);
      draw();
    }

    function resize(start, dx, dy, mx, my) {
      let left = start.x; let right = start.x + start.w; let top = start.y; let bottom = start.y + start.h;
      if (dx < 0) left = Math.min(Math.max(0, left + mx), right - MIN);
      if (dx > 0) right = Math.max(Math.min(W, right + mx), left + MIN);
      if (dy < 0) top = Math.min(Math.max(0, top + my), bottom - MIN);
      if (dy > 0) bottom = Math.max(Math.min(H, bottom + my), top + MIN);
      let w = right - left; let hh = bottom - top;
      if (aspect) {
        if (dy === 0) hh = w / aspect;
        else if (dx === 0) w = hh * aspect;
        else if (Math.abs(mx) >= Math.abs(my) * aspect) hh = w / aspect; else w = hh * aspect; // Follow the axis dragged most.
        // Anchor the opposite side (or the centre for edge handles), then shrink to stay inside the picture.
        const ax = dx < 0 ? right : dx > 0 ? left : start.x + start.w / 2;
        const ay = dy < 0 ? bottom : dy > 0 ? top : start.y + start.h / 2;
        const roomW = dx < 0 ? ax : dx > 0 ? W - ax : 2 * Math.min(ax, W - ax);
        const roomH = dy < 0 ? ay : dy > 0 ? H - ay : 2 * Math.min(ay, H - ay);
        const k = Math.min(1, roomW / w, roomH / hh);
        w *= k; hh *= k;
        left = dx < 0 ? ax - w : dx > 0 ? ax : ax - w / 2;
        top = dy < 0 ? ay - hh : dy > 0 ? ay : ay - hh / 2;
      }
      r = { x: left, y: top, w, h: hh };
      draw();
    }

    function track(e, onMove) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;
      target.setPointerCapture?.(e.pointerId);
      const sx = e.clientX; const sy = e.clientY; const start = { ...r };
      const move = (ev) => onMove(start, ev.clientX - sx, ev.clientY - sy);
      const end = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', end); target.removeEventListener('pointercancel', end); };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', end);
      target.addEventListener('pointercancel', end);
    }
    for (const handle of box.querySelectorAll('.crop-handle')) {
      const [dx, dy] = handle.dataset.dir.split(',').map(Number);
      handle.addEventListener('pointerdown', (e) => track(e, (start, mx, my) => resize(start, dx, dy, mx, my)));
    }
    box.addEventListener('pointerdown', (e) => {
      if (e.target !== box) return;
      box.focus();
      track(e, (start, mx, my) => { r = { ...start, ...clampMove(start.x + mx, start.y + my) }; draw(); });
    });
    box.addEventListener('keydown', (e) => {
      const keys = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 2;
      if (e.altKey) resize({ ...r }, d[0] ? 1 : 0, d[1] ? 1 : 0, d[0] * step, d[1] * step);
      else { Object.assign(r, clampMove(r.x + d[0] * step, r.y + d[1] * step)); draw(); }
    });

    const reset = () => {
      for (const b of aspectButtons) b.setAttribute('aria-pressed', String(b.dataset.aspect === 'free'));
      aspect = null;
      r = { x: 0, y: 0, w: W, h: H };
      draw();
    };

    const dialog = modal('Crop picture', (close) => h('div', { class: 'form crop-body' },
      wrap,
      h('div', { class: 'crop-toolbar' },
        h('div', { class: 'crop-aspects', role: 'group', 'aria-label': 'Shape' }, aspectButtons),
        readout),
      h('div', { class: 'form-actions crop-actions' },
        h('button', { type: 'button', class: 'btn ghost crop-reset', 'data-crop': 'reset', onclick: reset }, 'Reset'),
        h('span', { class: 'crop-spacer' }),
        h('button', { type: 'button', class: 'btn ghost', 'data-crop': 'cancel', onclick: close }, 'Cancel'),
        h('button', {
          type: 'button', class: 'btn primary', 'data-crop': 'apply',
          onclick: () => {
            if (!W) { close(); return; }
            const f = { x: r.x / W, y: r.y / H, w: r.w / W, h: r.h / H };
            const whole = f.x < 0.002 && f.y < 0.002 && f.w > 0.996 && f.h > 0.996;
            const rnd = (v) => Math.round(v * 10000) / 10000;
            close();
            onApply?.(whole ? null : { x: rnd(f.x), y: rnd(f.y), w: rnd(Math.min(f.w, 1 - f.x)), h: rnd(Math.min(f.h, 1 - f.y)) });
          },
        }, 'Apply'))));
    dialog.classList.add('crop-dialog');

    img.addEventListener('load', () => {
      natural = [img.naturalWidth || 1, img.naturalHeight || 1];
      const scale = Math.min(STAGE_W / natural[0], STAGE_H / natural[1]);
      W = Math.round(natural[0] * scale);
      H = Math.round(natural[1] * scale);
      Object.assign(stage.style, { width: `${W}px`, height: `${H}px` });
      r = crop ? { x: crop.x * W, y: crop.y * H, w: crop.w * W, h: crop.h * H } : { x: 0, y: 0, w: W, h: H };
      draw();
      box.focus();
    }, { once: true });
    img.addEventListener('error', () => { toast('This picture could not be opened for cropping'); }, { once: true });
    img.src = mediaUrl(bookId, image);
    return dialog;
  }
  window.openCropDialog = openCropDialog;

  // ---------- "Generate a picture" (OpenRouter, fal.ai, or the author's own AI service) ----------
  const STYLES = ['Soft watercolour', 'Crayon drawing', 'Paper cut-out', 'Pencil sketch', 'Bright flat colours'];

  function openGenerateDialog(book) {
    modal('Generate a picture', (close) => {
      const submit = h('button', { class: 'btn primary', 'data-generate': 'submit' }, 'Generate');
      const form = h('form', {
        class: 'form crop-generate-form',
        onsubmit: async (e) => {
          e.preventDefault();
          const data = new FormData(form);
          submit.disabled = true;
          submit.textContent = 'Painting…';
          try {
            const name = await api.generateImage({ bookId: book.id, prompt: String(data.get('prompt') || ''), style: String(data.get('style') || '') });
            close();
            await addImageToPage(name);
          } catch (error) {
            submit.disabled = false; // only reachable when pictures were set up
            submit.textContent = 'Generate';
            toast(cleanError(error), { label: 'Open settings', run: openAiSettings });
          }
        },
      },
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Describe the picture'),
        h('textarea', { name: 'prompt', rows: '3', required: true, maxlength: '1000', placeholder: 'A hedgehog in a straw hat waving from a garden gate' })),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Style'),
        h('select', { name: 'style' }, STYLES.map((s) => h('option', { value: s }, s)))),
      aiPictureNote({ onReady: (ready) => { submit.disabled = !ready; } }),
      h('p', { class: 'muted small-print' }, 'Your description is sent to that service.'),
      h('div', { class: 'form-actions' }, h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Cancel'), submit));
      return form;
    });
    setTimeout(() => document.querySelector('dialog[open] textarea[name="prompt"]')?.focus(), 0);
  }

  window.picturesDrawerExtras = window.picturesDrawerExtras || [];
  window.picturesDrawerExtras.push((book) => h('div', { class: 'crop-extras' },
    h('button', { class: 'btn ghost block', 'data-action': 'generate-picture', onclick: () => openGenerateDialog(book) }, 'Generate a picture'),
    h('div', { class: 'crop-unavailable', 'data-unavailable': 'image-upscale' },
      h('strong', {}, 'Upscale isn’t available'),
      h('span', {}, ' Making pictures sharper needs an online service Storyloom doesn’t run. Generate at full size, or add a larger picture from your Mac.'))));
})();
