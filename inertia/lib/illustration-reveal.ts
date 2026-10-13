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
