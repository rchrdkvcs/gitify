import { test } from "@japa/runner";
import { projectFacts } from "../../inertia/lib/project-facts.js";
import { projectTabs } from "../../inertia/lib/project-tabs.js";
import {
  tabFromUrl,
  tabItems,
  urlWithTab,
  type TabDescriptor,
} from "../../inertia/lib/url-tabs.js";

const ids = ["overview", "issues", "activity"] as const;

test("reads a known tab from the page url", ({ assert }) => {
  assert.equal(tabFromUrl("/projects/a/b?tab=issues", ids, "overview"), "issues");
  assert.equal(tabFromUrl("/projects/a/b?x=1&tab=activity#top", ids, "overview"), "activity");
});

test("falls back when the tab is missing or unknown", ({ assert }) => {
  assert.equal(tabFromUrl("/projects/a/b", ids, "overview"), "overview");
  assert.equal(tabFromUrl("/projects/a/b?tab=secret", ids, "overview"), "overview");
});

test("writes the tab to the url and drops it for the default tab", ({ assert }) => {
  assert.equal(
    urlWithTab("https://gitify.test/projects/a/b?x=1", "issues", "overview"),
    "https://gitify.test/projects/a/b?x=1&tab=issues",
  );
  assert.equal(
    urlWithTab("https://gitify.test/projects/a/b?tab=issues", "overview", "overview"),
    "https://gitify.test/projects/a/b",
  );
});

test("builds tab items with formatted badges for positive counts only", ({ assert }) => {
  const descriptors: TabDescriptor<"a" | "b" | "c", Record<string, number | null>>[] = [
    { id: "a", label: "A", icon: "i-a", badge: (source) => source.a },
    { id: "b", label: "B", icon: "i-b", badge: (source) => source.b },
    { id: "c", label: "C", icon: "i-c" },
  ];
  const items = tabItems(descriptors, { a: 1200, b: 0 }, (value) => `#${value}`);
  assert.deepEqual(items, [
    { value: "a", label: "A", icon: "i-a", badge: "#1200" },
    { value: "b", label: "B", icon: "i-b", badge: undefined },
    { value: "c", label: "C", icon: "i-c", badge: undefined },
  ]);
});

test("project tabs take their badges from the project facts", ({ assert }) => {
  const facts = projectFacts({
    difficulty: "beginner",
    openIssuesCount: 12,
    totalContributorsCount: 3,
    insights: null,
  });
  const badges = tabItems(projectTabs, facts, String).map((item) => [item.value, item.badge]);
  assert.deepEqual(badges, [
    ["overview", undefined],
    ["contributing", undefined],
    ["issues", "12"],
    ["pulls", undefined],
    ["contributors", "3"],
    ["activity", undefined],
  ]);
});
