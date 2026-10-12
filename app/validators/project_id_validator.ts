import vine from "@vinejs/vine";

export const projectIdValidator = vine.create({
  params: vine.object({
    id: vine
      .string()
      .fixedLength(26)
      .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/),
  }),
});

/** Public project URLs mirror GitHub: `/projects/:owner/:name`. */
export const projectSlugValidator = vine.create({
  params: vine.object({
    owner: vine.string().regex(/^[A-Za-z0-9-]{1,39}$/),
    name: vine.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
  }),
});
