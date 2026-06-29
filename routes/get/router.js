import express from "express";
const router = express.Router();

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
     if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
  },
// GET /logout – odhlášení
  "/logout": (req, res) => {
     req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/login');
    });
    res.render('login', { error: null });
  },
// GET /admin – administrace uživatelů (pouze admin)
 "/admin": async (req, res) => {
        // Middleware musíme ošetřit ručně
        if (!req.session.userId) return res.redirect('/login');
        if (req.session.role !== 'admin') return res.status(403).send('Přístup odepřen');

        try {
            const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
            res.render('admin', {
                username: req.session.username,
                role: req.session.role,
                users,
                message: null
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Chyba při načítání uživatelů.');
        }
    }

};
// Dynamický router
for (const [path, handler] of Object.entries(routes)) {
  router.get(path, handler);
}

export default router;



