import type { ProjectFacts } from "./project-facts.js";
import type { TabDescriptor } from "./url-tabs.js";

export const projectTabs = [
  { id: "overview", label: "Aperçu", icon: "lucide:book-open" },
  {
    id: "contributing",
    label: "Contribuer",
    icon: "lucide:hand-helping",
    badge: (facts) => facts.counts.goodFirstIssues,
  },
  {
    id: "issues",
    label: "Issues",
    icon: "lucide:circle-dot",
    badge: (facts) => facts.counts.openIssues,
  },
  {
    id: "pulls",
    label: "Pull requests",
    icon: "lucide:git-pull-request",
    badge: (facts) => facts.counts.openPullRequests,
  },
  {
    id: "contributors",
    label: "Contributeurs",
    icon: "lucide:users",
    badge: (facts) => facts.counts.contributors,
  },
  { id: "activity", label: "Activité", icon: "lucide:chart-column" },
] as const satisfies readonly TabDescriptor<string, ProjectFacts>[];

export type ProjectTab = (typeof projectTabs)[number]["id"];
