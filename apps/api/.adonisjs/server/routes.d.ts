import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'preferences.update': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.liked': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.like': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.pass': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.liked': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'project.showcase': { paramsTuple?: []; params?: {} }
    'project.feed': { paramsTuple?: []; params?: {} }
    'project.liked': { paramsTuple?: []; params?: {} }
    'project.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'auth.logout': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'preferences.update': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'project.like': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.pass': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}