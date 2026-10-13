import type { ModelQueryBuilderContract } from "@adonisjs/lucid/types/model";
import type { Difficulty } from "#shared/types/index";
import Project from "#models/project";

type ProjectQuery = ModelQueryBuilderContract<typeof Project>;

export type ListingCriteria = { languages: string[]; level: Difficulty | "all" };

export const projectCardColumns = [
  "id",
  "name",
  "owner_name",
  "owner_avatar_url",
  "description",
  "repository_url",
  "stars",
  "forks_count",
  "open_issues_count",
  "language",
  "topics",
  "difficulty",
  "latest_release",
  "pushed_at",
  "newcomer_score",
  "newcomer_score_details",
  "total_contributors_count",
  "details_fetched_at",
];

function excludeArchived(query: ProjectQuery): ProjectQuery {
  return query.where("isArchived", false);
}

function requireSearchMembership(query: ProjectQuery, criteria: ListingCriteria): ProjectQuery {
  return query.whereExists((membership) => {
    membership
      .from("project_search_memberships")
      .select("id")
      .whereColumn("project_search_memberships.project_id", "projects.id");
    if (criteria.languages.length) {
      membership.whereIn(
        "project_search_memberships.language",
        criteria.languages.map((language) => language.toLowerCase()),
      );
    }
    if (criteria.level !== "all") {
      membership.where("project_search_memberships.difficulty", criteria.level);
    }
  });
}

export function listedProjects(criteria: ListingCriteria): ProjectQuery {
  return requireSearchMembership(excludeArchived(Project.query()), criteria);
}

export function listedProjectCards(criteria: ListingCriteria): ProjectQuery {
  return listedProjects(criteria).select(projectCardColumns);
}

export function reachableProject(ownerName: string, name: string): Promise<Project | null> {
  return Project.query()
    .whereRaw("lower(owner_name) = ?", [ownerName.toLowerCase()])
    .whereRaw("lower(name) = ?", [name.toLowerCase()])
    .orderBy("stars", "desc")
    .first();
}
