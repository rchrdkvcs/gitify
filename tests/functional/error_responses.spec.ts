import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import User from "#models/user";

const unknownProjectId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

test.group("Error responses", (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("renders the Inertia not found page for an unknown project", async ({ client }) => {
    const response = await client.get("/projects/gitify/unknown-repo").withInertia();
    response.assertStatus(404);
    response.assertInertiaComponent("errors/not_found");
    response.assertInertiaPropsContains({ message: "Projet introuvable." });
  });

  test("renders the not found page as a full document on a first visit", async ({ client }) => {
    const response = await client.get("/projects/gitify/unknown-repo");
    response.assertStatus(404);
    response.assertHeader("content-type", "text/html; charset=utf-8");
    response.assertTextIncludes("Rien à explorer ici");
  });

  test("renders the Inertia not found page for an unknown route", async ({ client }) => {
    const response = await client.get("/does-not-exist").withInertia();
    response.assertStatus(404);
    response.assertInertiaComponent("errors/not_found");
  });

  test("answers a favorite on an unknown project with a French JSON error", async ({ client }) => {
    const user = await User.create({ email: "errors@example.com", name: "Errors" });
    for (const method of ["post", "delete"] as const) {
      const response = await client[method](`/api/projects/${unknownProjectId}/favorite`)
        .loginAs(user)
        .withCsrfToken()
        .header("accept", "application/json");
      response.assertStatus(404);
      response.assertBody({
        error: { code: "E_PROJECT_NOT_FOUND", message: "Projet introuvable." },
      });
    }
  });

  test("answers an unknown API route with a French JSON error", async ({ client }) => {
    const response = await client.get("/api/unknown").header("accept", "application/json");
    response.assertStatus(404);
    response.assertBody({
      error: {
        code: "E_ROUTE_NOT_FOUND",
        message: "Cette page n'existe pas ou n'existe plus.",
      },
    });
  });
});
