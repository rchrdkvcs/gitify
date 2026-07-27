import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ArchiveHoverInfo, ArchiveSceneHandle, ArchiveSceneProject } from "~/types/archive";

export type { ArchiveHoverInfo, ArchiveSceneHandle, ArchiveSceneProject };

export interface ArchiveSceneOptions {
  canvas: HTMLCanvasElement;
  projects: ArchiveSceneProject[];
  onHover: (info: ArchiveHoverInfo | null) => void;
  onSelect: (project: ArchiveSceneProject) => void;
}

/**
 * NOTE: avoid per-frame mesh raycasts against the full backrooms GLB —
 * that freezes / crashes the tab. Walking uses a fixed ground plane (y=0
 * after normalize) + AABB colliders. Interior cabinet placement uses a
 * small, hard-capped number of probes at load time only.
 */

/** Camera height above the floor — deliberately low vs real-world eye height. */
const EYE_HEIGHT = 0.72;
const MOVE_SPEED = 2.25;
const LOOK_SENSITIVITY = 0.002;
const PLAYER_RADIUS = 0.34;
const MAX_PITCH = Math.PI / 2 - 0.18;
/** Full GLB bbox height → human-scale ceiling. */
const ROOM_TARGET_CEILING = 2.5;
/** ~2.5× smaller than a full-height filing cabinet (was ~1.32 m). */
const CABINET_TARGET_HEIGHT = 0.52;
const SPAWN_CLEAR_RADIUS = 2.0;
const MIN_CABINET_GAP = 1.1;
const AIM_MAX_DIST = 7;
const HEAD_BOB_AMP = 0.012;
const HEAD_BOB_SPEED = 10;
/** Hard cap so load never freezes the tab. */
const MAX_PLACE_ATTEMPTS = 180;
const MAX_INTERIOR_PROBES = 120;

const BACKROOMS_URL = "/models/backrooms.glb";
const CABINET_URL = "/models/archive-cabinet.glb";

interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CabinetHit {
  root: THREE.Object3D;
  project: ArchiveSceneProject;
  materials: THREE.MeshStandardMaterial[];
  baseEmissive: THREE.Color[];
  baseEmissiveIntensity: number[];
}

function createCollider(x: number, z: number, halfW: number, halfD: number): Collider {
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
  };
}

function collides(x: number, z: number, colliders: Collider[]): boolean {
  for (const c of colliders) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
  }
  return false;
}

function tryMove(position: THREE.Vector3, dx: number, dz: number, colliders: Collider[]): void {
  const nextX = position.x + dx;
  const nextZ = position.z + dz;
  if (!collides(nextX, position.z, colliders)) position.x = nextX;
  if (!collides(position.x, nextZ, colliders)) position.z = nextZ;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function loadGltf(url: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

function normalizeModel(
  root: THREE.Object3D,
  opts: { targetSize?: number; targetHeight?: number },
): THREE.Box3 {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());

  let scale = 1;
  if (opts.targetHeight != null && size.y > 1e-6) {
    scale = opts.targetHeight / size.y;
  } else if (opts.targetSize != null) {
    const horizontal = Math.max(size.x, size.z);
    if (horizontal > 1e-6) scale = opts.targetSize / horizontal;
  }

  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);

  const scaled = new THREE.Box3().setFromObject(root);
  const scaledCenter = scaled.getCenter(new THREE.Vector3());
  root.position.x += -scaledCenter.x;
  root.position.z += -scaledCenter.z;
  root.position.y += -scaled.min.y;
  root.updateMatrixWorld(true);

  root.updateMatrix();
  for (const child of [...root.children]) {
    child.applyMatrix4(root.matrix);
  }
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);

  return new THREE.Box3().setFromObject(root);
}

function prepareCabinetMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = false;
    obj.receiveShadow = true;

    const fixOne = (mat: THREE.Material): THREE.Material => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        mat.metalness = Math.min(mat.metalness ?? 0.5, 0.4);
        mat.roughness = Math.max(mat.roughness ?? 0.5, 0.45);
        mat.envMapIntensity = 1.0;
        if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.needsUpdate = true;
        return mat;
      }

      const anyMat = mat as THREE.MeshBasicMaterial;
      const std = new THREE.MeshStandardMaterial({
        color: anyMat.color?.clone?.() ?? new THREE.Color(0x8a8f96),
        map: "map" in anyMat ? (anyMat.map as THREE.Texture | null) : null,
        roughness: 0.55,
        metalness: 0.3,
        envMapIntensity: 1.0,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        side: mat.side,
        transparent: mat.transparent,
        opacity: mat.opacity,
      });
      if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
      mat.dispose();
      return std;
    };

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map(fixOne);
    } else if (obj.material) {
      obj.material = fixOne(obj.material);
    }
  });
}

function cloneCabinetTemplate(template: THREE.Object3D): {
  root: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  baseEmissive: THREE.Color[];
  baseEmissiveIntensity: number[];
} {
  const root = template.clone(true) as THREE.Group;
  const materials: THREE.MeshStandardMaterial[] = [];
  const baseEmissive: THREE.Color[] = [];
  const baseEmissiveIntensity: number[] = [];

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const cloneMat = (m: THREE.Material): THREE.Material => {
      const cloned = m.clone();
      if (
        cloned instanceof THREE.MeshStandardMaterial ||
        cloned instanceof THREE.MeshPhysicalMaterial
      ) {
        cloned.emissive = cloned.emissive?.clone?.() ?? new THREE.Color(0x000000);
        materials.push(cloned);
        baseEmissive.push(cloned.emissive.clone());
        baseEmissiveIntensity.push(cloned.emissiveIntensity ?? 0);
      }
      return cloned;
    };
    if (Array.isArray(obj.material)) obj.material = obj.material.map(cloneMat);
    else if (obj.material) obj.material = cloneMat(obj.material);
  });

  return { root, materials, baseEmissive, baseEmissiveIntensity };
}

function setCabinetHighlight(hit: CabinetHit, mode: "none" | "hover", pulse = 0): void {
  for (let i = 0; i < hit.materials.length; i++) {
    const mat = hit.materials[i]!;
    if (mode === "hover") {
      mat.emissive.setHex(0xc9a84c);
      mat.emissiveIntensity = 0.12 + pulse;
    } else {
      mat.emissive.copy(hit.baseEmissive[i] ?? new THREE.Color(0x000000));
      mat.emissiveIntensity = hit.baseEmissiveIntensity[i] ?? 0;
    }
  }
}

/** Sit the object's world AABB bottom exactly on `floorY` (never under the floor). */
function groundObjectToFloor(object: THREE.Object3D, floorY = 0): void {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (!Number.isFinite(box.min.y)) return;
  object.position.y += floorY - box.min.y;
  object.updateMatrixWorld(true);
}

/**
 * The backrooms GLB has hanging room chunks below the walkable corridor.
 * normalizeModel grounds the *lowest* vertex to y=0, so the real floor
 * ends up floating above. Sample indoor floors and return the median Y
 * so we can shift the whole map down onto y=0.
 */
function detectWalkableFloorY(roomMeshes: THREE.Object3D[], roomBox: THREE.Box3): number {
  if (roomMeshes.length === 0) return CABINET_TARGET_HEIGHT * 1.5;

  const ray = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3();
  const samples: number[] = [];

  const inset = 2.0;
  const minX = roomBox.min.x + inset;
  const maxX = roomBox.max.x - inset;
  const minZ = roomBox.min.z + inset;
  const maxZ = roomBox.max.z - inset;
  if (maxX <= minX || maxZ <= minZ) return CABINET_TARGET_HEIGHT * 1.5;

  const cols = 10;
  const rows = 10;
  const fromY = roomBox.max.y + 0.4;
  const far = fromY - roomBox.min.y + 1.5;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = minX + ((i + 0.5) / cols) * (maxX - minX);
      const z = minZ + ((j + 0.5) / rows) * (maxZ - minZ);

      origin.set(x, fromY, z);
      ray.set(origin, down);
      ray.near = 0;
      ray.far = far;
      const downHits = ray.intersectObjects(roomMeshes, false);

      for (const hit of downHits) {
        if (hit.face) {
          normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
          if (normal.y < 0.55) continue;
        }

        // Must have a room ceiling above → real corridor, not a roof top
        origin.set(x, hit.point.y + 0.12, z);
        ray.set(origin, up);
        ray.far = 3.4;
        const upHits = ray.intersectObjects(roomMeshes, false);
        if (upHits.length === 0) continue;
        const clear = upHits[0]!.distance;
        if (clear < 1.35 || clear > 3.1) continue;

        samples.push(hit.point.y);
        break;
      }
    }
  }

  if (samples.length === 0) {
    // User-measured fallback: lift content ~1.5× cabinet height
    return CABINET_TARGET_HEIGHT * 1.5;
  }

  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)]!;
}

/**
 * Build a lightweight list of interior floor samples (load-time only).
 * Uses a coarse grid + few random points — never unbounded search.
 */
function collectInteriorSpots(
  roomMeshes: THREE.Object3D[],
  roomBox: THREE.Box3,
  rand: () => number,
): Array<{ x: number; z: number; floorY: number }> {
  const spots: Array<{ x: number; z: number; floorY: number }> = [];
  if (roomMeshes.length === 0) return spots;

  const ray = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3();

  // Inset strongly so we stay away from exterior shell of the bbox
  const inset = 2.5;
  const minX = roomBox.min.x + inset;
  const maxX = roomBox.max.x - inset;
  const minZ = roomBox.min.z + inset;
  const maxZ = roomBox.max.z - inset;
  if (maxX <= minX || maxZ <= minZ) return spots;

  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;

  // Coarse grid (~8×8 max) + random extras, hard-capped
  const cols = 8;
  const rows = 8;
  const candidates: Array<[number, number]> = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = minX + ((i + 0.5) / cols) * spanX;
      const z = minZ + ((j + 0.5) / rows) * spanZ;
      candidates.push([x, z]);
    }
  }
  for (let i = 0; i < 40; i++) {
    candidates.push([minX + rand() * spanX, minZ + rand() * spanZ]);
  }

  let probes = 0;
  for (const [x, z] of candidates) {
    if (probes >= MAX_INTERIOR_PROBES) break;
    if (Math.hypot(x, z) < SPAWN_CLEAR_RADIUS) continue;
    probes++;

    // Floor
    origin.set(x, ROOM_TARGET_CEILING + 0.3, z);
    ray.set(origin, down);
    ray.far = ROOM_TARGET_CEILING + 1;
    ray.near = 0;
    const downHits = ray.intersectObjects(roomMeshes, false);
    let floorY: number | null = null;
    for (const hit of downHits) {
      if (hit.face) {
        normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
        if (normal.y < 0.55) continue;
      }
      // Only the main floor plane (room is normalized so floor ≈ y=0)
      if (hit.point.y < -0.05 || hit.point.y > 0.25) continue;
      floorY = hit.point.y;
      break;
    }
    if (floorY == null) continue;

    // Ceiling — proves we are indoors, not outside the shell
    origin.set(x, floorY + 0.15, z);
    ray.set(origin, up);
    ray.far = 3.0;
    const upHits = ray.intersectObjects(roomMeshes, false);
    if (upHits.length === 0) continue;
    const clear = upHits[0]!.distance;
    if (clear < 1.5 || clear > 2.85) continue;

    // XZ only — cabinets are always grounded to y=0 after place
    spots.push({ x, z, floorY: 0 });
  }

  return spots;
}

export async function createArchiveScene(
  options: ArchiveSceneOptions,
): Promise<ArchiveSceneHandle> {
  const { canvas, projects, onHover, onSelect } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0xb8a978, 1);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  // IBL for cabinets (one-shot at load — not per frame)
  let envTex: THREE.Texture | null = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  } catch {
    envTex = null;
  }

  const scene = new THREE.Scene();
  if (envTex) scene.environment = envTex;
  scene.fog = new THREE.FogExp2(0xc4b896, 0.042);
  scene.background = new THREE.Color(0xc4b896);

  const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 50);

  scene.add(new THREE.AmbientLight(0xfff2d0, 0.9));
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x8a7d55, 0.7));
  const key = new THREE.DirectionalLight(0xfff5dc, 0.65);
  key.position.set(3, 6, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8e0c8, 0.35);
  fill.position.set(-4, 5, -3);
  scene.add(fill);

  const colliders: Collider[] = [];
  const cabinetHits: CabinetHit[] = [];
  const roomMeshes: THREE.Mesh[] = [];

  const [backroomsRaw, cabinetRaw] = await Promise.all([
    loadGltf(BACKROOMS_URL),
    loadGltf(CABINET_URL),
  ]);

  let roomBox = normalizeModel(backroomsRaw, { targetHeight: ROOM_TARGET_CEILING });
  backroomsRaw.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = false;
    obj.receiveShadow = true;
    // Only keep reasonably large meshes for probes (skip tiny trim)
    const geo = obj.geometry;
    if (geo) {
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      const r = geo.boundingSphere?.radius ?? 1;
      if (r > 0.15) roomMeshes.push(obj);
    }
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m && "map" in m && m.map) {
        (m.map as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
  scene.add(backroomsRaw);
  backroomsRaw.updateMatrixWorld(true);

  // Drop the map so the walkable corridor sits on y=0 (not the hanging debris)
  const walkFloorY = detectWalkableFloorY(roomMeshes, roomBox);
  if (Math.abs(walkFloorY) > 0.02) {
    backroomsRaw.position.y -= walkFloorY;
    backroomsRaw.updateMatrixWorld(true);
    roomBox = new THREE.Box3().setFromObject(backroomsRaw);
  }

  // Walk bounds: inset from full bbox (keeps player roughly inside the building)
  const walkInset = 1.2;
  const walkMinX = roomBox.min.x + walkInset;
  const walkMaxX = roomBox.max.x - walkInset;
  const walkMinZ = roomBox.min.z + walkInset;
  const walkMaxZ = roomBox.max.z - walkInset;

  normalizeModel(cabinetRaw, { targetHeight: CABINET_TARGET_HEIGHT });
  // Extra snap: nested Sketchfab pivots sometimes leave min.y < 0 after bake
  groundObjectToFloor(cabinetRaw, 0);
  prepareCabinetMaterials(cabinetRaw);
  const templateBox = new THREE.Box3().setFromObject(cabinetRaw);
  const templateSize = templateBox.getSize(new THREE.Vector3());
  const halfW = Math.max(templateSize.x, 0.3) / 2;
  const halfD = Math.max(templateSize.z, 0.3) / 2;
  const pad = Math.max(halfW, halfD) + PLAYER_RADIUS * 0.7;
  cabinetRaw.visible = false;
  // Keep template at origin for clean clones
  cabinetRaw.position.set(0, 0, 0);
  groundObjectToFloor(cabinetRaw, 0);

  const seed = projects.reduce((acc, p) => acc ^ hashString(`${p.id}:${p.name}`), 0xc0ffee);
  const rand = mulberry32(seed || 1);

  // Load-time only: capped interior probes (safe)
  const interiorSpots = collectInteriorSpots(roomMeshes, roomBox, rand);

  // Shuffle spots deterministically
  for (let i = interiorSpots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = interiorSpots[i]!;
    interiorSpots[i] = interiorSpots[j]!;
    interiorSpots[j] = tmp;
  }

  type Slot = { x: number; z: number; rotY: number; floorY: number };
  const slots: Slot[] = [];

  // Prefer validated interior spots
  for (const spot of interiorSpots) {
    if (slots.length >= projects.length) break;
    let ok = true;
    for (const s of slots) {
      if (Math.hypot(spot.x - s.x, spot.z - s.z) < MIN_CABINET_GAP) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const rotY =
      rand() < 0.5
        ? (Math.floor(rand() * 4) * Math.PI) / 2 + (rand() - 0.5) * 0.12
        : rand() * Math.PI * 2;
    slots.push({ x: spot.x, z: spot.z, rotY, floorY: spot.floorY });
  }

  // Fallback: random inset positions on y=0 (still inside bbox, no more raycasts)
  let attempts = 0;
  const placeInset = 3.0;
  const pMinX = roomBox.min.x + placeInset;
  const pMaxX = roomBox.max.x - placeInset;
  const pMinZ = roomBox.min.z + placeInset;
  const pMaxZ = roomBox.max.z - placeInset;
  const pSpanX = Math.max(1, pMaxX - pMinX);
  const pSpanZ = Math.max(1, pMaxZ - pMinZ);

  while (slots.length < projects.length && attempts < MAX_PLACE_ATTEMPTS) {
    attempts++;
    const x = pMinX + rand() * pSpanX;
    const z = pMinZ + rand() * pSpanZ;
    if (Math.hypot(x, z) < SPAWN_CLEAR_RADIUS) continue;
    let ok = true;
    for (const s of slots) {
      if (Math.hypot(x - s.x, z - s.z) < MIN_CABINET_GAP) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    slots.push({
      x,
      z,
      rotY: rand() * Math.PI * 2,
      floorY: 0,
    });
  }

  projects.forEach((project, index) => {
    const slot = slots[index];
    if (!slot) return;

    const { root, materials, baseEmissive, baseEmissiveIntensity } =
      cloneCabinetTemplate(cabinetRaw);
    root.visible = true;
    // Place on the main floor plane, then re-snap AABB bottom to y=0
    // (rotation can shift the bbox if the pivot isn't centered).
    root.position.set(slot.x, 0, slot.z);
    root.rotation.y = slot.rotY;
    root.userData.projectId = project.id;
    scene.add(root);
    groundObjectToFloor(root, 0);

    colliders.push(createCollider(slot.x, slot.z, pad, pad));
    cabinetHits.push({ root, project, materials, baseEmissive, baseEmissiveIntensity });
  });

  // Free probe mesh list — no longer needed at runtime
  roomMeshes.length = 0;

  // --- input ---
  const keys = new Set<string>();
  let yaw = rand() * Math.PI * 2;
  let pitch = 0;
  let hoverId: number | null = null;
  let disposed = false;
  let pointerLocked = false;
  let bobPhase = 0;
  let bobAmount = 0;

  // Feet on ground plane y=0 (model is normalized to floor at 0)
  const feet = new THREE.Vector3(0, 0, 0);

  const aimRay = new THREE.Raycaster();
  const centerNdc = new THREE.Vector2(0, 0);
  aimRay.far = AIM_MAX_DIST;
  const pickRoots = cabinetHits.map((c) => c.root);

  function findCabinetHit(object: THREE.Object3D): CabinetHit | null {
    let cur: THREE.Object3D | null = object;
    while (cur) {
      if (cur.userData?.projectId != null) {
        const id = cur.userData.projectId as number;
        return cabinetHits.find((c) => c.project.id === id) ?? null;
      }
      cur = cur.parent;
    }
    return null;
  }

  function pickCrosshair(): CabinetHit | null {
    aimRay.setFromCamera(centerNdc, camera);
    const hits = aimRay.intersectObjects(pickRoots, true);
    if (hits.length === 0) return null;
    return findCabinetHit(hits[0]!.object);
  }

  function applyHover(hit: CabinetHit | null) {
    const nextId = hit?.project.id ?? null;
    if (nextId === hoverId) return;
    if (hoverId != null) {
      const prev = cabinetHits.find((c) => c.project.id === hoverId);
      if (prev) setCabinetHighlight(prev, "none");
    }
    hoverId = nextId;
    if (hit) setCabinetHighlight(hit, "hover");
    onHover(hit ? { project: hit.project } : null);
  }

  function clampFeet() {
    feet.x = Math.min(walkMaxX, Math.max(walkMinX, feet.x));
    feet.z = Math.min(walkMaxZ, Math.max(walkMinZ, feet.z));
    feet.y = 0;
  }

  function applyCamera(bob = 0) {
    // Always grounded — no mesh raycast, no floating
    camera.position.set(feet.x, EYE_HEIGHT + bob, feet.z);
  }

  function onKeyDown(e: KeyboardEvent) {
    keys.add(e.code);
    if (
      ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  function onPointerLockChange() {
    pointerLocked = document.pointerLockElement === canvas;
    canvas.style.cursor = pointerLocked ? "none" : "crosshair";
  }

  function onMouseMove(e: MouseEvent) {
    if (!pointerLocked) return;
    yaw -= e.movementX * LOOK_SENSITIVITY;
    pitch -= e.movementY * LOOK_SENSITIVITY;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
  }

  function onCanvasClick(e: MouseEvent) {
    if (e.button !== 0) return;
    if (!pointerLocked) {
      canvas.requestPointerLock();
      return;
    }
    const hit = pickCrosshair();
    if (hit) onSelect(hit.project);
  }

  function onContextMenu(e: Event) {
    e.preventDefault();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.style.cursor = "crosshair";

  const clock = new THREE.Clock();
  let raf = 0;

  function animate() {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    let inputX = 0;
    let inputZ = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) inputZ -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) inputZ += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) inputX -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) inputX += 1;

    let moving = false;
    if (inputX !== 0 || inputZ !== 0) {
      const len = Math.hypot(inputX, inputZ) || 1;
      inputX /= len;
      inputZ /= len;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const step = MOVE_SPEED * dt;
      const dx = (inputX * cos + inputZ * sin) * step;
      const dz = (-inputX * sin + inputZ * cos) * step;
      const beforeX = feet.x;
      const beforeZ = feet.z;
      tryMove(feet, dx, dz, colliders);
      clampFeet();
      moving = feet.x !== beforeX || feet.z !== beforeZ;
    }

    if (moving) {
      bobPhase += dt * HEAD_BOB_SPEED;
      bobAmount = HEAD_BOB_AMP;
    } else {
      bobAmount *= Math.pow(0.001, dt);
      if (bobAmount < 0.0005) {
        bobAmount = 0;
        bobPhase = 0;
      }
    }

    applyCamera(Math.sin(bobPhase) * bobAmount);

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Crosshair pick — only against cabinet roots (cheap)
    applyHover(pickCrosshair());

    if (hoverId != null) {
      const hit = cabinetHits.find((c) => c.project.id === hoverId);
      if (hit) setCabinetHighlight(hit, "hover", Math.sin(clock.elapsedTime * 2.5) * 0.03);
    }

    renderer.render(scene, camera);
  }

  function setSize(width: number, height: number) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function clearSelection() {
    // no-op
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    document.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("click", onCanvasClick);
    canvas.removeEventListener("contextmenu", onContextMenu);

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });
    envTex?.dispose();
    renderer.dispose();
    keys.clear();
    onHover(null);
  }

  feet.set(0, 0, 0);
  clampFeet();
  applyCamera(0);
  animate();

  return { dispose, setSize, clearSelection };
}
