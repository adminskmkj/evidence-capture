# Evidence Pentaksiran — Deployment Guide

## Stack

- Frontend: React + Vite + TypeScript → **Vercel**
- Backend bridge: **Google Apps Script**
- File storage: **Google Drive**
- Metadata: **Google Sheets**

---

## 1. Google Drive

1. Buka [Google Drive](https://drive.google.com/).
2. Di root Drive (My Drive), cipta folder bernama: `Evidence Pentaksiran`.
3. Buka folder tersebut.
4. Salin ID dari URL: `https://drive.google.com/drive/folders/<FOLDER_ID>`.
5. Simpan `<FOLDER_ID>` untuk langkah seterusnya.

---

## 2. Google Sheets (EvidenceDB)

1. Buka [Google Sheets](https://sheets.google.com/).
2. Cipta spreadsheet baru bernama: `EvidenceDB`.
3. Tambah 4 tab (sheet): `Subjects`, `Classes`, `Students`, `Evidence`.
4. Setiap tab mesti ada header row (baris 1) sebagai nama kolum.

### Tab `Subjects`

```text
subject_id | subject_name | year_level | active
```

Contoh isi:

```text
muzik-t1 | Muzik Tahun 1 | Tahun 1 | TRUE
sains-t1 | Sains Tahun 1 | Tahun 1 | TRUE
psv-t2 | PSV Tahun 2 | Tahun 2 | TRUE
psv-t3 | PSV Tahun 3 | Tahun 3 | TRUE
sains-t3 | Sains Tahun 3 | Tahun 3 | TRUE
```

### Tab `Classes`

```text
class_id | class_name | year_level | active
```

### Tab `Students`

```text
student_id | student_name | class_id | active
```

### Tab `Evidence`

```text
evidence_id | created_at | subject_id | class_id | student_ids | activity_title | notes | evidence_type | file_name | file_id | file_url | thumbnail_file_id | thumbnail_url | mime_type | file_size_bytes | duration_seconds | status | created_by
```

Biarkan baris kosong — Apps Script akan append automatik.

5. Salin ID spreadsheet dari URL: `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`.

---

## 3. Google Apps Script

1. Buka [Apps Script](https://script.google.com/).
2. Cipta project baru, namakan `EvidencePentaksiran`.
3. Salin keseluruhan kod dari `apps-script/Code.gs` ke dalam editor.
4. Klik **Project Settings** (gear icon).
5. Di bahagian **Script Properties**, tambah:

```text
ROOT_FOLDER_ID   = <FOLDER_ID dari langkah 1>
SPREADSHEET_ID   = <SPREADSHEET_ID dari langkah 2>
```

6. Klik **Deploy → New Deployment**.
7. Pilih **Web App**.
8. Config:
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Klik **Deploy**, kemudian **Authorize**.
10. Salin URL deployment (contoh: `https://script.google.com/macros/s/.../exec`).

### ⚠️ Ralat `Unknown action` (Simpan kelas / Simpan setup / Import)

Frontend Vercel **sudah baru**, tetapi **Web App Google masih kod lama** jika anda belum redeploy.

1. Buka project **EvidencePentaksiran** di [script.google.com](https://script.google.com/).
2. Ganti **semua** kod `Code.gs` dengan fail `apps-script/Code.gs` dari repo GitHub.
3. **Deploy → Manage deployments** → ikon pensel pada deployment sedia ada.
4. **Version:** *New version* → **Deploy** (URL `/exec` kekal sama).
5. **Semak:** buka URL `/exec` dalam tab baru (GET). Respons JSON mesti ada:
   - `"version":"2026-07-06"`
   - `"actions"` termasuk `saveSubjects` dan `uploadStudents`
6. Cuba semula **Simpan setup** / **Simpan murid** dalam app.

---

## 4. Vercel

1. Push repo ini ke GitHub.
2. Buka [Vercel](https://vercel.com/), import repo.
3. Framework: **Vite** (auto-detect).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Di **Environment Variables**, tambah:

```text
VITE_APPS_SCRIPT_URL = <URL deployment Apps Script>
```

7. Deploy.

---

## 5. Verify

1. Buka URL Vercel.
2. Dashboard akan papar data demo (seed).
3. Tab Tambah Evidence → pilih subjek, kelas, murid.
4. Ambil gambar atau rakam video → preview → simpan.
5. Semak Google Drive: fail sepatutnya dalam folder `Evidence Pentaksiran/<tahun>/<subjek>/<kelas>/`.
6. Semak Google Sheets tab Evidence: row baru sepatutnya wujud.
7. Tab Galeri → evidence yang diupload sepatutnya muncul.

---

## Media Limits

- Gambar: ≤ 500KB (kompres automatik dalam browser).
- Video: ≤ 90 saat, ≤ 10MB.
- Jika video > 10MB, upload akan ditolak.
