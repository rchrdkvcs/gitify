import { BaseTransformer } from "@adonisjs/core/transformers";
import type ProjectIssue from "#models/project_issue";
import type { FeedIssue } from "#shared/types/index";
import { issueSignals } from "#shared/issues";

export default class IssueTransformer extends BaseTransformer<ProjectIssue> {
  toObject(): FeedIssue {
    const issue = this.resource;
    const project = issue.project;
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.url,
      createdAt: issue.githubCreatedAt?.toISO() ?? null,
      comments: issue.commentsCount,
      labels: issue.labels,
      isAssigned: issue.assigneesCount > 0,
      ...issueSignals(issue.labels),
      project: {
        id: project.id,
        name: project.name,
        ownerName: project.ownerName,
        ownerAvatarUrl: project.avatarUrl,
        language: project.language,
        stars: project.stars,
      },
    };
  }
}
