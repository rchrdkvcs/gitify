import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'openapi.html': { paramsTuple?: []; params?: {} }
    'openapi.json': { paramsTuple?: []; params?: {} }
    'openapi.yaml': { paramsTuple?: []; params?: {} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'preferences.update': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.favorites': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.add_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.remove_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'openapi.html': { paramsTuple?: []; params?: {} }
    'openapi.json': { paramsTuple?: []; params?: {} }
    'openapi.yaml': { paramsTuple?: []; params?: {} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.favorites': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'openapi.html': { paramsTuple?: []; params?: {} }
    'openapi.json': { paramsTuple?: []; params?: {} }
    'openapi.yaml': { paramsTuple?: []; params?: {} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.favorites': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'auth.logout': { paramsTuple?: []; params?: {} }
    'project.remove_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'preferences.update': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'project.add_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}