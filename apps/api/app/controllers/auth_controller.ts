import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use('github').redirect()
  }

  async callback({ ally, response }: HttpContext) {
    const github = ally.use('github')

    if (github.accessDenied() || github.stateMisMatch() || github.hasError()) {
      return response.badRequest('GitHub authentication failed')
    }

    const githubUser = await github.user()

    const user = await User.firstOrCreate({
      email: githubUser.email,
    }, {
      name: githubUser.name,
      accessToken: githubUser.token.token,
      isVerified: githubUser.emailVerificationState === 'verified'
    })

    return response.ok({ message: 'Successfully logged in', user })
  }
}
