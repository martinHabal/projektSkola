import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

// router.get("/login", (req, res) => {
//   if (req.session.user) {
//     return res.redirect("/dashboard-vykaz");
//   }
//   res.render("login", {
//     title: "Přihlášení",
//     error: null,
//     success: null,
//   });
// });

// MIDDLEWARE pro předání session do všech šablon
router.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
    res.locals.isSuperadmin = req.session.user && req.session.user.role === 'superadmin';
    next();
});
router.get('/', (req, res) => {
    
     const errorMessage = req.query.error || null;
    
    res.render("login", { 
        error: errorMessage
    });
   
});
// PŘIHLÁŠENÍ - pouze login page a pak presmerovani na dashboard
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { error: "Vyplňte všechny údaje" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.render("login", { error: "Neplatné jméno nebo heslo" });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.render("login", { error: "Neplatné jméno nebo heslo" });
    }

    // Uložení do session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.redirect("/vykaz");
    // console.log(req.session.user);
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Chyba serveru" });
  }
});

// GET - Odhlášení
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Dashboard pro redditele
router.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

   try {
        const result = await pool.query(`
            SELECT 
    us.id,
    us.first_name,
    us.last_name,  
    GROUP_CONCAT(DISTINCT uv.id) as uvazek_ids,
    SUM(uv.uvazek_celkem) as uvazek_celkem,
    COUNT(wl.id) as pocet_work_logu,
    SUM(wl.hours_worked) as celkem_hodin,
    MAX(wl.work_date) as posledni_work_date,  -- nejnovější datum
    MIN(wl.work_date) as prvni_work_date,     -- nejstarší datum
    od.odevzdano
FROM 
    users us
LEFT JOIN 
    uvazky uv ON us.id = uv.users_id
LEFT JOIN 
    work_logs wl ON us.id = wl.users_id
LEFT JOIN 
    odevzdano od ON us.id = od.users_id
GROUP BY 
    us.id, us.first_name, us.last_name, od.odevzdano
ORDER BY 
    us.id, posledni_work_date DESC;
        `);
        
        // res.json(result.rows);
        console.log(result[0])
        res.render("dashboard", {
          username: req.session.user.username,
          result: result[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});





export default router;
