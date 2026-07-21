import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";


// Hlavní routa pro tisk výkazu
router.get("/vykaz-tisk-modal", async (req, res) => {
  try {
    // const { employee_id, month, year } = req.query;

    const employeeId = req.session.user.id || 1;
    // const monthNum = 7 || new Date().getMonth() + 1;
    // const yearNum = 2026 || new Date().getFullYear();

    // SQL dotaz pro získání dat
    const sql = `
            SELECT * FROM users LEFT JOIN uvazky ON users.id = uvazky.id WHERE users.id = ?`;
    const [records] = await pool.execute(sql, [employeeId]);
    console.log(records);
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
        date_formatted: "01.01.2026",
        day_name: "Čtvrtek",
        day_type: "Svátek",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 8,
        reason: "Státní svátek - Nový rok",
        is_weekend: false,
        is_holiday: true,
        weekend_work: false,
      },
      {
        date_formatted: "02.01.2026",
        day_name: "Pátek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "05.01.2026",
        day_name: "Pondělí",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "06.01.2026",
        day_name: "Úterý",
        day_type: "Pracovní",
        hours_worked: 6,
        hours_subbed: 2,
        hours_missed: 0,
        reason: "Suplování za kolegu",
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "07.01.2026",
        day_name: "Středa",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "08.01.2026",
        day_name: "Čtvrtek",
        day_type: "Pracovní",
        hours_worked: 4,
        hours_subbed: 0,
        hours_missed: 4,
        reason: "Dovolená - lékař",
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "09.01.2026",
        day_name: "Pátek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "10.01.2026",
        day_name: "Sobota",
        day_type: "Víkend",
        hours_worked: 4,
        hours_subbed: 0,
        hours_missed: 0,
        reason: "Práce o víkendu",
        is_weekend: true,
        is_holiday: false,
        weekend_work: true,
      },
      {
        date_formatted: "12.01.2026",
        day_name: "Pondělí",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "13.01.2026",
        day_name: "Úterý",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "14.01.2026",
        day_name: "Středa",
        day_type: "Pracovní",
        hours_worked: 5,
        hours_subbed: 0,
        hours_missed: 3,
        reason: "Školení",
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "15.01.2026",
        day_name: "Čtvrtek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "16.01.2026",
        day_name: "Pátek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "17.01.2026",
        day_name: "Sobota",
        day_type: "Víkend",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "18.01.2026",
        day_name: "Neděle",
        day_type: "Víkend",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "19.01.2026",
        day_name: "Pondělí",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "20.01.2026",
        day_name: "Úterý",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "21.01.2026",
        day_name: "Středa",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "22.01.2026",
        day_name: "Čtvrtek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "23.01.2026",
        day_name: "Pátek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "24.01.2026",
        day_name: "Sobota",
        day_type: "Víkend",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "25.01.2026",
        day_name: "Neděle",
        day_type: "Víkend",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "26.01.2026",
        day_name: "Pondělí",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "27.01.2026",
        day_name: "Úterý",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "28.01.2026",
        day_name: "Středa",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "29.01.2026",
        day_name: "Čtvrtek",
        day_type: "Pracovní",
        hours_worked: 6,
        hours_subbed: 0,
        hours_missed: 2,
        reason: "Nemoc - preventivní prohlídka",
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "30.01.2026",
        day_name: "Pátek",
        day_type: "Pracovní",
        hours_worked: 8,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: false,
        is_holiday: false,
        weekend_work: false,
      },
      {
        date_formatted: "31.01.2026",
        day_name: "Sobota",
        day_type: "Víkend",
        hours_worked: 0,
        hours_subbed: 0,
        hours_missed: 0,
        reason: null,
        is_weekend: true,
        is_holiday: false,
        weekend_work: false,
      },
    ];
    const reportData = {
      data: data,
      username: records[0].username || "Neznámý",
      first_name: records[0].first_name || "Neznámý",
      last_name: records[0].last_name || "Neznámý",
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

    res.render("vykaz-tisk-modal", reportData);
  } catch (error) {
    console.error("Chyba:", error);
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

export default router;