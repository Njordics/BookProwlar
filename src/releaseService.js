function normalizeDate(rawDate) {
  if (!rawDate) {
    return null;
  }

  if (/^\d{4}$/.test(rawDate)) {
    return `${rawDate}-01-01`;
  }

  if (/^\d{4}-\d{2}$/.test(rawDate)) {
    return `${rawDate}-01`;
  }

  const dt = new Date(rawDate);
  if (Number.isNaN(dt.getTime())) {
    return null;
  }

  return dt.toISOString().slice(0, 10);
}

function inTrackingWindow(releaseDate) {
  if (!releaseDate) {
    return false;
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 45);

  const end = new Date(now);
  end.setDate(end.getDate() + 400);

  const date = new Date(releaseDate);
  return date >= start && date <= end;
}

function releaseKey(release) {
  const parts = [release.source, release.providerId || "", release.title || "", release.releaseDate || ""];
  return parts.join("::").toLowerCase();
}

class ReleaseService {
  constructor({ providers, store, notifier }) {
    this.providers = providers;
    this.store = store;
    this.notifier = notifier;
  }

  async scanAll() {
    const state = await this.store.read();
    const settings = state.settings;

    await this.notifier.configure(settings.discordToken);

    const results = {
      scannedFollows: state.follows.length,
      providerHits: 0,
      notificationsSent: 0,
      errors: []
    };

    for (const follow of state.follows) {
      for (const provider of this.providers) {
        try {
          const releases = await provider.searchReleases({ follow, settings });
          for (const release of releases) {
            const normalized = {
              ...release,
              releaseDate: normalizeDate(release.releaseDate)
            };

            if (!normalized.releaseDate || !inTrackingWindow(normalized.releaseDate)) {
              continue;
            }

            const key = releaseKey(normalized);
            if (state.sentReleaseIds[key]) {
              continue;
            }

            results.providerHits += 1;

            if (!settings.notificationChannelId) {
              continue;
            }

            await this.notifier.sendReleaseNotification(settings.notificationChannelId, normalized, follow);
            state.sentReleaseIds[key] = new Date().toISOString();
            results.notificationsSent += 1;
          }
        } catch (error) {
          results.errors.push({
            follow: follow.name,
            provider: provider.name,
            message: error.message
          });
        }
      }
    }

    state.lastScan = new Date().toISOString();
    await this.store.write(state);

    return results;
  }
}

module.exports = { ReleaseService };
