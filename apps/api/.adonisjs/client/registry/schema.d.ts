/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type {
  ExtractBody,
  ExtractErrorResponse,
  ExtractQuery,
  ExtractQueryForGet,
  ExtractResponse,
} from "@tuyau/core/types";
import type { InferInput, SimpleError } from "@vinejs/vine/types";

export type ParamValue = string | number | bigint | boolean;

export interface Registry {
  "openapi.html": {
    methods: ["GET", "HEAD"];
    pattern: "/docs";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  "openapi.json": {
    methods: ["GET", "HEAD"];
    pattern: "/docs.json";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  "openapi.yaml": {
    methods: ["GET", "HEAD"];
    pattern: "/docs.yaml";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  "auth.redirect": {
    methods: ["GET", "HEAD"];
    pattern: "/auth/github/redirect";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["redirect"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["redirect"]>>
      >;
    };
  };
  "auth.callback": {
    methods: ["GET", "HEAD"];
    pattern: "/auth/github/callback";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["callback"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["callback"]>>
      >;
    };
  };
  "auth.me": {
    methods: ["GET", "HEAD"];
    pattern: "/auth/me";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["me"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["me"]>>
      >;
    };
  };
  "auth.logout": {
    methods: ["DELETE"];
    pattern: "/auth/logout";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["logout"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/auth_controller").default["logout"]>>
      >;
    };
  };
  "preferences.update": {
    methods: ["PUT"];
    pattern: "/auth/preferences";
    types: {
      body: ExtractBody<
        InferInput<
          typeof import("#validators/update_preferences_validator").updatePreferencesValidator
        >
      >;
      paramsTuple: [];
      params: {};
      query: ExtractQuery<
        InferInput<
          typeof import("#validators/update_preferences_validator").updatePreferencesValidator
        >
      >;
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/preferences_controller").default["update"]>>
      >;
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import("#controllers/preferences_controller").default["update"]>>
          >
        | { status: 422; response: { errors: SimpleError[] } };
    };
  };
  "project.showcase": {
    methods: ["GET", "HEAD"];
    pattern: "/projects/showcase";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["showcase"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["showcase"]>>
      >;
    };
  };
  "project.feed": {
    methods: ["GET", "HEAD"];
    pattern: "/projects/feed";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["feed"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["feed"]>>
      >;
    };
  };
  "project.liked": {
    methods: ["GET", "HEAD"];
    pattern: "/projects/liked";
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["liked"]>>
      >;
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["liked"]>>
      >;
    };
  };
  "project.show": {
    methods: ["GET", "HEAD"];
    pattern: "/projects/:id";
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: ExtractQueryForGet<
        InferInput<typeof import("#validators/project_id_validator").projectIdValidator>
      >;
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["show"]>>
      >;
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import("#controllers/project_controller").default["show"]>>
          >
        | { status: 422; response: { errors: SimpleError[] } };
    };
  };
  "project.like": {
    methods: ["POST"];
    pattern: "/projects/:id/like";
    types: {
      body: ExtractBody<
        InferInput<typeof import("#validators/project_id_validator").projectIdValidator>
      >;
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: ExtractQuery<
        InferInput<typeof import("#validators/project_id_validator").projectIdValidator>
      >;
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["like"]>>
      >;
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import("#controllers/project_controller").default["like"]>>
          >
        | { status: 422; response: { errors: SimpleError[] } };
    };
  };
  "project.pass": {
    methods: ["POST"];
    pattern: "/projects/:id/pass";
    types: {
      body: ExtractBody<
        InferInput<typeof import("#validators/project_id_validator").projectIdValidator>
      >;
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: ExtractQuery<
        InferInput<typeof import("#validators/project_id_validator").projectIdValidator>
      >;
      response: ExtractResponse<
        Awaited<ReturnType<import("#controllers/project_controller").default["pass"]>>
      >;
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import("#controllers/project_controller").default["pass"]>>
          >
        | { status: 422; response: { errors: SimpleError[] } };
    };
  };
}
