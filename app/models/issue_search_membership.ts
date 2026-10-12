import { beforeCreate, column } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import type { IssueKind } from "#shared/types/index";
import { IssueSearchMembershipSchema } from "#database/schema";

export default class IssueSearchMembership extends IssueSearchMembershipSchema {
  @column()
  declare kind: IssueKind;

  @beforeCreate()
  static generateId(model: IssueSearchMembership) {
    model.id = ulid();
  }
}
