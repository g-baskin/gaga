// Storyloom templates: original page themes and starter books.
// Exposes window.STORYLOOM_TEMPLATES = { themes, starters, categories, applyTheme, bookFromTemplate }.
// Decoration positions are in points for a square 612 × 612 page and are scaled to the book's size when applied.
(() => {
  'use strict';

  const DECOR_PREFIX = 'tpl-';
  const BASE = 612;

  // ---------- decoration builders (square-page points) ----------
  const common = { rotation: 0, opacity: 1, locked: false };
  const sticker = (char, x, y, s, extra = {}) => ({ ...common, type: 'sticker', char, x, y, w: s, h: s, ...extra });
  const shape = (kind, x, y, w, h, fill, extra = {}) => ({
    ...common, type: 'shape', shape: kind, x, y, w, h, fill, stroke: '#2a2433', strokeWidth: 0, ...extra,
  });
  const words = (text, x, y, w, h, extra = {}) => ({
    ...common, type: 'text', text, x, y, w, h, font: 'serif', fontSize: 24, color: '#2a2433', align: 'center',
    bold: false, italic: false, lineHeight: 1.2, letterSpacing: 0, shadow: false, outline: false, outlineColor: '#ffffff', highlight: null, ...extra,
  });

  // ---------- themes ----------
  // decor.cover sits in the lower part of a cover (the title is at the top);
  // decor.page stays in the corners so it never covers the picture or the words.
  const THEMES = [
    {
      id: 'moonlit-quilt', name: 'Moonlit Quilt', category: 'Bedtime',
      description: 'Deep night blue with a golden moon and sleepy stars.',
      palette: { background: '#1f2a4a', ink: '#f4ecd8', accent: '#f2c94c', soft: '#3a4a74' },
      font: 'serif', frame: 'double', frameColor: '#f2c94c',
      decor: {
        cover: [
          shape('ellipse', 396, 330, 170, 170, '#f2c94c', { opacity: 0.95 }),
          shape('ellipse', 440, 318, 150, 150, '#1f2a4a'),
          shape('star', 120, 380, 46, 46, '#f2c94c'),
          shape('star', 220, 470, 30, 30, '#f4ecd8'),
          shape('star', 70, 500, 24, 24, '#f4ecd8', { opacity: 0.8 }),
          shape('cloud', 150, 500, 190, 80, '#3a4a74'),
        ],
        page: [
          shape('star', 36, 36, 28, 28, '#f2c94c'),
          shape('star', 548, 36, 28, 28, '#f2c94c'),
          shape('star', 552, 552, 22, 22, '#f4ecd8', { opacity: 0.8 }),
        ],
      },
    },
    {
      id: 'feather-pillow', name: 'Feather Pillow', category: 'Bedtime',
      description: 'Pale sky, soft clouds, and a gentle rounded hand.',
      palette: { background: '#eef1f8', ink: '#34405e', accent: '#8fa6d6', soft: '#ffffff' },
      font: 'rounded', frame: 'rounded', frameColor: '#8fa6d6',
      decor: {
        cover: [
          shape('cloud', 60, 380, 220, 110, '#ffffff', { stroke: '#8fa6d6', strokeWidth: 2 }),
          shape('cloud', 330, 440, 230, 115, '#ffffff', { stroke: '#8fa6d6', strokeWidth: 2 }),
          sticker('💤', 470, 320, 70),
          sticker('🧸', 250, 300, 110),
        ],
        page: [
          shape('cloud', 34, 540, 90, 44, '#ffffff', { stroke: '#8fa6d6', strokeWidth: 1.5 }),
          sticker('💤', 532, 532, 46),
        ],
      },
    },
    {
      id: 'compass-rose', name: 'Compass Rose', category: 'Adventure',
      description: 'Old-map parchment, rust ink, and a sail on the horizon.',
      palette: { background: '#f4e6c8', ink: '#4a3220', accent: '#c0582f', soft: '#e6d2a8' },
      font: 'serif', frame: 'thick', frameColor: '#7a4a2a',
      decor: {
        cover: [
          shape('triangle', 60, 400, 200, 150, '#c9b184'),
          shape('triangle', 180, 430, 160, 120, '#b49866'),
          sticker('⛵', 400, 400, 120),
          shape('arrow', 360, 330, 130, 60, '#c0582f', { rotation: -12 }),
          shape('burst', 480, 520, 56, 56, '#c0582f', { opacity: 0.85 }),
        ],
        page: [
          shape('burst', 34, 34, 40, 40, '#c0582f', { opacity: 0.8 }),
          sticker('🧭', 536, 536, 44),
        ],
      },
    },
    {
      id: 'rocket-ride', name: 'Rocket Ride', category: 'Adventure',
      description: 'Midnight ocean blue, a ringed planet, and a rocket on its way.',
      palette: { background: '#0f3a5c', ink: '#ffffff', accent: '#f28e5c', soft: '#1d5a85' },
      font: 'sans', frame: 'none', frameColor: '#f28e5c',
      decor: {
        cover: [
          shape('ellipse', 60, 380, 180, 180, '#f28e5c'),
          shape('ellipse', 30, 455, 240, 30, null, { stroke: '#ffd9a8', strokeWidth: 4 }),
          sticker('🚀', 390, 330, 150, { rotation: -20 }),
          shape('star', 300, 520, 28, 28, '#ffffff'),
          shape('star', 520, 520, 22, 22, '#ffd9a8'),
          shape('star', 280, 360, 18, 18, '#ffffff'),
        ],
        page: [
          shape('star', 30, 30, 22, 22, '#ffffff'),
          shape('star', 560, 40, 18, 18, '#ffd9a8'),
          shape('ellipse', 540, 540, 46, 46, '#f28e5c'),
        ],
      },
    },
    {
      id: 'meadow-walk', name: 'Meadow Walk', category: 'Nature',
      description: 'Fresh green, tulips, and a busy bee in hand-drawn letters.',
      palette: { background: '#eef6e4', ink: '#2f4a2a', accent: '#6fa65a', soft: '#d6eac4' },
      font: 'hand', frame: 'dashed', frameColor: '#6fa65a',
      decor: {
        cover: [
          shape('rounded', 0, 500, 612, 140, '#cfe5b8'),
          sticker('🌷', 60, 420, 90),
          sticker('🌻', 170, 400, 110),
          sticker('🌷', 450, 420, 90),
          sticker('🐝', 330, 330, 70),
        ],
        page: [
          sticker('🌷', 30, 540, 46),
          sticker('🐝', 540, 30, 42),
        ],
      },
    },
    {
      id: 'tide-pool', name: 'Tide Pool', category: 'Nature',
      description: 'Sea-glass blue water, bubbles, and friendly sea creatures.',
      palette: { background: '#e2f3f5', ink: '#1d4b57', accent: '#3aa0b0', soft: '#bfe4e9' },
      font: 'rounded', frame: 'thin', frameColor: '#3aa0b0',
      decor: {
        cover: [
          shape('rect', 0, 480, 612, 132, '#bfe4e9'),
          sticker('🐙', 80, 400, 110),
          sticker('🐠', 400, 380, 100),
          shape('ellipse', 330, 330, 30, 30, null, { stroke: '#3aa0b0', strokeWidth: 3 }),
          shape('ellipse', 360, 290, 20, 20, null, { stroke: '#3aa0b0', strokeWidth: 3 }),
          sticker('🌊', 250, 470, 90),
        ],
        page: [
          shape('ellipse', 40, 540, 24, 24, null, { stroke: '#3aa0b0', strokeWidth: 2 }),
          shape('ellipse', 70, 520, 14, 14, null, { stroke: '#3aa0b0', strokeWidth: 2 }),
          sticker('🐠', 532, 532, 46),
        ],
      },
    },
    {
      id: 'maple-lane', name: 'Maple Lane', category: 'Seasons',
      description: 'Warm autumn cream with falling leaves and orchard apples.',
      palette: { background: '#fbeedd', ink: '#5a2e1a', accent: '#d9822b', soft: '#f3d9b8' },
      font: 'serif', frame: 'dotted', frameColor: '#d9822b',
      decor: {
        cover: [
          sticker('🍁', 70, 360, 80, { rotation: -18 }),
          sticker('🍁', 470, 330, 70, { rotation: 22 }),
          sticker('🍁', 300, 430, 60, { rotation: 8 }),
          sticker('🍄', 110, 480, 80),
          sticker('🍎', 430, 470, 80),
        ],
        page: [
          sticker('🍁', 30, 30, 40, { rotation: -15 }),
          sticker('🍁', 542, 540, 40, { rotation: 20 }),
        ],
      },
    },
    {
      id: 'first-snow', name: 'First Snow', category: 'Seasons',
      description: 'Crisp winter white with snowflakes and drifting clouds.',
      palette: { background: '#f3f7fb', ink: '#2c3e58', accent: '#7fb2d9', soft: '#dbe9f5' },
      font: 'rounded', frame: 'rounded', frameColor: '#7fb2d9',
      decor: {
        cover: [
          shape('ellipse', -60, 480, 380, 200, '#dbe9f5'),
          shape('ellipse', 280, 500, 420, 200, '#e8f1f9'),
          sticker('❄️', 90, 340, 60),
          sticker('❄️', 470, 360, 70),
          sticker('❄️', 300, 420, 44),
          sticker('☃️', 240, 380, 120),
        ],
        page: [
          sticker('❄️', 34, 34, 36),
          sticker('❄️', 544, 544, 32),
        ],
      },
    },
    {
      id: 'chalk-and-slate', name: 'Chalk and Slate', category: 'Learning',
      description: 'A classroom chalkboard with a wooden edge and pencil notes.',
      palette: { background: '#2f4f43', ink: '#f7f3e3', accent: '#ffd96a', soft: '#3d6456' },
      font: 'hand', frame: 'thick', frameColor: '#b07a45',
      decor: {
        cover: [
          words('A  B  C', 120, 380, 372, 80, { font: 'hand', fontSize: 56, color: '#ffd96a', bold: true }),
          words('1  2  3', 160, 460, 292, 60, { font: 'hand', fontSize: 40, color: '#f7f3e3', opacity: 0.8 }),
          sticker('✏️', 470, 470, 70, { rotation: 20 }),
          sticker('📚', 60, 470, 70),
        ],
        page: [
          sticker('✏️', 536, 536, 40),
          words('★', 30, 30, 40, 40, { font: 'hand', fontSize: 26, color: '#ffd96a' }),
        ],
      },
    },
    {
      id: 'counting-garden', name: 'Counting Garden', category: 'Learning',
      description: 'Sunny cream pages with berries to count along the way.',
      palette: { background: '#fff8e6', ink: '#3b3a2a', accent: '#e5566f', soft: '#fde3b0' },
      font: 'rounded', frame: 'thin', frameColor: '#e5566f',
      decor: {
        cover: [
          shape('rounded', 90, 400, 432, 150, '#fde3b0'),
          sticker('🍓', 120, 430, 70),
          sticker('🍓', 230, 430, 70),
          sticker('🍓', 340, 430, 70),
          words('1   2   3', 110, 500, 320, 40, { font: 'rounded', fontSize: 26, color: '#e5566f', bold: true }),
          sticker('🐞', 450, 420, 60),
        ],
        page: [
          sticker('🍓', 30, 540, 40),
          sticker('🐞', 542, 30, 40),
        ],
      },
    },
    {
      id: 'confetti-day', name: 'Confetti Day', category: 'Celebration',
      description: 'Bright party balloons and bursts of confetti.',
      palette: { background: '#fff3ef', ink: '#3a2433', accent: '#d9553f', soft: '#ffd9cf' },
      font: 'sans', frame: 'none', frameColor: '#d9553f',
      decor: {
        cover: [
          sticker('🎈', 60, 330, 110, { rotation: -10 }),
          sticker('🎈', 450, 350, 100, { rotation: 12 }),
          sticker('🎉', 260, 420, 100),
          shape('burst', 180, 520, 40, 40, '#f2c94c'),
          shape('ellipse', 400, 520, 18, 18, '#2f7f75'),
          shape('ellipse', 120, 470, 14, 14, '#d9553f'),
          shape('star', 520, 500, 30, 30, '#5aa5d6'),
        ],
        page: [
          shape('burst', 30, 30, 36, 36, '#f2c94c'),
          shape('ellipse', 556, 40, 14, 14, '#2f7f75'),
          sticker('🎈', 540, 530, 50),
        ],
      },
    },
    {
      id: 'golden-ribbon', name: 'Golden Ribbon', category: 'Celebration',
      description: 'Buttery gold, a crown, and a gift for a very special day.',
      palette: { background: '#fdf6d8', ink: '#4a3a10', accent: '#f2b84b', soft: '#f7e6a6' },
      font: 'serif', frame: 'double', frameColor: '#d49a2a',
      decor: {
        cover: [
          shape('burst', 196, 330, 220, 220, '#f7e6a6'),
          sticker('👑', 246, 370, 120),
          sticker('🎁', 70, 460, 80),
          sticker('🎁', 460, 460, 80),
          shape('star', 120, 380, 30, 30, '#f2b84b'),
          shape('star', 470, 380, 30, 30, '#f2b84b'),
        ],
        page: [
          shape('star', 36, 36, 26, 26, '#f2b84b'),
          shape('star', 550, 550, 26, 26, '#f2b84b'),
        ],
      },
    },
  ];

  const CATEGORIES = [...new Set(THEMES.map((t) => t.category))];
  const themeById = (id) => THEMES.find((t) => t.id === id) || null;

  // ---------- page building ----------
  const randomPart = () => (typeof newId === 'function' ? newId() : crypto.randomUUID()).replace(/[^a-z0-9]/g, '').slice(0, 8);
  const sizeOf = (size) => (typeof PAGE_PT !== 'undefined' && PAGE_PT[size]) || [BASE, BASE];

  // Fresh, size-scaled decoration elements for one page. Ids: tpl-<themeId>-<n>-<random>.
  function decorations(theme, isCover, size = 'square') {
    const [W, H] = sizeOf(size);
    const sx = W / BASE;
    const sy = H / BASE;
    const k = Math.min(sx, sy);
    const list = isCover ? theme.decor.cover : theme.decor.page;
    return list.map((el, n) => {
      // Keep each item's centre in proportion to the page; its size scales evenly so shapes don't stretch.
      const w = el.w * k;
      const h = el.h * k;
      const cx = (el.x + el.w / 2) * sx;
      const cy = (el.y + el.h / 2) * sy;
      const item = {
        ...el, id: `${DECOR_PREFIX}${theme.id}-${n}-${randomPart()}`.slice(0, 64),
        x: Math.round((cx - w / 2) * 100) / 100, y: Math.round((cy - h / 2) * 100) / 100,
        w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100,
      };
      if (item.type === 'text') item.fontSize = Math.round(el.fontSize * k);
      return item;
    });
  }

  const isDecoration = (el) => typeof el?.id === 'string' && el.id.startsWith(DECOR_PREFIX);

  function stylePage(page, theme, size) {
    page.background = theme.palette.background;
    page.color = theme.palette.ink;
    page.font = theme.font;
    page.frame = theme.frame;
    page.frameColor = theme.frameColor;
    const own = (page.elements || []).filter((el) => !isDecoration(el));
    // Decorations go underneath the author's own elements.
    page.elements = [...decorations(theme, page.layout === 'cover', size), ...own];
    return page;
  }

  function themedPage(theme, input, size) {
    return stylePage({ layout: 'image-top', text: '', image: null, crop: null, align: 'center', elements: [], ...input }, theme, size);
  }

  function coverInput(theme, size = 'square', text = '') {
    return themedPage(theme, { layout: 'cover', text, fontSize: 48 }, size);
  }
  function pageInput(theme, size = 'square', text = 'Once upon a time…') {
    return themedPage(theme, { layout: 'image-top', text, fontSize: 24 }, size);
  }

  // Preview pages (fixed ids are fine: they are never saved).
  for (const theme of THEMES) {
    Object.defineProperty(theme, 'cover', { enumerable: true, get: () => coverInput(theme) });
    Object.defineProperty(theme, 'page', { enumerable: true, get: () => pageInput(theme) });
  }

  // ---------- starter books (original stories) ----------
  const STARTERS = [
    {
      id: 'moon-button', name: 'The Moon’s Lost Button', themeId: 'moonlit-quilt', size: 'square',
      description: 'A bedtime search for the button that holds the night sky shut.',
      title: 'The Moon’s Lost Button',
      text: [
        'Every night the Moon buttoned up the sky, so the dark would stay snug and warm.',
        'But one night, the very last button was missing. A little gap let the morning peek through.',
        'Owl looked in the treetops. Mouse looked under the leaves. Nobody found a button.',
        'Then Juniper, who could not sleep, saw something round and shiny in her slipper.',
        'She tiptoed to the window and held it up as high as she could reach.',
        'The Moon smiled, took the button, and fastened the sky. “Thank you,” it whispered. “Now, goodnight.”',
      ],
    },
    {
      id: 'pip-boat', name: 'Pip Builds a Boat', themeId: 'compass-rose', size: 'landscape',
      description: 'A small mouse, a walnut shell, and a very big puddle.',
      title: 'Pip Builds a Boat',
      text: [
        'Pip the mouse wanted to see the far side of the Great Puddle.',
        'She found half a walnut shell, a twig for a mast, and a leaf for a sail.',
        'The wind puffed. The leaf filled. Off went Pip, bobbing and bumping.',
        'A frog swam by. “Where are you going?” “To the other side!” said Pip.',
        'A raindrop splashed, the boat spun, and Pip held on tight to her twig.',
        'At last she bumped onto the far shore, where a dandelion clock was waiting.',
        'Pip made a wish, and the seeds flew home ahead of her to say she was on her way.',
      ],
    },
    {
      id: 'snow-steps', name: 'Ten Snowy Steps', themeId: 'first-snow', size: 'square',
      description: 'Counting footprints on the first white morning of winter.',
      title: 'Ten Snowy Steps',
      text: [
        'The garden was white and quiet. Arlo stepped outside. One step, two steps.',
        'Three steps to the fence, where a robin sat fluffed up like a ball.',
        'Four, five, six steps to the hill, where the snow was deep enough to hide his boots.',
        'Seven, eight, nine steps back again, following his own little trail.',
        'Ten steps to the door, and a cup of warm milk waiting inside.',
      ],
    },
    {
      id: 'hazel-party', name: 'Hazel’s Garden Party', themeId: 'meadow-walk', size: 'portrait',
      description: 'A hedgehog plans a party and everyone brings something small.',
      title: 'Hazel’s Garden Party',
      text: [
        'Hazel the hedgehog wanted to throw a party, but her cupboard held only one berry.',
        'She wrote invitations on clover leaves and tucked them under every door.',
        'Bee brought a drop of honey. Snail brought a shiny pebble to sit on.',
        'Rabbit brought three carrot tops. Wren brought a song nobody had heard before.',
        'They put everything on a big flat stone, and it looked like a feast.',
        'They ate, and sang, and played until the fireflies came out.',
        '“The best parties,” said Hazel, “are made of everybody’s little things.”',
      ],
    },
  ];

  const starterById = (id) => STARTERS.find((s) => s.id === id) || null;
  for (const starter of STARTERS) {
    Object.defineProperty(starter, 'pages', {
      enumerable: true,
      get: () => {
        const theme = themeById(starter.themeId);
        return [coverInput(theme, starter.size), ...starter.text.map((t) => pageInput(theme, starter.size, t))];
      },
    });
  }

  // ---------- public API ----------
  // Restyles every page of `book` in place, swapping any earlier theme decorations for this theme's. Keeps text, pictures and the author's own elements.
  function applyTheme(book, themeId) {
    const theme = themeById(themeId);
    if (!theme || !book) return book;
    for (const page of book.pages || []) stylePage(page, theme, book.size);
    book.builder = { ...(book.builder || {}), templateId: theme.id };
    return book;
  }

  // Returns a createBook input for a theme id (cover + one page) or a starter id.
  function bookFromTemplate(id) {
    const starter = starterById(id);
    if (starter) {
      return {
        title: starter.title, size: starter.size,
        builder: { templateId: starter.themeId, idea: starter.description },
        manuscript: { chapters: starter.text.map((t, i) => ({ title: `Page ${i + 1}`, blocks: [{ type: 'p', runs: [{ text: t }] }] })) },
        pages: starter.pages,
      };
    }
    const theme = themeById(id);
    if (!theme) throw new Error(`Unknown template: ${id}`);
    return {
      title: 'Untitled story', size: 'square',
      builder: { templateId: theme.id },
      pages: [coverInput(theme, 'square'), pageInput(theme, 'square', '')],
    };
  }

  window.STORYLOOM_TEMPLATES = {
    themes: THEMES, starters: STARTERS, categories: CATEGORIES, decorationPrefix: DECOR_PREFIX,
    applyTheme, bookFromTemplate, isDecoration,
  };
})();
