export type TabDescriptor<Id extends string, Source> = {
  id: Id;
  label: string;
  icon: string;
  badge?: (source: Source) => number | null | undefined;
};

export type TabItem<Id extends string> = {
  value: Id;
  label: string;
  icon: string;
  badge?: string;
};

export const tabQueryKey = "tab";

export function tabFromUrl<Id extends string>(url: string, ids: readonly Id[], fallback: Id): Id {
  const query = url.split("?")[1]?.split("#")[0] ?? "";
  const requested = new URLSearchParams(query).get(tabQueryKey);
  return ids.find((id) => id === requested) ?? fallback;
}

export function urlWithTab(href: string, tab: string, fallback: string): string {
  const url = new URL(href);
  if (tab === fallback) url.searchParams.delete(tabQueryKey);
  else url.searchParams.set(tabQueryKey, tab);
  return url.toString();
}

export function tabItems<Id extends string, Source>(
  descriptors: readonly TabDescriptor<Id, Source>[],
  source: Source,
  formatBadge: (value: number) => string,
): TabItem<Id>[] {
  return descriptors.map(({ id, label, icon, badge }) => {
    const value = badge?.(source);
    return {
      value: id,
      label,
      icon,
      badge: value != null && value > 0 ? formatBadge(value) : undefined,
    };
  });
}
