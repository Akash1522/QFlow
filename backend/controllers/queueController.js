import db from '../config/db.js';
import { io } from '../server.js';

export const joinQueue = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.body;
    const userId = req.user.id;

    // Check if user is already in a queue
    const [activeQueues] = await db.execute(
      'SELECT * FROM queues WHERE user_id = ? AND status IN ("waiting", "active")',
      [userId]
    );

    if (activeQueues.length > 0) {
      return res.status(400).json({ message: 'You are already in a queue' });
    }

    // Calculate Daily Token Number
    const [tokenData] = await db.execute(
      'SELECT MAX(token_number) as max_token FROM queues WHERE resource_type = ? AND resource_id = ? AND DATE(joined_at) = CURDATE()',
      [resourceType, resourceId]
    );
    const tokenNumber = (tokenData[0].max_token || 0) + 1;

    // Join queue
    await db.execute(
      'INSERT INTO queues (user_id, resource_type, resource_id, token_number) VALUES (?, ?, ?, ?)',
      [userId, resourceType, resourceId, tokenNumber]
    );

    // Create Notification
    const message = `You have successfully joined the ${resourceType === 'washroom' ? 'Washroom' : 'Washing Machine'} queue.`;
    await db.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [userId, message]
    );

    // Notify all clients to update the queue count
    io.emit('queue_update', { resourceType, resourceId });
    io.to(`user_${userId}`).emit('notification', { message });

    res.status(201).json({ message: 'Successfully joined the queue' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error joining queue' });
  }
};

export const leaveQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    const [queues] = await db.execute(
      'SELECT * FROM queues WHERE user_id = ? AND status IN ("waiting", "active")',
      [userId]
    );

    if (queues.length === 0) {
      return res.status(400).json({ message: 'You are not in any queue' });
    }

    const queue = queues[0];

    await db.execute(
      'UPDATE queues SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [queue.id]
    );

    // Find next person in line
    const [nextInLine] = await db.execute(
      'SELECT user_id FROM queues WHERE resource_type = ? AND resource_id = ? AND status = "waiting" ORDER BY joined_at ASC LIMIT 1',
      [queue.resource_type, queue.resource_id]
    );

    if (nextInLine.length > 0) {
      const nextUserId = nextInLine[0].user_id;
      const notifyMsg = `🔔 It's your turn! The ${queue.resource_type === 'washroom' ? 'Washroom' : 'Washing Machine'} is now available.`;
      
      await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [nextUserId, notifyMsg]);
      io.to(`user_${nextUserId}`).emit('notification', { message: notifyMsg });
    }

    io.emit('queue_update', { resourceType: queue.resource_type, resourceId: queue.resource_id });

    res.json({ message: 'Successfully left the queue' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error leaving queue' });
  }
};

export const getQueueStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [queues] = await db.execute(
      'SELECT * FROM queues WHERE user_id = ? AND status IN ("waiting", "active")',
      [userId]
    );

    if (queues.length === 0) {
      return res.json({ inQueue: false });
    }

    const queue = queues[0];

    // Calculate position
    const [positionData] = await db.execute(
      'SELECT COUNT(*) as pos FROM queues WHERE resource_type = ? AND resource_id = ? AND status = "waiting" AND joined_at <= ?',
      [queue.resource_type, queue.resource_id, queue.joined_at]
    );

    res.json({
      inQueue: true,
      queueInfo: queue,
      position: positionData[0].pos,
      estimatedWaitTime: positionData[0].pos * 5
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error getting queue status' });
  }
};

export const getWashingMachineStatus = async (req, res) => {
    try {
        const [machines] = await db.execute('SELECT * FROM washing_machines');
        
        if (machines.length === 0) {
            return res.status(404).json({ message: 'Washing machines not found' });
        }
        
        for (let machine of machines) {
            const [queue] = await db.execute(`
                SELECT COUNT(*) as count FROM queues 
                WHERE resource_type = 'washing_machine' AND resource_id = ? AND status = 'waiting'`, 
                [machine.id]
            );
            
            machine.queue_length = queue[0].count;
            machine.estimated_wait_time = queue[0].count * 45; // 45 mins per wash cycle
        }
        
        res.json(machines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
