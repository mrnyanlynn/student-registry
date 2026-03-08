import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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
    try {
      const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
      const gradeDistribution = db.prepare("SELECT grade, COUNT(*) as count FROM students GROUP BY grade").all();
      const recentAdmissions = db.prepare("SELECT date(created_at) as date, COUNT(*) as count FROM students WHERE created_at > date('now', '-30 days') GROUP BY date(created_at)").all();
      
      res.json({
        totalStudents,
        gradeDistribution,
        recentAdmissions
      });
    } catch (error: any) {
      console.error("Error fetching local stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin route to delete all students using Service Role Key
  app.delete("/api/admin/delete-all", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("Missing Supabase configuration for admin delete, falling back to local delete");
      try {
        db.prepare("DELETE FROM students").run();
        return res.json({ message: "All records deleted locally" });
      } catch (e: any) {
        return res.status(500).json({ error: "Failed to delete local records" });
      }
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Delete all records from 'students' table
      const { error, count } = await supabaseAdmin
        .from('students')
        .delete({ count: 'exact' })
        .neq('id', -1);

      if (error) throw error;

      res.json({ message: "All records deleted successfully", count });
    } catch (error: any) {
      console.warn("Supabase delete failed, falling back to local delete:", error.message);
      try {
        db.prepare("DELETE FROM students").run();
        return res.json({ message: "All records deleted locally (fallback)" });
      } catch (e: any) {
        console.error("Error deleting all records:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Admin route to fetch all students (bypassing RLS)
  app.get("/api/admin/students", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
       // Fallback to local DB
       try {
         const students = db.prepare("SELECT * FROM students ORDER BY created_at DESC").all();
         return res.json({ data: students, count: students.length });
       } catch (e) {
         return res.status(500).json({ error: "Failed to fetch local students" });
       }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    try {
      const page = parseInt(req.query.page as string) || 0;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const grade = req.query.grade as string;
      const gender = req.query.gender as string;
      const sortBy = req.query.sortBy as string;

      let query = supabaseAdmin
        .from('students')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,enrollment_no.ilike.%${search}%`);
      }
      
      if (grade && grade !== 'All Grades') {
        query = query.eq('grade', grade);
      }

      if (gender && gender !== 'All Genders') {
        query = query.eq('gender', gender);
      }

      // Apply Sorting
      if (sortBy === 'name') {
        query = query.order('name', { ascending: true });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply Pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({ data, count });
    } catch (error: any) {
      console.warn("Supabase fetch failed, falling back to local DB:", error.message);
      try {
         // Simple fallback: return all local students (pagination/filtering not fully implemented for fallback to keep it simple, or we could implement it)
         // For now, just return all
         const students = db.prepare("SELECT * FROM students ORDER BY created_at DESC").all();
         res.json({ data: students, count: students.length });
      } catch (e) {
         res.status(500).json({ error: error.message });
      }
    }
  });

  // Admin route to fetch global stats (bypassing RLS)
  app.get("/api/admin/stats", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Helper to fetch from SQLite
    const fetchFromSQLite = () => {
        const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
        const gradeDistribution = db.prepare("SELECT grade, COUNT(*) as count FROM students GROUP BY grade").all();
        const recentAdmissions = db.prepare("SELECT date(created_at) as date, COUNT(*) as count FROM students WHERE created_at > date('now', '-30 days') GROUP BY date(created_at)").all();
        
        return {
          totalStudents,
          gradeDistribution,
          recentAdmissions
        };
    };

    if (!supabaseUrl || !serviceRoleKey) {
      try {
        const stats = fetchFromSQLite();
        return res.json(stats);
      } catch (e: any) {
        return res.status(500).json({ error: "Failed to fetch local stats" });
      }
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Fetch only necessary columns for stats
      const { data, error } = await supabaseAdmin
        .from('students')
        .select('grade, created_at');

      if (error) throw error;

      if (data) {
        const totalStudents = data.length;
        const gradeCounts: Record<string, number> = {};
        const recentAdmissionsMap: Record<string, number> = {};

        data.forEach((s: any) => {
          if (s.grade) gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
          const date = s.created_at?.split('T')[0];
          if (date) recentAdmissionsMap[date] = (recentAdmissionsMap[date] || 0) + 1;
        });

        res.json({
          totalStudents,
          gradeDistribution: Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count })),
          recentAdmissions: Object.entries(recentAdmissionsMap).map(([date, count]) => ({ date, count }))
        });
      } else {
        res.json({
          totalStudents: 0,
          gradeDistribution: [],
          recentAdmissions: []
        });
      }
    } catch (error: any) {
      console.warn("Supabase stats fetch failed, falling back to SQLite:", error.message);
      try {
        const stats = fetchFromSQLite();
        res.json(stats);
      } catch (e: any) {
        res.status(500).json({ error: error.message });
      }
    }
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
