import type { Project } from "@gitify/types";

/** Project fields shown in the archive easter egg (no Three.js dependency). */
export type ArchiveSceneProject = Pick<
  Project,
  "id" | "name" | "ownerName" | "description" | "repositoryUrl" | "stars" | "language"
>;

/** Aimed cabinet under the crosshair (center of the screen). */
export interface ArchiveHoverInfo {
  project: ArchiveSceneProject;
}

export interface ArchiveSceneHandle {
  dispose: () => void;
  setSize: (width: number, height: number) => void;
  clearSelection: () => void;
}
