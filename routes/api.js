import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


// API endpoint
router.get("/api/prazdniny", async (req, res) => {
  const rok = req.query.rok || 2026;
  console.log("prjat pozadavani na prazdniny pro rok: " + rok);

  try {
    const rok = req.query.rok || 2026;

    const [rows] = await pool.query("SELECT * FROM prazdniny");

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

  // pool.query(
  //     'SELECT * FROM prazdniny',
  //     (err, data) => {
  //         if (err) return res.status(500).json({ error: err.message });
  //         res.json(data);
  //     }
  // );
});

// vraci pouze uvazky, taham do frontendu do vykazu do nastaveni uvazku
router.get("/api/uvazky", async (req, res) => {
  console.log("prijat pozadavek na uvazky");

  try {
    const [rows] = await pool.query(
      "SELECT po, ut, st, ct, pa FROM uvazky WHERE id = ?",
      [req.session.user.id],
    );
    console.log(rows[0]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }


});
//posilam z FE, ze je vykaz odevzdany
router.post("/api/odevzdano", async (req, res) => {
  console.log("prijat pozadavek na odevzdano, kde chci vedet jestli uz je v aktualni mesic vykaz odevzadenj");
  console.log(req.session.user)
  try {
    const userId = req.session.user.id;

    // const userId = 5;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // MySQL měsíce od 1

    // Kontrola zda záznam existuje
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
             FROM odevzdano 
             WHERE users_id = ? 
             AND YEAR(datum) = ? 
             AND MONTH(datum) = ?`,
      [userId, year, month]
    );

    if (rows[0].count === 0) {
      // Vložení záznamu
      const [result] = await pool.execute(
        `INSERT INTO odevzdano (odevzdano, datum, users_id) 
                 VALUES (1, NOW(), ?)`,
        [userId]
      );
      console.log('Záznam byl vložen:', result.insertId);
      return { inserted: true, id: result.insertId };
    } else {
      console.log('Záznam pro tento měsíc již existuje');
      return { inserted: false };
    }
  } catch (error) {
    console.error('Chyba:', error);
    throw error;
  }

});

router.get('/api/record/last', async (req, res) => {

  console.log("odrzen pozadavek na smazani posledniho zaznamu z odevzdano")
  const userId = req.session.user.id;
console.log(userId)

  const connection = await pool.getConnection();

  try {
    // Najdeme poslední záznam uživatele (podle data)
    const [rows] = await connection.execute(
      `SELECT id, datum 
          FROM odevzdano 
          WHERE users_id = ? 
          ORDER BY datum DESC 
          LIMIT 1`,
      [userId]
    );
    console.log(rows[0])
    if (rows.length === 0) {
      console.log("zaznam nenalezen")
      return res.status(404).json({
        success: false,
        message: 'Žádný záznam nenalezen pro tohoto uživatele'
      });
    }

    const lastRecord = rows[0];

    // Smazání záznamu
    const [result] = await connection.execute(
      `DELETE FROM odevzdano 
          WHERE id = ? AND users_id = ?`,
      [lastRecord.id, userId]
    );

    res.json({
      success: true,
      message: 'Poslední záznam byl smazán',
      deletedRecord: {
        id: lastRecord.id,
        datum: lastRecord.datum
      }
    });

  } catch (error) {
    console.error('Chyba při mazání:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;