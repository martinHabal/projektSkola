import bcrypt from 'bcrypt';
import pool from '#db/db';//moderni import - nastaveny v package.json
//node scripts/createAdmin.js
//spustim v bashi a tim vytvorim admina


async function createAdmin() {
    const username = 'admin';
    const password = 'admin123';
    const saltRounds = 10;
    
    try {
        // Hashování hesla
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Smazání starého admina (pokud existuje)
        await pool.query('DELETE FROM users WHERE username = ?', [username]);
        
        // Vytvoření nového admina s hashem
        const [result] = await pool.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, 'admin']
        );
        
        console.log(`✅ Admin vytvořen: ${username}`);
        console.log(`📝 Heslo: ${password}`);
        console.log(`🔒 Hash: ${password}`);
        console.log(`🆔 ID: ${result.insertId}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Chyba:', err);
        process.exit(1);
    }
}

createAdmin();