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
    next();
});
router.get('/', (req, res) => {
    
    res.render("login", { error: "Vyplňte všechny údaje" });
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

    res.redirect("/dashboard-ucitel");
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

//Dashboard se zobrazi po prihlaseni
router.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("dashboard", {
    username: req.session.user.username,
  });
});





export default router;
