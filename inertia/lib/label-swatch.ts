export function labelSwatch(color: string) {
  return { backgroundColor: `#${color.replace(/^#/, "")}` };
}
