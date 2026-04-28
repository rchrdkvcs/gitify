import vine from "@vinejs/vine";

export const projectIdValidator = vine.create({
  params: vine.object({
    id: vine.number().positive(),
  }),
});
