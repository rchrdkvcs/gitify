import logger from "@adonisjs/core/services/logger";

export class BackgroundRefreshes {
  private readonly running = new Map<string, Promise<void>>();

  isRunning(key: string): boolean {
    return this.running.has(key);
  }

  run(key: string, task: () => Promise<unknown>): void {
    const running = task()
      .then(
        () => undefined,
        (error: unknown) => logger.error({ err: error, key }, "Background search refresh failed"),
      )
      .finally(() => this.running.delete(key));
    this.running.set(key, running);
  }

  async settled(): Promise<void> {
    while (this.running.size > 0) {
      await Promise.all(this.running.values());
    }
  }
}

export const backgroundRefreshes = new BackgroundRefreshes();
