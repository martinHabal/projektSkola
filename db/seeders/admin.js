// db/seeders/admin.js
import { pool } from '../index.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

export async function seedAdmin() {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            'SELECT id FROM users WHERE username = ?',
            [adminUser]
        );
        if (rows.length === 0) {
            const hash = await bcrypt.hash(adminPass, 10);
            await conn.query(
                `INSERT INTO users (username, password_hash, role, is_active)
                 VALUES (?, ?, ?, ?)`,
                [adminUser, hash, 'admin', true]
            );
            console.log(`✅ Seed: Admin ${adminUser} vytvořen.`);
        } else {
            console.log(`ℹ️ Seed: Admin ${adminUser} již existuje.`);
        }
    } finally {
        conn.release();
    }
}