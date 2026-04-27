import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

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
    router.post("/logout", [controllers.Auth, "logout"]);
    router.put("/preferences", [controllers.Preferences, "update"]);
  })
  .prefix("/auth")
  .use(middleware.auth());

// Public project routes (no auth required)
router.get("/projects/showcase", [controllers.Project, "showcase"]);

router
  .group(() => {
    router.get("/feed", [controllers.Project, "feed"]);
    router.get("/liked", [controllers.Project, "liked"]);
    router.get("/:id", [controllers.Project, "show"]);
    router.post("/:id/like", [controllers.Project, "like"]);
    router.post("/:id/pass", [controllers.Project, "pass"]);
  })
  .prefix("/projects")
  .use(middleware.auth());
