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

### Ralat `Script function not found: doGet`

Ini bermakna **URL Web App yang anda buka masih versi lama** (atau projek salah), bukan semestinya app rosak.

1. Di [script.google.com](https://script.google.com/) → buka projek yang betul.
2. Panel kiri: pastikan ada fail **`Code.gs`** — buka, scroll atas, mesti nampak `function doGet()` (baris ~5).
   - Kalau **tiada** → copy semula **seluruh** `apps-script/Code.gs` dari repo → tampal → **Simpan** (Ctrl+S).
3. Dropdown fungsi (atas editor) pilih **`doGet`** → klik **Run** → benarkan akses jika diminta.
   - Kalau Run **berjaya** → kod OK; masalah hanya pada **deployment**.
4. **Deploy → Manage deployments** → **pensel** pada deployment **Web app** yang URL-nya sama dengan `VITE_APPS_SCRIPT_URL` di Vercel.
5. **Version: New version** → **Deploy**.
6. Copy URL dari dialog deploy itu → buka dalam tab baru.

**Nota:** `doGet` hanya untuk **semak** backend. App sebenar guna **POST** (`doPost`). Walaupun `doGet` gagal di URL lama, selepas redeploy betul, **Simpan setup** patut jalan jika `saveSubjects` ada dalam `Code.gs`.

Kalau anda pernah buat **New deployment** (bukan Edit), URL baru ≠ URL lama — kemas kini `VITE_APPS_SCRIPT_URL` di Vercel dengan URL baru, redeploy Vercel.

### Ralat `Script function not found: doPost` (atau `doGet`)

URL Web App **wujud**, tetapi **projek yang dipaut ke deployment itu tidak ada** `function doPost` / `doGet`.

1. Di [script.google.com](https://script.google.com/) buka **setiap** projek → **Deploy → Manage deployments**.
2. Cari deployment yang URL-nya **sama** dengan `VITE_APPS_SCRIPT_URL` (contoh akhiran `…UNtoJLA/exec`).
3. **Itu** projek yang betul — dalam projek itu sahaja tampal `apps-script/Code.gs` (~350 baris).
4. Pastikan atas fail ada `function doGet()` dan `function doPost(e)`.
5. **Simpan** → Run `doPost` (pilih fungsi lain dulu, run `doGet` untuk uji).
6. **Manage deployments → pensel → New version → Deploy** (jangan cipta URL baru melainkan anda akan kemas kini Vercel).

Ujian cepat (PowerShell / Git Bash):

```bash
curl -sL "URL_ANDA/exec" | grep "Script function"
curl -sL -X POST "URL_ANDA/exec" -H "Content-Type: text/plain" --data-binary '{"action":"ping"}' | grep "Script function"
```

Mesti **tiada** teks `Script function not found`. Selepas deploy betul, POST patut balas JSON `{"ok":true,"version":"2026-07-06",...}`.

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
