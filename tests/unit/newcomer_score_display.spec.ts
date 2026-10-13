import { test } from "@japa/runner";
import {
  describeNewcomerScore,
  newcomerScoreSegmentCount,
  newcomerScoreTier,
  newcomerScoreTiers,
} from "#shared/newcomer_score_display";

const rated = (score: number, partial = false) => ({ score, partial, archived: false });

test.group("Newcomer score display", () => {
  test("tiers name score ranges", ({ assert }) => {
    assert.equal(newcomerScoreTier(90).tier, "excellent");
    assert.equal(newcomerScoreTier(75).tier, "excellent");
    assert.equal(newcomerScoreTier(74).tier, "good");
    assert.equal(newcomerScoreTier(50).tier, "good");
    assert.equal(newcomerScoreTier(30).tier, "fair");
    assert.equal(newcomerScoreTier(24).tier, "low");
    assert.equal(newcomerScoreTier(0).tier, "low");
  });

  test("a project never scored is pending and empty", ({ assert }) => {
    for (const summary of [null, undefined]) {
      const display = describeNewcomerScore(summary);
      assert.equal(display.status, "pending");
      assert.isTrue(display.unrated);
      assert.isNull(display.score);
      assert.isNull(display.tier);
      assert.equal(display.label, "Non évalué");
      assert.equal(display.title, "Score calculé à la première ouverture de la fiche du projet.");
      assert.equal(display.filledSegments, 0);
      assert.equal(display.filledRatio, 0);
    }
  });

  test("a withheld score is unrated for lack of data", ({ assert }) => {
    const display = describeNewcomerScore({ score: null, partial: true, archived: false });
    assert.equal(display.status, "insufficient");
    assert.isTrue(display.unrated);
    assert.isFalse(display.approximate);
    assert.equal(display.label, "Non évalué");
    assert.match(display.note!, /Pas assez de données GitHub/);
    assert.equal(display.filledSegments, 0);
  });

  test("an archived repository shows an empty meter whatever its score", ({ assert }) => {
    const display = describeNewcomerScore({ score: 80, partial: true, archived: true });
    assert.equal(display.status, "archived");
    assert.isTrue(display.archived);
    assert.isFalse(display.unrated);
    assert.isFalse(display.approximate);
    assert.isNull(display.tier);
    assert.equal(display.label, "Archivé");
    assert.equal(display.statusLabel, "Dépôt archivé");
    assert.equal(display.title, "Dépôt archivé");
    assert.equal(display.note, "Un dépôt archivé n’accepte plus de contributions.");
    assert.equal(display.filledSegments, 0);
    assert.equal(display.filledRatio, 0);
  });

  test("each tier labels a complete score", ({ assert }) => {
    for (const tier of newcomerScoreTiers) {
      const display = describeNewcomerScore(rated(tier.min));
      assert.equal(display.status, "rated");
      assert.equal(display.tier?.tier, tier.tier);
      assert.equal(display.statusLabel, tier.label);
      assert.equal(display.title, tier.label);
      assert.equal(display.label, `${tier.min}/100`);
      assert.isNull(display.note);
    }
  });

  test("a partial score is marked as an estimate", ({ assert }) => {
    const display = describeNewcomerScore({ ...rated(62, true), coverage: 0.75 });
    assert.isTrue(display.approximate);
    assert.equal(display.label, "≈ 62/100");
    assert.equal(display.title, "Accueillant, estimation sur une partie des signaux");
    assert.equal(
      display.note,
      "Estimation sur 75 % des signaux : certaines données GitHub manquent.",
    );
    assert.equal(
      describeNewcomerScore(rated(62, true)).note,
      "Estimation sur une partie des signaux.",
    );
  });

  test("fills the meter by rounded tenths", ({ assert }) => {
    assert.equal(newcomerScoreSegmentCount, 10);
    assert.equal(describeNewcomerScore(rated(0)).filledSegments, 0);
    assert.equal(describeNewcomerScore(rated(4)).filledSegments, 0);
    assert.equal(describeNewcomerScore(rated(5)).filledSegments, 1);
    assert.equal(describeNewcomerScore(rated(44)).filledSegments, 4);
    assert.equal(describeNewcomerScore(rated(45)).filledSegments, 5);
    assert.equal(describeNewcomerScore(rated(96)).filledSegments, 10);
    assert.equal(describeNewcomerScore(rated(100)).filledSegments, 10);
    assert.equal(describeNewcomerScore(rated(62)).filledRatio, 0.62);
  });
});
