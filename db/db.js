// pool pro export
// Vytváří pool připojení k databázi a exportuje ho pro ostatní moduly.
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Event listenery pro debug
pool.on('acquire', (connection) => {
    console.log(`Connection ${connection.threadId} acquired`);
});
pool.on('release', (connection) => {
    console.log(`Connection ${connection.threadId} released`);
});

// Inicializace databáze – vytvoří tabulku a admina
// async function initDatabase() {
//     let conn;
//     try {
//         conn = await pool.getConnection();

//         // Vytvoření tabulky users
//         await conn.query(`
//             CREATE TABLE IF NOT EXISTS users (
//                 id INT AUTO_INCREMENT PRIMARY KEY,
//                 username VARCHAR(50) UNIQUE NOT NULL,
//                 password_hash VARCHAR(255) NOT NULL,
//                 role ENUM('admin','user') DEFAULT 'user',
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);
//         console.log('✅ Tabulka users připravena');

//         // Kontrola existence admina
//         const [rows] = await conn.query('SELECT id FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin']);
//         if (rows.length === 0) {
//             const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
//             await conn.query(
//                 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
//                 [process.env.ADMIN_USERNAME || 'admin', hash, 'admin']
//             );
//             console.log(`✅ Admin vytvořen: ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
//         } else {
//             console.log('✅ Admin již existuje');
//         }
//     } catch (err) {
//         console.error('❌ Chyba inicializace DB:', err.message);
//         throw err;
//     } finally {
//         if (conn) conn.release();
//     }
// }

// await initDatabase();

export default pool;