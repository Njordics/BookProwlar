class PollScheduler {
  constructor({ store, releaseService }) {
    this.store = store;
    this.releaseService = releaseService;
    this.timer = null;
    this.currentIntervalMs = 0;
  }

  async refresh() {
    const state = await this.store.read();
    const pollMinutes = Math.max(5, Number(state.settings.pollMinutes || 60));
    const nextIntervalMs = pollMinutes * 60 * 1000;

    if (this.timer && this.currentIntervalMs === nextIntervalMs) {
      return;
    }

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.currentIntervalMs = nextIntervalMs;
    this.timer = setInterval(async () => {
      try {
        console.log("[Scheduler] Running scheduled scan...");
        const summary = await this.releaseService.scanAll();
        console.log("[Scheduler] Scan complete:", summary);
      } catch (error) {
        console.error("[Scheduler] Scan failed:", error.message);
      }
    }, nextIntervalMs);

    console.log(`[Scheduler] Poll interval set to ${pollMinutes} minute(s).`);
  }
}

module.exports = { PollScheduler };
