import pool from '../config/db.js';

export async function findAll(userId) {
  const { rows } = await pool.query(
    `SELECT c.*,
       COALESCE(v.visited_count, 0)::int AS visited_count
     FROM chains c
     LEFT JOIN (
       SELECT l.chain_id, COUNT(v.id) AS visited_count
       FROM visits v
       JOIN locations l ON l.id = v.location_id
       WHERE v.user_id = $1
       GROUP BY l.chain_id
     ) v ON v.chain_id = c.id
     ORDER BY c.name`,
    [userId]
  );
  return rows;
}

export async function findBySlug(slug, userId) {
  const { rows: chains } = await pool.query(
    'SELECT * FROM chains WHERE slug = $1',
    [slug]
  );
  const chain = chains[0];
  if (!chain) return null;

  const { rows: locations } = await pool.query(
    `SELECT l.*,
       CASE WHEN v.id IS NOT NULL THEN true ELSE false END AS visited
     FROM locations l
     LEFT JOIN visits v ON v.location_id = l.id AND v.user_id = $1
     WHERE l.chain_id = $2
     ORDER BY l.name`,
    [userId, chain.id]
  );

  return { ...chain, locations };
}
