import { defineConfig, services } from '@adonisjs/ally'
import env from '#start/env'
import {InferSocialProviders} from "@adonisjs/ally/types";

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID'),
    clientSecret: env.get('GITHUB_CLIENT_SECRET'),
    callbackUrl: 'http://localhost:3333/auth/github/callback',
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
