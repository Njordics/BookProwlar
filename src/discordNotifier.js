const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require("discord.js");

class DiscordNotifier {
  constructor() {
    this.client = null;
    this.ready = false;
    this.currentToken = "";
    this.loginPromise = null;
  }

  getStatus() {
    return {
      connected: this.ready,
      userTag: this.client?.user?.tag || null
    };
  }

  async configure(token) {
    if (!token) {
      this.ready = false;
      this.currentToken = "";
      if (this.client) {
        this.client.destroy();
      }
      this.client = null;
      return;
    }

    if (this.client && this.currentToken === token && this.ready) {
      return;
    }

    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.ready = false;
    }

    this.currentToken = token;
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    this.client.on("ready", () => {
      this.ready = true;
      console.log(`[Discord] Connected as ${this.client.user.tag}`);
    });

    this.client.on("error", (error) => {
      this.ready = false;
      console.error("[Discord] Client error:", error.message);
    });

    this.loginPromise = this.client.login(token).catch((error) => {
      this.ready = false;
      console.error("[Discord] Login failed:", error.message);
      throw error;
    });

    await this.loginPromise;
  }

  async getTextChannels(guildId) {
    if (!this.client || !this.ready || !guildId) {
      return [];
    }

    const guild = await this.client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    return channels
      .filter((channel) => channel && channel.type === ChannelType.GuildText)
      .map((channel) => ({ id: channel.id, name: channel.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async sendReleaseNotification(channelId, release, follow) {
    if (!this.client || !this.ready || !channelId) {
      return false;
    }

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Configured notification channel is not a text channel.");
    }

    const embed = new EmbedBuilder()
      .setColor(0x2f855a)
      .setTitle(`New Release: ${release.title}`)
      .setURL(release.url || null)
      .setDescription(release.description || "A new or upcoming release was detected.")
      .addFields(
        { name: "Tracked", value: `${follow.type}: ${follow.name}`, inline: true },
        { name: "Author", value: release.author || "Unknown", inline: true },
        { name: "Series", value: release.series || "N/A", inline: true },
        { name: "Release Date", value: release.releaseDate || "Unknown", inline: true },
        { name: "Source", value: release.source, inline: true }
      )
      .setFooter({ text: "BookProwlar" })
      .setTimestamp(new Date());

    await channel.send({ embeds: [embed] });
    return true;
  }

  async sendTestMessage(channelId) {
    if (!this.client || !this.ready || !channelId) {
      throw new Error("Discord bot is not connected or no channel ID is configured.");
    }

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Configured test channel is not a text channel.");
    }

    await channel.send({
      content: "BookProwlar test notification: bot is connected and can post here."
    });
  }
}

module.exports = { DiscordNotifier };
