<script setup lang="ts">
// Git commit graph drifting slowly behind the hero content.
//
// The graph lives in "world" coordinates and the camera scrolls right at a
// constant, slow speed, so new history keeps arriving from the right edge.
// Trunk lanes carry regular commits; feature branches fork onto a free
// neighbouring lane, collect a few commits and merge back. A few branches are
// drawn in the accent color with a PR number on their merge commit: those are
// the contributions. Edges and the area under the content are faded with a
// CSS mask. Under reduced motion a single static frame is drawn.

const SPEED = 14; // px per second
const LANE_GAP = 52;
const COMMIT = 7; // commit square size, px
const CURVE = 34; // horizontal length of a fork / merge curve
const CHUNK = 40; // world px generated per step
const ACCENT_RATE = 0.3;
const PULSE_SPEED = 70; // world px per second along a branch
const PULSE_GAP = 220; // pause between two pulses on one branch, in px of travel
const TRUNK_PULSE_SPEED = 45;
const TRAIL = 46; // pulse tail length, px
const FLASH = 70; // distance over which a commit fades back after a pulse

type Branch = {
  lane: number;
  parent: number;
  x0: number;
  x1: number;
  commits: number[];
  accent: boolean;
  phase: number;
  pr: number;
};

const rootRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let cleanup: (() => void) | null = null;

onMounted(() => {
  const root = rootRef.value;
  const canvas = canvasRef.value;
  if (!root || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let lanes: number[] = []; // y of each lane
  let trunks: number[] = []; // lane indexes that always carry a line
  let branches: Branch[] = [];
  let trunkCommits: { lane: number; x: number }[] = [];
  let generatedUntil = 0;
  let offset = 0;
  let time = 0;
  let trunkSeeds: { phase: number; spacing: number }[] = [];
  let prCounter = 100 + Math.floor(Math.random() * 300);
  let fontFamily = "monospace";
  let colors = { line: "#888", accent: "#45e7a9", bg: "#000", text: "#888" };

  const readTokens = () => {
    const styles = getComputedStyle(root);
    fontFamily = getComputedStyle(canvas).fontFamily;
    colors = {
      line: styles.getPropertyValue("--ui-color-neutral-500").trim() || colors.line,
      accent: styles.getPropertyValue("--ui-primary").trim() || colors.accent,
      bg: styles.getPropertyValue("--ui-bg").trim() || colors.bg,
      text: styles.getPropertyValue("--ui-color-neutral-400").trim() || colors.text,
    };
  };

  const laneBusy = (lane: number, from: number, to: number) =>
    branches.some((b) => b.lane === lane && b.x1 + CURVE > from && b.x0 - CURVE < to);

  // Extend the world to the right until it covers the visible area.
  const generate = (until: number) => {
    while (generatedUntil < until) {
      const x = generatedUntil;
      for (const lane of trunks) {
        if (Math.random() < 0.28) trunkCommits.push({ lane, x: x + Math.random() * CHUNK });
      }

      if (Math.random() < 0.22) {
        const parent = trunks[Math.floor(Math.random() * trunks.length)]!;
        const candidates = [parent - 1, parent + 1].filter(
          (lane) => lane >= 0 && lane < lanes.length && !trunks.includes(lane),
        );
        const lane = candidates[Math.floor(Math.random() * candidates.length)];
        const length = 160 + Math.random() * 260;
        if (lane !== undefined && !laneBusy(lane, x, x + length)) {
          const count = 1 + Math.floor(Math.random() * 3);
          const commits = Array.from(
            { length: count },
            (_, i) => x + CURVE + 16 + ((length - 2 * CURVE - 32) * (i + 0.5)) / count,
          );
          const accent = Math.random() < ACCENT_RATE;
          branches.push({
            lane,
            parent,
            x0: x,
            x1: x + length,
            commits,
            accent,
            pr: accent ? ++prCounter : 0,
            phase: Math.random() * 1000,
          });
        }
      }
      generatedUntil += CHUNK;
    }

    // Forget history that scrolled out on the left.
    const forget = offset - 200;
    branches = branches.filter((b) => b.x1 > forget);
    trunkCommits = trunkCommits.filter((c) => c.x > forget);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(4, Math.floor(height / LANE_GAP));
    const top = (height - (count - 1) * LANE_GAP) / 2;
    lanes = Array.from({ length: count }, (_, i) => Math.round(top + i * LANE_GAP) + 0.5);
    trunks = lanes.map((_, i) => i).filter((i) => i % 3 === 1);
    trunkSeeds = trunks.map(() => ({
      phase: Math.random() * 1000,
      spacing: 520 + Math.random() * 380,
    }));

    branches = [];
    trunkCommits = [];
    generatedUntil = offset - 400;
    generate(offset + width + 200);
  };

  const square = (x: number, y: number, filled: boolean, color: string) => {
    const half = COMMIT / 2;
    ctx.fillStyle = filled ? color : colors.bg;
    ctx.fillRect(x - half, y - half, COMMIT, COMMIT);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - half, y - half, COMMIT, COMMIT);
  };

  // y of a branch at world x: smoothstep through the fork and merge curves,
  // close enough to the drawn beziers for a pulse to sit on the line.
  const branchY = (b: Branch, x: number) => {
    const yp = lanes[b.parent]!;
    const yl = lanes[b.lane]!;
    const ease = (t: number) => {
      const c = Math.min(1, Math.max(0, t));
      return c * c * (3 - 2 * c);
    };
    if (x < b.x0 + CURVE) return yp + (yl - yp) * ease((x - b.x0) / CURVE);
    if (x > b.x1 - CURVE) return yl + (yp - yl) * ease((x - (b.x1 - CURVE)) / CURVE);
    return yl;
  };

  // Distance the current pulse has travelled since the fork; it may be past
  // the merge while the branch waits for its next pulse.
  const branchTravel = (b: Branch) => (time * PULSE_SPEED + b.phase) % (b.x1 - b.x0 + PULSE_GAP);

  // Head position of the pulse currently running on a branch, or null.
  const branchPulse = (b: Branch) => {
    const travel = branchTravel(b);
    return travel <= b.x1 - b.x0 ? b.x0 + travel : null;
  };

  // How lit a commit is: 1 right after a pulse passes, back to 0 after FLASH px.
  const flashAt = (pulse: number | null, x: number) => {
    if (pulse === null || pulse < x) return 0;
    return Math.max(0, 1 - (pulse - x) / FLASH);
  };

  // A pulse is a bright head with a fading tail that follows the path.
  const drawPulse = (head: number, yAt: (x: number) => number, color: string, alpha: number) => {
    const steps = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < steps; i++) {
      const xa = head - TRAIL + (TRAIL * i) / steps;
      const xb = head - TRAIL + (TRAIL * (i + 1)) / steps;
      ctx.globalAlpha = alpha * ((i + 1) / steps) ** 2;
      ctx.beginPath();
      ctx.moveTo(xa - offset, yAt(xa));
      ctx.lineTo(xb - offset, yAt(xb));
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(head - offset - 2, yAt(head) - 2, 4, 4);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const sx = (wx: number) => wx - offset;

    // Trunk lines span the whole width.
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    for (const lane of trunks) {
      ctx.beginPath();
      ctx.moveTo(0, lanes[lane]!);
      ctx.lineTo(width, lanes[lane]!);
      ctx.stroke();
    }

    // Branch paths: fork curve, straight run, merge curve.
    for (const b of branches) {
      const yp = lanes[b.parent]!;
      const yl = lanes[b.lane]!;
      const a = sx(b.x0);
      const z = sx(b.x1);
      if (z < -CURVE || a > width + CURVE) continue;
      ctx.globalAlpha = b.accent ? 0.75 : 0.3;
      ctx.strokeStyle = b.accent ? colors.accent : colors.line;
      ctx.beginPath();
      ctx.moveTo(a, yp);
      ctx.bezierCurveTo(a + CURVE / 2, yp, a + CURVE / 2, yl, a + CURVE, yl);
      ctx.lineTo(z - CURVE, yl);
      ctx.bezierCurveTo(z - CURVE / 2, yl, z - CURVE / 2, yp, z, yp);
      ctx.stroke();
    }

    // Pulses travelling along the lines, under the commits.
    if (!reduced) {
      trunks.forEach((lane, i) => {
        const seed = trunkSeeds[i]!;
        const y = lanes[lane]!;
        const shift = (time * TRUNK_PULSE_SPEED + seed.phase) % seed.spacing;
        const first = Math.floor((offset - TRAIL) / seed.spacing) * seed.spacing;
        for (let x = first + shift; x < offset + width + TRAIL; x += seed.spacing) {
          drawPulse(x, () => y, colors.line, 0.55);
        }
      });
      for (const b of branches) {
        const head = branchPulse(b);
        if (head === null || head - offset < -TRAIL || head - offset > width + TRAIL) continue;
        drawPulse(
          head,
          (x) => branchY(b, x),
          b.accent ? colors.accent : colors.line,
          b.accent ? 1 : 0.6,
        );
      }
    }

    // Commits on top of the lines.
    ctx.globalAlpha = 0.45;
    for (const c of trunkCommits) {
      const x = sx(c.x);
      if (x > -COMMIT && x < width + COMMIT) square(x, lanes[c.lane]!, false, colors.line);
    }

    ctx.font = `10px ${fontFamily}`;
    ctx.textBaseline = "bottom";
    for (const b of branches) {
      const color = b.accent ? colors.accent : colors.line;
      ctx.globalAlpha = b.accent ? 0.9 : 0.45;
      for (const cx of b.commits) {
        const x = sx(cx);
        if (x < -COMMIT || x > width + COMMIT) continue;
        square(x, lanes[b.lane]!, false, color);
        // Light the commit up as the pulse runs through it.
        const flash = flashAt(branchPulse(b), cx);
        if (flash > 0) {
          const alpha = ctx.globalAlpha;
          ctx.globalAlpha = alpha * flash;
          ctx.fillStyle = color;
          ctx.fillRect(x - COMMIT / 2, lanes[b.lane]! - COMMIT / 2, COMMIT, COMMIT);
          ctx.globalAlpha = alpha;
        }
      }
      const mx = sx(b.x1);
      if (mx > -COMMIT && mx < width + 80) {
        square(mx, lanes[b.parent]!, b.accent, color);
        // The merge commit lights up when the pulse lands on main.
        const landed = branchTravel(b) - (b.x1 - b.x0);
        const flash = landed >= 0 && !reduced ? Math.max(0, 1 - landed / FLASH) : 0;
        if (flash > 0) {
          const alpha = ctx.globalAlpha;
          ctx.globalAlpha = flash;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          const ring = COMMIT / 2 + 2 + (1 - flash) * 5;
          ctx.strokeRect(mx - ring, lanes[b.parent]! - ring, ring * 2, ring * 2);
          ctx.globalAlpha = alpha;
        }
        if (b.accent) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = colors.text;
          const above = b.lane < b.parent;
          ctx.fillText(`#${b.pr}`, mx + 8, lanes[b.parent]! + (above ? 16 : -6));
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  let raf = 0;
  let last = 0;
  let running = false;

  const loop = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    offset += SPEED * dt;
    time += dt;
    generate(offset + width + 200);
    draw();
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reduced || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Only animate while the hero is on screen.
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) start();
    else stop();
  });

  const onVisibilityChange = () => {
    if (document.hidden) stop();
    else start();
  };

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      resize();
      draw();
    }, 150);
  };

  let disposed = false;
  document.fonts.ready.then(() => {
    if (disposed) return;
    readTokens();
    resize();
    // Pre-roll so the first frame already shows a full history.
    offset += width * 0.5;
    generate(offset + width + 200);
    draw();
    visibility.observe(root);
  });

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);

  cleanup = () => {
    disposed = true;
    stop();
    if (resizeTimer) clearTimeout(resizeTimer);
    visibility.disconnect();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <div ref="rootRef" class="relative isolate overflow-hidden">
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="hero-graph pointer-events-none absolute inset-0 block size-full font-mono"
    />
    <div class="relative flex min-h-[inherit] items-center justify-center px-4 py-24 sm:px-8">
      <div class="flex max-w-3xl flex-col items-center text-center">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fade the graph out at both edges and under the centered content. */
.hero-graph {
  mask-image:
    linear-gradient(to right, transparent, black 14%, black 86%, transparent),
    radial-gradient(ellipse 42% 46% at 50% 50%, rgb(0 0 0 / 0.08) 35%, black 100%);
  mask-composite: intersect;
}
</style>
