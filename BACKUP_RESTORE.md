# Backup & restore (Version 8)

Quick way to protect against database issues and get back to a known state.

## How it works

- **Backup:** On the **Scorer** page (when logged in), use **Download backup**. This saves a JSON file with the current game state (timer, team points, all scores). Store this file somewhere safe (e.g. after each session or before a break).
- **Restore:** If the database is corrupted or you need to roll back, open the Scorer page, paste the contents of a backup JSON file into the "Restore from backup" box, then click **Restore from backup**. The app will overwrite the current game state with the backup. No code or database access needed.

## When to use

- **Before the event:** Download a backup once things are set up.
- **During the event:** Download a backup periodically (e.g. every hour) so you have recent restore points.
- **If something goes wrong:** Paste the latest backup JSON and click Restore. Reload the page; you should be back to that state.

## Requirements

- You must be **logged in as the scorer** to download or restore.
- Restore **overwrites** the current game (teams, scores, timer). Support messages are not included in the backup.
