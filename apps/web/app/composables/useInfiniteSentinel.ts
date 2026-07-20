/**
 * Infinite scroll basé sur un élément sentinelle observé par IntersectionObserver.
 *
 * `reobserve` force l'observer à ré-émettre l'état d'intersection courant
 * (un `observe()` déclenche toujours un callback initial) — indispensable quand
 * la liste change sans que la sentinelle quitte le viewport (filtres, premier fetch).
 */
export function useInfiniteSentinel(options: { canLoad: () => boolean; onLoad: () => void }) {
  const sentinel = ref<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  function reobserve() {
    if (observer && sentinel.value) {
      observer.unobserve(sentinel.value);
      observer.observe(sentinel.value);
    }
  }

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && options.canLoad()) {
        options.onLoad();
        nextTick(reobserve);
      }
    });

    if (sentinel.value) {
      observer.observe(sentinel.value);
    }
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
  });

  return { sentinel, reobserve };
}
