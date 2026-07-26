import { test } from "@japa/runner";

test.group("CORS", () => {
  test("allows credentialed requests from the configured frontend", async ({ client }) => {
    const response = await client
      .options("/auth/me")
      .header("Origin", process.env.FRONTEND_URL!)
      .header("Access-Control-Request-Method", "GET");

    response.assertStatus(204);
    response.assertHeader("access-control-allow-origin", process.env.FRONTEND_URL!);
    response.assertHeader("access-control-allow-credentials", "true");
  });
});
