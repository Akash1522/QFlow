import db from '../config/db.js';
import { io } from '../server.js';
import bcrypt from 'bcryptjs';
import otpService from '../services/otpService.js';
import { sendOtpEmail } from '../utils/emailService.js';

export const getStudents = async (req, res) => {
  try {
    const [students] = await db.execute(`
        SELECT u.id, u.name, u.email, u.room_number, u.created_at,
        COUNT(q.id) as total_queues,
        MAX(q.joined_at) as last_activity
        FROM users u
        LEFT JOIN queues q ON u.id = q.user_id
        WHERE u.role = "student"
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const [queueStats] = await db.execute(`
        SELECT 
            COUNT(*) as totalRequests,
            SUM(CASE WHEN status IN ('waiting', 'active') THEN 1 ELSE 0 END) as activeQueues,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedRequests,
            SUM(CASE WHEN status = 'completed' AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) as todaysCompleted,
            AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, joined_at, completed_at) ELSE NULL END) as avgWaitTime
        FROM queues
    `);

    const [userStats] = await db.execute("SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'");

    // Queue Activity (Last 7 Days)
    const [weeklyActivity] = await db.execute(`
        SELECT DATE_FORMAT(joined_at, '%a') as name, COUNT(*) as queues
        FROM queues
        WHERE joined_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(joined_at), name
        ORDER BY DATE(joined_at) ASC
    `);

    // Resource Distribution
    const [resourceDist] = await db.execute(`
        SELECT resource_type as name, COUNT(*) as value
        FROM queues
        GROUP BY resource_type
    `);

    // Peak Usage Hours
    const [peakHours] = await db.execute(`
        SELECT HOUR(joined_at) as hour, COUNT(*) as count
        FROM queues
        GROUP BY HOUR(joined_at)
        ORDER BY hour ASC
    `);

    // Status Breakdown
    const [statusBreakdown] = await db.execute(`
        SELECT status as name, COUNT(*) as value
        FROM queues
        GROUP BY status
    `);

    // Recent Activity
    const [recentActivity] = await db.execute(`
        SELECT q.id, u.name as user_name, q.resource_type, q.status, q.joined_at, q.completed_at
        FROM queues q
        JOIN users u ON q.user_id = u.id
        ORDER BY q.joined_at DESC
        LIMIT 10
    `);

    // Wait Time Trends
    const [waitTimeTrends] = await db.execute(`
        SELECT DATE_FORMAT(joined_at, '%a') as name, AVG(TIMESTAMPDIFF(MINUTE, joined_at, completed_at)) as avgWait
        FROM queues
        WHERE status = 'completed' AND joined_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(joined_at), name
        ORDER BY DATE(joined_at) ASC
    `);

    // Resource Availability
    const [resAvail] = await db.execute(`
        SELECT 
            (SELECT COUNT(*) FROM washrooms WHERE status = 'available') as washroomsAvailable,
            (SELECT COUNT(*) FROM washrooms WHERE status != 'available') as washroomsInUse,
            (SELECT COUNT(*) FROM washing_machines WHERE status = 'available') as machinesAvailable,
            (SELECT COUNT(*) FROM washing_machines WHERE status != 'available') as machinesInUse
    `);

    res.json({
        kpis: {
            totalRequests: Number(queueStats[0].totalRequests) || 0,
            activeQueues: Number(queueStats[0].activeQueues) || 0,
            completedRequests: Number(queueStats[0].completedRequests) || 0,
            todaysCompleted: Number(queueStats[0].todaysCompleted) || 0,
            avgWaitTime: Math.round(Number(queueStats[0].avgWaitTime)) || 0,
            resourcesAvailable: Number(resAvail[0].washroomsAvailable) + Number(resAvail[0].machinesAvailable),
            totalStudents: Number(userStats[0].totalStudents) || 0
        },
        charts: {
            weeklyActivity: weeklyActivity.map(w => ({ name: w.name, queues: w.queues })),
            resourceDistribution: resourceDist.map(r => ({ name: r.name === 'washroom' ? 'Washroom' : 'Washing Machine', value: r.value })),
            peakHours: peakHours.map(p => ({ name: `${p.hour}:00`, count: p.count })),
            statusBreakdown: statusBreakdown.map(s => ({ name: s.name.charAt(0).toUpperCase() + s.name.slice(1), value: s.value })),
            waitTimeTrends: waitTimeTrends.map(w => ({ name: w.name, avgWait: Math.round(Number(w.avgWait)) || 0 }))
        },
        resourceAvailability: {
            washroomsAvailable: Number(resAvail[0].washroomsAvailable),
            washroomsInUse: Number(resAvail[0].washroomsInUse),
            machinesAvailable: Number(resAvail[0].machinesAvailable),
            machinesInUse: Number(resAvail[0].machinesInUse)
        },
        recentActivity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

export const getSystemSettings = async (req, res) => {
  res.json({
      maxQueueTime: 30,
      maintenanceMode: false,
      autoCleanInterval: 120
  });
};

export const getLiveQueues = async (req, res) => {
    try {
        const [queues] = await db.execute(`
            SELECT q.id, q.status, q.joined_at, u.name as student_name, u.room_number,
            q.resource_type, q.resource_id
            FROM queues q
            JOIN users u ON q.user_id = u.id
            WHERE q.status IN ('waiting', 'active')
            ORDER BY q.joined_at ASC
        `);
        
        const resourceCounts = {};
        const enrichedQueues = queues.map(q => {
            const key = `${q.resource_type}_${q.resource_id}`;
            if (!resourceCounts[key]) resourceCounts[key] = 0;
            if (q.status === 'waiting') resourceCounts[key]++;
            
            return {
                ...q,
                position: q.status === 'active' ? 0 : resourceCounts[key],
                estimated_wait_time: q.status === 'active' ? 0 : (q.resource_type === 'washroom' ? resourceCounts[key] * 5 : resourceCounts[key] * 45)
            };
        });

        res.json(enrichedQueues);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching live queues' });
    }
};

export const getLogs = async (req, res) => {
    try {
        const [logs] = await db.execute(`
            SELECT l.id, l.action, l.description, l.created_at, u.name as admin_name
            FROM logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 100
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching logs' });
    }
};

export const getQueueReports = async (req, res) => {
    try {
        const [reports] = await db.execute(`
            SELECT 
                q.id, 
                u.name as user_name, 
                q.resource_type, 
                q.status, 
                q.joined_at as queue_time, 
                q.completed_at as completion_time, 
                TIMESTAMPDIFF(MINUTE, q.joined_at, IFNULL(q.completed_at, NOW())) as duration
            FROM queues q
            JOIN users u ON q.user_id = u.id
            ORDER BY q.joined_at DESC
        `);
        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};

export const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const [history] = await db.execute(`
            SELECT id, resource_type, status, joined_at, completed_at, 
            TIMESTAMPDIFF(MINUTE, joined_at, IFNULL(completed_at, NOW())) as duration
            FROM queues WHERE user_id = ? ORDER BY joined_at DESC
        `, [id]);
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching student history' });
    }
};

export const actionLiveQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; 

        const [queues] = await db.execute('SELECT * FROM queues WHERE id = ?', [id]);
        if (queues.length === 0) return res.status(404).json({ message: 'Queue not found' });
        const queue = queues[0];

        if (action === 'complete') {
            await db.execute('UPDATE queues SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        } else if (action === 'remove') {
            await db.execute('UPDATE queues SET status = "cancelled", completed_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        } else if (action === 'skip') {
            await db.execute('UPDATE queues SET joined_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        }

        io.emit('queue_update', { resourceType: queue.resource_type, resourceId: queue.resource_id });
        io.to(`user_${queue.user_id}`).emit('notification', { message: `Admin has ${action}ed your queue request.` });

        res.json({ message: `Queue action ${action} successful` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error executing queue action' });
    }
};

export const getAllResources = async (req, res) => {
    try {
        const [floors] = await db.execute('SELECT * FROM floors ORDER BY floor_number ASC');
        const [washrooms] = await db.execute('SELECT * FROM washrooms');
        const [machines] = await db.execute('SELECT * FROM washing_machines');
        
        const floorData = floors.map(floor => ({
            ...floor,
            washrooms: washrooms.filter(w => w.floor_id === floor.id),
            washing_machines: machines.filter(m => m.floor_id === floor.id)
        }));
        
        res.json(floorData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching resources' });
    }
};

export const addResource = async (req, res) => {
    try {
        const { type, floor_id, identifiers } = req.body;
        const userId = req.user.id;
        
        if (!type || !floor_id || !identifiers || identifiers.length === 0) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        if (type === 'washroom') {
            for (let num of identifiers) {
                const [existing] = await db.execute('SELECT * FROM washrooms WHERE floor_id = ? AND washroom_number = ?', [floor_id, num]);
                if (existing.length > 0) continue;
                await db.execute('INSERT INTO washrooms (floor_id, washroom_number, status) VALUES (?, ?, "available")', [floor_id, num]);
            }
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Created Washroom(s)', `Added ${identifiers.length} washroom(s) to floor ${floor_id}`, userId]);
        } else if (type === 'washing_machine') {
            for (let name of identifiers) {
                const [existing] = await db.execute('SELECT * FROM washing_machines WHERE name = ?', [name]);
                if (existing.length > 0) continue;
                await db.execute('INSERT INTO washing_machines (floor_id, name, status) VALUES (?, ?, "available")', [floor_id, name]);
            }
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Created Washing Machine(s)', `Added ${identifiers.length} washing machine(s) to floor ${floor_id}`, userId]);
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        
        res.status(201).json({ message: 'Resources added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding resources' });
    }
};

export const updateResourceStatus = async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (type === 'washroom') {
            await db.execute('UPDATE washrooms SET status = ? WHERE id = ?', [status, id]);
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Updated Washroom Status', `Washroom ${id} status set to ${status}`, userId]);
        } else if (type === 'washing_machine') {
            await db.execute('UPDATE washing_machines SET status = ? WHERE id = ?', [status, id]);
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Updated Washing Machine Status', `Washing Machine ${id} status set to ${status}`, userId]);
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        
        io.emit('resource_update', { type, id, status });
        
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating resource status' });
    }
};

export const deleteResource = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;

        if (type === 'washroom') {
            await db.execute('DELETE FROM washrooms WHERE id = ?', [id]);
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Deleted Washroom', `Deleted washroom ${id}`, userId]);
        } else if (type === 'washing_machine') {
            await db.execute('DELETE FROM washing_machines WHERE id = ?', [id]);
            await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Deleted Washing Machine', `Deleted washing machine ${id}`, userId]);
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting resource' });
    }
};

// Admin Management
export const getAdmins = async (req, res) => {
    try {
        const [admins] = await db.execute(`SELECT id, name, email, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`);
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching admins' });
    }
};

export const sendAdminCreationOtp = async (req, res) => {
    try {
        const adminEmail = req.user.email;
        if (adminEmail !== 'acash.mailhub@gmail.com') {
            return res.status(403).json({ message: 'Only the Super Admin (acash.mailhub@gmail.com) can create new administrators' });
        }

        const otp = await otpService.generateOtp(adminEmail, 'create-admin');
        const emailSent = await sendOtpEmail(adminEmail, otp, req.user.name);
        
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email via SMTP. Please check server logs.' });
        }
        
        res.json({ message: 'OTP sent to your email to authorize admin creation' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error sending OTP' });
    }
};

export const createAdmin = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;
        const currentAdminId = req.user.id;
        const adminEmail = req.user.email;

        if (adminEmail !== 'acash.mailhub@gmail.com') {
            return res.status(403).json({ message: 'Only the Super Admin (acash.mailhub@gmail.com) can create new administrators' });
        }

        try {
            await otpService.verifyOtp(adminEmail, otp, 'create-admin');
        } catch (err) {
            return res.status(401).json({ message: err.message });
        }

        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")', [name, email, hashedPassword]);
        await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Admin Created', `Created new admin: ${email}`, currentAdminId]);

        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating admin' });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const currentAdminId = req.user.id;
        const adminEmail = req.user.email;

        // Ensure only Super Admin can delete admins
        if (adminEmail !== 'acash.mailhub@gmail.com') {
            return res.status(403).json({ message: 'Only the Super Admin can delete administrators' });
        }

        if (Number(id) === Number(currentAdminId)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const [admins] = await db.execute('SELECT id FROM users WHERE role = "admin"');
        if (admins.length <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last remaining admin account' });
        }

        await db.execute('DELETE FROM users WHERE id = ? AND role = "admin"', [id]);
        await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Admin Deleted', `Deleted admin ID: ${id}`, currentAdminId]);

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting admin' });
    }
};

export const deleteAllStudents = async (req, res) => {
    try {
        const currentAdminId = req.user.id;
        
        await db.execute('DELETE FROM users WHERE role = "student"');
        await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', ['Bulk Delete', 'Deleted all student accounts', currentAdminId]);
        
        res.json({ message: 'All student accounts deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting students' });
    }
};
