import type { UserPreferences } from "#shared/types/index";
import { normalizePreferenceLanguages, type PreferenceLanguage } from "#shared/preferences";

export type FeedQuery = Record<string, unknown>;

export type Criterion<Value> = {
  param: string;
  parse: (raw: string) => Value;
  fromPreferences?: (preferences: UserPreferences) => Value;
};

export type CriteriaDescriptors<Criteria> = {
  [Key in keyof Criteria]: Criterion<Criteria[Key]>;
};

export type FeedCriteriaParser<Criteria> = (
  query: FeedQuery,
  preferences: UserPreferences | null,
) => Criteria;

function rawValue(value: unknown): string {
  return Array.isArray(value) ? value.join(",") : String(value ?? "");
}

function resolve<Value>(
  criterion: Criterion<Value>,
  query: FeedQuery,
  preferences: UserPreferences | null,
): Value {
  if (Object.hasOwn(query, criterion.param)) {
    return criterion.parse(rawValue(query[criterion.param]));
  }
  if (preferences && criterion.fromPreferences) {
    return criterion.fromPreferences(preferences);
  }
  return criterion.parse("");
}

export function defineFeedCriteria<Criteria extends object>(
  descriptors: CriteriaDescriptors<Criteria>,
): FeedCriteriaParser<Criteria> {
  const keys = Object.keys(descriptors) as (keyof Criteria)[];
  return (query, preferences) =>
    Object.fromEntries(
      keys.map((key) => [key, resolve(descriptors[key], query, preferences)]),
    ) as Criteria;
}

export const maxSearchLength = 100;

export function searchText(raw: string): string {
  return raw.trim().slice(0, maxSearchLength);
}

export function languageList(raw: string): PreferenceLanguage[] {
  return normalizePreferenceLanguages(raw.split(",").filter(Boolean));
}

export function oneOf<Option extends string>(
  options: readonly Option[],
  fallback: NoInfer<Option>,
): (raw: string) => Option {
  return (raw) => (options.includes(raw as Option) ? (raw as Option) : fallback);
}
