import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, AmbientLight, DirectionalLight, Clock } from "three";
import { FlipBook } from "quick_flipbook";
import { useEffect, useMemo, useRef } from "react";

interface FlipBookSceneProps {
  pages: string[];
}

function Book({ pages }: { pages: string[] }) {
  const clock = useMemo(() => new Clock(), []);
  const bookRef = useRef<FlipBook | null>(null);

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
    }
  }, [book, pages]);

  useEffect(() => {
    const updateBookScale = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        book.scale.set(0.55, 1.4, 1);
      } else {
        book.scale.set(0.9, 2, 1);
      }
    };
    updateBookScale();
    window.addEventListener("resize", updateBookScale);
    return () => window.removeEventListener("resize", updateBookScale);
  }, [book]);

  useFrame(() => {
    const delta = clock.getDelta();
    book.animate(delta);
  });

  useEffect(() => {
    const nextPage = () => bookRef.current?.nextPage();
    const prevPage = () => bookRef.current?.previousPage();

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
  }, []);

  return <primitive object={book} />;
}

export default function FlipBookScene({ pages }: FlipBookSceneProps) {
  if (!pages || pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white/50">
        <p>No pages available for this yearbook.</p>
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{
          position: [0, 1.2, 4.5],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
        onCreated={({ scene }) => {
          scene.background = new Color(0x0f172a);
        }}
      >
        <primitive object={new AmbientLight(0xffffff, 2)} />
        <primitive
          object={new DirectionalLight(0xffffff, 3)}
          position={[5, 5, 5]}
        />

        <OrbitControls
          enableDamping
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
        />

        <Book pages={pages} />
      </Canvas>

      <button
        className="prev-btn fixed bottom-6 left-5 z-20 rounded-full bg-white/10 px-5 py-2.5 text-sm backdrop-blur-xl hover:bg-white/20 transition-colors"
      >
        Previous
      </button>

      <button
        className="next-btn fixed bottom-6 right-5 z-20 rounded-full bg-white/10 px-5 py-2.5 text-sm backdrop-blur-xl hover:bg-white/20 transition-colors"
      >
        Next
      </button>
    </>
  );
}
