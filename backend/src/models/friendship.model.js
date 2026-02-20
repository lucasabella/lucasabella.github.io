import pool from '../config/db.js';

/**
 * Returns all friendship rows involving userId, enriched with the other user's profile.
 * Includes pending (both directions) and accepted friendships.
 */
export async function listForUser(userId) {
  const { rows } = await pool.query(
    `SELECT
       f.id,
       f.status,
       f.created_at,
       CASE WHEN f.requester_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction,
       u.id       AS other_user_id,
       u.username AS other_username,
       u.name     AS other_name,
       u.avatar_url AS other_avatar_url
     FROM friendships f
     JOIN users u ON u.id = CASE
       WHEN f.requester_id = $1 THEN f.addressee_id
       ELSE f.requester_id
     END
     WHERE f.requester_id = $1 OR f.addressee_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Send a friend request from requesterId to addresseeId.
 * Validates: not self, no existing row in either direction.
 */
export async function sendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) {
    throw Object.assign(new Error('Cannot send friend request to yourself'), { status: 400 });
  }

  // Check both directions for existing friendship
  const { rows: existing } = await pool.query(
    `SELECT id FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [requesterId, addresseeId]
  );
  if (existing.length > 0) {
    throw Object.assign(new Error('Friendship already exists'), { status: 409 });
  }

  const { rows } = await pool.query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`,
    [requesterId, addresseeId]
  );
  return rows[0];
}

/**
 * Accept a pending friend request.
 * currentUserId must be the addressee (IDOR guard).
 */
export async function acceptRequest(friendshipId, currentUserId) {
  const { rows } = await pool.query(
    `UPDATE friendships
     SET status = 'accepted', updated_at = NOW()
     WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING *`,
    [friendshipId, currentUserId]
  );
  if (!rows.length) {
    throw Object.assign(new Error('Friend request not found'), { status: 404 });
  }
  return rows[0];
}

/**
 * Remove a friendship (either direction) or decline a pending request.
 * currentUserId must be either requester or addressee (IDOR guard).
 */
export async function remove(friendshipId, currentUserId) {
  const { rowCount } = await pool.query(
    `DELETE FROM friendships
     WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
    [friendshipId, currentUserId]
  );
  if (rowCount === 0) {
    throw Object.assign(new Error('Friendship not found'), { status: 404 });
  }
  return true;
}

/**
 * Returns an array of user IDs who are accepted friends of userId.
 */
export async function getFriendIds(userId) {
  const { rows } = await pool.query(
    `SELECT
       CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END AS friend_id
     FROM friendships
     WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
    [userId]
  );
  return rows.map((r) => r.friend_id);
}
