import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import db from "@adonisjs/lucid/services/db";
import { DateTime } from "luxon";
import { retryAfterFailure } from "#services/search_freshness/retry_cooldown";
import { type SearchPermits, searchPermits } from "#services/search_freshness/search_permits";

export type SearchFreshness =
  | { status: "fresh" | "pending" }
  | { status: "refreshed"; totalStored: number };

export class SearchRetryDeferredError extends Error {
  constructor() {
    super("GitHub search temporarily unavailable; retry deferred");
  }
}

export type SnapshotState = {
  fetchedAt: DateTime | null;
  retryAfter: DateTime | null;
};

export type SnapshotChanges = {
  fetchedAt?: DateTime | null;
  totalStored?: number;
  retryAfter: DateTime | null;
};

export interface SnapshotStore {
  read(trx?: TransactionClientContract): Promise<SnapshotState | null>;
  save(changes: SnapshotChanges, trx: TransactionClientContract): Promise<void>;
}

export type SnapshotRefresh = {
  key: string;
  ttlHours: number;
  store: SnapshotStore;
  importSnapshot(trx: TransactionClientContract): Promise<number>;
  force?: boolean;
};

export class SearchFreshnessPolicy {
  constructor(
    private readonly now: () => DateTime = () => DateTime.now(),
    private readonly permits: SearchPermits = searchPermits,
  ) {}

  async ensureFresh(refresh: SnapshotRefresh): Promise<SearchFreshness> {
    if (this.isSettled(refresh, await refresh.store.read())) {
      return { status: "fresh" };
    }
    if (!this.permits.tryAcquire()) {
      return { status: "pending" };
    }
    try {
      return await db.transaction(async (trx) => {
        if (!(await tryLock(refresh.key, trx))) {
          return { status: "pending" };
        }
        if (this.isSettled(refresh, await refresh.store.read(trx))) {
          return { status: "fresh" };
        }
        const totalStored = await refresh.importSnapshot(trx);
        await refresh.store.save({ totalStored, fetchedAt: this.now(), retryAfter: null }, trx);
        return { status: "refreshed", totalStored };
      });
    } catch (error) {
      if (!(error instanceof SearchRetryDeferredError)) {
        await this.recordFailure(refresh, error);
      }
      throw error;
    } finally {
      this.permits.release();
    }
  }

  private isSettled(refresh: SnapshotRefresh, snapshot: SnapshotState | null): boolean {
    if (!refresh.force && this.isFresh(refresh, snapshot)) {
      return true;
    }
    if (snapshot?.retryAfter && snapshot.retryAfter > this.now()) {
      throw new SearchRetryDeferredError();
    }
    return false;
  }

  private isFresh(refresh: SnapshotRefresh, snapshot: SnapshotState | null): boolean {
    return (
      !!snapshot?.fetchedAt && this.now().diff(snapshot.fetchedAt, "hours").hours < refresh.ttlHours
    );
  }

  private async recordFailure(refresh: SnapshotRefresh, error: unknown): Promise<void> {
    await db.transaction(async (trx) => {
      if (!(await tryLock(refresh.key, trx))) {
        return;
      }
      const current = await refresh.store.read(trx);
      if (this.isFresh(refresh, current)) {
        return;
      }
      const retryAfter = retryAfterFailure(error, this.now());
      await refresh.store.save(
        current ? { retryAfter } : { fetchedAt: null, totalStored: 0, retryAfter },
        trx,
      );
    });
  }
}

async function tryLock(key: string, trx: TransactionClientContract): Promise<boolean> {
  const lock = await trx.rawQuery("SELECT pg_try_advisory_xact_lock(hashtext(?)) AS acquired", [
    key,
  ]);
  return lock.rows[0].acquired as boolean;
}
