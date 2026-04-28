import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { ContributorSchema } from "#database/schema";
import Project from "#models/project";
import { belongsTo } from "@adonisjs/lucid/orm";

export default class Contributor extends ContributorSchema {
  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;
}
