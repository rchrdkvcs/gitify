import type { Difficulty, IssueKind } from "#shared/types/index";
import gitifyConfig from "#config/gitify";
import { issueKindLabel } from "#shared/issues";

export function repositorySearchQuery(language: string, difficulty: Difficulty): string {
  const base = `language:${language} archived:false is:public`;
  if (difficulty === "beginner") {
    return `${base} good-first-issues:>0`;
  }
  return `${base} stars:>${gitifyConfig.github.search.expertMinStars} help-wanted-issues:>0`;
}

export function issueSearchQuery(language: string, kind: IssueKind): string {
  return `is:issue is:open is:public archived:false -linked:pr language:${language} label:"${issueKindLabel(kind)}" sort:created-desc`;
}

const ISSUE_FIELDS = `number title url createdAt
  author { login avatarUrl }
  comments { totalCount }
  labels(first: 6) { nodes { name color } }`;

const ACTIVITY_FIELDS = `createdAt state authorAssociation
  author { __typename }
  comments(first: 10) { nodes { createdAt authorAssociation } }`;

const contributingAliases = gitifyConfig.github.insights.contributingPaths
  .map(
    (path, index) =>
      `contributing${index}: object(expression: "HEAD:${path}") { ... on Blob { text } }`,
  )
  .join("\n");

export const REPOSITORY_GRAPH_QUERY = `query RepositoryInsights($owner: String!, $name: String!, $issues: Int!, $pullRequests: Int!, $languages: Int!, $activity: Int!) {
  repository(owner: $owner, name: $name) {
    createdAt pushedAt homepageUrl isArchived diskUsage stargazerCount forkCount
    owner { avatarUrl }
    licenseInfo { spdxId name }
    watchers { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    openPullRequests: pullRequests(states: OPEN) { totalCount }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    goodFirstIssues: issues(states: OPEN, labels: ["good first issue"]) { totalCount }
    helpWantedIssues: issues(states: OPEN, labels: ["help wanted"]) { totalCount }
    releases { totalCount }
    latestRelease { publishedAt }
    languages(first: $languages, orderBy: { field: SIZE, direction: DESC }) {
      edges { size node { name color } }
    }
    defaultBranchRef {
      name
      target { ... on Commit { committedDate history { totalCount } } }
    }
    recentIssues: issues(first: $issues, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ISSUE_FIELDS} }
    }
    beginnerIssues: issues(first: $issues, states: OPEN, labels: ["good first issue"], orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ISSUE_FIELDS} assignees { totalCount } }
    }
    activityIssues: issues(first: $activity, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ACTIVITY_FIELDS} }
    }
    activityPullRequests: pullRequests(first: $activity, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { ${ACTIVITY_FIELDS} mergedAt reviews(first: 5) { nodes { createdAt authorAssociation } } }
    }
    lastMergedPullRequest: pullRequests(first: 1, states: MERGED, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes { mergedAt }
    }
    recentPullRequests: pullRequests(first: $pullRequests, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { isDraft ${ISSUE_FIELDS} }
    }
    ${contributingAliases}
  }
}`;

export const ISSUE_SEARCH_QUERY = `query IssueSearch($query: String!, $first: Int!, $labels: Int!, $topics: Int!) {
  search(type: ISSUE, query: $query, first: $first) {
    nodes {
      ... on Issue {
        databaseId number title url createdAt
        comments { totalCount }
        assignees { totalCount }
        closedByPullRequestsReferences(first: 1, includeClosedPrs: false) { totalCount }
        labels(first: $labels) { nodes { name color } }
        repository {
          databaseId name url description homepageUrl pushedAt createdAt
          isArchived isPrivate hasIssuesEnabled stargazerCount forkCount
          owner { login avatarUrl }
          primaryLanguage { name }
          licenseInfo { spdxId name }
          repositoryTopics(first: $topics) { nodes { topic { name } } }
          issues(states: OPEN) { totalCount }
          pullRequests(states: OPEN) { totalCount }
        }
      }
    }
  }
}`;
