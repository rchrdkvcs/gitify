import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { createIllustrationReveal, type IllustrationState } from "~/lib/illustration-reveal";

const THRESHOLD = 0.35;

/**
 * Plays a landing illustration once, when about a third of it is visible.
 *
 * Server and first client render both use `"idle"`, so hydration matches; the
 * browser is only read in `onMounted`. Put `ref="illustration"` on the `<svg>`
 * and bind `state` to its `data-state`; the `.ill-motion` styles do the rest.
 */
export function useIllustrationReveal() {
  const root = useTemplateRef<Element>("illustration");
  const state = ref<IllustrationState>("idle");
  let observer: IntersectionObserver | null = null;
  let reveal: ReturnType<typeof createIllustrationReveal> | null = null;

  onMounted(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reveal = createIllustrationReveal((next) => {
      state.value = next;
      observer?.disconnect();
    }, reduced);

    if (!reveal.waiting) return;
    if (!root.value || !("IntersectionObserver" in window)) {
      reveal.setVisible(true);
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) =>
        reveal?.setVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio >= THRESHOLD)),
      { threshold: THRESHOLD },
    );
    observer.observe(root.value);
  });

  onBeforeUnmount(() => {
    reveal?.dispose();
    observer?.disconnect();
  });

  return { state };
}
