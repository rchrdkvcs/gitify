import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')

router.get('/', () => {
  return { message: 'API is running' }
})
router.get('/auth/github/redirect', [AuthController, 'redirect'])
router.get('/auth/github/callback', [AuthController, 'callback'])
