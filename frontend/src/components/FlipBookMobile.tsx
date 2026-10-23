import { useEffect, useRef, useState } from "react";
import { playPageFlip } from "../lib/sound";
import type { FlipBookController } from "./FlipBookScene";

interface FlipBookMobileProps {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  controllerRef?: React.MutableRefObject<FlipBookController | null>;
}

/**
 * Single-page view used below the desktop breakpoint.
 *
 * quick_flipbook turns one sheet = two pages per flip and cannot advance by a
 * single page, so cropping the 3D camera to one page would hide half the book.
 * This view advances one page at a time so every page stays reachable, while
 * reusing the same page data, controls, indicator and page-turn sound.
 */
export default function FlipBookMobile({
  pages,
  currentPage,
  onPageChange,
  controllerRef,
}: FlipBookMobileProps) {
  const [shownPage, setShownPage] = useState(currentPage);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const lastPageRef = useRef(currentPage);

  useEffect(() => {
    if (currentPage === lastPageRef.current) return;
    setDirection(currentPage > lastPageRef.current ? "next" : "prev");
    lastPageRef.current = currentPage;
    setShownPage(currentPage);
    playPageFlip(0.3);
  }, [currentPage]);

  useEffect(() => {
    if (!controllerRef) return;
    controllerRef.current = {
      next: () => onPageChange(Math.min(shownPage + 1, pages.length)),
      prev: () => onPageChange(Math.max(shownPage - 1, 1)),
    };
    return () => {
      if (controllerRef) controllerRef.current = null;
    };
  }, [controllerRef, shownPage, pages.length, onPageChange]);

  if (!pages || pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text/50">
        <p>No pages available for this yearbook.</p>
      </div>
    );
  }

  const index = Math.min(Math.max(shownPage - 1, 0), pages.length - 1);

  return (
    <div className="page-flip absolute inset-0 flex items-center justify-center px-4 pb-28 pt-32">
      <img
        key={shownPage}
        src={pages[index]}
        alt={`Page ${shownPage}`}
        draggable={false}
        className={`max-h-full max-w-full rounded-sm bg-surface object-contain shadow-md ${
          direction === "next" ? "page-flip-enter" : "page-flip-enter-prev"
        }`}
      />
    </div>
  );
}
