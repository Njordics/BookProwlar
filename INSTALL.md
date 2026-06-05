# Install Guide

This guide covers a fresh setup for BookProwlar on Windows.

## 1. Prerequisites

- Install Node.js 20+ from https://nodejs.org
- Verify tools:
  - node -v
  - npm -v

## 2. Install Dependencies

From the project root:

- npm install

## 3. Optional Environment File

Create .env from template:

- copy .env.example .env

Supported values in .env:

- PORT=56545
- POLL_INTERVAL_MINUTES=60

Note: Discord/API keys are entered in the web UI and stored in data/state.json.

## 4. Start the App

- npm start

Expected startup log:

- BookProwlar running at http://localhost:56545

## 5. Open the Dashboard

Open your browser:

- http://localhost:56545

## 6. Configure Discord in Web UI

In Bot Settings:

- Discord Bot Token
- Guild (Server) ID
- Notification Channel ID

Recommended flow:

1. Paste Bot Token and Guild ID.
2. Click Save Settings.
3. Click Fetch Channels.
4. Pick a channel chip.
5. Click Save Settings again.
6. Click Test Notification.

## 7. Configure Providers

Optional tokens for better coverage/rate limits:

- Hardcover API Token
- Google Books API Key

Goodreads can be enabled/disabled with a checkbox.

## 8. Add Follow Targets

Use Follow Author or Series:

- Type: Author or Series / Audiobook Series
- Name: author name or series name

Then click Add Follow.

## 9. Scan for Releases

- Manual: Run Scan Now
- Automatic: scheduler runs every Poll Minutes interval

## 10. Clear Saved Secrets

If you need to remove stored credentials:

- Click Clear Saved Secrets in Bot Settings

This clears Discord/API secrets and disconnects the bot session.

## 11. Common Issues

- ERR_SOCKET_BAD_PORT:
  - Use a valid PORT in range 0-65535.
- Discord login fails:
  - Recheck token and bot settings in Discord Developer Portal.
- No notification sent:
  - Verify channel ID belongs to the selected guild and bot can send messages there.
