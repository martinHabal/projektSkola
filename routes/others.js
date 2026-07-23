import express from "express";
const router = express.Router();
import pool from '#db/db';//moderni import - nastaveny v package.json
import bcrypt from 'bcrypt';

const maturitaRoutes = {
  '/maturita': (req, res) => res.render('maturita', {
    title: 'Maturita losování',
    description: 'Maturita losování',
    // username: req.session.user.username
  }),
  '/skolni-rad': (req, res) => res.render('skolni-rad', {
    title: 'Školní řád',
    description: 'Informace o školním řádu',
    // username: req.session.user.username 
  }),
  '/generator-dokumentu': (req, res) => res.render('generator-dokumentu', {
    title: 'generator',
    description: 'generator dokumentů',
  }),
  '/dokumenty-skoly': (req, res) => res.render('dokumenty-skoly', {
    title: 'Dokumenty školy',
    description: 'Seznam dokumentů školy',
  }),
  '/vykaz-info': (req, res) => res.render('vykaz-info', {
    title: 'Výkaz - informace',
    description: 'Informace o statistickém zpracování dat',
    // username: req.session.user.username 
  }),
  
  '/vykaz-tabulka': (req, res) => res.render('vykaz-tabulka', {
    title: 'Výkaz - tabulka',
    description: 'Informace o mikroekonomii - státnice',
    // username: req.session.user.username 
  }),
  '/manual': (req, res) => res.render('manual', {
    title: 'Výkaz - systém',
    description: 'Informace o systému výkazů',
    // username: req.session.user.username 
  }),
'/vykaz-novy': (req, res) => res.render('vykaz-novy', {
    title: 'Výkaz - systém',
    description: 'Informace o systému výkazů',
    // username: req.session.user.username 
  }),
'/nova-skola': (req, res) => res.render('nova-skola', {
    title: 'Výkaz - systém',
    description: 'Informace o systému výkazů',
    // username: req.session.user.username 
  }),
'/cennik': (req, res) => res.render('cennik', {
    title: 'Výkaz - systém',
    description: 'Informace o systému výkazů',
    // username: req.session.user.username 
  }),
'/sprava-udalosti': (req, res) => res.render('sprava-udalosti', {
    title: 'Výkaz - systém',
    description: 'Informace o systému výkazů',
    // username: req.session.user.username 
  }),

  
  '/vykaz': (req, res) => {
    // Funkce, která načte všechna data za zadaný měsíc
    async function fetchLessonsForMonth(year, month, credentials) {
      const allLessons = [];
      const daysInMonth = new Date(year, month, 0).getDate(); // např. 30 nebo 31

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const params = new URLSearchParams({
          date, // nebo jiný klíč, který API používá pro filtraci dne
        });

        console.log(`Načítám data pro ${date}...`);

        try {
          const res = await fetch(`https://spsvlasim.edookit.net/api/lesson/v2/list-lessons?${params.toString()}`, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text}`);
          }

          const data = await res.json();

          const lessonsArray = Object.values(data.lessons || {}).map((lesson) => {
            const actual = lesson.actual || {};
            const scheduled = lesson.scheduled || {};

            const actualTeacher = Object.values(actual.teachers || {})[0] || {};
            const scheduledTeacher = Object.values(scheduled.teachers || {})[0] || {};

            const actualStudent = Object.values(actual.students || {})[0] || {};
            const scheduledStudent = Object.values(scheduled.students || {})[0] || {};

            const actualRoom = Object.values(actual.rooms || {})[0] || {};
            const scheduledRoom = Object.values(scheduled.rooms || {})[0] || {};

            const same_teacher = actualTeacher.person_id != null && actualTeacher.person_id === scheduledTeacher.person_id;

            const same_students = actualStudent.subject_id != null && actualStudent.subject_id === scheduledStudent.subject_id;

            const same_room = actualRoom.room_id != null && actualRoom.room_id === scheduledRoom.room_id;

            return {
              lesson_id: actual.lesson_id ?? scheduled.lesson_id ?? null,
              name: actual.name ?? scheduled.name ?? null,
              datetime_from: actual.datetime_from ?? scheduled.datetime_from ?? null,
              datetime_to: actual.datetime_to ?? scheduled.datetime_to ?? null,
              teacher_id: actualTeacher.person_id ?? null,
              teacher_abbr: actualTeacher.person_abbr ?? null,
              student_group: actualStudent.subject_name ?? null,
              room_name: actualRoom.room_name ?? null,
              same_teacher,
              same_students,
              same_room,
              all_same: same_teacher && same_students && same_room,
            };
          });

          allLessons.push(...lessonsArray);
        } catch (err) {
          console.error(`❌ Chyba při načítání ${date}:`, err.message);
        }
      }

      // Po načtení všech dnů:
      console.log(`Načteno ${allLessons.length} lekcí za ${month}/${year}`);

      // Souhrn podle učitelů
      const teacherSummary = Object.values(
        allLessons.reduce((acc, lesson) => {
          const id = lesson.teacher_id;
          if (!id) return acc;

          if (!acc[id]) {
            acc[id] = {
              teacher_id: id,
              teacher_abbr: lesson.teacher_abbr,
              total_lessons: 0,
              same_teacher_count: 0,
            };
          }

          acc[id].total_lessons++;
          if (lesson.same_teacher) acc[id].same_teacher_count++;

          return acc;
        }, {})
      );

      console.log('📊 Souhrn učitelů:', teacherSummary);
      res.render('vykaz', { teacherSummary });
      return { allLessons, teacherSummary };
    }

    // --- příklad použití ---
    const credentials = btoa('test_vykaz:Test_088'); // tvoje přihlašovací údaje
    fetchLessonsForMonth(2025, 10, credentials);
    //konec fetch
    
  },
'/kalendar': async (req, res) => {
    try {
        // Načtení pouze vlastních událostí z databáze
        const [rows] = await pool.query(
            'SELECT * FROM events ORDER BY event_date ASC'
        );
        
        res.render('kalendar', { 
            customEvents: rows,
            currentYear: new Date().getFullYear()
        });
    } catch (err) {
        console.error('Chyba:', err);
        res.render('kalendar', { 
            customEvents: [],
            currentYear: new Date().getFullYear()
        });
    }
}}


// Dynamický router
for (const [path, handler] of Object.entries(maturitaRoutes)) {
  router.get(path, handler);
}

export default router;

