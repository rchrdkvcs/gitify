import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { UserProjectInteractionSchema } from "#database/schema";
import Project from "#models/project";
import User from "#models/user";
import { belongsTo, column } from "@adonisjs/lucid/orm";

export default class UserProjectInteraction extends UserProjectInteractionSchema {
  @column()
  declare type: "liked" | "passed";

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;
}
