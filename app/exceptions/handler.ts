import { ExceptionHandler, type HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import OAuthCallbackException from "#exceptions/oauth_callback_exception";
import UserFacingException from "#exceptions/user_facing_exception";

type HttpError = ReturnType<ExceptionHandler["toHttpError"]>;

const messagesByStatus: Record<number, string> = {
  401: "Connecte-toi pour continuer.",
  403: "Tu n'as pas accès à cette ressource.",
  404: "Cette page n'existe pas ou n'existe plus.",
  429: "Trop de requêtes. Réessaie dans quelques instants.",
};
const unexpectedErrorMessage =
  "Une erreur inattendue est survenue. Réessaie dans quelques instants.";

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction;

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof OAuthCallbackException) {
      ctx.session.flash("error", error.message);
      return ctx.response.redirect("/");
    }

    const httpError = this.toHttpError(error);
    if (this.isOwnedByFramework(httpError)) {
      return super.handle(error, ctx);
    }
    if (this.expectsJson(ctx)) {
      return ctx.response.status(httpError.status).send({
        error: { code: this.codeOf(httpError), message: this.publicMessageOf(httpError) },
      });
    }
    if (!ctx.inertia || (httpError.status >= 500 && this.isDebuggingEnabled(ctx))) {
      return super.handle(error, ctx);
    }
    return this.renderErrorPage(httpError, ctx);
  }

  protected shouldReport(error: HttpError) {
    if (error instanceof UserFacingException && error.status < 500) {
      return false;
    }
    return super.shouldReport(error);
  }

  private isOwnedByFramework(error: HttpError) {
    return typeof error.handle === "function" || error.code === "E_VALIDATION_ERROR";
  }

  private expectsJson(ctx: HttpContext) {
    return (
      ctx.request.url().startsWith("/api/") || ctx.request.accepts(["html", "json"]) === "json"
    );
  }

  private codeOf(error: HttpError) {
    if (error.status >= 500) {
      return "E_INTERNAL_ERROR";
    }
    return error.code ?? "E_HTTP_ERROR";
  }

  private publicMessageOf(error: HttpError) {
    if (error instanceof UserFacingException) {
      return error.message;
    }
    return messagesByStatus[error.status] ?? unexpectedErrorMessage;
  }

  private async renderErrorPage(error: HttpError, ctx: HttpContext) {
    const page =
      error.status === 404
        ? await ctx.inertia.render("errors/not_found", { message: this.publicMessageOf(error) })
        : await ctx.inertia.render("errors/error", {
            status: error.status,
            message: this.publicMessageOf(error),
          });
    return ctx.response.status(error.status).send(page);
  }
}
