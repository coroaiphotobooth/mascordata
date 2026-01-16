/**
 * BACKEND RESILIEN UNTUK CORO AI PHOTOBOOTH - V2.5
 */
const SCRIPT_PROP = PropertiesService.getScriptProperties();

function getSpreadsheet() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    const ssId = SCRIPT_PROP.getProperty('SPREADSHEET_ID');
    if (ssId) {
      try {
        ss = SpreadsheetApp.openById(ssId);
      } catch (e) {
        console.error("Gagal membuka SS ID: " + ssId);
      }
    }
  }
  return ss;
}

function setup() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.create('Coro AI Photobooth Database');
    SCRIPT_PROP.setProperty('SPREADSHEET_ID', ss.getId());
  }

  let sheet = ss.getSheetByName('Gallery');
  if (!sheet) {
    sheet = ss.insertSheet('Gallery');
    sheet.appendRow(['id', 'createdAt', 'conceptName', 'imageUrl', 'downloadUrl', 'token']);
  }
  
  if (!SCRIPT_PROP.getProperty('FOLDER_ID')) {
    SCRIPT_PROP.setProperty('FOLDER_ID', DriveApp.getRootFolder().getId());
  }
  
  if (!SCRIPT_PROP.getProperty('ADMIN_PIN')) {
    SCRIPT_PROP.setProperty('ADMIN_PIN', '1234');
  }

  return "Setup Sukses. URL Spreadsheet: " + ss.getUrl();
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = getSpreadsheet();
  if (!ss) return createJsonResponse({ ok: false, error: 'SS_NOT_FOUND' });
  
  const sheet = ss.getSheetByName('Gallery');
  if (!sheet) return createJsonResponse({ items: [] });

  if (action === 'gallery') {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse({ items: [] });

    const headers = data[0];
    const rows = data.slice(1);
    
    const items = rows.filter(r => r[0]).map(row => {
      let item = {};
      headers.forEach((h, i) => item[h] = row[i]);
      return item;
    });

    return createJsonResponse({ items: items.reverse() });
  }
  return ContentService.createTextOutput("Service Active").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ ok: false, error: 'JSON_PARSE_ERROR' });
  }
  
  const ss = getSpreadsheet();
  if (!ss) return createJsonResponse({ ok: false, error: 'DATABASE_LOST' });
  let sheet = ss.getSheetByName('Gallery');
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName('Gallery');
  }

  const storedPin = SCRIPT_PROP.getProperty('ADMIN_PIN') || "1234";
  const isAuthenticated = String(data.pin) === String(storedPin);

  // Aksi tanpa butuh PIN (Upload dari proses booth)
  if (data.action === 'uploadGenerated') {
    try {
      const folderId = SCRIPT_PROP.getProperty('FOLDER_ID');
      const folder = DriveApp.getFolderById(folderId);
      const blob = Utilities.newBlob(Utilities.base64Decode(data.image.split(',')[1]), 'image/png', `PHOTO_${Date.now()}.png`);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileId = file.getId();
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      const timestamp = new Date().toLocaleString('id-ID');
      const token = Utilities.getUuid();

      sheet.appendRow([fileId, timestamp, data.conceptName, directUrl, directUrl, token]);
      SpreadsheetApp.flush();

      return createJsonResponse({
        ok: true,
        id: fileId,
        viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
        imageUrl: directUrl,
        downloadUrl: directUrl
      });
    } catch (err) {
      return createJsonResponse({ ok: false, error: err.toString() });
    }
  }

  // Proteksi PIN untuk aksi admin
  if (!isAuthenticated) {
    return createJsonResponse({ ok: false, error: 'UNAUTHORIZED_ACCESS' });
  }

  if (data.action === 'deletePhoto') {
    const fileId = data.id;
    const values = sheet.getDataRange().getValues();
    let rowToDelete = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == fileId) {
        rowToDelete = i + 1;
        break;
      }
    }
    
    if (rowToDelete !== -1) {
      sheet.deleteRow(rowToDelete);
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (e) {
        console.error("Drive delete failed: " + e.toString());
      }
      SpreadsheetApp.flush();
      return createJsonResponse({ ok: true });
    }
    return createJsonResponse({ ok: false, error: 'FILE_NOT_FOUND_IN_DB' });
  }

  if (data.action === 'resetApp') {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    SpreadsheetApp.flush();
    return createJsonResponse({ ok: true, message: 'Database cleared' });
  }

  if (data.action === 'updateSettings') {
    if (data.settings.folderId) SCRIPT_PROP.setProperty('FOLDER_ID', data.settings.folderId);
    if (data.settings.adminPin) SCRIPT_PROP.setProperty('ADMIN_PIN', data.settings.adminPin);
    return createJsonResponse({ ok: true });
  }

  return createJsonResponse({ ok: false, error: 'UNKNOWN_ACTION' });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}