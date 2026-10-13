import { usePage } from "@inertiajs/vue3";
import { computed, nextTick, ref, watch, type Ref } from "vue";
import { tabFromUrl, tabItems, urlWithTab, type TabDescriptor } from "../lib/url-tabs.js";
import { formatCompact } from "../utils/formatters.js";

export function useUrlTabs<Id extends string, Source>(
  descriptors: readonly TabDescriptor<Id, Source>[],
  source: () => Source,
  anchorId: string,
) {
  const ids = descriptors.map((descriptor) => descriptor.id);
  const fallback = ids[0];
  const active = ref(tabFromUrl(usePage().url, ids, fallback)) as Ref<Id>;

  watch(active, (tab) => {
    window.history.replaceState(
      window.history.state,
      "",
      urlWithTab(window.location.href, tab, fallback),
    );
  });

  const items = computed(() => tabItems(descriptors, source(), formatCompact));

  function select(tab: Id, target = anchorId) {
    active.value = tab;
    nextTick(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
  }

  return { active, items, select };
}
