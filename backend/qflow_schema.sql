-- Schema for QFlow (database selected via pool config, not hardcoded here)

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_number INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS washrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    washroom_number INT NOT NULL,
    status ENUM('available', 'occupied', 'cleaning', 'maintenance') DEFAULT 'available',
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
    UNIQUE KEY floor_washroom (floor_id, washroom_number)
);

DROP TABLE IF EXISTS washing_machines;
CREATE TABLE IF NOT EXISTS washing_machines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    name VARCHAR(100) DEFAULT 'Washing Machine',
    status ENUM('available', 'running', 'reserved', 'maintenance', 'out_of_service') DEFAULT 'available',
    last_maintenance TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_type ENUM('washroom', 'washing_machine') NOT NULL,
    resource_id INT NOT NULL, -- Either washroom_id or washing_machine_id
    token_number INT DEFAULT NULL,
    status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    context VARCHAR(50) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY email_context (email, context)
);

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed initial super admin user (Password: mailhub0722 - will be hashed on first login)
INSERT IGNORE INTO users (name, email, password, role) VALUES ('Akash', 'acash.mailhub@gmail.com', 'mailhub0722', 'admin'); 

-- Clean up old floors if they exist from a previous seed
DELETE FROM floors WHERE floor_number > 3;

-- Seed 3 floors and 8 washrooms each
INSERT INTO floors (floor_number, name) VALUES 
(1, 'First Floor'), (2, 'Second Floor'), (3, 'Third Floor')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO washrooms (floor_id, washroom_number) 
SELECT f.id, v.num 
FROM floors f 
CROSS JOIN (SELECT 1 as num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) v;

-- Seed 3 washing machines
INSERT IGNORE INTO washing_machines (id, floor_id, name, status) VALUES 
(1, 1, 'Washing Machine - Floor 1', 'maintenance'),
(2, 2, 'Washing Machine - Floor 2', 'maintenance'),
(3, 3, 'Washing Machine - Floor 3', 'available');
