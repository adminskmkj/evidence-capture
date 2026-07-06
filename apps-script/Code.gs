// Evidence Pentaksiran — Google Apps Script Backend
// Deploy as a Web App (Execute as: Me, Who has access: Anyone)

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    var action = p.action;

    if (action === 'login') return handleLogin(p);
    if (action === 'getBootstrapData') return handleGetBootstrapData(p);
    if (action === 'uploadStudents') return handleUploadStudents(p);
    if (action === 'saveSubjects') return handleSaveSubjects(p);
    if (action === 'listEvidence') return handleListEvidence(p);
    if (action === 'uploadEvidence') return handleUploadEvidence(p);

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// --- Login ---
function handleLogin(p) {
  var name = (p.userName || '').trim();
  if (!name) return jsonResponse({ ok: false, error: 'Nama diperlukan' });

  var ss = SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
  var existing = ss.getSheetByName(name);

  if (existing) {
    var boot = buildUserBootstrap(ss, name);
    return jsonResponse({ ok: true, user: name, classes: boot.classes, students: boot.students, subjects: boot.subjects });
  }

  // Create sheets for new user
  var userSheet = ss.insertSheet(name);
  setupUserSheet(ss, name);

  // Also add to Users registry
  ensureUsersSheet(ss);
  appendRow(ss, 'Users', [name, new Date().toISOString()]);

  return jsonResponse({ ok: true, user: name, classes: [], students: [], subjects: [], newUser: true });
}

function setupUserSheet(ss, userName) {
  var sheet = ss.getSheetByName(userName);
  if (!sheet) return;
  sheet.getRange('A1:D1').setValues([['NAMA KELAS', 'JENIS KELAS', 'TAHUN/TINGKATAN', 'NAMA MURID']]);
}

// --- Get Bootstrap Data ---
function handleGetBootstrapData(p) {
  var userName = (p.userName || '').trim();
  if (!userName) return jsonResponse({ ok: false, error: 'User required' });

  var ss = SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
  var sheet = ss.getSheetByName(userName);
  if (!sheet) return jsonResponse({ ok: false, error: 'User not found' });

  var boot = buildUserBootstrap(ss, userName);
  return jsonResponse({ ok: true, classes: boot.classes, students: boot.students, subjects: boot.subjects });
}

function buildUserBootstrap(ss, userName) {
  var sheet = ss.getSheetByName(userName);
  var data = sheet.getDataRange().getValues();
  var classes = {};
  var students = [];

  for (var i = 1; i < data.length; i++) {
    var className = String(data[i][0] || '').trim();
    var classType = String(data[i][1] || '').trim();
    var tahun = String(data[i][2] || '').trim();
    var studentName = String(data[i][3] || '').trim();

    if (className && !classes[className]) {
      classes[className] = { class_name: className, class_type: classType, year: tahun };
    }
    if (studentName) {
      students.push({ student_name: studentName, class_name: className });
    }
  }

  var classList = Object.keys(classes).map(function(k) { return classes[k]; });
  var subjects = readUserSubjects(ss, userName);
  return { classes: classList, students: students, subjects: subjects };
}

// --- Upload Students from Excel ---
function handleUploadStudents(p) {
  var userName = (p.userName || '').trim();
  var rows = p.rows || [];
  var mode = (p.mode || 'merge').toLowerCase();

  if (!userName || !rows.length) return jsonResponse({ ok: false, error: 'Data diperlukan' });

  var ss = SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
  var sheet = ss.getSheetByName(userName);
  if (!sheet) return jsonResponse({ ok: false, error: 'User sheet not found' });

  var merged = [];
  if (mode === 'replace') {
    merged = rows;
  } else {
    var incomingClasses = {};
    for (var i = 0; i < rows.length; i++) {
      var cn = String(rows[i].className || '').trim();
      if (cn) incomingClasses[cn] = true;
    }
    var existing = readUserRows(sheet);
    for (var j = 0; j < existing.length; j++) {
      if (!incomingClasses[existing[j].className]) merged.push(existing[j]);
    }
    for (var k = 0; k < rows.length; k++) merged.push(rows[k]);
  }

  writeUserRows(sheet, merged);
  return jsonResponse({ ok: true, count: rows.length, total: merged.length });
}

function readUserRows(sheet) {
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var className = String(data[i][0] || '').trim();
    var studentName = String(data[i][3] || '').trim();
    if (!className && !studentName) continue;
    out.push({
      className: className,
      classType: String(data[i][1] || '').trim(),
      yearLevel: String(data[i][2] || '').trim(),
      studentName: studentName
    });
  }
  return out;
}

function writeUserRows(sheet, rows) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  if (!rows.length) return;

  var values = [];
  for (var i = 0; i < rows.length; i++) {
    values.push([
      rows[i].className || '',
      rows[i].classType || '',
      rows[i].yearLevel || '',
      rows[i].studentName || ''
    ]);
  }
  sheet.getRange(2, 1, values.length, 4).setValues(values);
}

// --- Subjek per pengguna (sheet SubjekPengguna) ---
function ensureSubjekSheet(ss) {
  var sheet = ss.getSheetByName('SubjekPengguna');
  if (!sheet) {
    sheet = ss.insertSheet('SubjekPengguna');
    sheet.getRange('A1:F1').setValues([['user_name', 'subject_id', 'subject_name', 'year_level', 'jenis_kelas', 'class_names']]);
  }
  return sheet;
}

function readUserSubjects(ss, userName) {
  var sheet = ensureSubjekSheet(ss);
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() !== userName) continue;
    var classNamesRaw = String(data[i][5] || '').trim();
    var classNames = classNamesRaw ? classNamesRaw.split('|').map(function(s) { return s.trim(); }).filter(Boolean) : [];
    out.push({
      subject_id: String(data[i][1] || '').trim(),
      subject_name: String(data[i][2] || '').trim(),
      year_level: String(data[i][3] || '').trim(),
      jenis_kelas: String(data[i][4] || '').trim(),
      class_names: classNames
    });
  }
  return out;
}

function handleSaveSubjects(p) {
  var userName = (p.userName || '').trim();
  var subjects = p.subjects || [];
  var replaceAll = p.replaceAll === true;
  if (!userName) return jsonResponse({ ok: false, error: 'User required' });

  var ss = SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
  var sheet = ensureSubjekSheet(ss);
  var data = sheet.getDataRange().getValues();

  var kept = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() !== userName) {
      kept.push(data[i]);
    }
  }

  if (!replaceAll && subjects.length) {
    var byId = {};
    for (var m = 0; m < kept.length; m++) {
      var rowUser = String(kept[m][0] || '').trim();
      if (rowUser === userName) continue;
    }
    // Re-read existing user rows from sheet before we filtered
    var existingUser = readUserSubjects(ss, userName);
    for (var e = 0; e < existingUser.length; e++) {
      byId[existingUser[e].subject_id] = existingUser[e];
    }
    for (var n = 0; n < subjects.length; n++) {
      var sid = subjects[n].subject_id || '';
      byId[sid || ('new-' + n)] = subjects[n];
    }
    subjects = [];
    for (var k in byId) {
      if (byId.hasOwnProperty(k)) subjects.push(byId[k]);
    }
    replaceAll = true;
  }

  var rows = [sheet.getRange(1, 1, 1, 6).getValues()[0]];
  for (var k2 = 0; k2 < kept.length; k2++) rows.push(kept[k2]);

  for (var j = 0; j < subjects.length; j++) {
    var s = subjects[j];
    var names = s.class_names || [];
    rows.push([
      userName,
      s.subject_id || '',
      s.subject_name || '',
      s.year_level || '',
      s.jenis_kelas || '',
      names.join('|')
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 6).setValues(rows);
  return jsonResponse({ ok: true, count: subjects.length });
}

// --- List Evidence ---
function handleListEvidence(p) {
  var userName = (p.userName || '').trim();
  if (!userName) return jsonResponse({ ok: false, items: [], nextOffset: 0 });

  var all = readSheetData(getSs(), 'Evidence');
  if (!Array.isArray(all)) all = [];

  // Filter by user if stored
  if (userName) all = all.filter(function(r) { return r.created_by === userName || !r.created_by; });

  all.sort(function(a, b) { return a.created_at > b.created_at ? -1 : 1; });
  var limit = p.limit || 20;
  var offset = p.offset || 0;
  var items = all.slice(offset, offset + limit);

  return jsonResponse({ ok: true, items: items, nextOffset: offset + limit < all.length ? offset + limit : 0 });
}

// --- Upload Evidence ---
function handleUploadEvidence(p) {
  var m = p.metadata, f = p.file, userName = (p.userName || '').trim();
  if (!m || !m.subject_id || !m.class_id || !m.student_ids || !m.activity_title)
    return jsonResponse({ ok: false, error: 'Subjek, kelas, murid, tajuk wajib' });

  var dec = Utilities.base64Decode(f.base64);
  var blob = Utilities.newBlob(dec, f.mimeType, f.name);

  var folder = getOrCreateFolder(getProp('ROOT_FOLDER_ID'), '' + new Date().getFullYear());
  folder = getOrCreateFolder(folder.getId(), m.subject_id);
  folder = getOrCreateFolder(folder.getId(), m.class_id);
  var df = folder.createFile(blob);
  df.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var eid = 'ev-' + df.getId();
  appendRow(getSs(), 'Evidence', [
    eid, new Date().toISOString(), m.subject_id, m.class_id, JSON.stringify(m.student_ids),
    m.activity_title, m.notes || '', m.evidence_type, f.name, df.getId(), df.getUrl(),
    '', '', f.mimeType, m.file_size_bytes || 0, m.duration_seconds || '', 'active', userName
  ]);

  return jsonResponse({ ok: true, evidence_id: eid, file_url: df.getUrl() });
}

// --- Helpers ---
function getSs() { return SpreadsheetApp.openById(getProp('SPREADSHEET_ID')); }
function getProp(key) { return PropertiesService.getScriptProperties().getProperty(key); }

function getOrCreateFolder(pid, name) {
  var p = pid ? DriveApp.getFolderById(pid) : DriveApp.getRootFolder();
  var fs = p.getFoldersByName(name);
  return fs.hasNext() ? fs.next() : p.createFolder(name);
}

function readSheetData(ss, sheetName, headerCol) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  var d = sh.getDataRange().getValues();
  if (d.length < 2) return [];
  var h = d[0].map(function(v) { return String(v).trim(); });
  var rows = [];
  for (var i = 1; i < d.length; i++) {
    var row = {};
    for (var j = 0; j < h.length; j++) { if (h[j]) row[h[j]] = d[i][j]; }
    rows.push(row);
  }
  return rows;
}

function appendRow(ss, sheetName, row) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    sh.appendRow(['evidence_id', 'created_at', 'subject_id', 'class_id', 'student_ids', 'activity_title', 'notes', 'evidence_type', 'file_name', 'file_id', 'file_url', 'thumbnail_file_id', 'thumbnail_url', 'mime_type', 'file_size_bytes', 'duration_seconds', 'status', 'created_by']);
  }
  sh.appendRow(row);
}

function ensureUsersSheet(ss) {
  var sh = ss.getSheetByName('Users');
  if (!sh) {
    sh = ss.insertSheet('Users');
    sh.getRange('A1:B1').setValues([['user_name', 'created_at']]);
  }
}

function jsonResponse(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}
