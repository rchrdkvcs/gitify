import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { beforeCreate, belongsTo, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { RepositoryLabel } from "#shared/types/index";
import { ProjectIssueSchema } from "#database/schema";
import Project from "#models/project";

export default class ProjectIssue extends ProjectIssueSchema {
  @beforeCreate()
  static generateId(model: ProjectIssue) {
    model.id = ulid();
  }

  @column({
    prepare: (value: RepositoryLabel[]) => JSON.stringify(value),
  })
  declare labels: RepositoryLabel[];

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;
}
