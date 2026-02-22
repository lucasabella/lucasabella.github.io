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
       CASE WHEN v.id IS NOT NULL THEN true ELSE false END AS visited,
       COALESCE(ci.checkin_count, 0)::int AS checkin_count,
       m.mayor_username AS mayor
     FROM locations l
     LEFT JOIN visits v ON v.location_id = l.id AND v.user_id = $1
     LEFT JOIN (
       SELECT location_id, COUNT(*) AS checkin_count
       FROM check_ins WHERE user_id = $1
       GROUP BY location_id
     ) ci ON ci.location_id = l.id
     LEFT JOIN (
       SELECT location_id, u.username as mayor_username 
       FROM (
         SELECT location_id, user_id, COUNT(*) as count,
         ROW_NUMBER() OVER(PARTITION BY location_id ORDER BY COUNT(*) DESC, MAX(checked_in_at) ASC) as rn
         FROM check_ins GROUP BY location_id, user_id
       ) ranked
       JOIN users u ON u.id = ranked.user_id
       WHERE rn = 1
     ) m ON m.location_id = l.id
     WHERE l.chain_id = $2
     ORDER BY l.name`,
    [userId, chain.id]
  );

  return { ...chain, locations };
}
