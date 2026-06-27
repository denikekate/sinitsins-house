# Sinitsin's House — hosted version

An interactive house planner. One shared plan, one shared password, synced across all your devices.

- **Front end:** `public/index.html` (the app you already know)
- **Back end:** `server.js` — serves the app and saves the shared house to a database
- **Storage:** Postgres in production; a local file when you run it on your own computer

---

## Deploy on Railway (recommended)

You'll do this once. Budget ~15–20 minutes.

### 1. Put this folder on GitHub
1. Create a new **private** repository on github.com (e.g. `sinitsins-house`).
2. Upload the **contents of this `sinitsins-house-app` folder** to that repo
   (`server.js`, `package.json`, `public/`, etc.). The easiest way is GitHub's
   "uploading an existing file" button, or GitHub Desktop.
   - Don't worry about `node_modules` — it's ignored on purpose; Railway installs it for you.

### 2. Create the Railway project
1. Go to **railway.app** → **New Project** → **Deploy from GitHub repo**.
2. Pick your `sinitsins-house` repo. Railway will detect Node and start building.

### 3. Add the database
1. In the same project, click **New → Database → Add PostgreSQL**.
2. Open your **web service** (the one built from your repo) → **Variables** tab.
3. Add a variable that points at the database:
   - **Name:** `DATABASE_URL`
   - **Value:** `${{Postgres.DATABASE_URL}}`  ← type it exactly, Railway fills it in.

### 4. Set your shared password
Still on the web service's **Variables** tab, add:
- **Name:** `APP_PASSWORD`
- **Value:** whatever password you and Philipp will use (pick something only you two know).

### 5. Get your link
1. Web service → **Settings → Networking → Generate Domain**.
2. Railway gives you a URL like `sinitsins-house-production.up.railway.app`.
3. Open it on any device, enter the shared password, and you're in. 🎉

Bookmark that URL on your phones and laptops. Everything you type syncs automatically.

---

## Everyday use
- **Log in:** open the URL, type the shared password (saved on that device until you log out).
- **Sync:** changes save a moment after you stop typing; the header shows "All changes saved".
  Coming back to the tab pulls the latest from the other person's edits.
- **Change the password:** edit `APP_PASSWORD` in Railway → the app redeploys → everyone logs in again.
- **Backups:** the **Export backup** button still works and downloads a JSON copy of everything.
  **Import backup** restores it. Good to do occasionally just in case.

## A note on photos
Images are stored inside the database as text. That's perfect for a normal amount of
room photos. If you ever upload hundreds of large images it could get heavy — if that
happens, tell your helper and we'll move images to dedicated file storage.

---

## Run it on your own computer (optional)
You don't need this to use the hosted version, but it's handy for testing changes.

```bash
npm install
APP_PASSWORD=test npm start
# open http://localhost:3000  (password: test)
```

Without a `DATABASE_URL`, it stores data in `data/house.json` on your machine.

## Other hosts (if you ever move off Railway)
The same code runs on **Render** or **Fly.io**. Steps are nearly identical:
create a web service from the repo, add a Postgres database, set `DATABASE_URL`
and `APP_PASSWORD`. External databases use SSL — the server detects that automatically.

## Environment variables reference
| Variable       | Required | What it does                                            |
|----------------|----------|---------------------------------------------------------|
| `APP_PASSWORD` | yes      | The shared password to log in.                          |
| `DATABASE_URL` | prod     | Postgres connection string. Omit to use a local file.   |
| `PORT`         | auto     | Set by the host automatically; no need to touch it.     |
