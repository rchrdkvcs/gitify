import { defineConfig } from "@foadonis/openapi";

export default defineConfig({
  ui: "scalar",
  tagger: () => [],
  document: {
    info: {
      title: "Gitify API",
      version: "1.0.0",
      description:
        "API REST de Gitify – découvrez des dépôts GitHub correspondant à vos intérêts et à votre niveau. L'authentification est basée sur les sessions via GitHub OAuth.",
    },
    components: {
      securitySchemes: {
        cookie: {
          type: "apiKey",
          in: "cookie",
          name: "adonis-session",
          description:
            "Cookie de session obtenu après avoir effectué le flux OAuth GitHub (`GET /auth/github/redirect`).",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentification et gestion de session via GitHub OAuth" },
      { name: "Preferences", description: "Préférences du fil utilisateur (difficulté, langages)" },
      { name: "Projects", description: "Découverte de projets, fil et interactions" },
    ],
  },
});
