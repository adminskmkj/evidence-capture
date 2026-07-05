# Evidence Pentaksiran — Apps Script Backend

## Deployment (satu kali sahaja)

1. Pergi ke https://script.google.com/
2. Buat project baru. Namakan `EvidencePentaksiran`.
3. Gantikan isi `Code.gs` dengan kod dari `apps-script/Code.gs`.
4. Dokumen rujukan `ROOT_FOLDER_ID` dan `SPREADSHEET_ID` ada dalam fail ini.

---

## Setup Properties

Pergi ke **File → Project Properties → Script Properties**.

Tambah 2 baris:

```text
ROOT_FOLDER_ID   = <ID folder root Google Drive>
SPREADSHEET_ID   = <ID Google Sheet EvidenceDB>
```

---

## Cara dapat ID

### ROOT_FOLDER_ID

1. Buka Google Drive.
2. Cipta folder bernama `Evidence Pentaksiran` di root Drive.
3. Buka folder, lihat URL browser: `https://drive.google.com/drive/folders/<ID>`
4. Salin `<ID>` dan letak sebagai `ROOT_FOLDER_ID`.

### SPREADSHEET_ID

1. Buka Google Sheets.
2. Cipta spreadsheet bernama `EvidenceDB`.
3. Tambah 5 tab/sheet: `Settings`, `Subjects`, `Classes`, `Students`, `Evidence`.
4. Baris pertama setiap tab = nama kolum. Contoh untuk `Evidence`:

```text
evidence_id | created_at | subject_id | class_id | student_ids | activity_title | notes | evidence_type | file_name | file_id | file_url | thumbnail_file_id | thumbnail_url | mime_type | file_size_bytes | duration_seconds | status | created_by
```

5. Salin ID dari URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`

---

## Deploy Web App

1. Klik **Deploy → New Deployment**.
2. Pilih **Web App**.
3. Config:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik Deploy.
5. Salin URL deployment yang diberi.
6. Letak URL ini dalam `.env` atau Vercel environment variable `VITE_APPS_SCRIPT_URL`.

---

## Test

Hantar POST ke URL deployment:

```json
{
  "action": "getBootstrapData"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "subjects": [],
    "classes": [],
    "students": []
  }
}
```
