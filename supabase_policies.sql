-- =============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard.
-- 2. Open the SQL Editor.
-- 3. Copy and paste the commands below.
-- 4. Click "Run".
-- =============================================================================

-- 1. Enable RLS on the 'students' table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 2. Ensure user_id column exists (if not already)
-- This links the student record to the auth.users table
-- Uncomment the line below if you haven't created the user_id column yet.
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Admin Full Access" ON students;
DROP POLICY IF EXISTS "User View Own Data" ON students;
DROP POLICY IF EXISTS "User Insert Own Data" ON students;
DROP POLICY IF EXISTS "User Update Own Data" ON students;
DROP POLICY IF EXISTS "User Delete Own Data" ON students;

-- -----------------------------------------------------------------------------
-- ADMIN POLICIES
-- -----------------------------------------------------------------------------

-- Policy: Admin Full Access
-- Allows 'hyper9@example.com' to perform ALL operations (Select, Insert, Update, Delete)
-- on ALL rows. We use lower() to ensure case-insensitive email matching.
CREATE POLICY "Admin Full Access"
ON students
FOR ALL
USING (lower(auth.jwt() ->> 'email') = 'hyper9@example.com');

-- -----------------------------------------------------------------------------
-- USER POLICIES
-- -----------------------------------------------------------------------------

-- Policy: Users View Own Data
-- Users can only view rows where user_id matches their own ID.
CREATE POLICY "User View Own Data"
ON students
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users Insert Own Data
-- Users can insert rows, but only if they assign the row to themselves.
CREATE POLICY "User Insert Own Data"
ON students
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users Update Own Data
-- Users can update rows where user_id matches their own ID.
-- The WITH CHECK clause ensures they cannot transfer ownership to another user.
CREATE POLICY "User Update Own Data"
ON students
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users Delete Own Data
-- Users can delete rows where user_id matches their own ID.
CREATE POLICY "User Delete Own Data"
ON students
FOR DELETE
USING (auth.uid() = user_id);
