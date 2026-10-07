# Storyloom design direction

**Subject, audience, job.** A Mac app where parents, teachers, and new authors make picture books. Each screen has one job: start a story, find a book, or finish one.

**Signature.** The printed picture book: books stand on a wooden shelf with spines, the Home page is an open notebook page, and the thread from the logo (the "loom") is the one decorative line. Nothing floats, sparkles, or drifts.

**Type.**
- Display: Rockwell, a slab serif like the type in classic printed picture books. It ships with macOS, so it needs no download. Fallback is Georgia.
- Body and controls: the system font, for clear, native-feeling forms.
- Scale: 13 / 14 / 16 / 20 / 28 / 40 px.

**Colour** (Kelly's lavender palette, kept by request):
- paper #f4f0fa and panels #ffffff; a lilac sky gradient (#c9b6ff to #eadbff to #fff0f7) behind the Home page and the sidebar.
- ink #2c2458 for headings and text; muted #655e86 for secondary text (darkened from #6e6594 so it stays readable on lilac).
- main buttons #2a2158 (deep purple) with white text; selected states #3a2f86 on lilac #efe7ff.
- violet #5b4fd6 for focus rings and highlights; #7c5cff, pink #ff8fb8 and sun #ffd36e only as decoration (the logo, the notebook margin, selection bars).
- shelf wood #b07a45 with a darker edge #8a5a2e.

Contrast pairs (measured): ink on paper 12.5:1, muted on paper 5.3:1 and on lilac 5.5:1, white on the main button 14.4:1, purple on lilac 9.1:1, placeholder #6b6488 on white 5.5:1.

**Space and density.** 4px base; 8 / 12 / 16 / 24 / 32 / 48. Comfortable, not dense.

**Radius and material.** Flat paper with hairline borders: 6px on controls, 10px on cards, 3px on book covers (books have sharp corners). One soft shadow under books on the shelf. No glass, no blur.

**Imagery.** Only the user's real book covers. No invented art.

**Motion.** Colour and border changes in 120ms. No hover lift; a book on the shelf shifts 2px up only while pressed. Off for reduced motion.

**Alignment.** Left sidebar navigation (Storyloom's own), content on one 1040px rail, left-aligned headings.

**Rejected defaults.** Pill navigation across the top, a centered hero headline, "Addon" badges on free features, emoji-style decorations, and any wording from other picture-book apps.
