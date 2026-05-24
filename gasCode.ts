export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script for "Laporan Kegiatan dan Kinerja Pegawai" Sync
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Click the "Save" icon (disc).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Select "Web app" as the deployment type.
 * 7. Change "Execute as" to "Me" (your Google account).
 * 8. Change "Who has access" to "Anyone".
 * 9. Click "Deploy", authorize permissions, and copy the Web App URL.
 * 10. Paste the copied URL into the Sync Config settings of this Web App.
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize sheets if they do not exist
  initSheets(ss);
  
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Koneksi Berhasil! Google Apps Script SIKAP Anda sudah aktif dan ter-deploy. Silakan salin URL Web App ini ke konfigurasi Sync pada aplikasi.",
      users: [],
      reports: []
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  var action = e.parameter.action;
  var result = {};
  
  if (action === "getData" || !action) {
    var userSheet = ss.getSheetByName("Users");
    var reportSheet = ss.getSheetByName("Laporan_Kegiatan");
    
    result.users = getSheetData(userSheet);
    result.reports = getSheetData(reportSheet);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { success: false };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheets(ss);
  
  var reportSheet = ss.getSheetByName("Laporan_Kegiatan");
  var userSheet = ss.getSheetByName("Users");
  
  if (!e || !e.postData || !e.postData.contents) {
    result.message = "Tidak ada payload POST. SIKAP Apps Script di-deploy dengan benar. Gunakan sinkronisasi dari dashboard utama.";
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === "addReport") {
      var r = postData.report;
      // Append row in Laporan_Kegiatan
      reportSheet.appendRow([
        r.id_report,
        r.id_user,
        r.tanggal,
        r.kegiatan,
        r.output,
        r.timestamp
      ]);
      result.success = true;
      result.message = "Laporan berhasil ditambahkan.";
    } 
    else if (action === "editReport") {
      var r = postData.report;
      var data = reportSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === r.id_report) {
          // Columns: ID_Report, ID_User, Tanggal, Kegiatan, Output, Timestamp
          reportSheet.getRange(i + 1, 3).setValue(r.tanggal);
          reportSheet.getRange(i + 1, 4).setValue(r.kegiatan);
          reportSheet.getRange(i + 1, 5).setValue(r.output);
          reportSheet.getRange(i + 1, 6).setValue(r.timestamp);
          found = true;
          break;
        }
      }
      result.success = found;
      result.message = found ? "Laporan berhasil diubah." : "Laporan tidak ditemukan.";
    } 
    else if (action === "deleteReport") {
      var id_report = postData.id_report;
      var data = reportSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === id_report) {
          reportSheet.deleteRow(i + 1);
          found = true;
          break;
        }
      }
      result.success = found;
      result.message = found ? "Laporan berhasil dihapus." : "Laporan tidak ditemukan.";
    }
    else if (action === "syncUsers") {
      var users = postData.users;
      userSheet.clear();
      // Write headers
      userSheet.getRange(1, 1, 1, 7).setValues([["ID", "Username", "Password", "Nama", "Jabatan", "Subbagian", "Role"]]);
      if (users && users.length > 0) {
        var rows = users.map(function(u) {
          return [u.id, u.username, u.password || "", u.nama, u.jabatan, u.subbagian, u.role];
        });
        userSheet.getRange(2, 1, rows.length, 7).setValues(rows);
      }
      result.success = true;
      result.message = "Sinkronisasi user berhasil.";
    }
  } catch(err) {
    result.success = false;
    result.error = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Utility to extract sheet data as clean JSON array using headers
 */
function getSheetData(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0].map(function(h) { 
    return h.toString().toLowerCase().trim().replace(/_/g, ""); 
  });
  
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      // Map standard keys back for our API compatibility
      if (key === "idreport") key = "id_report";
      if (key === "iduser") key = "id_user";
      
      var val = data[i][j];
      // Format Dates cleanly
      if (val instanceof Date) {
        // format as YYYY-MM-DD for Tanggal or full time for Timestamp
        if (j === 2) { // Tanggal
          obj[key] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          obj[key] = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
        }
      } else {
        obj[key] = val;
      }
    }
    list.push(obj);
  }
  return list;
}

/**
 * Initializes the Spreadsheet structured pages if they don't exist
 */
function initSheets(ss) {
  var userSheet = ss.getSheetByName("Users");
  if (!userSheet) {
    userSheet = ss.insertSheet("Users");
    userSheet.getRange(1, 1, 1, 7).setValues([["ID", "Username", "Password", "Nama", "Jabatan", "Subbagian", "Role"]]);
    // Append Sample users based on screenshots
    var sampleUsers = [
      ["797703d1-f982-48d2-b613-33c598f026cb", "admin", "admin123", "Administrator", "Admin", "Admin", "admin"],
      ["67244712-8cd5-47b0-afb0-15b18a6a1408", "Murtina", "tokketokke", "Murtina", "Staf", "Keuangan, Umum dan Logistik", "pegawai"],
      ["635d2324-7a10-428b-b178-35d672e89955", "Asriani", "Asriani1", "Asriani", "Staf", "Teknis Penyelenggaraan, Partisipasi dan Humas", "pegawai"],
      ["360c473f-0b5e-472e-8325-e1856e3b52a5", "Bustamin", "Bustamin2", "Bustamin", "Staf", "Perencanaan, Data dan Informasi", "pegawai"]
    ];
    userSheet.getRange(2, 1, sampleUsers.length, 7).setValues(sampleUsers);
  }
  
  var reportSheet = ss.getSheetByName("Laporan_Kegiatan");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("Laporan_Kegiatan");
    reportSheet.getRange(1, 1, 1, 6).setValues([["ID_Report", "ID_User", "Tanggal", "Kegiatan", "Output", "Timestamp"]]);
    
    // Sample report based on screenshot
    var sampleReports = [
      [
        "635dc091-13bb-4870-9063-1789e5d74d58", 
        "635d2324-7a10-428b-b178-35d672e89955", 
        "2026-05-03", 
        "Data Input :\\nNama dan Jabatan (Otomatis setelah login berdasarkan user)\\nTersedia Riwayat data yang telah diinput dalam bentuk kalender\\nterdapat presentase kinerja pegawai aplikasi\\nbisa menginput laporan ditanggal yang sama (lebih dari 1 laporan)\\nsediakan fitur edit laporan yang sudah diinput, bisa", 
        "Data Input :\\nNama dan Jabatan (Otomatis setelah login berdasarkan user)\\nTersedia Riwayat data yang telah diinput dalam bentuk kalender\\nterdapat presentase kinerja pegawai aplikasi\\nbisa menginput laporan ditanggal yang sudah diinput, bisa", 
        "22/05/2026 22:57:47"
      ],
      [
        "f7e1c347-721e-491f-b5b6-4a904f59931c",
        "635d2324-7a10-428b-b178-35d672e89955",
        "2026-05-04",
        "Mengerjakan laporan harian kegiatan di unit teknis",
        "Draft laporan tercatat dan tersimpan",
        "22/05/2026 23:06:10"
      ],
      [
        "cd3d07cd-4cdc-457f-b8a8-00f80fb73734",
        "635d2324-7a10-428b-b178-35d672e89955",
        "2026-05-05",
        "Rapat koordinasi divisi umum mengenai logistik pemilu",
        "Notulensi rapat dan rencana tindak lanjut divisi",
        "22/05/2026 23:06:21"
      ]
    ];
    reportSheet.getRange(2, 1, sampleReports.length, 6).setValues(sampleReports);
  }
}
`;
