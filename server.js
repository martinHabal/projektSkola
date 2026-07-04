import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import pool from './db/db.js';
import 'dotenv/config';
import mysql from 'mysql2/promise';
import routerLogin from './routes/login.js';
import routerVykaz from './routes/vykaz.js';
import routerOther from './routes/others.js';
// import { runMigrations } from './db/migrations/migrate.js';
// import { seedAdmin } from './db/seeders/admin.js';
// ---------- ROUTY ----------

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // pro HTTPS dejte true
}));

//import modulu get a post

// Nastavení EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


//osetreni aby sel user ve vsech sablonach v header
app.use((req, res, next) => {
    // Nastavení globálních proměnných pro všechny šablony
    res.locals.username = req.session?.user?.username || null;
    res.locals.isLoggedIn = !!req.session?.user;
    res.locals.user = req.session?.user || null;
    next();
});

app.use('/', routerLogin);
app.use('/', routerVykaz);
app.use('/', routerOther);





app.listen(PORT, () => {
    console.log(`🚀 Server běží na http://localhost:${PORT}`);
});