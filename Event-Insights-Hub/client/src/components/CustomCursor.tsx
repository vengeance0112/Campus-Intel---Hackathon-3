import { useEffect, useRef } from "react";

/**
 * CustomCursor - glowing dot + soft ring follower
 * Matches the CampusIntel neon blue/cyan theme.
 * Add <CustomCursor /> once at the top of your app.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    const animate = () => {
      posX += (mouseX - posX) * 0.12;
      posY += (mouseY - posY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${posX}px, ${posY}px)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Sharp neon dot - snaps instantly to cursor */}
      <div
        ref={dotRef}
        className="cursor-dot"
      />
      {/* Soft ring - follows with spring lag */}
      <div
        ref={ringRef}
        className="cursor-ring"
      />
    </>
  );
}
