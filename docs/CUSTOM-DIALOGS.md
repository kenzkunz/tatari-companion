# Shared custom dialogs

Approved drafter-style shell: cream body, orange header, 44px close button, named orange actions, secondary cancellation, red permanent deletion, and stacked mobile sizing. `site-dialogs.mjs` loads its scoped stylesheet automatically, including in the separate admin workspace.

Use `await confirmDialog(message, {title, action, danger})` before mutations; cancellation returns false. `await promptDialog(message, {title, label, value, placeholder, action, maxLength})` returns text or null. `alertDialog(message, {title, action})` provides informational messages. All caller text is rendered as text, never HTML. Native browser security/permission dialogs remain browser-controlled.

Dialogs are queued, use the native dialog top layer, prevent backdrop dismissal, support Escape and X, trap Tab/Shift+Tab, and restore focus when the opener remains connected. Confirmations initially focus Cancel; input dialogs focus/select the input. Admin link editing saves/restores its selection around the asynchronous prompt. Existing inline statuses/errors are preserved.

`notify(message)` shows a non-blocking success toast for UID/image copying. It has a dismiss button and expires after six seconds, pausing while hovered or focused. It does not move focus. Autosaves continue using existing status text to avoid repeated toasts.

Replaced all first-party native confirm/prompt call sites found in drafter mode changes/clearing/publishing, tierlist reset, formation/tierlist deletion/unpublishing, admin UID purging, admin data discard/reset/restore, and admin rich-text link insertion. No native alert call sites existed. Existing feature modals remain intact.

Validation: full site checks at root and repository subpath, source syntax, text injection handling, dialog queuing, cancel/Escape/accept, keyboard focus, admin link selection using an unauthenticated local fixture, and mobile layout. Private admin mutations were not executed against Supabase. Browser checks are Chromium; physical mobile Safari is not certified.

Nested publish confirmations leave Share open on cancel or failure; Share closes only after a successful publish result. Cancellation was verified without server writes.
