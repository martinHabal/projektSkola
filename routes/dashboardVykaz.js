import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

router.get("/dashboard-vykaz", (req, res) => {

async function getWorkStatistics(userId = 5) {
  
    try {
        // Příklad: Celkové statistiky
        const [totalStats] = await pool.execute(
            `SELECT 
                SUM(hours_worked) as total_hours,
                AVG(hours_worked) as avg_hours,
                COUNT(*) as total_days,
                SUM(hours_missed) as total_missed,
                SUM(hours_subbed) as total_subbed
            FROM work_records 
            WHERE users_id = ?`,
            [userId]
        );

        // Příklad: Měsíční statistiky
        const [monthlyStats] = await pool.execute(
            `SELECT 
                DATE_FORMAT(work_date, '%Y-%m') as month,
                SUM(hours_worked) as total_hours,
                COUNT(CASE WHEN day_type = 'Pracovní den' THEN 1 END) as workdays
            FROM work_records 
            WHERE users_id = ?
            GROUP BY DATE_FORMAT(work_date, '%Y-%m')
            ORDER BY month DESC`,
            [userId]
        );

        return {
            total: totalStats[0],
            monthly: monthlyStats
        };
    } finally {
        await connection.end();
    }
}

  if (req.session.user) {
    return res.redirect("/dashboard");
  }
 res.render('dashboard-vykaz', { 
        user: req.session.user,
        data: getWorkStatistics(userId = 5)
    });
});




export default router;
