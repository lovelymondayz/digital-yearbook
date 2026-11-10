/**
 * Preload a list of image URLs into an in-memory blob cache.
 *
 * quick_flipbook fetches pages lazily, two at a time, so a page turned to
 * before its texture arrived rendered as the library's blank material. Pulling
 * every page up front — with a progress callback so the UI can show a loading
 * screen — guarantees the bytes are local before the book mounts.
 */

export interface PreloadResult {
  /** Successfully fetched blobs, keyed by URL. */
  blobs: Map<string, Blob>;
  /** URLs that failed after retrying. */
  failed: string[];
}

export interface PreloadOptions {
  onProgress?: (loaded: number, total: number) => void;
  /** How many requests may be in flight at once. */
  concurrency?: number;
  /** Per-request timeout. */
  timeoutMs?: number;
  /** Extra attempts per URL (1 = a single retry). */
  retries?: number;
  signal?: AbortSignal;
}

const DEFAULT_CONCURRENCY = 6;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 1;

export async function preloadBlobs(
  urls: string[],
  options: PreloadOptions = {}
): Promise<PreloadResult> {
  const {
    onProgress,
    concurrency = DEFAULT_CONCURRENCY,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    signal,
  } = options;

  // De-dupe while preserving order — the same URL can appear more than once.
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const total = unique.length;
  const blobs = new Map<string, Blob>();
  const failed: string[] = [];
  let loaded = 0;
  let cursor = 0;

  const report = () => onProgress?.(loaded, total);

  async function fetchOne(url: string): Promise<Blob> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const onAbort = () => controller.abort();
        signal?.addEventListener("abort", onAbort, { once: true });
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.blob();
        } finally {
          clearTimeout(timer);
          signal?.removeEventListener("abort", onAbort);
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  async function worker(): Promise<void> {
    while (cursor < unique.length) {
      if (signal?.aborted) return;
      const url = unique[cursor++];
      try {
        blobs.set(url, await fetchOne(url));
      } catch {
        failed.push(url);
      } finally {
        loaded += 1;
        report();
      }
    }
  }

  report();

  if (total === 0) return { blobs, failed };

  const lanes = Math.max(1, Math.min(concurrency, total));
  await Promise.all(Array.from({ length: lanes }, () => worker()));

  return { blobs, failed };
}
