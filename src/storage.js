const fs = require("node:fs/promises");
const path = require("node:path");

class StateStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeChain = Promise.resolve();
  }

  async ensureFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const initialState = {
        settings: {
          discordToken: "",
          guildId: "",
          notificationChannelId: "",
          pollMinutes: 60,
          providerConfig: {
            hardcoverApiToken: "",
            googleBooksApiKey: "",
            goodreadsEnabled: true
          }
        },
        follows: [],
        sentReleaseIds: {},
        lastScan: null
      };
      await fs.writeFile(this.filePath, JSON.stringify(initialState, null, 2), "utf8");
    }
  }

  async read() {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(raw);
  }

  async write(nextState) {
    this.writeChain = this.writeChain.then(async () => {
      await fs.writeFile(this.filePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
    });
    await this.writeChain;
  }

  async update(updater) {
    const current = await this.read();
    const updated = await updater(current);
    await this.write(updated);
    return updated;
  }
}

module.exports = { StateStore };
