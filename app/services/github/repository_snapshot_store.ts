import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import { ulid } from "ulid";
import type { RepositorySnapshot } from "#services/github/github_adapter";
import Contributor from "#models/contributor";
import Project from "#models/project";
import { computeNewcomerScore, newcomerScoreInputFromInsights } from "#shared/newcomer_score";

export async function storeRepositorySnapshot(
  projectId: Project["id"],
  snapshot: RepositorySnapshot,
  fetchedAt: DateTime,
): Promise<void> {
  const { insights, repository, contributors } = snapshot;
  const { score, ...scoreBreakdown } = computeNewcomerScore(
    newcomerScoreInputFromInsights(insights, repository.pushedAt),
    fetchedAt.toJSDate(),
  );

  await db.transaction(async (trx) => {
    const stored = await Project.query({ client: trx })
      .where("id", projectId)
      .forUpdate()
      .firstOrFail();
    stored.merge({
      readme: snapshot.readme,
      languages: snapshot.languages,
      latestRelease: snapshot.latestRelease,
      totalContributorsCount: snapshot.totalContributorsCount,
      insights,
      isArchived: insights.isArchived,
      newcomerScore: score,
      newcomerScoreDetails: scoreBreakdown,
      contributing: snapshot.contributing,
      stars: repository.stars,
      forksCount: repository.forksCount,
      ownerAvatarUrl: repository.ownerAvatarUrl,
      homepageUrl: repository.homepageUrl,
      license: repository.license,
      pushedAt: repository.pushedAt ? DateTime.fromISO(repository.pushedAt) : stored.pushedAt,
      githubCreatedAt: DateTime.fromISO(repository.createdAt),
      detailsFetchedAt: fetchedAt,
      detailsRetryAfter: null,
    });
    await stored.save();

    const previousContributors = Contributor.query({ client: trx }).where("projectId", projectId);
    if (contributors.length > 0) {
      previousContributors.whereNotIn(
        "githubUserId",
        contributors.map((contributor) => contributor.id),
      );
    }
    await previousContributors.delete();

    if (contributors.length === 0) {
      return;
    }
    const writtenAt = fetchedAt.toJSDate();
    await trx
      .insertQuery()
      .table(Contributor.table)
      .knexQuery.insert(
        contributors.map((contributor) => ({
          id: ulid(),
          project_id: projectId,
          github_user_id: contributor.id,
          login: contributor.login,
          avatar_url: contributor.avatarUrl,
          profile_url: contributor.profileUrl,
          contributions: contributor.contributions,
          created_at: writtenAt,
          updated_at: writtenAt,
        })),
      )
      .onConflict(["project_id", "github_user_id"])
      .merge(["login", "avatar_url", "profile_url", "contributions", "updated_at"]);
  });
}

export async function postponeRepositorySnapshot(
  projectId: Project["id"],
  retryAfter: DateTime,
): Promise<void> {
  await Project.query().where("id", projectId).update({ detailsRetryAfter: retryAfter.toJSDate() });
}
