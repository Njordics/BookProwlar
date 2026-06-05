const path = require("node:path");
const { config } = require("./config");
const { StateStore } = require("./storage");
const { DiscordNotifier } = require("./discordNotifier");
const { buildProviders } = require("./providers");
const { ReleaseService } = require("./releaseService");
const { PollScheduler } = require("./scheduler");
const { buildWebServer } = require("./web/server");

async function bootstrap() {
  const store = new StateStore(path.join(__dirname, "..", "data", "state.json"));

  await store.update((state) => {
    const existingSettings = state.settings || {};
    const existingProviderConfig = existingSettings.providerConfig || {};

    state.settings = {
      discordToken: existingSettings.discordToken || "",
      guildId: existingSettings.guildId || "",
      notificationChannelId: existingSettings.notificationChannelId || "",
      pollMinutes: Math.max(5, Number(existingSettings.pollMinutes || config.pollIntervalMinutes)),
      providerConfig: {
        hardcoverApiToken: existingProviderConfig.hardcoverApiToken || "",
        googleBooksApiKey: existingProviderConfig.googleBooksApiKey || "",
        goodreadsEnabled: typeof existingProviderConfig.goodreadsEnabled === "boolean"
          ? existingProviderConfig.goodreadsEnabled
          : true
      }
    };

    return state;
  });

  const notifier = new DiscordNotifier();
  const providers = buildProviders();
  const releaseService = new ReleaseService({ providers, store, notifier });
  const scheduler = new PollScheduler({ store, releaseService });

  const state = await store.read();
  if (state.settings.discordToken) {
    try {
      await notifier.configure(state.settings.discordToken);
    } catch (error) {
      console.error("[Startup] Discord connection failed:", error.message);
    }
  }

  await scheduler.refresh();

  const app = buildWebServer({ store, notifier, releaseService, scheduler });
  app.listen(config.port, () => {
    console.log(`BookProwlar running at http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
