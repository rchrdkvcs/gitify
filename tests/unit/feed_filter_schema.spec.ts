import { test } from "@japa/runner";
import type { ExploreFilters, IssueFilters } from "#shared/types/index";
import { exploreFilterSchema, issueFilterSchema } from "../../inertia/lib/feed-filter-schemas.js";
import {
  defaultFilters,
  filterQuery,
  hasActiveFilters,
  readFilters,
} from "../../inertia/lib/feed-filters.js";

const exploreProps: ExploreFilters = {
  q: "",
  topic: null,
  languages: [],
  level: "all",
  sort: "stars",
  minScore: null,
};

const issueProps: IssueFilters = {
  q: "",
  languages: [],
  kind: "all",
  unassigned: true,
  sort: "recent",
};

test.group("explore filter schema", () => {
  test("default values omit every param except the always explicit level", ({ assert }) => {
    const values = readFilters(exploreFilterSchema, exploreProps);
    assert.deepEqual(filterQuery(exploreFilterSchema, values), {
      q: undefined,
      topic: undefined,
      language: undefined,
      level: "all",
      sort: undefined,
      score: undefined,
    });
    assert.isFalse(hasActiveFilters(exploreFilterSchema, values));
  });

  test("non default values are serialized under their URL param", ({ assert }) => {
    const values = readFilters(exploreFilterSchema, {
      q: "  vue  ",
      topic: "react",
      languages: ["typescript", "rust"],
      level: "beginner",
      sort: "recent",
      minScore: 50,
    });
    assert.deepEqual(filterQuery(exploreFilterSchema, values), {
      q: "vue",
      topic: "react",
      language: "typescript,rust",
      level: "beginner",
      sort: "recent",
      score: "50",
    });
    assert.isTrue(hasActiveFilters(exploreFilterSchema, values));
  });

  test("a whitespace-only search is neither sent nor considered active", ({ assert }) => {
    const values = { ...readFilters(exploreFilterSchema, exploreProps), q: "   " };
    assert.isUndefined(filterQuery(exploreFilterSchema, values).q);
    assert.isFalse(hasActiveFilters(exploreFilterSchema, values));
  });

  test("reading props copies arrays so local edits never reach the props", ({ assert }) => {
    const source = { ...exploreProps, languages: ["go"] };
    const values = readFilters(exploreFilterSchema, source);
    values.languages.push("rust");
    assert.deepEqual(source.languages, ["go"]);
  });
});

test.group("issue filter schema", () => {
  test("label is always sent and assigned issues are opt-in", ({ assert }) => {
    const values = readFilters(issueFilterSchema, issueProps);
    assert.deepEqual(filterQuery(issueFilterSchema, values), {
      q: undefined,
      language: undefined,
      label: "all",
      unassigned: undefined,
      sort: undefined,
    });
    assert.deepEqual(filterQuery(issueFilterSchema, { ...values, unassigned: false }), {
      q: undefined,
      language: undefined,
      label: "all",
      unassigned: "0",
      sort: undefined,
    });
  });

  test("a non default label counts as an active filter", ({ assert }) => {
    const values = { ...readFilters(issueFilterSchema, issueProps), kind: "help-wanted" as const };
    assert.isTrue(hasActiveFilters(issueFilterSchema, values));
    assert.equal(filterQuery(issueFilterSchema, values).label, "help-wanted");
  });

  test("defaults are fresh copies each time", ({ assert }) => {
    const first = defaultFilters(issueFilterSchema);
    first.languages.push("go");
    assert.deepEqual(defaultFilters(issueFilterSchema).languages, []);
    assert.deepEqual(defaultFilters(issueFilterSchema), issueProps);
  });
});
