import {
  COMMIT_SIZE,
  CURVE_LENGTH,
  PULSE_TRAIL_LENGTH,
  TRUNK_PULSE_SPEED,
  type Branch,
  type HeroGraphWorld,
} from "~/lib/hero-graph-world";

export type HeroGraphPalette = { line: string; accent: string; bg: string; text: string };

export type HeroGraphScene = {
  world: HeroGraphWorld;
  palette: HeroGraphPalette;
  fontFamily: string;
  reducedMotion: boolean;
};

const PULSE_TRAIL_STEPS = 10;
const MERGE_LABEL_VISIBLE_MARGIN = 80;

export function drawHeroGraph(ctx: CanvasRenderingContext2D, scene: HeroGraphScene) {
  const { world } = scene;
  ctx.clearRect(0, 0, world.width, world.height);
  drawTrunkLines(ctx, scene);
  drawBranchPaths(ctx, scene);
  if (!scene.reducedMotion) drawPulses(ctx, scene);
  drawTrunkCommits(ctx, scene);
  drawBranchCommits(ctx, scene);
  ctx.globalAlpha = 1;
}

function drawCommitSquare(
  ctx: CanvasRenderingContext2D,
  scene: HeroGraphScene,
  x: number,
  y: number,
  filled: boolean,
  color: string,
) {
  const half = COMMIT_SIZE / 2;
  ctx.fillStyle = filled ? color : scene.palette.bg;
  ctx.fillRect(x - half, y - half, COMMIT_SIZE, COMMIT_SIZE);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - half, y - half, COMMIT_SIZE, COMMIT_SIZE);
}

function drawTrunkLines(ctx: CanvasRenderingContext2D, { world, palette }: HeroGraphScene) {
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1.5;
  for (const lane of world.trunkLanes) {
    ctx.beginPath();
    ctx.moveTo(0, world.lanes[lane]!);
    ctx.lineTo(world.width, world.lanes[lane]!);
    ctx.stroke();
  }
}

function drawBranchPaths(ctx: CanvasRenderingContext2D, { world, palette }: HeroGraphScene) {
  for (const b of world.branches) {
    const parentY = world.lanes[b.parent]!;
    const laneY = world.lanes[b.lane]!;
    const start = world.toScreenX(b.x0);
    const end = world.toScreenX(b.x1);
    if (end < -CURVE_LENGTH || start > world.width + CURVE_LENGTH) continue;
    const handle = CURVE_LENGTH / 2;
    ctx.globalAlpha = b.accent ? 0.75 : 0.3;
    ctx.strokeStyle = b.accent ? palette.accent : palette.line;
    ctx.beginPath();
    ctx.moveTo(start, parentY);
    ctx.bezierCurveTo(start + handle, parentY, start + handle, laneY, start + CURVE_LENGTH, laneY);
    ctx.lineTo(end - CURVE_LENGTH, laneY);
    ctx.bezierCurveTo(end - handle, laneY, end - handle, parentY, end, parentY);
    ctx.stroke();
  }
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  world: HeroGraphWorld,
  head: number,
  yAt: (x: number) => number,
  color: string,
  alpha: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let i = 0; i < PULSE_TRAIL_STEPS; i++) {
    const from = head - PULSE_TRAIL_LENGTH + (PULSE_TRAIL_LENGTH * i) / PULSE_TRAIL_STEPS;
    const to = head - PULSE_TRAIL_LENGTH + (PULSE_TRAIL_LENGTH * (i + 1)) / PULSE_TRAIL_STEPS;
    ctx.globalAlpha = alpha * ((i + 1) / PULSE_TRAIL_STEPS) ** 2;
    ctx.beginPath();
    ctx.moveTo(world.toScreenX(from), yAt(from));
    ctx.lineTo(world.toScreenX(to), yAt(to));
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(world.toScreenX(head) - 2, yAt(head) - 2, 4, 4);
}

function drawPulses(ctx: CanvasRenderingContext2D, { world, palette }: HeroGraphScene) {
  world.trunkLanes.forEach((lane, i) => {
    const seed = world.trunkPulseSeeds[i]!;
    const y = world.lanes[lane]!;
    const shift = (world.elapsedSeconds * TRUNK_PULSE_SPEED + seed.phase) % seed.spacing;
    const first =
      Math.floor((world.cameraOffset - PULSE_TRAIL_LENGTH) / seed.spacing) * seed.spacing;
    const last = world.cameraOffset + world.width + PULSE_TRAIL_LENGTH;
    for (let x = first + shift; x < last; x += seed.spacing) {
      drawPulse(ctx, world, x, () => y, palette.line, 0.55);
    }
  });
  for (const b of world.branches) {
    const head = world.branchPulseHead(b);
    if (head === null) continue;
    const screenHead = world.toScreenX(head);
    if (screenHead < -PULSE_TRAIL_LENGTH || screenHead > world.width + PULSE_TRAIL_LENGTH) continue;
    const color = b.accent ? palette.accent : palette.line;
    drawPulse(ctx, world, head, (x) => world.branchY(b, x), color, b.accent ? 1 : 0.6);
  }
}

function drawTrunkCommits(ctx: CanvasRenderingContext2D, scene: HeroGraphScene) {
  const { world, palette } = scene;
  ctx.globalAlpha = 0.45;
  for (const c of world.trunkCommits) {
    const x = world.toScreenX(c.x);
    if (x > -COMMIT_SIZE && x < world.width + COMMIT_SIZE) {
      drawCommitSquare(ctx, scene, x, world.lanes[c.lane]!, false, palette.line);
    }
  }
}

function drawBranchCommits(ctx: CanvasRenderingContext2D, scene: HeroGraphScene) {
  const { world, palette } = scene;
  ctx.font = `10px ${scene.fontFamily}`;
  ctx.textBaseline = "bottom";
  for (const b of world.branches) {
    const color = b.accent ? palette.accent : palette.line;
    ctx.globalAlpha = b.accent ? 0.9 : 0.45;
    for (const commitX of b.commits) {
      const x = world.toScreenX(commitX);
      if (x < -COMMIT_SIZE || x > world.width + COMMIT_SIZE) continue;
      drawCommitSquare(ctx, scene, x, world.lanes[b.lane]!, false, color);
      lightUpCommit(ctx, x, world.lanes[b.lane]!, color, world.commitFlash(b, commitX));
    }
    const mergeX = world.toScreenX(b.x1);
    if (mergeX > -COMMIT_SIZE && mergeX < world.width + MERGE_LABEL_VISIBLE_MARGIN) {
      drawMergeCommit(ctx, scene, b, mergeX, color);
    }
  }
}

function lightUpCommit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  flash: number,
) {
  if (flash <= 0) return;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * flash;
  ctx.fillStyle = color;
  ctx.fillRect(x - COMMIT_SIZE / 2, y - COMMIT_SIZE / 2, COMMIT_SIZE, COMMIT_SIZE);
  ctx.globalAlpha = alpha;
}

function drawMergeCommit(
  ctx: CanvasRenderingContext2D,
  scene: HeroGraphScene,
  b: Branch,
  x: number,
  color: string,
) {
  const y = scene.world.lanes[b.parent]!;
  drawCommitSquare(ctx, scene, x, y, b.accent, color);
  const flash = scene.reducedMotion ? 0 : scene.world.mergeFlash(b);
  if (flash > 0) {
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = flash;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const ring = COMMIT_SIZE / 2 + 2 + (1 - flash) * 5;
    ctx.strokeRect(x - ring, y - ring, ring * 2, ring * 2);
    ctx.globalAlpha = alpha;
  }
  if (b.accent) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = scene.palette.text;
    const branchAboveParent = b.lane < b.parent;
    ctx.fillText(`#${b.pr}`, x + 8, y + (branchAboveParent ? 16 : -6));
  }
}
