// Sinitsin's House - tiny backend
// Serves the app and stores ONE shared house document, gated by a shared password.
// Storage: Postgres if DATABASE_URL is set (Railway/Render/Fly), otherwise a local JSON file.

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.APP_PASSWORD || 'changeme'; // set this in your host!
const DATABASE_URL = process.env.DATABASE_URL;

app.use(express.json({ limit: '25mb' }));        // images are stored as base64, so allow large bodies
app.use(express.static(path.join(__dirname, 'public')));

// ---------- storage layer ----------
let store;
if (DATABASE_URL) {
  const { Pool } = require('pg');
  // Railway's internal DB host and localhost don't use SSL; external hosts (Neon, Render, etc.) do.
  const noSSL = /localhost|127\.0\.0\.1|railway\.internal/.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: noSSL ? false : { rejectUnauthorized: false }
  });
  store = {
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS house_data (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`INSERT INTO house_data (id, data) VALUES (1, '{}'::jsonb)
                        ON CONFLICT (id) DO NOTHING`);
    },
    async get() {
      const r = await pool.query('SELECT data FROM house_data WHERE id = 1');
      return r.rows[0] ? r.rows[0].data : {};
    },
    async set(data) {
      await pool.query(
        'UPDATE house_data SET data = $1, updated_at = now() WHERE id = 1',
        [data]
      );
    }
  };
  console.log('Storage: Postgres');
} else {
  const FILE = path.join(__dirname, 'data', 'house.json');
  store = {
    async init() {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}');
    },
    async get() {
      try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
      catch { return {}; }
    },
    async set(data) {
      fs.writeFileSync(FILE, JSON.stringify(data));
    }
  };
  console.log('Storage: local file (data/house.json) - set DATABASE_URL for a real database');
}

// ---------- auth ----------
function checkAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (token && token === PASSWORD) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// ---------- routes ----------
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === PASSWORD) return res.json({ ok: true });
  res.status(401).json({ ok: false, error: 'wrong password' });
});

app.get('/api/data', checkAuth, async (req, res) => {
  try { res.json({ data: await store.get() }); }
  catch (e) { console.error(e); res.status(500).json({ error: 'read failed' }); }
});

app.post('/api/data', checkAuth, async (req, res) => {
  try {
    const data = (req.body && req.body.data) || {};
    await store.set(data);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'write failed' }); }
});

app.get('/health', (req, res) => res.send('ok'));

store.init()
  .then(() => app.listen(PORT, () => console.log('Sinitsin\'s House running on port ' + PORT)))
  .catch(err => { console.error('Startup failed', err); process.exit(1); });
