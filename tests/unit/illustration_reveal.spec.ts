import { test } from "@japa/runner";
import {
  createIllustrationReveal,
  type IllustrationState,
} from "../../inertia/lib/illustration-reveal.js";

test("illustration waits offscreen, then plays once when it becomes visible", ({ assert }) => {
  const changes: IllustrationState[] = [];
  const reveal = createIllustrationReveal((state) => changes.push(state), false);
  assert.equal(reveal.state, "idle");
  assert.isTrue(reveal.waiting);

  reveal.setVisible(false);
  assert.deepEqual(changes, []);

  reveal.setVisible(true);
  reveal.setVisible(false);
  reveal.setVisible(true);
  assert.deepEqual(changes, ["play"]);
  assert.equal(reveal.state, "play");
  assert.isFalse(reveal.waiting);
  reveal.dispose();
});

test("reduced motion settles on the static final state and never plays", ({ assert }) => {
  const changes: IllustrationState[] = [];
  const reveal = createIllustrationReveal((state) => changes.push(state), true);
  assert.isFalse(reveal.waiting);
  reveal.setVisible(true);
  assert.deepEqual(changes, ["static"]);
  assert.equal(reveal.state, "static");
  reveal.dispose();
});

test("a disposed illustration ignores later visibility", ({ assert }) => {
  const reveal = createIllustrationReveal(() => assert.fail("unexpected change"), false);
  reveal.dispose();
  reveal.setVisible(true);
  assert.equal(reveal.state, "idle");
  assert.isFalse(reveal.waiting);
});
