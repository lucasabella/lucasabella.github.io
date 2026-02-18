import pool from '../config/db.js';

export async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

export async function findByGoogleId(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] || null;
}

export async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function create({ email, name, passwordHash, googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, password_hash, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, avatar_url, created_at`,
    [email, name, passwordHash || null, googleId || null, avatarUrl || null]
  );
  return rows[0];
}
