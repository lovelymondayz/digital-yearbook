export type AssetSize = "thumbnail" | "preview";

/**
 * Append an Immich variant selector to a proxied asset URL.
 *
 * The flipbook proxy (`/api/v1/flipbook/asset/:id`) defaults to the original
 * file, which for the 2026 book is a 34.9 MB 4419x6250 PNG — far larger than
 * any screen, and over the `gl.MAX_TEXTURE_SIZE` limit on many GPUs (which is
 * why those pages rendered blank). Consumers pick the variant they need:
 *
 *   - thumbnail (250px, ~24 KB)   → grid overview
 *   - preview   (1440px, ~655 KB)  → 3D pages, mobile view, zoom overlay
 */
export function withSize(url: string, size: AssetSize): string {
  if (!url) return url;
  return `${url}${url.includes("?") ? "&" : "?"}size=${size}`;
}
