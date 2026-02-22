import pool from '../config/db.js';

export async function create(userId, locationId) {
    const { rows } = await pool.query(
        `INSERT INTO check_ins (user_id, location_id)
     VALUES ($1, $2)
     RETURNING *`,
        [userId, locationId]
    );
    return rows[0];
}

export async function getCountForLocation(userId, locationId) {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count
     FROM check_ins
     WHERE user_id = $1 AND location_id = $2`,
        [userId, locationId]
    );
    return rows[0].count;
}

export async function getMayorForLocation(locationId) {
    const { rows } = await pool.query(
        `SELECT u.username, ranked.count::int
     FROM (
       SELECT user_id, COUNT(*) as count,
         ROW_NUMBER() OVER(ORDER BY COUNT(*) DESC, MAX(checked_in_at) ASC) as rn
       FROM check_ins
       WHERE location_id = $1
       GROUP BY user_id
     ) ranked
     JOIN users u ON u.id = ranked.user_id
     WHERE ranked.rn = 1`,
        [locationId]
    );
    return rows[0] || null;
}
