# Undercover

## First playable release
Public website without accounts or installation. Private cryptographic room codes and shareable invitations; guest usernames; server-owned roles and words; ready lobby; basic host settings; simultaneous clue reveal; discussion; private voting; elimination; victory and rematches; text chat; refresh/reconnect in the same tab; responsive dark interface.

Discussion is host-led and untimed. Ties produce no elimination. Two players use one-round practice. Recommended group size is 4–10; a technical safety limit is 64 seats. Rooms expire after 12 hours. Host transfer occurs when the host explicitly leaves the lobby or results screen. Automatic disconnected-host replacement and inactive-player recovery are next priorities before broad promotion.

## Remembered, deliberately deferred
- Several preset profile pictures and custom uploads.
- Host choice between simultaneous clues and circular turns.
- One-device pass-the-phone mode: host enters names, passes the phone for private roles, and players speak clues in person.
- AI-generated custom categories, word difficulty, larger curated packs, broad hints.
- Public matchmaking with username filtering, reporting, blocking, and moderation; private usernames remain unfiltered.
- Light/dark/system modes, animated RGB accents, expanded microanimations and sound.
- Timers, QR invitations, spectators, host removal controls, full reconnect recovery, automatic host transfer, and configurable skip voting.

## Hosting architecture
React/TypeScript on Sites with server-side Cloudflare Worker API and D1 storage. Client polls for a fresh authorized view every 1.8 seconds. Atomic version checks serialize concurrent actions. Roles, word selection, votes, and game outcomes are server controlled. No AI API or paid external service is needed for the first version.

## Validation
`node scripts/test-game.mjs` runs independent HTTP player sessions against a running local server. `GAME_TEST_URL` can select a published deployment. `npx tsc --noEmit` checks types. Use Sites build and publishing helpers for production artifacts.
