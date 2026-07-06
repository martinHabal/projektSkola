import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

router.get("/vykaz-system", async (req, res) => {
    try {
        // Dotaz na uživatele

        const [users] = await pool.query(
            `
             SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.id WHERE users.id = ?`,
            [req.session.user.id],
        );

        console.log(users);
        console.log(req.session.user);

        res.render("vykaz-system", {
            title: "Seznam učitelů (prepared statement)",
            users: users[0], // Předpokládáme, že je pouze jeden admin
            stats: null,
            totalUsers: users.length,
            filter: "Pouze učitelé",
        });
    } catch (error) {
        // console.error("Chyba při načítání uživatelů:", error);
        // res.status(500).render("error", {
        //   title: "Chyba",
        //   message: "Nepodařilo se načíst uživatele",
        //   error: process.env.NODE_ENV === "development" ? error : {},
        // });
        res.render("login", { error: "Chyba serveru" });
    }
});

// routa pro nastaveni poctu hodin vykazu
// ty vikendy tam musi byt pro jine akce, den otevrenych dveri apod.


router.post("/api/process-number", async (req, res) => {
    const { value, timestamp, inputDay } = req.body;
    console.log(req.session.user);
    console.log(`Přijata hodnota: ${value} v čase: ${timestamp}`);
    console.log(inputDay);
    
    let dayOfWeek;
    switch (inputDay) {
        case "#schedule-mon":
            dayOfWeek = "po";
            break;
        case "#schedule-tue":
            dayOfWeek = "ut";
            break;
        case "#schedule-wed":
            dayOfWeek = "st";
            break;
        case "#schedule-thu":
            dayOfWeek = "ct";
            break;
        case "#schedule-fri":
            dayOfWeek = "pa";
            break;
        default:
            console.log("Neznámý den");
            return res.status(400).json({ error: "Neznámý den" });
    }

    const userId = req.session.user.id;
    let result;

    // Nejprve zkontrolujeme, zda záznam existuje
    const [existing] = await pool.query(
        `SELECT id FROM uvazky WHERE id = ?`,
        [userId]
    );

    if (existing.length === 0) {
        // Záznam neexistuje - vytvoříme ho
        await pool.query(
            `INSERT INTO uvazky (id, ${dayOfWeek}) VALUES (?, ?)`,
            [userId, value]
        );
    } else {
        // Záznam existuje - updatujeme ho
        const query = `UPDATE uvazky SET ${dayOfWeek} = ? WHERE id = ?`;
        await pool.query(query, [value, userId]);
    }

    const response = {
        received: value,
        processed: value * 2,
        timestamp: new Date().toISOString(),
        status: "success",
        day: dayOfWeek
    };

    res.json(response);
});

//SAVE VYKAZ
router.post("/api/uloz-vykaz", async (req, res) => {
    const { data } = req.body;

    //   console.log(data)
    const dataMaped = data
        .filter(zaznam => zaznam.Datum !== "CELKEM")
        .map(zaznam => {
            const [den, mesic, rok] = zaznam.Datum
                .split(".")
                .map(s => s.trim())
                .filter(Boolean);

            return {
                ...zaznam,
                Datum: `${rok}-${mesic.padStart(2, "0")}-${den.padStart(2, "0")}`
            };
        });

  
    // console.log(dataMaped);

    async function insertWorkLogs(employeeId = 1) {


        try {
            // Vytvoření připojení


            // SQL dotaz s placeholdery
            const sql = `
                INSERT INTO work_logs 
                (users_id, work_date, day_name, day_type, hours_worked, hours_subbed, hours_missed, reason_missed) 
                VALUES ?
            `;

            const values = dataMaped.map(log => [
                req.session.user.id,
                log.Datum || null,
                log.Den || null,
                log["Typ dne"] || "Pracovní den",
                log["Odpracované hodiny"] || 0,
                log["Suplované hodiny"] === "-" ? 0 : (log["Suplované hodiny"] || 0),
                log["Neodučené hodiny"] === "-" ? 0 : (log["Neodučené hodiny"] || 0),
                log["Důvod neoducení"] === "-" ? null : (log["Důvod neoducení"] || null)
            ]);

            console.log(values)

            const [result] = await pool.query(sql, [values]);

            console.log(`✅ Úspěšně vloženo ${result.affectedRows} záznamů`);
            console.log(`📊 Poslední ID: ${result.insertId}`);

            return result;
        } catch (error) {
            console.error("❌ Chyba při vkládání dat:", error.message);
            throw error;
        }
    }

    // Spuštění
    insertWorkLogs(1)
        .then(() => console.log("✅ Hotovo!"))
        .catch((err) => console.error("❌ Selhalo:", err));

    res.json({ message: "Výkaz uložen" });
});


//TISK
// Route pro výkaz práce
router.get('/work-report', async (req, res) => {
    try {
        // Parametry z URL
        const employeeId = req.session.user.id || 1;
        const month = req.query.month || new Date().getMonth() + 1;
        const year = req.query.year || new Date().getFullYear();

        // 1. Získání jména zaměstnance
        const [employee] = await pool.query(
            `SELECT username FROM users WHERE id = ?`,
            [employeeId]
        );

        const employeeName = employee.length > 0 ? employee[0].username : 'Neznámý zaměstnanec';

        // 2. Získání pracovních záznamů
        const [records] = await pool.query(
            `SELECT 
                created_at,
                DAYNAME(date) as dayName,
                CASE 
                    WHEN DAYOFWEEK(date) IN (1, 7) THEN 'Víkend'
                    WHEN DATE(date) IN (SELECT holiday_date FROM holidays) THEN 'Svátek'
                    ELSE 'Pracovní'
                END as dayType,
                worked_hours as workedHours,
                substitute_hours as substituteHours,
                untaught_hours as untaughtHours,
                reason,
                is_weekend as isWeekend,
                weekend_work as weekendWork
            FROM work_records
            WHERE employee_id = ?
                AND MONTH(date) = ?
                AND YEAR(date) = ?
            ORDER BY date ASC`,
            [employeeId, month, year]
        );

        // 3. Výpočet souhrnů
        let totalWorkedHours = 0;
        let totalSubstituteHours = 0;
        let totalUntaughtHours = 0;

        records.forEach(row => {
            totalWorkedHours += Number(row.workedHours) || 0;
            totalSubstituteHours += Number(row.substituteHours) || 0;
            totalUntaughtHours += Number(row.untaughtHours) || 0;
        });

        // 4. Vykreslení šablony
        res.render('vykaz-tisk', {
            data: records,
            employeeName: employeeName,
            period: `${month}. ${year}`,
            totalWorkedHours: totalWorkedHours,
            totalSubstituteHours: totalSubstituteHours,
            totalUntaughtHours: totalUntaughtHours
        });

    } catch (error) {
        console.error('Chyba:', error);
        res.status(500).send('Chyba při načítání dat: ' + error.message);
    }
});




export default router;
// UPDATE uvazky SET po = ? WHERE user_id = ?;`, [value, req.session.user.id]);
