import { useState, useMemo, FormEvent } from 'react';
import { User, Report } from '../types';
import SetupInstructions from './SetupInstructions';
import CalendarView from './CalendarView';
import { getSyncConfig } from '../utils/storage';
import { 
  Users, FileSpreadsheet, Server, Award, Search, 
  Trash2, Edit, SlidersHorizontal, ArrowUpDown, ChevronDown, 
  Download, Filter, ArrowLeft, ArrowUpRight, Calendar, Bookmark, Eye,
  Plus, X, Key, Shield, UserPlus
} from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  reports: Report[];
  onSyncConfigured: () => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminDashboard({ 
  users, 
  reports, 
  onSyncConfigured, 
  onEditReport, 
  onDeleteReport,
  onSaveUser,
  onDeleteUser
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'kpi' | 'reports' | 'users' | 'sync'>('kpi');
  const [searchQuery, setSearchQuery] = useState('');
  const [subbagianFilter, setSubbagianFilter] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // For inspecting specific selected employee calendar
  const [selectedUserForCalendar, setSelectedUserForCalendar] = useState<User | null>(null);

  // User Management state definitions
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userNama, setUserNama] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userJabatan, setUserJabatan] = useState('Staf');
  const [userSubbagian, setUserSubbagian] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'pegawai'>('pegawai');
  const [userFormError, setUserFormError] = useState('');

  const JABATAN_OPTIONS = [
    'Staf',
    'Subkoordinator',
    'Kepala Bagian',
    'Komisioner',
    'Tenaga Pendukung'
  ];

  const SUBBAGIAN_OPTIONS = [
    'Keuangan, Umum dan Logistik',
    'Teknis Penyelenggaraan, Partisipasi dan Hubungan Masyarakat',
    'Perencanaan, Data dan Informasi',
    'Hukum dan Pengawasan'
  ];

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserNama('');
    setUserUsername('');
    setUserPassword('');
    setUserJabatan('Staf');
    setUserSubbagian(SUBBAGIAN_OPTIONS[0]);
    setUserRole('pegawai');
    setUserFormError('');
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserNama(u.nama);
    setUserUsername(u.username);
    setUserPassword(u.password || '');
    setUserJabatan(u.jabatan);
    setUserSubbagian(u.subbagian);
    setUserRole(u.role);
    setUserFormError('');
    setIsUserFormOpen(true);
  };

  const handleUserFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!userNama.trim() || !userUsername.trim() || !userPassword.trim() || !userSubbagian.trim()) {
      setUserFormError('Tolong lengkapi semua kolom input formulir.');
      return;
    }

    // Check duplicate username (except if same user is edited)
    const isDuplicate = users.some(u => 
      u.username.toLowerCase() === userUsername.trim().toLowerCase() && 
      (!editingUser || u.id !== editingUser.id)
    );
    if (isDuplicate) {
      setUserFormError(`Username "${userUsername}" sudah digunakan oleh pegawai lain!`);
      return;
    }

    const payload: User = {
      id: editingUser ? editingUser.id : crypto.randomUUID(),
      nama: userNama.trim(),
      username: userUsername.trim().toLowerCase(),
      password: userPassword.trim(),
      jabatan: userJabatan.trim(),
      subbagian: userSubbagian.trim(),
      role: userRole
    };

    onSaveUser(payload);
    setIsUserFormOpen(false);
    setEditingUser(null);
  };

  // Filter out Administrator and keep only 'pegawai'
  const employees = useMemo(() => {
    return users.filter(u => u.role === 'pegawai');
  }, [users]);

  // Extract distinct subbagian list
  const subbagianList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(emp => {
      if (emp.subbagian) set.add(emp.subbagian);
    });
    return ['Semua', ...Array.from(set)];
  }, [employees]);

  // Map employee name and details for reports table mapping
  const usersMap = useMemo(() => {
    const map: { [key: string]: User } = {};
    users.forEach(u => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // Calculate workdays in standard May 2026 (or selected month) for employee KPI computation
  // Let's use May 2026 as standard anchor
  const standardMay2026Workdays = useMemo(() => {
    const list: string[] = [];
    const year = 2026;
    const month = 4; // May
    const totalDays = 31;
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const dateStr = `2026-05-${String(day).padStart(2, '0')}`;
        list.push(dateStr);
      }
    }
    return list;
  }, []);

  // Compute individual performance of all employees
  const employeePerformance = useMemo(() => {
    return employees.map(emp => {
      const empReports = reports.filter(r => r.id_user === emp.id);
      
      // Group by date
      const datesWithReports = new Set<string>();
      empReports.forEach(r => {
        // filter reports in May 2026
        if (r.tanggal.startsWith('2026-05')) {
          datesWithReports.add(r.tanggal);
        }
      });

      // Count filled workdays in may 2026
      let filledWorkdaysCount = 0;
      standardMay2026Workdays.forEach(d => {
        if (datesWithReports.has(d)) {
          filledWorkdaysCount++;
        }
      });

      const percentage = standardMay2026Workdays.length > 0 
        ? Math.round((filledWorkdaysCount / standardMay2026Workdays.length) * 100)
        : 0;

      return {
        ...emp,
        reportCount: empReports.length,
        filledDaysCount: datesWithReports.size,
        performancePercentage: percentage
      };
    });
  }, [employees, reports, standardMay2026Workdays]);

  // Calculate average performance of all employees
  const averagePerformance = useMemo(() => {
    if (employeePerformance.length === 0) return 0;
    const sum = employeePerformance.reduce((acc, curr) => acc + curr.performancePercentage, 0);
    return Math.round(sum / employeePerformance.length);
  }, [employeePerformance]);

  // Filtered reports query
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const reportUser = usersMap[r.id_user];
      if (!reportUser) return false;

      // Filter subbagian
      if (subbagianFilter !== 'Semua' && reportUser.subbagian !== subbagianFilter) {
        return false;
      }

      // Filter date range
      if (startDate && r.tanggal < startDate) return false;
      if (endDate && r.tanggal > endDate) return false;

      // Filter search query (User name, Subbagian, Jabatan, Kegiatan description, Output description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchUser = reportUser.nama.toLowerCase().includes(query);
        const matchSubbagian = reportUser.subbagian.toLowerCase().includes(query);
        const matchKegiatan = r.kegiatan.toLowerCase().includes(query);
        const matchOutput = r.output.toLowerCase().includes(query);
        return matchUser || matchSubbagian || matchKegiatan || matchOutput;
      }

      return true;
    }).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [reports, usersMap, searchQuery, subbagianFilter, startDate, endDate]);

  // CSV Exporter for reports
  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ['ID_Report', 'Nama Pegawai', 'Jabatan', 'Subbagian', 'Tanggal', 'Uraian Kegiatan', 'Capaian Output', 'Timestamp'];
    const rows = filteredReports.map(r => {
      const u = usersMap[r.id_user];
      return [
        r.id_report,
        u ? u.nama : 'N/A',
        u ? u.jabatan : 'N/A',
        u ? u.subbagian : 'N/A',
        r.tanggal,
        r.kegiatan.replace(/"/g, '""').replace(/\n/g, ' '),
        r.output.replace(/"/g, '""').replace(/\n/g, ' '),
        r.timestamp
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Kinerja_Pegawai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-205 pb-4 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-black tracking-tight text-slate-900 flex items-center">
            <Award className="h-6.5 w-6.5 text-emerald-600 mr-2" />
            Portal Administrator SIKAP
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            E-Kinerja Dashboard pemantauan aktivitas pelaporan kerja tim & pengelolaan database spreadsheet harian.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs gap-1">
          <button
            onClick={() => { setActiveTab('kpi'); setSelectedUserForCalendar(null); }}
            className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'kpi' && !selectedUserForCalendar ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Sintesis Kinerja
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setSelectedUserForCalendar(null); }}
            className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Semua Laporan
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSelectedUserForCalendar(null); }}
            className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            id="kelola_pegawai_tab_btn"
          >
            Kelola Pegawai
          </button>
          <button
            onClick={() => { setActiveTab('sync'); setSelectedUserForCalendar(null); }}
            className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'sync' ? 'bg-white text-emerald-800 shadow-xs flex items-center' : 'text-slate-600 hover:text-slate-900 flex items-center'}`}
            id="sync_setup_tab_ref"
          >
            <Server className="h-3.5 w-3.5 mr-1" />
            Live Sync Settings
          </button>
        </div>
      </div>

      {/* RENDER DYNAMIC ACTIVE WORKSPACE VIEW */}

      {/* IF INSPECTING USER CALENDAR */}
      {selectedUserForCalendar ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedUserForCalendar(null)}
            className="flex items-center text-xs font-bold text-slate-700 bg-slate-150 hover:bg-slate-200 rounded-lg px-3 py-2 border border-slate-250 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali ke Sintesis Kinerja
          </button>
          
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-xs font-medium">
            Anda sedang memantau profil kalender individu milik: <span className="font-bold underline">{selectedUserForCalendar.nama}</span>. Anda dapat langsung mengedit atau menghapus laporan pegawai di bawah ini jika diperlukan perbaikan.
          </div>

          <CalendarView
            user={selectedUserForCalendar}
            reports={reports}
            onAddReport={() => {}} // Disabled for admin on user logs
            onEditReport={onEditReport}
            onDeleteReport={onDeleteReport}
          />
        </div>
      ) : activeTab === 'kpi' ? (
        <div className="space-y-6">
          {/* Top Level Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex justify-between items-start text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider block">Total Pegawai</span>
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-900">{employees.length}</p>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">Staf Terdaftar aktif di unit kerja</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex justify-between items-start text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider block">Total Laporan</span>
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-900">{reports.length}</p>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">Akumulasi seluruh laporan tersimpan</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex justify-between items-start text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider block">Rata-Rata Kinerja</span>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-900">{averagePerformance}%</p>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">Rasio pengisian hari kerja bulan Mei 2026</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex justify-between items-start text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider block">Status Database</span>
                <Server className="h-5 w-5 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-700 leading-tight">Connected</p>
              <div className="text-[10px] text-emerald-700 font-bold mt-1 max-w-full truncate" title={getSyncConfig().gasUrl || 'Local Mode'}>
                {getSyncConfig().gasUrl ? 'Google Sheet Live' : 'Penyimpanan Lokal (Simulasi)'}
              </div>
            </div>
          </div>

          {/* Sintesis Kinerja Pegawai List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Presentase Kinerja Pegawai</h3>
                <p className="text-[10px] text-slate-400">Analisis keterisian laporan harian pada bulan berjalan (Mei 2026)</p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">STANDAR CAPAIAN: {standardMay2026Workdays.length} HARI KERJA</div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {employeePerformance.map(emp => {
                  let performanceLabel = 'Sangat Baik';
                  let performanceColor = 'bg-emerald-500';
                  let textBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                  if (emp.performancePercentage < 75) {
                    performanceLabel = 'Baik';
                    performanceColor = 'bg-indigo-500';
                    textBadgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                  }
                  if (emp.performancePercentage < 50) {
                    performanceLabel = 'Cukup';
                    performanceColor = 'bg-amber-500';
                    textBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                  }
                  if (emp.performancePercentage < 25) {
                    performanceLabel = 'Perlu Evaluasi';
                    performanceColor = 'bg-rose-500';
                    textBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                  }

                  return (
                    <div 
                      key={emp.id}
                      className="border border-slate-200 rounded-xl p-4 space-y-3.5 hover:border-slate-350 hover:shadow-2xs transition-all bg-white"
                    >
                      {/* Pegawai info row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 text-xs font-bold rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            {emp.nama.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm">{emp.nama}</h4>
                            <p className="text-[10px] text-slate-500 leading-tight block">{emp.jabatan} — {emp.subbagian}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedUserForCalendar(emp)}
                          className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                          id={`view_calendar_btn_${emp.username}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Buka Kalender
                        </button>
                      </div>

                      {/* Performance percentage gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Capaian Hari Kerja Terisi</span>
                          <span className="font-bold text-slate-800">{emp.filledDaysCount} dr {standardMay2026Workdays.length} hari</span>
                        </div>
                        {/* Progress Bar background */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${performanceColor}`} 
                            style={{ width: `${emp.performancePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Micro Statistics */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <div className="flex items-center space-x-1">
                          <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-500">Total Akumulasi Kegiatan:</span>
                          <span className="font-bold text-slate-800">{emp.reportCount}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${textBadgeStyle}`}>
                          {emp.performancePercentage}% • {performanceLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'reports' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {/* Controls Panel */}
          <div className="bg-slate-50 p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search activities */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400 h-4.5 w-4.5" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama pegawai, subbagian, deskripsi kegiatan atau capaian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Subbagian Filter */}
              <div className="w-full md:w-64 relative">
                <span className="text-[9px] font-bold text-slate-700 bg-slate-50 absolute -top-1.5 left-2.5 px-1 uppercase tracking-wider scale-90">Bagian / Sub-Bagian</span>
                <select
                  value={subbagianFilter}
                  onChange={(e) => setSubbagianFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none"
                >
                  {subbagianList.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-3 text-slate-405 pointer-events-none">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Date constraint & export */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-500 flex items-center">
                  <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Rentang Tanggal:
                </span>
                
                {/* Min Date */}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-slate-450">-</span>
                {/* Max Date */}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                />

                {(queryResetRequired(startDate, endDate, searchQuery, subbagianFilter)) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSubbagianFilter('Semua');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] font-bold text-red-650 hover:underline ml-2 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                disabled={filteredReports.length === 0}
                className="w-full md:w-auto flex items-center justify-center text-xs font-bold text-emerald-850 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 hover:border-emerald-350 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 shadow-3xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Ekspor Hasil Filter (.CSV)
              </button>
            </div>
          </div>

          {/* Reports Table rendering */}
          <div className="overflow-x-auto text-left">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Pegawai</th>
                  <th scope="col" className="px-5 py-3">Divisi / Subbagian</th>
                  <th scope="col" className="px-5 py-3 w-28">Tanggal</th>
                  <th scope="col" className="px-5 py-3">Uraian Dokumen Laporan Kegiatan</th>
                  <th scope="col" className="px-5 py-3">Capaian Target / Output</th>
                  <th scope="col" className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-xs text-slate-600">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Tidak ada laporan kegiatan yang sesuai dengan kriteria penyaringan Anda.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => {
                    const emp = usersMap[report.id_user];
                    return (
                      <tr key={report.id_report} className="hover:bg-slate-50">
                        {/* Employee Name */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-7 w-7 text-[10px] font-bold rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                              {emp ? emp.nama.substring(0,2).toUpperCase() : 'N/A'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{emp ? emp.nama : 'Unknown'}</div>
                              <div className="text-[10px] text-slate-500">{emp ? emp.jabatan : 'Staf'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Subbagian */}
                        <td className="px-5 py-4 max-w-[200px] truncate" title={emp ? emp.subbagian : ''}>
                          {emp ? emp.subbagian : 'N/A'}
                        </td>

                        {/* Tanggal */}
                        <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700">
                          {report.tanggal.split('-').reverse().join('/')}
                        </td>

                        {/* Kegiatan text */}
                        <td className="px-5 py-4 max-w-sm">
                          <p className="line-clamp-3 whitespace-pre-wrap leading-relaxed text-slate-800 font-normal">
                            {report.kegiatan}
                          </p>
                        </td>

                        {/* Output text */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="line-clamp-3 whitespace-pre-wrap leading-relaxed">
                            {report.output}
                          </p>
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => onEditReport(report)}
                              className="p-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer font-semibold flex items-center"
                              title="Ubah data laporan"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteReport(report.id_report)}
                              className="p-1 px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer font-semibold flex items-center"
                              title="Hapus data laporan"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
            TERPAPAR {filteredReports.length} DARI TOTAL {reports.length} LAPORAN YANG DIARSIPKAN
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6 animate-slide-in">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center">
                <Users className="h-5 w-5 mr-2 text-emerald-500" />
                Daftar Pegawai SIKAP
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Tambahkan staf baru, perbarui jabatan/subbagian, atau setel ulang kata sandi login karyawan.
              </p>
            </div>
            
            {!isUserFormOpen && (
              <button
                onClick={handleOpenAddUser}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-500 text-white font-bold hover:bg-emerald-600 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Tambah Pegawai Baru
              </button>
            )}
          </div>

          {/* Form Modal / Inline Card */}
          {isUserFormOpen && (
            <div className="bg-white border-2 border-emerald-350 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center font-display">
                  {editingUser ? <Edit className="h-4.5 w-4.5 mr-2 text-emerald-600" /> : <UserPlus className="h-4.5 w-4.5 mr-2 text-emerald-600" />}
                  {editingUser ? `Perbarui Profil: ${editingUser.nama}` : 'Registrasi Pegawai Baru'}
                </h4>
                <button 
                  onClick={() => { setIsUserFormOpen(false); setEditingUser(null); }}
                  className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleUserFormSubmit} className="p-5 space-y-4">
                {userFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-850 rounded-lg text-xs font-semibold">
                    ⚠️ {userFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap beserta gelar..."
                      value={userNama}
                      onChange={(e) => setUserNama(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Pengguna (Username)</label>
                    <input
                      type="text"
                      placeholder="username_pegawai"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value.replace(/\s+/g, ''))}
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      disabled={!!editingUser}
                      required
                    />
                    {editingUser && <p className="text-[10px] text-slate-400">Username tidak dapat diubah setelah didaftarkan.</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi (Password)</label>
                    <input
                      type="text"
                      placeholder="Masukkan kata sandi login..."
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      required
                    />
                  </div>

                  {/* Hak Akses / Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hak Akses Sistem</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as 'admin' | 'pegawai')}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none"
                    >
                      <option value="pegawai">Pegawai Biasa (Akses Formulir & Kalender)</option>
                      <option value="admin">Administrator (Akses Portal Pemantauan & Sinkronisasi)</option>
                    </select>
                  </div>

                  {/* Jabatan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jabatan Pegawai</label>
                    <div className="flex gap-2">
                      <select
                        value={JABATAN_OPTIONS.includes(userJabatan) ? userJabatan : 'Ketik Manual'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Ketik Manual') {
                            setUserJabatan('');
                          } else {
                            setUserJabatan(val);
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {JABATAN_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Ketik Manual">-- Ketik Jabatan Custom --</option>
                      </select>
                      {!JABATAN_OPTIONS.includes(userJabatan) && (
                        <input
                          type="text"
                          placeholder="Ketik jabatan..."
                          value={userJabatan}
                          onChange={(e) => setUserJabatan(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 text-xs border border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Subbagian */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Divisi / Subbagian</label>
                    <div className="flex gap-2">
                      <select
                        value={SUBBAGIAN_OPTIONS.includes(userSubbagian) ? userSubbagian : 'Ketik Manual'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Ketik Manual') {
                            setUserSubbagian('');
                          } else {
                            setUserSubbagian(val);
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {SUBBAGIAN_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Ketik Manual">-- Ketik Divisi Custom --</option>
                      </select>
                      {!SUBBAGIAN_OPTIONS.includes(userSubbagian) && (
                        <input
                          type="text"
                          placeholder="Ketik subbagian..."
                          value={userSubbagian}
                          onChange={(e) => setUserSubbagian(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 text-xs border border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Row */}
                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsUserFormOpen(false); setEditingUser(null); }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {editingUser ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left">Nama Pegawai / Staf</th>
                    <th scope="col" className="px-5 py-3 text-left">Username</th>
                    <th scope="col" className="px-5 py-3 text-left">Password Mandiri</th>
                    <th scope="col" className="px-5 py-3 text-left">Jabatan</th>
                    <th scope="col" className="px-5 py-3 text-left">Bagian / Sub-Bagian</th>
                    <th scope="col" className="px-5 py-3 text-left">Role Akses</th>
                    <th scope="col" className="px-5 py-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-xs text-slate-600 font-sans">
                  {users.map(u => {
                    const isSelfAdmin = u.username === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        {/* Nama */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="h-8.5 w-8.5 text-xs font-bold rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                              {u.nama.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs md:text-sm font-display">{u.nama}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-700 bg-slate-50/50">
                          {u.username}
                        </td>

                        {/* Password */}
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-indigo-900 font-bold">
                          {u.password || <span className="text-slate-400 italic font-normal">No password</span>}
                        </td>

                        {/* Jabatan */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                          {u.jabatan}
                        </td>

                        {/* Subbagian */}
                        <td className="px-5 py-3.5 text-slate-500 font-medium text-xs">
                          {u.subbagian}
                        </td>

                        {/* Role Badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${u.role === 'admin' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-250'}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2.5 py-1 text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer font-semibold flex items-center gap-1"
                              title="Ubah info login"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                            {!isSelfAdmin && (
                              <button
                                onClick={() => onDeleteUser(u.id)}
                                className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer font-semibold flex items-center gap-1"
                                title="Hapus Akun Pegawai"
                              >
                                <Trash2 className="h-3 w-3" />
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-5 py-3 text-[10px] text-slate-500 font-mono tracking-wider">
              TOTAL TERDAFTAR: {users.length} PEGAWAI SIKAP (TERMASUK ADMINISTRATOR)
            </div>
          </div>
        </div>
      ) : (
        <SetupInstructions onSyncConfigured={onSyncConfigured} />
      )}
    </div>
  );
}

// Helpers
function queryResetRequired(start: string, end: string, s: string, sub: string): boolean {
  return start !== '' || end !== '' || s !== '' || sub !== 'Semua';
}
