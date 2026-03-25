import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const AuthController = () => import("#controllers/auth_controller");

// Health Check
router.get("/", () => {
  return { message: "API is running" };
});

// Authentication Routes (Public)
router
  .group(() => {
    router.get("/github/redirect", [AuthController, "redirect"]);
    router.get("/github/callback", [AuthController, "callback"]);
  })
  .prefix("/auth");

// Protected API Routes (Requires valid cookie session)
router
  .group(() => {
    router.get("/me", [AuthController, "me"]);
    router.post("/logout", [AuthController, "logout"]);
  })
  .prefix("/auth")
  .use(middleware.auth({ guards: ["api"] }));
