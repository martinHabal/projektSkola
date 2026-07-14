import express from "express";
const router = express.Router();
import pool from "#db/db"; //moderni import - nastaveny v package.json
import bcrypt from "bcrypt";
import axios from "axios";
import 'dotenv/config';



//POST PRO KOMUNIKACI S OPENAI - školní řád
// ============================================================
// 🔑 API KLÍČ – PEVNĚ ZAKÓDOVANÝ (uživatel ho nevidí)
// ============================================================
// ============================================================
// TEST ENDPOINT PRO OVĚŘENÍ, ŽE BACKEND BĚŽÍ
// ============================================================
router.get('/api/test', (req, res) => {
    console.log('📨 Testovací požadavek na /api/test');
    res.json({ status: 'ok', message: 'Backend běží!' });
});
// ============================================================
// ENDPOINT PRO KOMUNIKACI S OPENAI
// ============================================================
router.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Chybí zprávy' });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 800,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        res.json({
            reply: response.data.choices[0].message.content.trim()
        });
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Chyba při komunikaci s OpenAI API',
            detail: error.response?.data?.error?.message || error.message
        });
    }
});

const MANUAL_TEXT = `
Výkaz práce slouží k zaznamenávání odpracovaných hodin, projektů a úkolů. Vyplňuje se denně nebo týdně.

Povinné položky:
- Datum – den, ke kterému se výkaz vztahuje.
- Projekt / zakázka – kód nebo název projektu.
- Činnost – popis vykonané práce (např. vývoj, analýza, schůzka).
- Doba trvání – v hodinách (0,5 – 24h).

Schvalovací proces:
Výkaz odesíláte vedoucímu projektu. Po kontrole může být schválen, vrácen k přepracování nebo zamítnut.

Časté chyby:
- Chybějící název projektu – povinné.
- Neplatný formát času – používejte desetinná čísla (např. 1,5 hodiny).
- Duplicitní záznamy pro stejný den/projekt – systém varuje.

Odevzdání a uzávěrka:
Výkazy se odevzdávají do pátku 12:00 za uplynulý týden. Po uzávěrce je nutná výjimka.

Přílohy a komentáře:
K výkazu lze připojit soubory (max 5 MB) a interní poznámky pro schvalovatele.

Náhrady a přesčasy:
Přesčasové hodiny se vykazují samostatně a musí být schváleny předem.
`;

router.post('/api/chat/manual', async (req, res) => {
    console.log('📨 Přijat požadavek na /api/chat');
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Chybí zprávy' });
    }

    // Přidáme systémový prompt s obsahem manuálu
    const systemPrompt = `Jsi užitečný asistent pro manuál k výkazu práce. Odpovídej výhradně na základě tohoto manuálu. Pokud odpověď v manuálu nenajdeš, řekni to. Manuál:\n${MANUAL_TEXT}`;

    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    console.log(`📤 Odesílám ${fullMessages.length} zpráv na OpenAI...`);

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: fullMessages,
                max_tokens: 800,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                timeout: 30000
            }
        );

        const reply = response.data.choices[0].message.content.trim();
        console.log('✅ Odpověď přijata (délka:', reply.length, 'znaků)');
        res.json({ reply });

    } catch (error) {
        console.error('❌ Chyba OpenAI API:', error.response?.data || error.message);
        
        let errorMsg = 'Chyba při komunikaci s OpenAI API';
        if (error.response?.data?.error?.message) {
            errorMsg = error.response.data.error.message;
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = 'Časový limit vypršel';
        } else if (error.message) {
            errorMsg = error.message;
        }

        res.status(500).json({
            error: errorMsg,
            detail: error.response?.data?.error?.message || null
        });
    }
});

router.post('/api/chat/dokumenty', async (req, res) => {
    const { messages, documents } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Chybí zprávy' });
    }

    const systemPrompt = `Jsi odborný asistent pro správu dokumentů školy.
Tvou jedinou povinností je odpovídat VÝHRADNĚ na základě informací obsažených v dokumentech níže.

PRAVIDLA:
1. Odpovídej POUZE na základě informací z dokumentů.
2. Pokud odpověď v dokumentech nenajdeš, NAPIŠ: "Odpověď na tuto otázku jsem v dokumentech nenašel."
3. Necituj celé dokumenty, ale odpovídej vlastními slovy.
4. Pokud se ptáš na konkrétní dokument, uveď jeho název.

DOKUMENTY:
${documents || ''}`;

    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: fullMessages,
                max_tokens: 800,
                temperature: 0.3
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                timeout: 30000
            }
        );

        res.json({ reply: response.data.choices[0].message.content.trim() });
    } catch (error) {
        console.error('❌ Chyba:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error?.message || 'Chyba API' });
    }
});

export default router;
