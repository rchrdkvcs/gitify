import { test } from "@japa/runner";
import { createHeroAnimation } from "../../inertia/lib/hero-animation.js";

function frameClock() {
  let nextId = 0;
  const pending = new Map<number, (now: number) => void>();
  return {
    pending,
    requestAnimationFrame(callback: (now: number) => void) {
      pending.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame(id: number) {
      pending.delete(id);
    },
    tick(now: number) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) {
        callback(now);
      }
    },
  };
}

test("returning to a tab keeps an offscreen hero paused", ({ assert }) => {
  const clock = frameClock();
  const drawn: number[] = [];
  const hero = createHeroAnimation((dt) => drawn.push(dt), clock, false);
  hero.setVisible(true);
  clock.tick(1000);
  hero.setDocumentHidden(true);
  hero.setVisible(false);
  hero.setDocumentHidden(false);
  assert.equal(clock.pending.size, 0);
  clock.tick(2000);
  assert.deepEqual(drawn, [0]);
  hero.dispose();
});

test("visible hero resumes with one loop and no time jump, then disposes", ({ assert }) => {
  const clock = frameClock();
  const drawn: number[] = [];
  const hero = createHeroAnimation((dt) => drawn.push(dt), clock, false);
  hero.setVisible(true);
  hero.setVisible(true);
  assert.equal(clock.pending.size, 1);
  clock.tick(1000);
  clock.tick(1020);
  hero.setDocumentHidden(true);
  assert.equal(clock.pending.size, 0);
  hero.setDocumentHidden(false);
  clock.tick(5000);
  assert.deepEqual(drawn, [0, 0.02, 0]);
  hero.dispose();
  hero.setVisible(true);
  hero.setDocumentHidden(false);
  assert.equal(clock.pending.size, 0);
});

test("reduced motion never schedules hero frames", ({ assert }) => {
  const clock = frameClock();
  const hero = createHeroAnimation(() => assert.fail("unexpected animation"), clock, true);
  hero.setVisible(true);
  hero.setDocumentHidden(false);
  assert.equal(clock.pending.size, 0);
  hero.dispose();
});
