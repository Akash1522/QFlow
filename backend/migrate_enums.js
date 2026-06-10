import db from './config/db.js';

async function migrate() {
    try {
        console.log('Altering washing_machines table...');
        await db.execute(`
            ALTER TABLE washing_machines 
            MODIFY COLUMN status ENUM('available', 'running', 'reserved', 'maintenance', 'out_of_service') DEFAULT 'available'
        `);
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
