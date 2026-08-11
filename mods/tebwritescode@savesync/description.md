# SaveSync

Automatic cross-device saves, using **free storage that belongs to you** --
your own GitHub gist, your Dropbox, or a self-hosted Docker backend. Nobody
hosts anyone else's saves, and there is no account to create.

## Setting it up

**SAVESYNC** on the title menu -> Set Up -> GitHub -> type the code it shows
you on any device with a browser. On your second device, sign in again: it
finds the same storage on its own, with no code to copy.

## What it does

* Uploads a few seconds after the game saves; checks for a newer save on start.
* **Every save file syncs**, not just the slot you have selected.
* **Snapshots every 5 minutes.** They never write `save.lua`, so soft-resetting
  to re-roll a starter or a legendary works exactly as it always has.
* Optional auto-save of the real save file, off by default for the same reason.
* Ten local backups and ten cloud versions per save. Nothing is ever replaced
  without the outgoing save being kept first.
* **If two devices changed the same save, it stops and asks you.** It is never
  resolved by timestamp -- that is how naive sync loses playthroughs.
* Only save files are uploaded. ROMs and game content are not reachable from
  the sync path.

## Storage

| provider | what it can see |
| --- | --- |
| GitHub | a secret gist in your account, `gist` scope only -- not your repositories |
| Dropbox | one app folder -- not the rest of your Dropbox |
| Self-hosted | your own Docker container, no sign-in at all |

MIT licensed. Works offline, and retries later.
