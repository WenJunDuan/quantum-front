# Active Context
## Focus: Path A - Fix AlertDialog cancel close
## Recent:
- Notifications/confirmations: `vue-sonner` (`toast.*` + `<Toaster />`) + `AlertDialog` (no custom host/store).
- Token persistence: removed `quantum:user`/`quantum:tabs` localStorage; tokens now stored in IndexedDB via `src/utils/secure-token-storage.ts`.
- Fixed shadcn `AlertDialog*` wrappers: removed duplicate `v-bind` and normalized `inheritAttrs` forwarding.
- Fixed delete confirm `Cancel` not closing: `UiAlertDialog` now forwards `onUpdate:open` via merged `v-bind`.
## Next:
- Verify delete confirm: clicking `取消` closes dialog (dept/menu/dict/user).
## Notes:
- Canonical logs live in `project_document/.ai_state/active_context.md`.
