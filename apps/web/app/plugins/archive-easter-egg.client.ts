/**
 * Binds the GITIFY keyboard easter egg as early as possible on the client.
 * Independent of the overlay component mount order.
 */
export default defineNuxtPlugin(() => {
  const { bind } = useArchiveEasterEgg();
  bind();
});
