const express = require("express");
const path = require("node:path");
const crypto = require("node:crypto");

function buildWebServer({ store, notifier, releaseService, scheduler }) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "..", "public")));

  app.get("/api/state", async (_req, res) => {
    const state = await store.read();
    res.json({
      ...state,
      discordStatus: notifier.getStatus()
    });
  });

  app.get("/api/discord/channels", async (_req, res) => {
    try {
      const state = await store.read();
      await notifier.configure(state.settings.discordToken);
      const channels = await notifier.getTextChannels(state.settings.guildId);
      res.json({ channels });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/settings", async (req, res) => {
    const body = req.body || {};

    const nextState = await store.update((current) => {
      current.settings = {
        ...current.settings,
        ...body,
        providerConfig: {
          ...(current.settings.providerConfig || {}),
          ...(body.providerConfig || {})
        }
      };

      current.settings.pollMinutes = Math.max(5, Number(current.settings.pollMinutes || 60));
      return current;
    });

    try {
      await notifier.configure(nextState.settings.discordToken);
      await scheduler.refresh();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(nextState.settings);
  });

  app.post("/api/settings/clear-secrets", async (_req, res) => {
    const nextState = await store.update((current) => {
      const providerConfig = current.settings?.providerConfig || {};
      current.settings = {
        ...(current.settings || {}),
        discordToken: "",
        guildId: "",
        notificationChannelId: "",
        providerConfig: {
          ...providerConfig,
          hardcoverApiToken: "",
          googleBooksApiKey: ""
        }
      };
      return current;
    });

    try {
      await notifier.configure("");
      await scheduler.refresh();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(nextState.settings);
  });

  app.post("/api/follows", async (req, res) => {
    const { name, type } = req.body || {};
    const normalizedType = type === "series" ? "series" : "author";

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "A follow name is required." });
    }

    const nextState = await store.update((current) => {
      current.follows.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        type: normalizedType,
        createdAt: new Date().toISOString()
      });
      return current;
    });

    return res.status(201).json(nextState.follows);
  });

  app.delete("/api/follows/:id", async (req, res) => {
    const id = req.params.id;

    const nextState = await store.update((current) => {
      current.follows = current.follows.filter((entry) => entry.id !== id);
      return current;
    });

    res.json(nextState.follows);
  });

  app.post("/api/scan", async (_req, res) => {
    try {
      const summary = await releaseService.scanAll();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/test-notification", async (_req, res) => {
    try {
      const state = await store.read();
      await notifier.configure(state.settings.discordToken);
      await notifier.sendTestMessage(state.settings.notificationChannelId);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "public", "index.html"));
  });

  return app;
}

module.exports = { buildWebServer };
