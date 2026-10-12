import '@adonisjs/inertia/types'

import type { VNodeProps, AllowedComponentProps, ComponentInstance } from 'vue'

type ExtractProps<T> = Omit<
  ComponentInstance<T>['$props'],
  keyof VNodeProps | keyof AllowedComponentProps
>

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'community': ExtractProps<(typeof import('../../inertia/pages/community.vue'))['default']>
    'explore': ExtractProps<(typeof import('../../inertia/pages/explore.vue'))['default']>
    'favorites': ExtractProps<(typeof import('../../inertia/pages/favorites.vue'))['default']>
    'index': ExtractProps<(typeof import('../../inertia/pages/index.vue'))['default']>
    'preferences': ExtractProps<(typeof import('../../inertia/pages/preferences.vue'))['default']>
    'profil': ExtractProps<(typeof import('../../inertia/pages/profil.vue'))['default']>
    'projects/show': ExtractProps<(typeof import('../../inertia/pages/projects/show.vue'))['default']>
    'ressources': ExtractProps<(typeof import('../../inertia/pages/ressources.vue'))['default']>
  }
}
