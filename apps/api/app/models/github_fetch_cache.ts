import { GithubFetchCacheSchema } from "#database/schema";
import { beforeCreate } from "@adonisjs/lucid/orm";
import { ulid } from "ulid";

export default class GithubFetchCache extends GithubFetchCacheSchema {
  @beforeCreate()
  static generateId(model: GithubFetchCacheSchema) {
    model.id = ulid();
  }
}
