export const COMMIT_SIZE = 7;
export const CURVE_LENGTH = 34;
export const PULSE_TRAIL_LENGTH = 46;
export const TRUNK_PULSE_SPEED = 45;

const SCROLL_SPEED_PX_PER_SECOND = 14;
const LANE_GAP = 52;
const MIN_LANE_COUNT = 4;
const TRUNK_LANE_PERIOD = 3;
const GENERATION_CHUNK = 40;
const GENERATION_LOOKAHEAD = 200;
const FORGOTTEN_HISTORY_MARGIN = 200;
const LAYOUT_HISTORY_BACKFILL = 400;
const PREROLL_SCREEN_SHARE = 0.5;
const TRUNK_COMMIT_RATE = 0.28;
const BRANCH_FORK_RATE = 0.22;
const ACCENT_BRANCH_RATE = 0.3;
const BRANCH_PULSE_SPEED = 70;
const PAUSE_BETWEEN_PULSES = 220;
const FLASH_FADE_DISTANCE = 70;

export type Branch = {
  lane: number;
  parent: number;
  x0: number;
  x1: number;
  commits: number[];
  accent: boolean;
  phase: number;
  pr: number;
};

export type TrunkCommit = { lane: number; x: number };

export type TrunkPulseSeed = { phase: number; spacing: number };

const smoothstep = (t: number) => {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
};

const fadeAfter = (distance: number) => Math.max(0, 1 - distance / FLASH_FADE_DISTANCE);

export class HeroGraphWorld {
  width = 0;
  height = 0;
  lanes: number[] = [];
  trunkLanes: number[] = [];
  trunkPulseSeeds: TrunkPulseSeed[] = [];
  branches: Branch[] = [];
  trunkCommits: TrunkCommit[] = [];
  cameraOffset = 0;
  elapsedSeconds = 0;
  #generatedUntil = 0;
  #pullRequestCounter: number;
  readonly #random: () => number;

  constructor(random: () => number = Math.random) {
    this.#random = random;
    this.#pullRequestCounter = 100 + Math.floor(random() * 300);
  }

  layout(width: number, height: number) {
    this.width = width;
    this.height = height;
    const count = Math.max(MIN_LANE_COUNT, Math.floor(height / LANE_GAP));
    const top = (height - (count - 1) * LANE_GAP) / 2;
    this.lanes = Array.from({ length: count }, (_, i) => Math.round(top + i * LANE_GAP) + 0.5);
    this.trunkLanes = this.lanes.map((_, i) => i).filter((i) => i % TRUNK_LANE_PERIOD === 1);
    this.trunkPulseSeeds = this.trunkLanes.map(() => ({
      phase: this.#random() * 1000,
      spacing: 520 + this.#random() * 380,
    }));
    this.branches = [];
    this.trunkCommits = [];
    this.#generatedUntil = this.cameraOffset - LAYOUT_HISTORY_BACKFILL;
    this.#fillVisibleArea();
  }

  advance(seconds: number) {
    this.cameraOffset += SCROLL_SPEED_PX_PER_SECOND * seconds;
    this.elapsedSeconds += seconds;
    this.#fillVisibleArea();
  }

  prerollHistory() {
    this.cameraOffset += this.width * PREROLL_SCREEN_SHARE;
    this.#fillVisibleArea();
  }

  toScreenX(worldX: number) {
    return worldX - this.cameraOffset;
  }

  branchY(branch: Branch, x: number) {
    const parentY = this.lanes[branch.parent]!;
    const laneY = this.lanes[branch.lane]!;
    if (x < branch.x0 + CURVE_LENGTH) {
      return parentY + (laneY - parentY) * smoothstep((x - branch.x0) / CURVE_LENGTH);
    }
    if (x > branch.x1 - CURVE_LENGTH) {
      return (
        laneY + (parentY - laneY) * smoothstep((x - (branch.x1 - CURVE_LENGTH)) / CURVE_LENGTH)
      );
    }
    return laneY;
  }

  branchPulseHead(branch: Branch) {
    const travel = this.#branchPulseTravel(branch);
    return travel <= branch.x1 - branch.x0 ? branch.x0 + travel : null;
  }

  commitFlash(branch: Branch, commitX: number) {
    const head = this.branchPulseHead(branch);
    if (head === null || head < commitX) return 0;
    return fadeAfter(head - commitX);
  }

  mergeFlash(branch: Branch) {
    const sinceLanding = this.#branchPulseTravel(branch) - (branch.x1 - branch.x0);
    return sinceLanding >= 0 ? fadeAfter(sinceLanding) : 0;
  }

  #branchPulseTravel(branch: Branch) {
    const cycle = branch.x1 - branch.x0 + PAUSE_BETWEEN_PULSES;
    return (this.elapsedSeconds * BRANCH_PULSE_SPEED + branch.phase) % cycle;
  }

  #fillVisibleArea() {
    this.#generateUntil(this.cameraOffset + this.width + GENERATION_LOOKAHEAD);
  }

  #generateUntil(until: number) {
    while (this.#generatedUntil < until) {
      const x = this.#generatedUntil;
      for (const lane of this.trunkLanes) {
        if (this.#random() < TRUNK_COMMIT_RATE) {
          this.trunkCommits.push({ lane, x: x + this.#random() * GENERATION_CHUNK });
        }
      }
      if (this.#random() < BRANCH_FORK_RATE) this.#tryForkBranch(x);
      this.#generatedUntil += GENERATION_CHUNK;
    }
    const forgottenBefore = this.cameraOffset - FORGOTTEN_HISTORY_MARGIN;
    this.branches = this.branches.filter((b) => b.x1 > forgottenBefore);
    this.trunkCommits = this.trunkCommits.filter((c) => c.x > forgottenBefore);
  }

  #tryForkBranch(x: number) {
    const trunks = this.trunkLanes;
    const parent = trunks[Math.floor(this.#random() * trunks.length)]!;
    const candidates = [parent - 1, parent + 1].filter(
      (lane) => lane >= 0 && lane < this.lanes.length && !trunks.includes(lane),
    );
    const lane = candidates[Math.floor(this.#random() * candidates.length)];
    const length = 160 + this.#random() * 260;
    if (lane === undefined || this.#laneBusy(lane, x, x + length)) return;
    const count = 1 + Math.floor(this.#random() * 3);
    const commits = Array.from(
      { length: count },
      (_, i) => x + CURVE_LENGTH + 16 + ((length - 2 * CURVE_LENGTH - 32) * (i + 0.5)) / count,
    );
    const accent = this.#random() < ACCENT_BRANCH_RATE;
    this.branches.push({
      lane,
      parent,
      x0: x,
      x1: x + length,
      commits,
      accent,
      pr: accent ? ++this.#pullRequestCounter : 0,
      phase: this.#random() * 1000,
    });
  }

  #laneBusy(lane: number, from: number, to: number) {
    return this.branches.some(
      (b) => b.lane === lane && b.x1 + CURVE_LENGTH > from && b.x0 - CURVE_LENGTH < to,
    );
  }
}
