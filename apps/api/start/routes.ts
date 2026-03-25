import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

router.get("/", () => {
  return { message: "API is running" };
});

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
  .use(middleware.auth({ guards: ["api"] }));
