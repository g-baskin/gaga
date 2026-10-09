---
type: meta
title: "Contract corrections 2026-10-08"
report_type: contradiction
status: developing
created: 2026-10-08
updated: 2026-10-08
related: ["[[entities/ipc-channels]]", "[[entities/window-storyloom-api]]", "[[entities/storage-cjs]]", "[[entities/createStore]]", "[[entities/page]]", "[[entities/generateImage]]", "[[concepts/atomic-file-writes]]"]
tags: [meta, contradiction]
sources: [main.cjs, preload.cjs, storage.cjs, main/settings.cjs, main/ai-services.cjs]
---

# Contract corrections

Both callouts live on each canonical page; no competing entity versions were introduced. Source relocation alone is not a semantic contradiction. Notification flags are in the scan response. These are corrections observed at `6a7c05c`, not change attribution to that commit.

## 1. IPC surface grew

- Page: [[entities/ipc-channels]].
- Prior: Earlier scans recorded 44, then 49 invoke channels.
- Current: There are 52 registered invoke channels and matching preload wrappers, including scene planning and local logging.
- Evidence: `main.cjs` / `registerHandlers`; `preload.cjs` / `contextBridge.exposeInMainWorld`.

## 2. Preload API grew

- Page: [[entities/window-storyloom-api]].
- Prior: The prior object summary listed 43 invoke methods and two subscriptions.
- Current: There are 52 invoke wrappers and three event subscriptions, including onUpdateState; see [[entities/ipc-channels]].
- Evidence: `preload.cjs` / `contextBridge.exposeInMainWorld`.

## 3. Storage export contract

- Page: [[entities/storage-cjs]].
- Prior: The prior module page exported sanitizeBook, sanitizeElement, sanitizeCrop, sniffAudio, decodeStoryText, LIBRARY and READING_LEVELS.
- Current: module.exports actually contains createStore, sanitizePage, sniffImage, plainFsError, readJsonFile, LENGTHS, BOOK_INK and MAX_CHARACTERS; other helpers are internal.
- Evidence: `storage.cjs` / `module.exports`.

## 4. Storage recovery callbacks

- Page: [[entities/createStore]].
- Prior: The prior signature was createStore(root).
- Current: The signature is createStore(root, { onDamaged, onUnreadableBook } = {}); list caches summaries against mtime/size/inode, bounds concurrent reads, and reports unreadable existing books without deleting them.
- Evidence: `storage.cjs` / `createStore`, `list`.

## 5. Persisted page fields

- Page: [[entities/page]].
- Prior: The prior persisted shape omitted imagePrompt and titleFont.
- Current: sanitizePage preserves imagePrompt (up to 2000 characters) and a known titleFont (or empty string), supporting redraw and separate cover-title typography.
- Evidence: `storage.cjs` / `sanitizePage`.

## 6. Reference-aware generation

- Page: [[entities/generateImage]].
- Prior: The prior behavior described prompt-only generation.
- Current: generateImage additionally accepts references and aspect; it reads at most four distinct book images, suppresses references for line art, sends them to OpenRouter/fal where supported, and keeps custom image generation reference-free.
- Evidence: `main/ai-services.cjs` / `readReferences`, `generateImage`; `ai/openrouter.cjs` / `image`; `ai/fal.cjs` / `image`.

## 7. Settings write description

- Page: [[concepts/atomic-file-writes]].
- Prior: The concept still described a PID-only temporary filename.
- Current: writePrivate uses PID plus randomUUID and cleanup; saveSettings queues read-modify-write saves. The resolved [[questions/writeprivate-temp-name-collision]] retains the original finding.
- Evidence: `main/settings.cjs` / `writePrivate`, `saveSettings`.
