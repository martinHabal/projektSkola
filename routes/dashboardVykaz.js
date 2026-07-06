import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


//DASHBOARD VYKAZ - ZOBRAZENI STATISTIKY JEDNOHO UZIVATELE
router.get("/dashboard-vykaz", async (req, res) => {
    // Kontrola přihlášení - měla by být na začátku
    if (!req.session.user) {
        return res.redirect("/login");
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

        

        res.render('dashboard-vykaz', {
            user: req.session.user,
            totalStats: totalStats[0] || {},
            monthlyStats: monthlyStats,
         
        });

    } catch (error) {
        console.error('Chyba při načítání statistik:', error);
        res.status(500).render('error', {
            message: 'Nepodařilo se načíst statistiky',
            error: error
        });
    }
});

// Endpoint pro data
router.get('/api/chart-data', (req, res) => {
    const chartData = {
        labels: ['Celkem hodin', 'Suplované', 'Odpadnuté'],
        data: [782, 276, 98],
        colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
    };
    res.json(chartData);
});




export default router;
