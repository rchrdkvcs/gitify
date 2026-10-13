import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
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
  const newcomerScore = computeNewcomerScore(
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
      newcomerScore: newcomerScore.score,
      newcomerScoreDetails: newcomerScore,
      contributing: snapshot.contributing,
      stars: repository.stars,
      forksCount: repository.forksCount,
      ownerAvatarUrl: repository.ownerAvatarUrl,
      homepageUrl: repository.homepageUrl,
      license: repository.license,
      pushedAt: repository.pushedAt ? DateTime.fromISO(repository.pushedAt) : stored.pushedAt,
      githubCreatedAt: DateTime.fromISO(repository.createdAt),
      detailsFetchedAt: fetchedAt,
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

    for (const contributor of contributors) {
      await Contributor.updateOrCreate(
        { projectId, githubUserId: contributor.id },
        {
          login: contributor.login,
          avatarUrl: contributor.avatarUrl,
          profileUrl: contributor.profileUrl,
          contributions: contributor.contributions,
        },
        { client: trx },
      );
    }
  });
}
