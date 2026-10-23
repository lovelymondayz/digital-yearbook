import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, AmbientLight, DirectionalLight, Clock } from "three";
import { FlipBook } from "quick_flipbook";
import { useEffect, useMemo, useRef } from "react";

interface FlipBookSceneProps {
  pages: string[];
  onPageChange?: (page: number) => void;
  fullscreen?: boolean;
  controlsVisible?: boolean;
  /**
   * Desktop layout: the book is always open, so a 2-page spread is visible
   * at every position instead of collapsing to a lone cover at page 0.
   */
  spread?: boolean;
}

function Book({
  pages,
  onPageChange,
  spread = false,
}: {
  pages: string[];
  onPageChange?: (page: number) => void;
  spread?: boolean;
}) {
  const clock = useMemo(() => new Clock(), []);
  const bookRef = useRef<FlipBook | null>(null);
  const lastPageRef = useRef(-1);

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
      book.setPages(pages);
      if (spread) {
        // Open the book to progress 1 so both pages of the spread are visible
        // from the first render. At progress 0 the library shows a lone cover.
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

  useEffect(() => {
    const nextPage = () => bookRef.current?.nextPage();
    const prevPage = () => {
      const book = bookRef.current;
      if (!book) return;
      // In spread mode the book stays open — never collapse back to a
      // single-page cover.
      if (spread && book.currentPage <= 2) return;
      book.previousPage();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };

    const nextBtn = document.querySelector<HTMLButtonElement>(".next-btn");
    const prevBtn = document.querySelector<HTMLButtonElement>(".prev-btn");

    nextBtn?.addEventListener("click", nextPage);
    prevBtn?.addEventListener("click", prevPage);
    window.addEventListener("keydown", handleKey);

    return () => {
      nextBtn?.removeEventListener("click", nextPage);
      prevBtn?.removeEventListener("click", prevPage);
      window.removeEventListener("keydown", handleKey);
      book.dispose();
    };
  }, [book, spread]);

  return <primitive object={book} />;
}

export default function FlipBookScene({
  pages,
  onPageChange,
  fullscreen = false,
  controlsVisible = true,
  spread = false,
}: FlipBookSceneProps) {
  if (!pages || pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text/50">
        <p>No pages available for this yearbook.</p>
      </div>
    );
  }

  return (
    <>
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

        <OrbitControls
          enableDamping
          enableRotate={false}
          enablePan={false}
          enableZoom
          minDistance={4}
          maxDistance={16}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 3}
          makeDefault
        />

        <Book pages={pages} onPageChange={onPageChange} spread={spread} />
      </Canvas>

      <button
        className={`prev-btn fixed bottom-6 left-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 ${
          fullscreen && !controlsVisible
            ? "opacity-0 pointer-events-none translate-y-2"
            : "opacity-100"
        }`}
      >
        Previous
      </button>
      <button
        className={`next-btn fixed bottom-6 right-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 ${
          fullscreen && !controlsVisible
            ? "opacity-0 pointer-events-none translate-y-2"
            : "opacity-100"
        }`}
      >
        Next
      </button>
    </>
  );
}
