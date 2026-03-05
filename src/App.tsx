import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  UserPlus, 
  Trash2, 
  Eye, 
  EyeOff,
  Download, 
  X, 
  Home,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Hash,
  User,
  MapPin,
  Phone,
  FileText,
  Edit,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Settings as SettingsIcon,
  GraduationCap,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  LogOut,
  LogIn,
  Mail,
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Student, NewStudent } from './types';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Language, translations } from './i18n';
import ReloadPrompt from './components/ReloadPrompt';

// --- Components ---

const Auth = ({ onAuthSuccess, lang, setLang, darkMode, setDarkMode }: { 
  onAuthSuccess: () => void, 
  lang: Language, 
  setLang: (l: Language) => void,
  darkMode: boolean,
  setDarkMode: (d: boolean) => void
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase configuration');
      // We can't use showToast here because it might not be initialized yet or context issue
      // But we can set a global error or just log it.
      // Actually showToast is defined in App component scope, so it's fine.
      // But wait, showToast is defined inside App component? No, it's likely a helper or hook.
      // Let's check where showToast comes from.
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        if (!data.session) {
          alert(t.checkEmail);
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message === 'Failed to fetch') {
        setError(t.networkError);
      } else if (err.message && (err.message.includes('Refresh Token') || err.message.includes('JWT'))) {
        setError('Session expired. Please try again.');
        await supabase.auth.signOut();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative transition-colors duration-300">
      <div className="absolute top-8 right-8 flex gap-2">
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg border transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-400 border-slate-200'}`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button 
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('mm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'mm' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          MM
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 transition-colors duration-300"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.appName}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{isLogin ? t.login : t.tagline}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.rememberMe}</span>
            </label>
            {isLogin && (
              <button type="button" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                {t.forgotPassword}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex gap-3 items-center">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t.processing : isLogin ? t.signIn : t.signUp}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {isLogin ? t.noAccount : t.alreadyAccount}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const StatsCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="glass-card p-6 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 20, x: '-50%' }}
    className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-80">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const [view, setView] = useState<'home' | 'dashboard' | 'settings'>('home');
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // Settings State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', String(emailNotifications));
  }, [emailNotifications]);

  const [formData, setFormData] = useState<NewStudent>({
    name: '',
    birth_date: '',
    enrollment_no: '',
    grade: '',
    father_name: '',
    mother_name: '',
    address: '',
    phone_no: '',
    guardian_name: '',
    guardian_address: '',
    guardian_phone: '',
    notes: ''
  });

  const isAdmin = useMemo(() => {
    return session?.user?.email?.toLowerCase() === 'admin@example.com';
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // Clear invalid session data
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      if (session) {
        // We need to pass the session explicitly because state update might be slow
        fetchStudents();
        fetchStats();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setStudents([]);
        setStats(null);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session) {
        fetchStudents();
        fetchStats();
      } else {
        setStudents([]);
        setStats(null);
        setLoading(false);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      subscription.unsubscribe();
    };
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      if (err.message === 'Failed to fetch') {
        showToast(t.networkError, 'error');
      } else if (err.message && (err.message.includes('Refresh Token') || err.message.includes('JWT'))) {
        // Handle invalid token by logging out
        await supabase.auth.signOut();
        setSession(null);
      } else {
        showToast(`${t.loadStudentsError}: ${err.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // In a real app, you might use Supabase RPC or multiple queries
      const { data: studentsData, error } = await supabase.from('students').select('*');
      if (error) throw error;

      const totalStudents = studentsData.length;
      const gradeCounts: Record<string, number> = {};
      const recentAdmissions: Record<string, number> = {};

      studentsData.forEach(s => {
        if (s.grade) gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
        const date = s.created_at?.split('T')[0];
        if (date) recentAdmissions[date] = (recentAdmissions[date] || 0) + 1;
      });

      setStats({
        totalStudents,
        gradeDistribution: Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count })),
        recentAdmissions: Object.entries(recentAdmissions).map(([date, count]) => ({ date, count }))
      });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      if (err.message === 'Failed to fetch') {
        showToast(t.networkError, 'error');
      } else if (err.message && (err.message.includes('Refresh Token') || err.message.includes('JWT'))) {
        // Handle invalid token by logging out
        await supabase.auth.signOut();
        setSession(null);
      } else {
        showToast(`${t.loadStatsError}: ${err.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      showToast('Missing Supabase configuration. Check your .env file.', 'error');
    }
  }, []);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.name.trim()) {
        showToast(t.nameRequired, 'error');
        return false;
      }
      if (!formData.enrollment_no.trim()) {
        showToast(t.enrollmentRequired, 'error');
        return false;
      }
    }
    if (step === 3) {
      // Support both standard and Burmese digits
      if (formData.phone_no && !/^[\d\u1040-\u1049\s\-+()]+$/.test(formData.phone_no)) {
        showToast(t.phoneDigitsOnly, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formStep < 4) return;

    // Final Validation
    if (!formData.name.trim() || !formData.enrollment_no.trim()) {
      showToast(`${t.nameRequired} & ${t.enrollmentRequired}`, 'error');
      setFormStep(1);
      return;
    }

    try {
      let data, error;
      
      if (isEditMode && editingId) {
        // Update existing student
        const result = await supabase
          .from('students')
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new student
        const result = await supabase
          .from('students')
          .insert([{ ...formData, user_id: session?.user.id }])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        if (error.code === '23505') throw new Error(t.enrollmentExists);
        throw error;
      }
      
      if (data) {
        if (isEditMode) {
          setStudents(students.map(s => s.id === editingId ? data : s));
          showToast(t.updateSuccess, 'success');
        } else {
          setStudents([data, ...students]);
          showToast(t.saveSuccess, 'success');
        }
        
        setIsModalOpen(false);
        setFormStep(1);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({
          name: '',
          birth_date: '',
          enrollment_no: '',
          grade: '',
          father_name: '',
          mother_name: '',
          address: '',
          phone_no: '',
          guardian_name: '',
          guardian_address: '',
          guardian_phone: '',
          notes: ''
        });
        fetchStats();
      }
    } catch (err: any) {
      showToast(err.message || t.saveError, 'error');
    }
  };

  const handleEdit = (student: Student) => {
    setFormData({
      name: student.name || '',
      birth_date: student.birth_date || '',
      enrollment_no: student.enrollment_no || '',
      grade: student.grade || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      address: student.address || '',
      phone_no: student.phone_no || '',
      guardian_name: student.guardian_name || '',
      guardian_address: student.guardian_address || '',
      guardian_phone: student.guardian_phone || '',
      notes: student.notes || ''
    });
    setEditingId(student.id);
    setIsEditMode(true);
    setFormStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setStudentToDelete(id);
    setIsDeletingAll(false);
    setIsDeleteModalOpen(true);
  };

  const handleClearAllRecords = () => {
    setIsDeletingAll(true);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (isDeletingAll) {
        const { error } = await supabase
          .from('students')
          .delete()
          .gt('id', 0); 

        if (error) throw error;

        setStudents([]);
        setStats(null);
        showToast(t.clearSuccess, 'success');
      } else if (studentToDelete) {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentToDelete);
        
        if (error) throw error;
        
        setStudents(students.filter(s => s.id !== studentToDelete));
        showToast(t.deleteSuccess, 'success');
      }
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting:', err);
      showToast(`${t.errorDelete}: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      setIsDeletingAll(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => 
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.enrollment_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedGrade !== 'All Grades') {
      result = result.filter(s => s.grade === selectedGrade);
    }

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
    } else {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [students, searchTerm, selectedGrade, sortBy]);

  const recentAdmissions = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return students.filter(s => s.created_at && new Date(s.created_at) > sevenDaysAgo).length;
  }, [students]);

  if (!session) {
    return <Auth onAuthSuccess={() => {}} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  const exportToCSV = () => {
    const headers = [
      t.studentName, 
      t.enrollmentNo, 
      t.grade, 
      t.birthDate, 
      t.fatherName, 
      t.motherName, 
      t.phoneNo, 
      t.address, 
      t.guardianName, 
      t.guardianPhone,
      t.guardianAddress,
      t.notes
    ];
    const rows = students.map(s => [
      s.name, s.enrollment_no, s.grade, s.birth_date, s.father_name, s.mother_name, s.phone_no, s.address, s.guardian_name, s.guardian_phone, s.guardian_address, s.notes
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Add UTF-8 BOM for Excel compatibility with Burmese characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupDatabase = () => {
    if (students.length === 0) {
      showToast(t.noRecordsBackup, 'error');
      return;
    }
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_registry_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t.backupSuccess, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-auto md:h-screen sticky top-0 z-40 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">{t.appName}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              view === 'home' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            {t.home}
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              view === 'dashboard' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t.dashboard}
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              view === 'settings' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            {t.settings}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setLang('en')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                lang === 'en' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
              }`}
            >
              {t.english}
            </button>
            <button 
              onClick={() => setLang('mm')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                lang === 'mm' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
              }`}
            >
              {t.burmese}
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl mb-4 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.signedInAs}</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mb-2">{session?.user.email}</p>
            {isAdmin && (
              <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-md border border-amber-200 dark:border-amber-800">
                {t.adminAccess}
              </span>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {view === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.home}</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{t.tagline}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setLoading(true);
                      fetchStudents().then(() => fetchStats());
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium shadow-sm active:scale-95"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {t.exportCSV}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="group relative flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-95 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    <Plus className="w-5 h-5" />
                    <span>{t.addStudent}</span>
                  </button>
                </div>
              </header>

              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard 
                  title={t.totalStudents} 
                  value={students.length} 
                  icon={Users} 
                  color="bg-indigo-600" 
                />
                <StatsCard 
                  title={t.recentAdmissions} 
                  value={recentAdmissions} 
                  icon={UserPlus} 
                  color="bg-emerald-500" 
                />
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
                <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    id="search-input"
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    className="w-full pl-14 pr-14 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title={t.clearSearch}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
                      /
                    </kbd>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 shadow-sm">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                      className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                    >
                      <option className="dark:bg-slate-800">{t.allGrades}</option>
                      <option value="KG" className="dark:bg-slate-800">KG</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i} value={`Grade ${i + 1}`} className="dark:bg-slate-800">
                          {lang === 'mm' 
                            ? `${['၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉', '၁၀', '၁၁', '၁၂'][i]} တန်း`
                            : `Grade ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 shadow-sm">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    <select 
                      className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="newest" className="dark:bg-slate-800">{t.newest}</option>
                      <option value="oldest" className="dark:bg-slate-800">{t.oldest}</option>
                      <option value="name" className="dark:bg-slate-800">{t.nameAZ}</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl whitespace-nowrap">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t.results}</span>
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                      {filteredStudents.length} <span className="font-normal opacity-60">{t.of}</span> {students.length}
                    </span>
                  </div>

                  {(searchTerm || selectedGrade !== 'All Grades' || sortBy !== 'newest') && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedGrade('All Grades');
                        setSortBy('newest');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest px-2"
                    >
                      {t.clearFilters}
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table & Mobile List */}
              <div className="glass-card overflow-hidden">
                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">{t.loadingStudents}</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.noStudents}</h3>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedGrade('All Grades');
                            setSortBy('newest');
                          }}
                          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold"
                        >
                          {t.clearFilters}
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{student.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.enrollment_no}</p>
                          </div>
                          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-100 dark:border-indigo-800">
                            {student.grade || t.na}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {student.phone_no || '-'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {student.father_name || '-'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t.viewDetails}
                          </button>
                          <button 
                            onClick={() => handleEdit(student)}
                            className="flex items-center justify-center w-9 h-9 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-800/30"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="flex items-center justify-center w-9 h-9 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-800/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t.studentName}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t.enrollmentNo}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t.grade}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">{t.birthDate}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">{t.parents}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t.phoneNo}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden xl:table-cell">{t.notes}</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">{t.loadingStudents}</td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.noStudents}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">We couldn't find any students matching your current filters or search term.</p>
                            <button 
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedGrade('All Grades');
                                setSortBy('newest');
                              }}
                              className="mt-2 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                            >
                              {t.clearFilters}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{student.enrollment_no}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                              {student.grade || t.na}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{student.birth_date}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                            <div className="text-xs opacity-70">F: {student.father_name || '-'}</div>
                            <div className="text-xs opacity-70">M: {student.mother_name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{student.phone_no}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden xl:table-cell max-w-xs">
                            <p className="truncate" title={student.notes}>{student.notes || '-'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedStudent(student)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-lg transition-all"
                                title={t.viewDetails}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEdit(student)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(student.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg transition-all"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.dashboard}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t.systemAnalytics}</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      {t.gradeDistribution}
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.gradeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            color: darkMode ? '#f8fafc' : '#0f172a'
                          }}
                          cursor={{ fill: darkMode ? '#334155' : '#f8fafc' }}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      {t.enrollmentOverview}
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.gradeDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="grade"
                        >
                          {(stats?.gradeDistribution || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none',
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            color: darkMode ? '#f8fafc' : '#0f172a'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6">{t.recentAdmissionsTrend}</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.recentAdmissions || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#0f172a'
                        }} 
                      />
                      <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.settings}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t.settingsTagline}</p>
              </header>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t.generalPreferences}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t.darkMode}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.darkModeDesc}</p>
                      </div>
                      <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t.emailNotifications}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.emailNotificationsDesc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEmailNotifications(!emailNotifications);
                          showToast(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`, 'success');
                        }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${emailNotifications ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${emailNotifications ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t.databaseManagement}</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">{t.exportCSV}</p>
                        <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">Export all records to CSV (Excel compatible with Burmese support)</p>
                      </div>
                      <Download className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600 group-hover:translate-y-1 transition-all" />
                    </button>

                    <button 
                      onClick={handleBackupDatabase}
                      className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t.backupDatabase}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.backupDatabaseDesc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button 
                      onClick={handleClearAllRecords}
                      className="w-full text-left px-4 py-3 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-rose-700 dark:text-rose-400">{t.clearAllRecords}</p>
                        <p className="text-sm text-rose-500 dark:text-rose-400/70">{t.clearAllRecordsDesc}</p>
                      </div>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md"
              >
                <div className="h-full flex flex-col bg-white shadow-2xl">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          {isEditMode ? <Edit className="w-5 h-5 text-indigo-600" /> : <UserPlus className="w-5 h-5 text-indigo-600" />}
                        </div>
                        {isEditMode ? t.editStudent : t.addStudent}
                      </h2>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((step) => (
                        <React.Fragment key={step}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              formStep === step 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                                : formStep > step 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-200 text-slate-500'
                            }`}>
                              {formStep > step ? <CheckCircle2 className="w-3 h-3" /> : step}
                            </div>
                          </div>
                          {step < 4 && <div className={`flex-1 h-0.5 rounded-full ${formStep > step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                        {formStep === 1 ? `${t.step} 1: ${t.personalDetails}` : formStep === 2 ? `${t.step} 2: ${t.familyDetails}` : formStep === 3 ? `${t.step} 3: ${t.contactInfo}` : `${t.step} 4: ${t.review}`}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      <AnimatePresence mode="wait">
                        {formStep === 1 && (
                          <motion.section 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-5"
                          >
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.studentName} <span className="text-rose-500">*</span></label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  required
                                  type="text" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.namePlaceholder}
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.enrollmentNo} <span className="text-rose-500">*</span></label>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  required
                                  type="text" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.enrollmentPlaceholder}
                                  value={formData.enrollment_no}
                                  onChange={e => setFormData({...formData, enrollment_no: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.grade}</label>
                                <div className="relative">
                                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <select 
                                    className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white appearance-none"
                                    value={formData.grade}
                                    onChange={e => setFormData({...formData, grade: e.target.value})}
                                  >
                                    <option value="">{t.select}</option>
                                    <option value="KG">KG</option>
                                    {[...Array(12)].map((_, i) => (
                                      <option key={i} value={`Grade ${i + 1}`}>
                                        {lang === 'mm' 
                                          ? `${['၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉', '၁၀', '၁၁', '၁၂'][i]} တန်း`
                                          : `Grade ${i + 1}`}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.birthDate}</label>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white cursor-pointer"
                                    value={formData.birth_date}
                                    onChange={e => setFormData({...formData, birth_date: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.section>
                        )}

                        {formStep === 2 && (
                          <motion.section 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-5"
                          >
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.fatherName}</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.fullNamePlaceholder}
                                  value={formData.father_name}
                                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.motherName}</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.fullNamePlaceholder}
                                  value={formData.mother_name}
                                  onChange={e => setFormData({...formData, mother_name: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.phoneNo}</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="tel" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.numbersOnlyPlaceholder}
                                  value={formData.phone_no}
                                  onChange={e => setFormData({...formData, phone_no: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.address}</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[80px]" 
                                  placeholder={t.addressPlaceholder}
                                  value={formData.address}
                                  onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                              </div>
                            </div>
                          </motion.section>
                        )}

                        {formStep === 3 && (
                          <motion.section 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-5"
                          >
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.guardianName}</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.fullNamePlaceholder}
                                  value={formData.guardian_name}
                                  onChange={e => setFormData({...formData, guardian_name: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.guardianPhone}</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="tel" 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400" 
                                  placeholder={t.numbersOnlyPlaceholder}
                                  value={formData.guardian_phone || ''}
                                  onChange={e => setFormData({...formData, guardian_phone: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.guardianAddress}</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[80px]" 
                                  placeholder={t.addressPlaceholder}
                                  value={formData.guardian_address || ''}
                                  onChange={e => setFormData({...formData, guardian_address: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.notes}</label>
                              <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea 
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[80px]" 
                                  placeholder={t.notesPlaceholder}
                                  value={formData.notes}
                                  onChange={e => setFormData({...formData, notes: e.target.value})}
                                />
                              </div>
                            </div>
                          </motion.section>
                        )}

                        {formStep === 4 && (
                          <motion.section 
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                          >
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                              <h4 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wider">{t.reviewDetails}</h4>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.studentName}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.enrollmentNo}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.enrollment_no}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.grade}</span>
                                    <p className="text-sm font-bold text-slate-900">{formData.grade || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.birthDate}</span>
                                    <p className="text-sm font-bold text-slate-900">{formData.birth_date || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.fatherName}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.father_name || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.motherName}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.mother_name || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.phoneNo}</span>
                                    <p className="text-sm font-bold text-slate-900">{formData.phone_no || t.na}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.address}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.address || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.guardianName}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.guardian_name || t.na}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.guardianPhone}</span>
                                    <p className="text-sm font-bold text-slate-900 truncate">{formData.guardian_phone || t.na}</p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-indigo-100">
                                  <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.guardianAddress}</span>
                                  <p className="text-xs text-slate-700 line-clamp-2">{formData.guardian_address || t.na}</p>
                                </div>
                                <div className="pt-2 border-t border-indigo-100">
                                  <span className="text-[10px] text-indigo-600 font-bold uppercase">{t.notes}</span>
                                  <p className="text-xs text-slate-700 line-clamp-2">{formData.notes || t.na}</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                              <p className="text-[11px] text-amber-700 leading-relaxed">
                                {t.reviewMessage}
                              </p>
                            </div>
                          </motion.section>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                          {formStep === 1 ? (
                            <button 
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                            >
                              {t.cancel}
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => setFormStep(prev => prev - 1)}
                              className="flex items-center gap-2 px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              {t.back}
                            </button>
                          )}
                        </div>
                        
                        {formStep < 4 ? (
                          <button 
                            type="button"
                            onClick={() => {
                              if (validateStep(formStep)) {
                                setFormStep(prev => prev + 1);
                              }
                            }}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-95 text-sm"
                          >
                            {t.next}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            type="submit"
                            className="group relative flex items-center gap-3 bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-95 overflow-hidden text-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            <CheckCircle2 className="w-4 h-4" />
                            {t.saveStudent}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-indigo-600 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                      <p className="opacity-80 flex items-center gap-2 mt-1">
                        <Hash className="w-4 h-4" />
                        {selectedStudent.enrollment_no}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.grade}</p>
                    <p className="text-indigo-600 font-bold text-lg">{selectedStudent.grade || t.na}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.birthDate}</p>
                    <p className="text-slate-900 font-bold">{selectedStudent.birth_date || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.phoneNo}</p>
                    <p className="text-slate-900 font-bold">{selectedStudent.phone_no || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.parentsInfo}</p>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> {t.fatherName}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{selectedStudent.father_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> {t.motherName}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{selectedStudent.mother_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {t.phoneNo}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{selectedStudent.phone_no || '-'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500 block mb-1">{t.address}</span>
                      <p className="text-sm font-bold text-slate-900">{selectedStudent.address || t.na}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.guardianInfo}</p>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> {t.guardianName}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{selectedStudent.guardian_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {t.guardianPhone}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{selectedStudent.guardian_phone || '-'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500 block mb-1">{t.guardianAddress}</span>
                      <p className="text-sm font-bold text-slate-900">{selectedStudent.guardian_address || t.na}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.notes}</p>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 italic text-amber-900 text-sm leading-relaxed">
                    {selectedStudent.notes || t.na}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {isDeletingAll ? t.deleteAllTitle : t.deleteStudentTitle}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {isDeletingAll 
                    ? t.deleteAllConfirm 
                    : t.deleteStudentConfirm}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none"
                  >
                    {isDeletingAll ? t.deleteAll : t.delete}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      
      <ReloadPrompt />
    </div>
  );
}
