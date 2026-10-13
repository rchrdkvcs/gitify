import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { createHeroAnimation } from "~/lib/hero-animation";
import {
  drawHeroGraph,
  type HeroGraphPalette,
  type HeroGraphScene,
} from "~/lib/hero-graph-renderer";
import { HeroGraphWorld } from "~/lib/hero-graph-world";

const RESIZE_DEBOUNCE_MS = 150;
const MAX_DEVICE_PIXEL_RATIO = 2;
const FALLBACK_PALETTE: HeroGraphPalette = {
  line: "#888",
  accent: "#45e7a9",
  bg: "#000",
  text: "#888",
};

function readPalette(root: Element): HeroGraphPalette {
  const styles = getComputedStyle(root);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    line: token("--ui-color-neutral-500", FALLBACK_PALETTE.line),
    accent: token("--ui-primary", FALLBACK_PALETTE.accent),
    bg: token("--ui-bg", FALLBACK_PALETTE.bg),
    text: token("--ui-color-neutral-400", FALLBACK_PALETTE.text),
  };
}

function fitCanvasToBox(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

export function useHeroCommitGraph() {
  const rootRef = useTemplateRef<HTMLDivElement>("root");
  const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scene: HeroGraphScene = {
      world: new HeroGraphWorld(),
      palette: FALLBACK_PALETTE,
      fontFamily: "monospace",
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
    const draw = () => drawHeroGraph(ctx, scene);
    const relayout = () => {
      const box = fitCanvasToBox(canvas, ctx);
      scene.world.layout(box.width, box.height);
    };

    const animation = createHeroAnimation(
      (seconds) => {
        scene.world.advance(seconds);
        draw();
      },
      window,
      scene.reducedMotion,
    );
    animation.setDocumentHidden(document.hidden);

    const visibility = new IntersectionObserver(([entry]) => {
      animation.setVisible(entry?.isIntersecting ?? false);
    });
    const onVisibilityChange = () => animation.setDocumentHidden(document.hidden);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        relayout();
        draw();
      }, RESIZE_DEBOUNCE_MS);
    };

    let disposed = false;
    document.fonts.ready.then(() => {
      if (disposed) return;
      scene.palette = readPalette(root);
      scene.fontFamily = getComputedStyle(canvas).fontFamily;
      relayout();
      scene.world.prerollHistory();
      draw();
      visibility.observe(root);
    });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    cleanup = () => {
      disposed = true;
      animation.dispose();
      if (resizeTimer) clearTimeout(resizeTimer);
      visibility.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  });

  onBeforeUnmount(() => cleanup?.());
}
