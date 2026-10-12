import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import BaseInertiaMiddleware from "@adonisjs/inertia/inertia_middleware";
import UserTransformer from "#transformers/user_transformer";

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    const { auth } = ctx as Partial<HttpContext>;
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      user: ctx.inertia.always(auth?.user ? UserTransformer.transform(auth.user) : null),
    };
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx);
    const output = await next();
    this.dispose(ctx);
    return output;
  }
}

declare module "@adonisjs/inertia/types" {
  interface SharedProps extends InferSharedProps<InertiaMiddleware> {}
}
