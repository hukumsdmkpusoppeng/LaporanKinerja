export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  jabatan: string;
  subbagian: string;
  role: 'admin' | 'pegawai';
}

export interface Report {
  id_report: string;
  id_user: string;
  tanggal: string; // "YYYY-MM-DD"
  kegiatan: string;
  output: string;
  timestamp: string;
}

export interface SyncConfig {
  gasUrl: string;
}
