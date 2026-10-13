export function createHeroAnimation(
  drawFrame: (seconds: number) => void,
  frames: {
    requestAnimationFrame(callback: (now: number) => void): number;
    cancelAnimationFrame(id: number): void;
  },
  reduced: boolean,
) {
  let frame: number | null = null;
  let last: number | null = null;
  let visible = false;
  let hidden = false;
  let disposed = false;

  const loop = (now: number) => {
    frame = null;
    const elapsed = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    drawFrame(elapsed);
    update();
  };

  const update = () => {
    if (disposed || reduced || hidden || !visible) {
      if (frame !== null) frames.cancelAnimationFrame(frame);
      frame = null;
      last = null;
    } else if (frame === null) {
      frame = frames.requestAnimationFrame(loop);
    }
  };

  return {
    setVisible(value: boolean) {
      visible = value;
      update();
    },
    setDocumentHidden(value: boolean) {
      hidden = value;
      update();
    },
    dispose() {
      disposed = true;
      update();
    },
  };
}
