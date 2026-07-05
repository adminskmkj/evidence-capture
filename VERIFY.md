# Verification

Every task must pass:

```bash
npm run build
```

## General Verification

- TypeScript build passes.
- No lint errors if lint script exists.
- Existing features still work.
- `TASKS.md` and `PROGRESS.md` are updated after build succeeds.

## Feature Verification

If feature related, perform manual browser test.

Manual checks may include:

- App loads in browser.
- Navigation works.
- Forms validate required fields.
- Buttons are usable on touch/smartboard style layout.
- Media preview works.
- Video does not autoplay.

## Media Verification

### Image

- Camera opens.
- Snap works.
- Image preview appears.
- Final image size is <= 500KB.
- Retake works.

### Video

- Camera and microphone permission requested.
- Recording starts.
- Timer is visible.
- Recording auto-stops at 90 seconds.
- Preview video can be played manually.
- Final video size is <= 10MB.
- If video exceeds 10MB, upload is blocked.

## Backend Verification

If backend related, perform Apps Script POST test.

Confirm:

- Apps Script endpoint accepts POST.
- File is created in Google Drive.
- Metadata row is appended in Google Sheets.
- API returns JSON response.
- Frontend can list uploaded evidence.

## Final Definition of Done

Before finishing the MVP:

- [ ] All 17 implementation tasks complete.
- [ ] `npm run build` passes.
- [ ] No lint errors.
- [ ] Media upload works.
- [ ] Google Drive integration works.
- [ ] Google Sheets metadata works.
- [ ] Gallery can list uploaded evidence.
- [ ] App is deployable to Vercel.
