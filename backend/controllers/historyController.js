import db from '../config/db.js';

export const getQueueHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const [history] = await db.execute(
      `SELECT q.*, 
        CASE 
          WHEN q.resource_type = 'washroom' THEN (SELECT washroom_number FROM washrooms WHERE id = q.resource_id)
          WHEN q.resource_type = 'washing_machine' THEN (SELECT name FROM washing_machines WHERE id = q.resource_id)
        END as resource_name
       FROM queues q 
       WHERE q.user_id = ? AND q.status IN ('completed', 'cancelled')
       ORDER BY q.joined_at DESC LIMIT 50`,
      [userId]
    );
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};
