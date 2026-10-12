import { test } from "@japa/runner";
import { effectScope, nextTick, reactive } from "vue";
import type { Project, PaginationMeta } from "#shared/types/index";
import {
  useFavoritePage,
  type FavoritePageSource,
  type FavoritePageVisit,
  type FavoritePageVisitCallbacks,
} from "../../inertia/composables/useFavoritePage.js";

function project(id: string): Project {
  return {
    id,
    name: id,
    ownerName: "gitify",
    repositoryUrl: `https://github.com/gitify/${id}`,
    description: null,
    language: "typescript",
    difficulty: "beginner",
    stars: 0,
    openIssuesCount: 0,
    topics: [],
    latestRelease: null,
    pushedAt: null,
    ownerAvatarUrl: "https://github.com/owner.png",
    forksCount: 0,
    isFavorite: true,
    newcomerScore: null,
  };
}

const secondPage: PaginationMeta = {
  total: 21,
  perPage: 20,
  currentPage: 2,
  lastPage: 2,
};
const firstPage: PaginationMeta = {
  total: 20,
  perPage: 20,
  currentPage: 1,
  lastPage: 1,
};

function harness() {
  const visits: { page: number; callbacks: FavoritePageVisitCallbacks; canceled: boolean }[] = [];
  const visit: FavoritePageVisit = (page, callbacks) => {
    const request = { page, callbacks, canceled: false };
    visits.push(request);
    callbacks.onCancelToken({
      cancel: () => {
        request.canceled = true;
        callbacks.onCancel();
        callbacks.onFinish();
      },
    });
  };
  const source = reactive<FavoritePageSource>({
    projects: [project("last")],
    meta: { ...secondPage },
  });
  const scope = effectScope();
  const state = scope.run(() => useFavoritePage(source, visit))!;
  return { source, scope, state, visits };
}

test("removing the last card keeps the page loading until canonical favorites refill it", async ({
  assert,
}) => {
  const { scope, state, visits } = harness();
  try {
    state.handleFavoriteChange("last", false);
    assert.deepEqual(state.projects.value, []);
    assert.isTrue(state.loading.value);
    assert.isNull(state.error.value);
    assert.equal(state.meta.value.total, 20);
    assert.equal(visits[0].page, 2);

    const remaining = [
      project("remaining-one"),
      project("remaining-two"),
      ...Array.from({ length: 18 }, (_, index) => project(`another-${index}`)),
    ];
    visits[0].callbacks.onSuccess({ projects: remaining, meta: firstPage });
    visits[0].callbacks.onFinish();
    await nextTick();
    assert.lengthOf(state.projects.value, 20);
    assert.deepEqual(
      state.projects.value.slice(0, 2).map((item) => item.id),
      ["remaining-one", "remaining-two"],
    );
    assert.equal(state.meta.value.currentPage, 1);
    assert.equal(state.meta.value.lastPage, 1);
    assert.isFalse(state.loading.value);
    assert.isNull(state.error.value);
  } finally {
    scope.stop();
  }
});

test("failed canonical rereads expose an error instead of claiming favorites are globally empty and can retry", ({
  assert,
}) => {
  const { scope, state, visits } = harness();
  try {
    state.handleFavoriteChange("last", false);
    visits[0].callbacks.onNetworkError();
    visits[0].callbacks.onFinish();
    assert.isFalse(state.loading.value);
    assert.isString(state.error.value);
    assert.equal(state.meta.value.total, 20);
    state.goToPage(state.meta.value.currentPage);
    assert.isTrue(state.loading.value);
    assert.isNull(state.error.value);
    visits[1].callbacks.onSuccess({
      projects: [project("retry-result")],
      meta: { ...firstPage, total: 1 },
    });
    visits[1].callbacks.onFinish();
    assert.deepEqual(
      state.projects.value.map((item) => item.id),
      ["retry-result"],
    );
    assert.isFalse(state.loading.value);
  } finally {
    scope.stop();
  }
});

test("callbacks from a canceled visit cannot overwrite a newer canonical success", ({ assert }) => {
  const { scope, state, visits } = harness();
  try {
    state.goToPage(2);
    state.goToPage(1);
    assert.isTrue(visits[0].canceled);
    visits[1].callbacks.onSuccess({
      projects: [project("latest")],
      meta: { ...firstPage, total: 1 },
    });
    visits[1].callbacks.onFinish();
    visits[0].callbacks.onSuccess({ projects: [project("obsolete")], meta: secondPage });
    visits[0].callbacks.onNetworkError();
    visits[0].callbacks.onHttpException();
    visits[0].callbacks.onFinish();
    assert.deepEqual(
      state.projects.value.map((item) => item.id),
      ["latest"],
    );
    assert.equal(state.meta.value.currentPage, 1);
    assert.isNull(state.error.value);
    assert.isFalse(state.loading.value);
  } finally {
    scope.stop();
  }
});

test("reactive page props reconcile while a removed card stays hidden during its reread", async ({
  assert,
}) => {
  const { source, scope, state, visits } = harness();
  try {
    state.handleFavoriteChange("last", false);
    source.projects = [project("last"), project("fresh")];
    source.meta = { ...secondPage, total: 22 };
    await nextTick();
    assert.deepEqual(
      state.projects.value.map((item) => item.id),
      ["fresh"],
    );
    visits[0].callbacks.onSuccess({
      projects: [project("fresh")],
      meta: { ...firstPage, total: 1 },
    });
    visits[0].callbacks.onFinish();
    source.projects = [project("added-later")];
    await nextTick();
    assert.deepEqual(
      state.projects.value.map((item) => item.id),
      ["added-later"],
    );
  } finally {
    scope.stop();
  }
});

test("disposing the page cancels its visit and ignores subsequent transport callbacks", ({
  assert,
}) => {
  const { scope, state, visits } = harness();
  state.goToPage(1);
  scope.stop();
  assert.isTrue(visits[0].canceled);
  visits[0].callbacks.onSuccess({ projects: [project("late")], meta: { ...firstPage, total: 1 } });
  visits[0].callbacks.onNetworkError();
  visits[0].callbacks.onFinish();
  assert.deepEqual(
    state.projects.value.map((item) => item.id),
    ["last"],
  );
  assert.equal(state.meta.value.currentPage, 2);
  assert.isNull(state.error.value);
});
