import type { NextFn } from "@adonisjs/core/types/http";
import { HttpContext } from "@adonisjs/core/http";
import { Logger } from "@adonisjs/core/logger";

export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    ctx.containerResolver.bindValue(HttpContext, ctx);
    ctx.containerResolver.bindValue(Logger, ctx.logger);

    return next();
  }
}
