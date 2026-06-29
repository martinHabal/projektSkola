//funkce na spusteni migrace
//Obsahuje funkce pro práci s migracemi – zajištění tabulky migrations, načtení souborů, spuštění SQL a záznam.


// na ty migrace kaslu!!! proste si jen necham ty scripty na tabulky a seedy, nepotrebuju to.
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
    const conn = await pool.getConnection();//Získá připojení z poolu (zásobníku připojení)
    await conn.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    conn.release();//Uvolní připojení zpět do poolu
}

async function getExecutedMigrations() {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT name FROM migrations');
    conn.release();
    return rows.map(row => row.name);
}

async function runMigrationFile(filePath, fileName) {
    const sql = fs.readFileSync(filePath, 'utf8');
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const statements = sql.split(';').filter(s => s.trim());
        for (const stmt of statements) {
            await conn.query(stmt);
        }
        await conn.query('INSERT INTO migrations (name) VALUES (?)', [fileName]);
        await conn.commit();
        console.log(`✅ Migrace ${fileName} provedena.`);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function runMigrations() {
    console.log('🔄 Spouštím migrace...');
    await ensureMigrationsTable();
    const executed = await getExecutedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();
    let count = 0;
    for (const file of files) {
        if (executed.includes(file)) continue;
        await runMigrationFile(path.join(MIGRATIONS_DIR, file), file);
        count++;
    }
    console.log(count ? `✅ Provedeno ${count} migrací.` : '✅ Žádné nové migrace.');
}