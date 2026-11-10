interface YearbookLoaderProps {
  title: string;
  loaded: number;
  total: number;
}

/**
 * Full-screen gate shown while the yearbook's page images download.
 *
 * Without this the 3D book mounted as soon as the API responded and every page
 * turned to before its texture arrived rendered as a blank sheet.
 */
export default function YearbookLoader({
  title,
  loaded,
  total,
}: YearbookLoaderProps) {
  const determinate = total > 0;
  const percent = determinate ? Math.round((loaded / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <img
        src="/thamrin-logo.png"
        alt=""
        className="h-10 w-auto object-contain"
      />

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
        Thamrin Digital Yearbook
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text">{title}</h1>

      <div className="mt-8 w-full max-w-xs">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? percent : undefined}
          aria-label={determinate ? `Loading ${total} pages` : "Loading"}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: determinate ? `${percent}%` : "100%" }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
          <span>{determinate ? "Loading pages…" : "Fetching yearbook…"}</span>
          <span className="tabular-nums">
            {determinate ? `${loaded} / ${total}` : ""}
          </span>
        </div>
      </div>

      <p className="mt-6 max-w-xs text-xs text-text-subtle">
        {determinate
          ? "First visit fetches every page. Returning visits load from cache."
          : "Contacting the server…"}
      </p>
    </div>
  );
}
