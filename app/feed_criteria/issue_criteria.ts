import type { IssueFilters, IssueSort } from "#shared/types/index";
import { defaultIssueKind, issueKinds } from "#shared/issues";
import { normalizePreferenceLanguages } from "#shared/preferences";
import { defineFeedCriteria, languageList, oneOf, searchText } from "./feed_criteria.js";

const issueSorts: IssueSort[] = ["recent", "comments", "stars"];
const issueKindFilters: IssueFilters["kind"][] = ["all", ...issueKinds];

export const parseIssueFilters = defineFeedCriteria<IssueFilters>({
  q: { param: "q", parse: searchText },
  languages: {
    param: "language",
    parse: languageList,
    fromPreferences: (preferences) => normalizePreferenceLanguages(preferences.languages),
  },
  kind: {
    param: "label",
    parse: oneOf(issueKindFilters, "all"),
    fromPreferences: defaultIssueKind,
  },
  unassigned: { param: "unassigned", parse: (raw) => !["0", "false"].includes(raw) },
  sort: { param: "sort", parse: oneOf(issueSorts, "recent") },
});
