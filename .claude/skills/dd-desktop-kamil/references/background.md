# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing

- **The edge-tab drawers are shared.** The dd-iphone-duo-kamil add-on uses the same `#tabNav`, `#tabSum` and `#drawerBg` for the side cards when the open Duo frame leaves no room for them, and installs this add-on if it is missing. Keep those ids when changing anything here.

- **Add-on, not a fork.** The shell stays phone-only; this skill only listens to `<prefix>:show` (fired before each page loads) and uses `window.Shell` (`el`, `frame`, `fit`, `groupOf`, `current`). It sets `.is-desktop` / `.is-fullwindow` / `.is-drawers` on the shell, which the shell's `fit()` respects.
- **One iframe.** Desktop and phone pages share the shell's iframe; the add-on restyles its container, so there is no reload and dev mode keeps working (the inspector, Sections and exports run on admin pages too).
- **Full-height panels are solid** (no blur), so the admin behind a drawer never bleeds through.
- **Content width is the page's job.** The shell only provides `--content-max`; a page that ignores it stays full width, which is why `--check` warns about it.
