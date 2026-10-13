import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { createIllustrationReveal, type IllustrationState } from "~/lib/illustration-reveal";

const VISIBLE_SHARE_TO_PLAY = 0.35;

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
        reveal?.setVisible(
          Boolean(entry?.isIntersecting && entry.intersectionRatio >= VISIBLE_SHARE_TO_PLAY),
        ),
      { threshold: VISIBLE_SHARE_TO_PLAY },
    );
    observer.observe(root.value);
  });

  onBeforeUnmount(() => {
    reveal?.dispose();
    observer?.disconnect();
  });

  return { state };
}
