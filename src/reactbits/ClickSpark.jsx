import { useEffect, useRef } from "react";

/** Vendored from reactbits.dev (ClickSpark, MIT). Offline, no deps. */
export default function ClickSpark({
  sparkColor = "#7dff3f",
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 420,
  children
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    let raf;
    const draw = (ts) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((s) => {
        const p = Math.min((ts - s.startTime) / duration, 1);
        if (p >= 1) return false;
        const distance = p * sparkRadius;
        const lineLength = sparkSize * (1 - p);
        const x1 = s.x + distance * Math.cos(s.angle);
        const y1 = s.y + distance * Math.sin(s.angle);
        const x2 = s.x + (distance + lineLength) * Math.cos(s.angle);
        const y2 = s.y + (distance + lineLength) * Math.sin(s.angle);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [duration, sparkColor, sparkRadius, sparkSize]);

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onClick={(e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const now = performance.now();
        const sparks = Array.from({ length: sparkCount }, (_, i) => ({
          x,
          y,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now
        }));
        sparksRef.current.push(...sparks);
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 850 }}
      />
      {children}
    </div>
  );
}
