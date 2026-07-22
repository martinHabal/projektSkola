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
            "SELECT po, ut, st, ct, pa FROM uvazky WHERE user_id = ?",
            [req.session.user.id],
        );
        console.log(rows[0]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


});
//posilam z FE, ze je vykaz odevzdany -> toto nyní funguje
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

            res.status(200).json({
                success: true,
                ulozeno: true,
                inserted: true,
                message: 'Výkaz pro tento měsíc byl uložen'
            });
        } else {
            console.log('Záznam pro tento měsíc již existuje');
            res.status(200).json({
                success: true,
                ulozeno: false,
                inserted: false,
                message: 'Výkaz pro tento měsíc již byl odevzdán'
            });

        }
    } catch (error) {
        console.error('Chyba:', error);
        throw error;
    }

});
//smaze posledni zaznam z tabulky odevzdano a vsechny zaznamy tento měsíc z worklogs
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
        // const [result] = await connection.execute(
        //     `DELETE FROM odevzdano 
        //   WHERE id = ? AND users_id = ?`,
        //     [lastRecord.id, userId]
        // );


        // Celý kód s transakcí
        // kdyz bude jiny den, tak to uz nesmaze a to staci protoze ulozit a smazat muze jen jednou
        await connection.beginTransaction();

        try {
            // 1. Smazání z odevzdano
            const [result1] = await connection.execute(
                `DELETE FROM odevzdano 
         WHERE id = ? AND users_id = ?`,
                [lastRecord.id, userId]
            );

            // 2. Získání posledního data z work_logs
            const [maxDateResult] = await connection.execute(
                `SELECT MAX(DATE(created_at)) as max_date FROM work_logs`
            );

            const maxDate = maxDateResult[0]?.max_date;

            // 3. Smazání z work_logs jen pokud existuje nějaké datum
            if (maxDate) {
                const [result2] = await connection.execute(
                    `DELETE FROM work_logs 
             WHERE DATE(created_at) = ? 
             AND users_id = ?`,
                    [maxDate, userId]
                );
                console.log('Smazáno z work_logs:', result2.affectedRows);
            }

            await connection.commit();
            console.log('Vše smazáno úspěšně');
        } catch (error) {
            await connection.rollback();
            console.error('Chyba při mazání:', error);
        }

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