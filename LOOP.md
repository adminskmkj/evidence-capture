# Autonomous Loop

```text
/goal Read GOAL.md and complete all tasks in TASKS.md according to PLAN.md, RULES.md and VERIFY.md. Update PROGRESS.md after every task. Stop only when all tasks are complete and verification passes.

/loop until: all tasks in TASKS.md are complete and npm run build passes
```

## Objective

Complete all tasks in `TASKS.md`.

## Workflow

1. Read `GOAL.md`.
2. Read `RULES.md`.
3. Read `VERIFY.md`.
4. Read `TASKS.md`.
5. Read `PROGRESS.md`.
6. Pick the first incomplete task in `TASKS.md`.
7. Implement only that task.
8. Run:

```bash
npm run build
```

9. If build fails:
   - Read the error.
   - Fix the error.
   - Retry `npm run build`.

10. If build succeeds:
   - Update `TASKS.md` and mark the task complete.
   - Update `PROGRESS.md`.
   - Record verification notes.

11. Continue until all tasks are complete.

## Stop When

- All tasks complete.
- Definition of Done in `VERIFY.md` is satisfied.

## Never Skip

- Build verification.
- Progress update.
- Task checkbox update.
- Manual browser test for frontend features.
- Apps Script POST test for backend/upload features.
