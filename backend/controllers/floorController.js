import db from '../config/db.js';

export const getFloors = async (req, res) => {
  try {
    const [floors] = await db.execute('SELECT * FROM floors ORDER BY floor_number ASC');
    
    // Get washroom stats for each floor
    for(let i=0; i<floors.length; i++) {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
            FROM washrooms WHERE floor_id = ?`, [floors[i].id]);
            
        floors[i].stats = stats[0];
    }
    
    res.json(floors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching floors' });
  }
};

export const getWashroomsByFloor = async (req, res) => {
  try {
    const { floorId } = req.params;
    const [washrooms] = await db.execute('SELECT * FROM washrooms WHERE floor_id = ? ORDER BY washroom_number ASC', [floorId]);
    
    // Get queue lengths for each washroom
    for(let i=0; i<washrooms.length; i++) {
        const [queue] = await db.execute(`
            SELECT COUNT(*) as count FROM queues 
            WHERE resource_type = 'washroom' AND resource_id = ? AND status = 'waiting'`, 
            [washrooms[i].id]
        );
        washrooms[i].queue_length = queue[0].count;
        washrooms[i].estimated_wait_time = queue[0].count * 5; // 5 mins per person
    }
    
    res.json(washrooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching washrooms' });
  }
};
