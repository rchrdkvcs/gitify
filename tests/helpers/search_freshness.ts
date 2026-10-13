import type { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { DateTime } from "luxon";
import {
  SearchFreshnessPolicy,
  type SnapshotChanges,
  type SnapshotRefresh,
  type SnapshotState,
  type SnapshotStore,
} from "#services/search_freshness/search_freshness";
import { SearchPermits } from "#services/search_freshness/search_permits";

export const freshnessNow = DateTime.fromISO("2026-10-12T12:00:00Z");

type StoredSnapshot = SnapshotState & { totalStored: number };

export class MemorySnapshotStore implements SnapshotStore {
  snapshot: StoredSnapshot | null = null;

  async read(): Promise<SnapshotState | null> {
    return this.snapshot && { ...this.snapshot };
  }

  async save(changes: SnapshotChanges): Promise<void> {
    this.snapshot = {
      fetchedAt: null,
      totalStored: 0,
      ...this.snapshot,
      ...changes,
    };
  }
}

let keys = 0;

export function freshnessHarness(permits = new SearchPermits(2)) {
  const clock = { now: freshnessNow };
  const policy = new SearchFreshnessPolicy(() => clock.now, permits);
  const store = new MemorySnapshotStore();
  const key = `freshness-test:${process.pid}:${Date.now()}:${keys++}`;
  const remote = { imports: 0, stored: 1, failure: undefined as Error | undefined };
  const importSnapshot = async (_trx: TransactionClientContract) => {
    remote.imports++;
    if (remote.failure) {
      throw remote.failure;
    }
    return remote.stored;
  };
  const refresh = (overrides: Partial<SnapshotRefresh> = {}) =>
    policy.ensureFresh({ key, ttlHours: 6, store, importSnapshot, ...overrides });
  return { clock, policy, store, key, remote, refresh, permits };
}

export function gate() {
  let open!: () => void;
  let reached!: () => void;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  const arrived = new Promise<void>((resolve) => {
    reached = resolve;
  });
  return {
    open,
    opened,
    arrived,
    reached,
    async pass() {
      reached();
      await opened;
    },
  };
}

export async function within<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), 1000);
    }),
  ]).finally(() => clearTimeout(timeout));
}
