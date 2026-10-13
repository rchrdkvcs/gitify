import type { ModelQueryBuilderContract } from "@adonisjs/lucid/types/model";
import type { Difficulty } from "#shared/types/index";
import Project from "#models/project";

type ProjectQuery = ModelQueryBuilderContract<typeof Project>;

export type ListingCriteria = { languages: string[]; level: Difficulty | "all" };

function excludeArchived(query: ProjectQuery): ProjectQuery {
  return query.whereRaw("coalesce((insights->>'isArchived')::boolean, false) = false");
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

export function reachableProject(ownerName: string, name: string): Promise<Project | null> {
  return Project.query()
    .whereRaw("lower(owner_name) = ?", [ownerName.toLowerCase()])
    .whereRaw("lower(name) = ?", [name.toLowerCase()])
    .orderBy("stars", "desc")
    .first();
}
