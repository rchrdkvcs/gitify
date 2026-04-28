import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { ContributorSchema } from "#database/schema";
import Project from "#models/project";
import { beforeCreate, belongsTo } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export default class Contributor extends ContributorSchema {
  @beforeCreate()
  static generateId(model: ContributorSchema) {
    model.id = ulid();
  }

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;
}
