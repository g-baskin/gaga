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
    ...common, type: 'shape', shape: kind, x, y, w, h, fill, stroke: BOOK_INK, strokeWidth: 0, ...extra,
  });
  const words = (text, x, y, w, h, extra = {}) => ({
    ...common, type: 'text', text, x, y, w, h, font: 'serif', fontSize: 24, color: BOOK_INK, align: 'center',
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
      titleFont: 'playfair', font: 'literata', frame: 'double', frameColor: '#f2c94c',
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
      titleFont: 'fredoka', font: 'quicksand', frame: 'rounded', frameColor: '#8fa6d6',
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
      titleFont: 'merriweather', font: 'lora', frame: 'thick', frameColor: '#7a4a2a',
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
      titleFont: 'luckiest', font: 'nunito', frame: 'none', frameColor: '#f28e5c',
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
      titleFont: 'kalam', font: 'andika', frame: 'dashed', frameColor: '#6fa65a',
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
      titleFont: 'baloo', font: 'nunito', frame: 'thin', frameColor: '#3aa0b0',
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
      titleFont: 'playfair', font: 'lora', frame: 'dotted', frameColor: '#d9822b',
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
      titleFont: 'sniglet', font: 'quicksand', frame: 'rounded', frameColor: '#7fb2d9',
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
      titleFont: 'amatic', font: 'patrick', frame: 'thick', frameColor: '#b07a45',
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
      titleFont: 'fredoka', font: 'andika', frame: 'thin', frameColor: '#e5566f',
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
      titleFont: 'bubblegum', font: 'nunito', frame: 'none', frameColor: '#d9553f',
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
      titleFont: 'playfair', font: 'literata', frame: 'double', frameColor: '#d49a2a',
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

    // ---------- more themes, each with its own title + body font pairing ----------
    {
      id: 'lantern-light', name: 'Lantern Light', category: 'Bedtime',
      description: 'Warm amber glow on plum, with paper lanterns and fireflies.',
      palette: { background: '#3b2346', ink: '#fbe9c8', accent: '#f5a742', soft: '#5a3a68' },
      titleFont: 'merriweather', font: 'lora', frame: 'thin', frameColor: '#f5a742',
      decor: {
        cover: [
          shape('ellipse', 90, 360, 120, 150, '#f5a742', { opacity: 0.9 }),
          shape('ellipse', 400, 380, 110, 140, '#f5a742', { opacity: 0.75 }),
          shape('ellipse', 250, 470, 70, 90, '#ffd27a', { opacity: 0.85 }),
          shape('ellipse', 180, 330, 12, 12, '#fff4b0'),
          shape('ellipse', 520, 330, 10, 10, '#fff4b0'),
          shape('ellipse', 330, 360, 8, 8, '#fff4b0'),
        ],
        page: [
          shape('ellipse', 40, 40, 12, 12, '#fff4b0'),
          shape('ellipse', 560, 50, 10, 10, '#fff4b0'),
          shape('ellipse', 548, 548, 14, 14, '#f5a742'),
        ],
      },
    },
    {
      id: 'treasure-map', name: 'Treasure Map', category: 'Adventure',
      description: 'Sun-faded paper, a dotted trail, and an X that marks the spot.',
      palette: { background: '#f1e2bf', ink: '#4b3418', accent: '#b5462c', soft: '#e2cc98' },
      titleFont: 'luckiest', font: 'merriweather', frame: 'dashed', frameColor: '#7a5528',
      decor: {
        cover: [
          shape('ellipse', 60, 400, 24, 24, '#7a5528'),
          shape('ellipse', 130, 430, 20, 20, '#7a5528'),
          shape('ellipse', 200, 450, 20, 20, '#7a5528'),
          shape('ellipse', 270, 445, 20, 20, '#7a5528'),
          shape('ellipse', 340, 420, 20, 20, '#7a5528'),
          sticker('\u274C', 420, 380, 90),
          sticker('\u{1F9ED}', 470, 500, 70),
          sticker('\u{1F334}', 70, 470, 90),
        ],
        page: [
          sticker('\u{1F9ED}', 26, 26, 44),
          shape('ellipse', 548, 552, 16, 16, '#7a5528'),
        ],
      },
    },
    {
      id: 'jungle-trek', name: 'Jungle Trek', category: 'Adventure',
      description: 'Deep leafy greens, bold title letters, and a peek at a tiger.',
      palette: { background: '#e3f0d6', ink: '#1f3b1c', accent: '#e07a2f', soft: '#b9d79c' },
      titleFont: 'baloo', font: 'andika', frame: 'thick', frameColor: '#3f7a2c',
      decor: {
        cover: [
          shape('cloud', 0, 470, 260, 140, '#7fb35a'),
          shape('cloud', 330, 480, 282, 132, '#5f9a43'),
          sticker('\u{1F42F}', 240, 360, 130),
          sticker('\u{1F33F}', 40, 340, 80, { rotation: -20 }),
          sticker('\u{1F99C}', 480, 330, 80),
        ],
        page: [
          sticker('\u{1F33F}', 20, 20, 50, { rotation: -15 }),
          sticker('\u{1F33F}', 542, 540, 50, { rotation: 160 }),
        ],
      },
    },
    {
      id: 'barnyard', name: 'Barnyard Morning', category: 'Animals',
      description: 'Red barn, golden hay, and friends who wake up early.',
      palette: { background: '#fdf1dc', ink: '#4a2618', accent: '#c4402c', soft: '#f3d79a' },
      titleFont: 'sniglet', font: 'andika', frame: 'rounded', frameColor: '#c4402c',
      decor: {
        cover: [
          shape('rect', 0, 520, 612, 92, '#f3d79a'),
          sticker('\u{1F404}', 60, 400, 120),
          sticker('\u{1F411}', 250, 430, 100),
          sticker('\u{1F413}', 420, 380, 110),
          sticker('\u{1F33B}', 520, 470, 70),
        ],
        page: [
          sticker('\u{1F414}', 22, 530, 56),
          sticker('\u{1F33E}', 540, 26, 50),
        ],
      },
    },
    {
      id: 'polar-pals', name: 'Polar Pals', category: 'Animals',
      description: 'Icy blues, soft snowdrifts, and a penguin parade.',
      palette: { background: '#e9f4fb', ink: '#1d3a52', accent: '#3d8cc4', soft: '#ffffff' },
      titleFont: 'fredoka', font: 'nunito', frame: 'thin', frameColor: '#3d8cc4',
      decor: {
        cover: [
          shape('cloud', -20, 500, 300, 130, '#ffffff'),
          shape('cloud', 300, 510, 330, 120, '#ffffff'),
          sticker('\u{1F427}', 120, 400, 100),
          sticker('\u{1F427}', 230, 420, 90),
          sticker('\u{1F43B}', 400, 380, 130),
          shape('star', 60, 340, 24, 24, '#ffffff'),
        ],
        page: [
          sticker('\u{1F427}', 26, 540, 50),
          shape('star', 552, 34, 22, 22, '#3d8cc4'),
        ],
      },
    },
    {
      id: 'buzzing-garden', name: 'Buzzing Garden', category: 'Animals',
      description: 'Honey yellow, golden bursts, and busy little bees.',
      palette: { background: '#fff7d6', ink: '#3b2e08', accent: '#e8a317', soft: '#ffe58a' },
      titleFont: 'bubblegum', font: 'quicksand', frame: 'dotted', frameColor: '#e8a317',
      decor: {
        cover: [
          shape('burst', 70, 420, 120, 120, '#ffe58a'),
          shape('burst', 420, 440, 110, 110, '#ffe58a'),
          sticker('\u{1F41D}', 220, 400, 100),
          sticker('\u{1F33C}', 110, 470, 60),
          sticker('\u{1F33C}', 470, 380, 60),
          sticker('\u{1F36F}', 300, 500, 80),
        ],
        page: [
          sticker('\u{1F41D}', 30, 30, 44),
          sticker('\u{1F33C}', 540, 540, 44),
        ],
      },
    },
    {
      id: 'spring-showers', name: 'Spring Showers', category: 'Seasons',
      description: 'Fresh mint, puddles, and an umbrella for two.',
      palette: { background: '#e8f6ef', ink: '#1f4436', accent: '#3fa77a', soft: '#c9ecdb' },
      titleFont: 'caveat', font: 'atkinson', frame: 'rounded', frameColor: '#3fa77a',
      decor: {
        cover: [
          shape('cloud', 60, 300, 220, 110, '#c9ecdb'),
          shape('cloud', 340, 320, 210, 100, '#c9ecdb'),
          sticker('\u2602', 230, 400, 120),
          shape('ellipse', 90, 540, 160, 30, '#9ed8bd'),
          shape('ellipse', 380, 550, 150, 26, '#9ed8bd'),
          sticker('\u{1F337}', 520, 470, 60),
        ],
        page: [
          sticker('\u{1F4A7}', 26, 26, 36),
          sticker('\u{1F337}', 544, 540, 46),
        ],
      },
    },
    {
      id: 'summer-shore', name: 'Summer Shore', category: 'Seasons',
      description: 'Sandy cream, a big round sun, and treasures from the tide.',
      palette: { background: '#fff4dd', ink: '#2c3a4a', accent: '#f07a52', soft: '#ffe0a8' },
      titleFont: 'luckiest', font: 'nunito', frame: 'none', frameColor: '#f07a52',
      decor: {
        cover: [
          shape('ellipse', 430, 320, 130, 130, '#ffcf5c'),
          shape('rect', 0, 520, 612, 92, '#9fd6e8'),
          sticker('\u{1F3D6}', 80, 380, 130),
          sticker('\u{1F41A}', 300, 470, 60),
          sticker('\u{1F980}', 420, 470, 70),
        ],
        page: [
          sticker('\u{1F41A}', 28, 540, 44),
          shape('ellipse', 540, 30, 44, 44, '#ffcf5c'),
        ],
      },
    },
    {
      id: 'shapes-and-sizes', name: 'Shapes and Sizes', category: 'Learning',
      description: 'Big friendly shapes in primary colors, made for first books.',
      palette: { background: '#ffffff', ink: '#222a3a', accent: '#2f6fd6', soft: '#f1f4fa' },
      titleFont: 'fredoka', font: 'andika', frame: 'thick', frameColor: '#222a3a',
      decor: {
        cover: [
          shape('ellipse', 60, 380, 130, 130, '#e2483d'),
          shape('triangle', 240, 380, 140, 130, '#f4c430'),
          shape('rect', 420, 380, 130, 130, '#2f6fd6'),
          shape('star', 150, 520, 60, 60, '#3aa55c'),
          shape('heart', 400, 524, 64, 58, '#e57ab0'),
        ],
        page: [
          shape('ellipse', 30, 30, 34, 34, '#e2483d'),
          shape('triangle', 548, 30, 36, 32, '#f4c430'),
          shape('rect', 548, 548, 34, 34, '#2f6fd6'),
        ],
      },
    },
    {
      id: 'story-time-abc', name: 'Story Time ABC', category: 'Learning',
      description: 'Clear letters on ruled paper for early readers.',
      palette: { background: '#fdfcf7', ink: '#26304a', accent: '#d9553f', soft: '#e6eef9' },
      titleFont: 'patrick', font: 'atkinson', frame: 'thin', frameColor: '#9fb6d9',
      decor: {
        cover: [
          shape('rect', 0, 360, 612, 2, '#9fb6d9'),
          shape('rect', 0, 420, 612, 2, '#9fb6d9'),
          shape('rect', 0, 480, 612, 2, '#9fb6d9'),
          shape('rect', 0, 540, 612, 2, '#9fb6d9'),
          sticker('\u270F', 470, 470, 90, { rotation: 20 }),
          sticker('\u{1F4DA}', 80, 450, 90),
        ],
        page: [
          shape('rect', 0, 580, 612, 2, '#9fb6d9'),
          sticker('\u270F', 548, 28, 40, { rotation: 20 }),
        ],
      },
    },
    {
      id: 'birthday-cake', name: 'Birthday Cake', category: 'Celebration',
      description: 'Candy pink, sprinkles, and candles waiting for a wish.',
      palette: { background: '#fff0f6', ink: '#4a1f3a', accent: '#e14d8f', soft: '#ffd3e6' },
      titleFont: 'bubblegum', font: 'nunito', frame: 'dotted', frameColor: '#e14d8f',
      decor: {
        cover: [
          sticker('\u{1F382}', 230, 380, 150),
          sticker('\u{1F388}', 70, 360, 90, { rotation: -8 }),
          sticker('\u{1F388}', 460, 360, 90, { rotation: 8 }),
          shape('rect', 120, 540, 14, 6, '#5aa5d6', { rotation: 30 }),
          shape('rect', 480, 530, 14, 6, '#f2c94c', { rotation: -20 }),
          shape('rect', 200, 570, 14, 6, '#3fa77a', { rotation: 60 }),
          shape('rect', 420, 575, 14, 6, '#e14d8f', { rotation: 10 }),
        ],
        page: [
          shape('rect', 30, 40, 14, 6, '#5aa5d6', { rotation: 30 }),
          shape('rect', 560, 560, 14, 6, '#f2c94c', { rotation: -20 }),
          sticker('\u{1F388}', 540, 26, 44),
        ],
      },
    },
    {
      id: 'fairy-glen', name: 'Fairy Glen', category: 'Nature',
      description: 'Misty lilac woods, toadstools, and a sprinkle of sparkle.',
      palette: { background: '#efe8fb', ink: '#2c2458', accent: '#7c5cff', soft: '#d9cdf6' },
      titleFont: 'playfair', font: 'literata', frame: 'rounded', frameColor: '#7c5cff',
      decor: {
        cover: [
          shape('cloud', -10, 500, 280, 120, '#d9cdf6'),
          shape('cloud', 330, 510, 300, 110, '#d9cdf6'),
          sticker('\u{1F344}', 100, 420, 90),
          sticker('\u{1F344}', 440, 440, 70),
          sticker('\u{1F98B}', 260, 380, 90),
          shape('star', 200, 340, 22, 22, '#ffd36e'),
          shape('star', 400, 330, 18, 18, '#ffd36e'),
        ],
        page: [
          shape('star', 34, 34, 20, 20, '#ffd36e'),
          sticker('\u{1F344}', 540, 540, 44),
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
    page.titleFont = theme.titleFont || '';
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
    {
      id: 'penguin-hats', name: 'Who Took the Penguin’s Hat?', themeId: 'polar-pals', size: 'square',
      description: 'A windy day, a lost red hat, and a whole iceberg of helpers.',
      title: 'Who Took the Penguin’s Hat?',
      text: [
        'Pemba the penguin had a little red hat that kept her ears warm.',
        'One morning, a big gust of wind lifted it up, up, and away.',
        'Seal looked under the water. Walrus looked behind the snowdrift. No hat.',
        'Bear said, “Look up!” A puffin was flying past with something red in its beak.',
        '“I thought it was a nest,” said Puffin, and gave it back with a little bow.',
        'Pemba put her hat on and gave Puffin a scarf, so they would both stay warm.',
      ],
    },
    {
      id: 'shape-hunt', name: 'The Great Shape Hunt', themeId: 'shapes-and-sizes', size: 'square',
      description: 'Circles, triangles, and squares are hiding all over the house.',
      title: 'The Great Shape Hunt',
      text: [
        'Mila had a magnifying glass and a very important job: find the shapes.',
        'The clock on the wall was a circle. The pizza slice was a triangle.',
        'The window was a square, and so was the cracker in her hand. Crunch!',
        'The door was a rectangle, tall and thin, like a stretched-out square.',
        'At bedtime, she looked out the window. The moon was the biggest circle of all.',
        '“Shapes are everywhere,” Mila yawned, “even in the sky.”',
      ],
    },
    {
      id: 'lantern-walk', name: 'The Night Lantern Walk', themeId: 'lantern-light', size: 'portrait',
      description: 'A quiet walk home, one lantern, and a sky full of fireflies.',
      title: 'The Night Lantern Walk',
      text: [
        'After the festival, Theo carried his paper lantern down the hill.',
        'It glowed orange, like a tiny piece of the sunset he could hold.',
        'A firefly blinked beside it. Then another, and another.',
        'Soon a whole cloud of little lights was walking with him.',
        'At his door, Theo held the lantern up high to say thank you.',
        'The fireflies blinked back, then floated off to light someone else’s way home.',
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
