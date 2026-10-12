import { beforeCreate, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { Difficulty } from "#shared/types/index";
import { ProjectSearchMembershipSchema } from "#database/schema";

export default class ProjectSearchMembership extends ProjectSearchMembershipSchema {
  @column()
  declare difficulty: Difficulty;

  @beforeCreate()
  static generateId(model: ProjectSearchMembership) {
    model.id = ulid();
  }
}
