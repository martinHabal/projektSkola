import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


router.get("/vykaz-system", async (req, res) => {
  try {
    // Dotaz na uživatele
 
    const [users] = await pool.query(`
             SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.id WHERE users.id = ?`, [req.session.user.id]);

console.log(users)
console.log(req.session.user)

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

// routa pro nastaveni poctu hodin vykazu
// ty vikendy tam musi byt pro jine akce, den otevrenych dveri apod.
router.post('/api/process-number', async (req, res) => {
    const { value, timestamp, inputDay } = req.body;
    console.log(req.session)
    console.log(`Přijata hodnota: ${value} v čase: ${timestamp}`);
    console.log(inputDay)
    let dayOfWeek;
    switch (inputDay) {//ten vikend bude zvlast ve specialnich pripadech
        case '#schedule-mon':
            dayOfWeek = "po"
            break;
        case '#schedule-tue':
             dayOfWeek = "ut"
            break;
        case '#schedule-wed':
            dayOfWeek = "st"
            break;
        case '#schedule-thu':
            dayOfWeek = "ct"
            break;
        case '#schedule-fri':
            dayOfWeek = "pa"
            break;
        // case '#schedule-sat':
        //     dayOfWeek = "so"
        //     break;
        // case '#schedule-sun':
        //     dayOfWeek = "ne"
        //     break;
        default:
            console.log('Neznámý den');
    }
    if (dayOfWeek === "po") {
        const [po] = await pool.query(`
             UPDATE uvazky SET po = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    } else if (dayOfWeek === "ut") {
        const [ut] = await pool.query(`
             UPDATE uvazky SET ut = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    } else if (dayOfWeek === "st") {
        const [st] = await pool.query(`
             UPDATE uvazky SET st = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    } else if (dayOfWeek === "ct") {
        const [ct] = await pool.query(`
             UPDATE uvazky SET ct = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    } else if (dayOfWeek === "pa") {
        const [pa] = await pool.query(`
             UPDATE uvazky SET pa = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    } 
    //else if (dayOfWeek === "so") {
    //     const [so] = await pool.query(`
    //          UPDATE uvazky SET so = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    // } else if (dayOfWeek === "ne") {
    //     const [ne] = await pool.query(`
    //          UPDATE uvazky SET ne = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    // }
    // const [po] = await pool.query(`
    //          UPDATE uvazky SET po = ? WHERE uvazky_id = 5;`, [value, req.session.user.id]);
    // Zde můžete přidat vlastní logiku
    const result = {
        received: value,
        processed: value * 2, // Příklad zpracování
        timestamp: new Date().toISOString(),
        status: 'success'
    };
    
    res.json(result);
});

export default router;
// UPDATE uvazky SET po = ? WHERE user_id = ?;`, [value, req.session.user.id]);