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
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, username, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    // 42703 = column does not exist (migration 010 not yet run)
    if (err.code === '42703') {
      const { rows } = await pool.query(
        'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
        [id]
      );
      return rows[0] || null;
    }
    throw err;
  }
}

export async function create({ email, name, username, passwordHash, googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, username, password_hash, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, name, username, avatar_url, created_at`,
    [email, name, username, passwordHash || null, googleId || null, avatarUrl || null]
  );
  return rows[0];
}

export async function searchByUsername(query, limit = 20) {
  const { rows } = await pool.query(
    `SELECT username, name, avatar_url FROM users
     WHERE username ILIKE $1
     LIMIT $2`,
    [`${query}%`, limit]
  );
  return rows;
}

export async function findByUsername(username) {
  const { rows } = await pool.query(
    'SELECT id, username, name, avatar_url FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
}
