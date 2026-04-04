import {HttpContext} from "@adonisjs/core/http";
import UserProjectInteraction from "#models/user_project_interaction";
import Project from "#models/project";
import GitHubService from "#services/git_hub_service";

export default class ProjectController {

  async feed({ auth, response }: HttpContext) {
    const user = auth.user!
    const preferences = user.preferences

    if (!preferences) {
      return response.badRequest({ error: 'User preferences not set' })
    }

    const { difficulty, languages } = preferences

    const interactions = await UserProjectInteraction.query()
      .where('userId', user.id)
      .select('projectId')

    // interactions is an object create by lucid we need to extract projectId
    const seenIds = interactions.map((i) => Number(i.projectId))

    const countResult = await Project.query()
      .where('difficulty', difficulty)
      .whereIn('language', languages)
      .whereNotIn('id', seenIds.length > 0 ? seenIds : [-1])
      .count('* as total')

    const available = (Number(countResult[0].$extras.total))

    if (available < this.FEED_FETCH_THRESHOLD) {
      for (const language of languages) {
        const needsFetch = await GitHubService.needsFetch(language, difficulty)
        if (needsFetch) {
          // TODO : make an async call to fetch x language in same time
          await GitHubService.fetchAndStore(language, difficulty, user.accessToken)
        }
      }
    }

    const projectsPerLanguage = await Promise.all(
      languages.map((language) => {
        return Project.query()
          .where('difficulty', difficulty)
          .where('language', language)
          .whereNotIn('id', seenIds.length > 0 ? seenIds : [-1])
          .orderBy('stars', 'desc')
          .limit(20)
      }))

    // Round Robin — alternate languages
    const projects = []

    const maxLength = Math.max(...projectsPerLanguage.map((project) => project.length))

    for (let i = 0; i < maxLength; i++) {
      for (const languageProject of projectsPerLanguage) {
        if (languageProject[i]) {
          projects.push(languageProject[i])
          if (projects.length === 20) break
        }
      }
      if (projects.length === 20) break
    }

    return response.ok({ projects, available })
  }

  private readonly FEED_FETCH_THRESHOLD = 25

  async liked({ auth, response }: HttpContext) {
    const user = auth.user!

    const liked = await UserProjectInteraction.query()
      .where('userId', user.id)
      .where('type', 'liked')
      .preload('project')

    const projects = liked.map((liked) => liked.project)

    return response.ok({ projects })
  }

  async like({ auth, params, response }: HttpContext) {
    const user = auth.user!

    await UserProjectInteraction.updateOrCreate(
      { userId: user.id, projectId: Number(params.id) },
      { type: 'liked' }
    )

    return response.ok({ message: 'Liked' })
  }

  async pass({ auth, params, response }: HttpContext) {
    const user = auth.user!

    await UserProjectInteraction.updateOrCreate(
      { userId: user.id, projectId: Number(params.id) },
      { type: 'passed' }
    )

    return response.ok({ message: 'Passed' })
  }
}
