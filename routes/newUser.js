import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


// Zobrazení formuláře
router.get('/new-user', (req, res) => {
    res.render('new-user', { error: null, success: null });
});

// Vytvoření uživatele
router.post('/users/create', async (req, res) => {
    const { name, surname, login, password, role } = req.body;

    // Validace
    if (!name || !surname || !login || !password) {
        return res.render('new-user', { 
            error: 'Všechna pole jsou povinná!',
            success: null 
        });
    }

    try {
        // Kontrola zda uživatel existuje
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [login]
        );

        if (existing.length > 0) {
            return res.render('new-user', { 
                error: 'Uživatel s tímto loginem již existuje!',
                success: null 
            });
        }

        // Hashování hesla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Vložení do databáze
        await pool.execute(
            `INSERT INTO users (first_name, last_name, username, password, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, surname, login, hashedPassword, role || 'user']
        );

        res.render('new-user', { 
            error: null,
            success: 'Uživatel byl úspěšně vytvořen!'
        });

    } catch (error) {
        console.error('Chyba při vytváření uživatele:', error);
        res.render('new-user', { 
            error: 'Chyba při vytváření uživatele',
            success: null 
        });
    }
});

export default router;