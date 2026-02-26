declare module '@ioc:Adonis/Addons/Ally' {
import {GithubDriverConfig} from "@adonisjs/ally/types";

  interface SocialProviders {
    github: {
      config: GithubDriverConfig
      implementation: GithubDriverContract
    }
  }
}
