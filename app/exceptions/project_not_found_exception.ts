import UserFacingException from "#exceptions/user_facing_exception";

export default class ProjectNotFoundException extends UserFacingException {
  static status = 404;
  static code = "E_PROJECT_NOT_FOUND";
  static message = "Projet introuvable.";
}
