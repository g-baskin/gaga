'use strict';
// The Designer's right inspector: page settings, the selected element's settings, and the layer list.
// Part of the Designer (renderer/editor.js); loaded before it by index.html, sharing its top-level names.

// ---------- inspector ----------
function field(label, control) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control);
}
function slider(label, value, min, max, step, unit, onInput) {
  const caption = h('span', { class: 'field-label' }, `${label} · ${value}${unit}`);
  return h('label', { class: 'field' }, caption, h('input', {
    type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
    oninput: (e) => { const v = Number(e.target.value); caption.textContent = `${label} · ${v}${unit}`; onInput(v); },
  }));
}
function segmented(label, options, current, onPick) {
  return h('div', { class: 'segmented', role: 'group', 'aria-label': label, style: { gridTemplateColumns: `repeat(${options.length}, 1fr)` } },
    options.map(([value, text]) => h('button', {
      class: current === value ? 'active' : '', 'aria-pressed': String(current === value), onclick: () => onPick(value),
    }, text)));
}

function renderInspector() {
  const inspector = document.getElementById('inspector');
  if (!inspector) return;
  const el = selectedElement();
  inspector.replaceChildren(h('div', { class: 'inspector-inner' }, el ? elementInspector(el) : pageInspector(), layersPanel()));
  updateFitNote(); // the page panel was just rebuilt, so fill in its fit note
}

function pageInspector() {
  const page = currentPage();
  const change = (key, rerender = false) => (e) => {
    checkpoint(`page:${key}`);
    page[key] = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    if (rerender) renderInspector();
    refreshPage();
    scheduleSave();
  };
  const set = (key, value) => { checkpoint(); page[key] = value; refreshPage(); renderInspector(); scheduleSave(); };
  return [
    h('section', {},
      h('h3', {}, 'Page layout'),
      h('div', { class: 'layout-grid' }, LAYOUTS.map(([value, label]) =>
        h('button', {
          class: `layout-option${page.layout === value ? ' active' : ''}`, 'aria-pressed': String(page.layout === value),
          onclick: () => set('layout', value),
        }, h('span', { class: `layout-icon icon-${value}`, 'aria-hidden': 'true' }, h('i'), h('b')), label)))),
    page.layout === 'blank' ? null : h('section', {},
      h('h3', {}, 'Page words'),
      h('textarea', {
        id: 'page-text', rows: '5', value: page.text, maxlength: '20000',
        placeholder: page.layout === 'cover' ? `Leave blank to show “${state.book.title}”` : 'What happens on this page?',
        oninput: change('text'),
      }),
      field('Font', h('select', { id: 'page-font', onchange: change('font') }, fontOptions(page.font))),
      page.layout === 'cover' ? field('Title font', h('select', { id: 'page-title-font', onchange: change('titleFont') },
        h('option', { value: '', selected: !page.titleFont }, 'Same as the page font'), fontOptions(page.titleFont))) : null,
      slider('Size', page.fontSize, 10, 96, 1, ' pt', (v) => { checkpoint('page:fontSize'); page.fontSize = v; refreshPage(); scheduleSave(); }),
      h('p', { class: 'page-fit-note', id: 'page-fit-note', role: 'status' }),
      segmented('Text alignment', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], page.align, (v) => set('align', v)),
      field('Text color', h('input', { type: 'color', value: page.color, oninput: change('color') }))),
    h('section', {},
      h('h3', {}, 'Background'),
      field('Page color', h('input', { type: 'color', value: page.background, oninput: change('background') })),
      page.layout === 'text-only' || page.layout === 'blank' ? null : h('div', { class: 'tool-row' },
        h('button', { class: 'btn secondary', onclick: () => run(choosePagePicture) }, page.image ? 'Replace layout picture' : 'Choose layout picture'),
        page.image ? cropButton({ image: page.image, crop: page.crop }, (crop) => { checkpoint(); page.crop = crop; refreshPage(); renderInspector(); scheduleSave(); }) : null,
        ...pagePictureButtons(page),
        page.image ? h('button', { class: 'btn ghost danger', onclick: () => { page.imagePrompt = ''; set('image', null); } }, 'Remove') : null)),
  ];
}

// Other screens add page-picture buttons here (window.pagePictureExtras), e.g. "Redraw this picture".
window.pagePictureExtras = window.pagePictureExtras || [];
function pagePictureButtons(page) {
  const out = [];
  for (const make of window.pagePictureExtras) {
    try {
      const node = make(state.book, page);
      if (node instanceof Node) out.push(node);
    } catch (error) { console.error(error); }
  }
  return out;
}

// The crop dialog itself lives in screens/crop.js (window.openCropDialog).
// target: { image, crop }. onApply(crop) receives { x, y, w, h } as fractions, or null to remove the crop.
function cropButton(target, onApply) {
  return h('button', {
    class: 'btn ghost', id: 'crop-picture',
    onclick: () => {
      if (typeof window.openCropDialog !== 'function') { notBuilt(); return; }
      window.openCropDialog({ bookId: state.book.id, image: target.image, crop: target.crop || null }, onApply);
    },
  }, target.crop ? 'Crop… (cropped)' : 'Crop…');
}

const TYPE_LABEL = { text: 'Text', image: 'Picture', shape: 'Shape', sticker: 'Sticker', sound: 'Sound button' };
function elementInspector(el) {
  const apply = (key, value, merge = true) => {
    checkpoint(merge ? `${el.id}:${key}` : null);
    el[key] = value;
    updateElementNode(el, true);
    if (el.type === 'text') fitText(el);
    drawSelection();
    refreshThumb();
    updateHistoryButtons();
    scheduleSave();
  };
  const toggle = (key) => { apply(key, !el[key], false); renderInspector(); };
  const numberField = (label, key, min, max) => field(label, h('input', {
    type: 'number', step: '1', value: String(Math.round(el[key])), min: String(min), max: String(max),
    onchange: (e) => {
      const v = Number(e.target.value);
      if (Number.isFinite(v)) apply(key, round2(Math.min(max, Math.max(min, v))), false);
      e.target.value = String(Math.round(el[key]));
    },
  }));

  const common = h('section', {},
    h('div', { class: 'inspector-head' },
      h('h3', {}, TYPE_LABEL[el.type]),
      h('div', { class: 'tool-row' },
        h('button', { class: 'btn ghost small', onclick: () => duplicateElement(el), title: 'Duplicate (⌘D)' }, 'Duplicate'),
        h('button', { class: 'btn ghost small danger', id: 'delete-element', onclick: () => deleteElement(el), title: 'Delete (⌫)' }, 'Delete'))),
    h('div', { class: 'tool-row arrange' },
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'front'), title: 'Bring to front' }, 'Front'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'forward'), title: 'Bring forward (])' }, 'Forward'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'backward'), title: 'Send backward ([)' }, 'Backward'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'back'), title: 'Send to back' }, 'Back'),
      h('button', { class: `btn small ${el.locked ? 'secondary' : 'ghost'}`, onclick: () => toggleLock(el), 'aria-pressed': String(el.locked) }, el.locked ? 'Locked' : 'Lock')),
    h('div', { class: 'pos-grid' },
      numberField('X', 'x', -2000, 4000), numberField('Y', 'y', -2000, 4000),
      numberField('Width', 'w', MIN_SIZE, 4000), numberField('Height', 'h', MIN_SIZE, 4000),
      numberField('Rotate°', 'rotation', -180, 180)),
    slider('Opacity', Math.round(el.opacity * 100), 0, 100, 1, '%', (v) => apply('opacity', v / 100)));

  let specific = null;
  if (el.type === 'text') {
    specific = h('section', {},
      h('h3', {}, 'Words'),
      h('textarea', {
        rows: '3', value: el.text, maxlength: '5000', id: 'element-text',
        oninput: (e) => { apply('text', e.target.value); },
        onblur: () => { if (!el.text.trim()) deleteElement(el); },
      }),
      field('Font', h('select', { id: 'element-font', onchange: (e) => apply('font', e.target.value, false) }, fontOptions(el.font))),
      slider('Size', el.fontSize, 6, 200, 1, ' pt', (v) => apply('fontSize', v)),
      h('div', { class: 'tool-row' },
        h('button', { class: `btn small ${el.bold ? 'secondary' : 'ghost'}`, 'aria-pressed': String(el.bold), onclick: () => toggle('bold') }, h('b', {}, 'B')),
        h('button', { class: `btn small ${el.italic ? 'secondary' : 'ghost'}`, 'aria-pressed': String(el.italic), onclick: () => toggle('italic') }, h('i', {}, 'I'))),
      segmented('Text alignment', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], el.align, (v) => { apply('align', v, false); renderInspector(); }),
      field('Color', h('input', { type: 'color', value: el.color, oninput: (e) => apply('color', e.target.value) })),
      slider('Line spacing', el.lineHeight, 0.8, 3, 0.05, '×', (v) => apply('lineHeight', v)),
      slider('Letter spacing', el.letterSpacing, -5, 40, 0.5, ' pt', (v) => apply('letterSpacing', v)),
      h('h3', {}, 'Effects'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: el.shadow, onchange: () => toggle('shadow') }), 'Shadow'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: el.outline, onchange: () => toggle('outline') }), 'Outline'),
      el.outline ? field('Outline color', h('input', { type: 'color', value: el.outlineColor, oninput: (e) => apply('outlineColor', e.target.value) })) : null,
      h('label', { class: 'check' }, h('input', {
        type: 'checkbox', checked: !!el.highlight,
        onchange: (e) => { apply('highlight', e.target.checked ? '#ffd96a' : null, false); renderInspector(); },
      }), 'Highlight'),
      el.highlight ? field('Highlight color', h('input', { type: 'color', value: el.highlight, oninput: (e) => apply('highlight', e.target.value) })) : null);
  } else if (el.type === 'shape') {
    specific = h('section', {},
      h('h3', {}, 'Shape'),
      field('Shape', h('select', { onchange: (e) => apply('shape', e.target.value, false) },
        Object.entries(SHAPES).map(([key, shape]) => h('option', { value: key, selected: el.shape === key }, shape.label)))),
      h('label', { class: 'check' }, h('input', {
        type: 'checkbox', checked: el.fill === null,
        onchange: (e) => { apply('fill', e.target.checked ? null : SHAPE_DEFAULTS[el.shape], false); renderInspector(); },
      }), 'No fill'),
      el.fill === null ? null : field('Fill', h('input', { type: 'color', value: el.fill, oninput: (e) => apply('fill', e.target.value) })),
      slider('Outline width', el.strokeWidth, 0, 30, 0.5, ' pt', (v) => apply('strokeWidth', v)),
      field('Outline color', h('input', { type: 'color', value: el.stroke, oninput: (e) => apply('stroke', e.target.value) })));
  } else if (el.type === 'image') {
    specific = h('section', {},
      h('h3', {}, 'Picture'),
      segmented('Picture fit', [['cover', 'Fill box'], ['contain', 'Show all']], el.fit, (v) => { apply('fit', v, false); renderInspector(); }),
      slider('Corner rounding', el.radius, 0, 200, 1, ' pt', (v) => apply('radius', v)),
      slider('Border', el.borderWidth, 0, 30, 0.5, ' pt', (v) => apply('borderWidth', v)),
      field('Border color', h('input', { type: 'color', value: el.borderColor, oninput: (e) => apply('borderColor', e.target.value) })),
      h('div', { class: 'tool-row' },
        h('button', {
          class: 'btn secondary',
          onclick: () => run(async () => { const name = await api.importImage(state.book.id); if (name) apply('image', name, false); }),
        }, 'Replace picture'),
        cropButton(el, (crop) => { apply('crop', crop, false); renderInspector(); })));
  } else if (el.type === 'sticker') {
    specific = h('section', {}, h('p', { class: 'muted small-print' }, 'Drag the corners to resize. Stickers keep their shape.'));
  } else if (el.type === 'sound') {
    specific = h('section', {},
      h('h3', {}, 'Sound button'),
      field('Label', h('input', { type: 'text', value: el.label, maxlength: '80', oninput: (e) => apply('label', e.target.value) })),
      h('p', { class: 'muted small-print' }, el.sound ? 'Plays its sound when tapped in the read-along player.' : 'Choose a sound for it in the Studio.'));
  }
  return [common, specific];
}

function layerLabel(el) {
  if (el.type === 'text') return el.text.split('\n')[0].slice(0, 28) || 'Text';
  if (el.type === 'shape') return SHAPES[el.shape].label;
  if (el.type === 'sticker') return `Sticker ${el.char}`;
  if (el.type === 'sound') return `Sound ${el.label || el.char}`;
  return 'Picture';
}
function layersPanel() {
  const elements = currentPage().elements;
  return h('section', { class: 'layers' },
    h('h3', {}, 'Layers'),
    elements.length === 0
      ? h('p', { class: 'muted small-print' }, 'Add text, shapes, stickers, or pictures from the left. They stack here, front to back.')
      : h('ol', { class: 'layer-list', id: 'layer-list' }, [...elements].reverse().map((el) =>
        h('li', { class: `layer${el.id === editor.selected ? ' active' : ''}`, 'data-id': el.id },
          h('button', { class: 'layer-name', onclick: () => select(el.id) },
            h('span', { class: 'layer-type' }, icon({ text: 'text', image: 'picture', shape: 'shapes', sticker: 'sticker', sound: 'sound' }[el.type] || 'shapes', { size: 16 })),
            layerLabel(el)),
          h('button', {
            class: 'icon-btn small', title: el.locked ? 'Unlock' : 'Lock', 'aria-label': `${el.locked ? 'Unlock' : 'Lock'} ${layerLabel(el)}`,
            onclick: () => toggleLock(el),
          }, icon(el.locked ? 'lock' : 'unlock', { size: 16 }))))));
}
function markLayers() {
  document.querySelectorAll('#layer-list .layer').forEach((row) => row.classList.toggle('active', row.dataset.id === editor.selected));
}
