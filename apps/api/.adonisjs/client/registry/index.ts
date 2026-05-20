/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
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
  'project.liked': {
    methods: ["GET","HEAD"],
    pattern: '/projects/liked',
    tokens: [{"old":"/projects/liked","type":0,"val":"projects","end":""},{"old":"/projects/liked","type":0,"val":"liked","end":""}],
    types: placeholder as Registry['project.liked']['types'],
  },
  'project.show': {
    methods: ["GET","HEAD"],
    pattern: '/projects/:id',
    tokens: [{"old":"/projects/:id","type":0,"val":"projects","end":""},{"old":"/projects/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['project.show']['types'],
  },
  'project.like': {
    methods: ["POST"],
    pattern: '/projects/:id/like',
    tokens: [{"old":"/projects/:id/like","type":0,"val":"projects","end":""},{"old":"/projects/:id/like","type":1,"val":"id","end":""},{"old":"/projects/:id/like","type":0,"val":"like","end":""}],
    types: placeholder as Registry['project.like']['types'],
  },
  'project.pass': {
    methods: ["POST"],
    pattern: '/projects/:id/pass',
    tokens: [{"old":"/projects/:id/pass","type":0,"val":"projects","end":""},{"old":"/projects/:id/pass","type":1,"val":"id","end":""},{"old":"/projects/:id/pass","type":0,"val":"pass","end":""}],
    types: placeholder as Registry['project.pass']['types'],
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
