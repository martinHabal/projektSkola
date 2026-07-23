import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

// Zpracování registrace školy
router.post("/register-school", async (req, res) => {
    console.log("Přijat požadavek na vytvoření nové školy");
    console.log("Request body:", req.body);

    const { school_name, adminLogin, password } = req.body;

    // Získání připojení z poolu
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Připojení k databázi úspěšné");
    } catch (err) {
        console.error("Chyba připojení k databázi:", err);
        return res.status(500).json({
            error: "Chyba připojení k databázi",
            detail: err.message,
        });
    }

    try {
        // Validace vstupu
        if (!school_name || !adminLogin || !password) {
            connection.release();
            console.log("Chybějící povinná pole");
            return res.status(400).json({
                error: "Všechna pole jsou povinná!",
                schoolName: school_name,
                adminLogin: adminLogin,
            });
        }

        if (password.length < 6) {
            connection.release();
            console.log("Heslo je příliš krátké");
            return res.status(400).json({
                error: "Heslo musí mít alespoň 6 znaků!",
                schoolName: school_name,
                adminLogin: adminLogin,
            });
        }

        // Vytvoření názvu databáze
        const dbName = `school_${school_name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        console.log(`Název databáze: ${dbName}`);

        // Vytvoření databáze
        const createDbQuery = `CREATE DATABASE IF NOT EXISTS \`${dbName}\``;
        console.log("Vytvářím databázi...");
        await connection.query(createDbQuery);
        console.log(`Databáze ${dbName} byla vytvořena nebo již existuje.`);

        // Uvolnění původního připojení
        connection.release();

        // Vytvoření nového připojení přímo k nové databázi
        console.log("Připojuji se k nové databázi...");
        const newConnection = await pool.getConnection();
        await newConnection.changeUser({ database: dbName });
        console.log(`Připojeno k databázi ${dbName}`);

        // Vytvoření tabulek
        console.log("Vytvářím tabulky...");
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role ENUM('admin', 'teacher', 'director') DEFAULT 'teacher',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    users_id INT NOT NULL,
    work_date DATE NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    day_type VARCHAR(30) DEFAULT NULL,
    hours_worked INT DEFAULT 0,
    hours_subbed INT DEFAULT 0,
    hours_missed INT DEFAULT 0,
    reason_missed VARCHAR(100) DEFAULT NULL,
    month TINYINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id) ON DELETE CASCADE
);`,
            `CREATE TABLE IF NOT EXISTS uvazky (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    po INT DEFAULT 0,
    ut INT DEFAULT 0,
    st INT DEFAULT 0,
    ct INT DEFAULT 0,
    pa INT DEFAULT 0,
    so INT DEFAULT 0,
    ne INT DEFAULT 0,
    prespoctne INT DEFAULT 0,
    total_hodiny INT GENERATED ALWAYS AS (
        COALESCE(po, 0) + COALESCE(ut, 0) + COALESCE(st, 0) + 
        COALESCE(ct, 0) + COALESCE(pa, 0)
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
            `CREATE TABLE IF NOT EXISTS odevzdano (
                id INT AUTO_INCREMENT PRIMARY KEY,
                  odevzdano TINYINT(1) DEFAULT 0 NOT NULL,
    datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    users_id INT NOT NULL
            );`
        ];

        // Spuštění všech SQL dotazů pro vytvoření tabulek
        for (const tableQuery of tables) {
            try {
                await newConnection.query(tableQuery);
                console.log("Tabulka vytvořena");
            } catch (err) {
                console.error("Chyba při vytváření tabulky:", err);
                throw err;
            }
        }

        // Vytvoření indexů
        console.log("Vytvářím indexy...");
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, work_date)`,
            `CREATE INDEX IF NOT EXISTS idx_uvazky_user ON uvazky(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_odevzdano_worklog ON odevzdano(work_log_id)`,
        ];

        for (const indexQuery of indexes) {
            try {
                await newConnection.query(indexQuery);
            } catch (err) {
                console.log("Poznámka: Index již možná existuje:", err.message);
            }
        }

        console.log("Tabulky byly vytvořeny.");

        // Vytvoření admin účtu
        console.log("Vytvářím admin účet...");
        const hash = await bcrypt.hash(password, 10);

        const insertAdmin = `
            INSERT INTO users (username, password, first_name, last_name, role) 
            VALUES (?, ?, 'admin', 'admin', 'admin')
        `;

        await newConnection.query(insertAdmin, [
            adminLogin,
            hash,
            `Admin ${school_name}`,
        ]);
        console.log("Admin účet byl vytvořen.");

        // Uvolnění připojení
        newConnection.release();
        console.log("Připojení uvolněno");

        // Uložení informací o škole do session
        req.session.school = {
            name: school_name,
            dbName: dbName,
            adminLogin: adminLogin,
        };
        console.log("Session uložena");

        // Odeslání JSON odpovědi pro testování
        return res.status(200).json({
            success: true,
            message: `Škola "${school_name}" byla úspěšně vytvořena!`,
            schoolName: school_name,
            dbName: dbName,
            adminLogin: adminLogin,
        });
    } catch (error) {
        console.error("Chyba:", error);
        // Uvolnění připojení v případě chyby
        if (connection) {
            try {
                connection.release();
            } catch (e) {
                console.error("Chyba při uvolňování připojení:", e);
            }
        }

        return res.status(500).json({
            success: false,
            error: `Došlo k chybě: ${error.message}`,
            stack: error.stack,
            schoolName: school_name,
            adminLogin: adminLogin,
        });
    }
});

export default router;
