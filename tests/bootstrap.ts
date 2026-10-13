import type { Config } from "@japa/runner/types";
import { authApiClient } from "@adonisjs/auth/plugins/api_client";
import app from "@adonisjs/core/services/app";
import testUtils from "@adonisjs/core/services/test_utils";
import { inertiaApiClient } from "@adonisjs/inertia/plugins/api_client";
import { sessionApiClient } from "@adonisjs/session/plugins/api_client";
import { shieldApiClient } from "@adonisjs/shield/plugins/api_client";
import { apiClient } from "@japa/api-client";
import { assert } from "@japa/assert";
import { pluginAdonisJS } from "@japa/plugin-adonisjs";

export const plugins: Config["plugins"] = [
  assert(),
  apiClient(),
  pluginAdonisJS(app),
  sessionApiClient(app),
  authApiClient(app),
  shieldApiClient(),
  inertiaApiClient(app),
];

export const runnerHooks: Required<Pick<Config, "setup" | "teardown">> = {
  setup: [],
  teardown: [],
};

export const configureSuite: Config["configureSuite"] = (suite) => {
  if (["browser", "functional", "e2e"].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start());
  }
};
