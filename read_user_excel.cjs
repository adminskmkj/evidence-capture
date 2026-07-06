const XLSX = require('xlsx');

const filePath = 'D:\\apps\\evidence-unit\\.hermes\\desktop-attachments\\JBA1010 Keseluruhan Murid as of 2026-06-28.xlsx';

function prefixClassNameWithYear(className, yearLevel) {
  const cn = String(className || '').trim();
  if (!cn) return '';

  if (/^\d/i.test(cn) || /^pra/i.test(cn)) {
    return cn;
  }

  const trimmedYear = String(yearLevel || '').trim();
  if (/prasekolah|^pra\b/i.test(trimmedYear)) {
    return `PRA ${cn}`;
  }

  const m = trimmedYear.match(/(\d)/);
  if (m) {
    return `${m[1]} ${cn}`;
  }

  const malayMap = {
    satu: '1', dua: '2', tiga: '3', empat: '4', lima: '5', enam: '6',
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6',
  };
  const compact = trimmedYear.toLowerCase().replace(/[^a-z]/g, '');
  for (const [word, num] of Object.entries(malayMap)) {
    if (compact.includes(word)) {
      return `${num} ${cn}`;
    }
  }

  return cn;
}

try {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const classes = {};
  for (let r = 6; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row[10]) continue;
    const rawClass = row[10];
    const rawYear = row[9];
    const key = `${rawClass} | ${rawYear}`;
    if (!classes[key]) {
      classes[key] = {
        className: rawClass,
        yearLevel: rawYear,
        count: 0
      };
    }
    classes[key].count++;
  }

  console.log("Unique class combinations in Excel:");
  Object.values(classes).forEach(c => {
    const prefixed = prefixClassNameWithYear(c.className, c.yearLevel);
    console.log(`Class="${c.className}" | Year="${c.yearLevel}" | Prefixed="${prefixed}" | Count=${c.count}`);
  });
} catch (err) {
  console.error(err);
}
