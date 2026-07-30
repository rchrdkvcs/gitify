import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { UserProjectFavoriteSchema } from "#database/schema";
import Project from "#models/project";
import User from "#models/user";
import { beforeCreate, belongsTo } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export default class UserProjectFavorite extends UserProjectFavoriteSchema {
  @beforeCreate()
  static generateId(model: UserProjectFavoriteSchema) {
    model.id = ulid();
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;
}
