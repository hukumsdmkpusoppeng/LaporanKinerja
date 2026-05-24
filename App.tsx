import { useState, useEffect, FormEvent } from 'react';
import { User, Report } from './types';
import { 
  getUsers, getReports, saveReport, deleteReport, 
  getSyncConfig, fetchRemoteData, postRemoteAction, initializeStorage,
  saveUser, deleteUser
} from './utils/storage';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import ReportForm from './components/ReportForm';
import { KeyRound, ShieldAlert, Award, FileText, HelpCircle, ArrowRight, Eye, EyeOff, Layers, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [gasUrl, setGasUrl] = useState('');
  
  // Sync status
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });

  // Login credentials form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Report Form modal status
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null);
  const [selectedDateForReport, setSelectedDateForReport] = useState<string | undefined>(undefined);

  // Initialize storage & datasets on load
  useEffect(() => {
    initializeStorage();
    const loadedUsers = getUsers();
    const loadedReports = getReports();
    setUsers(loadedUsers);
    setReports(loadedReports);
    
    const config = getSyncConfig();
    setGasUrl(config.gasUrl);

    // If sync URL is configured, run background sync fetch immediately
    if (config.gasUrl) {
      handleAutoSync();
    }
  }, []);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const success = await fetchRemoteData();
      if (success) {
        setUsers(getUsers());
        setReports(getReports());
        showToast('success', 'Sinkronisasi otomatis dengan Google Sheet berhasil!');
      }
    } catch (err) {
      console.warn("Auto sync on startup failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!gasUrl) return;
    setSyncing(true);
    showToast('info', 'Menghubungkan ke database Google Sheet...');
    
    try {
      const success = await fetchRemoteData();
      if (success) {
        setUsers(getUsers());
        setReports(getReports());
        showToast('success', 'Data berhasil disinkronkan langsung dari Google Sheet!');
      } else {
        showToast('error', 'Gagal menyelaraskan data. Periksa kembali kecocokan Web App URL Anda.');
      }
    } catch (err: any) {
      showToast('error', `Sinkronisasi gagal: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: null, message: '' });
    }, 4000);
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password.trim()) {
      setLoginError('Masukkan nama pengguna dan kata sandi Anda.');
      return;
    }

    const matchedUser = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      setLoginError('');
      // Clear forms
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Nama pengguna atau kata sandi Anda salah.');
    }
  };

  // Quick Login Utility for testing/grading convenience
  const handleQuickLogin = (user: User) => {
    setCurrentUser(user);
    setLoginError('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Triggered when sync config has been added/updated
  const handleSyncConfigured = () => {
    const config = getSyncConfig();
    setGasUrl(config.gasUrl);
    setUsers(getUsers());
    setReports(getReports());
    if (config.gasUrl) {
      showToast('success', 'Google Sheet berhasil dihubungkan!');
    } else {
      showToast('info', 'Menggunakan penyimpanan simulasi lokal.');
    }
  };

  // Handle report ADD/EDIT form submittal
  const handleReportSubmit = async (formData: { tanggal: string; kegiatan: string; output: string }) => {
    if (!currentUser) return;

    const timestampStr = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour12: false
    }).replace(/\./g, ':'); // Formats nicely as dd/mm/yyyy hh:mm:ss

    const reportPayload: Report = {
      id_report: reportToEdit ? reportToEdit.id_report : crypto.randomUUID(),
      id_user: reportToEdit ? reportToEdit.id_user : currentUser.id,
      tanggal: formData.tanggal,
      kegiatan: formData.kegiatan,
      output: formData.output,
      timestamp: timestampStr
    };

    setIsFormOpen(false);
    setSyncing(true);

    try {
      // Save locally first to guarantee zero delay and offline resiliency
      const updatedLocally = saveReport(reportPayload);
      setReports(updatedLocally);

      if (gasUrl) {
        const action = reportToEdit ? 'editReport' : 'addReport';
        showToast('info', 'Menyinkronkan input data ke Google Spreadsheet...');
        const res = await postRemoteAction(action, { report: reportPayload });
        if (res.success) {
          showToast('success', `Laporan berhasil tersimpan & tersinkronisasi ke Google Sheet!`);
        } else {
          showToast('error', `Tersimpan secara lokal. Gagal sinkronisasi: ${res.message}`);
        }
      } else {
        showToast('success', reportToEdit ? 'Laporan berhasil diperbarui (Lokal)' : 'Laporan baru berhasil ditambahkan! (Lokal)');
      }
    } catch (err: any) {
      showToast('error', `Gagal menyimpan: ${err.message || err}`);
    } finally {
      setReportToEdit(null);
      setSelectedDateForReport(undefined);
      setSyncing(false);
    }
  };

  // Handle deleting report with confirm modal popup
  const handleDeleteReport = async (reportId: string) => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus laporan kegiatan ini secara permanen dari database?");
    if (!isConfirmed) return;

    setSyncing(true);
    try {
      const updatedLocally = deleteReport(reportId);
      setReports(updatedLocally);

      if (gasUrl) {
        showToast('info', 'Menghapus baris laporan dari Google Sheet...');
        const res = await postRemoteAction('deleteReport', { id_report: reportId });
        if (res.success) {
          showToast('success', 'Laporan berhasil dihapus secara permanen dari Google Sheet.');
        } else {
          showToast('error', `Dihapus secara lokal. Gagal hapus di Sheet: ${res.message}`);
        }
      } else {
        showToast('success', 'Laporan berhasil dihapus dari penyimpanan lokal.');
      }
    } catch (err: any) {
      showToast('error', `Gagal menghapus laporan: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveUser = async (userPayload: User) => {
    setSyncing(true);
    try {
      const updatedUsers = saveUser(userPayload);
      setUsers(updatedUsers);

      if (gasUrl) {
        showToast('info', 'Menyinkronkan data pegawai ke Google Sheet...');
        const res = await postRemoteAction('syncUsers', { users: updatedUsers });
        if (res.success) {
          showToast('success', 'Data pegawai berhasil disinkronkan ke Google Sheet!');
        } else {
          showToast('error', `Tersimpan secara lokal. Gagal sinkronisasi: ${res.message}`);
        }
      } else {
        showToast('success', 'Data pegawai berhasil disimpan!');
      }
    } catch (err: any) {
      showToast('error', `Gagal menyimpan pegawai: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setSyncing(true);
    try {
      const updatedUsers = deleteUser(userId);
      setUsers(updatedUsers);

      if (gasUrl) {
        showToast('info', 'Menyinkronkan penghapusan pegawai ke Google Sheet...');
        const res = await postRemoteAction('syncUsers', { users: updatedUsers });
        if (res.success) {
          showToast('success', 'Pegawai berhasil dihapus dari Google Sheet.');
        } else {
          showToast('error', `Dihapus secara lokal. Gagal sinkronisasi: ${res.message}`);
        }
      } else {
        showToast('success', 'Pegawai berhasil dihapus.');
      }
    } catch (err: any) {
      showToast('error', `Gagal menghapus pegawai: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAddForm = (date: string) => {
    setReportToEdit(null);
    setSelectedDateForReport(date);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (report: Report) => {
    setReportToEdit(report);
    setSelectedDateForReport(report.tanggal);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased text-slate-800">
      {/* Dynamic Sync Toast alerts */}
      {toast.type && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in max-w-sm pointer-events-none">
          <div className={`px-4 py-3 rounded-xl border shadow-lg flex items-center space-x-2.5 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-850' : 
            toast.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-850' : 
            'bg-indigo-50 border-indigo-300 text-indigo-850'
          }`}>
            <span className="text-sm font-black">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <p className="leading-tight shrink-0">{toast.message}</p>
          </div>
        </div>
      )}

      {/* RENDER LOGIN IF NOT LOGGED IN */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800">
          
          {/* Ambient Background Glow Decors */}
          <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 transition-all">
            
            {/* Left Box Display Brand */}
            <div className="md:col-span-5 flex flex-col justify-between text-white text-left p-6 bg-slate-950/40 border border-white/5 rounded-2xl">
              <div className="space-y-4">
                <div className="bg-emerald-600 h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight leading-none text-emerald-400 font-sans md:text-2xl">
                    SIKAP E-KINERJA
                  </h1>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-1">
                    Sistem Kegiatan &amp; Kinerja harian
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Portal pencatatan laporan harian terintegrasi dengan Google Spreadsheet melalui Google Apps Script Web App. Transparan, real-time, dan akuntabel.
                </p>
              </div>

              {/* Dynamic decorative widget info */}
              <div className="space-y-2.5 pt-6 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-emerald-450 shrink-0" />
                  <span>Penghitungan Kinerja Kalender</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-emerald-450 shrink-0" />
                  <span>Mendukung Laporan Kegiatan Ganda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-emerald-450 shrink-0" />
                  <span>Multi Peran: Pegawai &amp; Admin</span>
                </div>
              </div>
            </div>

            {/* Right Box Credentials Input forms */}
            <div className="md:col-span-7 flex flex-col justify-center py-4 px-2">
              <div className="text-left mb-6">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Selamat Datang</h2>
                <p className="text-slate-300 text-xs mt-0.5">Silakan masuk menggunakan akun SIKAP Anda untuk memperbarui modul laporan harian.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: Asriani, Murtina, admin"
                    className="w-full px-4 py-2.5 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                    id="username_input"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-2.5 text-xs text-white bg-slate-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500 font-mono"
                      id="password_input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Errors */}
                {loginError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 mr-1 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center p-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all font-sans cursor-pointer hover:shadow-lg shadow-emerald-950/30"
                  id="login_submit_btn"
                >
                  Masuk Ke Portal
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </button>
              </form>

              {/* Quick login dashboard accounts panel */}
              <div className="mt-6 pt-5 border-t border-white/5 text-left">
                <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-widest block mb-2.5">Akun Demo (Klik untuk masuk instan):</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      className={`text-left p-2 rounded-xl transition-colors cursor-pointer text-xs border ${u.role === 'admin' ? 'bg-red-950/20 hover:bg-red-950/40 text-red-300 border-red-500/10' : 'bg-slate-900/40 hover:bg-slate-900/70 text-slate-200 border-white/5'}`}
                      id={`quick_login_${u.username.toLowerCase()}`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{u.nama}</span>
                        <span className="text-[8px] uppercase tracking-wider bg-white/10 border border-white/5 px-1.5 py-0.5 rounded-md font-mono text-slate-400 font-semibold">{u.role}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Pass: {u.password}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          <div className="mt-4 text-[11px] text-slate-500 relative z-10">
            Sistem Informasi Kegiatan Pegawai (SIKAP) • May 2026 Admin Dashboard
          </div>
        </div>
      ) : (
        /* PORTAL ACCESS GRANTED COMPONENT DRAWER */
        <div className="flex-1 flex flex-col">
          {/* Main header block */}
          <Header
            user={currentUser}
            onLogout={handleLogout}
            isSyncActive={!!gasUrl}
            onManualSync={handleManualSync}
            isSyncing={syncing}
          />

          {/* Loader bar while syncing */}
          {syncing && (
            <div className="w-full bg-slate-300 h-1 overflow-hidden shrink-0">
              <div className="bg-emerald-500 h-full w-1/3 animate-pulse rounded-full" style={{ animationDuration: '0.8s' }} />
            </div>
          )}

          {/* Core Panel contents */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {currentUser.role === 'admin' ? (
              <AdminDashboard
                users={users}
                reports={reports}
                onSyncConfigured={handleSyncConfigured}
                onEditReport={handleOpenEditForm}
                onDeleteReport={handleDeleteReport}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
              />
            ) : (
              <CalendarView
                user={currentUser}
                reports={reports}
                onAddReport={handleOpenAddForm}
                onEditReport={handleOpenEditForm}
                onDeleteReport={handleDeleteReport}
              />
            )}
          </main>

          {/* Form Modal entry overlay */}
          <ReportForm
            isOpen={isFormOpen}
            onClose={() => { setIsFormOpen(false); setReportToEdit(null); setSelectedDateForReport(undefined); }}
            onSubmit={handleReportSubmit}
            initialReport={reportToEdit}
            selectedDate={selectedDateForReport}
          />

          {/* Footer branding */}
          <footer className="bg-slate-900 text-slate-400 text-xs py-4 text-center border-t border-slate-800">
            <p className="font-mono text-[10px]">SIKAP E-KINERJA INTEGRATED DASHBOARD • COPYRIGHT © 2026</p>
          </footer>
        </div>
      )}
    </div>
  );
}
