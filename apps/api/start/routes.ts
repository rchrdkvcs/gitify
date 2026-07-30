import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
import openapi from "@foadonis/openapi/services/main";

openapi.registerRoutes("/docs");

// Authentication Routes (Public)
router
  .group(() => {
    router.get("/github/redirect", [controllers.Auth, "redirect"]);
    router.get("/github/callback", [controllers.Auth, "callback"]);
  })
  .prefix("/auth");

// Protected API Routes (Requires valid cookie session)
router
  .group(() => {
    router.get("/me", [controllers.Auth, "me"]);
    router.delete("/logout", [controllers.Auth, "logout"]);
    router.put("/preferences", [controllers.Preferences, "update"]);
  })
  .prefix("/auth")
  .use(middleware.auth());

// Public project routes (no auth required)
router.get("/projects/showcase", [controllers.Project, "showcase"]);

router
  .group(() => {
    router.get("/feed", [controllers.Project, "feed"]);
    router.get("/favorites", [controllers.Project, "favorites"]);
    router.get("/:id", [controllers.Project, "show"]);
    router.post("/:id/favorite", [controllers.Project, "addFavorite"]);
    router.delete("/:id/favorite", [controllers.Project, "removeFavorite"]);
  })
  .prefix("/projects")
  .use(middleware.auth());
