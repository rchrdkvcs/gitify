import vine from "@vinejs/vine";

export const projectIdValidator = vine.create({
  params: vine.object({
    id: vine
      .string()
      .fixedLength(26)
      .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/),
  }),
});
