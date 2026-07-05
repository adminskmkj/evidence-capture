# Evidence Pentaksiran Web App Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Bina web app untuk guru menyimpan evidence pentaksiran dalam bentuk gambar dan video pendek, dengan upload ke Google Drive, metadata dalam Google Sheets, deploy di Vercel, dan had saiz media yang ketat.

**Architecture:** Frontend web app akan dirakam/diguna terus dalam browser. Gambar dikompres di client sehingga bawah 500KB. Video dirakam terus melalui MediaRecorder dengan had maksimum 90 saat dan target 7–10MB. Fail dihantar ke Google Apps Script Web App untuk disimpan ke Google Drive, manakala metadata evidence disimpan dalam Google Sheets.

**Tech Stack:** React + Vite + TypeScript, Vercel, Google Apps Script, Google Drive, Google Sheets, browser MediaDevices/MediaRecorder API, canvas image compression.

---

## Goal

Build a production-ready MVP for an Evidence Pentaksiran Web App.

Success criteria:

- All 17 implementation tasks completed.
- TypeScript build passes.
- No lint errors.
- Media upload works.
- Google Drive integration works.
- Google Sheets metadata works.
- Gallery can list uploaded evidence.
- Deployable to Vercel.

## Progress

### Completed

- [x] Project scaffold
- [x] Type definitions

### Current

Task 3 - Seed data

### Blockers

None

### Next

Task 4

## Tasks

- [x] Task 1 Scaffold
- [x] Task 2 Types
- [ ] Task 3 Seed Data
- [ ] Task 4 Layout
- [ ] Task 5 Dashboard
- [ ] Task 6 Evidence Form
- [ ] Task 7 Image Capture and Compression
- [ ] Task 8 Video Recorder
- [ ] Task 9 Media Preview
- [ ] Task 10 Apps Script API Client
- [ ] Task 11 Google Apps Script Backend
- [ ] Task 12 Frontend Upload Integration
- [ ] Task 13 Gallery
- [ ] Task 14 Evidence Detail Viewer
- [ ] Task 15 Settings/Import Placeholder
- [ ] Task 16 Deployment Documentation
- [ ] Task 17 Validation

## Autonomous Loop

Objective:

Complete all tasks in TASKS.md.

Workflow:

1. Read GOAL.md.
2. Read TASKS.md.
3. Pick first incomplete task.
4. Implement only that task.
5. Run:

```bash
npm run build
```

6. If build fails:
   - Fix error.
   - Retry.

7. If build succeeds:
   - Update PROGRESS.md.
   - Mark task complete.

8. Continue until all tasks are complete.

Stop when:

- All tasks complete.
- Definition of Done satisfied.

Rules:

- Never remove existing features.
- Never break previous tasks.
- Always run build before marking task complete.
- Update PROGRESS.md after every task.
- Keep code modular.
- Prefer reusable components.
- Never skip verification.

Verification:

Every task must pass:

```bash
npm run build
```

If feature related:

- Manual browser test

If backend related:

- Apps Script POST test

Before finishing:

- Complete Definition of Done.

---

## 1. Konteks dan Keperluan Utama

User ialah guru yang perlu menyimpan evidence pentaksiran. Evidence perlu mudah dicari semula mengikut subjek, kelas, murid, tarikh dan aktiviti.

Subjek/kelas awal:

- Muzik Tahun 1 — 1 kelas
- Sains Tahun 1 — 1 kelas
- PSV Tahun 2 — 2 kelas
- PSV Tahun 3 — 1 kelas
- Sains Tahun 3 — 6 kelas

Keperluan media:

- Gambar mesti dikompres sehingga **≤ 500KB**.
- Video mesti dirakam terus dalam web app.
- Video maksimum **1 minit 30 saat / 90 saat**.
- Target video **7–10MB**.
- Video/gambar mesti boleh preview/play balik dalam web app.
- Jangan autoplay video.
- Evidence boleh ditag kepada seorang atau beberapa murid.

Keperluan sistem:

- Deploy frontend di Vercel.
- Simpan fail media di Google Drive.
- Simpan metadata di Google Sheets.
- Guna Google Apps Script sebagai backend ringan.
- Supabase tidak digunakan untuk MVP; hanya dipertimbangkan pada fasa kemudian jika perlu auth/database lebih kuat.

---

## 2. Cadangan Struktur Data

### 2.1 Google Sheet: `EvidenceDB`

Spreadsheet dicadangkan ada beberapa sheet/tab:

```text
Settings
Subjects
Classes
Students
Evidence
```

### 2.2 Sheet `Subjects`

Kolum:

```text
subject_id | subject_name | year_level | active
```

Contoh:

```text
muzik-t1 | Muzik Tahun 1 | Tahun 1 | TRUE
sains-t1 | Sains Tahun 1 | Tahun 1 | TRUE
psv-t2 | PSV Tahun 2 | Tahun 2 | TRUE
psv-t3 | PSV Tahun 3 | Tahun 3 | TRUE
sains-t3 | Sains Tahun 3 | Tahun 3 | TRUE
```

### 2.3 Sheet `Classes`

Kolum:

```text
class_id | class_name | year_level | active
```

Contoh placeholder; nama sebenar boleh diganti bila user beri senarai:

```text
1-kelas-a | 1 Kelas A | Tahun 1 | TRUE
2-kelas-a | 2 Kelas A | Tahun 2 | TRUE
2-kelas-b | 2 Kelas B | Tahun 2 | TRUE
3-kelas-a | 3 Kelas A | Tahun 3 | TRUE
3-kelas-b | 3 Kelas B | Tahun 3 | TRUE
3-kelas-c | 3 Kelas C | Tahun 3 | TRUE
3-kelas-d | 3 Kelas D | Tahun 3 | TRUE
3-kelas-e | 3 Kelas E | Tahun 3 | TRUE
3-kelas-f | 3 Kelas F | Tahun 3 | TRUE
```

### 2.4 Sheet `Students`

Kolum minimum:

```text
student_id | student_name | class_id | active
```

Nota:

- Jangan wajibkan MyKid untuk MVP.
- Kalau MyKid diperlukan kemudian, tambah sebagai optional dan jangan papar secara terbuka.

### 2.5 Sheet `Evidence`

Kolum:

```text
evidence_id
created_at
subject_id
class_id
student_ids
activity_title
notes
evidence_type
file_name
file_id
file_url
thumbnail_file_id
thumbnail_url
mime_type
file_size_bytes
duration_seconds
status
created_by
```

`student_ids` boleh simpan CSV/JSON string seperti:

```json
["stu_001", "stu_002"]
```

Untuk MVP, simpan sebagai JSON string dalam satu cell sudah memadai.

---

## 3. Cadangan Struktur Google Drive

Root folder:

```text
Evidence Pentaksiran/
```

Dalam root:

```text
Evidence Pentaksiran/
  2026/
    Muzik Tahun 1/
      1 Kelas A/
    Sains Tahun 1/
      1 Kelas A/
    PSV Tahun 2/
      2 Kelas A/
      2 Kelas B/
    PSV Tahun 3/
      3 Kelas A/
    Sains Tahun 3/
      3 Kelas A/
      3 Kelas B/
      3 Kelas C/
      3 Kelas D/
      3 Kelas E/
      3 Kelas F/
```

Nama fail dicadangkan:

```text
YYYY-MM-DD_HHMM_<subject>_<class>_<student-or-group>_<activity>_<type>.<ext>
```

Contoh:

```text
2026-07-05_0915_SainsT3_3KelasA_Ali_EksperimenMagnet_video.webm
2026-07-05_0940_PSVT2_2KelasB_Kumpulan1_Kolaj_image.jpg
```

---

## 4. API Google Apps Script

### 4.1 Endpoint tunggal

Apps Script akan deploy sebagai Web App dengan endpoint POST.

Payload action:

```json
{
  "action": "uploadEvidence",
  "metadata": {},
  "file": {}
}
```

Endpoint juga menyokong action:

```text
getBootstrapData
listEvidence
uploadEvidence
updateEvidence
archiveEvidence
```

### 4.2 `getBootstrapData`

Tujuan: Frontend ambil senarai subjek, kelas dan murid.

Input:

```json
{
  "action": "getBootstrapData"
}
```

Output:

```json
{
  "ok": true,
  "subjects": [],
  "classes": [],
  "students": []
}
```

### 4.3 `listEvidence`

Input:

```json
{
  "action": "listEvidence",
  "filters": {
    "subject_id": "sains-t3",
    "class_id": "3-kelas-a",
    "student_id": "stu_001",
    "from": "2026-07-01",
    "to": "2026-07-31",
    "type": "video"
  },
  "limit": 20,
  "offset": 0
}
```

Output:

```json
{
  "ok": true,
  "items": [],
  "nextOffset": 20
}
```

### 4.4 `uploadEvidence`

Frontend hantar:

```json
{
  "action": "uploadEvidence",
  "metadata": {
    "subject_id": "sains-t3",
    "class_id": "3-kelas-a",
    "student_ids": ["stu_001"],
    "activity_title": "Eksperimen magnet",
    "notes": "Murid boleh mengenal objek yang ditarik magnet.",
    "evidence_type": "video",
    "duration_seconds": 42
  },
  "file": {
    "name": "2026-07-05_0915_SainsT3_3KelasA_Ali_EksperimenMagnet_video.webm",
    "mimeType": "video/webm",
    "base64": "..."
  }
}
```

Apps Script:

1. Validate metadata.
2. Decode base64.
3. Check estimated size.
4. Cari/cipta folder Drive ikut tahun/subjek/kelas.
5. Simpan fail.
6. Set permission sesuai.
7. Append row ke sheet `Evidence`.
8. Return metadata + URL.

---

## 5. Frontend Screens

### 5.1 Dashboard

Paparan:

- Evidence terbaru.
- Butang cepat ikut subjek/kelas.
- Jumlah evidence bulan ini.
- Shortcut `Tambah Evidence`.

### 5.2 Setup Data

MVP boleh guna data hardcoded/seed dari Google Sheet.

Screen:

- Senarai subjek.
- Senarai kelas.
- Senarai murid.
- Import murid dari CSV boleh jadi Fasa 2 jika perlu.

### 5.3 Tambah Evidence

Form field:

```text
Subjek
Kelas
Murid / beberapa murid
Tajuk aktiviti
Catatan
Jenis evidence: Gambar / Video
```

Butang:

```text
[Ambil Gambar]
[Rakam Video]
[Upload Fail] optional fallback
```

### 5.4 Kamera Gambar

Flow:

1. Request camera permission.
2. Preview kamera.
3. User tekan snap.
4. Convert frame ke canvas.
5. Compress sehingga ≤ 500KB.
6. Tunjuk preview + saiz akhir.
7. User tekan simpan.

### 5.5 Rakaman Video

Flow:

1. Request camera + microphone permission.
2. Set target constraints:
   - 480p/540p jika browser sokong.
   - FPS rendah jika boleh.
3. Start MediaRecorder.
4. Timer besar `00:00 / 01:30`.
5. Auto stop pada 90 saat.
6. Preview video.
7. Papar saiz video.
8. Jika ≤ 10MB, benarkan simpan.
9. Jika > 10MB, minta rakam semula atau cuba quality lebih rendah.

### 5.6 Galeri Evidence

Filter:

```text
Subjek
Kelas
Murid
Jenis
Tarikh dari/hingga
Search aktiviti/catatan
```

Paparan kad:

```text
Thumbnail / ikon video
Nama murid
Subjek + kelas
Tajuk aktiviti
Tarikh
Saiz fail
[View/Play]
[Edit]
```

### 5.7 Evidence Detail

Paparan:

- Media viewer.
- Metadata lengkap.
- Senarai murid yang ditag.
- Catatan guru.
- Link Drive jika perlu.

---

## 6. Task Implementation Detail

### Task 1: Create project scaffold

**Objective:** Sediakan projek React/Vite/TypeScript untuk frontend evidence app.

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

**Steps:**

1. Create Vite React TypeScript app.
2. Install dependencies minimum.
3. Pastikan app boleh run local.
4. Commit scaffold.

**Verification:**

```bash
npm install
npm run dev
npm run build
```

Expected:

```text
build completed without TypeScript errors
```

---

### Task 2: Define TypeScript domain models

**Objective:** Wujudkan type model untuk Subject, Class, Student dan Evidence.

**Files:**

- Create: `src/types/domain.ts`

**Code shape:**

```ts
export type EvidenceType = 'image' | 'video';

export interface Subject {
  subject_id: string;
  subject_name: string;
  year_level: string;
  active: boolean;
}

export interface ClassGroup {
  class_id: string;
  class_name: string;
  year_level: string;
  active: boolean;
}

export interface Student {
  student_id: string;
  student_name: string;
  class_id: string;
  active: boolean;
}

export interface EvidenceItem {
  evidence_id: string;
  created_at: string;
  subject_id: string;
  class_id: string;
  student_ids: string[];
  activity_title: string;
  notes: string;
  evidence_type: EvidenceType;
  file_name: string;
  file_id: string;
  file_url: string;
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
  status: 'active' | 'archived';
  created_by?: string;
}
```

**Verification:**

```bash
npm run build
```

---

### Task 3: Add seed data for subjects/classes/students

**Objective:** Bina data sementara supaya UI boleh dibangunkan sebelum Google Sheet siap.

**Files:**

- Create: `src/data/seed.ts`

**Include:**

- Subject list ikut requirement user.
- Placeholder kelas.
- Placeholder murid 5–10 orang setiap kelas untuk demo.

**Verification:**

- App boleh paparkan subjek/kelas/murid dari seed data.

---

### Task 4: Build base layout and navigation

**Objective:** Bina layout mesra touch/smartboard/mobile.

**Files:**

- Modify: `src/App.tsx`
- Create: `src/components/Layout.tsx`
- Create: `src/components/NavTabs.tsx`
- Modify: `src/styles.css`

**Navigation tabs:**

```text
Dashboard
Tambah Evidence
Galeri
Tetapan
```

**UI requirements:**

- Button besar.
- Font jelas.
- Mobile/tablet friendly.
- Jangan terlalu padat.

**Verification:**

- Manual browser check.
- `npm run build` pass.

---

### Task 5: Build Dashboard screen

**Objective:** Paparkan shortcut subjek/kelas dan evidence ringkas.

**Files:**

- Create: `src/screens/Dashboard.tsx`

**Features:**

- Kad subjek.
- Bilangan kelas.
- Butang `Tambah Evidence`.
- Placeholder statistik.

**Verification:**

- Semua subjek yang user sebut muncul.

---

### Task 6: Build Evidence form state

**Objective:** Bina form pilih subjek, kelas, murid, tajuk aktiviti dan catatan.

**Files:**

- Create: `src/screens/AddEvidence.tsx`
- Create: `src/components/EvidenceForm.tsx`

**Rules:**

- Pilih subjek dahulu.
- Kelas difilter berdasarkan tahun jika perlu.
- Murid difilter ikut kelas.
- Boleh pilih beberapa murid.
- Tajuk aktiviti wajib.

**Verification:**

- User tidak boleh simpan jika belum pilih subjek/kelas/murid/tajuk.

---

### Task 7: Implement image capture and compression

**Objective:** Ambil gambar dari kamera dan compress sehingga ≤ 500KB.

**Files:**

- Create: `src/media/camera.ts`
- Create: `src/media/imageCompression.ts`
- Create: `src/components/ImageCapture.tsx`

**Algorithm:**

1. Get camera stream.
2. Draw video frame to canvas.
3. Resize max width 1280px.
4. Export JPEG/WebP quality 0.75.
5. Jika > 500KB, ulang dengan quality lebih rendah.
6. Stop pada quality minimum 0.45.
7. Jika masih > 500KB, resize lagi ke 1024px/900px.

**Constants:**

```ts
export const MAX_IMAGE_BYTES = 500 * 1024;
export const IMAGE_MAX_WIDTH = 1280;
export const IMAGE_MIN_QUALITY = 0.45;
```

**Verification:**

- Snap gambar.
- UI tunjuk final size.
- Reject/try recompress jika > 500KB.

---

### Task 8: Implement video recorder with 90s auto-stop

**Objective:** Rakam video dalam web app dengan had 90 saat.

**Files:**

- Create: `src/media/videoRecorder.ts`
- Create: `src/components/VideoRecorder.tsx`

**Constants:**

```ts
export const MAX_VIDEO_SECONDS = 90;
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;
export const TARGET_VIDEO_BYTES = 8 * 1024 * 1024;
```

**Media constraints:**

```ts
{
  video: {
    width: { ideal: 854 },
    height: { ideal: 480 },
    frameRate: { ideal: 15, max: 24 }
  },
  audio: true
}
```

**MediaRecorder options:**

Try in order:

```ts
video/webm;codecs=vp9,opus
video/webm;codecs=vp8,opus
video/webm
```

Suggested bitrate:

```ts
videoBitsPerSecond: 700_000,
audioBitsPerSecond: 64_000
```

**Rules:**

- Timer visible.
- Auto stop at 90s.
- Show file size.
- If > 10MB, block upload and show message:
  `Video melebihi 10MB. Sila rakam semula dengan durasi lebih pendek atau cahaya lebih baik.`

**Verification:**

- Record 5–10 seconds.
- Auto preview works.
- File size shown.
- `npm run build` pass.

---

### Task 9: Build media preview step

**Objective:** Guru boleh lihat gambar/video sebelum simpan.

**Files:**

- Create: `src/components/MediaPreview.tsx`

**Features:**

- Image preview.
- Video preview with controls.
- Show file size.
- Buttons:
  - `Simpan Evidence`
  - `Ambil Semula`
  - `Padam`

**Verification:**

- No autoplay.
- Video only plays when user clicks.

---

### Task 10: Implement API client for Apps Script

**Objective:** Frontend boleh berkomunikasi dengan Apps Script endpoint.

**Files:**

- Create: `src/api/appsScriptClient.ts`
- Create: `.env.example`

**Env:**

```text
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
```

**Functions:**

```ts
getBootstrapData()
listEvidence(filters)
uploadEvidence(metadata, file)
```

**Verification:**

- Mock call works in dev if endpoint missing.
- Real endpoint boleh ditambah kemudian.

---

### Task 11: Create Google Apps Script backend

**Objective:** Bina backend Apps Script untuk Drive + Sheets.

**Files:**

- Create: `apps-script/Code.gs`
- Create: `apps-script/README.md`

**Functions:**

```js
function doPost(e) {}
function handleGetBootstrapData(payload) {}
function handleListEvidence(payload) {}
function handleUploadEvidence(payload) {}
function getOrCreateFolder(parent, name) {}
function appendEvidenceRow(metadata) {}
function jsonResponse(data) {}
```

**Properties:**

Apps Script Properties:

```text
ROOT_FOLDER_ID
SPREADSHEET_ID
```

**Validation:**

- Reject missing subject/class/student/activity.
- Reject image > 500KB if frontend failed.
- Reject video > 10MB.
- Reject video duration > 90s.

**Verification:**

- Deploy as Web App.
- Test POST with small base64 file.
- Confirm file appears in Drive.
- Confirm row appears in Sheet.

---

### Task 12: Connect frontend upload to backend

**Objective:** Selepas preview, upload fail sebenar ke Apps Script.

**Files:**

- Modify: `src/screens/AddEvidence.tsx`
- Modify: `src/api/appsScriptClient.ts`

**Flow:**

1. Validate form.
2. Convert Blob to base64.
3. Send metadata + file.
4. Show progress/loading.
5. On success, show success message and reset form.

**Verification:**

- Upload gambar test.
- Upload video pendek test.
- Evidence muncul di Google Sheet.

---

### Task 13: Build Gallery screen

**Objective:** Paparkan senarai evidence dengan filter.

**Files:**

- Create: `src/screens/Gallery.tsx`
- Create: `src/components/EvidenceCard.tsx`
- Create: `src/components/EvidenceFilters.tsx`

**Features:**

- Filter subject/class/student/type/date.
- Page size 20.
- Lazy load/pagination.
- Card evidence dengan View/Play.

**Verification:**

- Jangan load semua evidence sekali gus.
- Filter berjalan dengan seed data atau backend data.

---

### Task 14: Build Evidence detail viewer

**Objective:** Paparkan media dan metadata lengkap.

**Files:**

- Create: `src/screens/EvidenceDetail.tsx`

**Features:**

- Gambar besar atau video player.
- Metadata.
- Catatan.
- Link Drive.
- Senarai murid.

**Verification:**

- Video boleh play bila tekan.
- Tiada autoplay.

---

### Task 15: Add settings/import placeholder

**Objective:** Sediakan screen tetapan untuk data subjek/kelas/murid.

**Files:**

- Create: `src/screens/Settings.tsx`

**MVP:**

- Papar arahan format CSV murid.
- Papar konfigurasi endpoint Apps Script.
- Papar limit media.

**Future:**

- Import CSV ke Google Sheet.

---

### Task 16: Add deployment documentation

**Objective:** Dokumentasi setup Google Drive/Sheets/Apps Script/Vercel.

**Files:**

- Create: `DEPLOY.md`
- Update: `README.md`

**Include:**

1. Cara buat Google Drive root folder.
2. Cara buat Google Sheet dengan tabs betul.
3. Cara paste Apps Script.
4. Cara set Properties `ROOT_FOLDER_ID` dan `SPREADSHEET_ID`.
5. Cara deploy Apps Script Web App.
6. Cara set env `VITE_APPS_SCRIPT_URL` di Vercel.
7. Cara deploy Vercel.

---

### Task 17: Test and validation pass

**Objective:** Pastikan app benar-benar boleh digunakan.

**Manual test checklist:**

- [ ] Buka app local.
- [ ] Pilih subjek.
- [ ] Pilih kelas.
- [ ] Pilih murid.
- [ ] Snap gambar.
- [ ] Confirm gambar ≤ 500KB.
- [ ] Simpan gambar.
- [ ] Confirm fail masuk Drive.
- [ ] Confirm row masuk Sheet.
- [ ] Rakam video 10 saat.
- [ ] Confirm video boleh preview.
- [ ] Confirm video ≤ 10MB.
- [ ] Simpan video.
- [ ] Confirm video boleh play dari galeri.
- [ ] Filter galeri ikut subjek/kelas/murid.
- [ ] Run production build.

**Commands:**

```bash
npm run build
```

Expected:

```text
build success
```

---

## 7. Risks and Mitigations

### Risk 1: Apps Script POST size limit

Apps Script URL Fetch/POST limits sekitar puluhan MB. Dengan video maksimum 10MB, sepatutnya selamat. Tetap reject video > 10MB di frontend dan backend.

### Risk 2: Browser support MediaRecorder berbeza

Mitigation:

- Try MIME types mengikut support.
- Sediakan fallback upload fail.
- Test Chrome/Edge dahulu.

### Risk 3: Video masih lebih 10MB walaupun 90s

Mitigation:

- Target constraints 480p.
- Bitrate sekitar 700kbps video + 64kbps audio.
- Papar saiz selepas rakam.
- Jika lebih 10MB, minta rakam semula.

### Risk 4: Google Drive preview lambat proses video

Mitigation:

- App boleh play Blob preview sebelum upload.
- Selepas upload, Drive mungkin ambil masa untuk preview.
- Simpan link dan metadata dahulu.

### Risk 5: Google Sheets perlahan bila data terlalu banyak

Mitigation:

- Pagination limit 20.
- Filter di Apps Script.
- Jika evidence terlalu banyak, migrasi metadata ke Supabase kemudian.

---

## 8. Future Enhancements

Selepas MVP stabil:

1. Export laporan PDF ikut murid.
2. Import murid dari CSV/Excel.
3. Google Login.
4. Role guru/admin.
5. Offline draft jika internet sekolah perlahan.
6. Auto thumbnail video.
7. Supabase untuk metadata/auth jika Google Sheets perlahan.
8. Tag TP/SP untuk pentaksiran lebih formal.
9. Bulk download/report untuk audit evidens.

---

## 9. Definition of Done MVP

MVP dianggap siap bila:

- Guru boleh buka app dari Vercel.
- Guru boleh pilih subjek/kelas/murid.
- Guru boleh snap gambar dan gambar dikompres ≤ 500KB.
- Guru boleh rakam video maksimum 90 saat.
- Video yang diterima app ≤ 10MB.
- Evidence boleh disimpan ke Google Drive.
- Metadata evidence masuk Google Sheets.
- Evidence boleh dilihat semula dalam galeri.
- Video/gambar boleh preview/play dari web app.
- App tidak load semua media sekali gus.
- Dokumentasi deploy lengkap.
