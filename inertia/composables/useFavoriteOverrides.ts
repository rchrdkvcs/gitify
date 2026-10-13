import { reactive } from "vue";

interface FavoritableItem {
  id: string;
  isFavorite: boolean;
}

export function useFavoriteOverrides() {
  const overrides = reactive(new Map<string, boolean>());

  function withFavorite<Item extends FavoritableItem>(item: Item): Item {
    const override = overrides.get(item.id);
    if (override === undefined || override === item.isFavorite) return item;
    return { ...item, isFavorite: override };
  }

  function setFavorite(id: string, isFavorite: boolean) {
    overrides.set(id, isFavorite);
  }

  return { withFavorite, setFavorite };
}
