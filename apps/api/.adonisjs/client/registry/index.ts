/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'openapi.html': {
    methods: ["GET","HEAD"],
    pattern: '/docs',
    tokens: [{"old":"/docs","type":0,"val":"docs","end":""}],
    types: placeholder as Registry['openapi.html']['types'],
  },
  'openapi.json': {
    methods: ["GET","HEAD"],
    pattern: '/docs.json',
    tokens: [{"old":"/docs.json","type":0,"val":"docs.json","end":""}],
    types: placeholder as Registry['openapi.json']['types'],
  },
  'openapi.yaml': {
    methods: ["GET","HEAD"],
    pattern: '/docs.yaml',
    tokens: [{"old":"/docs.yaml","type":0,"val":"docs.yaml","end":""}],
    types: placeholder as Registry['openapi.yaml']['types'],
  },
  'auth.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/auth/github/redirect',
    tokens: [{"old":"/auth/github/redirect","type":0,"val":"auth","end":""},{"old":"/auth/github/redirect","type":0,"val":"github","end":""},{"old":"/auth/github/redirect","type":0,"val":"redirect","end":""}],
    types: placeholder as Registry['auth.redirect']['types'],
  },
  'auth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/auth/github/callback',
    tokens: [{"old":"/auth/github/callback","type":0,"val":"auth","end":""},{"old":"/auth/github/callback","type":0,"val":"github","end":""},{"old":"/auth/github/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['auth.callback']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/auth/me',
    tokens: [{"old":"/auth/me","type":0,"val":"auth","end":""},{"old":"/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.logout': {
    methods: ["DELETE"],
    pattern: '/auth/logout',
    tokens: [{"old":"/auth/logout","type":0,"val":"auth","end":""},{"old":"/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'preferences.update': {
    methods: ["PUT"],
    pattern: '/auth/preferences',
    tokens: [{"old":"/auth/preferences","type":0,"val":"auth","end":""},{"old":"/auth/preferences","type":0,"val":"preferences","end":""}],
    types: placeholder as Registry['preferences.update']['types'],
  },
  'project.showcase': {
    methods: ["GET","HEAD"],
    pattern: '/projects/showcase',
    tokens: [{"old":"/projects/showcase","type":0,"val":"projects","end":""},{"old":"/projects/showcase","type":0,"val":"showcase","end":""}],
    types: placeholder as Registry['project.showcase']['types'],
  },
  'project.feed': {
    methods: ["GET","HEAD"],
    pattern: '/projects/feed',
    tokens: [{"old":"/projects/feed","type":0,"val":"projects","end":""},{"old":"/projects/feed","type":0,"val":"feed","end":""}],
    types: placeholder as Registry['project.feed']['types'],
  },
  'project.favorites': {
    methods: ["GET","HEAD"],
    pattern: '/projects/favorites',
    tokens: [{"old":"/projects/favorites","type":0,"val":"projects","end":""},{"old":"/projects/favorites","type":0,"val":"favorites","end":""}],
    types: placeholder as Registry['project.favorites']['types'],
  },
  'project.show': {
    methods: ["GET","HEAD"],
    pattern: '/projects/:id',
    tokens: [{"old":"/projects/:id","type":0,"val":"projects","end":""},{"old":"/projects/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['project.show']['types'],
  },
  'project.add_favorite': {
    methods: ["POST"],
    pattern: '/projects/:id/favorite',
    tokens: [{"old":"/projects/:id/favorite","type":0,"val":"projects","end":""},{"old":"/projects/:id/favorite","type":1,"val":"id","end":""},{"old":"/projects/:id/favorite","type":0,"val":"favorite","end":""}],
    types: placeholder as Registry['project.add_favorite']['types'],
  },
  'project.remove_favorite': {
    methods: ["DELETE"],
    pattern: '/projects/:id/favorite',
    tokens: [{"old":"/projects/:id/favorite","type":0,"val":"projects","end":""},{"old":"/projects/:id/favorite","type":1,"val":"id","end":""},{"old":"/projects/:id/favorite","type":0,"val":"favorite","end":""}],
    types: placeholder as Registry['project.remove_favorite']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
