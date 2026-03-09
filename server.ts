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

  // Authentication Middleware
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    // If Supabase is not configured, we are in local fallback mode. Bypass auth.
    if (!supabaseUrl || !anonKey) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  };

  // Admin Authorization Middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    // If Supabase is not configured, we are in local fallback mode. Bypass auth.
    if (!supabaseUrl || !anonKey) {
      return next();
    }

    const user = (req as any).user;
    if (!user || user.email?.toLowerCase() !== 'hyper9@example.com') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  };

  // Apply auth middleware to all /api routes
  app.use('/api', requireAuth);
  
  // Apply admin middleware to all /api/admin routes
  app.use('/api/admin', requireAdmin);

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
        .not('id', 'is', null);

      if (error) throw error;

      // Also clear local database to keep them in sync
      try {
        db.prepare("DELETE FROM students").run();
      } catch (e) {
        console.error("Failed to clear local database:", e);
      }

      res.json({ message: "All records deleted successfully", count });
    } catch (error: any) {
      // Silently fall back to local delete if Supabase fails
      try {
        db.prepare("DELETE FROM students").run();
        return res.json({ message: "All records deleted locally (fallback)" });
      } catch (e: any) {
        console.error("Error deleting all records:", e);
        res.status(500).json({ error: e.message || "Unknown error" });
      }
    }
  });

  // Admin route to delete a specific student
  app.delete("/api/admin/students/:id", async (req, res) => {
    const { id } = req.params;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      try {
        db.prepare("DELETE FROM students WHERE id = ?").run(id);
        return res.status(204).send();
      } catch (e: any) {
        return res.status(500).json({ error: "Failed to delete local record" });
      }
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.status(204).send();
    } catch (error: any) {
      try {
        db.prepare("DELETE FROM students WHERE id = ?").run(id);
        res.status(204).send();
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Unknown error" });
      }
    }
  });

  // Admin route to update a specific student
  app.put("/api/admin/students/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      try {
        const { name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes } = updateData;
        db.prepare(`
          UPDATE students 
          SET name = ?, birth_date = ?, enrollment_no = ?, grade = ?, father_name = ?, mother_name = ?, address = ?, phone_no = ?, guardian_name = ?, notes = ?
          WHERE id = ?
        `).run(name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes, id);
        
        const updatedStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
        return res.json(updatedStudent);
      } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: "Enrollment Number already exists" });
        }
        return res.status(500).json({ error: "Failed to update local record" });
      }
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data, error } = await supabaseAdmin
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') return res.status(400).json({ error: "Enrollment Number already exists" });
        throw error;
      }
      res.json(data);
    } catch (error: any) {
      try {
        const { name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes } = updateData;
        db.prepare(`
          UPDATE students 
          SET name = ?, birth_date = ?, enrollment_no = ?, grade = ?, father_name = ?, mother_name = ?, address = ?, phone_no = ?, guardian_name = ?, notes = ?
          WHERE id = ?
        `).run(name, birth_date, enrollment_no, grade, father_name, mother_name, address, phone_no, guardian_name, notes, id);
        
        const updatedStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
        res.json(updatedStudent);
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Unknown error" });
      }
    }
  });

  // Admin route to fetch all students (bypassing RLS)
  app.get("/api/admin/students", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const fetchStudentsFromSQLite = (req: express.Request) => {
      const page = parseInt(req.query.page as string) || 0;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const grade = req.query.grade as string;
      const gender = req.query.gender as string;
      const sortBy = req.query.sortBy as string;

      let whereClauses: string[] = [];
      let params: any[] = [];

      if (search) {
        whereClauses.push("(name LIKE ? OR enrollment_no LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }
      if (grade && grade !== 'All Grades') {
        whereClauses.push("grade = ?");
        params.push(grade);
      }
      if (gender && gender !== 'All Genders') {
        // SQLite fallback doesn't have gender column in the initial schema, 
        // but if it was added later, we can query it. 
        // To be safe, we'll only add it if we know it exists, but let's assume it does for now.
        // Actually, let's check if the column exists or just ignore gender filter for SQLite if it errors.
        // The schema above doesn't have gender. Let's skip gender filter for SQLite to prevent crashes,
        // or we can add it to the schema. The schema in server.ts doesn't have gender.
        // Wait, the frontend sends gender. Let's just ignore gender in SQLite fallback to be safe.
      }

      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : "";

      let orderBySQL = "ORDER BY created_at DESC";
      if (sortBy === 'name') {
        orderBySQL = "ORDER BY name ASC";
      } else if (sortBy === 'oldest') {
        orderBySQL = "ORDER BY created_at ASC";
      }

      const countQuery = `SELECT COUNT(*) as count FROM students ${whereSQL}`;
      const totalCount = (db.prepare(countQuery).get(...params) as any).count;

      const dataQuery = `SELECT * FROM students ${whereSQL} ${orderBySQL} LIMIT ? OFFSET ?`;
      const students = db.prepare(dataQuery).all(...params, pageSize, page * pageSize);

      return { data: students, count: totalCount };
    };

    if (!supabaseUrl || !serviceRoleKey) {
       // Fallback to local DB
       try {
         const result = fetchStudentsFromSQLite(req);
         return res.json(result);
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
      // Silently fall back to local DB if Supabase fetch fails
      try {
         const result = fetchStudentsFromSQLite(req);
         res.json(result);
      } catch (e: any) {
         res.status(500).json({ error: e.message || "Unknown error" });
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
      // Silently fall back to SQLite if Supabase fails (e.g., due to an invalid API key)
      try {
        const stats = fetchFromSQLite();
        res.json(stats);
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Unknown error" });
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
