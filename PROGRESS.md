# Progress

## Completed

- [x] Task 1 Scaffold
- [x] Task 2 Types
- [x] Task 3 Seed Data
- [x] Task 4 Layout

## Current

Task 5 - Dashboard

## Blockers

None

## Next

Task 6 - Evidence Form

## Latest Verification

- Task 1 Scaffold verified on 2026-07-05.
- `npm install` passed.
- `npm run build` passed.
- `npm run lint` passed after adding `eslint.config.js`.
- Task 2 Types verified on 2026-07-05.
- Created `src/types/domain.ts` with Subject, ClassGroup, Student, EvidenceItem, upload payload, and bootstrap data types.
- `npm run build` passed.
- `npm run lint` passed.
- Task 3 Seed Data verified on 2026-07-05.
- Created `src/data/seed.ts` with 5 subjects, 9 classes, subject-class links, and 6 demo students per class.
- Browser/manual Playwright check confirmed all subjects and mapped classes render from seed data.
- `npm run build` passed.
- `npm run lint` passed.
- Task 4 Layout verified on 2026-07-05.
- Created `src/components/Layout.tsx`, `src/components/NavTabs.tsx`, and `src/navigation/tabs.ts`.
- Updated `src/App.tsx` for tab state and layout shell.
- Updated `src/styles.css` for touch-friendly responsive navigation and layout.
- Browser/manual Playwright check confirmed header, 4 navigation tabs, and dashboard content render.
- `npm run build` passed.
- `npm run lint` passed.

## Update Rules

After every completed task:

1. Run `npm run build`.
2. Fix any build errors.
3. Update `TASKS.md` checkbox.
4. Update this `PROGRESS.md` file:
   - Move current task to Completed.
   - Set Current to next incomplete task.
   - Set Next to the following task.
   - Record verification result.
5. Do not mark a task complete until build passes.
