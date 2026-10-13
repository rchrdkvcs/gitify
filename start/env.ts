import { Env } from "@adonisjs/core/env";

export default await Env.create(new URL("../", import.meta.url), {
  NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: "host" }),
  LOG_LEVEL: Env.schema.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),

  DB_HOST: Env.schema.string({ format: "host" }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  SESSION_DRIVER: Env.schema.enum(["cookie", "memory"] as const),

  GITHUB_CLIENT_ID: Env.schema.string(),
  GITHUB_CLIENT_SECRET: Env.schema.string(),
  GITHUB_CALLBACK_URL: Env.schema.string(),

  GITHUB_SERVER_TOKEN: Env.schema.string.optional(),
});
