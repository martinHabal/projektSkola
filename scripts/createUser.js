// timto scriptem budu vytvaret dalsi usery
// node scripts/createUser.js
import bcrypt from 'bcrypt';
import pool from '#db/db';
function randomString(length = 10) {
    return Math.random().toString(36).slice(2, 2 + length);
}

async function createUser() {
    const username = `user_${randomString(6)}`;
    const password = randomString(12);
    
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hash, 'user']
        );
        
        console.log(`✅ Uživatel: ${username}`);
        console.log(`🔑 Heslo: ${password}`);
        process.exit(0);
    } catch (err) {
        console.error('❌', err.message);
        process.exit(1);
    }
}

createUser();