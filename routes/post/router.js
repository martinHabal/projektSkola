import express from "express";
const router = express.Router();
import pool from '#db/db';//moderni import - nastaveny v package.json


const routes = {
  // POST /register – zpracování registrace
  '/register': async (req, res) => {
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
  },
  // POST /admin/add – přidání uživatele (admin)
  '/admin/add': async (req, res) => {
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
}
}

// Dynamický router
for (const [path, handler] of Object.entries(routes)) {
  router.post(path, handler);
}


// POST /register – zpracování registrace
// router.post('/register', async (req, res) => {
//     const { username, password } = req.body;
//     if (!username || !password) {
//         return res.render('register', { error: 'Vyplňte obě pole.' });
//     }
//     if (password.length < 6) {
//         return res.render('register', { error: 'Heslo musí mít alespoň 6 znaků.' });
//     }
//     try {
//         const hash = await bcrypt.hash(password, 10);
//         await pool.query(
//             'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
//             [username, hash, 'user']
//         );
//         res.redirect('/login?registered=1');
//     } catch (err) {
//         if (err.code === 'ER_DUP_ENTRY') {
//             return res.render('register', { error: 'Uživatelské jméno již existuje.' });
//         }
//         console.error(err);
//         res.render('register', { error: 'Chyba serveru, zkuste to později.' });
//     }
// });

// POST /admin/add – přidání uživatele (admin)
// router.post('/admin/add', async (req, res) => {
//    const { new_username, new_password, new_role } = req.body;
//     if (!new_username || !new_password) {
//         // Načteme znovu seznam a zobrazíme chybu
//         try {
//             const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//             return res.render('admin', {
//                 username: req.session.user.username,
//                 role: req.session.user.role,
//                 users,
//                 message: 'Vyplňte všechny údaje.'
//             });
//         } catch (err) {
//             return res.status(500).send('Chyba serveru.');
//         }
//     }
//     try {
//         const hash = await bcrypt.hash(new_password, 10);
//         await pool.query(
//             'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
//             [new_username, hash, new_role || 'user']
//         );
//         // Po úspěchu přesměrujeme na admin s hláškou
//         const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//         res.render('admin', {
//             username: req.session.user.username,
//             role: req.session.user.role,
//             users,
//             message: 'Uživatel přidán.'
//         });
//     } catch (err) {
//         if (err.code === 'ER_DUP_ENTRY') {
//             const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//             return res.render('admin', {
//                 username: req.session.user.username,
//                 role: req.session.user.role,
//                 users,
//                 message: 'Uživatelské jméno již existuje.'
//             });
//         }
//         console.error(err);
//         res.status(500).send('Chyba serveru.');
//     }
// });


export default router;

