import vine from "@vinejs/vine";

export const interactionValidator = vine.create({
  params: vine.object({
    id: vine.number().positive(),
  }),
});
