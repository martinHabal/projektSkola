import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", {
    title: "Přihlášení",
    error: null,
    success: null,
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
    };

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Chyba serveru" });
  }
});

// GET - Odhlášení
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

//Dashboard se zobrazi po prihlaseni
router.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", {
    username: req.session.user.username,
  });
});

//pak prehodit do others
router.get("/vykaz-system", async (req, res) => {
  try {
    // Dotaz na uživatele
 
    const [users] = await pool.query(`
             SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.uvazky_id WHERE username = 'admin';
        `);

console.log(users)

    res.render("vykaz-system", {
      title: "Seznam učitelů (prepared statement)",
      users: users[0], // Předpokládáme, že je pouze jeden admin
      stats: null,
      totalUsers: users.length,
      filter: "Pouze učitelé",
    });
  } catch (error) {
    console.error("Chyba při načítání uživatelů:", error);
    res.status(500).render("error", {
      title: "Chyba",
      message: "Nepodařilo se načíst uživatele",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

export default router;
