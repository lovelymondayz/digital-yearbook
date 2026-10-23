import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, AmbientLight, DirectionalLight, Clock } from "three";
import { FlipBook } from "quick_flipbook";
import { useEffect, useMemo, useRef } from "react";

/** Imperative handle the page uses for its shared Next/Previous buttons. */
export interface FlipBookController {
  next: () => void;
  prev: () => void;
  /** Jump to a 1-based page, honouring the view's own stepping rules. */
  jumpTo: (page: number) => void;
}

interface FlipBookSceneProps {
  pages: string[];
  onPageChange?: (page: number) => void;
  /**
   * Desktop layout: the book is always open, so a 2-page spread is visible
   * at every position instead of collapsing to a lone cover at page 0.
   */
  spread?: boolean;
  controllerRef?: React.MutableRefObject<FlipBookController | null>;
}

function Book({
  pages,
  onPageChange,
  spread = false,
  controllerRef,
}: {
  pages: string[];
  onPageChange?: (page: number) => void;
  spread?: boolean;
  controllerRef?: React.MutableRefObject<FlipBookController | null>;
}) {
  const clock = useMemo(() => new Clock(), []);
  const bookRef = useRef<FlipBook | null>(null);
  const lastPageRef = useRef(-1);
  // Guards the initial "open the book" jump so it runs once instead of on
  // every effect re-run, which would snap the book back to page 2.
  const openedRef = useRef(false);

  const book = useMemo(() => {
    const instance = new FlipBook({
      flipDuration: 0.7,
      yBetweenPages: 0.001,
      pageSubdivisions: 20,
    });
    bookRef.current = instance;
    return instance;
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      // quick_flipbook pads odd-length arrays by pushing "" onto the array it
      // is given. Pass a copy so the caller's page list is never mutated —
      // otherwise the page indicator counts the padding as a real page.
      book.setPages([...pages]);
      if (spread && !openedRef.current) {
        // Open the book to progress 1 so both pages of the spread are visible
        // from the first render. At progress 0 the library shows a lone cover.
        openedRef.current = true;
        book.currentPage = 2;
      }
    }
  }, [book, pages, spread]);

  useEffect(() => {
    const updateBookScale = () => {
      const w = window.innerWidth;
      if (w < 640) {
        book.scale.set(3.5, 4.2, 5);
      } else if (w < 1024) {
        book.scale.set(3.5, 5.4, 5);
      } else {
        book.scale.set(3.5, 6.4, 5);
      }
    };
    updateBookScale();
    window.addEventListener("resize", updateBookScale);
    return () => window.removeEventListener("resize", updateBookScale);
  }, [book]);

  // Sync page changes to parent
  useFrame(() => {
    const delta = clock.getDelta();
    book.animate(delta);

    if (bookRef.current && onPageChange) {
      const currentPage = bookRef.current.currentPage;
      if (currentPage !== lastPageRef.current) {
        lastPageRef.current = currentPage;
        onPageChange(currentPage);
      }
    }
  });

  // Expose next/prev to the shared controls and release the book on unmount.
  useEffect(() => {
    if (controllerRef) {
      controllerRef.current = {
        next: () => bookRef.current?.nextPage(),
        prev: () => {
          const instance = bookRef.current;
          if (!instance) return;
          // In spread mode the book stays open — never collapse back to a
          // single-page cover.
          if (spread && instance.currentPage <= 2) return;
          instance.previousPage();
        },
        jumpTo: (page: number) => {
          const instance = bookRef.current;
          if (!instance) return;
          // A sheet holds two pages, so jump to the spread containing the
          // requested page (even page numbers only).
          const target = page % 2 === 0 ? page : page - 1;
          // Spread mode never collapses to the lone cover at page 0.
          const clamped = spread ? Math.max(2, target) : target;
          if (clamped === instance.currentPage) return;
          instance.currentPage = clamped;
        },
      };
    }
    return () => {
      if (controllerRef) controllerRef.current = null;
      book.dispose();
    };
  }, [book, spread, controllerRef]);

  return <primitive object={book} />;
}

export default function FlipBookScene({
  pages,
  onPageChange,
  spread = false,
  controllerRef,
}: FlipBookSceneProps) {
  if (!pages || pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text/50">
        <p>No pages available for this yearbook.</p>
      </div>
    );
  }

  return (
    <Canvas
      camera={{
        position: [0, 10, 2],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      onCreated={({ scene }) => {
        scene.background = new Color(0xf1f5f9);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <primitive object={new AmbientLight(0xffffff, 2)} />
      <primitive
        object={new DirectionalLight(0xffffff, 3)}
        position={[5, 5, 5]}
      />

      {/* Rotation is disabled so the book can only be flipped, never orbited.
          Zoom stays available on wheel/pinch. */}
      <OrbitControls
        enableDamping
        enableRotate={false}
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={14}
        makeDefault
      />

      <Book
        pages={pages}
        onPageChange={onPageChange}
        spread={spread}
        controllerRef={controllerRef}
      />
    </Canvas>
  );
}
