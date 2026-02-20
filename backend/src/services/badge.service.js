import pool from '../config/db.js';
import * as Visit from '../models/visit.model.js';

export async function checkAndAwardBadges(userId) {
    const stats = await Visit.getStats(userId);
    const newlyAwarded = [];

    const checkBadge = async (code, condition) => {
        if (condition) {
            const { rowCount } = await pool.query(
                `INSERT INTO user_badges (user_id, badge_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, badge_id) DO NOTHING`,
                [userId, code]
            );
            if (rowCount > 0) {
                // Fetch badge details to return
                const { rows } = await pool.query('SELECT * FROM badges WHERE id = $1', [code]);
                if (rows.length) {
                    newlyAwarded.push(rows[0]);
                }
            }
        }
    };

    // 1. First Bite (visited_locations >= 1)
    await checkBadge('first_bite', stats.visited_locations >= 1);

    // 2. The Loyalist (visited_locations >= 5)
    await checkBadge('loyalist', stats.visited_locations >= 5);

    // 3. Veteran Chaser (visited_locations >= 25)
    await checkBadge('veteran', stats.visited_locations >= 25);

    // 4. Chain Hopper (chains_started >= 3)
    await checkBadge('hopper', stats.chains_started >= 3);

    // 5. Completionist (chains_completed >= 1)
    await checkBadge('completionist', stats.chains_completed >= 1);

    return newlyAwarded;
}

export async function getUserBadges(userId) {
    const { rows } = await pool.query(
        `SELECT b.*, ub.earned_at
     FROM badges b
     JOIN user_badges ub ON b.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY ub.earned_at DESC`,
        [userId]
    );
    return rows;
}
