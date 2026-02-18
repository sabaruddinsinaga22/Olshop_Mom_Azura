const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'blogsecret',
    resave: false,
    saveUninitialized: true
}));

// Static folder
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/client', express.static(path.join(__dirname, 'client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Database
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "123") {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// TAMBAH POST + GAMBAR
app.post('/add-post', upload.single('image'), (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send("Akses ditolak");
    }

    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;

    db.run("INSERT INTO posts (title, content, image) VALUES (?, ?, ?)", 
        [title, content, image],
        (err) => {
            if (err) return res.status(500).send("Gagal menyimpan");
            res.send("Berhasil disimpan");
        }
    );
});

// AMBIL POST
app.get('/posts', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).send("Error");
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
