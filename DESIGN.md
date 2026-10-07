# Storyloom design direction

**Subject, audience, job.** A Mac app where parents, teachers, and new authors make picture books. Each screen has one job: start a story, find a book, or finish one.

**Signature.** The printed picture book: books stand on a wooden shelf with spines, the Home page is an open notebook page, and the thread from the logo (the "loom") is the one decorative line. Nothing floats, sparkles, or drifts.

**Type.**
- Display: Rockwell, a slab serif like the type in classic printed picture books. It ships with macOS, so it needs no download. Fallback is Georgia.
- Body and controls: the system font, for clear, native-feeling forms.
- Scale: 13 / 14 / 16 / 20 / 28 / 40 px.

**Colour** (OKLCH with hex equivalents):
- paper `oklch(97% 0.012 85)` #f8f4ea: the background, like uncoated book paper.
- ink `oklch(30% 0.04 255)` #26304a: headings and text, a deep printer's navy.
- primary #b84a33: brick red for the main action. White text on it is 5.2:1; as text on paper it is 4.7:1.
- leaf `oklch(65% 0.12 130)` #6b8f3a: selected states and success. Darker #4f6b2a for text (5.6:1 on paper).
- mustard `oklch(82% 0.13 85)` #f2c14e: small highlights only, never under text smaller than 18px.
- shelf wood #b07a45 with a darker edge #8a5a2e.

Contrast pairs (measured): ink on paper 11.9:1, muted #5b647a on paper 5.4:1, white on brick 5.2:1, leaf text #4f6b2a on paper 5.5:1, ink on mustard 7.8:1.

**Space and density.** 4px base; 8 / 12 / 16 / 24 / 32 / 48. Comfortable, not dense.

**Radius and material.** Flat paper with hairline borders: 6px on controls, 10px on cards, 3px on book covers (books have sharp corners). One soft shadow under books on the shelf. No glass, no blur.

**Imagery.** Only the user's real book covers. No invented art.

**Motion.** Colour and border changes in 120ms. No hover lift; a book on the shelf shifts 2px up only while pressed. Off for reduced motion.

**Alignment.** Left sidebar navigation (Storyloom's own), content on one 1040px rail, left-aligned headings.

**Rejected defaults.** Lavender sky gradient, pill navigation across the top, centered hero headline, "Addon" badges on free features, emoji-style decorations, violet accents, and any wording from other picture-book apps.
