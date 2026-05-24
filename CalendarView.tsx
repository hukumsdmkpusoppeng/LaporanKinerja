import { useState, useMemo } from 'react';
import { Report, User } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Award, Briefcase, FileText } from 'lucide-react';

interface CalendarViewProps {
  user: User;
  reports: Report[];
  onAddReport: (date: string) => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CalendarView({ user, reports, onAddReport, onEditReport, onDeleteReport }: CalendarViewProps) {
  // Let's anchor on May 2026 as shown in the screenshot data, but allow changing month
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026 (month is 0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-03"); // Match first date in screenshot

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get start day of month and total days
  const startDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Filter reports of THIS specific user
  const userReports = useMemo(() => {
    return reports.filter(r => r.id_user === user.id);
  }, [reports, user.id]);

  // Group user reports by date string (YYYY-MM-DD)
  const reportsByDate = useMemo(() => {
    const map: { [key: string]: Report[] } = {};
    userReports.forEach(r => {
      if (!map[r.tanggal]) {
        map[r.tanggal] = [];
      }
      map[r.tanggal].push(r);
    });
    return map;
  }, [userReports]);

  // Calculate workdays (Monday to Friday) in this month
  const monthWorkdays = useMemo(() => {
    const list: string[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) and Saturday (6)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        list.push(dateStr);
      }
    }
    return list;
  }, [year, month, totalDays]);

  // Performance calculation: Percentage of workdays that has at least 1 report
  const performancePercentage = useMemo(() => {
    if (monthWorkdays.length === 0) return 0;
    let filledWorkdays = 0;
    monthWorkdays.forEach(dateStr => {
      if (reportsByDate[dateStr] && reportsByDate[dateStr].length > 0) {
        filledWorkdays++;
      }
    });
    return Math.round((filledWorkdays / monthWorkdays.length) * 100);
  }, [monthWorkdays, reportsByDate]);

  // Total reports this month
  const totalReportsThisMonth = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (reportsByDate[dateStr]) {
        count += reportsByDate[dateStr].length;
      }
    }
    return count;
  }, [year, month, totalDays, reportsByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar cells (padding empty days + actual month days)
  const calendarCells = useMemo(() => {
    const cells = [];
    // Padding for previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dayNumber: null, dateStr: '', isWorkday: false });
    }
    // Actual days of the month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6;
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNumber: day,
        dateStr: formattedDate,
        isWorkday
      });
    }
    return cells;
  }, [year, month, startDayOfWeek, totalDays]);

  // Selected date reports
  const selectedDateReports = reportsByDate[selectedDate] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto text-left">
      {/* LEFT: Calendar and Stats Profile */}
      <div className="lg:col-span-7 space-y-6">
        {/* Profile Summary Card */}
        <div className="bg-emerald-500 text-white rounded-xl p-5 border border-emerald-600/35 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-[10px] text-emerald-100 font-sans tracking-widest uppercase font-bold">Profil Pegawai SIKAP</span>
            <h3 className="text-lg md:text-xl font-bold font-display text-white">{user.nama}</h3>
            <p className="text-xs text-emerald-50 font-medium">{user.jabatan} — {user.subbagian}</p>
          </div>
          
          {/* Performance Circle Badge */}
          <div className="flex items-center space-x-3 bg-white/10 border border-white/20 px-4 py-3 rounded-xl shrink-0">
            <Award className="h-8 w-8 text-amber-200 shrink-0" />
            <div className="text-left">
              <div className="text-xl font-black font-mono tracking-tight text-white">{performancePercentage}%</div>
              <div className="text-[10px] text-emerald-100 tracking-tight font-medium">Persentase Kinerja</div>
            </div>
          </div>
        </div>

        {/* Main Grid Calendar Wrapper */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Calendar Header Control */}
          <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-slate-850 text-base">
                {INDONESIAN_MONTHS[month]} {year}
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-250 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-250 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {INDONESIAN_DAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[10px] uppercase tracking-wider font-extrabold py-1.5 ${
                    idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {calendarCells.map((cell, idx) => {
                if (cell.dayNumber === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-lg border border-transparent" />;
                }

                const dateReports = reportsByDate[cell.dateStr] || [];
                const hasReports = dateReports.length > 0;
                const isSelected = selectedDate === cell.dateStr;
                const dayOfWeek = new Date(year, month, cell.dayNumber).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Color variables
                let cellBg = 'bg-white border-slate-200 hover:bg-slate-50';
                let textStyle = 'text-slate-800 font-medium';
                
                if (isWeekend) {
                  cellBg = 'bg-rose-50/40 border-slate-150 hover:bg-rose-50/70';
                  textStyle = 'text-rose-600 font-medium';
                }

                if (hasReports) {
                  cellBg = 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70';
                  textStyle = 'text-emerald-800 font-bold';
                }

                if (isSelected) {
                  cellBg = 'bg-emerald-600 border-emerald-600 scale-102 shadow-sm';
                  textStyle = 'text-white font-black';
                }

                return (
                  <button
                    key={`day-${cell.dayNumber}`}
                    onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                    className={`aspect-square relative rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all select-none cursor-pointer group ${cellBg}`}
                    title={`${cell.dayNumber} ${INDONESIAN_MONTHS[month]}, Terisi ${dateReports.length} laporan`}
                  >
                    {/* Day Number */}
                    <span className={`text-xs md:text-sm ${textStyle}`}>{cell.dayNumber}</span>

                    {/* Report count indicators */}
                    <div className="flex space-x-0.5 justify-center items-center w-full min-h-[8px]">
                      {dateReports.length > 0 && (
                        <div className="flex md:space-x-1">
                          {isSelected ? (
                            <span className="text-[9px] px-1 bg-white/30 rounded-full font-mono text-white text-[9px] leading-tight font-extrabold">
                              {dateReports.length}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1 bg-emerald-700/10 text-emerald-800 rounded-full font-mono text-[9px] leading-tight font-extrabold border border-emerald-300">
                              {dateReports.length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color coding legend */}
          <div className="px-5 py-3 border-t border-slate-150 bg-slate-50 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-medium">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-white border border-slate-250 rounded-sm mr-1.5" />
              <span>Belum diinput</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-emerald-50 border border-emerald-300 rounded-sm mr-1.5" />
              <span>Sudah terisi laporan</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-rose-50 border border-slate-200 rounded-sm mr-1.5" />
              <span>Hari akhir pekan</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-emerald-600 rounded-sm mr-1.5" />
              <span>Tanggal terpilih</span>
            </div>
          </div>
        </div>

        {/* Small stats summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Capaian Laporan</span>
            <span className="text-sm md:text-lg font-black font-mono text-slate-800">{totalReportsThisMonth}</span>
            <span className="text-[9px] text-slate-400 block tracking-tight">Akumulasi Bulan Ini</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Hari Terisi</span>
            <span className="text-sm md:text-lg font-black font-mono text-emerald-700">
              {Object.keys(reportsByDate).filter(d => {
                const parts = d.split('-');
                return parts[0] === String(year) && parts[1] === String(month + 1).padStart(2, '0') && reportsByDate[d].length > 0;
              }).length} Laporan
            </span>
            <span className="text-[9px] text-slate-400 block tracking-tight">Hari Kerja Aktif</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Hari Kerja</span>
            <span className="text-sm md:text-lg font-black font-mono text-slate-800">{monthWorkdays.length} Hari</span>
            <span className="text-[9px] text-slate-400 block tracking-tight">Senin s/d Jumat</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Selected date report display & management details */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {/* Section title */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Laporan Kerja {selectedDate.split('-').reverse().join('/')}
              </h4>
            </div>
            <span className="text-[9px] font-mono bg-emerald-800/80 px-2 py-0.5 rounded-full text-emerald-300 font-extrabold border border-emerald-600/30">
              {selectedDateReports.length} AKTIVITAS
            </span>
          </div>

          {/* Activities list list wrapper */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {selectedDateReports.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3">
                  <FileText className="h-8 w-8" />
                </div>
                <h5 className="font-semibold text-slate-700 text-xs md:text-sm">Belum Ada Pelaporan</h5>
                <p className="text-[11px] text-slate-500 px-4 mt-1 leading-relaxed max-w-xs">
                  Anda belum mengisi aktivitas pekerjaan apapun untuk tanggal {selectedDate.split('-').reverse().join('/')}.
                </p>
                <button
                  onClick={() => onAddReport(selectedDate)}
                  className="mt-4 flex items-center px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Isi Laporan Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateReports.map((report, idx) => (
                  <div 
                    key={report.id_report}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white shadow-2xs"
                  >
                    {/* Activity subhead */}
                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-150">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        AKTIVITAS #{idx + 1}
                      </span>
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => onEditReport(report)}
                          className="p-1 text-slate-450 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Ubah laporan kegiatan"
                          id={`edit_report_btn_${report.id_report.substring(0, 8)}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(report.id_report)}
                          className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus laporan"
                          id={`delete_report_btn_${report.id_report.substring(0, 8)}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3.5 text-xs">
                      {/* Deskripsi Kegiatan */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                          Uraian Laporan Kegiatan
                        </span>
                        <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-wrap pl-2.5 border-l-2 border-emerald-500">
                          {report.kegiatan}
                        </p>
                      </div>

                      {/* Output */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                          Capaian Output / Hasil
                        </span>
                        <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap pl-2.5 border-l-2 border-amber-400">
                          {report.output}
                        </p>
                      </div>

                      {/* Log Timestamp */}
                      <div className="text-[9px] font-mono text-slate-450 flex items-center pt-2 border-t border-slate-100">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 mr-1 shrink-0" />
                        <span>Tersimpan tanggal: {report.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Add button when list exists */}
                <button
                  onClick={() => onAddReport(selectedDate)}
                  className="w-full flex items-center justify-center py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 border-dashed rounded-xl text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                  id="add_additional_report_btn"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Tambah Laporan Tambahan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
