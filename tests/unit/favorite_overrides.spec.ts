import { test } from "@japa/runner";
import { useFavoriteOverrides } from "../../inertia/composables/useFavoriteOverrides.js";

test.group("useFavoriteOverrides", () => {
  test("items without a local change are returned untouched", ({ assert }) => {
    const { withFavorite } = useFavoriteOverrides();
    const item = { id: "a", isFavorite: false };
    assert.strictEqual(withFavorite(item), item);
  });

  test("a local change overrides the prop without mutating it", ({ assert }) => {
    const { withFavorite, setFavorite } = useFavoriteOverrides();
    const item = { id: "a", isFavorite: false, name: "gitify" };
    setFavorite("a", true);
    assert.deepEqual(withFavorite(item), { id: "a", isFavorite: true, name: "gitify" });
    assert.isFalse(item.isFavorite);
    assert.strictEqual(withFavorite({ id: "b", isFavorite: false }).isFavorite, false);
  });

  test("a prop already matching the local change is kept as is", ({ assert }) => {
    const { withFavorite, setFavorite } = useFavoriteOverrides();
    setFavorite("a", false);
    const item = { id: "a", isFavorite: false };
    assert.strictEqual(withFavorite(item), item);
  });
});
