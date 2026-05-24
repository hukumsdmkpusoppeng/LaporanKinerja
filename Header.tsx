import { User } from '../types';
import { LogOut, User as UserIcon, Shield, Database, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  isSyncActive: boolean;
  onManualSync: () => void;
  isSyncing: boolean;
}

export default function Header({ user, onLogout, isSyncActive, onManualSync, isSyncing }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-xs flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight font-display text-slate-900 md:text-base">
              SIKAP E-KINERJA
            </h1>
            <p className="text-[9px] text-slate-400 font-sans tracking-widest uppercase font-semibold">
              Sistem Informasi Kegiatan Pegawai
            </p>
          </div>
        </div>

        {/* Sync Indicator & Profile panel */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Sheet Sync Status */}
          <div className="hidden md:flex items-center">
            {isSyncActive ? (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title="Google Sheet Live Sync Active. Klik untuk sinkronisasi paksa."
                className="flex items-center px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer group"
              >
                <Database className="h-3.5 w-3.5 mr-1.5 text-emerald-550 animate-pulse" />
                <span>Live Google Sheet</span>
                <RefreshCw className={`h-3 w-3 ml-2 transition-transform duration-500 text-emerald-600 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </button>
            ) : (
              <div
                title="Aplikasi berjalan dalam mode penyimpanan lokal"
                className="flex items-center px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold"
              >
                <div className="h-2 w-2 rounded-full bg-slate-400 mr-2" />
                <span>Penyimpanan Lokal</span>
              </div>
            )}
          </div>

          {/* Sync status for mobile - icon only */}
          <div className="md:hidden flex">
            {isSyncActive ? (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className={`p-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 cursor-pointer ${isSyncing ? 'animate-pulse' : ''}`}
                title="Sync database Google Sheet"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            ) : (
              <div className="h-3 w-3 rounded-full bg-slate-300 border border-slate-200" title="Offline Offline/Lokal" />
            )}
          </div>

          {/* Profile card */}
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4 sm:pl-6">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-end space-x-1">
                {user.role === 'admin' ? (
                  <Shield className="h-3 w-3 text-amber-500" />
                ) : (
                  <UserIcon className="h-3 w-3 text-emerald-500" />
                )}
                <span>{user.nama}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight max-w-[150px] truncate" title={user.subbagian}>
                {user.jabatan} — {user.subbagian}
              </div>
            </div>

            {/* User Avatar Initial */}
            <div className={`h-9 w-9 text-xs font-bold rounded-full flex items-center justify-center border-2 text-white shadow-xs ${user.role === 'admin' ? 'bg-amber-500 border-white ring-2 ring-amber-100' : 'bg-emerald-500 border-white ring-2 ring-emerald-100'}`} title={`${user.nama} (${user.jabatan})`}>
              {user.nama.substring(0, 2).toUpperCase()}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Keluar dari Aplikasi"
              id="logout_btn"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
