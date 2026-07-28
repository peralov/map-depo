// backend/models/database.js
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const migrations = [
  {
    id: '001_initial_schema',
    up: async () => {
      await exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'public',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS organizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS depos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          status TEXT DEFAULT 'medium',
          type TEXT DEFAULT 'garbage',
          size TEXT DEFAULT 'medium',
          reported_by INTEGER,
          vouch_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reported_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          depo_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (depo_id) REFERENCES depos(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          depo_id INTEGER NOT NULL,
          reporter_id INTEGER NOT NULL,
          details TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (depo_id) REFERENCES depos(id),
          FOREIGN KEY (reporter_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS cleanups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          depo_id INTEGER NOT NULL,
          organizer_id INTEGER NOT NULL,
          date DATETIME NOT NULL,
          details TEXT,
          status TEXT DEFAULT 'scheduled',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (depo_id) REFERENCES depos(id),
          FOREIGN KEY (organizer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS cleanup_participants (
          cleanup_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (cleanup_id, user_id),
          FOREIGN KEY (cleanup_id) REFERENCES cleanups(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS vouches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          depo_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (depo_id) REFERENCES depos(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_vouches_depo_user
          ON vouches (depo_id, user_id);
      `);
    }
  }
];

const runMigrations = async () => {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  for (const migration of migrations) {
    const existing = await get('SELECT id FROM schema_migrations WHERE id = ?', [migration.id]);
    if (!existing) {
      await migration.up();
      await run('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)', [migration.id]);
    }
  }
};

const seedDatabase = async () => {
  const hashedPassword = bcrypt.hashSync('test123', 10);
  await run(
    `INSERT OR IGNORE INTO users (username, password, email, role)
     VALUES (?, ?, ?, ?)`,
    ['demo', hashedPassword, 'demo@example.com', 'public']
  );

  const adminPassword = bcrypt.hashSync('admin123', 10);
  await run(
    `INSERT OR IGNORE INTO users (username, password, email, role)
     VALUES (?, ?, ?, ?)`,
    ['admin', adminPassword, 'admin@example.com', 'admin']
  );

  const demoUser = await get('SELECT id FROM users WHERE username = ?', ['demo']);
  const reportedBy = demoUser.id;
  const depos = [
    ['Demo site — Nairobi', 'Illustrative high-priority waste report for local development.', -1.2864, 36.8172, 'high', 'garbage', 'large', reportedBy, 3],
    ['Demo site — Lisbon', 'Illustrative construction-waste report for local development.', 38.7223, -9.1393, 'medium', 'construction', 'medium', reportedBy, 1],
    ['Demo site — Jakarta', 'Illustrative riverside plastic report for local development.', -6.2088, 106.8456, 'low', 'plastic', 'small', reportedBy, 2],
    ['Demo site — Mexico City', 'Illustrative electronic-waste report for local development.', 19.4326, -99.1332, 'medium', 'electronic', 'medium', reportedBy, 0],
    ['Demo site — Sydney', 'Illustrative record of a completed community cleanup.', -33.8688, 151.2093, 'clean', 'garbage', 'small', reportedBy, 5],
  ];

  for (const depo of depos) {
    const [name] = depo;
    const existing = await get(
      'SELECT id FROM depos WHERE name = ? AND reported_by = ? LIMIT 1',
      [name, reportedBy]
    );

    if (existing) {
      continue;
    }

    await run(
      `INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      depo
    );
  }
};

const resetDatabase = async () => {
  await exec(`
    DROP TABLE IF EXISTS cleanup_participants;
    DROP TABLE IF EXISTS vouches;
    DROP TABLE IF EXISTS cleanups;
    DROP TABLE IF EXISTS reports;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS depos;
    DROP TABLE IF EXISTS organizations;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS schema_migrations;
  `);
};

const initializeDatabase = async (options = {}) => {
  const shouldSeed = options.seed ?? process.env.SEED_DATABASE !== 'false';

  if (options.reset) {
    await resetDatabase();
  }

  await runMigrations();

  if (shouldSeed) {
    await seedDatabase();
  }
};

module.exports = {
  closeDatabase,
  exec,
  get,
  initializeDatabase,
  resetDatabase,
  run,
  runMigrations,
  seedDatabase
};
