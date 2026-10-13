import type {
  Difficulty,
  ExploreFilters,
  ExploreSort,
  IssueFilters,
  IssueKind,
  IssueSort,
} from "../../shared/types/index.js";
import type { FilterDescriptor, FilterSchema } from "./feed-filters.js";

const searchFilter = <Source extends { q: string }>(): FilterDescriptor<string, Source> => ({
  param: "q",
  default: "",
  fromProps: (source) => source.q,
  toQuery: (value) => value.trim(),
});

const languagesFilter = <Source extends { languages: string[] }>(): FilterDescriptor<
  string[],
  Source
> => ({
  param: "language",
  default: [],
  fromProps: (source) => [...source.languages],
  toQuery: (value) => value.join(","),
});

export interface ExploreFilterValues {
  q: string;
  topic: string | null;
  languages: string[];
  level: Difficulty | "all";
  sort: ExploreSort;
  minScore: number;
}

export const exploreFilterSchema: FilterSchema<ExploreFilterValues, ExploreFilters> = {
  q: searchFilter(),
  topic: {
    param: "topic",
    default: null,
    fromProps: (source) => source.topic,
    toQuery: (value) => value ?? "",
  },
  languages: languagesFilter(),
  level: {
    param: "level",
    default: "all",
    fromProps: (source) => source.level,
    toQuery: (value) => value,
    alwaysSend: true,
  },
  sort: {
    param: "sort",
    default: "stars",
    fromProps: (source) => source.sort,
    toQuery: (value) => value,
  },
  minScore: {
    param: "score",
    default: 0,
    fromProps: (source) => source.minScore ?? 0,
    toQuery: (value) => String(value),
  },
};

export interface IssueFilterValues {
  q: string;
  languages: string[];
  kind: IssueKind | "all";
  unassigned: boolean;
  sort: IssueSort;
}

export const issueFilterSchema: FilterSchema<IssueFilterValues, IssueFilters> = {
  q: searchFilter(),
  languages: languagesFilter(),
  kind: {
    param: "label",
    default: "all",
    fromProps: (source) => source.kind,
    toQuery: (value) => value,
    alwaysSend: true,
  },
  unassigned: {
    param: "unassigned",
    default: true,
    fromProps: (source) => source.unassigned,
    toQuery: (value) => (value ? "1" : "0"),
  },
  sort: {
    param: "sort",
    default: "recent",
    fromProps: (source) => source.sort,
    toQuery: (value) => value,
  },
};
