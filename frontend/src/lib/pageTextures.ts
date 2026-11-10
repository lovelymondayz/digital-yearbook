import * as THREE from "three";

/**
 * GPU texture management for the flipbook.
 *
 * Holding a texture for every page is not viable: 211 pages at the 1440px
 * preview size is ~2.5 GB of video memory, which thrashes or crashes on
 * laptops and phones. Instead the bytes for every page are preloaded (see
 * `preload.ts`) and only a window of textures around the current page is kept
 * resident — decoding a page from its already-local blob costs ~20 ms, so a
 * page entering the window is ready long before it becomes visible.
 */

/** quick_flipbook pairs pages into sheets: page 1 → face 1, page 2 → face 0. */
export function faceForPageIndex(index: number): 0 | 1 {
  return index % 2 === 0 ? 1 : 0;
}

let spineAoTexture: THREE.CanvasTexture | null = null;

/** Vertical black→white gradient the library uses to shade the spine side. */
function getSpineAoTexture(): THREE.CanvasTexture {
  if (spineAoTexture) return spineAoTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, "black");
    gradient.addColorStop(0.1, "white");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  spineAoTexture = new THREE.CanvasTexture(canvas);
  return spineAoTexture;
}

function createPageMaterial(face: 0 | 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.2,
    aoMapIntensity: 0.7,
    aoMap: face === 1 ? getSpineAoTexture() : null,
    toneMapped: false,
  });
}

/**
 * Load a blob into an HTMLImageElement.
 *
 * An <img> is deliberate: three.js's WebGL uploader only applies
 * UNPACK_FLIP_Y_WEBGL when the texture's image is NOT an ImageBitmap
 * (WebGLTextures.js — `isImageBitmap === false` branch). ImageBitmap uploads
 * are assumed to be pre-oriented, so textures built from them render upside
 * down. TextureLoader uses an Image element, which is why the pages were
 * oriented correctly before.
 */
function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      // Fully decode before the blob URL is revoked so the texture has data.
      if (typeof image.decode === "function") {
        image.decode().then(
          () => resolve(image),
          () => resolve(image)
        );
      } else {
        resolve(image);
      }
    };
    image.onerror = () => reject(new Error("image load failed"));
    image.src = url;
  });
}

async function decodeTexture(blob: Blob): Promise<THREE.Texture> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImageElement(url);
    const texture = new THREE.Texture(image);
    // Match quick_flipbook's own texture setup.
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PageTextureManagerOptions {
  /** Pages kept resident on each side of the current page. */
  radius?: number;
  /** Maximum simultaneous decodes. */
  concurrency?: number;
}

export class PageTextureManager {
  private readonly radius: number;
  private readonly concurrency: number;
  /** Textures keyed by URL so a filtered page list reuses what is resident. */
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly pending = new Map<string, Promise<void>>();
  private readonly failed = new Set<string>();
  private materials: THREE.MeshStandardMaterial[] = [];
  private urls: string[] = [];
  private queue: string[] = [];
  private inflight = 0;
  private lastCenterKey = "";
  private generation = 0;
  private center = 0;
  private disposed = false;

  constructor(
    private readonly blobs: Map<string, Blob>,
    options: PageTextureManagerOptions = {}
  ) {
    this.radius = options.radius ?? 8;
    this.concurrency = options.concurrency ?? 4;
  }

  /**
   * Build the material list for a page list (full or search-filtered) and hand
   * it to `book.setPages()`. Textures already resident are re-attached, so a
   * filtered list does not re-decode anything.
   */
  setPageList(urls: string[]): THREE.MeshStandardMaterial[] {
    this.urls = urls;
    this.lastCenterKey = "";

    for (const material of this.materials) {
      // Textures are shared across materials and disposed separately.
      material.map = null;
      material.dispose();
    }

    this.materials = urls.map((url, index) => {
      const material = createPageMaterial(faceForPageIndex(index));
      const texture = this.textures.get(url);
      if (texture) material.map = texture;
      return material;
    });

    return this.materials;
  }

  /**
   * Keep textures resident around `centerPage` (1-based) and evict the rest.
   * Safe to call every frame — it no-ops while the window is already warm.
   */
  ensureWindow(centerPage: number): Promise<void> {
    const total = this.urls.length;
    if (total === 0) return Promise.resolve();

    const center = Math.min(Math.max(centerPage, 1), total);
    this.center = center;
    const low = Math.max(1, center - this.radius);
    const high = Math.min(total, center + this.radius);

    const wanted: string[] = [];
    const wantedSet = new Set<string>();
    for (let page = low; page <= high; page++) {
      const url = this.urls[page - 1];
      if (url && !wantedSet.has(url)) {
        wantedSet.add(url);
        wanted.push(url);
      }
    }

    // Evict pages that fell out of the window.
    for (const [url, texture] of this.textures) {
      if (!wantedSet.has(url)) {
        texture.dispose();
        this.textures.delete(url);
      }
    }

    // Queue anything missing. A URL with no blob (failed download) is marked
    // failed so the wait below can never spin on it.
    for (const url of wanted) {
      if (this.textures.has(url) || this.pending.has(url)) continue;
      if (this.blobs.has(url)) {
        this.queue.push(url);
      } else {
        this.failed.add(url);
      }
    }
    this.pump();

    const key = String(center);
    if (key === this.lastCenterKey && this.satisfied(wantedSet)) {
      return Promise.resolve();
    }
    this.lastCenterKey = key;

    const generation = ++this.generation;
    return this.waitFor(wantedSet, generation);
  }

  private satisfied(wanted: Set<string>): boolean {
    for (const url of wanted) {
      if (!this.textures.has(url) && !this.failed.has(url)) return false;
    }
    return true;
  }

  private waitFor(wanted: Set<string>, generation: number): Promise<void> {
    // Bounded so a blob that never decodes cannot spin the loading screen.
    const deadline = Date.now() + 30_000;

    return new Promise((resolve) => {
      const tick = () => {
        // A newer window supersedes this one — stop polling rather than leak.
        if (
          generation !== this.generation ||
          Date.now() > deadline ||
          this.satisfied(wanted)
        ) {
          resolve();
          return;
        }
        setTimeout(tick, 25);
      };
      tick();
    });
  }

  private pump(): void {
    while (this.inflight < this.concurrency && this.queue.length > 0) {
      const url = this.queue.shift();
      if (!url) continue;
      if (this.textures.has(url) || this.pending.has(url)) continue;

      this.inflight += 1;
      const task = this.load(url).finally(() => {
        this.inflight -= 1;
        this.pump();
      });
      this.pending.set(url, task);
    }
  }

  private async load(url: string): Promise<void> {
    const blob = this.blobs.get(url);
    if (!blob) {
      this.failed.add(url);
      return;
    }

    try {
      const texture = await decodeTexture(blob);

      // The window may have moved on (or the page list changed) while this
      // was decoding — don't keep, or attach, a texture nobody is going to see.
      if (this.disposed || !this.isWanted(url)) {
        texture.dispose();
        return;
      }

      this.textures.set(url, texture);
      this.apply(url, texture);
    } catch {
      // A page that fails to decode simply keeps its blank material; the rest
      // of the book stays usable.
      this.failed.add(url);
    } finally {
      this.pending.delete(url);
    }
  }

  /** Is this URL inside the resident window for the current page list? */
  private isWanted(url: string): boolean {
    if (!this.center) return false;
    const index = this.urls.indexOf(url);
    if (index < 0) return false;
    const low = Math.max(1, this.center - this.radius);
    const high = Math.min(this.urls.length, this.center + this.radius);
    return index + 1 >= low && index + 1 <= high;
  }

  private apply(url: string, texture: THREE.Texture): void {
    const index = this.urls.indexOf(url);
    if (index < 0) return;
    const material = this.materials[index];
    if (!material) return;
    material.map = texture;
    material.needsUpdate = true;
  }

  dispose(): void {
    this.disposed = true;
    this.generation += 1;

    for (const texture of this.textures.values()) texture.dispose();
    this.textures.clear();

    for (const material of this.materials) {
      material.map = null;
      material.dispose();
    }
    this.materials = [];

    this.queue = [];
    this.pending.clear();
    this.failed.clear();
    this.inflight = 0;
  }
}
