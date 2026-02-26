const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

/* =========================
   AUTO CREATE FOLDER UPLOAD
========================= */
if (!fs.existsSync("public/uploads")) {
  fs.mkdirSync("public/uploads", { recursive: true });
}

/* =========================
   DATABASE SQLITE
========================= */
const db = new sqlite3.Database("./database.db");

db.run(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price INTEGER,
  discount INTEGER,
  image TEXT
)
`);

/* =========================
   UPLOAD CONFIG
========================= */
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* =========================
   API
========================= */

// ambil semua produk
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// tambah produk
app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, discount } = req.body;
  const image = req.file ? req.file.filename : null;

  db.run(
    "INSERT INTO products (name, price, discount, image) VALUES (?, ?, ?, ?)",
    [name, price, discount, image],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// edit produk
app.put("/api/products/:id", (req, res) => {
  const { name, price, discount } = req.body;

  db.run(
    "UPDATE products SET name=?, price=?, discount=? WHERE id=?",
    [name, price, discount, req.params.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// hapus produk
app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

/* =========================
   ROUTE HALAMAN
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/Admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("PIWZ MARKET running on port " + PORT);
});
