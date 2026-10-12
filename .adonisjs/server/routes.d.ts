import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'pages.home': { paramsTuple?: []; params?: {} }
    'pages.explore': { paramsTuple?: []; params?: {} }
    'pages.issues': { paramsTuple?: []; params?: {} }
    'pages.project': { paramsTuple: [ParamValue,ParamValue]; params: {'owner': ParamValue,'name': ParamValue} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'pages.favorites': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple?: []; params?: {} }
    'onboarding.complete': { paramsTuple?: []; params?: {} }
    'onboarding.skip': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'preferences.update': { paramsTuple?: []; params?: {} }
    'project.add_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'project.remove_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.progress': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'pages.home': { paramsTuple?: []; params?: {} }
    'pages.explore': { paramsTuple?: []; params?: {} }
    'pages.issues': { paramsTuple?: []; params?: {} }
    'pages.project': { paramsTuple: [ParamValue,ParamValue]; params: {'owner': ParamValue,'name': ParamValue} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'pages.favorites': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'pages.home': { paramsTuple?: []; params?: {} }
    'pages.explore': { paramsTuple?: []; params?: {} }
    'pages.issues': { paramsTuple?: []; params?: {} }
    'pages.project': { paramsTuple: [ParamValue,ParamValue]; params: {'owner': ParamValue,'name': ParamValue} }
    'auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.callback': { paramsTuple?: []; params?: {} }
    'pages.favorites': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'onboarding.complete': { paramsTuple?: []; params?: {} }
    'preferences.update': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'onboarding.skip': { paramsTuple?: []; params?: {} }
    'project.add_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'auth.logout': { paramsTuple?: []; params?: {} }
    'project.remove_favorite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'onboarding.progress': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}