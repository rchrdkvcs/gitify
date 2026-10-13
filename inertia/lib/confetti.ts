/**
 * One short confetti burst on a canvas covering its parent. Square pieces, like every other
 * shape in the product. Call only from the browser (`onMounted`); returns a cancel function.
 */
export function confettiBurst(
  canvas: HTMLCanvasElement,
  {
    colors,
    count = 90,
    spread = 70,
    origin = { x: 0.5, y: 0.6 },
    durationMs = 2600,
  }: {
    colors: string[];
    count?: number;
    /** Opening angle of the cone, in degrees, centred on straight up. */
    spread?: number;
    /** Launch point as a fraction of the canvas size. */
    origin?: { x: number; y: number };
    durationMs?: number;
  },
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pieces = Array.from({ length: count }, () => {
    const angle = ((-90 + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = 7 + Math.random() * 7;
    return {
      x: origin.x * width,
      y: origin.y * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 4,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    };
  });

  let frame = 0;
  let start: number | null = null;
  const tick = (now: number) => {
    start ??= now;
    const progress = (now - start) / durationMs;
    ctx.clearRect(0, 0, width, height);
    if (progress >= 1) return;
    ctx.globalAlpha = Math.min(1, (1 - progress) * 2.5);
    for (const piece of pieces) {
      piece.vx *= 0.97;
      piece.vy = piece.vy * 0.97 + 0.32;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = piece.color;
      // Flattening on one axis reads as a piece tumbling in 3D.
      ctx.fillRect(
        -piece.size / 2,
        -piece.size / 2,
        piece.size,
        piece.size * Math.abs(Math.cos(piece.rotation * 2)),
      );
      ctx.restore();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, width, height);
  };
}
