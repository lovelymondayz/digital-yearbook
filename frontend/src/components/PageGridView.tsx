import { LayoutGrid, X } from "lucide-react";

interface PageGridViewProps {
  pages: string[];
  currentPage: number;
  title: string;
  onSelect: (page: number) => void;
  onClose: () => void;
}

function thumbSrc(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}size=thumbnail`;
}

/**
 * Overview of every page in a responsive grid.
 *
 * Thumbnails use the 250px WebP variant so the whole yearbook loads quickly;
 * selecting one jumps to that page in the flipbook.
 */
export default function PageGridView({
  pages,
  currentPage,
  title,
  onSelect,
  onClose,
}: PageGridViewProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutGrid className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="truncate text-sm font-medium text-text">
            All pages — {title}
          </span>
          <span className="shrink-0 text-xs text-text-subtle">
            {pages.length} pages
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-surface-alt p-2 hover:bg-border transition-colors"
          title="Back to flipbook"
          aria-label="Back to flipbook"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex-1 overflow-y-auto p-4">
        {pages.length === 0 ? (
          <p className="py-16 text-center text-text-muted">
            No pages available for this yearbook.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {pages.map((url, index) => {
              const pageNumber = index + 1;
              const isCurrent = pageNumber === currentPage;
              return (
                <button
                  key={url}
                  onClick={() => onSelect(pageNumber)}
                  className={`group relative overflow-hidden rounded-md border bg-surface text-left transition-all duration-fast hover:border-primary hover:shadow-md ${
                    isCurrent ? "border-primary ring-2 ring-primary-subtle" : "border-border"
                  }`}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <span className="relative block aspect-[5 / 7] w-full bg-surface-alt">
                    <img
                      src={thumbSrc(url)}
                      alt={`Page ${pageNumber}`}
                      loading="lazy"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </span>
                  <span
                    className={`absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      isCurrent
                        ? "bg-primary text-white"
                        : "bg-black/55 text-white group-hover:bg-primary"
                    }`}
                  >
                    {pageNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
