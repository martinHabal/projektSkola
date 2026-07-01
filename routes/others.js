import express from "express";
const router = express.Router();
import pool from '#db/db';//moderni import - nastaveny v package.json
import bcrypt from 'bcrypt';

const maturitaRoutes = {
  '/maturita': (req, res) => res.render('maturita', {
    title: 'Maturita losování',
    description: 'Maturita losování',
    username: req.session.user.username
  }),
  '/skolni-rad': (req, res) => res.render('skolni-rad', {
    title: 'Školní řád',
    description: 'Informace o školním řádu',
    username: req.session.user.username
  }),
}

// Dynamický router
for (const [path, handler] of Object.entries(maturitaRoutes)) {
  router.get(path, handler);
}

export default router;

