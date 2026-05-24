import { User, Report, SyncConfig } from '../types';

const STORAGE_KEYS = {
  USERS: 'ekin_users',
  REPORTS: 'ekin_reports',
  CONFIG: 'ekin_sync_config'
};

const DEFAULT_USERS: User[] = [
  {
    id: "797703d1-f982-48d2-b613-33c598f026cb",
    username: "admin",
    password: "admin123",
    nama: "Administrator",
    jabatan: "Admin",
    subbagian: "Admin Project SIKAP",
    role: "admin"
  },
  {
    id: "67244712-8cd5-47b0-afb0-15b18a6a1408",
    username: "Murtina",
    password: "tokketokke",
    nama: "Murtina",
    jabatan: "Staf",
    subbagian: "Keuangan, Umum dan Logistik",
    role: "pegawai"
  },
  {
    id: "635d2324-7a10-428b-b178-35d672e89955",
    username: "Asriani",
    password: "Asriani1",
    nama: "Asriani",
    jabatan: "Staf",
    subbagian: "Teknis Penyelenggaraan, Partisipasi dan Hubungan Masyarakat",
    role: "pegawai"
  },
  {
    id: "360c473f-0b5e-472e-8325-e1856e3b52a5",
    username: "Bustamin",
    password: "Bustamin2",
    nama: "Bustamin",
    jabatan: "Staf",
    subbagian: "Perencanaan, Data dan Informasi",
    role: "pegawai"
  }
];

// Initialize report records matching screenshot data
const DEFAULT_REPORTS: Report[] = [
  {
    id_report: "635dc091-13bb-4870-9063-1789e5d74d58",
    id_user: "635d2324-7a10-428b-b178-35d672e89955", // Asriani
    tanggal: "2026-05-03",
    kegiatan: "Data Input :\nNama dan Jabatan (Otomatis setelah login berdasarkan user)\nTersedia Riwayat data yang telah diinput dalam bentuk kalender\nterdapat presentase kinerja pegawai aplikasi\nbisa menginput laporan ditanggal yang sama (lebih dari 1 laporan)\nsediakan fitur edit laporan yang sudah diinput, bisa",
    output: "Data Input :\nNama dan Jabatan (Otomatis setelah login berdasarkan user)\nTersedia Riwayat data yang telah diinput dalam bentuk kalender\nterdapat presentase kinerja pegawai aplikasi\nbisa menginput laporan ditanggal yang sudah diinput, bisa",
    timestamp: "22/05/2026 22:57:47"
  },
  {
    id_report: "f7e1c347-721e-491f-b5b6-4a904f59931c",
    id_user: "635d2324-7a10-428b-b178-35d672e89955", // Asriani
    tanggal: "2026-05-04",
    kegiatan: "Melakukan instalasi dan konfigurasi dasar workspace development project",
    output: "Aplikasi React + Vite diintegrasikan dengan database Google Sheets melalui Apps Script",
    timestamp: "22/05/2026 23:06:10"
  },
  {
    id_report: "cd3d07cd-4cdc-457f-b8a8-00f80fb73734",
    id_user: "635d2324-7a10-428b-b178-35d672e89955", // Asriani
    tanggal: "2026-05-05",
    kegiatan: "Koordinasi teknis penyiapan menu setup dan petunjuk integrasi Google Sheet",
    output: "Dokumentasi visual panduan integrasi siap diakses pada portal admin",
    timestamp: "22/05/2026 23:06:21"
  },
  {
    id_report: "950176f5-b0f2-4378-91ca-ae29a7005dc6",
    id_user: "635d2324-7a10-428b-b178-35d672e89955", // Asriani
    tanggal: "2026-05-06",
    kegiatan: "Uji coba fungsionalitas pengisian multi-laporan pada tanggal kalender yang sama",
    output: "Pengisian ganda berhasil divalidasi dan disimpan tanpa terjadi overwrite",
    timestamp: "22/05/2026 23:06:38"
  },
  {
    id_report: "481216da-bfbc-459d-8211-e461c71bd837",
    id_user: "635d2324-7a10-428b-b178-35d672e89955", // Asriani
    tanggal: "2026-05-07",
    kegiatan: "Optimasi antarmuka dashboard agar responsif di seluruh resolusi layar",
    output: "Tampilan grid kalender dan diagram persentase kinerja berjalan mulus",
    timestamp: "22/05/2026 23:06:54"
  },
  // Sample reports for Murtina
  {
    id_report: "m1-report-01",
    id_user: "67244712-8cd5-47b0-afb0-15b18a6a1408", // Murtina
    tanggal: "2026-05-04",
    kegiatan: "Pemeriksaan berkas SPJ pengeluaran logistik bagian perlengkapan kantor",
    output: "Berkas SPJ dinyatakan lengkap, ditandatangani dan diarsip ke folder Keuangan",
    timestamp: "23/05/2026 09:15:30"
  },
  {
    id_report: "m1-report-02",
    id_user: "67244712-8cd5-47b0-afb0-15b18a6a1408", // Murtina
    tanggal: "2026-05-05",
    kegiatan: "Revisi Rencana Anggaran Biaya (RAB) pengadaan sarana IT",
    output: "Rencana revisi diserahkan kepada pimpinan subbagian keuangan",
    timestamp: "23/05/2026 14:02:11"
  },
  // Sample reports for Bustamin
  {
    id_report: "b1-report-01",
    id_user: "360c473f-0b5e-472e-8325-e1856e3b52a5", // Bustamin
    tanggal: "2026-05-05",
    kegiatan: "Pengolahan data statistik capaian sasaran kinerja triwulan pertama",
    output: "Laporan grafis siap presentasi diserahkan ke bagian evaluasi data",
    timestamp: "24/05/2026 10:12:00"
  }
];

export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    const config: SyncConfig = { gasUrl: '' };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }
}

export function getUsers(): User[] {
  initializeStorage();
  const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
  return usersStr ? JSON.parse(usersStr) : DEFAULT_USERS;
}

export function saveUser(user: User): User[] {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return users;
}

export function deleteUser(userId: string): User[] {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  return filtered;
}

export function getReports(): Report[] {
  initializeStorage();
  const reportsStr = localStorage.getItem(STORAGE_KEYS.REPORTS);
  return reportsStr ? JSON.parse(reportsStr) : DEFAULT_REPORTS;
}

export function saveReport(report: Report): Report[] {
  const reports = getReports();
  const index = reports.findIndex(r => r.id_report === report.id_report);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  return reports;
}

export function deleteReport(reportId: string): Report[] {
  const reports = getReports();
  const filtered = reports.filter(r => r.id_report !== reportId);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
  return filtered;
}

export function getSyncConfig(): SyncConfig {
  initializeStorage();
  const configStr = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return configStr ? JSON.parse(configStr) : { gasUrl: '' };
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

// LIVE INTERACTION WITH GOOGLE SHEETS / APPS SCRIPT
export async function testGasConnection(url: string): Promise<{ success: boolean; message: string; data?: { users: any[]; reports: any[] } }> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: "URL kosong. Silahkan masukkan Web App URL Anda." };
    }
    
    const response = await fetch("/api/sync/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: cleanUrl })
    });

    if (!response.ok) {
      return { success: false, message: `Server Proxy mengembalikan HTTP ${response.status}` };
    }

    return await response.json();
  } catch (err: any) {
    console.error("Connection test failed", err);
    return {
      success: false,
      message: `Gagal menghubungkan ke Server Proxy: ${err.message || err}`
    };
  }
}

export async function fetchRemoteData(): Promise<boolean> {
  const config = getSyncConfig();
  if (!config.gasUrl) return false;

  const test = await testGasConnection(config.gasUrl);
  if (test.success && test.data) {
    if (test.data.users && test.data.users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(test.data.users));
    }
    if (test.data.reports) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(test.data.reports));
    }
    return true;
  }
  return false;
}

export async function postRemoteAction(action: 'addReport' | 'editReport' | 'deleteReport' | 'syncUsers', payload: any): Promise<{ success: boolean; message: string }> {
  const config = getSyncConfig();
  if (!config.gasUrl) {
    return { success: false, message: "Google Sheets Sync tidak aktif (menggunakan penyimpanan lokal)" };
  }

  try {
    const response = await fetch("/api/sync/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: config.gasUrl,
        action,
        payload
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      // Refresh local copy immediately after successful post
      await fetchRemoteData();
      return { success: true, message: data.message || "Operasi berhasil disinkronisasi." };
    } else {
      return { success: false, message: data.error || data.message || "Gagal sinkronisasi data dengan sheet." };
    }
  } catch (err: any) {
    console.error("POST sync failed", err);
    return {
      success: false,
      message: `Gagal sinkronisasi ke Google Sheet ke Server Proxy. Data disimpan secara lokal terlebih dahulu. Detail: ${err.message || err}`
    };
  }
}
