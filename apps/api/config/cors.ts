import env from "#start/env";
import { defineConfig } from "@adonisjs/cors";

/**
 * CORS Configuration for GitMatch Backend.
 * Crucial for allowing the Nuxt frontend to communicate with the Adonis API
 * while securely transmitting HTTP-Only cookies.
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: [env.get("FRONTEND_URL")],
  methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
