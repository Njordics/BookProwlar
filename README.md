# BookProwlar

BookProwlar is a Discord release tracker for books and audiobooks with a built-in web UI.

It watches followed authors or series and checks:
- Hardcover API
- Open Library
- Google Books
- Goodreads (best-effort HTML scraping fallback)

When new or upcoming releases are found, it posts notifications to your chosen Discord channel.

## Requirements

- Node.js 20+
- npm 10+
- A Discord server where you can add a bot

## Features

- Follow authors and series/audiobook series
- Web UI for bot settings and follow management
- Manual scan button
- Test Discord notification button
- Duplicate protection (won't post same release twice)
- Polling scheduler
- Clear Saved Secrets action in the web UI

## Quick Start

1. Install dependencies:
   - npm install
2. Copy environment file:
   - copy .env.example .env
3. Start app:
   - npm start
4. Open web UI:
   - http://localhost:56545
5. In the dashboard, save your Discord/API settings.

For a complete setup walkthrough, see INSTALL.md.

## Configuration Model

- Discord and API credentials are configured only in the web UI.
- The app stores settings in data/state.json.
- .env is only for non-secret runtime values such as PORT and POLL_INTERVAL_MINUTES.

## Discord Setup

1. Create a bot at https://discord.com/developers/applications
2. Enable **Message Content Intent** in bot settings.
3. Invite bot to your server with permissions:
   - View Channels
   - Send Messages
   - Embed Links
   - Read Message History
4. Paste bot token, guild ID, and channel ID into the Web UI settings page.

## Usage

1. Save settings in the dashboard.
2. Click Fetch Channels to list text channels from your guild.
3. Select a channel chip to populate Notification Channel ID.
4. Add follows as Author or Series / Audiobook Series.
5. Click Test Notification to verify Discord posting.
6. Click Run Scan Now to run an immediate release scan.

## Data and Persistence

- data/state.json keeps all follows, settings, scan metadata, and dedupe keys.
- sentReleaseIds prevents duplicate release posts.

## Troubleshooting

- Port error (ERR_SOCKET_BAD_PORT): set PORT to a valid value between 0 and 65535.
- Discord not connecting: verify token, bot intents, and server invite permissions.
- No channels returned: verify Guild ID and that bot is present in that guild.
- Goodreads mismatch: parser is best-effort and can break when Goodreads HTML changes.
- Provider rate limits: add optional API keys where available.

## Notes About Data Providers

- Hardcover requires a token and can return richer metadata.
- Open Library and Google Books can work without keys, but may be rate-limited.
- Goodreads does not offer a stable public releases API; this project uses a best-effort parser and may break if Goodreads HTML changes.

## Project Structure

- src/ bot server, scheduler, providers
- public/ web UI assets
- data/state.json app state (created on first run)
- INSTALL.md complete installation and setup guide

## License

MIT
