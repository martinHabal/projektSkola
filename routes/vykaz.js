import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


//routa i s uvazkama, kdyz se to generovalo pres ejs -> i kdyz necham to a pouziju v novy-novy - tuhle pak samazt
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
            filter: "Pouze učitelé"
           
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
router.get("/vykaz-novy-novy", async (req, res) => {
    try {
        // Dotaz na uživatele

        const [users] = await pool.query(
            `
             SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.id WHERE users.id = ?`,
            [req.session.user.id],
        );

        console.log(users);
        console.log(req.session.user);

        res.render("vykaz-novy-novy", {
            title: "Seznam učitelů (prepared statement)",
            users: users[0], // Předpokládáme, že je pouze jeden admin
            stats: null,
            totalUsers: users.length,
            filter: "Pouze učitelé"
           
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
// Route pro výkaz práce - stary, muzu smazat, jeste funguje, ale asi zrusim
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
        const [records] = await pool.query(//tady dodelat aby se vytisknul aktualni mesic a rok, ne jenom vsechny zaznamy
             `SELECT *
     FROM work_logs
     WHERE users_id = ?
       AND month = MONTH(CURDATE())
       `,
    [employeeId]
        );
       
        // 3. Výpočet souhrnů
        let totalWorkedHours = 0;
        let totalSubstituteHours = 0;
        let totalUntaughtHours = 0;
console.log(records)
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

// Helper funkce
function getMonthName(month) {
    const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                   'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
    return months[month - 1] || '';
}

function getDayName(date) {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return days[date.getDay()];
}

function getDayType(row) {
    if (row.is_holiday) return 'Svátek';
    if (row.is_weekend) return 'Víkend';
    return 'Pracovní';
}

// Hlavní routa pro tisk výkazu
router.get('/vykaz-tisk-modal', async (req, res) => {
    try {
        // const { employee_id, month, year } = req.query;
        
        const employeeId = req.session.user.id || 1;
        // const monthNum = 7 || new Date().getMonth() + 1;
        // const yearNum = 2026 || new Date().getFullYear();

        // SQL dotaz pro získání dat
        const sql = `
            SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.id WHERE users.id = ?`
        ;

        const [records] = await pool.execute(sql, [employeeId]);
console.log(records)
        // Informace o zaměstnanci
        // const employeeSql = 'SELECT username, last_name, role, month FROM users WHERE id = ?';
        // const [employeeRows] = await pool.execute(employeeSql, [employeeId]);
        // const employee = employeeRows[0];

        // Výpočet součtů a statistik
        // let totalWorked = 0, totalSubbed = 0, totalMissed = 0;
        // let weekendDays = 0, holidayDays = 0, workDays = 0;
        // let totalHours = 0;
        
        // const processedData = records.map(record => {
        //     const date = new Date(record.work_date);
        //     const dayType = getDayType(record);
            
        //     const hoursWorked = parseFloat(record.hours_worked) || 0;
        //     const hoursSubbed = parseFloat(record.hours_subbed) || 0;
        //     const hoursMissed = parseFloat(record.hours_missed) || 0;
            
        //     totalWorked += hoursWorked;
        //     totalSubbed += hoursSubbed;
        //     totalMissed += hoursMissed;
        //     totalHours += hoursWorked + hoursSubbed;
            
        //     if (record.is_weekend) weekendDays++;
        //     if (record.is_holiday) holidayDays++;
        //     if (!record.is_weekend && !record.is_holiday) workDays++;
            
        //     return {
        //         ...record,
        //         date_obj: date,
        //         date_formatted: date.toLocaleDateString('cs-CZ'),
        //         day_name: getDayName(date),
        //         day_type: dayType,
        //         hours_worked: hoursWorked,
        //         hours_subbed: hoursSubbed,
        //         hours_missed: hoursMissed,
        //         is_weekend: record.is_weekend === 1 || record.is_weekend === true,
        //         is_holiday: record.is_holiday === 1 || record.is_holiday === true,
        //         weekend_work: record.weekend_work === 1 || record.weekend_work === true
        //     };
        // });

        // Příprava dat pro EJS
        // Data pro EJS šablonu
const data = [
    {
        date_formatted: '01.01.2026',
        day_name: 'Čtvrtek',
        day_type: 'Svátek',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 8,
        reason: 'Státní svátek - Nový rok',
        is_weekend: false,
        is_holiday: true,
        weekend_work: false
    },
    {
        date_formatted: '02.01.2026',
        day_name: 'Pátek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '05.01.2026',
        day_name: 'Pondělí',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '06.01.2026',
        day_name: 'Úterý',
        day_type: 'Pracovní',
        hours_worked: 6,
        hours_subbed: 2,
        hours_missed: 0,
        reason: 'Suplování za kolegu',
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '07.01.2026',
        day_name: 'Středa',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '08.01.2026',
        day_name: 'Čtvrtek',
        day_type: 'Pracovní',
        hours_worked: 4,
        hours_subbed: 0,
        hours_missed: 4,
        reason: 'Dovolená - lékař',
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '09.01.2026',
        day_name: 'Pátek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '10.01.2026',
        day_name: 'Sobota',
        day_type: 'Víkend',
        hours_worked: 4,
        hours_subbed: 0,
        hours_missed: 0,
        reason: 'Práce o víkendu',
        is_weekend: true,
        is_holiday: false,
        weekend_work: true
    },
    {
        date_formatted: '12.01.2026',
        day_name: 'Pondělí',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '13.01.2026',
        day_name: 'Úterý',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '14.01.2026',
        day_name: 'Středa',
        day_type: 'Pracovní',
        hours_worked: 5,
        hours_subbed: 0,
        hours_missed: 3,
        reason: 'Školení',
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '15.01.2026',
        day_name: 'Čtvrtek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '16.01.2026',
        day_name: 'Pátek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '17.01.2026',
        day_name: 'Sobota',
        day_type: 'Víkend',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '18.01.2026',
        day_name: 'Neděle',
        day_type: 'Víkend',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '19.01.2026',
        day_name: 'Pondělí',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '20.01.2026',
        day_name: 'Úterý',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '21.01.2026',
        day_name: 'Středa',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '22.01.2026',
        day_name: 'Čtvrtek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '23.01.2026',
        day_name: 'Pátek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '24.01.2026',
        day_name: 'Sobota',
        day_type: 'Víkend',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '25.01.2026',
        day_name: 'Neděle',
        day_type: 'Víkend',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '26.01.2026',
        day_name: 'Pondělí',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '27.01.2026',
        day_name: 'Úterý',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '28.01.2026',
        day_name: 'Středa',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '29.01.2026',
        day_name: 'Čtvrtek',
        day_type: 'Pracovní',
        hours_worked: 6,
        hours_subbed: 0,
        hours_missed: 2,
        reason: 'Nemoc - preventivní prohlídka',
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '30.01.2026',
        day_name: 'Pátek',
        day_type: 'Pracovní',
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false
    },
    {
        date_formatted: '31.01.2026',
        day_name: 'Sobota',
        day_type: 'Víkend',
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false
    }
];
        const reportData = {
            data: data,
            username: records[0].username || 'Neznámý',
            first_name: records[0].first_name || 'Neznámý',
            last_name: records[0].last_name || 'Neznámý',
            total_hodiny: records[0].total_hodiny || 0,
            total_subbed: records[0].total_subbed || 0,
            total_missed: records[0].total_missed || 0,
            // employee: employee ? employee.name : 'Neznámý',
            // department: employee ? employee.department : '',
            // position: employee ? employee.position : '',
            // personalNumber: employee ? employee.personal_number : '',
            // period: `${getMonthName(monthNum)} ${yearNum}`,
            month: 1,
            year: 2026,
            // total_worked: totalWorked,
            // total_subbed: totalSubbed,
            // total_missed: totalMissed,
            // total_hours: totalHours,
            // weekend_days: weekendDays,
            // holiday_days: holidayDays,
            // work_days: workDays,
            // total_days: records.length,
            // created_date: new Date().toLocaleDateString('cs-CZ', {
            //     day: '2-digit',
            //     month: '2-digit',
            //     year: 'numeric',
            //     hour: '2-digit',
            //     minute: '2-digit'
            // }),
            // Statistika pro přehled
            // summary: {
            //     average_hours: records.length > 0 ? (totalHours / records.length).toFixed(1) : 0,
            //     max_hours: Math.max(...processedData.map(d => d.hours_worked), 0),
            //     min_hours: Math.min(...processedData.map(d => d.hours_worked), 0)
            // }
        };

 
        res.render('vykaz-tisk-modal', reportData);

    } catch (error) {
        console.error('Chyba:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Chyba</title></head>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1 style="color: #d32f2f;">❌ Chyba při načítání výkazu</h1>
                <p style="color: #666;">${error.message}</p>
                <button onclick="history.back()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Zpět
                </button>
            </body>
            </html>
        `);
    }
});

// API endpoint
router.get('/api/prazdniny', async (req, res) => {
    const rok = req.query.rok || 2026;
    console.log("prjat pozadavani na prazdniny pro rok: " + rok);

   
    try {
        const rok = req.query.rok || 2026;
        
        const [rows] = await pool.query(
            'SELECT * FROM prazdniny'
           
        );
        
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

export default router;
// UPDATE uvazky SET po = ? WHERE user_id = ?;`, [value, req.session.user.id]);
