// vytvoreni tabulky pro organizaci skolniho roku
// node scripts/organizator.js
import bcrypt from 'bcrypt';
import pool from '#db/db'

async function initDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                event_date DATE NOT NULL,
                event_time TIME NULL,
                description TEXT,
                type ENUM('holiday', 'vacation', 'custom') DEFAULT 'custom',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_date (event_date),
                INDEX idx_type (type)
            )
        `);
        console.log('✅ Databáze inicializována');
    } catch (error) {
        console.error('❌ Chyba při inicializaci DB:', error);
    } finally {
        connection.release();
    }
}

initDatabase();