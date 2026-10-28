# Expanded release

AI-generated categories are explicitly excluded at the user's request. There is no API key, API request, or external AI dependency.

## Implemented
- Existing public no-login browser site and private rooms retained.
- Twelve selectable preset avatars; custom JPEG/PNG/WebP uploads are cropped and converted to JPEG in the browser and stored in R2. Public rooms use preset avatars.
- Host-selectable simultaneous clues or randomized circular turns. Configurable word limits.
- Pass-the-phone mode: enter names, privately reveal each role, randomly pick a starting player, then no input until final reveal. Discussion and voting happen in person.
- 180 curated words across Everyday, Food, Animals, Places, Sports, Science. Easy, medium, hard, mixed. Manual custom packs with two hint strengths.
- Word-specific broad/helpful hints. Category always public. Optional teammate knowledge and eliminated role reveal.
- Optional submission, discussion, and vote deadlines; host can add 30 seconds. Circular timers apply per player. Final guesses have a 30-second deadline.
- Host or majority word replacement with a 15-second cooldown. Replacements reassign roles.
- Optional runoff ties; optional final imposter guesses; configurable match length and team scores.
- QR invitations, replacement codes and invitation tokens, room locking, manual host transfer, removal controls.
- Presence-aware host transfer after 90 seconds and offline players moved to spectating after 180 seconds, evaluated on room activity.
- Device-persistent seats and optional recovery keys; recovery revokes the previous seat token. No names alone can reclaim roles.
- Lobby spectators and queued mid-game arrivals, promoted to playing when the lobby reopens.
- Ghosts and spectators read main chat but may only send to ghost chat. Active players never receive ghost messages from the server.
- Public room discovery and quick joining, family-friendly name/clue/chat filtering, message blocking, and room reports. Three different reporters remove a player. Host removals deny the same stored device identity; accountless controls are not permanent identity bans.
- Dark/light/system themes, RGB accent selection and animation, reduced motion and optional sound cues.

## Limits and behavior
Recommended 4–10 players; two-player practice; technical limit 64 seats; rooms last 12 hours. Leaving mid-game forfeits the seat. A disconnected player can recover until their seat is moved to spectating, then waits for the next game. Public filtering is basic local text filtering, not an AI moderation service. Custom images are limited to private rooms. Custom packs are known to their author; the selected word remains server-side for online play. Pass-the-phone state stays in memory and resets on refresh.

## Validation
- `node scripts/test-engine.mjs`: hidden information, turn order, deadlines, hints, guesses, scores, ties, skip votes, presence, custom words, public filtering and reports.
- `node scripts/test-game.mjs`: independent network sessions, concurrent actions and original core regression.
- `node scripts/test-platform.mjs`: invitation invalidation, recovery, spectator boundaries, public discovery/matching, image storage and content rejection.
- `npx tsc --noEmit`; Sites production build; desktop/mobile browser checks.

Rollback details are in ROLLBACK.md. Version 1 is retained unchanged.
