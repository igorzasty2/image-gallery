const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'myappdb'
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage: storage });

app.get('/api/images', async (req, res) => {
  try {
    let { limit, random } = req.query;
    limit = limit ? parseInt(limit) : 20;
    let query = 'SELECT * FROM images';
    if (random === 'true') {
      query += ' ORDER BY random()';
    } else {
      query += ' ORDER BY id ASC';
    }
    query += ' LIMIT $1';
    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Błąd pobierania zdjęć:', err);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
});

app.post('/api/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'INSERT INTO images (url) VALUES ($1) RETURNING *',
      [fileUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Błąd przy wgrywaniu zdjęcia:', err);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
});

app.delete('/api/images/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const resultSelect = await pool.query('SELECT * FROM images WHERE id = $1', [id]);
    if (resultSelect.rows.length === 0) {
      return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
    }
    const image = resultSelect.rows[0];
    await pool.query('DELETE FROM images WHERE id = $1', [id]);
    
    const filePath = path.join(__dirname, image.url);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Błąd przy usuwaniu pliku:', err);
      }
    });
    res.json({ message: 'Zdjęcie usunięte' });
  } catch (err) {
    console.error('Błąd przy usuwaniu zdjęcia:', err);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(port, () => {
  console.log(`Backend API działa na porcie ${port}`);
});
