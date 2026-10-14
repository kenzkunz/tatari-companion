# Cozy Farm support directory

The public directory uses Drafter UI controls and the shared 1280px page layout. Six fruit filters use existing Cozy Farm icons; Tatari playerheads are mapped by exact support name from the roster, without loading the full roster at runtime. All fruits shows every approved, non-exhausted listing.

Row order: Tatari playerhead, fruit, bonus percentage, Working, Not Working, Exhausted, Connect. Only Connect uses orange. Connect reveals/copies the UID using the existing authenticated RPC, then enables feedback. Revealed UIDs are held in memory only and cleared at a new 12-hour cycle or session change. The existing three-exhaustion threshold remains.

Submit UID opens the reviewed-submission form in a modal. UID ownership/permission consent remains required. No submission is published automatically. The modal omits submission history. It labels the identifier Farm UID, clamps entered bonuses to 0–263, and uses the Cozy Farm guide crop images in its custom fruit picker. Signed-out users retain the existing login gate.

Migration 018 adds a distinct not_working report and count while preserving authentication, reveal-before-report, round boundaries and listing moderation. Applied successfully through the Supabase editor on 15 October 2026.

Verification: build/root and subpath route checks, shared chrome, admin editor/UID consent checks, desktop/mobile rendering, fruit filters, connect/report flow and submission modal with mocked account/RPC fixtures. No real support UID, listing or feedback was created during UI testing. Live writes still need testing against a user-selected listing.
