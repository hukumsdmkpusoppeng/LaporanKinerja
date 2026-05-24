import { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasCode';
import { testGasConnection, saveSyncConfig, getSyncConfig, getReports, getUsers } from '../utils/storage';
import { Check, Copy, ExternalLink, RefreshCw, Server, AlertTriangle, FileSpreadsheet, Database } from 'lucide-react';

interface SetupInstructionsProps {
  onSyncConfigured: () => void;
}

export default function SetupInstructions({ onSyncConfigured }: SetupInstructionsProps) {
  const [gasUrl, setGasUrl] = useState(getSyncConfig().gasUrl || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndTest = async () => {
    if (!gasUrl.trim()) {
      setStatus({ type: 'error', message: 'Silakan masukkan URL Web App Google Script Anda.' });
      return;
    }

    setTesting(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await testGasConnection(gasUrl);
      if (res.success) {
        saveSyncConfig({ gasUrl: gasUrl.trim() });
        setStatus({ type: 'success', message: res.message });
        setTimeout(() => {
          onSyncConfigured();
        }, 1500);
      } else {
        setStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal memproses koneksi: ${err.message || err}` });
    } finally {
      setTesting(false);
    }
  };

  const handleDisableSync = () => {
    saveSyncConfig({ gasUrl: '' });
    setGasUrl('');
    setStatus({ type: 'success', message: 'Google Sheets sync dinonaktifkan. Mode penyimpanan lokal aktif.' });
    onSyncConfigured();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Panduan Integrasi Google Sheets</h2>
            <p className="text-xs text-slate-400">Hubungkan database aplikasi ini langsung ke spreadsheet Anda</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <Database className="h-3.5 w-3.5 text-emerald-500" />
          <span>Real-time Integrasi</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Sync Settings Configuration panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center">
            <Database className="h-4.5 w-4.5 mr-2 text-emerald-600" />
            Konfigurasi Sync URL Google Apps Script
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jika Anda sudah melakukan deployment Web App Google Apps Script, masukkan URL output deployment-nya di bawah ini untuk mengaktifkan real-time sync antara aplikasi ini dengan sheet Anda. Jika dikosongkan, aplikasi akan menggunakan simulasi penyimpanan lokal (localStorage) dengan data dasar.
          </p>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb..._xY/exec"
              className="flex-1 px-4 py-2.5 text-xs font-mono border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner"
              id="gas_url_input"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveAndTest}
                disabled={testing}
                className="flex-1 md:flex-initial flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer"
                id="test_and_save_btn"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Menguji...
                  </>
                ) : (
                  'Hubungkan & Simpan'
                )}
              </button>
              {getSyncConfig().gasUrl && (
                <button
                  onClick={handleDisableSync}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg transition-colors cursor-pointer"
                >
                  Putuskan
                </button>
              )}
            </div>
          </div>

          {status.type && (
            <div className={`p-3 rounded-lg flex items-start space-x-2 text-xs ${status.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-850' : 'bg-rose-50 border border-rose-200 text-rose-850'}`}>
              <span className="font-bold shrink-0">{status.type === 'success' ? '✓' : '⚠️'}</span>
              <p className="leading-relaxed whitespace-pre-line">{status.message}</p>
            </div>
          )}
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-base">Langkah-langkah Penyelarasan Spreadsheet</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="border border-slate-150 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="h-7 w-7 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full flex items-center justify-center text-xs font-bold mb-3">1</div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm mb-1">Siapkan Google Sheet</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Buat Google Spreadsheet baru. Anda tidak perlu membuat sheet (tab) manual dalam sheet tersebut karena sistem Apps Script akan membuatnya otomatis saat pertama kali tersambung!
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-150 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="h-7 w-7 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full flex items-center justify-center text-xs font-bold mb-3">2</div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm mb-1">Pasang Google Apps Script</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Di Google Sheet, klik menu <span className="font-medium text-slate-700">Ekstensi</span> &gt; <span className="font-bold text-slate-700">Apps Script</span>. Hapus semua kode default, lalu paste kode script dari kolom di bawah ke editor.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-slate-150 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="h-7 w-7 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full flex items-center justify-center text-xs font-bold mb-3">3</div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm mb-1">Deploy Sebagai Web App</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Klik <span className="font-bold text-emerald-600">Deploy &gt; Penerapan Baru</span>. Pilih jenis <span className="font-medium">Aplikasi Web</span>, set “Jalankan sebagai” ke <span className="font-bold">Saya (akun Google Anda)</span>, dan “Siapa yang memiliki akses” ke <span className="font-bold">Siapa saja</span>. Salin URL Web App-nya.
              </p>
            </div>
          </div>
        </div>

        {/* Warning card */}
        <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-655 shrink-0" />
          <div className="space-y-1">
            <h5 className="font-semibold text-amber-900 text-xs">PENTING - Konfigurasi Akses Deploy</h5>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Pastikan Anda memilih pilihan <span className="font-bold">"Siapa saja" (Anyone)</span> pada setelan akses deployment di editor Script Google. Jika Anda memilih "Hanya Saya" atau "Siapa saja yang memiliki Akun Google", penulisan data dari browser ke spreadsheet akan ditolak (Response error CORS atau 401/403).
            </p>
          </div>
        </div>

        {/* Apps Script Code Editor component */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Google Apps Script Code (Code.gs)
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Salin Kode Script
                </>
              )}
            </button>
          </div>

          <div className="relative border border-slate-300 rounded-xl overflow-hidden shadow-inner text-left">
            <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed max-h-72 overflow-y-auto overflow-x-auto text-left whitespace-pre">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
