import pool from '../config/db.js';

export async function create(userId, locationId) {
  const { rows } = await pool.query(
    `INSERT INTO visits (user_id, location_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, location_id) DO NOTHING
     RETURNING *`,
    [userId, locationId]
  );
  return rows[0] || null;
}

export async function remove(userId, locationId) {
  const { rowCount } = await pool.query(
    'DELETE FROM visits WHERE user_id = $1 AND location_id = $2',
    [userId, locationId]
  );
  return rowCount > 0;
}

export async function bulkCreateBySourceIds(userId, sourceIds) {
  if (!sourceIds.length) return 0;

  const { rowCount } = await pool.query(
    `INSERT INTO visits (user_id, location_id)
     SELECT $1, l.id FROM locations l WHERE l.source_id = ANY($2)
     ON CONFLICT (user_id, location_id) DO NOTHING`,
    [userId, sourceIds]
  );
  return rowCount;
}

export async function getStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM chains)::int AS total_chains,
       (SELECT COUNT(*) FROM locations)::int AS total_locations,
       (SELECT COUNT(*) FROM visits WHERE user_id = $1)::int AS visited_locations,
       (SELECT COUNT(DISTINCT l.chain_id) FROM visits v JOIN locations l ON l.id = v.location_id WHERE v.user_id = $1)::int AS chains_started,
       (SELECT COUNT(*) FROM chains c WHERE c.location_count > 0 AND c.location_count = (
         SELECT COUNT(*) FROM visits v JOIN locations l ON l.id = v.location_id WHERE v.user_id = $1 AND l.chain_id = c.id
       ))::int AS chains_completed
     `,
    [userId]
  );
  return rows[0];
}
