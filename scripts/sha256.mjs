// SHA-256 of a file as lowercase hex, read as a stream so large release archives aren't loaded into memory.
// Shared by the release scripts (dist.mjs for SHA256SUMS, update-manifest.mjs for latest.json). Build-only:
// it isn't part of the packaged app.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
