import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import pool from './db/db.js';
import 'dotenv/config';
import mysql from 'mysql2/promise';
// import { runMigrations } from './db/migrations/migrate.js';
// import { seedAdmin } from './db/seeders/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Nastavení EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // pro HTTPS dejte true
}));

// Middleware – kontrola přihlášení
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Přístup odepřen – vyžadována admin role');
    }
}

// ---------- ROUTY ----------

//import modulu get
import router from './routes/get/router.js';
app.use('/', router);

// GET / – přesměrování na dashboard nebo login
// app.get('/', (req, res) => {
//     if (req.session.user) {
//         res.redirect('/dashboard');
//     } else {
//         res.redirect('/login');
//     }
// });

// GET /login – přihlašovací formulář
// app.get('/login', (req, res) => {
//     if (req.session.user) {
//         return res.redirect('/dashboard');
//     }
//     res.render('login', { error: null });
// });

// POST /login – zpracování přihlášení
// Pomocná funkce pro získání IP adresy (bere v úvahu proxy)
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() 
        || req.socket.remoteAddress 
        || req.ip 
        || 'unknown';
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    let userId = null;
    let success = false;
    let errorMessage = null;

    try {
        // Ověření uživatele
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            errorMessage = 'Uživatel nenalezen';
            // Uložíme log ještě před odesláním odpovědi
            await logLoginAttempt(null, username, ip, userAgent, false, errorMessage);
            return res.render('login', { error: 'Neplatné uživatelské jméno nebo heslo.' });
        }

        const user = rows[0];
        const bcrypt = (await import('bcrypt')).default;
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            errorMessage = 'Nesprávné heslo';
            await logLoginAttempt(user.id, username, ip, userAgent, false, errorMessage);
            return res.render('login', { error: 'Neplatné uživatelské jméno nebo heslo.' });
        }

        // Úspěšné přihlášení
        success = true;
        userId = user.id;

        // Uložíme session a log
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        await logLoginAttempt(userId, username, ip, userAgent, true, null);
        res.redirect('/admin');
    } catch (err) {
        errorMessage = err.message;
        await logLoginAttempt(null, username, ip, userAgent, false, 'Chyba serveru: ' + err.message);
        res.render('login', { error: 'Chyba serveru, zkuste to později.' });
    }
});

// Funkce pro vložení záznamu do login_logs
async function logLoginAttempt(userId, username, ip, userAgent, success, errorMessage) {
    try {
        await pool.query(
            `INSERT INTO login_logs 
             (user_id, username, ip_address, user_agent, success, error_message) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, username, ip, userAgent, success, errorMessage]
        );
    } catch (err) {
        // Chybu při logování pouze zapíšeme do konzole, neovlivní hlavní tok
        console.error('Chyba při logování přihlášení:', err.message);
    }
}

// GET /register – registrace nového uživatele (volitelné)
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register', { error: null });
});

// POST /register – zpracování registrace
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('register', { error: 'Vyplňte obě pole.' });
    }
    if (password.length < 6) {
        return res.render('register', { error: 'Heslo musí mít alespoň 6 znaků.' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hash, 'user']
        );
        res.redirect('/login?registered=1');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.render('register', { error: 'Uživatelské jméno již existuje.' });
        }
        console.error(err);
        res.render('register', { error: 'Chyba serveru, zkuste to později.' });
    }
});

// GET /dashboard – hlavní stránka po přihlášení
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        username: req.session.user.username,
        role: req.session.user.role
    });
});

// GET /admin – administrace uživatelů (pouze admin)
// app.get('/admin', requireAuth, requireAdmin, async (req, res) => {
//     try {
//         const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//         res.render('admin', {
//             username: req.session.user.username,
//             role: req.session.user.role,
//             users: users,
//             message: null
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Chyba při načítání uživatelů.');
//     }
// });

// POST /admin/add – přidání uživatele (admin)
app.post('/admin/add', requireAuth, requireAdmin, async (req, res) => {
    const { new_username, new_password, new_role } = req.body;
    if (!new_username || !new_password) {
        // Načteme znovu seznam a zobrazíme chybu
        try {
            const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
            return res.render('admin', {
                username: req.session.user.username,
                role: req.session.user.role,
                users,
                message: 'Vyplňte všechny údaje.'
            });
        } catch (err) {
            return res.status(500).send('Chyba serveru.');
        }
    }
    try {
        const hash = await bcrypt.hash(new_password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [new_username, hash, new_role || 'user']
        );
        // Po úspěchu přesměrujeme na admin s hláškou
        const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
        res.render('admin', {
            username: req.session.user.username,
            role: req.session.user.role,
            users,
            message: 'Uživatel přidán.'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
            return res.render('admin', {
                username: req.session.user.username,
                role: req.session.user.role,
                users,
                message: 'Uživatelské jméno již existuje.'
            });
        }
        console.error(err);
        res.status(500).send('Chyba serveru.');
    }
});

// GET /admin/delete/:id – smazání uživatele (admin)
app.get('/admin/delete/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.redirect('/admin');
    }
    // Nedovolit smazat vlastní účet
    if (id === req.session.user.id) {
        try {
            const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
            return res.render('admin', {
                username: req.session.user.username,
                role: req.session.user.role,
                users,
                message: 'Nemůžete smazat svůj vlastní účet.'
            });
        } catch (err) {
            return res.status(500).send('Chyba serveru.');
        }
    }
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
        res.render('admin', {
            username: req.session.user.username,
            role: req.session.user.role,
            users,
            message: 'Uživatel smazán.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Chyba serveru.');
    }
});

// GET /logout – odhlášení
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/login');
    });
});

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`🚀 Server běží na http://localhost:${PORT}`);
});