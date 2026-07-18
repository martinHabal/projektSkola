import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


//DASHBOARD VYKAZ - ZOBRAZENI STATISTIKY JEDNOHO UZIVATELE
router.get("/dashboard-ucitel", async (req, res) => {
    // Kontrola přihlášení - měla by být na začátku
    if (!req.session.user) {
        return res.redirect("/");
    }

    try {
        const userId = req.session.user.id;

        // Celkové statistiky
        const [totalStats] = await pool.execute(
            `SELECT 
                SUM(hours_worked) as total_hours,
                AVG(hours_worked) as avg_hours,
                COUNT(*) as total_days,
                SUM(hours_missed) as total_missed,
                SUM(hours_subbed) as total_subbed
            FROM work_logs 
            WHERE users_id = ?`,
            [userId]
        );
        console.log(totalStats[0]);
        // Měsíční statistiky
        const [monthlyStats] = await pool.execute(
            `SELECT 
                DATE_FORMAT(work_date, '%Y-%m') as month,
                SUM(hours_worked) as total_hours,
                COUNT(CASE WHEN day_type = 'Pracovní den' THEN 1 END) as workdays,
                COUNT(CASE WHEN day_type = 'Víkend' THEN 1 END) as weekend_days,
                SUM(hours_missed) as missed_hours,
                SUM(hours_subbed) as subbed_hours
            FROM work_logs 
            WHERE users_id = ?
            GROUP BY DATE_FORMAT(work_date, '%Y-%m')
            ORDER BY month DESC`,
            [userId]
        );
        console.log(monthlyStats);
        // Další užitečné statistiky
        const [weeklyStats] = await pool.execute(
            `SELECT 
                YEAR(work_date) as year,
                WEEK(work_date, 1) as week_number,
                MIN(work_date) as week_start,
                MAX(work_date) as week_end,
                SUM(hours_worked) as total_hours,
                AVG(hours_worked) as avg_hours_per_day,
                SUM(hours_missed) as total_missed
            FROM work_logs 
            WHERE users_id = ?
            GROUP BY YEAR(work_date), WEEK(work_date, 1)
            ORDER BY year DESC, week_number DESC
            LIMIT 10`,
            [userId]
        );

        //mesicni statistiky pro sloupcovy graf
        //celkove hodiny
        const [celkem] = await pool.execute(`
    SELECT 
        MONTH(work_date) as mesic_cislo,
        SUM(hours_worked) as celkem_hodin
    FROM work_logs
    WHERE work_date BETWEEN '2025-09-01' AND '2026-08-31'
    GROUP BY MONTH(work_date)
    ORDER BY mesic_cislo ASC
`);
        const celkemHodiny = celkem.map(row => row.celkem_hodin);


        //suplovane hodiny
        const [suplovane] = await pool.execute(`
    SELECT 
        MONTH(work_date) as mesic_cislo,
        SUM(hours_worked) as celkem_hodin
    FROM work_logs
    WHERE work_date BETWEEN '2025-09-01' AND '2026-08-31'
    GROUP BY MONTH(work_date)
    ORDER BY mesic_cislo ASC
`);
        const suplovaneHodiny = suplovane.map(row => row.celkem_hodin);

        //odpadnute hodiny
        const [odpadnute] = await pool.execute(`
    SELECT 
        MONTH(work_date) as mesic_cislo,
        SUM(hours_worked) as celkem_hodin
    FROM work_logs
    WHERE work_date BETWEEN '2025-09-01' AND '2026-08-31'
    GROUP BY MONTH(work_date)
    ORDER BY mesic_cislo ASC
`);
        const odpadnuteHodiny = odpadnute.map(row => row.celkem_hodin);



        //zatim resim jen celkove statistiky
        res.render('dashboard-ucitel', {
            user: req.session.user,
            totalStats: totalStats[0] || {},
            celkem: celkemHodiny,
            suplovane: suplovaneHodiny,
            odpadnute: odpadnuteHodiny


        });

    } catch (error) {
        console.error('Chyba při načítání statistik:', error);
        res.status(500).render('error', {
            message: 'Nepodařilo se načíst statistiky',
            error: error
        });
    }
});

//Endpoint pro data
// na to se vykaslu, budu posilat pres sablonu
router.get('/api/chart-data', (req, res) => {
    const chartData = {
        labels: ['Celkem hodin', 'Suplované', 'Odpadnuté'],
        data: [782, 276, 98],
        colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
    };
    res.json(chartData);
});

// router.get('/api/chart-data', async (req, res) => {
//     try {
//         // Získání userId - upravte podle vašeho auth systému
//         const userId = req.user?.id || req.session?.userId;

//         if (!userId) {
//             return res.status(401).json({ error: 'Uživatel není přihlášen' });
//         }

//         // Váš původní dotaz
//         const [totalStats] = await pool.execute(
//             `SELECT 
//                 SUM(hours_worked) as total_hours,
//                 AVG(hours_worked) as avg_hours,
//                 COUNT(*) as total_days,
//                 SUM(hours_missed) as total_missed,
//                 SUM(hours_subbed) as total_subbed
//             FROM work_logs 
//             WHERE users_id = ?`,
//             [userId]
//         );

//         // Příprava dat pro frontend - přesně ve formátu, který očekává
//         const chartData = {
//             data: [
//                 Number(totalStats.total_hours) || 0,
//                 Number(totalStats.total_subbed) || 0,
//                 Number(totalStats.total_missed) || 0
//             ],
//             colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
//         };

//         res.json(chartData);
//     } catch (error) {
//         console.error('Chyba při načítání dat pro graf:', error);
//         res.status(500).json({ 
//             error: 'Interní chyba serveru',
//             data: [0, 0, 0],
//             colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
//         });
//     }
// });



export default router;
