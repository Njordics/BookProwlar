const el = {
  discordStatus: document.getElementById("discordStatus"),
  lastScan: document.getElementById("lastScan"),
  followCount: document.getElementById("followCount"),
  activityLog: document.getElementById("activityLog"),
  channels: document.getElementById("channels"),
  settingsForm: document.getElementById("settingsForm"),
  followForm: document.getElementById("followForm"),
  followList: document.getElementById("followList"),
  runScan: document.getElementById("runScan"),
  clearSecrets: document.getElementById("clearSecrets"),
  fetchChannels: document.getElementById("fetchChannels"),
  testNotification: document.getElementById("testNotification"),
  discordToken: document.getElementById("discordToken"),
  guildId: document.getElementById("guildId"),
  notificationChannelId: document.getElementById("notificationChannelId"),
  pollMinutes: document.getElementById("pollMinutes"),
  hardcoverApiToken: document.getElementById("hardcoverApiToken"),
  googleBooksApiKey: document.getElementById("googleBooksApiKey"),
  goodreadsEnabled: document.getElementById("goodreadsEnabled"),
  followName: document.getElementById("followName"),
  followType: document.getElementById("followType")
};

function logLine(message, payload) {
  const now = new Date().toLocaleTimeString();
  const line = `[${now}] ${message}`;
  if (!payload) {
    el.activityLog.textContent = `${line}\n${el.activityLog.textContent}`;
    return;
  }

  const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  el.activityLog.textContent = `${line}\n${body}\n\n${el.activityLog.textContent}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body;
}

function renderFollows(follows) {
  el.followList.innerHTML = "";

  follows.forEach((follow) => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<strong>${follow.name}</strong><br /><small>${follow.type}</small>`;

    const btn = document.createElement("button");
    btn.className = "remove";
    btn.textContent = "Remove";
    btn.addEventListener("click", async () => {
      try {
        const next = await api(`/api/follows/${follow.id}`, { method: "DELETE" });
        renderFollows(next);
        el.followCount.textContent = String(next.length);
        logLine(`Removed follow: ${follow.name}`);
      } catch (error) {
        logLine(`Failed to remove follow: ${error.message}`);
      }
    });

    li.append(left, btn);
    el.followList.appendChild(li);
  });
}

function renderChannels(channels) {
  el.channels.innerHTML = "";

  channels.forEach((channel) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `#${channel.name}`;
    btn.title = channel.id;
    btn.addEventListener("click", () => {
      el.notificationChannelId.value = channel.id;
      logLine(`Selected channel #${channel.name} (${channel.id})`);
    });
    el.channels.appendChild(btn);
  });
}

async function refresh() {
  const state = await api("/api/state");
  const s = state.settings || {};
  const p = s.providerConfig || {};

  el.discordToken.value = s.discordToken || "";
  el.guildId.value = s.guildId || "";
  el.notificationChannelId.value = s.notificationChannelId || "";
  el.pollMinutes.value = s.pollMinutes || 60;
  el.hardcoverApiToken.value = p.hardcoverApiToken || "";
  el.googleBooksApiKey.value = p.googleBooksApiKey || "";
  el.goodreadsEnabled.checked = Boolean(p.goodreadsEnabled);

  el.discordStatus.textContent = state.discordStatus?.connected
    ? `Connected as ${state.discordStatus.userTag}`
    : "Not connected";

  el.lastScan.textContent = state.lastScan ? new Date(state.lastScan).toLocaleString() : "Never";
  el.followCount.textContent = String((state.follows || []).length);
  renderFollows(state.follows || []);
}

el.settingsForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  try {
    const payload = {
      discordToken: el.discordToken.value.trim(),
      guildId: el.guildId.value.trim(),
      notificationChannelId: el.notificationChannelId.value.trim(),
      pollMinutes: Number(el.pollMinutes.value || 60),
      providerConfig: {
        hardcoverApiToken: el.hardcoverApiToken.value.trim(),
        googleBooksApiKey: el.googleBooksApiKey.value.trim(),
        goodreadsEnabled: el.goodreadsEnabled.checked
      }
    };

    await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    logLine("Settings saved.");
    await refresh();
  } catch (error) {
    logLine(`Failed to save settings: ${error.message}`);
  }
});

el.followForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const name = el.followName.value.trim();
  const type = el.followType.value;
  if (!name) {
    return;
  }

  try {
    const follows = await api("/api/follows", {
      method: "POST",
      body: JSON.stringify({ name, type })
    });

    renderFollows(follows);
    el.followCount.textContent = String(follows.length);
    el.followName.value = "";
    logLine(`Added follow: ${name} (${type})`);
  } catch (error) {
    logLine(`Failed to add follow: ${error.message}`);
  }
});

el.fetchChannels.addEventListener("click", async () => {
  try {
    const payload = await api("/api/discord/channels");
    renderChannels(payload.channels || []);
    logLine(`Fetched ${payload.channels?.length || 0} channel(s).`);
  } catch (error) {
    logLine(`Failed to fetch channels: ${error.message}`);
  }
});

el.testNotification.addEventListener("click", async () => {
  try {
    await api("/api/test-notification", { method: "POST" });
    logLine("Test notification sent.");
  } catch (error) {
    logLine(`Test notification failed: ${error.message}`);
  }
});

el.runScan.addEventListener("click", async () => {
  try {
    logLine("Manual scan started...");
    const summary = await api("/api/scan", { method: "POST" });
    logLine("Manual scan complete.", summary);
    await refresh();
  } catch (error) {
    logLine(`Manual scan failed: ${error.message}`);
  }
});

el.clearSecrets.addEventListener("click", async () => {
  const confirmed = window.confirm("Clear all saved Discord/API keys from this app?");
  if (!confirmed) {
    return;
  }

  try {
    await api("/api/settings/clear-secrets", { method: "POST" });
    logLine("Saved secrets cleared.");
    await refresh();
  } catch (error) {
    logLine(`Failed to clear secrets: ${error.message}`);
  }
});

refresh().catch((error) => {
  logLine(`Failed to load dashboard: ${error.message}`);
});
