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
