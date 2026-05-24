import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Support both local and IPv4 environments
dns.setDefaultResultOrder("ipv4first");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads
  app.use(express.json());

  // API Routes
  app.post("/api/sync/test", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL kosong. Silakan masukkan Web App URL Anda." });
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
      return res.json({
        success: false,
        message: "Format URL salah!\n\nLink yang dimasukkan harus merupakan URL Web App, bukan link editor editor Google Apps Script atau link Spreadsheet.\n\nContoh URL Web App yang benar:\nhttps://script.google.com/macros/s/AKfycbxxxxxxxxx/exec\n\nPastikan Anda membuat Web App dari menu Deploy -> Penerapan Baru -> Aplikasi Web (Web App), lalu menyalin URL penerapannya."
      });
    }

    try {
      const targetUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getData`;

      console.log(`[Proxy Test] Contacting Google Apps Script URL: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.error("=========================================");
          console.error("[APPS SCRIPT ERROR: 404 NOT FOUND]");
          console.error(`Timestamp: ${new Date().toISOString()}`);
          console.error(`Route: /api/sync/test`);
          console.error(`Method: GET`);
          console.error(`Target URL: ${targetUrl}`);
          console.error(`Headers Sent: ${JSON.stringify({ 'Accept': 'application/json' }, null, 2)}`);
          console.error(`Response Status: 404`);
          console.error("Checklist Pemecahan Masalah 404:");
          console.error("1. Pastikan URL Web App diisi lengkap dan benar.");
          console.error("2. Pastikan sudah melakukan 'Deploy' -> 'New deployment' pada Apps Script.");
          console.error("3. Pastikan 'Execute as' diatur ke 'Me' dan 'Who has access' diatur ke 'Anyone'.");
          console.error("=========================================");

          return res.json({
            success: false,
            message: "Mendapat HTTP 404 dari Google Apps Script.\n\nIni berarti URL Web App yang Anda simpan tidak valid atau sudah dihapus. Silakan lakukan Deploy -> Penerapan baru di editor Google Apps Script Anda, dan buat URL Web App yang baru."
          });
        }
        return res.json({ success: false, message: `Server Google Apps Script mengembalikan HTTP ${response.status}` });
      }

      const text = await response.text();
      const trimmedText = text.trim();

      if (trimmedText.startsWith("<") || trimmedText.toLowerCase().startsWith("<!doctype")) {
        return res.json({
          success: false,
          message: "Aplikasi Google Web App Anda mengembalikan dokumen HTML (bukan JSON). Ini biasanya terjadi jika Web App Anda belum di-deploy dengan benar atau memerlukan login Google.\n\nSilakan perbaiki konfigurasi Web App di Google Apps Script:\n1. Pilih tombol 'Deploy' -> 'New deployment'.\n2. Atur 'Execute as' (Jalankan sebagai) ke 'Me' (Saya).\n3. Atur 'Who has access' (Siapa yang memiliki akses) ke 'Anyone' (Semua Orang/Anonim) agar sistem dapat mengaksesnya tanpa masuk akun Google.\n4. Klik 'Deploy' dan salin URL Web App Baru yang diberikan."
        });
      }

      let json;
      try {
        json = JSON.parse(trimmedText);
      } catch (err: any) {
        return res.json({
          success: false,
          message: `Gagal membaca format JSON dari Google Apps Script: ${err.message || err}. Pastikan Anda memasukkan URL Web App yang valid.`
        });
      }

      if (json && (json.users || json.reports)) {
        return res.json({ 
          success: true, 
          message: `Koneksi Berhasil! Terdeteksi ${json.users?.length || 0} Pengguna dan ${json.reports?.length || 0} Laporan.`,
          data: json
        });
      } else {
        return res.json({ success: false, message: "Koneksi berhasil tetapi format data tidak dikenal. Pastikan Anda menyalin kode Script dengan benar ke spreadsheet." });
      }
    } catch (err: any) {
      console.error("[Proxy Test Error]", err);
      return res.json({
        success: false,
        message: `Gagal menghubungkan via Proxy Server: ${err.message || err}. Pastikan Web App Anda di-deploy dengan pengaturan: Execute as: "Me" dan Who has access: "Anyone".`
      });
    }
  });

  app.post("/api/sync/post", async (req, res) => {
    const { url, action, payload } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL kosong atau tidak terkonfigurasi." });
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
      return res.json({
        success: false,
        message: "Format URL salah!\n\nLink yang tersimpan harus berupa URL Web App Google Apps Script."
      });
    }

    try {
      console.log(`[Proxy POST] Action: ${action} to script URL: ${cleanUrl}`);
      const response = await fetch(cleanUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action,
          ...payload
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.error("=========================================");
          console.error("[APPS SCRIPT ERROR: 404 NOT FOUND]");
          console.error(`Timestamp: ${new Date().toISOString()}`);
          console.error(`Route: /api/sync/post`);
          console.error(`Method: POST`);
          console.error(`Target URL: ${cleanUrl}`);
          console.error(`Payload Sent: ${JSON.stringify({ action, ...payload }, null, 2)}`);
          console.error(`Response Status: 404`);
          console.error("Checklist Pemecahan Masalah 404:");
          console.error("1. Pastikan URL Web App diisi lengkap dan benar.");
          console.error("2. Pastikan sudah melakukan 'Deploy' -> 'New deployment' pada Apps Script.");
          console.error("3. Pastikan 'Execute as' diatur ke 'Me' dan 'Who has access' diatur ke 'Anyone'.");
          console.error("=========================================");

          return res.json({
            success: false,
            message: "Mendapat HTTP 404 dari Google Apps Script saat mencoba menyimpan data.\n\nIni biasanya dikarenakan URL Web App Anda salah, sudah kedaluwarsa, atau dideploy ulang tetapi URL lama tidak diperbarui dalam konfigurasi aplikasi."
          });
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const trimmedText = text.trim();

      if (trimmedText.startsWith("<") || trimmedText.toLowerCase().startsWith("<!doctype")) {
        return res.json({
          success: false,
          message: "Tidak dapat mengirim data ke Google Sheet karena link mengembalikan dokumen HTML (bukan JSON). Pastikan Web App Anda di Apps Script di-deploy dengan pengaturan: Execute as: 'Me' dan Who has access: 'Anyone'."
        });
      }

      let data;
      try {
        data = JSON.parse(trimmedText);
      } catch (err: any) {
        return res.json({
          success: false,
          message: `Gagal membaca format JSON dari server Apps Script saat pengiriman data: ${err.message || err}`
        });
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[Proxy POST Error]", err);
      return res.json({
        success: false,
        message: `Gagal sinkronisasi data melalui Proxy Server: ${err.message || err}`
      });
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev or Serve static compiled files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack] Server running on http://localhost:${PORT}`);
  });
}

startServer();
