import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";

router.get('/firemni-udalosti', async (req, res) => {
    
     try {
        const [rows] = await pool.execute(
            'SELECT * FROM meetings'  
        );
        
        console.log(rows)
        
        // Odeslání dat do EJS
        res.render('firemni-udalosti', { 
            meetings: rows
           
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Chyba při načítání dat');
    }
   
});

// Hlavní stránka - načte všechny události a pošle do EJS
router.get('/sprava-udalosti', async (req, res) => {
    console.log("prijat pozadavek na sablonu sprava-udalosti")
    try {
        // Načtení všech událostí
        const [events] = await pool.execute(
            'SELECT * FROM meetings ORDER BY date ASC, id ASC'
        );

        // Načtení statistik
        const [[countResult]] = await pool.execute(
            'SELECT COUNT(*) as total FROM meetings'
        );

        // Načtení typů pro filtr
        const [types] = await pool.execute(
            'SELECT DISTINCT type FROM meetings ORDER BY type'
        );
console.log(events)
         res.render('sprava-udalosti', {
            title: 'Správa událostí',
            events: events,
            meetings: events,
            totalCount: countResult.total,
            types: types,
            filterType: 'all',
            searchQuery: '',
            errors: null,           // <-- DŮLEŽITÉ: vždy předat null
            formData: null,         // <-- DŮLEŽITÉ: vždy předat null
            success: null,
            deleted: null,
            updated: null,
            error: null || null,
            editId: null
        });

    } catch (error) {
        console.error('Chyba při načítání:', error);
        res.render('/', {
            title: 'Správa událostí',
            events: [],
            totalCount: 0,
            types: [],
            filterType: 'all',
            searchQuery: '',
            errors: ['Chyba při načítání dat z databáze'],
            formData: null,
            success: false,
            deleted: false,
            updated: false,
            error: true,
            editId: null
        });
    }
});



// Přidání události
router.post('/add-event', async (req, res) => {
    const { title, date, type, description } = req.body;
    const errors = [];

    // Validace
    if (!title || title.trim().length < 3) {
        errors.push('Název musí mít alespoň 3 znaky');
    }
    if (!date) {
        errors.push('Datum je povinné');
    }
    if (!type) {
        errors.push('Typ je povinný');
    }

    if (errors.length > 0) {
        // Znovu načteme data a zobrazíme chyby
        try {
            const [events] = await pool.execute(
                'SELECT id, title, date, type, description FROM meetings ORDER BY date ASC, id ASC'
            );
            const [types] = await pool.execute(
                'SELECT DISTINCT type FROM meetings ORDER BY type'
            );
            const [[countResult]] = await pool.execute(
                'SELECT COUNT(*) as total FROM meetings'
            );

            return res.render('sprava-udalosti', {
                title: 'Správa událostí',
                events: events,
                totalCount: countResult.total,
                types: types,
                filterType: 'all',
                searchQuery: '',
                errors: errors,
                formData: { title, date, type, description }
            });
        } catch (error) {
            console.error(error);
            return res.redirect('/');
        }
    }

    try {
        // Vložení do databáze
        await pool.execute(
            'INSERT INTO meetings (title, date, type, description) VALUES (?, ?, ?, ?)',
            [title.trim(), date, type, description ? description.trim() : null]
        );

        // Přesměrování na hlavní stránku s úspěchem
        res.redirect('sprava-udalosti');

    } catch (error) {
        console.error('Chyba při přidávání:', error);
        errors.push('Došlo k chybě při ukládání do databáze');

        try {
            const [events] = await pool.execute(
                'SELECT id, title, date, type, description FROM meetings ORDER BY date ASC, id ASC'
            );
            const [types] = await pool.execute(
                'SELECT DISTINCT type FROM meetings ORDER BY type'
            );
            const [[countResult]] = await pool.execute(
                'SELECT COUNT(*) as total FROM meetings'
            );

            res.render('sprava-udalosti', {
                title: 'Správa událostí',
                events: events,
                totalCount: countResult.total,
                types: types,
                filterType: 'all',
                searchQuery: '',
                errors: errors,
                formData: { title, date, type, description }
            });
        } catch (err) {
            res.redirect('/');
        }
    }
});

// Smazání události
router.post('/delete-event/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        await pool.execute(
            'DELETE FROM meetings WHERE id = ?',
            [id]
        );
        res.redirect('/?deleted=1');
    } catch (error) {
        console.error('Chyba při mazání:', error);
        res.redirect('/?error=1');
    }
});

// Smazání všech událostí
router.post('/delete-all', async (req, res) => {
    try {
        await pool.execute('DELETE FROM meetings');
        res.redirect('/?deleted=1');
    } catch (error) {
        console.error('Chyba při mazání všech:', error);
        res.redirect('/?error=1');
    }
});

// Úprava události
router.post('/update-event/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, date, type, description } = req.body;
    const errors = [];

    // Validace
    if (!title || title.trim().length < 3) {
        errors.push('Název musí mít alespoň 3 znaky');
    }
    if (!date) {
        errors.push('Datum je povinné');
    }
    if (!type) {
        errors.push('Typ je povinný');
    }

    if (errors.length > 0) {
        // Přesměrujeme zpět s chybou
        return res.redirect(`/?edit_error=1&id=${id}`);
    }

    try {
        await pool.execute(
            'UPDATE meetings SET title = ?, date = ?, type = ?, description = ? WHERE id = ?',
            [title.trim(), date, type, description ? description.trim() : null, id]
        );
        res.redirect('/?updated=1');
    } catch (error) {
        console.error('Chyba při úpravě:', error);
        res.redirect('/?error=1');
    }
});

// ============================================
// API PRO EDIT - načtení dat do modalu
// ============================================

router.get('/api/event/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const [rows] = await pool.execute(
            'SELECT id, title, date, type, description FROM meetings WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Událost nenalezena' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Chyba při načítání' });
    }
});

// Filtrování událostí -> filtrovat to asi nechci zatim
router.get('/filter', async (req, res) => {
    const { type = 'all', search = '' } = req.query;
    
    try {
        let query = 'SELECT id, title, date, type, description FROM meetings WHERE 1=1';
        const params = [];

        if (type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }

        if (search && search.trim() !== '') {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern);
        }

        query += ' ORDER BY date ASC, id ASC';

        const [events] = await pool.execute(query, params);

        // Načtení všech typů pro filtr
        const [types] = await pool.execute(
            'SELECT DISTINCT type FROM meetings ORDER BY type'
        );

        const [[countResult]] = await pool.execute(
            'SELECT COUNT(*) as total FROM meetings'
        );

        res.render('index', {
            title: 'Správa událostí',
            events: events,
            totalCount: countResult.total,
            types: types,
            filterType: type,
            searchQuery: search,
            errors: null,
            formData: null
        });

    } catch (error) {
        console.error('Chyba při filtrování:', error);
        res.redirect('/');
    }
});


// POST - Zpracování formuláře a vložení do DB
router.post('/meeting/add', async (req, res) => {
    const { title, date, type, description } = req.body;
    const errors = [];
    
    // Validace
    if (!title || title.trim().length < 3) {
        errors.push('Název musí mít alespoň 3 znaky');
    }
    
    if (!date) {
        errors.push('Datum je povinné');
    }
    
    if (!type || !['meeting', 'workshop', 'seminar', 'other'].includes(type)) {
        errors.push('Neplatný typ události');
    }
    
    if (errors.length > 0) {
        return res.render('meeting-add', {
            title: 'Přidat novou událost',
            errors: errors,
            formData: req.body
        });
    }
    
    try {
        // Vložení do databáze
        const [result] = await pool.execute(
            'INSERT INTO meetings (title, date, type, description) VALUES (?, ?, ?, ?)',
            [title.trim(), date, type, description ? description.trim() : null]
        );
        
        // Přesměrování na detail nově vytvořené události
        res.redirect(`/meeting/${result.insertId}`);
        
    } catch (error) {
        console.error('Chyba při vkládání:', error);
        errors.push('Došlo k chybě při ukládání do databáze');
        
        res.render('meeting-add', {
            title: 'Přidat novou událost',
            errors: errors,
            formData: req.body
        });
    }
});


export default router;
