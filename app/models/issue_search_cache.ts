import { beforeCreate } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";
import { IssueSearchCacheSchema } from "#database/schema";

export default class IssueSearchCache extends IssueSearchCacheSchema {
  @beforeCreate()
  static generateId(model: IssueSearchCacheSchema) {
    model.id = ulid();
  }
}
