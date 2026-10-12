import { ExceptionHandler } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction;
}
