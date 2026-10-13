/**
 * Decides when a landing illustration plays its one-shot reveal.
 *
 * The motion itself is CSS; this only flips the state once, the first time the
 * illustration becomes visible. Under reduced motion it settles on the static
 * final state without ever playing.
 */
export type IllustrationState = "idle" | "play" | "static";

export function createIllustrationReveal(
  onChange: (state: IllustrationState) => void,
  reduced: boolean,
) {
  let state: IllustrationState = "idle";
  let disposed = false;

  const set = (next: IllustrationState) => {
    if (disposed || state !== "idle") return;
    state = next;
    onChange(state);
  };

  if (reduced) set("static");

  return {
    get state() {
      return state;
    },
    /** Whether the caller still needs to watch visibility. */
    get waiting() {
      return !disposed && state === "idle";
    },
    setVisible(value: boolean) {
      if (value) set("play");
    },
    dispose() {
      disposed = true;
    },
  };
}
