# Vercel database troubleshooting

If you see **"Failed to download backup"**, **"Database error"** when entering scores, or **"Invalid score or database error"** on the Scorer page, the app cannot reach your database. Fix it as follows.

## 1. Add the database URL to Vercel

1. Go to [Vercel](https://vercel.com) → your project (**darts-app-v1** or similar).
2. Open **Settings** → **Environment Variables**.
3. Check if **`DATABASE_URL`** (or **`POSTGRES_URL`**) exists for **Production** (and Preview if you use it).
4. If it’s missing:
   - In [Neon](https://neon.tech), open your project → **Connection details**.
   - Copy the **connection string** (starts with `postgresql://...`).
   - In Vercel, add a new variable:
     - **Name:** `DATABASE_URL`
     - **Value:** paste the connection string
     - **Environment:** Production (and Preview if needed)
   - Save and **redeploy** the project (Deployments → ⋮ on latest → Redeploy).

## 2. Neon integration (recommended)

- In the Vercel project, go to **Settings** → **Integrations**.
- If **Neon** is not installed, install it and connect your Neon project. Vercel will set `DATABASE_URL` for you.
- After connecting, **redeploy** so the new variable is used.

## 3. Neon free tier: database paused

- On Neon’s free tier, the database is **paused** after a period of no use.
- In the [Neon console](https://console.neon.tech), open your project. If it says **Paused**, click **Resume**.
- Wait a minute, then try the app again (scores, backup download, reset).

## 4. Confirm it works

- Visit: **`https://your-app.vercel.app/api/check-db`**
- You should see JSON like: `{ "connected": true, "tablesExist": true }`
- If `connected: false`, the connection string is missing or wrong on Vercel.
- If `tablesExist: false`, run the SQL from **`lib/schema.sql`** (and **`lib/schema-support-messages.sql`** if you use support messages) in the Neon SQL editor.

## Summary

| Symptom | Likely cause | Action |
|--------|----------------|--------|
| Backup download fails, scores fail | No `DATABASE_URL` on Vercel | Add env var and redeploy |
| Same after adding env var | Neon DB paused | Resume in Neon console |
| `tablesExist: false` from check-db | Tables not created | Run `lib/schema.sql` in Neon |
