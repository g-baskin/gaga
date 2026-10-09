---
type: concept
title: "Designer script order"
status: developing
created: 2026-10-08
updated: 2026-10-08
complexity: intermediate
domain: storyloom
tags: [concept, storyloom]
related: ["[[entities/editor-js]]", "[[entities/app-js]]"]
sources: ["renderer/index.html", "renderer/editor.js", "renderer/app.js"]
---

# Designer script order

`renderer/index.html` orders deferred shared-global scripts: core → font list/fonts → Designer model/canvas/drawers/inspector/pages → editor → app → templates data → screens. No bundler or module loader is involved in these script tags.

`renderer/editor.js` defines installEditorListeners, but `renderer/app.js` / DOMContentLoaded calls it only after deferred scripts have initialized state. This prevents editor listeners from reaching app globals before initialization. The Designer remains registered by app.js / registerScreen('designer'); extracting implementation files did not create five new screens.

See [[entities/editor-js]], [[entities/designer-model]], [[entities/designer-canvas]], [[entities/designer-drawers]], [[entities/designer-inspector]], [[entities/designer-pages]].
