// Evidence Pentaksiran — Google Apps Script Backend
// Deploy as a Web App (Execute as: Me, Who has access: Anyone)

const CACHE_TTL = 300; // 5 min cache for bootstrap data

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    return handleAction(payload);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Invalid request' });
  }
}

function handleAction(payload) {
  const action = payload.action;

  switch (action) {
    case 'getBootstrapData':
      return handleGetBootstrapData();
    case 'listEvidence':
      return handleListEvidence(payload);
    case 'uploadEvidence':
      return handleUploadEvidence(payload);
    case 'updateEvidence':
      return handleUpdateEvidence(payload);
    case 'archiveEvidence':
      return handleArchiveEvidence(payload);
    default:
      return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  }
}

// --- Bootstrap ---

function handleGetBootstrapData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('bootstrapData');
  if (cached) return jsonResponse(JSON.parse(cached));

  const data = {
    subjects: readSheetData('Subjects'),
    classes: readSheetData('Classes'),
    students: readSheetData('Students'),
  };

  cache.put('bootstrapData', JSON.stringify({ ok: true, data: data }), CACHE_TTL);
  return jsonResponse({ ok: true, data: data });
}

// --- List Evidence ---

function handleListEvidence(payload) {
  const filters = payload.filters || {};
  const limit = payload.limit || 20;
  const offset = payload.offset || 0;

  let all = readSheetData('Evidence');
  if (!Array.isArray(all)) all = [];

  // filter
  if (filters.subject_id) {
    all = all.filter(function (row) { return row.subject_id === filters.subject_id; });
  }
  if (filters.class_id) {
    all = all.filter(function (row) { return row.class_id === filters.class_id; });
  }
  if (filters.type) {
    all = all.filter(function (row) { return row.evidence_type === filters.type; });
  }
  if (filters.student_id) {
    all = all.filter(function (row) {
      var ids = parseStudentIds(row.student_ids);
      return ids.indexOf(filters.student_id) !== -1;
    });
  }
  if (filters.from) {
    all = all.filter(function (row) { return row.created_at >= filters.from; });
  }
  if (filters.to) {
    all = all.filter(function (row) { return row.created_at <= filters.to; });
  }

  // sort newest first
  all.sort(function (a, b) {
    if (a.created_at > b.created_at) return -1;
    if (a.created_at < b.created_at) return 1;
    return 0;
  });

  var items = all.slice(offset, offset + limit);
  var nextOffset = offset + limit < all.length ? offset + limit : 0;

  return jsonResponse({ ok: true, items: items, nextOffset: nextOffset });
}

// --- Upload Evidence ---

function handleUploadEvidence(payload) {
  var metadata = payload.metadata;
  var file = payload.file;

  if (!metadata || !file) {
    return jsonResponse({ ok: false, error: 'Metadata dan file diperlukan' });
  }
  if (!metadata.subject_id || !metadata.class_id || !metadata.student_ids || !metadata.activity_title) {
    return jsonResponse({ ok: false, error: 'Subjek, kelas, murid dan tajuk aktiviti wajib diisi' });
  }

  // validate size
  var estimatedBytes = Math.ceil(file.base64.length * 0.75);
  if (metadata.evidence_type === 'image' && estimatedBytes > 500 * 1024) {
    return jsonResponse({ ok: false, error: 'Gambar melebihi had 500KB' });
  }
  if (metadata.evidence_type === 'video' && estimatedBytes > 10 * 1024 * 1024) {
    return jsonResponse({ ok: false, error: 'Video melebihi had 10MB' });
  }
  if (metadata.evidence_type === 'video' && (metadata.duration_seconds || 0) > 90) {
    return jsonResponse({ ok: false, error: 'Video melebihi had 90 saat' });
  }

  // decode and upload to Drive
  var decoded = Utilities.base64Decode(file.base64);
  var blob = Utilities.newBlob(decoded, file.mimeType, file.name);

  var folder = getOrCreateFolder(getRootFolderId(), new Date().getFullYear().toString());
  folder = getOrCreateFolder(folder.getId(), getSubjectName(metadata.subject_id));
  folder = getOrCreateFolder(folder.getId(), getClassName(metadata.class_id));

  var driveFile = folder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var evidenceId = 'ev-' + driveFile.getId();
  var payloadUrl = driveFile.getUrl();

  // write to sheet
  var row = [
    evidenceId,
    new Date().toISOString(),
    metadata.subject_id,
    metadata.class_id,
    JSON.stringify(metadata.student_ids),
    metadata.activity_title,
    metadata.notes || '',
    metadata.evidence_type,
    file.name,
    driveFile.getId(),
    payloadUrl,
    '',
    '',
    file.mimeType,
    metadata.file_size_bytes || estimatedBytes,
    metadata.duration_seconds || '',
    'active',
    Session.getActiveUser().getEmail() || '',
  ];

  appendRow('Evidence', row);

  return jsonResponse({
    ok: true,
    evidence_id: evidenceId,
    file_url: payloadUrl,
  });
}

// --- Update ---

function handleUpdateEvidence(payload) {
  // place holder: patch status / notes
  // Not implemented yet for MVP
  return jsonResponse({ ok: true });
}

function handleArchiveEvidence(payload) {
  // place holder: set status=archived
  return jsonResponse({ ok: true });
}

// --- Helpers ---

function getRootFolderId() {
  var id = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  if (!id) throw new Error('ROOT_FOLDER_ID not set in Script Properties');
  return id;
}

function getSpreadsheetId() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID not set in Script Properties');
  return id;
}

function getOrCreateFolder(parentId, name) {
  var parent = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder();
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function getSubjectName(subjectId) {
  var subjects = readSheetData('Subjects');
  var found = subjects.filter(function (s) { return s.subject_id === subjectId; });
  return found.length > 0 ? found[0].subject_name : subjectId;
}

function getClassName(classId) {
  var classes = readSheetData('Classes');
  var found = classes.filter(function (c) { return c.class_id === classId; });
  return found.length > 0 ? found[0].class_name : classId;
}

function readSheetData(sheetName) {
  var ss = SpreadsheetApp.openById(getSpreadsheetId());
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = val.toISOString();
      row[headers[j]] = val;
    }
    rows.push(row);
  }
  return rows;
}

function appendRow(sheetName, row) {
  var ss = SpreadsheetApp.openById(getSpreadsheetId());
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  sheet.appendRow(row);
}

function parseStudentIds(val) {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch (e) {
    return String(val).split(',').map(function (s) { return s.trim(); });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
