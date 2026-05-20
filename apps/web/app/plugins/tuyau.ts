import { registry } from "@gitify/api/registry";
import { createTuyau } from "@tuyau/core/client";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const tuyau = createTuyau({
    baseUrl: config.public.apiBaseUrl || "http://localhost:3333",
    registry,
    credentials: "include",
    headers: useRequestHeaders(["cookie"]),
  });

  return {
    provide: {
      tuyau,
    },
  };
});
