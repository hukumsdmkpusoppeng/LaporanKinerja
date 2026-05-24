import { useState, useEffect, FormEvent } from 'react';
import { Report } from '../types';
import { X, Calendar, FileText, CheckCircle, HelpCircle } from 'lucide-react';

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tanggal: string; kegiatan: string; output: string }) => void;
  initialReport?: Report | null;
  selectedDate?: string;
}

export default function ReportForm({ isOpen, onClose, onSubmit, initialReport, selectedDate }: ReportFormProps) {
  const [tanggal, setTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialReport) {
      setTanggal(initialReport.tanggal);
      setKegiatan(initialReport.kegiatan);
      setOutput(initialReport.output);
    } else {
      // Prefill date with selected date or today's date in local YYYY-MM-DD
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      setTanggal(dateStr);
      setKegiatan('');
      setOutput('');
    }
    setErrors({});
  }, [initialReport, selectedDate, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    if (!kegiatan.trim()) newErrors.kegiatan = 'Deskripsi kegiatan wajib diisi';
    if (!output.trim()) newErrors.output = 'Capaian output wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ tanggal, kegiatan, output });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold">
              {initialReport ? 'Edit Laporan Kegiatan' : 'Input Laporan Kegiatan Baru'}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              {initialReport ? `ID_REPORT: ${initialReport.id_report.substring(0, 8)}...` : 'SISTEM PELAPORAN INTEGRATIF'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-left">
          {/* Tanggal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              id="report_date_field"
            />
            {errors.tanggal && (
              <span className="text-[10px] font-semibold text-rose-600">{errors.tanggal}</span>
            )}
          </div>

          {/* Kegiatan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center">
              <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Kegiatan / Deskripsi Kerja
            </label>
            <textarea
              rows={4}
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              placeholder="Contoh: Mengunggah berkas rancangan kerja subbagian, mengumpulkan data tim..."
              className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white leading-relaxed placeholder:text-slate-400"
              id="report_kegiatan_field"
            />
            {errors.kegiatan && (
              <span className="text-[10px] font-semibold text-rose-600">{errors.kegiatan}</span>
            )}
            <p className="text-[9px] text-slate-500 leading-tight">
              Tuliskan detail pekerjaan yang Anda selesaikan pada tanggal tersebut secara jelas.
            </p>
          </div>

          {/* Output */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center">
              <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Hasil / Output Kerja
            </label>
            <textarea
              rows={3}
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Contoh: Dokumen rancangan draf PDF berhasil disetor, lembar verifikasi ditandatangani..."
              className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white leading-relaxed placeholder:text-slate-400"
              id="report_output_field"
            />
            {errors.output && (
              <span className="text-[10px] font-semibold text-rose-600">{errors.output}</span>
            )}
            <p className="text-[9px] text-slate-500 leading-tight">
              Sebutkan target keluaran atau hasil konkret dari pekerjaan tersebut (laporan, SPJ, dll).
            </p>
          </div>

          {/* Guidelines notes */}
          <div className="bg-emerald-50 border border-emerald-150 rounded-lg p-3 text-[10px] text-emerald-800 leading-relaxed">
            <div className="font-bold flex items-center mb-0.5">
              <HelpCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
              Informasi Pengisian Ganda
            </div>
            Sistem SIKAP mendukung penginputan laporan ganda (lebih dari 1 aktivitas) pada tanggal yang sama. Anda cukup menambahkan laporan baru lagi untuk tanggal yang sama tanpa menimpa data yang telah ada.
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              id="submit_report_form_btn"
            >
              {initialReport ? 'Simpan Perubahan' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
