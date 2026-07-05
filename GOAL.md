# Goal

Build a production-ready MVP for an Evidence Pentaksiran Web App.

## Success Criteria

- All 17 implementation tasks completed.
- TypeScript build passes.
- No lint errors.
- Media upload works.
- Google Drive integration works.
- Google Sheets metadata works.
- Gallery can list uploaded evidence.
- Deployable to Vercel.

## Product Scope

Build a web app for teachers to store pentaksiran evidence as compressed photos and short videos.

Core requirements:

- Photos must be compressed to 500KB or below.
- Videos must be recorded directly in the web app.
- Videos must stop automatically at 1 minute 30 seconds / 90 seconds.
- Videos should target 7–10MB, with 10MB as the hard limit.
- Evidence must be linked to subject, class, student(s), activity title, notes, and date.
- Uploaded media must be stored in Google Drive.
- Evidence metadata must be stored in Google Sheets.
- Gallery must allow viewing/playback of uploaded evidence.

## MVP Stack

- Frontend: React + Vite + TypeScript
- Hosting: Vercel
- Backend bridge: Google Apps Script Web App
- File storage: Google Drive
- Metadata storage: Google Sheets
- Media handling: Browser camera APIs, MediaRecorder, Canvas compression
