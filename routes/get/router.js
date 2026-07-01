import express from "express";
const router = express.Router();
import pool from '#db/db';//moderni import - nastaveny v package.json

const routes = {
  // GET / – přesměrování na dashboard nebo login
  "/": (req, res) => {
    if (req.session.user) {
      res.redirect("/dashboard");
    } else {
      res.redirect("/login");
    }
  },
  // GET /login – přihlašovací formulář
  "/login": (req, res) => {
      //console.log(req.session.user) - > undefined
    if (req.session.user) {
      return res.redirect("/dashboard");
    }
    res.render("login", { error: null });
  },
  // GET /logout – odhlášení
  "/logout": (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.redirect("/login");
    });
    res.render("login", { error: null });
  },
  // GET /admin – administrace uživatelů (pouze admin)
  "/admin": async (req, res) => {
    // Middleware musíme ošetřit ručně
    if (!req.session.userId) return res.redirect("/login");
    if (req.session.role !== "admin")
      return res.status(403).send("Přístup odepřen");

    try {
      const [users] = await pool.query(
        "SELECT id, username, role, created_at FROM users ORDER BY id",
      );
      res.render("admin", {
        username: req.session.username,
        role: req.session.role,
        users,
        message: null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Chyba při načítání uživatelů.");
    }
  },
  // GET /register – registrace nového uživatele (volitelné)
  "/register": (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register', { error: null });
  },
 // GET /dashboard – hlavní stránka po přihlášení
  "/dashboard": (req, res) => {
   res.render('dashboard', {
        username: req.session.user.username,
        role: req.session.user.role
    });
  },
// GET /admin/delete/:id – smazání uživatele (admin)
  "/admin/delete/:id": async (req, res) => {
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
  },
};
// GET /admin/delete/:id – smazání uživatele (admin)
// router.post('/admin/delete/:id', async (req, res) => {
//    const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//         return res.redirect('/admin');
//     }
//     // Nedovolit smazat vlastní účet
//     if (id === req.session.user.id) {
//         try {
//             const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//             return res.render('admin', {
//                 username: req.session.user.username,
//                 role: req.session.user.role,
//                 users,
//                 message: 'Nemůžete smazat svůj vlastní účet.'
//             });
//         } catch (err) {
//             return res.status(500).send('Chyba serveru.');
//         }
//     }
//     try {
//         await pool.query('DELETE FROM users WHERE id = ?', [id]);
//         const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
//         res.render('admin', {
//             username: req.session.user.username,
//             role: req.session.user.role,
//             users,
//             message: 'Uživatel smazán.'
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Chyba serveru.');
//     }
// });


// Dynamický router
for (const [path, handler] of Object.entries(routes)) {
  router.get(path, handler);
}

export default router;

