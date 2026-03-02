import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("students.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date TEXT,
    enrollment_no TEXT UNIQUE NOT NULL,
    grade TEXT,
    father_name TEXT,
    mother_name TEXT,
    address TEXT,
    phone_no TEXT,
    guardian_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students ORDER BY created_at DESC").all();
    res.json(students);
  });

  app.post("/api/students", (req, res) => {
    const { name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes } = req.body;
    
    try {
      const info = db.prepare(`
        INSERT INTO students (name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes);
      
      const newStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newStudent);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Enrollment Number already exists" });
      } else {
        res.status(500).json({ error: "Failed to save student" });
      }
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM students WHERE id = ?").run(id);
    res.status(204).send();
  });

  app.get("/api/stats", (req, res) => {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
    const gradeDistribution = db.prepare("SELECT grade, COUNT(*) as count FROM students GROUP BY grade").all();
    const recentAdmissions = db.prepare("SELECT date(createdAt) as date, COUNT(*) as count FROM students WHERE createdAt > date('now', '-30 days') GROUP BY date(createdAt)").all();
    
    res.json({
      totalStudents,
      gradeDistribution,
      recentAdmissions
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
