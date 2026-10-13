import { router } from "@inertiajs/vue3";
import { computed, onScopeDispose, reactive, watch } from "vue";
import type { FeedRefreshState } from "../../shared/types/index.js";
import {
  defaultFilters,
  filterQuery,
  hasActiveFilters as anyFilterActive,
  readFilters,
  type FilterQuery,
  type FilterSchema,
} from "../lib/feed-filters.js";

type FilteredFeedVisit = (query: FilterQuery) => void;

type FeedRefreshPoll = (finished: () => void) => void;

export interface FilteredFeedTimer {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
}

interface FilteredFeedOptions<Values, Source> {
  schema: FilterSchema<Values, Source>;
  source: Source;
  visit: FilteredFeedVisit;
  debounced?: (keyof Values)[];
  debounceMs?: number;
  timer?: FilteredFeedTimer;
}

export function inertiaFeedVisit(
  url: string,
  props: { scroll: string; dependents: string[] },
): FilteredFeedVisit {
  return (query) =>
    router.get(url, query, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: [props.scroll, ...props.dependents],
      reset: [props.scroll],
    });
}

export function inertiaFeedRefresh(props: {
  scroll: string;
  dependents: string[];
}): FeedRefreshPoll {
  return (finished) =>
    router.reload({
      only: [props.scroll, ...props.dependents],
      reset: [props.scroll],
      onFinish: finished,
    });
}

const browserTimer: FilteredFeedTimer = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function useFilteredFeed<Values extends object, Source>(
  options: FilteredFeedOptions<Values, Source>,
) {
  const { schema, visit, debounced = [], debounceMs = 300, timer = browserTimer } = options;
  const filters = reactive(readFilters(schema, options.source)) as Values;
  const keys = Object.keys(schema) as (keyof Values)[];
  const immediate = keys.filter((key) => !debounced.includes(key));
  let pending: unknown;

  function cancelPending() {
    if (pending === undefined) return;
    timer.clearTimeout(pending);
    pending = undefined;
  }

  function reload() {
    cancelPending();
    visit(filterQuery(schema, filters));
  }

  function scheduleReload() {
    cancelPending();
    pending = timer.setTimeout(() => {
      pending = undefined;
      reload();
    }, debounceMs);
  }

  const serialize = (subset: (keyof Values)[]) =>
    subset.map((key) => schema[key].toQuery(filters[key])).join("\u0000");

  watch(() => serialize(debounced), scheduleReload);
  watch(() => serialize(immediate), reload);
  onScopeDispose(cancelPending);

  const hasActiveFilters = computed(() => anyFilterActive(schema, filters));

  function resetFilters() {
    Object.assign(filters, defaultFilters(schema));
  }

  return { filters, hasActiveFilters, reload, resetFilters };
}

interface RefreshPollingOptions {
  refreshState: () => FeedRefreshState;
  poll: FeedRefreshPoll;
  delayMs?: number;
  maxAttempts?: number;
  timer?: FilteredFeedTimer;
}

export function useRefreshPolling(options: RefreshPollingOptions) {
  const { refreshState, poll, delayMs = 3000, maxAttempts = 5 } = options;
  const availableTimer = options.timer ?? ("window" in globalThis ? browserTimer : undefined);
  if (!availableTimer) return;
  const timer: FilteredFeedTimer = availableTimer;
  let attempts = 0;
  let pending: unknown;
  let active = true;

  function cancel() {
    if (pending === undefined) return;
    timer.clearTimeout(pending);
    pending = undefined;
  }

  function schedule() {
    cancel();
    if (!active || refreshState() !== "refreshing" || attempts >= maxAttempts) return;
    pending = timer.setTimeout(() => {
      pending = undefined;
      attempts++;
      poll(schedule);
    }, delayMs);
  }

  watch(
    refreshState,
    (state) => {
      if (state !== "refreshing") attempts = 0;
      schedule();
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    active = false;
    cancel();
  });
}
