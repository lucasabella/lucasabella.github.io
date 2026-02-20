import pool from '../config/db.js';

const VALID_METRICS = new Set(['total_visits', 'chains_completed', 'badges_earned']);

function buildMetricExpression(metric) {
  if (metric === 'total_visits') {
    return `(SELECT COUNT(*) FROM visits WHERE user_id = u.id)::int`;
  }
  if (metric === 'chains_completed') {
    return `(
      SELECT COUNT(*) FROM chains c
      WHERE c.location_count > 0
        AND c.location_count = (
          SELECT COUNT(*) FROM visits v
          JOIN locations l ON l.id = v.location_id
          WHERE v.user_id = u.id AND l.chain_id = c.id
        )
    )::int`;
  }
  if (metric === 'badges_earned') {
    return `(SELECT COUNT(*) FROM user_badges WHERE user_id = u.id)::int`;
  }
  // Should never reach here if caller validates
  throw new Error('Invalid metric');
}

export function isValidMetric(metric) {
  return VALID_METRICS.has(metric);
}

export async function getGlobal(metric, limit = 50) {
  const cap = Math.min(limit, 100);
  const expr = buildMetricExpression(metric);
  const { rows } = await pool.query(
    `SELECT
       u.username,
       u.name,
       u.avatar_url,
       ${expr} AS score
     FROM users u
     ORDER BY score DESC, u.created_at ASC
     LIMIT $1`,
    [cap]
  );
  return rows;
}

export async function getFriends(userId, metric) {
  const expr = buildMetricExpression(metric);
  const { rows } = await pool.query(
    `SELECT
       u.username,
       u.name,
       u.avatar_url,
       ${expr} AS score
     FROM users u
     WHERE u.id = $1
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
            AND ((f.requester_id = $1 AND f.addressee_id = u.id)
              OR (f.addressee_id = $1 AND f.requester_id = u.id))
        )
     ORDER BY score DESC, u.created_at ASC`,
    [userId]
  );
  return rows;
}
