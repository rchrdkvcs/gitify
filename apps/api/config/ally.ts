import env from "#start/env";
import { defineConfig, services } from "@adonisjs/ally";
import { type InferSocialProviders } from "@adonisjs/ally/types";

/**
 * AdonisJS Ally Configuration
 * Defines the authentication providers (e.g., GitHub) and their credentials.
 */
const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get("GITHUB_CLIENT_ID"),
    clientSecret: env.get("GITHUB_CLIENT_SECRET"),
    callbackUrl: env.get("GITHUB_CALLBACK_URL"),
  }),
});

export default allyConfig;

declare module "@adonisjs/ally/types" {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
