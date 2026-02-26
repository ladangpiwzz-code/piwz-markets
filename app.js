const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

if (!fs.existsSync("public/uploads")) {
  fs.mkdirSync("public/uploads", { recursive: true });
}

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

const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, price, discount } = req.body;
  const image = req.file ? req.file.filename : null;

  db.run(
    "INSERT INTO products (name, price, discount, image) VALUES (?, ?, ?, ?)",
    [name, price, discount, image],
    () => res.json({ success: true })
  );
});

app.put("/api/products/:id", (req, res) => {
  const { name, price, discount } = req.body;

  db.run(
    "UPDATE products SET name=?, price=?, discount=? WHERE id=?",
    [name, price, discount, req.params.id],
    () => res.json({ success: true })
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], () =>
    res.json({ success: true })
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/Admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PIWZ MARKET running on " + PORT));
